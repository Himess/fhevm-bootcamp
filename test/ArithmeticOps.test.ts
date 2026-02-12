import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("ArithmeticOps", function () {
  let contract: any;
  let contractAddress: string;
  let deployer: any;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ArithmeticOps");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  it("should add two encrypted values", async function () {
    await (await contract.addEncrypted(10, 20)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(30n);
  });

  it("should add encrypted + plaintext", async function () {
    await (await contract.addPlaintext(15, 25)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(40n);
  });

  it("should subtract two encrypted values", async function () {
    await (await contract.subEncrypted(50, 20)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(30n);
  });

  it("should multiply two encrypted values", async function () {
    await (await contract.mulEncrypted(6, 7)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(42n);
  });

  it("should divide encrypted by plaintext", async function () {
    await (await contract.divByPlaintext(100, 4)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(25n);
  });

  it("should compute remainder", async function () {
    await (await contract.remByPlaintext(17, 5)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(2n);
  });

  it("should find min of two encrypted values", async function () {
    await (await contract.minEncrypted(30, 10)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(10n);
  });

  it("should find max of two encrypted values", async function () {
    await (await contract.maxEncrypted(30, 10)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(30n);
  });

  it("should negate encrypted value", async function () {
    await (await contract.negEncrypted(5)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(4294967291n); // 2^32 - 5
  });

  it("should wrap on underflow (5 - 10)", async function () {
    await (await contract.subEncrypted(5, 10)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(4294967291n); // 2^32 - 5
  });

  it("should wrap on overflow (max + 1)", async function () {
    await (await contract.addEncrypted(4294967295, 1)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(0n);
  });
});
