import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("EncryptedTypes", function () {
  let contract: any;
  let contractAddress: string;
  let deployer: any;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("EncryptedTypes");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  it("should set and get encrypted uint8", async function () {
    await (await contract.setUint8(42)).wait();
    const handle = await contract.getUint8();
    expect(handle).to.not.equal(ethers.ZeroHash);

    const clear = await fhevm.userDecryptEuint(FhevmType.euint8, handle, contractAddress, deployer);
    expect(clear).to.equal(42n);
  });

  it("should set and get encrypted uint16", async function () {
    await (await contract.setUint16(1000)).wait();
    const handle = await contract.getUint16();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint16, handle, contractAddress, deployer);
    expect(clear).to.equal(1000n);
  });

  it("should set and get encrypted uint32", async function () {
    await (await contract.setUint32(123456)).wait();
    const handle = await contract.getUint32();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(123456n);
  });

  it("should set and get encrypted uint64", async function () {
    await (await contract.setUint64(9999999)).wait();
    const handle = await contract.getUint64();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint64, handle, contractAddress, deployer);
    expect(clear).to.equal(9999999n);
  });

  it("should handle zero values", async function () {
    await (await contract.setUint32(0)).wait();
    const handle = await contract.getUint32();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(0n);
  });

  it("should handle max uint8 value", async function () {
    await (await contract.setUint8(255)).wait();
    const handle = await contract.getUint8();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint8, handle, contractAddress, deployer);
    expect(clear).to.equal(255n);
  });

  it("should set and get encrypted bool (true)", async function () {
    await (await contract.setBool(true)).wait();
    const handle = await contract.getBool();
    expect(handle).to.not.equal(ethers.ZeroHash);
    const clear = await fhevm.userDecryptEbool(handle, contractAddress, deployer);
    expect(clear).to.equal(true);
  });

  it("should set and get encrypted bool (false)", async function () {
    await (await contract.setBool(false)).wait();
    const handle = await contract.getBool();
    const clear = await fhevm.userDecryptEbool(handle, contractAddress, deployer);
    expect(clear).to.equal(false);
  });

  it("should set and get encrypted address", async function () {
    const testAddr = "0x1234567890AbcdEF1234567890aBcdef12345678";
    await (await contract.setAddress(testAddr)).wait();
    // Use getFunction to avoid collision with ethers.js built-in getAddress()
    const handle = await contract.getFunction("getAddress")();
    expect(handle).to.not.equal(ethers.ZeroHash);
    const clear = await fhevm.userDecryptEaddress(handle, contractAddress, deployer);
    expect(clear.toLowerCase()).to.equal(testAddr.toLowerCase());
  });

  it("should set and get encrypted uint128", async function () {
    await (await contract.setUint128(12345)).wait();
    const handle = await contract.getUint128();
    expect(handle).to.not.equal(ethers.ZeroHash);
    const clear = await fhevm.userDecryptEuint(FhevmType.euint128, handle, contractAddress, deployer);
    expect(clear).to.equal(12345n);
  });

  it("should set and get encrypted uint256", async function () {
    await (await contract.setUint256(99999)).wait();
    const handle = await contract.getUint256();
    expect(handle).to.not.equal(ethers.ZeroHash);
    const clear = await fhevm.userDecryptEuint(FhevmType.euint256, handle, contractAddress, deployer);
    expect(clear).to.equal(99999n);
  });
});
