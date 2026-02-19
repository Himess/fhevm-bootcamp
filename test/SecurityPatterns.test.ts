import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("SecurityPatterns", function () {
  let contract: any;
  let contractAddress: string;
  let owner: any;
  let alice: any;
  let bob: any;
  let charlie: any;

  beforeEach(async function () {
    [owner, alice, bob, charlie] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("SecurityPatterns");
    // cooldownBlocks = 0 (disabled for testing), maxBatchSize = 5
    contract = await Factory.deploy(0, 5);
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  // =========================================================================
  // Pattern 1: Input Validation
  // =========================================================================

  it("should accept valid encrypted deposits", async function () {
    // Mint first so alice has an initialized balance
    await (await contract.mint(alice.address, 0)).wait();

    const enc = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(500)
      .encrypt();

    await (await contract.connect(alice).secureDeposit(enc.handles[0], enc.inputProof)).wait();

    const handle = await contract.connect(alice).getMyBalance();
    const balance = await fhevm.userDecryptEuint(FhevmType.euint64, handle, contractAddress, alice);
    expect(balance).to.equal(500n);
  });

  // =========================================================================
  // Pattern 2: Safe Transfer with Select
  // =========================================================================

  it("should transfer tokens when balance is sufficient", async function () {
    await (await contract.mint(alice.address, 1000)).wait();

    const enc = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(50)
      .encrypt();

    await (
      await contract.connect(alice).secureTransfer(enc.handles[0], enc.inputProof, bob.address)
    ).wait();

    // Check alice balance
    const aliceHandle = await contract.connect(alice).getMyBalance();
    const aliceBal = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      aliceHandle,
      contractAddress,
      alice,
    );
    expect(aliceBal).to.equal(950n);

    // Check bob balance
    await (await contract.mint(bob.address, 0)).wait(); // ensure bob can access
    const bobHandle = await contract.connect(bob).getBalance(bob.address);
    const bobBal = await fhevm.userDecryptEuint(FhevmType.euint64, bobHandle, contractAddress, bob);
    expect(bobBal).to.equal(50n);
  });

  it("should transfer 0 when balance is insufficient (no revert)", async function () {
    await (await contract.mint(alice.address, 50)).wait();

    // Try to transfer 100 (more than balance of 50)
    const enc = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(100)
      .encrypt();

    // Should NOT revert -- transfers 0 instead
    await (
      await contract.connect(alice).secureTransfer(enc.handles[0], enc.inputProof, bob.address)
    ).wait();

    // Alice balance unchanged
    const aliceHandle = await contract.connect(alice).getMyBalance();
    const aliceBal = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      aliceHandle,
      contractAddress,
      alice,
    );
    expect(aliceBal).to.equal(50n);
  });

  // =========================================================================
  // Pattern 3: LastError Pattern
  // =========================================================================

  it("should set LastError to 0 on successful deposit", async function () {
    await (await contract.mint(alice.address, 0)).wait();

    const enc = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(100)
      .encrypt();

    await (await contract.connect(alice).secureDeposit(enc.handles[0], enc.inputProof)).wait();

    const errorHandle = await contract.connect(alice).getLastError();
    const errorCode = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      errorHandle,
      contractAddress,
      alice,
    );
    expect(errorCode).to.equal(0n); // ERR_NONE
  });

  it("should set LastError to 1 on insufficient balance transfer", async function () {
    await (await contract.mint(alice.address, 10)).wait();

    // Transfer more than balance
    const enc = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(50)
      .encrypt();

    await (
      await contract.connect(alice).secureTransfer(enc.handles[0], enc.inputProof, bob.address)
    ).wait();

    const errorHandle = await contract.connect(alice).getLastError();
    const errorCode = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      errorHandle,
      contractAddress,
      alice,
    );
    expect(errorCode).to.equal(1n); // ERR_INSUFFICIENT_BALANCE
  });

  // =========================================================================
  // Pattern 4: Bounded Batch Operations
  // =========================================================================

  it("should allow batch mint within size limit", async function () {
    const recipients = [alice.address, bob.address, charlie.address];

    await (await contract.batchMint(recipients, 100)).wait();

    // Check alice received tokens
    const handle = await contract.getBalance(alice.address);
    const bal = await fhevm.userDecryptEuint(FhevmType.euint64, handle, contractAddress, alice);
    expect(bal).to.equal(100n);
  });

  it("should reject batch mint exceeding size limit", async function () {
    // maxBatchSize is 5, try with 6
    const signers = await ethers.getSigners();
    const recipients = signers.slice(0, 6).map((s: any) => s.address);

    try {
      await contract.batchMint(recipients, 100);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("BatchTooLarge");
    }
  });

  // =========================================================================
  // Pattern 5: Owner-Only Admin Functions
  // =========================================================================

  it("should reject non-owner from calling admin functions", async function () {
    try {
      await contract.connect(alice).mint(bob.address, 100);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("NotOwner");
    }
  });

  it("should allow owner to transfer ownership", async function () {
    await (await contract.transferOwnership(alice.address)).wait();
    expect(await contract.owner()).to.equal(alice.address);

    // Old owner can no longer call admin functions
    try {
      await contract.connect(owner).mint(bob.address, 100);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("NotOwner");
    }
  });

  // =========================================================================
  // Pattern 7: Encrypted Comparison Without Leakage
  // =========================================================================

  it("should compare balances without leaking values", async function () {
    await (await contract.mint(alice.address, 500)).wait();
    await (await contract.mint(bob.address, 300)).wait();

    // Just verify the comparison executes without reverting
    // The actual comparison result is encrypted and only accessible to the caller
    await (await contract.compareBalances(alice.address, bob.address)).wait();
    // If we reach here, the comparison completed successfully
  });

  // =========================================================================
  // Pattern 9: Grant Access to Third Party
  // =========================================================================

  it("should grant third party access to balance", async function () {
    await (await contract.mint(alice.address, 777)).wait();

    // Alice grants Bob read access
    await (await contract.connect(alice).grantBalanceAccess(bob.address)).wait();

    // Bob can now read alice's balance
    const handle = await contract.connect(bob).getBalance(alice.address);
    const bal = await fhevm.userDecryptEuint(FhevmType.euint64, handle, contractAddress, bob);
    expect(bal).to.equal(777n);
  });
});
