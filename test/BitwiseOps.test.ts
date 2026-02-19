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
    await (await contract.andOp(0xff, 0x0f)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      handle,
      contractAddress,
      deployer,
    );
    expect(clear).to.equal(BigInt(0x0f));
  });

  it("or: 0xF0 OR 0x0F should be 0xFF", async function () {
    await (await contract.orOp(0xf0, 0x0f)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      handle,
      contractAddress,
      deployer,
    );
    expect(clear).to.equal(BigInt(0xff));
  });

  it("xor: 0xFF XOR 0xFF should be 0", async function () {
    await (await contract.xorOp(0xff, 0xff)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      handle,
      contractAddress,
      deployer,
    );
    expect(clear).to.equal(0n);
  });

  it("xor: 0xFF XOR 0x00 should be 0xFF", async function () {
    await (await contract.xorOp(0xff, 0x00)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      handle,
      contractAddress,
      deployer,
    );
    expect(clear).to.equal(BigInt(0xff));
  });

  it("not: NOT 0 should be max uint32", async function () {
    await (await contract.notOp(0)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      handle,
      contractAddress,
      deployer,
    );
    expect(clear).to.equal(BigInt(0xffffffff));
  });

  // --- Shift/Rotate Operations ---

  it("shl: 1 << 3 should be 8", async function () {
    await (await contract.shlOp(1, 3)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      handle,
      contractAddress,
      deployer,
    );
    expect(clear).to.equal(8n);
  });

  it("shr: 16 >> 2 should be 4", async function () {
    await (await contract.shrOp(16, 2)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      handle,
      contractAddress,
      deployer,
    );
    expect(clear).to.equal(4n);
  });

  it("rotl: 0x80000001 rotl 1 should be 0x00000003", async function () {
    await (await contract.rotlOp(0x80000001, 1)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      handle,
      contractAddress,
      deployer,
    );
    expect(clear).to.equal(3n);
  });

  it("rotr: 0x00000001 rotr 1 should be 0x80000000", async function () {
    await (await contract.rotrOp(1, 1)).wait();
    const handle = await contract.getResult();
    const clear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      handle,
      contractAddress,
      deployer,
    );
    expect(clear).to.equal(0x80000000n);
  });
});
