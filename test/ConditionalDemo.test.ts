import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("ConditionalDemo", function () {
  let contract: any;
  let contractAddress: string;
  let deployer: any;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ConditionalDemo");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  it("select: condition true returns first value", async function () {
    await (await contract.selectDemo(10, 20, true)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(10n);
  });

  it("select: condition false returns second value", async function () {
    await (await contract.selectDemo(10, 20, false)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(20n);
  });

  it("clamp: value within range stays same", async function () {
    await (await contract.clampValue(50, 10, 100)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(50n);
  });

  it("clamp: value above max becomes max", async function () {
    await (await contract.clampValue(150, 10, 100)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(100n);
  });

  it("clamp: value below min becomes min", async function () {
    await (await contract.clampValue(5, 10, 100)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(10n);
  });
});
