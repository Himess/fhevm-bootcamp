import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("ComparisonOps", function () {
  let contract: any;
  let contractAddress: string;
  let deployer: any;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ComparisonOps");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  it("eq: equal values should return true", async function () {
    await (await contract.eqOp(42, 42)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEbool(handle, contractAddress, deployer);
    expect(clear).to.equal(true);
  });

  it("eq: different values should return false", async function () {
    await (await contract.eqOp(42, 43)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEbool(handle, contractAddress, deployer);
    expect(clear).to.equal(false);
  });

  it("lt: 10 < 20 should be true", async function () {
    await (await contract.ltOp(10, 20)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEbool(handle, contractAddress, deployer);
    expect(clear).to.equal(true);
  });

  it("gt: 20 > 10 should be true", async function () {
    await (await contract.gtOp(20, 10)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEbool(handle, contractAddress, deployer);
    expect(clear).to.equal(true);
  });

  it("le: 10 <= 10 should be true", async function () {
    await (await contract.leOp(10, 10)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEbool(handle, contractAddress, deployer);
    expect(clear).to.equal(true);
  });

  it("ne: 10 != 20 should be true", async function () {
    await (await contract.neOp(10, 20)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEbool(handle, contractAddress, deployer);
    expect(clear).to.equal(true);
  });
});
