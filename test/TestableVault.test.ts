import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("TestableVault", function () {
  let vault: any;
  let vaultAddress: string;
  let owner: any;
  let alice: any;
  let bob: any;
  let charlie: any;

  beforeEach(async function () {
    [owner, alice, bob, charlie] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("TestableVault");
    vault = await Factory.deploy();
    await vault.waitForDeployment();
    vaultAddress = await vault.getAddress();
  });

  // ===========================================================
  // 1. Deployment Tests
  // ===========================================================

  describe("Deployment", function () {
    it("should set the deployer as owner", async function () {
      expect(await vault.owner()).to.equal(owner.address);
    });

    it("should initialize deposit count to zero", async function () {
      expect(await vault.depositCount()).to.equal(0n);
    });

    it("should initialize withdrawal count to zero", async function () {
      expect(await vault.withdrawalCount()).to.equal(0n);
    });

    it("should initialize withdrawal limit to max uint64", async function () {
      const handle = await vault.connect(owner).getWithdrawalLimit();
      const clear = await fhevm.userDecryptEuint(FhevmType.euint64, handle, vaultAddress, owner);
      // max uint64 = 2^64 - 1
      expect(clear).to.equal(18446744073709551615n);
    });
  });

  // ===========================================================
  // 2. Deposit Tests
  // ===========================================================

  describe("Deposits", function () {
    it("should deposit an encrypted amount and verify balance", async function () {
      const enc = await fhevm
        .createEncryptedInput(vaultAddress, alice.address)
        .add64(1000)
        .encrypt();
      await (await vault.connect(alice).deposit(enc.handles[0], enc.inputProof)).wait();

      const handle = await vault.connect(alice).getBalance();
      const clear = await fhevm.userDecryptEuint(FhevmType.euint64, handle, vaultAddress, alice);
      expect(clear).to.equal(1000n);
    });

    it("should emit Deposited event with correct index", async function () {
      const enc = await fhevm
        .createEncryptedInput(vaultAddress, alice.address)
        .add64(500)
        .encrypt();
      const tx = await vault.connect(alice).deposit(enc.handles[0], enc.inputProof);
      const receipt = await tx.wait();

      const event = receipt.logs.find((log: any) => log.fragment?.name === "Deposited");
      expect(event).to.not.be.undefined;
      expect(event.args[0]).to.equal(alice.address); // user
      expect(event.args[1]).to.equal(1n); // depositIndex
    });

    it("should increment deposit count", async function () {
      const enc = await fhevm
        .createEncryptedInput(vaultAddress, alice.address)
        .add64(100)
        .encrypt();
      await (await vault.connect(alice).deposit(enc.handles[0], enc.inputProof)).wait();

      expect(await vault.depositCount()).to.equal(1n);
    });

    it("should handle zero deposit without reverting", async function () {
      const enc = await fhevm.createEncryptedInput(vaultAddress, alice.address).add64(0).encrypt();
      await (await vault.connect(alice).deposit(enc.handles[0], enc.inputProof)).wait();

      const handle = await vault.connect(alice).getBalance();
      const clear = await fhevm.userDecryptEuint(FhevmType.euint64, handle, vaultAddress, alice);
      expect(clear).to.equal(0n);
    });

    it("should accumulate multiple deposits", async function () {
      const enc1 = await fhevm
        .createEncryptedInput(vaultAddress, alice.address)
        .add64(300)
        .encrypt();
      await (await vault.connect(alice).deposit(enc1.handles[0], enc1.inputProof)).wait();

      const enc2 = await fhevm
        .createEncryptedInput(vaultAddress, alice.address)
        .add64(700)
        .encrypt();
      await (await vault.connect(alice).deposit(enc2.handles[0], enc2.inputProof)).wait();

      const handle = await vault.connect(alice).getBalance();
      const clear = await fhevm.userDecryptEuint(FhevmType.euint64, handle, vaultAddress, alice);
      expect(clear).to.equal(1000n);
    });
  });

  // ===========================================================
  // 3. Multi-User Isolation Tests
  // ===========================================================

  describe("Multi-User Isolation", function () {
    it("should keep user balances independent", async function () {
      // Alice deposits 1000
      const encAlice = await fhevm
        .createEncryptedInput(vaultAddress, alice.address)
        .add64(1000)
        .encrypt();
      await (await vault.connect(alice).deposit(encAlice.handles[0], encAlice.inputProof)).wait();

      // Bob deposits 2000
      const encBob = await fhevm
        .createEncryptedInput(vaultAddress, bob.address)
        .add64(2000)
        .encrypt();
      await (await vault.connect(bob).deposit(encBob.handles[0], encBob.inputProof)).wait();

      // Verify Alice's balance
      const handleAlice = await vault.connect(alice).getBalance();
      const clearAlice = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        handleAlice,
        vaultAddress,
        alice,
      );
      expect(clearAlice).to.equal(1000n);

      // Verify Bob's balance
      const handleBob = await vault.connect(bob).getBalance();
      const clearBob = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        handleBob,
        vaultAddress,
        bob,
      );
      expect(clearBob).to.equal(2000n);
    });

    it("should track deposit count across all users", async function () {
      const enc1 = await fhevm
        .createEncryptedInput(vaultAddress, alice.address)
        .add64(100)
        .encrypt();
      await (await vault.connect(alice).deposit(enc1.handles[0], enc1.inputProof)).wait();

      const enc2 = await fhevm.createEncryptedInput(vaultAddress, bob.address).add64(200).encrypt();
      await (await vault.connect(bob).deposit(enc2.handles[0], enc2.inputProof)).wait();

      const enc3 = await fhevm
        .createEncryptedInput(vaultAddress, charlie.address)
        .add64(300)
        .encrypt();
      await (await vault.connect(charlie).deposit(enc3.handles[0], enc3.inputProof)).wait();

      expect(await vault.depositCount()).to.equal(3n);
    });
  });

  // ===========================================================
  // 4. Withdrawal Tests
  // ===========================================================

  describe("Withdrawals", function () {
    beforeEach(async function () {
      // Seed Alice with 1000
      const enc = await fhevm
        .createEncryptedInput(vaultAddress, alice.address)
        .add64(1000)
        .encrypt();
      await (await vault.connect(alice).deposit(enc.handles[0], enc.inputProof)).wait();
    });

    it("should withdraw less than balance", async function () {
      const encW = await fhevm
        .createEncryptedInput(vaultAddress, alice.address)
        .add64(400)
        .encrypt();
      await (await vault.connect(alice).withdraw(encW.handles[0], encW.inputProof)).wait();

      const handle = await vault.connect(alice).getBalance();
      const clear = await fhevm.userDecryptEuint(FhevmType.euint64, handle, vaultAddress, alice);
      expect(clear).to.equal(600n);
    });

    it("should withdraw exact balance", async function () {
      const encW = await fhevm
        .createEncryptedInput(vaultAddress, alice.address)
        .add64(1000)
        .encrypt();
      await (await vault.connect(alice).withdraw(encW.handles[0], encW.inputProof)).wait();

      const handle = await vault.connect(alice).getBalance();
      const clear = await fhevm.userDecryptEuint(FhevmType.euint64, handle, vaultAddress, alice);
      expect(clear).to.equal(0n);
    });

    it("should silently withdraw 0 when amount exceeds balance (no revert)", async function () {
      // Try to withdraw 9999 with only 1000 balance
      const encW = await fhevm
        .createEncryptedInput(vaultAddress, alice.address)
        .add64(9999)
        .encrypt();
      await (await vault.connect(alice).withdraw(encW.handles[0], encW.inputProof)).wait();

      // Balance should remain 1000 -- the contract withdrew 0
      const handle = await vault.connect(alice).getBalance();
      const clear = await fhevm.userDecryptEuint(FhevmType.euint64, handle, vaultAddress, alice);
      expect(clear).to.equal(1000n);
    });

    it("should emit Withdrawn event with correct index", async function () {
      const encW = await fhevm
        .createEncryptedInput(vaultAddress, alice.address)
        .add64(100)
        .encrypt();
      const tx = await vault.connect(alice).withdraw(encW.handles[0], encW.inputProof);
      const receipt = await tx.wait();

      const event = receipt.logs.find((log: any) => log.fragment?.name === "Withdrawn");
      expect(event).to.not.be.undefined;
      expect(event.args[0]).to.equal(alice.address);
      expect(event.args[1]).to.equal(1n); // withdrawalIndex
    });

    it("should increment withdrawal count", async function () {
      const encW = await fhevm
        .createEncryptedInput(vaultAddress, alice.address)
        .add64(100)
        .encrypt();
      await (await vault.connect(alice).withdraw(encW.handles[0], encW.inputProof)).wait();

      expect(await vault.withdrawalCount()).to.equal(1n);
    });
  });

  // ===========================================================
  // 5. Withdrawal Limit Tests
  // ===========================================================

  describe("Withdrawal Limit", function () {
    beforeEach(async function () {
      // Seed Alice with 10000
      const enc = await fhevm
        .createEncryptedInput(vaultAddress, alice.address)
        .add64(10000)
        .encrypt();
      await (await vault.connect(alice).deposit(enc.handles[0], enc.inputProof)).wait();
    });

    it("should allow owner to set withdrawal limit", async function () {
      const encLimit = await fhevm
        .createEncryptedInput(vaultAddress, owner.address)
        .add64(500)
        .encrypt();
      const tx = await vault
        .connect(owner)
        .setWithdrawalLimit(encLimit.handles[0], encLimit.inputProof);
      const receipt = await tx.wait();

      const event = receipt.logs.find((log: any) => log.fragment?.name === "WithdrawalLimitSet");
      expect(event).to.not.be.undefined;
    });

    it("should enforce withdrawal limit (withdraw 0 when over limit)", async function () {
      // Set limit to 500
      const encLimit = await fhevm
        .createEncryptedInput(vaultAddress, owner.address)
        .add64(500)
        .encrypt();
      await (
        await vault.connect(owner).setWithdrawalLimit(encLimit.handles[0], encLimit.inputProof)
      ).wait();

      // Try to withdraw 1000 (exceeds 500 limit)
      const encW = await fhevm
        .createEncryptedInput(vaultAddress, alice.address)
        .add64(1000)
        .encrypt();
      await (await vault.connect(alice).withdraw(encW.handles[0], encW.inputProof)).wait();

      // Balance should be unchanged at 10000 (withdrew 0)
      const handle = await vault.connect(alice).getBalance();
      const clear = await fhevm.userDecryptEuint(FhevmType.euint64, handle, vaultAddress, alice);
      expect(clear).to.equal(10000n);
    });

    it("should allow withdrawal within limit", async function () {
      // Set limit to 500
      const encLimit = await fhevm
        .createEncryptedInput(vaultAddress, owner.address)
        .add64(500)
        .encrypt();
      await (
        await vault.connect(owner).setWithdrawalLimit(encLimit.handles[0], encLimit.inputProof)
      ).wait();

      // Withdraw 300 (within 500 limit)
      const encW = await fhevm
        .createEncryptedInput(vaultAddress, alice.address)
        .add64(300)
        .encrypt();
      await (await vault.connect(alice).withdraw(encW.handles[0], encW.inputProof)).wait();

      const handle = await vault.connect(alice).getBalance();
      const clear = await fhevm.userDecryptEuint(FhevmType.euint64, handle, vaultAddress, alice);
      expect(clear).to.equal(9700n);
    });

    it("should revert when non-owner sets withdrawal limit", async function () {
      const encLimit = await fhevm
        .createEncryptedInput(vaultAddress, alice.address)
        .add64(500)
        .encrypt();

      try {
        await vault.connect(alice).setWithdrawalLimit(encLimit.handles[0], encLimit.inputProof);
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("NotOwner");
      }
    });
  });

  // ===========================================================
  // 6. Owner-Only Functions
  // ===========================================================

  describe("Owner Functions", function () {
    it("should transfer ownership", async function () {
      await (await vault.connect(owner).transferOwnership(alice.address)).wait();
      expect(await vault.owner()).to.equal(alice.address);
    });

    it("should emit OwnershipTransferred event", async function () {
      const tx = await vault.connect(owner).transferOwnership(alice.address);
      const receipt = await tx.wait();

      const event = receipt.logs.find((log: any) => log.fragment?.name === "OwnershipTransferred");
      expect(event).to.not.be.undefined;
      expect(event.args[0]).to.equal(owner.address); // previous
      expect(event.args[1]).to.equal(alice.address); // new
    });

    it("should revert transferOwnership to zero address", async function () {
      try {
        await vault.connect(owner).transferOwnership(ethers.ZeroAddress);
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("ZeroAddressOwner");
      }
    });

    it("should revert transferOwnership from non-owner", async function () {
      try {
        await vault.connect(alice).transferOwnership(bob.address);
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("NotOwner");
      }
    });
  });

  // ===========================================================
  // 7. Sequential Operations (Stress Test)
  // ===========================================================

  describe("Sequential Operations", function () {
    it("should handle deposit + deposit + withdraw correctly", async function () {
      // Deposit 500
      const enc1 = await fhevm
        .createEncryptedInput(vaultAddress, alice.address)
        .add64(500)
        .encrypt();
      await (await vault.connect(alice).deposit(enc1.handles[0], enc1.inputProof)).wait();

      // Deposit 300
      const enc2 = await fhevm
        .createEncryptedInput(vaultAddress, alice.address)
        .add64(300)
        .encrypt();
      await (await vault.connect(alice).deposit(enc2.handles[0], enc2.inputProof)).wait();

      // Withdraw 200
      const encW = await fhevm
        .createEncryptedInput(vaultAddress, alice.address)
        .add64(200)
        .encrypt();
      await (await vault.connect(alice).withdraw(encW.handles[0], encW.inputProof)).wait();

      // Balance should be 500 + 300 - 200 = 600
      const handle = await vault.connect(alice).getBalance();
      const clear = await fhevm.userDecryptEuint(FhevmType.euint64, handle, vaultAddress, alice);
      expect(clear).to.equal(600n);
    });

    it("should handle multiple users with interleaved operations", async function () {
      // Alice deposits 1000
      const encA1 = await fhevm
        .createEncryptedInput(vaultAddress, alice.address)
        .add64(1000)
        .encrypt();
      await (await vault.connect(alice).deposit(encA1.handles[0], encA1.inputProof)).wait();

      // Bob deposits 2000
      const encB1 = await fhevm
        .createEncryptedInput(vaultAddress, bob.address)
        .add64(2000)
        .encrypt();
      await (await vault.connect(bob).deposit(encB1.handles[0], encB1.inputProof)).wait();

      // Alice withdraws 300
      const encAW = await fhevm
        .createEncryptedInput(vaultAddress, alice.address)
        .add64(300)
        .encrypt();
      await (await vault.connect(alice).withdraw(encAW.handles[0], encAW.inputProof)).wait();

      // Bob deposits 500 more
      const encB2 = await fhevm
        .createEncryptedInput(vaultAddress, bob.address)
        .add64(500)
        .encrypt();
      await (await vault.connect(bob).deposit(encB2.handles[0], encB2.inputProof)).wait();

      // Alice: 1000 - 300 = 700
      const handleAlice = await vault.connect(alice).getBalance();
      const clearAlice = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        handleAlice,
        vaultAddress,
        alice,
      );
      expect(clearAlice).to.equal(700n);

      // Bob: 2000 + 500 = 2500
      const handleBob = await vault.connect(bob).getBalance();
      const clearBob = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        handleBob,
        vaultAddress,
        bob,
      );
      expect(clearBob).to.equal(2500n);

      // Global counters: 3 deposits, 1 withdrawal
      expect(await vault.depositCount()).to.equal(3n);
      expect(await vault.withdrawalCount()).to.equal(1n);
    });

    it("should handle withdraw attempt on empty balance gracefully", async function () {
      // Bob has never deposited -- balance is uninitialized (encrypted 0)
      const encW = await fhevm.createEncryptedInput(vaultAddress, bob.address).add64(100).encrypt();

      // Should NOT revert -- withdraws 0 silently
      await (await vault.connect(bob).withdraw(encW.handles[0], encW.inputProof)).wait();

      // Withdrawal count still increments (the tx succeeded, just withdrew 0)
      expect(await vault.withdrawalCount()).to.equal(1n);
    });
  });
});
