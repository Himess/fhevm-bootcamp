import { ethers } from "hardhat";

/**
 * On-chain verification scenarios for ALL 35 bootcamp contracts.
 * Deploys each contract and runs real FHE operations on Ethereum Sepolia.
 *
 * Usage: npx hardhat run scripts/test-onchain.ts --network sepolia
 */

interface Result {
  scenario: string;
  module: string;
  status: "PASS" | "FAIL" | "ERROR";
  txHash?: string;
  details?: string;
  address?: string;
}

const results: Result[] = [];

function log(msg: string) {
  console.log(msg);
}

function pass(scenario: string, mod: string, addr: string, txHash: string, details: string) {
  results.push({ scenario, module: mod, status: "PASS", txHash, details, address: addr });
  log(`  [PASS] ${details}`);
}

function fail(scenario: string, mod: string, addr: string, details: string) {
  results.push({ scenario, module: mod, status: "FAIL", details, address: addr });
  log(`  [FAIL] ${details}`);
}

function error(scenario: string, mod: string, msg: string) {
  results.push({ scenario, module: mod, status: "ERROR", details: msg });
  log(`  [ERROR] ${msg}`);
}

async function main() {
  const [deployer] = await ethers.getSigners();
  log("=".repeat(70));
  log("FHEVM Bootcamp — On-Chain Verification (35 contracts, 35 scenarios)");
  log("=".repeat(70));
  log(`Network:  Ethereum Sepolia (chainId: 11155111)`);
  log(`Deployer: ${deployer.address}`);
  const startBalance = await deployer.provider.getBalance(deployer.address);
  log(`Balance:  ${ethers.formatEther(startBalance)} ETH\n`);

  // ════════════════════════════════════════════════════════════════════
  // PHASE 1 — Foundation (Modules 00-03)
  // ════════════════════════════════════════════════════════════════════
  log("━━━ Phase 1: Foundation ━━━");

  // 1. SimpleStorage
  log("\n[00] SimpleStorage");
  try {
    const c = await deploy("SimpleStorage");
    const tx = await c.set(42);
    await tx.wait();
    const val = await c.get();
    if (val.toString() === "42") pass("SimpleStorage", "00", await c.getAddress(), tx.hash, `set(42) → get()=${val}`);
    else fail("SimpleStorage", "00", await c.getAddress(), `Expected 42, got ${val}`);
  } catch (e: any) { error("SimpleStorage", "00", e.message.slice(0, 150)); }

  // 2. BasicToken
  log("\n[00] BasicToken");
  try {
    const c = await deploy("BasicToken", ["BootcampToken", "BCT", 18]);
    const tx = await c.mint(deployer.address, 1000000);
    await tx.wait();
    const name = await c.name();
    const supply = await c.totalSupply();
    if (name === "BootcampToken" && supply > 0n)
      pass("BasicToken", "00", await c.getAddress(), tx.hash, `mint(1M) → name=${name}, totalSupply=${supply}`);
    else fail("BasicToken", "00", await c.getAddress(), `name=${name}, supply=${supply}`);
  } catch (e: any) { error("BasicToken", "00", e.message.slice(0, 150)); }

  // 3. HelloFHEVM
  log("\n[02] HelloFHEVM");
  try {
    const c = await deploy("HelloFHEVM");
    pass("HelloFHEVM", "02", await c.getAddress(), "", "Deployed (increment requires encrypted input)");
  } catch (e: any) { error("HelloFHEVM", "02", e.message.slice(0, 150)); }

  // 4. EncryptedTypes
  log("\n[03] EncryptedTypes");
  try {
    const c = await deploy("EncryptedTypes");
    const tx = await c.setUint32(123456);
    await tx.wait();
    const handle = await c.getUint32();
    if (handle.toString() !== "0")
      pass("EncryptedTypes", "03", await c.getAddress(), tx.hash, "setUint32(123456) → handle non-zero");
    else fail("EncryptedTypes", "03", await c.getAddress(), "Handle is 0");
  } catch (e: any) { error("EncryptedTypes", "03", e.message.slice(0, 150)); }

  // 5. TypeConversions
  log("\n[03] TypeConversions");
  try {
    const c = await deploy("TypeConversions");
    const tx = await c.upcast8to32(42);
    await tx.wait();
    const handle = await c.getResult32();
    if (handle.toString() !== "0")
      pass("TypeConversions", "03", await c.getAddress(), tx.hash, "upcast8to32(42) → handle non-zero");
    else fail("TypeConversions", "03", await c.getAddress(), "Handle is 0");
  } catch (e: any) { error("TypeConversions", "03", e.message.slice(0, 150)); }

  // ════════════════════════════════════════════════════════════════════
  // PHASE 2 — Core (Modules 04-09)
  // ════════════════════════════════════════════════════════════════════
  log("\n━━━ Phase 2: Core ━━━");

  // 6. ArithmeticOps
  log("\n[04] ArithmeticOps");
  try {
    const c = await deploy("ArithmeticOps");
    const tx = await c.addPlaintext(10, 20);
    await tx.wait();
    const handle = await c.getResult();
    if (handle.toString() !== "0")
      pass("ArithmeticOps", "04", await c.getAddress(), tx.hash, "addPlaintext(10,20) → handle non-zero");
    else fail("ArithmeticOps", "04", await c.getAddress(), "Handle is 0");
  } catch (e: any) { error("ArithmeticOps", "04", e.message.slice(0, 150)); }

  // 7. BitwiseOps
  log("\n[04] BitwiseOps");
  try {
    const c = await deploy("BitwiseOps");
    const tx = await c.andOp(0xFF, 0x0F);
    await tx.wait();
    const handle = await c.getResult();
    if (handle.toString() !== "0")
      pass("BitwiseOps", "04", await c.getAddress(), tx.hash, "andOp(0xFF,0x0F) → handle non-zero");
    else fail("BitwiseOps", "04", await c.getAddress(), "Handle is 0");
  } catch (e: any) { error("BitwiseOps", "04", e.message.slice(0, 150)); }

  // 8. ComparisonOps
  log("\n[04] ComparisonOps");
  try {
    const c = await deploy("ComparisonOps");
    const tx = await c.gtOp(100, 50);
    await tx.wait();
    const handle = await c.getResult();
    if (handle.toString() !== "0")
      pass("ComparisonOps", "04", await c.getAddress(), tx.hash, "gtOp(100,50) → handle non-zero");
    else fail("ComparisonOps", "04", await c.getAddress(), "Handle is 0");
  } catch (e: any) { error("ComparisonOps", "04", e.message.slice(0, 150)); }

  // 9. ACLDemo
  log("\n[05] ACLDemo");
  try {
    const c = await deploy("ACLDemo");
    const tx = await c.setSecret(777);
    await tx.wait();
    const handle = await c.getSecret();
    if (handle.toString() !== "0")
      pass("ACLDemo", "05", await c.getAddress(), tx.hash, "setSecret(777) → getSecret handle non-zero");
    else fail("ACLDemo", "05", await c.getAddress(), "Handle is 0");
  } catch (e: any) { error("ACLDemo", "05", e.message.slice(0, 150)); }

  // 10. MultiUserVault
  log("\n[05] MultiUserVault");
  try {
    const c = await deploy("MultiUserVault");
    pass("MultiUserVault", "05", await c.getAddress(), "", "Deployed (requires encrypted inputs for deposit)");
  } catch (e: any) { error("MultiUserVault", "05", e.message.slice(0, 150)); }

  // 11. SecureInput
  log("\n[06] SecureInput");
  try {
    const c = await deploy("SecureInput");
    pass("SecureInput", "06", await c.getAddress(), "", "Deployed (requires encrypted inputs for store)");
  } catch (e: any) { error("SecureInput", "06", e.message.slice(0, 150)); }

  // 12. PublicDecrypt
  log("\n[07] PublicDecrypt");
  try {
    const c = await deploy("PublicDecrypt");
    const tx = await c.setValue(99);
    await tx.wait();
    const handle = await c.getEncryptedValue();
    if (handle.toString() !== "0")
      pass("PublicDecrypt", "07", await c.getAddress(), tx.hash, "setValue(99) → handle non-zero");
    else fail("PublicDecrypt", "07", await c.getAddress(), "Handle is 0");
  } catch (e: any) { error("PublicDecrypt", "07", e.message.slice(0, 150)); }

  // 13. UserDecrypt
  log("\n[07] UserDecrypt");
  try {
    const c = await deploy("UserDecrypt");
    pass("UserDecrypt", "07", await c.getAddress(), "", "Deployed (requires encrypted inputs for storeSecret)");
  } catch (e: any) { error("UserDecrypt", "07", e.message.slice(0, 150)); }

  // 14. ConditionalDemo
  log("\n[08] ConditionalDemo");
  try {
    const c = await deploy("ConditionalDemo");
    const tx = await c.selectDemo(100, 200, true);
    await tx.wait();
    const handle = await c.getResult();
    if (handle.toString() !== "0")
      pass("ConditionalDemo", "08", await c.getAddress(), tx.hash, "selectDemo(100,200,true) → handle non-zero");
    else fail("ConditionalDemo", "08", await c.getAddress(), "Handle is 0");
  } catch (e: any) { error("ConditionalDemo", "08", e.message.slice(0, 150)); }

  // 15. EncryptedMinMax
  log("\n[08] EncryptedMinMax");
  try {
    const c = await deploy("EncryptedMinMax");
    const tx = await c.findMin(30, 50);
    await tx.wait();
    const handle = await c.getResultA();
    if (handle.toString() !== "0")
      pass("EncryptedMinMax", "08", await c.getAddress(), tx.hash, "findMin(30,50) → handle non-zero");
    else fail("EncryptedMinMax", "08", await c.getAddress(), "Handle is 0");
  } catch (e: any) { error("EncryptedMinMax", "08", e.message.slice(0, 150)); }

  // 16. RandomDemo
  log("\n[09] RandomDemo");
  try {
    const c = await deploy("RandomDemo");
    const tx = await c.generateRandom32();
    await tx.wait();
    const handle = await c.getRandom32();
    if (handle.toString() !== "0")
      pass("RandomDemo", "09", await c.getAddress(), tx.hash, "generateRandom32 → handle non-zero");
    else fail("RandomDemo", "09", await c.getAddress(), "Handle is 0");
  } catch (e: any) { error("RandomDemo", "09", e.message.slice(0, 150)); }

  // ════════════════════════════════════════════════════════════════════
  // PHASE 3 — Applications (Modules 10-13)
  // ════════════════════════════════════════════════════════════════════
  log("\n━━━ Phase 3: Applications ━━━");

  // 17. SimpleCounter
  log("\n[10] SimpleCounter");
  try {
    const c = await deploy("SimpleCounter");
    pass("SimpleCounter", "10", await c.getAddress(), "", "Deployed (requires encrypted inputs for increment)");
  } catch (e: any) { error("SimpleCounter", "10", e.message.slice(0, 150)); }

  // 18. ConfidentialERC20
  log("\n[11] ConfidentialERC20");
  try {
    const c = await deploy("ConfidentialERC20", ["ConfToken", "CFT"]);
    const tx = await c.mint(deployer.address, 1000000);
    await tx.wait();
    const handle = await c.balanceOf(deployer.address);
    const supply = await c.totalSupply();
    if (handle.toString() !== "0" && supply.toString() === "1000000")
      pass("ConfidentialERC20", "11", await c.getAddress(), tx.hash, `mint(1M) → totalSupply=${supply}, balance handle non-zero`);
    else fail("ConfidentialERC20", "11", await c.getAddress(), `supply=${supply}, handle=${handle}`);
  } catch (e: any) { error("ConfidentialERC20", "11", e.message.slice(0, 150)); }

  // 19. ConfidentialVoting
  log("\n[12] ConfidentialVoting");
  try {
    const c = await deploy("ConfidentialVoting");
    const tx = await c.createProposal("Fund dev team?", 3600);
    await tx.wait();
    const count = await c.proposalCount();
    if (count.toString() === "1")
      pass("ConfidentialVoting", "12", await c.getAddress(), tx.hash, `createProposal → proposalCount=${count}`);
    else fail("ConfidentialVoting", "12", await c.getAddress(), `proposalCount=${count}`);
  } catch (e: any) { error("ConfidentialVoting", "12", e.message.slice(0, 150)); }

  // 20. PrivateVoting
  log("\n[12] PrivateVoting");
  try {
    const c = await deploy("PrivateVoting", [3]);
    const count = await c.candidateCount();
    if (count.toString() === "3")
      pass("PrivateVoting", "12", await c.getAddress(), "", `candidateCount=${count}`);
    else fail("PrivateVoting", "12", await c.getAddress(), `candidateCount=${count}`);
  } catch (e: any) { error("PrivateVoting", "12", e.message.slice(0, 150)); }

  // 21. SealedBidAuction
  log("\n[13] SealedBidAuction");
  try {
    const c = await deploy("SealedBidAuction");
    const tx = await c.createAuction("Rare NFT", 3600, 100);
    await tx.wait();
    const count = await c.auctionCount();
    if (count.toString() === "1")
      pass("SealedBidAuction", "13", await c.getAddress(), tx.hash, `createAuction → auctionCount=${count}`);
    else fail("SealedBidAuction", "13", await c.getAddress(), `auctionCount=${count}`);
  } catch (e: any) { error("SealedBidAuction", "13", e.message.slice(0, 150)); }

  // 22. RevealableAuction
  log("\n[13] RevealableAuction");
  try {
    const c = await deploy("RevealableAuction");
    pass("RevealableAuction", "13", await c.getAddress(), "", "Deployed (submitBid requires encrypted input)");
  } catch (e: any) { error("RevealableAuction", "13", e.message.slice(0, 150)); }

  // 23. EncryptedMarketplace
  log("\n[13] EncryptedMarketplace");
  try {
    const c = await deploy("EncryptedMarketplace");
    const tx1 = await c.deposit(500);
    await tx1.wait();
    const tx2 = await c.listItem(100, 10);
    await tx2.wait();
    const exists = await c.itemExists(0);
    if (exists)
      pass("EncryptedMarketplace", "13", await c.getAddress(), tx2.hash, "deposit(500) + listItem(100,10) → item exists");
    else fail("EncryptedMarketplace", "13", await c.getAddress(), "Item does not exist");
  } catch (e: any) { error("EncryptedMarketplace", "13", e.message.slice(0, 150)); }

  // 24. EncryptedLottery
  log("\n[09] EncryptedLottery");
  try {
    const c = await deploy("EncryptedLottery", [ethers.parseEther("0.001"), 3600]);
    const tx = await c.buyTicket({ value: ethers.parseEther("0.001") });
    await tx.wait();
    const hasT = await c.hasTicket(deployer.address);
    const pool = await c.getPrizePool();
    if (hasT)
      pass("EncryptedLottery", "09", await c.getAddress(), tx.hash, `buyTicket → hasTicket=true, pool=${ethers.formatEther(pool)} ETH`);
    else fail("EncryptedLottery", "09", await c.getAddress(), "hasTicket is false");
  } catch (e: any) { error("EncryptedLottery", "09", e.message.slice(0, 150)); }

  // ════════════════════════════════════════════════════════════════════
  // PHASE 4 — Mastery (Modules 14-18)
  // ════════════════════════════════════════════════════════════════════
  log("\n━━━ Phase 4: Mastery ━━━");

  // 25. TestableVault
  log("\n[14] TestableVault");
  try {
    const c = await deploy("TestableVault");
    const owner = await c.owner();
    if (owner.toLowerCase() === deployer.address.toLowerCase())
      pass("TestableVault", "14", await c.getAddress(), "", `owner=${owner} matches deployer`);
    else fail("TestableVault", "14", await c.getAddress(), `owner=${owner}`);
  } catch (e: any) { error("TestableVault", "14", e.message.slice(0, 150)); }

  // 26. GasOptimized
  log("\n[15] GasOptimized");
  try {
    const c = await deploy("GasOptimized");
    const tx = await c.optimized_plaintextOperand(42);
    await tx.wait();
    const handle = await c.getResult32();
    if (handle.toString() !== "0")
      pass("GasOptimized", "15", await c.getAddress(), tx.hash, "optimized_plaintextOperand(42) → handle non-zero");
    else fail("GasOptimized", "15", await c.getAddress(), "Handle is 0");
  } catch (e: any) { error("GasOptimized", "15", e.message.slice(0, 150)); }

  // 27. GasBenchmark
  log("\n[15] GasBenchmark");
  try {
    const c = await deploy("GasBenchmark");
    const tx1 = await c.benchmarkAdd32(100, 200);
    await tx1.wait();
    const tx2 = await c.benchmarkMul32(10, 20);
    await tx2.wait();
    const add = await c.getResultAdd32();
    const mul = await c.getResultMul32();
    if (add.toString() !== "0" && mul.toString() !== "0")
      pass("GasBenchmark", "15", await c.getAddress(), tx1.hash, "add32(100,200) + mul32(10,20) → handles non-zero");
    else fail("GasBenchmark", "15", await c.getAddress(), `add=${add}, mul=${mul}`);
  } catch (e: any) { error("GasBenchmark", "15", e.message.slice(0, 150)); }

  // 28. SecurityPatterns
  log("\n[16] SecurityPatterns");
  try {
    const c = await deploy("SecurityPatterns", [5, 10]);
    const tx = await c.mint(deployer.address, 1000);
    await tx.wait();
    const handle = await c.getMyBalance();
    if (handle.toString() !== "0")
      pass("SecurityPatterns", "16", await c.getAddress(), tx.hash, "mint(1000) → balance handle non-zero");
    else fail("SecurityPatterns", "16", await c.getAddress(), "Handle is 0");
  } catch (e: any) { error("SecurityPatterns", "16", e.message.slice(0, 150)); }

  // 29. VulnerableDemo
  log("\n[16] VulnerableDemo");
  try {
    const c = await deploy("VulnerableDemo");
    const tx = await c.setupMint(deployer.address, 500);
    await tx.wait();
    const handle = await c.getBalance(deployer.address);
    if (handle.toString() !== "0")
      pass("VulnerableDemo", "16", await c.getAddress(), tx.hash, "setupMint(500) → balance handle non-zero");
    else fail("VulnerableDemo", "16", await c.getAddress(), "Handle is 0");
  } catch (e: any) { error("VulnerableDemo", "16", e.message.slice(0, 150)); }

  // 30. EncryptedStateMachine
  log("\n[17] EncryptedStateMachine");
  try {
    const c = await deploy("EncryptedStateMachine");
    const owner = await c.owner();
    if (owner.toLowerCase() === deployer.address.toLowerCase())
      pass("EncryptedStateMachine", "17", await c.getAddress(), "", `owner=${owner.slice(0, 10)}... matches deployer`);
    else fail("EncryptedStateMachine", "17", await c.getAddress(), `owner=${owner}`);
  } catch (e: any) { error("EncryptedStateMachine", "17", e.message.slice(0, 150)); }

  // 31. LastErrorPattern
  log("\n[17] LastErrorPattern");
  try {
    const c = await deploy("LastErrorPattern", ["ErrorToken", "ERR"]);
    const name = await c.name();
    const symbol = await c.symbol();
    if (name === "ErrorToken" && symbol === "ERR")
      pass("LastErrorPattern", "17", await c.getAddress(), "", `name=${name}, symbol=${symbol}`);
    else fail("LastErrorPattern", "17", await c.getAddress(), `name=${name}, symbol=${symbol}`);
  } catch (e: any) { error("LastErrorPattern", "17", e.message.slice(0, 150)); }

  // 32. EncryptedRegistry
  log("\n[17] EncryptedRegistry");
  try {
    const c = await deploy("EncryptedRegistry");
    const count = await c.getKeyCount();
    if (count.toString() === "0")
      pass("EncryptedRegistry", "17", await c.getAddress(), "", `Deployed, keyCount=${count} (requires encrypted inputs to store)`);
    else fail("EncryptedRegistry", "17", await c.getAddress(), `keyCount=${count}`);
  } catch (e: any) { error("EncryptedRegistry", "17", e.message.slice(0, 150)); }

  // 33. ConfidentialLending
  log("\n[18] ConfidentialLending");
  try {
    const c = await deploy("ConfidentialLending");
    const init = await c.isUserInitialized(deployer.address);
    if (!init)
      pass("ConfidentialLending", "18", await c.getAddress(), "", `Deployed, userInitialized=${init} (requires encrypted inputs)`);
    else fail("ConfidentialLending", "18", await c.getAddress(), `init=${init}`);
  } catch (e: any) { error("ConfidentialLending", "18", e.message.slice(0, 150)); }

  // 34. EncryptedOrderBook
  log("\n[18] EncryptedOrderBook");
  try {
    const c = await deploy("EncryptedOrderBook");
    const count = await c.orderCount();
    const active = await c.activeOrderCount();
    if (count.toString() === "0" && active.toString() === "0")
      pass("EncryptedOrderBook", "18", await c.getAddress(), "", `Deployed, orders=${count}, active=${active}`);
    else fail("EncryptedOrderBook", "18", await c.getAddress(), `count=${count}`);
  } catch (e: any) { error("EncryptedOrderBook", "18", e.message.slice(0, 150)); }

  // ════════════════════════════════════════════════════════════════════
  // PHASE 5 — Capstone (Module 19)
  // ════════════════════════════════════════════════════════════════════
  log("\n━━━ Phase 5: Capstone ━━━");

  // 35. ConfidentialDAO
  log("\n[19] ConfidentialDAO");
  try {
    const c = await deploy("ConfidentialDAO", ["BootcampDAO"]);
    const tx1 = await c.mintTokens(deployer.address, 1000);
    await tx1.wait();
    const supply = await c.totalTokenSupply();
    const tx2 = await c.createProposal(
      "Fund dev team",
      deployer.address,
      ethers.parseEther("0.001"),
      3600
    );
    await tx2.wait();
    const pCount = await c.proposalCount();
    if (supply.toString() === "1000" && pCount.toString() === "1")
      pass("ConfidentialDAO", "19", await c.getAddress(), tx2.hash,
        `mintTokens(1000) → supply=${supply}, createProposal → count=${pCount}`);
    else fail("ConfidentialDAO", "19", await c.getAddress(), `supply=${supply}, pCount=${pCount}`);
  } catch (e: any) { error("ConfidentialDAO", "19", e.message.slice(0, 150)); }

  // ════════════════════════════════════════════════════════════════════
  // RESULTS SUMMARY
  // ════════════════════════════════════════════════════════════════════
  const endBalance = await deployer.provider.getBalance(deployer.address);
  const gasSpent = startBalance - endBalance;

  log("\n" + "=".repeat(70));
  log("ON-CHAIN VERIFICATION RESULTS");
  log("=".repeat(70));
  log(`Network:  Ethereum Sepolia (chainId: 11155111)`);
  log(`Deployer: ${deployer.address}`);
  log(`Gas:      ${ethers.formatEther(gasSpent)} ETH spent\n`);

  let passed = 0, failed = 0, errored = 0;

  log("| # | Module | Contract | Status | Details |");
  log("|---|--------|----------|--------|---------|");
  results.forEach((r, i) => {
    const icon = r.status === "PASS" ? "PASS" : r.status === "FAIL" ? "FAIL" : "ERR ";
    const name = r.scenario;
    const short = (r.details || "").slice(0, 60);
    log(`| ${String(i + 1).padStart(2)} | ${r.module} | ${name} | ${icon} | ${short} |`);
    if (r.status === "PASS") passed++;
    else if (r.status === "FAIL") failed++;
    else errored++;
  });

  log(`\nTotal: ${passed} PASS / ${failed} FAIL / ${errored} ERROR out of ${results.length} scenarios`);
  log(`Remaining balance: ${ethers.formatEther(endBalance)} ETH`);

  // Detailed addresses for ONCHAIN_TESTS.md
  log("\n--- Deployed Addresses (for documentation) ---");
  for (const r of results) {
    if (r.address) log(`${r.scenario}: ${r.address}${r.txHash ? ` (tx: ${r.txHash})` : ""}`);
  }
}

async function deploy(name: string, args?: any[]) {
  const Factory = await ethers.getContractFactory(name);
  const contract = args ? await Factory.deploy(...args) : await Factory.deploy();
  await contract.waitForDeployment();
  const addr = await contract.getAddress();
  log(`  Deployed: ${addr}`);
  return contract;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
