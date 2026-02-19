import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("LastErrorPattern", function () {
  let token: any;
  let tokenAddress: string;
  let owner: any;
  let alice: any;
  let bob: any;
  let charlie: any;

  beforeEach(async function () {
    [owner, alice, bob, charlie] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("LastErrorPattern");
    token = await Factory.deploy("ErrorToken", "eTKN");
    await token.waitForDeployment();
    tokenAddress = await token.getAddress();
  });

  it("should deploy with correct name and symbol", async function () {
    expect(await token.name()).to.equal("ErrorToken");
    expect(await token.symbol()).to.equal("eTKN");
    expect(await token.decimals()).to.equal(6n);
  });

  it("should mint tokens to address", async function () {
    await (await token.mint(alice.address, 1000)).wait();
    expect(await token.totalSupply()).to.equal(1000n);

    const handle = await token.balanceOf(alice.address);
    const clear = await fhevm.userDecryptEuint(FhevmType.euint64, handle, tokenAddress, alice);
    expect(clear).to.equal(1000n);
  });

  it("should transfer successfully and set error code 0 (SUCCESS)", async function () {
    await (await token.mint(alice.address, 1000)).wait();

    const enc = await fhevm.createEncryptedInput(tokenAddress, alice.address).add64(300).encrypt();
    await (await token.connect(alice).transfer(enc.handles[0], enc.inputProof, bob.address)).wait();

    // Check Alice's balance decreased
    const aliceHandle = await token.balanceOf(alice.address);
    const aliceBal = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      aliceHandle,
      tokenAddress,
      alice,
    );
    expect(aliceBal).to.equal(700n);

    // Check Bob received tokens
    const bobHandle = await token.balanceOf(bob.address);
    const bobBal = await fhevm.userDecryptEuint(FhevmType.euint64, bobHandle, tokenAddress, bob);
    expect(bobBal).to.equal(300n);

    // Check error code is 0 (SUCCESS)
    const errorHandle = await token.connect(alice).getLastError();
    const errorCode = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      errorHandle,
      tokenAddress,
      alice,
    );
    expect(errorCode).to.equal(0n);
  });

  it("should set error code 1 (INSUFFICIENT_BALANCE) and transfer 0", async function () {
    await (await token.mint(alice.address, 100)).wait();

    // Try to transfer more than balance
    const enc = await fhevm.createEncryptedInput(tokenAddress, alice.address).add64(200).encrypt();
    await (await token.connect(alice).transfer(enc.handles[0], enc.inputProof, bob.address)).wait();

    // Balance should be unchanged
    const aliceHandle = await token.balanceOf(alice.address);
    const aliceBal = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      aliceHandle,
      tokenAddress,
      alice,
    );
    expect(aliceBal).to.equal(100n);

    // Bob should have 0
    const bobHandle = await token.balanceOf(bob.address);
    const bobBal = await fhevm.userDecryptEuint(FhevmType.euint64, bobHandle, tokenAddress, bob);
    expect(bobBal).to.equal(0n);

    // Error code should be 1 (INSUFFICIENT_BALANCE)
    const errorHandle = await token.connect(alice).getLastError();
    const errorCode = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      errorHandle,
      tokenAddress,
      alice,
    );
    expect(errorCode).to.equal(1n);
  });

  it("should set error code 2 (AMOUNT_TOO_LARGE) when exceeding cap", async function () {
    // Mint a large amount
    await (await token.mint(alice.address, 2_000_000)).wait();

    // Try to transfer more than MAX_TRANSFER (1_000_000)
    const enc = await fhevm
      .createEncryptedInput(tokenAddress, alice.address)
      .add64(1_500_000)
      .encrypt();
    await (await token.connect(alice).transfer(enc.handles[0], enc.inputProof, bob.address)).wait();

    // Balance should be unchanged
    const aliceHandle = await token.balanceOf(alice.address);
    const aliceBal = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      aliceHandle,
      tokenAddress,
      alice,
    );
    expect(aliceBal).to.equal(2_000_000n);

    // Error code should be 2 (AMOUNT_TOO_LARGE)
    const errorHandle = await token.connect(alice).getLastError();
    const errorCode = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      errorHandle,
      tokenAddress,
      alice,
    );
    expect(errorCode).to.equal(2n);
  });

  it("should set error code 3 (SELF_TRANSFER) when transferring to self", async function () {
    await (await token.mint(alice.address, 500)).wait();

    // Transfer to self
    const enc = await fhevm.createEncryptedInput(tokenAddress, alice.address).add64(100).encrypt();
    await (
      await token.connect(alice).transfer(enc.handles[0], enc.inputProof, alice.address)
    ).wait();

    // Error code should be 3 (SELF_TRANSFER)
    const errorHandle = await token.connect(alice).getLastError();
    const errorCode = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      errorHandle,
      tokenAddress,
      alice,
    );
    expect(errorCode).to.equal(3n);
  });

  it("should clear error code", async function () {
    await (await token.mint(alice.address, 100)).wait();

    // Create an error by trying insufficient transfer
    const enc = await fhevm.createEncryptedInput(tokenAddress, alice.address).add64(200).encrypt();
    await (await token.connect(alice).transfer(enc.handles[0], enc.inputProof, bob.address)).wait();

    // Verify error exists
    const errorHandle1 = await token.connect(alice).getLastError();
    const errorCode1 = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      errorHandle1,
      tokenAddress,
      alice,
    );
    expect(errorCode1).to.equal(1n);

    // Clear the error
    await (await token.connect(alice).clearError()).wait();

    // Verify error is now 0
    const errorHandle2 = await token.connect(alice).getLastError();
    const errorCode2 = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      errorHandle2,
      tokenAddress,
      alice,
    );
    expect(errorCode2).to.equal(0n);
  });

  it("should report hasError correctly", async function () {
    // Before any transfer, no error stored
    expect(await token.hasError(alice.address)).to.equal(false);

    await (await token.mint(alice.address, 1000)).wait();

    // After a transfer, error is stored (even if success)
    const enc = await fhevm.createEncryptedInput(tokenAddress, alice.address).add64(100).encrypt();
    await (await token.connect(alice).transfer(enc.handles[0], enc.inputProof, bob.address)).wait();

    expect(await token.hasError(alice.address)).to.equal(true);
  });

  it("should overwrite previous error on new transfer", async function () {
    await (await token.mint(alice.address, 1000)).wait();

    // First: insufficient balance error (try to send 2000)
    const enc1 = await fhevm
      .createEncryptedInput(tokenAddress, alice.address)
      .add64(2000)
      .encrypt();
    await (
      await token.connect(alice).transfer(enc1.handles[0], enc1.inputProof, bob.address)
    ).wait();

    const errorHandle1 = await token.connect(alice).getLastError();
    const errorCode1 = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      errorHandle1,
      tokenAddress,
      alice,
    );
    expect(errorCode1).to.equal(1n); // INSUFFICIENT_BALANCE

    // Second: successful transfer (send 100)
    const enc2 = await fhevm.createEncryptedInput(tokenAddress, alice.address).add64(100).encrypt();
    await (
      await token.connect(alice).transfer(enc2.handles[0], enc2.inputProof, bob.address)
    ).wait();

    const errorHandle2 = await token.connect(alice).getLastError();
    const errorCode2 = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      errorHandle2,
      tokenAddress,
      alice,
    );
    expect(errorCode2).to.equal(0n); // SUCCESS (previous error overwritten)
  });
});
