import { ethers } from "hardhat";

/**
 * Deploy key bootcamp contracts to Ethereum Sepolia.
 * Usage: npx hardhat run scripts/deploy-sepolia.ts --network sepolia
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("=".repeat(60));
  console.log("FHEVM Bootcamp - Sepolia Deployment");
  console.log("=".repeat(60));
  console.log("Deployer:", deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  console.log("");

  // Deploy key contracts (representative subset to save gas)
  const contracts: { name: string; args?: any[]; module: string }[] = [
    { name: "SimpleStorage", module: "00" },
    { name: "HelloFHEVM", module: "02" },
    { name: "EncryptedTypes", module: "03" },
    { name: "ArithmeticOps", module: "04" },
    { name: "ComparisonOps", module: "04" },
    { name: "ACLDemo", module: "05" },
    { name: "ConditionalDemo", module: "08" },
    { name: "RandomDemo", module: "09" },
    { name: "ConfidentialERC20", args: ["ConfToken", "CFT"], module: "11" },
    { name: "ConfidentialVoting", module: "12" },
    { name: "SealedBidAuction", module: "13" },
  ];

  const deployed: Record<string, string> = {};
  const txHashes: Record<string, string> = {};

  for (const { name, args, module } of contracts) {
    try {
      console.log(`[Module ${module}] Deploying ${name}...`);
      const Factory = await ethers.getContractFactory(name);
      const contract = args ? await Factory.deploy(...args) : await Factory.deploy();
      const tx = contract.deploymentTransaction();
      console.log(`  tx: ${tx?.hash}`);

      await contract.waitForDeployment();
      const address = await contract.getAddress();
      deployed[name] = address;
      if (tx?.hash) txHashes[name] = tx.hash;
      console.log(`  deployed: ${address}`);
      console.log("");
    } catch (error: any) {
      console.error(`  FAILED: ${error.message.slice(0, 200)}`);
      console.log("");
    }
  }

  // Print summary
  console.log("=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log(`Network: Ethereum Sepolia (chainId: 11155111)`);
  console.log(`Deployer: ${deployer.address}`);
  console.log("");

  console.log("| Contract | Address | Tx Hash |");
  console.log("|----------|---------|---------|");
  for (const [name, address] of Object.entries(deployed)) {
    const txHash = txHashes[name] || "N/A";
    const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
    const shortTx = txHash !== "N/A" ? `${txHash.slice(0, 10)}...` : "N/A";
    console.log(`| ${name} | ${shortAddr} | ${shortTx} |`);
  }

  console.log(`\nTotal: ${Object.keys(deployed).length}/${contracts.length} deployed`);

  const balanceAfter = await deployer.provider.getBalance(deployer.address);
  const gasUsed = balance - balanceAfter;
  console.log(`Gas spent: ${ethers.formatEther(gasUsed)} ETH`);
  console.log(`Remaining balance: ${ethers.formatEther(balanceAfter)} ETH`);

  // Return deployed addresses for test script
  return deployed;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
