import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("BitwiseOps", function () {
  let contract: any;
  let contractAddress: string;
  let deployer: any;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("BitwiseOps");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  it("and: 0xFF AND 0x0F should be 0x0F", async function () {
    await (await contract.andOp(0xFF, 0x0F)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(BigInt(0x0F));
  });

  it("or: 0xF0 OR 0x0F should be 0xFF", async function () {
    await (await contract.orOp(0xF0, 0x0F)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(BigInt(0xFF));
  });

  it("xor: 0xFF XOR 0xFF should be 0", async function () {
    await (await contract.xorOp(0xFF, 0xFF)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(0n);
  });

  it("xor: 0xFF XOR 0x00 should be 0xFF", async function () {
    await (await contract.xorOp(0xFF, 0x00)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(BigInt(0xFF));
  });

  it("not: NOT 0 should be max uint32", async function () {
    await (await contract.notOp(0)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(BigInt(0xFFFFFFFF));
  });
});
