import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("TypeConversions", function () {
  let contract: any;
  let contractAddress: string;
  let deployer: any;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("TypeConversions");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  it("should upcast euint8 to euint32", async function () {
    await (await contract.upcast8to32(42)).wait();
    const handle = await contract.getResult32();
    const clear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      handle,
      contractAddress,
      deployer,
    );
    expect(clear).to.equal(42n);
  });

  it("should upcast euint16 to euint64", async function () {
    await (await contract.upcast16to64(1000)).wait();
    const handle = await contract.getResult64();
    const clear = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      handle,
      contractAddress,
      deployer,
    );
    expect(clear).to.equal(1000n);
  });

  it("should compare equal values (returns true)", async function () {
    await (await contract.compareEqual(100, 100)).wait();
    const handle = await contract.getResultBool();
    const clear = await fhevm.userDecryptEbool(handle, contractAddress, deployer);
    expect(clear).to.equal(true);
  });

  it("should compare different values (returns false)", async function () {
    await (await contract.compareEqual(100, 200)).wait();
    const handle = await contract.getResultBool();
    const clear = await fhevm.userDecryptEbool(handle, contractAddress, deployer);
    expect(clear).to.equal(false);
  });

  it("should convert plaintext to encrypted", async function () {
    await (await contract.plaintextToEncrypted(999)).wait();
    const handle = await contract.getResult32();
    const clear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      handle,
      contractAddress,
      deployer,
    );
    expect(clear).to.equal(999n);
  });

  it("should handle zero value upcast", async function () {
    await (await contract.upcast8to32(0)).wait();
    const handle = await contract.getResult32();
    const clear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      handle,
      contractAddress,
      deployer,
    );
    expect(clear).to.equal(0n);
  });

  it("should handle max uint8 upcast", async function () {
    await (await contract.upcast8to32(255)).wait();
    const handle = await contract.getResult32();
    const clear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      handle,
      contractAddress,
      deployer,
    );
    expect(clear).to.equal(255n);
  });
});
