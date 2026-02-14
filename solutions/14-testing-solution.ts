// SOLUTION: Exercise 14 - ConfidentialERC20 Test Suite
// This is the complete implementation of all test cases.

import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("Exercise 14: ConfidentialERC20 Test Suite", function () {
  let token: any;
  let tokenAddress: string;
  let owner: any;
  let alice: any;
  let bob: any;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ConfidentialERC20");
    token = await Factory.deploy("TestToken", "TT");
    await token.waitForDeployment();
    tokenAddress = await token.getAddress();
  });

  // ===========================================================
  // Section 1: Deployment Tests
  // ===========================================================

  describe("Deployment", function () {
    it("should deploy with correct name, symbol, and decimals", async function () {
      expect(await token.name()).to.equal("TestToken");
      expect(await token.symbol()).to.equal("TT");
      expect(await token.decimals()).to.equal(6n);
    });

    it("should set deployer as owner with totalSupply 0", async function () {
      expect(await token.owner()).to.equal(owner.address);
      expect(await token.totalSupply()).to.equal(0n);
    });
  });

  // ===========================================================
  // Section 2: Minting Tests
  // ===========================================================

  describe("Minting", function () {
    it("should mint tokens and verify encrypted balance", async function () {
      await (await token.mint(alice.address, 1000)).wait();
      expect(await token.totalSupply()).to.equal(1000n);

      const handle = await token.balanceOf(alice.address);
      const clear = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        handle,
        tokenAddress,
        alice
      );
      expect(clear).to.equal(1000n);
    });

    it("should reject mint from non-owner", async function () {
      try {
        await token.connect(alice).mint(alice.address, 1000);
        expect.fail("Should have reverted");
      } catch (error: any) {
        expect(error.message).to.include("Not the owner");
      }
    });
  });

  // ===========================================================
  // Section 3: Transfer Tests
  // ===========================================================

  describe("Transfers", function () {
    it("should transfer tokens between users", async function () {
      await (await token.mint(alice.address, 1000)).wait();

      const enc = await fhevm
        .createEncryptedInput(tokenAddress, alice.address)
        .add64(300)
        .encrypt();
      await (
        await token
          .connect(alice)
          .transfer(enc.handles[0], enc.inputProof, bob.address)
      ).wait();

      const aliceHandle = await token.balanceOf(alice.address);
      const aliceBal = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        aliceHandle,
        tokenAddress,
        alice
      );
      expect(aliceBal).to.equal(700n);

      const bobHandle = await token.balanceOf(bob.address);
      const bobBal = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        bobHandle,
        tokenAddress,
        bob
      );
      expect(bobBal).to.equal(300n);
    });

    it("should silently transfer 0 on insufficient balance", async function () {
      await (await token.mint(alice.address, 100)).wait();

      const enc = await fhevm
        .createEncryptedInput(tokenAddress, alice.address)
        .add64(200)
        .encrypt();
      // This should NOT revert -- it transfers 0 instead (privacy!)
      await (
        await token
          .connect(alice)
          .transfer(enc.handles[0], enc.inputProof, bob.address)
      ).wait();

      // Alice's balance is unchanged
      const aliceHandle = await token.balanceOf(alice.address);
      const aliceBal = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        aliceHandle,
        tokenAddress,
        alice
      );
      expect(aliceBal).to.equal(100n);

      // Bob received nothing
      const bobHandle = await token.balanceOf(bob.address);
      const bobBal = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        bobHandle,
        tokenAddress,
        bob
      );
      expect(bobBal).to.equal(0n);
    });

    it("should handle transfer to self", async function () {
      await (await token.mint(alice.address, 500)).wait();

      const enc = await fhevm
        .createEncryptedInput(tokenAddress, alice.address)
        .add64(100)
        .encrypt();
      await (
        await token
          .connect(alice)
          .transfer(enc.handles[0], enc.inputProof, alice.address)
      ).wait();

      const handle = await token.balanceOf(alice.address);
      const bal = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        handle,
        tokenAddress,
        alice
      );
      expect(bal).to.equal(500n);
    });
  });

  // ===========================================================
  // Section 4: Allowance Tests
  // ===========================================================

  describe("Allowances", function () {
    it("should approve and verify encrypted allowance", async function () {
      await (await token.mint(alice.address, 1000)).wait();

      const encApproval = await fhevm
        .createEncryptedInput(tokenAddress, alice.address)
        .add64(500)
        .encrypt();
      await (
        await token
          .connect(alice)
          .approve(encApproval.handles[0], encApproval.inputProof, bob.address)
      ).wait();

      const allowanceHandle = await token.allowance(
        alice.address,
        bob.address
      );
      const allowanceClear = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        allowanceHandle,
        tokenAddress,
        alice
      );
      expect(allowanceClear).to.equal(500n);
    });

    it("should transferFrom within allowance", async function () {
      await (await token.mint(alice.address, 1000)).wait();

      // Alice approves Bob for 500
      const encApproval = await fhevm
        .createEncryptedInput(tokenAddress, alice.address)
        .add64(500)
        .encrypt();
      await (
        await token
          .connect(alice)
          .approve(encApproval.handles[0], encApproval.inputProof, bob.address)
      ).wait();

      // Bob transfers 300 from Alice to himself
      const encTransfer = await fhevm
        .createEncryptedInput(tokenAddress, bob.address)
        .add64(300)
        .encrypt();
      await (
        await token
          .connect(bob)
          .transferFrom(
            alice.address,
            encTransfer.handles[0],
            encTransfer.inputProof,
            bob.address
          )
      ).wait();

      // Alice: 1000 - 300 = 700
      const aliceHandle = await token.balanceOf(alice.address);
      const aliceBal = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        aliceHandle,
        tokenAddress,
        alice
      );
      expect(aliceBal).to.equal(700n);

      // Bob: 0 + 300 = 300
      const bobHandle = await token.balanceOf(bob.address);
      const bobBal = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        bobHandle,
        tokenAddress,
        bob
      );
      expect(bobBal).to.equal(300n);
    });

    it("should silently transfer 0 on insufficient allowance", async function () {
      await (await token.mint(alice.address, 1000)).wait();

      // Alice approves Bob for only 100
      const encApproval = await fhevm
        .createEncryptedInput(tokenAddress, alice.address)
        .add64(100)
        .encrypt();
      await (
        await token
          .connect(alice)
          .approve(encApproval.handles[0], encApproval.inputProof, bob.address)
      ).wait();

      // Bob tries to transfer 200 (exceeds allowance of 100)
      const encTransfer = await fhevm
        .createEncryptedInput(tokenAddress, bob.address)
        .add64(200)
        .encrypt();
      await (
        await token
          .connect(bob)
          .transferFrom(
            alice.address,
            encTransfer.handles[0],
            encTransfer.inputProof,
            bob.address
          )
      ).wait();

      // Alice's balance should be unchanged (1000)
      const aliceHandle = await token.balanceOf(alice.address);
      const aliceBal = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        aliceHandle,
        tokenAddress,
        alice
      );
      expect(aliceBal).to.equal(1000n);

      // Bob should have 0
      const bobHandle = await token.balanceOf(bob.address);
      const bobBal = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        bobHandle,
        tokenAddress,
        bob
      );
      expect(bobBal).to.equal(0n);
    });
  });

  // ===========================================================
  // Section 5: Edge Cases
  // ===========================================================

  describe("Edge Cases", function () {
    it("should handle multiple sequential transfers correctly", async function () {
      await (await token.mint(alice.address, 1000)).wait();

      // Transfer 1: Alice -> Bob 200
      const enc1 = await fhevm
        .createEncryptedInput(tokenAddress, alice.address)
        .add64(200)
        .encrypt();
      await (
        await token
          .connect(alice)
          .transfer(enc1.handles[0], enc1.inputProof, bob.address)
      ).wait();

      // Transfer 2: Alice -> Bob 300
      const enc2 = await fhevm
        .createEncryptedInput(tokenAddress, alice.address)
        .add64(300)
        .encrypt();
      await (
        await token
          .connect(alice)
          .transfer(enc2.handles[0], enc2.inputProof, bob.address)
      ).wait();

      // Alice: 1000 - 200 - 300 = 500
      const aliceHandle = await token.balanceOf(alice.address);
      const aliceBal = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        aliceHandle,
        tokenAddress,
        alice
      );
      expect(aliceBal).to.equal(500n);

      // Bob: 200 + 300 = 500
      const bobHandle = await token.balanceOf(bob.address);
      const bobBal = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        bobHandle,
        tokenAddress,
        bob
      );
      expect(bobBal).to.equal(500n);
    });

    it("should maintain correct totalSupply after multiple mints", async function () {
      await (await token.mint(alice.address, 1000)).wait();
      await (await token.mint(bob.address, 2000)).wait();

      expect(await token.totalSupply()).to.equal(3000n);
    });

    it("should emit Transfer event on successful transfer", async function () {
      await (await token.mint(alice.address, 1000)).wait();

      const enc = await fhevm
        .createEncryptedInput(tokenAddress, alice.address)
        .add64(300)
        .encrypt();
      const tx = await token
        .connect(alice)
        .transfer(enc.handles[0], enc.inputProof, bob.address);
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (log: any) => log.fragment?.name === "Transfer"
      );
      expect(event).to.not.be.undefined;
      expect(event.args[0]).to.equal(alice.address); // from
      expect(event.args[1]).to.equal(bob.address); // to
    });

    it("should emit Mint event", async function () {
      const tx = await token.mint(alice.address, 1000);
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (log: any) => log.fragment?.name === "Mint"
      );
      expect(event).to.not.be.undefined;
      expect(event.args[0]).to.equal(alice.address); // to
      expect(event.args[1]).to.equal(1000n); // amount
    });
  });
});
