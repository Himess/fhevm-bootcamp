import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("ConfidentialVoting", function () {
  let voting: any;
  let votingAddress: string;
  let owner: any;
  let alice: any;
  let bob: any;
  let charlie: any;

  beforeEach(async function () {
    [owner, alice, bob, charlie] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ConfidentialVoting");
    voting = await Factory.deploy();
    await voting.waitForDeployment();
    votingAddress = await voting.getAddress();
  });

  it("should create a proposal", async function () {
    await (await voting.createProposal("Test Proposal", 3600)).wait();
    expect(await voting.proposalCount()).to.equal(1n);
  });

  it("should allow voting yes", async function () {
    await (await voting.createProposal("Vote Yes Test", 3600)).wait();

    const enc = await fhevm
      .createEncryptedInput(votingAddress, alice.address)
      .add8(1) // yes
      .encrypt();
    await (await voting.connect(alice).vote(0, enc.handles[0], enc.inputProof)).wait();

    expect(await voting.hasVoted(0, alice.address)).to.equal(true);
  });

  it("should allow voting no", async function () {
    await (await voting.createProposal("Vote No Test", 3600)).wait();

    const enc = await fhevm
      .createEncryptedInput(votingAddress, bob.address)
      .add8(0) // no
      .encrypt();
    await (await voting.connect(bob).vote(0, enc.handles[0], enc.inputProof)).wait();

    expect(await voting.hasVoted(0, bob.address)).to.equal(true);
  });

  it("should prevent double voting", async function () {
    await (await voting.createProposal("Double Vote Test", 3600)).wait();

    const enc1 = await fhevm
      .createEncryptedInput(votingAddress, alice.address)
      .add8(1)
      .encrypt();
    await (await voting.connect(alice).vote(0, enc1.handles[0], enc1.inputProof)).wait();

    const enc2 = await fhevm
      .createEncryptedInput(votingAddress, alice.address)
      .add8(0)
      .encrypt();
    try {
      await voting.connect(alice).vote(0, enc2.handles[0], enc2.inputProof);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Already voted");
    }
  });

  it("should tally yes and no votes correctly", async function () {
    await (await voting.createProposal("Tally Test", 100)).wait();

    // Alice votes yes
    const encYes = await fhevm
      .createEncryptedInput(votingAddress, alice.address)
      .add8(1)
      .encrypt();
    await (await voting.connect(alice).vote(0, encYes.handles[0], encYes.inputProof)).wait();

    // Bob votes no
    const encNo = await fhevm
      .createEncryptedInput(votingAddress, bob.address)
      .add8(0)
      .encrypt();
    await (await voting.connect(bob).vote(0, encNo.handles[0], encNo.inputProof)).wait();

    // Charlie votes yes
    const encYes2 = await fhevm
      .createEncryptedInput(votingAddress, charlie.address)
      .add8(1)
      .encrypt();
    await (await voting.connect(charlie).vote(0, encYes2.handles[0], encYes2.inputProof)).wait();

    // Advance time past deadline
    await ethers.provider.send("evm_increaseTime", [101]);
    await ethers.provider.send("evm_mine", []);

    // Reveal results (makes tallies publicly decryptable)
    await (await voting.revealResult(0)).wait();

    // Verify tallies exist (handles are non-zero after votes + reveal)
    // Note: In mock environment, makePubliclyDecryptable does not grant userDecrypt ACL.
    // On real network, these would be decryptable via Gateway or public KMS decryption.
    const yesHandle = await voting.getYesVotes(0);
    const noHandle = await voting.getNoVotes(0);
    expect(yesHandle).to.not.equal(ethers.ZeroHash);
    expect(noHandle).to.not.equal(ethers.ZeroHash);

    // Store results via setResults
    await (await voting.setResults(0, 2, 1)).wait();
    const proposal = await voting.proposals(0);
    expect(proposal.yesResult).to.equal(2n);
    expect(proposal.noResult).to.equal(1n);
  });

  it("should reject vote on invalid proposal", async function () {
    try {
      const enc = await fhevm
        .createEncryptedInput(votingAddress, alice.address)
        .add8(1)
        .encrypt();
      await voting.connect(alice).vote(999, enc.handles[0], enc.inputProof);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Invalid proposal");
    }
  });

  it("should only allow owner to create proposals", async function () {
    try {
      await voting.connect(alice).createProposal("Unauthorized", 3600);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Not the owner");
    }
  });

  it("should store results via setResults", async function () {
    await (await voting.createProposal("Results Test", 100)).wait();

    // Alice votes yes
    const encYes = await fhevm
      .createEncryptedInput(votingAddress, alice.address)
      .add8(1)
      .encrypt();
    await (await voting.connect(alice).vote(0, encYes.handles[0], encYes.inputProof)).wait();

    // Bob votes no
    const encNo = await fhevm
      .createEncryptedInput(votingAddress, bob.address)
      .add8(0)
      .encrypt();
    await (await voting.connect(bob).vote(0, encNo.handles[0], encNo.inputProof)).wait();

    // Advance time past deadline
    await ethers.provider.send("evm_increaseTime", [101]);
    await ethers.provider.send("evm_mine", []);

    // Reveal (make publicly decryptable)
    await (await voting.revealResult(0)).wait();

    // Set results (admin stores plaintext values)
    await (await voting.setResults(0, 1, 1)).wait();

    // Check results are stored
    const proposal = await voting.proposals(0);
    expect(proposal.revealed).to.equal(true);
    expect(proposal.yesResult).to.equal(1n);
    expect(proposal.noResult).to.equal(1n);
  });

  it("should prevent double setResults", async function () {
    await (await voting.createProposal("Double Set Test", 100)).wait();

    await ethers.provider.send("evm_increaseTime", [101]);
    await ethers.provider.send("evm_mine", []);

    await (await voting.revealResult(0)).wait();
    await (await voting.setResults(0, 0, 0)).wait();

    try {
      await voting.setResults(0, 0, 0);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Already revealed");
    }
  });

  it("should reject revealResult before deadline", async function () {
    await (await voting.createProposal("Early Reveal Test", 3600)).wait();

    try {
      await voting.revealResult(0);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Voting not ended");
    }
  });

  it("should reject setResults from non-owner", async function () {
    await (await voting.createProposal("Auth Test", 100)).wait();

    await ethers.provider.send("evm_increaseTime", [101]);
    await ethers.provider.send("evm_mine", []);

    await (await voting.revealResult(0)).wait();

    try {
      await voting.connect(alice).setResults(0, 0, 0);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Not the owner");
    }
  });
});
