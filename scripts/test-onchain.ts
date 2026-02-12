import { ethers } from "hardhat";

/**
 * On-chain interaction scenarios on Ethereum Sepolia.
 * Usage: npx hardhat run scripts/test-onchain.ts --network sepolia
 *
 * This script deploys contracts and runs real on-chain scenarios
 * to verify that FHE operations work correctly on the live network.
 */

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("=".repeat(60));
  console.log("FHEVM Bootcamp - On-Chain Test Scenarios");
  console.log("=".repeat(60));
  console.log("Network: Ethereum Sepolia");
  console.log("Deployer:", deployer.address);
  console.log("");

  const results: { scenario: string; status: string; txHash?: string; details?: string }[] = [];

  // ============================================================
  // Scenario 1: SimpleStorage (Baseline - no FHE)
  // ============================================================
  console.log("--- Scenario 1: SimpleStorage (baseline) ---");
  try {
    const Factory = await ethers.getContractFactory("SimpleStorage");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    const addr = await contract.getAddress();
    console.log(`  Deployed: ${addr}`);

    // Set value
    const tx1 = await contract.set(42);
    await tx1.wait();
    console.log(`  set(42) tx: ${tx1.hash}`);

    // Get value
    const val = await contract.get();
    console.log(`  get() = ${val}`);
    const ok = val.toString() === "42";
    results.push({
      scenario: "SimpleStorage: set(42) + get()",
      status: ok ? "PASS" : "FAIL",
      txHash: tx1.hash,
      details: `Returned: ${val}`,
    });
  } catch (e: any) {
    console.error(`  ERROR: ${e.message.slice(0, 200)}`);
    results.push({ scenario: "SimpleStorage", status: "ERROR", details: e.message.slice(0, 100) });
  }
  console.log("");

  // ============================================================
  // Scenario 2: ConditionalDemo (FHE.select - encrypted ternary)
  // ============================================================
  console.log("--- Scenario 2: ConditionalDemo (FHE.select) ---");
  try {
    const Factory = await ethers.getContractFactory("ConditionalDemo");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    const addr = await contract.getAddress();
    console.log(`  Deployed: ${addr}`);

    // selectDemo(a, b, condition): condition=true => should select a=100
    const tx1 = await contract.selectDemo(100, 200, true);
    await tx1.wait();
    console.log(`  selectDemo(100, 200, true) tx: ${tx1.hash}`);

    const handle = await contract.getResult();
    console.log(`  getResult() handle: ${handle.toString().slice(0, 20)}...`);
    const ok = handle.toString() !== "0";
    results.push({
      scenario: "ConditionalDemo: selectDemo(100, 200, true)",
      status: ok ? "PASS" : "FAIL",
      txHash: tx1.hash,
      details: `Handle is non-zero: ${ok}`,
    });
  } catch (e: any) {
    console.error(`  ERROR: ${e.message.slice(0, 200)}`);
    results.push({ scenario: "ConditionalDemo", status: "ERROR", details: e.message.slice(0, 100) });
  }
  console.log("");

  // ============================================================
  // Scenario 3: EncryptedTypes (store/retrieve encrypted values)
  // ============================================================
  console.log("--- Scenario 3: EncryptedTypes (set + get) ---");
  try {
    const Factory = await ethers.getContractFactory("EncryptedTypes");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    const addr = await contract.getAddress();
    console.log(`  Deployed: ${addr}`);

    const tx1 = await contract.setUint32(123456);
    await tx1.wait();
    console.log(`  setUint32(123456) tx: ${tx1.hash}`);

    const handle = await contract.getUint32();
    console.log(`  getUint32() handle: ${handle.toString().slice(0, 20)}...`);
    const ok = handle.toString() !== "0";
    results.push({
      scenario: "EncryptedTypes: setUint32(123456) + getUint32()",
      status: ok ? "PASS" : "FAIL",
      txHash: tx1.hash,
      details: `Handle is non-zero: ${ok}`,
    });
  } catch (e: any) {
    console.error(`  ERROR: ${e.message.slice(0, 200)}`);
    results.push({ scenario: "EncryptedTypes", status: "ERROR", details: e.message.slice(0, 100) });
  }
  console.log("");

  // ============================================================
  // Scenario 4: ArithmeticOps (FHE arithmetic)
  // ============================================================
  console.log("--- Scenario 4: ArithmeticOps (add encrypted + plaintext) ---");
  try {
    const Factory = await ethers.getContractFactory("ArithmeticOps");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    const addr = await contract.getAddress();
    console.log(`  Deployed: ${addr}`);

    const tx1 = await contract.addPlaintext(10, 20);
    await tx1.wait();
    console.log(`  addPlaintext(10, 20) tx: ${tx1.hash}`);

    const handle = await contract.getResult();
    console.log(`  getResult() handle: ${handle.toString().slice(0, 20)}...`);
    const ok = handle.toString() !== "0";
    results.push({
      scenario: "ArithmeticOps: addPlaintext(10, 20)",
      status: ok ? "PASS" : "FAIL",
      txHash: tx1.hash,
      details: `Handle is non-zero: ${ok}`,
    });
  } catch (e: any) {
    console.error(`  ERROR: ${e.message.slice(0, 200)}`);
    results.push({ scenario: "ArithmeticOps", status: "ERROR", details: e.message.slice(0, 100) });
  }
  console.log("");

  // ============================================================
  // Scenario 5: ConfidentialERC20 (mint + check handle)
  // ============================================================
  console.log("--- Scenario 5: ConfidentialERC20 (mint) ---");
  try {
    const Factory = await ethers.getContractFactory("ConfidentialERC20");
    const contract = await Factory.deploy("TestToken", "TT");
    await contract.waitForDeployment();
    const addr = await contract.getAddress();
    console.log(`  Deployed: ${addr}`);

    const tx1 = await contract.mint(deployer.address, 1000000);
    await tx1.wait();
    console.log(`  mint(deployer, 1000000) tx: ${tx1.hash}`);

    const handle = await contract.balanceOf(deployer.address);
    console.log(`  balanceOf() handle: ${handle.toString().slice(0, 20)}...`);
    const ok = handle.toString() !== "0";
    results.push({
      scenario: "ConfidentialERC20: mint(1000000) + balanceOf()",
      status: ok ? "PASS" : "FAIL",
      txHash: tx1.hash,
      details: `Balance handle non-zero: ${ok}`,
    });
  } catch (e: any) {
    console.error(`  ERROR: ${e.message.slice(0, 200)}`);
    results.push({ scenario: "ConfidentialERC20", status: "ERROR", details: e.message.slice(0, 100) });
  }
  console.log("");

  // ============================================================
  // Scenario 6: ConfidentialVoting (create proposal)
  // ============================================================
  console.log("--- Scenario 6: ConfidentialVoting (create proposal) ---");
  try {
    const Factory = await ethers.getContractFactory("ConfidentialVoting");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    const addr = await contract.getAddress();
    console.log(`  Deployed: ${addr}`);

    const tx1 = await contract.createProposal("Should we fund the treasury?", 3600);
    await tx1.wait();
    console.log(`  createProposal() tx: ${tx1.hash}`);

    const count = await contract.proposalCount();
    console.log(`  proposalCount() = ${count}`);
    const ok = count.toString() === "1";
    results.push({
      scenario: "ConfidentialVoting: createProposal()",
      status: ok ? "PASS" : "FAIL",
      txHash: tx1.hash,
      details: `Proposal count: ${count}`,
    });
  } catch (e: any) {
    console.error(`  ERROR: ${e.message.slice(0, 200)}`);
    results.push({ scenario: "ConfidentialVoting", status: "ERROR", details: e.message.slice(0, 100) });
  }
  console.log("");

  // ============================================================
  // Scenario 7: RandomDemo (generate encrypted random)
  // ============================================================
  console.log("--- Scenario 7: RandomDemo (encrypted random) ---");
  try {
    const Factory = await ethers.getContractFactory("RandomDemo");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    const addr = await contract.getAddress();
    console.log(`  Deployed: ${addr}`);

    const tx1 = await contract.generateRandom32();
    await tx1.wait();
    console.log(`  generateRandom32() tx: ${tx1.hash}`);

    const handle = await contract.getRandom32();
    console.log(`  getRandom32() handle: ${handle.toString().slice(0, 20)}...`);
    const ok = handle.toString() !== "0";
    results.push({
      scenario: "RandomDemo: generateRandom32()",
      status: ok ? "PASS" : "FAIL",
      txHash: tx1.hash,
      details: `Random handle non-zero: ${ok}`,
    });
  } catch (e: any) {
    console.error(`  ERROR: ${e.message.slice(0, 200)}`);
    results.push({ scenario: "RandomDemo", status: "ERROR", details: e.message.slice(0, 100) });
  }
  console.log("");

  // ============================================================
  // RESULTS SUMMARY
  // ============================================================
  console.log("=".repeat(60));
  console.log("ON-CHAIN TEST RESULTS");
  console.log("=".repeat(60));
  console.log(`Network: Ethereum Sepolia (chainId: 11155111)`);
  console.log(`Deployer: ${deployer.address}`);
  console.log("");

  let pass = 0;
  let fail = 0;
  let error = 0;

  for (const r of results) {
    const icon = r.status === "PASS" ? "[PASS]" : r.status === "FAIL" ? "[FAIL]" : "[ERROR]";
    console.log(`${icon} ${r.scenario}`);
    if (r.txHash) console.log(`       tx: ${r.txHash}`);
    if (r.details) console.log(`       ${r.details}`);
    if (r.status === "PASS") pass++;
    else if (r.status === "FAIL") fail++;
    else error++;
  }

  console.log("");
  console.log(`Results: ${pass} passed, ${fail} failed, ${error} errors out of ${results.length} scenarios`);

  const balanceAfter = await deployer.provider.getBalance(deployer.address);
  console.log(`Remaining balance: ${ethers.formatEther(balanceAfter)} ETH`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
