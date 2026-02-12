import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("ConfidentialERC20", function () {
  let token: any;
  let tokenAddress: string;
  let owner: any;
  let alice: any;
  let bob: any;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ConfidentialERC20");
    token = await Factory.deploy("Confidential Token", "cTKN");
    await token.waitForDeployment();
    tokenAddress = await token.getAddress();
  });

  it("should deploy with correct name and symbol", async function () {
    expect(await token.name()).to.equal("Confidential Token");
    expect(await token.symbol()).to.equal("cTKN");
    expect(await token.decimals()).to.equal(6n);
  });

  it("should mint tokens to address", async function () {
    await (await token.mint(alice.address, 1000)).wait();
    expect(await token.totalSupply()).to.equal(1000n);

    const handle = await token.balanceOf(alice.address);
    const clear = await fhevm.userDecryptEuint(FhevmType.euint64, handle, tokenAddress, alice);
    expect(clear).to.equal(1000n);
  });

  it("should transfer tokens", async function () {
    await (await token.mint(alice.address, 1000)).wait();

    const enc = await fhevm
      .createEncryptedInput(tokenAddress, alice.address)
      .add64(300)
      .encrypt();
    await (await token.connect(alice).transfer(enc.handles[0], enc.inputProof, bob.address)).wait();

    const aliceHandle = await token.balanceOf(alice.address);
    const aliceBal = await fhevm.userDecryptEuint(FhevmType.euint64, aliceHandle, tokenAddress, alice);
    expect(aliceBal).to.equal(700n);

    const bobHandle = await token.balanceOf(bob.address);
    const bobBal = await fhevm.userDecryptEuint(FhevmType.euint64, bobHandle, tokenAddress, bob);
    expect(bobBal).to.equal(300n);
  });

  it("should transfer 0 on insufficient balance (no revert)", async function () {
    await (await token.mint(alice.address, 100)).wait();

    const enc = await fhevm
      .createEncryptedInput(tokenAddress, alice.address)
      .add64(200)
      .encrypt();
    // Should NOT revert - transfers 0 instead (privacy!)
    await (await token.connect(alice).transfer(enc.handles[0], enc.inputProof, bob.address)).wait();

    const aliceHandle = await token.balanceOf(alice.address);
    const aliceBal = await fhevm.userDecryptEuint(FhevmType.euint64, aliceHandle, tokenAddress, alice);
    expect(aliceBal).to.equal(100n); // unchanged
  });

  it("should approve and transferFrom", async function () {
    await (await token.mint(alice.address, 1000)).wait();

    // Alice approves Bob for 500
    const encApproval = await fhevm
      .createEncryptedInput(tokenAddress, alice.address)
      .add64(500)
      .encrypt();
    await (await token.connect(alice).approve(encApproval.handles[0], encApproval.inputProof, bob.address)).wait();

    // Bob transfers 300 from Alice to Bob
    const encTransfer = await fhevm
      .createEncryptedInput(tokenAddress, bob.address)
      .add64(300)
      .encrypt();
    await (await token.connect(bob).transferFrom(alice.address, encTransfer.handles[0], encTransfer.inputProof, bob.address)).wait();

    const aliceHandle = await token.balanceOf(alice.address);
    const aliceBal = await fhevm.userDecryptEuint(FhevmType.euint64, aliceHandle, tokenAddress, alice);
    expect(aliceBal).to.equal(700n);
  });

  it("should reject mint from non-owner", async function () {
    try {
      await token.connect(alice).mint(alice.address, 1000);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Not the owner");
    }
  });

  it("should handle transfer to self", async function () {
    await (await token.mint(alice.address, 500)).wait();

    const enc = await fhevm
      .createEncryptedInput(tokenAddress, alice.address)
      .add64(100)
      .encrypt();
    await (await token.connect(alice).transfer(enc.handles[0], enc.inputProof, alice.address)).wait();

    const handle = await token.balanceOf(alice.address);
    const bal = await fhevm.userDecryptEuint(FhevmType.euint64, handle, tokenAddress, alice);
    expect(bal).to.equal(500n);
  });
});
