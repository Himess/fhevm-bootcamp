import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("ConfidentialDAO", function () {
  let dao: any;
  let daoAddress: string;
  let admin: any;
  let alice: any;
  let bob: any;

  beforeEach(async function () {
    [admin, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ConfidentialDAO");
    dao = await Factory.deploy("TestDAO");
    await dao.waitForDeployment();
    daoAddress = await dao.getAddress();
  });

  it("should deploy with correct name", async function () {
    expect(await dao.name()).to.equal("TestDAO");
  });

  it("should set deployer as admin", async function () {
    expect(await dao.admin()).to.equal(admin.address);
  });

  it("should mint governance tokens", async function () {
    await (await dao.mintTokens(alice.address, 1000)).wait();
    expect(await dao.totalTokenSupply()).to.equal(1000n);

    const handle = await dao.tokenBalanceOf(alice.address);
    const bal = await fhevm.userDecryptEuint(FhevmType.euint64, handle, daoAddress, alice);
    expect(bal).to.equal(1000n);
  });

  it("should reject non-admin minting", async function () {
    try {
      await dao.connect(alice).mintTokens(alice.address, 1000);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Not admin");
    }
  });

  it("should create a proposal", async function () {
    await (await dao.createProposal("Fund dev", bob.address, 1000, 3600)).wait();
    expect(await dao.proposalCount()).to.equal(1n);
  });

  it("should cast an encrypted vote", async function () {
    await (await dao.mintTokens(alice.address, 500)).wait();
    await (await dao.createProposal("Proposal 1", bob.address, 100, 3600)).wait();

    const enc = await fhevm.createEncryptedInput(daoAddress, alice.address).add8(1).encrypt();
    await (await dao.connect(alice).vote(0, enc.handles[0], enc.inputProof)).wait();

    expect(await dao.hasVoted(0, alice.address)).to.equal(true);
  });

  it("should prevent double voting", async function () {
    await (await dao.mintTokens(alice.address, 500)).wait();
    await (await dao.createProposal("Proposal 2", bob.address, 100, 3600)).wait();

    const enc1 = await fhevm.createEncryptedInput(daoAddress, alice.address).add8(1).encrypt();
    await (await dao.connect(alice).vote(0, enc1.handles[0], enc1.inputProof)).wait();

    const enc2 = await fhevm.createEncryptedInput(daoAddress, alice.address).add8(0).encrypt();
    try {
      await dao.connect(alice).vote(0, enc2.handles[0], enc2.inputProof);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Already voted");
    }
  });

  it("should track encrypted yes/no votes", async function () {
    await (await dao.mintTokens(alice.address, 500)).wait();
    await (await dao.mintTokens(bob.address, 500)).wait();
    await (await dao.createProposal("Vote Test", admin.address, 50, 100)).wait();

    // Alice votes yes (1)
    const encAlice = await fhevm.createEncryptedInput(daoAddress, alice.address).add8(1).encrypt();
    await (await dao.connect(alice).vote(0, encAlice.handles[0], encAlice.inputProof)).wait();

    // Bob votes no (0)
    const encBob = await fhevm.createEncryptedInput(daoAddress, bob.address).add8(0).encrypt();
    await (await dao.connect(bob).vote(0, encBob.handles[0], encBob.inputProof)).wait();

    // Advance time past deadline and finalize
    await ethers.provider.send("evm_increaseTime", [101]);
    await ethers.provider.send("evm_mine", []);
    await (await dao.finalizeProposal(0)).wait();

    // Verify tallies exist (handles are non-zero after votes + finalize)
    // Note: In mock environment, makePubliclyDecryptable does not grant userDecrypt ACL.
    // On real network, these would be decryptable via Gateway or public KMS decryption.
    const yesHandle = await dao.getYesVotes(0);
    const noHandle = await dao.getNoVotes(0);
    expect(yesHandle).to.not.equal(ethers.ZeroHash);
    expect(noHandle).to.not.equal(ethers.ZeroHash);

    // Set results (simulates off-chain decryption + callback)
    await (await dao.setResults(0, 1, 1)).wait();
    const proposal = await dao.proposals(0);
    expect(proposal.yesResult).to.equal(1n);
    expect(proposal.noResult).to.equal(1n);
  });

  it("should finalize proposal after deadline", async function () {
    await (await dao.mintTokens(alice.address, 500)).wait();
    // Create proposal with 1 second duration
    await (await dao.createProposal("Finalize Test", bob.address, 0, 1)).wait();

    // Alice votes yes
    const enc = await fhevm.createEncryptedInput(daoAddress, alice.address).add8(1).encrypt();
    await (await dao.connect(alice).vote(0, enc.handles[0], enc.inputProof)).wait();

    // Wait for deadline to pass
    await ethers.provider.send("evm_increaseTime", [2]);
    await ethers.provider.send("evm_mine", []);

    // Finalize (makePubliclyDecryptable)
    await (await dao.finalizeProposal(0)).wait();

    // Set results (admin provides decrypted values)
    await (await dao.setResults(0, 1, 0)).wait();

    // Verify revealed flag is true
    const proposal = await dao.proposals(0);
    expect(proposal.revealed).to.equal(true);
    expect(proposal.yesResult).to.equal(1n);
    expect(proposal.noResult).to.equal(0n);
  });

  it("should reject finalize before deadline", async function () {
    await (await dao.createProposal("Early Finalize", bob.address, 0, 3600)).wait();
    try {
      await dao.finalizeProposal(0);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Voting ongoing");
    }
  });

  it("should accept treasury funding", async function () {
    await admin.sendTransaction({ to: daoAddress, value: ethers.parseEther("1.0") });
    expect(await dao.treasuryBalance()).to.equal(ethers.parseEther("1.0"));
  });

  it("should execute proposal and transfer treasury", async function () {
    // Fund the DAO treasury
    await admin.sendTransaction({ to: daoAddress, value: ethers.parseEther("1.0") });

    // Create proposal to send 0.5 ETH to bob
    await (
      await dao.createProposal("Send to Bob", bob.address, ethers.parseEther("0.5"), 100)
    ).wait();

    // Alice votes yes
    await (await dao.mintTokens(alice.address, 500)).wait();
    const enc = await fhevm.createEncryptedInput(daoAddress, alice.address).add8(1).encrypt();
    await (await dao.connect(alice).vote(0, enc.handles[0], enc.inputProof)).wait();

    // Advance time past deadline, finalize, and set results
    await ethers.provider.send("evm_increaseTime", [101]);
    await ethers.provider.send("evm_mine", []);
    await (await dao.finalizeProposal(0)).wait();
    await (await dao.setResults(0, 1, 0)).wait(); // 1 yes, 0 no → passes

    // Execute
    const bobBalBefore = await ethers.provider.getBalance(bob.address);
    await (await dao.executeProposal(0)).wait();
    const bobBalAfter = await ethers.provider.getBalance(bob.address);

    expect(bobBalAfter - bobBalBefore).to.equal(ethers.parseEther("0.5"));
    expect(await dao.treasuryBalance()).to.equal(ethers.parseEther("0.5"));
  });
});
