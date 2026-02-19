import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("ConfidentialLending", function () {
  let lending: any;
  let lendingAddress: string;
  let owner: any;
  let alice: any;
  let bob: any;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ConfidentialLending");
    lending = await Factory.deploy();
    await lending.waitForDeployment();
    lendingAddress = await lending.getAddress();
  });

  it("should deploy and set the owner", async function () {
    expect(await lending.owner()).to.equal(owner.address);
  });

  it("should deposit encrypted collateral", async function () {
    const enc = await fhevm
      .createEncryptedInput(lendingAddress, alice.address)
      .add64(10000)
      .encrypt();
    await (await lending.connect(alice).deposit(enc.handles[0], enc.inputProof)).wait();

    expect(await lending.isUserInitialized(alice.address)).to.equal(true);

    const handle = await lending.connect(alice).getCollateral();
    const collateral = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      handle,
      lendingAddress,
      alice,
    );
    expect(collateral).to.equal(10000n);
  });

  it("should borrow within the 50% LTV limit", async function () {
    // Deposit 10000 collateral
    const encDeposit = await fhevm
      .createEncryptedInput(lendingAddress, alice.address)
      .add64(10000)
      .encrypt();
    await (
      await lending.connect(alice).deposit(encDeposit.handles[0], encDeposit.inputProof)
    ).wait();

    // Borrow 5000 (exactly 50% of 10000)
    const encBorrow = await fhevm
      .createEncryptedInput(lendingAddress, alice.address)
      .add64(5000)
      .encrypt();
    await (await lending.connect(alice).borrow(encBorrow.handles[0], encBorrow.inputProof)).wait();

    const handle = await lending.connect(alice).getBorrowBalance();
    const borrowBalance = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      handle,
      lendingAddress,
      alice,
    );
    expect(borrowBalance).to.equal(5000n);
  });

  it("should silently fail when borrowing over the 50% LTV limit", async function () {
    // Deposit 10000 collateral
    const encDeposit = await fhevm
      .createEncryptedInput(lendingAddress, alice.address)
      .add64(10000)
      .encrypt();
    await (
      await lending.connect(alice).deposit(encDeposit.handles[0], encDeposit.inputProof)
    ).wait();

    // Try to borrow 6000 (60% of 10000 — exceeds 50% LTV)
    const encBorrow = await fhevm
      .createEncryptedInput(lendingAddress, alice.address)
      .add64(6000)
      .encrypt();
    await (await lending.connect(alice).borrow(encBorrow.handles[0], encBorrow.inputProof)).wait();

    // Borrow balance should remain 0 (borrow silently failed)
    const handle = await lending.connect(alice).getBorrowBalance();
    const borrowBalance = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      handle,
      lendingAddress,
      alice,
    );
    expect(borrowBalance).to.equal(0n);
  });

  it("should repay partial borrow", async function () {
    // Deposit 10000 and borrow 4000
    const encDeposit = await fhevm
      .createEncryptedInput(lendingAddress, alice.address)
      .add64(10000)
      .encrypt();
    await (
      await lending.connect(alice).deposit(encDeposit.handles[0], encDeposit.inputProof)
    ).wait();

    const encBorrow = await fhevm
      .createEncryptedInput(lendingAddress, alice.address)
      .add64(4000)
      .encrypt();
    await (await lending.connect(alice).borrow(encBorrow.handles[0], encBorrow.inputProof)).wait();

    // Repay 1500
    const encRepay = await fhevm
      .createEncryptedInput(lendingAddress, alice.address)
      .add64(1500)
      .encrypt();
    await (await lending.connect(alice).repay(encRepay.handles[0], encRepay.inputProof)).wait();

    const handle = await lending.connect(alice).getBorrowBalance();
    const borrowBalance = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      handle,
      lendingAddress,
      alice,
    );
    expect(borrowBalance).to.equal(2500n);
  });

  it("should repay full borrow (capped to balance)", async function () {
    // Deposit 10000 and borrow 3000
    const encDeposit = await fhevm
      .createEncryptedInput(lendingAddress, alice.address)
      .add64(10000)
      .encrypt();
    await (
      await lending.connect(alice).deposit(encDeposit.handles[0], encDeposit.inputProof)
    ).wait();

    const encBorrow = await fhevm
      .createEncryptedInput(lendingAddress, alice.address)
      .add64(3000)
      .encrypt();
    await (await lending.connect(alice).borrow(encBorrow.handles[0], encBorrow.inputProof)).wait();

    // Repay 9999 (more than owed — should cap at 3000)
    const encRepay = await fhevm
      .createEncryptedInput(lendingAddress, alice.address)
      .add64(9999)
      .encrypt();
    await (await lending.connect(alice).repay(encRepay.handles[0], encRepay.inputProof)).wait();

    const handle = await lending.connect(alice).getBorrowBalance();
    const borrowBalance = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      handle,
      lendingAddress,
      alice,
    );
    expect(borrowBalance).to.equal(0n);
  });

  it("should accrue 10% interest on borrow balance", async function () {
    // Deposit 20000 and borrow 5000
    const encDeposit = await fhevm
      .createEncryptedInput(lendingAddress, alice.address)
      .add64(20000)
      .encrypt();
    await (
      await lending.connect(alice).deposit(encDeposit.handles[0], encDeposit.inputProof)
    ).wait();

    const encBorrow = await fhevm
      .createEncryptedInput(lendingAddress, alice.address)
      .add64(5000)
      .encrypt();
    await (await lending.connect(alice).borrow(encBorrow.handles[0], encBorrow.inputProof)).wait();

    // Accrue interest once: 5000 + 5000/10 = 5000 + 500 = 5500
    await (await lending.accrueInterest(alice.address)).wait();

    const handle = await lending.connect(alice).getBorrowBalance();
    const borrowBalance = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      handle,
      lendingAddress,
      alice,
    );
    expect(borrowBalance).to.equal(5500n);
  });

  it("should withdraw collateral when sufficient collateral remains", async function () {
    // Deposit 10000, borrow 2000 (needs at least 4000 collateral to maintain LTV)
    const encDeposit = await fhevm
      .createEncryptedInput(lendingAddress, alice.address)
      .add64(10000)
      .encrypt();
    await (
      await lending.connect(alice).deposit(encDeposit.handles[0], encDeposit.inputProof)
    ).wait();

    const encBorrow = await fhevm
      .createEncryptedInput(lendingAddress, alice.address)
      .add64(2000)
      .encrypt();
    await (await lending.connect(alice).borrow(encBorrow.handles[0], encBorrow.inputProof)).wait();

    // Withdraw 5000 (remaining 5000 >= 2 * 2000 = 4000, so it is safe)
    const encWithdraw = await fhevm
      .createEncryptedInput(lendingAddress, alice.address)
      .add64(5000)
      .encrypt();
    await (
      await lending.connect(alice).withdraw(encWithdraw.handles[0], encWithdraw.inputProof)
    ).wait();

    const handle = await lending.connect(alice).getCollateral();
    const collateral = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      handle,
      lendingAddress,
      alice,
    );
    expect(collateral).to.equal(5000n);
  });

  it("should silently fail withdrawal when collateral would be insufficient", async function () {
    // Deposit 10000, borrow 4000 (needs at least 8000 collateral)
    const encDeposit = await fhevm
      .createEncryptedInput(lendingAddress, alice.address)
      .add64(10000)
      .encrypt();
    await (
      await lending.connect(alice).deposit(encDeposit.handles[0], encDeposit.inputProof)
    ).wait();

    const encBorrow = await fhevm
      .createEncryptedInput(lendingAddress, alice.address)
      .add64(4000)
      .encrypt();
    await (await lending.connect(alice).borrow(encBorrow.handles[0], encBorrow.inputProof)).wait();

    // Try to withdraw 5000 (remaining 5000 < 2 * 4000 = 8000, fails silently)
    const encWithdraw = await fhevm
      .createEncryptedInput(lendingAddress, alice.address)
      .add64(5000)
      .encrypt();
    await (
      await lending.connect(alice).withdraw(encWithdraw.handles[0], encWithdraw.inputProof)
    ).wait();

    // Collateral should remain 10000
    const handle = await lending.connect(alice).getCollateral();
    const collateral = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      handle,
      lendingAddress,
      alice,
    );
    expect(collateral).to.equal(10000n);
  });

  it("should isolate balances between multiple users", async function () {
    // Alice deposits 10000
    const encAlice = await fhevm
      .createEncryptedInput(lendingAddress, alice.address)
      .add64(10000)
      .encrypt();
    await (await lending.connect(alice).deposit(encAlice.handles[0], encAlice.inputProof)).wait();

    // Bob deposits 5000
    const encBob = await fhevm
      .createEncryptedInput(lendingAddress, bob.address)
      .add64(5000)
      .encrypt();
    await (await lending.connect(bob).deposit(encBob.handles[0], encBob.inputProof)).wait();

    // Check Alice's collateral is 10000
    const aliceHandle = await lending.connect(alice).getCollateral();
    const aliceCollateral = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      aliceHandle,
      lendingAddress,
      alice,
    );
    expect(aliceCollateral).to.equal(10000n);

    // Check Bob's collateral is 5000
    const bobHandle = await lending.connect(bob).getCollateral();
    const bobCollateral = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      bobHandle,
      lendingAddress,
      bob,
    );
    expect(bobCollateral).to.equal(5000n);
  });

  it("should only allow owner to accrue interest", async function () {
    try {
      await lending.connect(alice).accrueInterest(alice.address);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Not the owner");
    }
  });
});
