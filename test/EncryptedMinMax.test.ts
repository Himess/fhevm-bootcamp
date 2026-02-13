import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("EncryptedMinMax", function () {
  let contract: any;
  let contractAddress: string;
  let deployer: any;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("EncryptedMinMax");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  it("should find min of two values", async function () {
    await (await contract.findMin(30, 10)).wait();
    const handle = await contract.getResultA();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(10n);
  });

  it("should find max of two values", async function () {
    await (await contract.findMax(30, 10)).wait();
    const handle = await contract.getResultA();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(30n);
  });

  it("should sort two values", async function () {
    await (await contract.sortTwo(50, 20)).wait();
    const handleA = await contract.getResultA();
    const handleB = await contract.getResultB();
    const clearA = await fhevm.userDecryptEuint(FhevmType.euint32, handleA, contractAddress, deployer);
    const clearB = await fhevm.userDecryptEuint(FhevmType.euint32, handleB, contractAddress, deployer);
    expect(clearA).to.equal(20n); // min
    expect(clearB).to.equal(50n); // max
  });

  it("should find min of three values", async function () {
    await (await contract.findMinOfThree(30, 10, 50)).wait();
    const handle = await contract.getResultA();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(10n);
  });

  it("should handle equal values in min", async function () {
    await (await contract.findMin(42, 42)).wait();
    const handle = await contract.getResultA();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(42n);
  });

  it("findMinBuiltin: should find min of two values", async function () {
    await (await contract.findMinBuiltin(30, 10)).wait();
    const handle = await contract.getResultA();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(10n);
  });

  it("findMaxBuiltin: should find max of two values", async function () {
    await (await contract.findMaxBuiltin(10, 30)).wait();
    const handle = await contract.getResultA();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(30n);
  });

  it("findMax: equal values", async function () {
    await (await contract.findMax(42, 42)).wait();
    const handle = await contract.getResultA();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(42n);
  });

  it("sortTwo: equal values", async function () {
    await (await contract.sortTwo(25, 25)).wait();
    const handleA = await contract.getResultA();
    const handleB = await contract.getResultB();
    const clearA = await fhevm.userDecryptEuint(FhevmType.euint32, handleA, contractAddress, deployer);
    const clearB = await fhevm.userDecryptEuint(FhevmType.euint32, handleB, contractAddress, deployer);
    expect(clearA).to.equal(25n);
    expect(clearB).to.equal(25n);
  });

  it("findMinOfThree: min is third value", async function () {
    await (await contract.findMinOfThree(30, 50, 10)).wait();
    const handle = await contract.getResultA();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(10n);
  });
});
