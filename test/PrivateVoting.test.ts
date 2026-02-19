import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("PrivateVoting", function () {
  let contract: any;
  let contractAddress: string;
  let owner: any;
  let alice: any;
  let bob: any;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("PrivateVoting");
    contract = await Factory.deploy(3); // 3 candidates
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  it("should deploy with correct candidate count", async function () {
    expect(await contract.candidateCount()).to.equal(3n);
    expect(await contract.votingOpen()).to.equal(true);
    expect(await contract.owner()).to.equal(owner.address);
  });

  it("should accept encrypted vote", async function () {
    const encrypted = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add8(1)
      .encrypt();

    const tx = await contract.connect(alice).vote(encrypted.handles[0], encrypted.inputProof);
    await tx.wait();

    expect(await contract.hasVoted(alice.address)).to.equal(true);
  });

  it("should prevent double voting", async function () {
    // First vote
    const enc1 = await fhevm.createEncryptedInput(contractAddress, alice.address).add8(0).encrypt();
    await (await contract.connect(alice).vote(enc1.handles[0], enc1.inputProof)).wait();

    // Second vote should fail
    const enc2 = await fhevm.createEncryptedInput(contractAddress, alice.address).add8(1).encrypt();
    try {
      await contract.connect(alice).vote(enc2.handles[0], enc2.inputProof);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Already voted");
    }
  });

  it("should tally votes correctly after closing", async function () {
    // Alice votes for candidate 0
    const enc1 = await fhevm.createEncryptedInput(contractAddress, alice.address).add8(0).encrypt();
    await (await contract.connect(alice).vote(enc1.handles[0], enc1.inputProof)).wait();

    // Bob votes for candidate 0
    const enc2 = await fhevm.createEncryptedInput(contractAddress, bob.address).add8(0).encrypt();
    await (await contract.connect(bob).vote(enc2.handles[0], enc2.inputProof)).wait();

    // Close voting
    await (await contract.closeVoting()).wait();

    // Reveal tallies
    await (await contract.revealTallies()).wait();

    // Check tally for candidate 0 (should be 2)
    const handle0 = await contract.getTally(0);
    const tally0 = await fhevm.userDecryptEuint(FhevmType.euint32, handle0, contractAddress, owner);
    expect(tally0).to.equal(2n);

    // Check tally for candidate 1 (should be 0)
    const handle1 = await contract.getTally(1);
    const tally1 = await fhevm.userDecryptEuint(FhevmType.euint32, handle1, contractAddress, owner);
    expect(tally1).to.equal(0n);
  });

  it("should reject getTally while voting is open", async function () {
    try {
      await contract.getTally(0);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Voting still open");
    }
  });

  it("should reject invalid candidate count in constructor", async function () {
    const Factory = await ethers.getContractFactory("PrivateVoting");
    try {
      await Factory.deploy(5);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("2-4 candidates");
    }
  });
});
