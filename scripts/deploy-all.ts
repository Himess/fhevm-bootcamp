import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const contracts: { name: string; args?: any[] }[] = [
    { name: "SimpleStorage" },
    { name: "BasicToken", args: ["BootcampToken", "BCT", 18] },
    { name: "HelloFHEVM" },
    { name: "EncryptedTypes" },
    { name: "TypeConversions" },
    { name: "ArithmeticOps" },
    { name: "BitwiseOps" },
    { name: "ComparisonOps" },
    { name: "ACLDemo" },
    { name: "MultiUserVault" },
    { name: "SecureInput" },
    { name: "PublicDecrypt" },
    { name: "UserDecrypt" },
    { name: "ConditionalDemo" },
    { name: "EncryptedMinMax" },
    { name: "RandomDemo" },
    { name: "SimpleCounter" },
    { name: "ConfidentialERC20", args: ["ConfToken", "CFT"] },
    { name: "ConfidentialVoting" },
    { name: "SealedBidAuction" },
    { name: "EncryptedLottery", args: [ethers.parseEther("0.01"), 3600] },
    { name: "EncryptedMarketplace" },
    { name: "PrivateVoting", args: [3] },
    { name: "RevealableAuction" },
    { name: "ConfidentialDAO", args: ["BootcampDAO"] },
  ];

  const deployed: Record<string, string> = {};

  for (const { name, args } of contracts) {
    try {
      const Factory = await ethers.getContractFactory(name);
      const contract = args ? await Factory.deploy(...args) : await Factory.deploy();
      await contract.waitForDeployment();
      const address = await contract.getAddress();
      deployed[name] = address;
      console.log(`  ${name} deployed to: ${address}`);
    } catch (error: any) {
      console.error(`  Failed to deploy ${name}: ${error.message}`);
    }
  }

  console.log("\n--- Deployment Summary ---");
  for (const [name, address] of Object.entries(deployed)) {
    console.log(`${name}: ${address}`);
  }
  console.log(`\nTotal: ${Object.keys(deployed).length}/${contracts.length} deployed`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
