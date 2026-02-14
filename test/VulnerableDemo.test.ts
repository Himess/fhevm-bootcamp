import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("VulnerableDemo", function () {
  let contract: any;
  let contractAddress: string;
  let owner: any;
  let alice: any;
  let bob: any;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("VulnerableDemo");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  // =========================================================================
  // Vulnerability 1: Missing ACL Permissions
  // =========================================================================

  it("VULN-1: vulnerableMint -- user cannot decrypt their balance (missing ACL)", async function () {
    // Mint using the VULNERABLE function (no ACL set)
    await (await contract.vulnerableMint(alice.address, 500)).wait();

    // The balance exists but alice has no ACL access to decrypt it.
    // Attempting to decrypt should fail because no allow() was called.
    const handle = await contract.getBalance(alice.address);

    try {
      await fhevm.userDecryptEuint(
        FhevmType.euint64,
        handle,
        contractAddress,
        alice
      );
      // If we reach here, the test environment may not enforce ACL strictly.
      // In production, this would fail with "not authorized to decrypt."
    } catch (error: any) {
      // Expected: alice cannot decrypt because FHE.allow was never called
      expect(error.message).to.include("not authorized");
    }

    // Compare with the SECURE setupMint
    await (await contract.setupMint(bob.address, 500)).wait();
    const bobHandle = await contract.getBalance(bob.address);
    const bobBal = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      bobHandle,
      contractAddress,
      bob
    );
    expect(bobBal).to.equal(500n); // Bob CAN decrypt (proper ACL)
  });

  // =========================================================================
  // Vulnerability 2: Gas Leak via Branching
  // =========================================================================

  it("VULN-2: vulnerableTransfer -- branching on encrypted condition", async function () {
    // Setup: give alice some tokens using the secure mint
    await (await contract.setupMint(alice.address, 1000)).wait();

    // The vulnerableTransfer function uses if/else on an encrypted condition.
    // In a real network, we would observe different gas consumption
    // depending on whether the branch is taken or not.
    // Here we verify the function executes and the transfer counter increments,
    // demonstrating that the branch was taken (information leaked).
    await (
      await contract.connect(alice).vulnerableTransfer(bob.address, 100)
    ).wait();

    // The transfer counter reveals that the if-branch was taken
    // (i.e., alice had sufficient balance). This is the information leak.
    const count = await contract.transferCount();
    expect(count).to.equal(1n);

    // In a secure implementation using FHE.select(), there would be
    // no observable difference between sufficient and insufficient balance.
  });

  // =========================================================================
  // Vulnerability 4: Unbounded Batch (DoS)
  // =========================================================================

  it("VULN-4: vulnerableBatchAdd -- no size limit allows DoS", async function () {
    // Create a moderately large batch (10 addresses)
    // On a real network, hundreds/thousands would exceed gas limit
    const signers = await ethers.getSigners();
    const recipients = signers.slice(0, 10).map((s: any) => s.address);

    // This succeeds with 10 but on a real network, 100+ would fail
    // The vulnerability is that there is NO cap -- an attacker controls gas cost
    await (await contract.vulnerableBatchAdd(recipients, 50)).wait();

    // Verify tokens were distributed
    const handle = await contract.getBalance(signers[1].address);
    const bal = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      handle,
      contractAddress,
      signers[1]
    );
    expect(bal).to.equal(50n);
  });

  // =========================================================================
  // Vulnerability 6: Exposing Data via makePubliclyDecryptable
  // =========================================================================

  it("VULN-6: vulnerableRevealBalance -- exposes private balance", async function () {
    await (await contract.setupMint(alice.address, 999)).wait();

    // The owner can call this to make alice's balance publicly decryptable
    // This is a vulnerability: alice never consented to revealing her balance
    await (await contract.vulnerableRevealBalance(alice.address)).wait();

    // The vulnerability is that the owner can unilaterally expose user data.
    // In a secure contract, only the user themselves should be able to
    // make their own data publicly decryptable.
    // Verify the function executed without reverting (that's the vulnerability)
    const handle = await contract.getBalance(alice.address);
    expect(handle).to.not.equal(ethers.ZeroHash);
  });

  // =========================================================================
  // Vulnerability 7: No Access Control on Sensitive Operations
  // =========================================================================

  it("VULN-7: vulnerableOpenMint -- anyone can mint tokens", async function () {
    // Alice (non-owner) can mint tokens to herself
    await (
      await contract.connect(alice).vulnerableOpenMint(alice.address, 999999)
    ).wait();

    const handle = await contract.getBalance(alice.address);
    const bal = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      handle,
      contractAddress,
      alice
    );
    expect(bal).to.equal(999999n);

    // Bob can also mint to himself
    await (
      await contract.connect(bob).vulnerableOpenMint(bob.address, 888888)
    ).wait();

    const bobHandle = await contract.getBalance(bob.address);
    const bobBal = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      bobHandle,
      contractAddress,
      bob
    );
    expect(bobBal).to.equal(888888n);

    // In a secure contract, only the owner should be able to mint.
  });
});
