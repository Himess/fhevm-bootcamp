import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("RandomDemo", function () {
  let contract: any;
  let contractAddress: string;
  let deployer: any;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("RandomDemo");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  it("should generate random uint8", async function () {
    const tx = await contract.generateRandom8();
    const receipt = await tx.wait();
    const event = receipt.logs.find((log: any) => log.fragment?.name === "RandomGenerated");
    expect(event).to.not.be.undefined;

    const handle = await contract.getRandom8();
    expect(handle).to.not.equal(ethers.ZeroHash);
  });

  it("should generate random uint32", async function () {
    await (await contract.generateRandom32()).wait();
    const handle = await contract.getRandom32();
    expect(handle).to.not.equal(ethers.ZeroHash);
  });

  it("should generate random uint64", async function () {
    await (await contract.generateRandom64()).wait();
    const handle = await contract.getRandom64();
    expect(handle).to.not.equal(ethers.ZeroHash);
  });

  it("should generate random in range", async function () {
    await (await contract.randomInRange(100)).wait();
    const handle = await contract.getRandom32();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(Number(clear)).to.be.lessThan(100);
  });

  it("should reject range with max=0", async function () {
    try {
      await contract.randomInRange(0);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Max must be > 0");
    }
  });
});
