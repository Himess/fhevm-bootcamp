import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("CheckSignaturesDemo", function () {
  let demo: any;
  let demoAddress: string;
  let deployer: any;
  let alice: any;

  beforeEach(async function () {
    [deployer, alice] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("CheckSignaturesDemo");
    demo = await Factory.deploy();
    await demo.waitForDeployment();
    demoAddress = await demo.getAddress();
  });

  describe("Deployment", function () {
    it("should set deployer as owner", async function () {
      expect(await demo.owner()).to.equal(deployer.address);
    });
  });

  describe("Deposits", function () {
    it("should accept deposits and encrypt balance", async function () {
      await (await demo.connect(alice).deposit(500)).wait();

      const handle = await demo.getBalance(alice.address);
      const balance = await fhevm.userDecryptEuint(FhevmType.euint64, handle, demoAddress, alice);
      expect(balance).to.equal(500n);
    });

    it("should accumulate multiple deposits", async function () {
      await (await demo.connect(alice).deposit(200)).wait();
      await (await demo.connect(alice).deposit(300)).wait();

      const handle = await demo.getBalance(alice.address);
      const balance = await fhevm.userDecryptEuint(FhevmType.euint64, handle, demoAddress, alice);
      expect(balance).to.equal(500n);
    });

    it("should emit Deposited event", async function () {
      const tx = await demo.connect(alice).deposit(100);
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => log.fragment?.name === "Deposited");
      expect(event).to.not.be.undefined;
    });
  });

  describe("Reveal Request", function () {
    it("should request reveal after deposit", async function () {
      await (await demo.connect(alice).deposit(1000)).wait();
      await (await demo.connect(alice).requestReveal()).wait();

      expect(await demo.revealRequested(alice.address)).to.be.true;
    });

    it("should emit RevealRequested event with handle", async function () {
      await (await demo.connect(alice).deposit(1000)).wait();
      const tx = await demo.connect(alice).requestReveal();
      const receipt = await tx.wait();

      const event = receipt.logs.find((log: any) => log.fragment?.name === "RevealRequested");
      expect(event).to.not.be.undefined;
    });

    it("should store pending handle after reveal request", async function () {
      await (await demo.connect(alice).deposit(1000)).wait();
      await (await demo.connect(alice).requestReveal()).wait();

      const handle = await demo.pendingHandles(alice.address);
      expect(handle).to.not.equal(ethers.ZeroHash);
    });

    it("should reject reveal without balance", async function () {
      let reverted = false;
      try {
        await (await demo.connect(alice).requestReveal()).wait();
      } catch {
        reverted = true;
      }
      expect(reverted).to.be.true;
    });

    it("should reject duplicate reveal request", async function () {
      await (await demo.connect(alice).deposit(500)).wait();
      await (await demo.connect(alice).requestReveal()).wait();

      let reverted = false;
      try {
        await (await demo.connect(alice).requestReveal()).wait();
      } catch {
        reverted = true;
      }
      expect(reverted).to.be.true;
    });

    it("should mark balance as publicly decryptable after reveal", async function () {
      await (await demo.connect(alice).deposit(500)).wait();
      await (await demo.connect(alice).requestReveal()).wait();

      // After reveal — publicly decryptable
      expect(await demo.isRevealable(alice.address)).to.be.true;
    });
  });

  describe("checkSignatures Pattern", function () {
    it("should reject submitVerifiedResult without reveal request", async function () {
      let reverted = false;
      try {
        await (
          await demo.submitVerifiedResult(
            alice.address,
            [ethers.ZeroHash],
            ethers.AbiCoder.defaultAbiCoder().encode(["uint64"], [100]),
            "0x00",
          )
        ).wait();
      } catch {
        reverted = true;
      }
      expect(reverted).to.be.true;
    });

    it("should reject submitVerifiedResult with wrong handle", async function () {
      await (await demo.connect(alice).deposit(500)).wait();
      await (await demo.connect(alice).requestReveal()).wait();

      let reverted = false;
      try {
        // Use a random handle that doesn't match the pending one
        const wrongHandle = ethers.keccak256(ethers.toUtf8Bytes("wrong"));
        await (
          await demo.submitVerifiedResult(
            alice.address,
            [wrongHandle],
            ethers.AbiCoder.defaultAbiCoder().encode(["uint64"], [500]),
            "0x00",
          )
        ).wait();
      } catch {
        reverted = true;
      }
      expect(reverted).to.be.true;
    });

    it("should reject submitVerifiedResult from non-owner", async function () {
      await (await demo.connect(alice).deposit(500)).wait();
      await (await demo.connect(alice).requestReveal()).wait();

      let reverted = false;
      try {
        const handle = await demo.pendingHandles(alice.address);
        await (
          await demo
            .connect(alice)
            .submitVerifiedResult(
              alice.address,
              [handle],
              ethers.AbiCoder.defaultAbiCoder().encode(["uint64"], [500]),
              "0x00",
            )
        ).wait();
      } catch {
        reverted = true;
      }
      expect(reverted).to.be.true;
    });

    // NOTE: In the Hardhat mock environment, FHE.checkSignatures() calls the mock
    // KMSVerifier which requires valid KMS signatures. Since the mock environment
    // does not provide real KMS signatures, submitVerifiedResult will revert.
    // This is EXPECTED behavior — in production, real KMS signatures are used.
    //
    // The educational value is in the CONTRACT PATTERN, not the mock test.
    // Students should understand:
    //   1. encrypt value → store on-chain
    //   2. makePubliclyDecryptable() → signals KMS
    //   3. KMS provides plaintext + proof off-chain
    //   4. submitVerifiedResult() → contract verifies proof via checkSignatures()
    //   5. Only after verification → contract uses the plaintext value
    it("should demonstrate checkSignatures revert with invalid proof", async function () {
      await (await demo.connect(alice).deposit(1000)).wait();
      await (await demo.connect(alice).requestReveal()).wait();

      const handle = await demo.pendingHandles(alice.address);

      // Attempt to submit with an invalid proof — should revert
      // In production, this would be a real KMS signature
      let reverted = false;
      try {
        await (
          await demo.submitVerifiedResult(
            alice.address,
            [handle],
            ethers.AbiCoder.defaultAbiCoder().encode(["uint64"], [1000]),
            "0x00", // Invalid proof — not a real KMS signature
          )
        ).wait();
      } catch {
        reverted = true;
      }
      // This SHOULD revert because the proof is invalid
      // In production with real KMS signatures, this would succeed
      expect(reverted).to.be.true;
    });
  });

  describe("Reset", function () {
    it("should reset reveal state", async function () {
      await (await demo.connect(alice).deposit(500)).wait();
      await (await demo.connect(alice).requestReveal()).wait();
      expect(await demo.revealRequested(alice.address)).to.be.true;

      await (await demo.connect(alice).resetReveal()).wait();
      expect(await demo.revealRequested(alice.address)).to.be.false;
      expect(await demo.hasVerifiedBalance(alice.address)).to.be.false;
      expect(await demo.verifiedBalances(alice.address)).to.equal(0n);
    });

    it("should allow new reveal after reset", async function () {
      await (await demo.connect(alice).deposit(500)).wait();
      await (await demo.connect(alice).requestReveal()).wait();
      await (await demo.connect(alice).resetReveal()).wait();

      // Deposit more and request again
      await (await demo.connect(alice).deposit(200)).wait();
      await (await demo.connect(alice).requestReveal()).wait();
      expect(await demo.revealRequested(alice.address)).to.be.true;
    });
  });

  describe("View Functions", function () {
    it("should return false for isRevealable with no balance", async function () {
      expect(await demo.isRevealable(alice.address)).to.be.false;
    });

    it("should return false for hasVerifiedBalance initially", async function () {
      expect(await demo.hasVerifiedBalance(alice.address)).to.be.false;
    });

    it("should return 0 for verifiedBalances initially", async function () {
      expect(await demo.verifiedBalances(alice.address)).to.equal(0n);
    });
  });
});
