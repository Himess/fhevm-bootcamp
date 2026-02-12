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
});
