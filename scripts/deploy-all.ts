import { ethers } from "hardhat";

/**
 * Deploy ALL 35 bootcamp contracts to Ethereum Sepolia.
 * Usage: npx hardhat run scripts/deploy-all.ts --network sepolia
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("=".repeat(60));
  console.log("FHEVM Bootcamp — Full Deployment (35 contracts)");
  console.log("=".repeat(60));
  console.log("Deployer:", deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH\n");

  const contracts: { name: string; args?: any[]; module: string }[] = [
    // Phase 1 — Foundation (00-03)
    { name: "SimpleStorage", module: "00" },
    { name: "BasicToken", args: ["BootcampToken", "BCT", 18], module: "00" },
    { name: "HelloFHEVM", module: "02" },
    { name: "EncryptedTypes", module: "03" },
    { name: "TypeConversions", module: "03" },

    // Phase 2 — Core (04-09)
    { name: "ArithmeticOps", module: "04" },
    { name: "BitwiseOps", module: "04" },
    { name: "ComparisonOps", module: "04" },
    { name: "ACLDemo", module: "05" },
    { name: "MultiUserVault", module: "05" },
    { name: "SecureInput", module: "06" },
    { name: "PublicDecrypt", module: "07" },
    { name: "UserDecrypt", module: "07" },
    { name: "ConditionalDemo", module: "08" },
    { name: "EncryptedMinMax", module: "08" },
    { name: "RandomDemo", module: "09" },

    // Phase 3 — Applications (10-13)
    { name: "SimpleCounter", module: "10" },
    { name: "ConfidentialERC20", args: ["ConfToken", "CFT"], module: "11" },
    { name: "ConfidentialVoting", module: "12" },
    { name: "PrivateVoting", args: [3], module: "12" },
    { name: "SealedBidAuction", module: "13" },
    { name: "RevealableAuction", module: "13" },
    { name: "EncryptedMarketplace", module: "13" },
    { name: "EncryptedLottery", args: [ethers.parseEther("0.001"), 3600], module: "09" },

    // Phase 4 — Mastery (14-18)
    { name: "TestableVault", module: "14" },
    { name: "GasOptimized", module: "15" },
    { name: "GasBenchmark", module: "15" },
    { name: "SecurityPatterns", args: [5, 10], module: "16" },
    { name: "VulnerableDemo", module: "16" },
    { name: "EncryptedStateMachine", module: "17" },
    { name: "LastErrorPattern", args: ["ErrorToken", "ERR"], module: "17" },
    { name: "EncryptedRegistry", module: "17" },
    { name: "ConfidentialLending", module: "18" },
    { name: "EncryptedOrderBook", module: "18" },

    // Phase 5 — Capstone (19)
    { name: "ConfidentialDAO", args: ["BootcampDAO"], module: "19" },
  ];

  const deployed: Record<string, { address: string; txHash: string; module: string }> = {};
  let failed = 0;

  for (const { name, args, module: mod } of contracts) {
    try {
      process.stdout.write(`[Module ${mod}] ${name}...`);
      const Factory = await ethers.getContractFactory(name);
      const contract = args ? await Factory.deploy(...args) : await Factory.deploy();
      const tx = contract.deploymentTransaction();
      await contract.waitForDeployment();
      const address = await contract.getAddress();
      deployed[name] = { address, txHash: tx?.hash || "", module: mod };
      console.log(` ${address}`);
    } catch (error: any) {
      console.log(` FAILED: ${error.message.slice(0, 120)}`);
      failed++;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log(`Network: Ethereum Sepolia (chainId: 11155111)`);
  console.log(`Deployer: ${deployer.address}\n`);

  console.log("| Contract | Module | Address | Tx Hash |");
  console.log("|----------|--------|---------|---------|");
  for (const [name, info] of Object.entries(deployed)) {
    const shortTx = info.txHash ? `${info.txHash.slice(0, 10)}...` : "N/A";
    console.log(`| ${name} | ${info.module} | \`${info.address}\` | ${shortTx} |`);
  }

  const balanceAfter = await deployer.provider.getBalance(deployer.address);
  const gasSpent = balance - balanceAfter;
  console.log(`\nDeployed: ${Object.keys(deployed).length}/${contracts.length} (${failed} failed)`);
  console.log(`Gas spent: ${ethers.formatEther(gasSpent)} ETH`);
  console.log(`Remaining: ${ethers.formatEther(balanceAfter)} ETH`);

  return deployed;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
