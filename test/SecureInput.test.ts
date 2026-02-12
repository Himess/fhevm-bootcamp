// Note: In Hardhat tests, `fhevm.createEncryptedInput()` is the equivalent of
// `instance.input.createEncryptedInput()` used in browser/frontend code.
// The functionality is identical — different environments, same API.
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("SecureInput", function () {
  let contract: any;
  let contractAddress: string;
  let deployer: any;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("SecureInput");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  it("should store encrypted uint8", async function () {
    const enc = await fhevm
      .createEncryptedInput(contractAddress, deployer.address)
      .add8(42)
      .encrypt();
    await (await contract.storeUint8(enc.handles[0], enc.inputProof)).wait();

    const handle = await contract.getStoredUint8();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint8, handle, contractAddress, deployer);
    expect(clear).to.equal(42n);
  });

  it("should store encrypted uint32", async function () {
    const enc = await fhevm
      .createEncryptedInput(contractAddress, deployer.address)
      .add32(100000)
      .encrypt();
    await (await contract.storeUint32(enc.handles[0], enc.inputProof)).wait();

    const handle = await contract.getStoredUint32();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(100000n);
  });

  it("should store encrypted uint64", async function () {
    const enc = await fhevm
      .createEncryptedInput(contractAddress, deployer.address)
      .add64(9999999)
      .encrypt();
    await (await contract.storeUint64(enc.handles[0], enc.inputProof)).wait();

    const handle = await contract.getStoredUint64();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint64, handle, contractAddress, deployer);
    expect(clear).to.equal(9999999n);
  });

  it("should store encrypted bool (true)", async function () {
    const enc = await fhevm
      .createEncryptedInput(contractAddress, deployer.address)
      .addBool(true)
      .encrypt();
    await (await contract.storeBool(enc.handles[0], enc.inputProof)).wait();

    const handle = await contract.getStoredBool();
    const clear = await fhevm.userDecryptEbool(handle, contractAddress, deployer);
    expect(clear).to.equal(true);
  });

  it("should store encrypted bool (false)", async function () {
    const enc = await fhevm
      .createEncryptedInput(contractAddress, deployer.address)
      .addBool(false)
      .encrypt();
    await (await contract.storeBool(enc.handles[0], enc.inputProof)).wait();

    const handle = await contract.getStoredBool();
    const clear = await fhevm.userDecryptEbool(handle, contractAddress, deployer);
    expect(clear).to.equal(false);
  });

  it("should store multiple encrypted values with shared proof", async function () {
    const encrypted = await fhevm
      .createEncryptedInput(contractAddress, deployer.address)
      .add32(42)
      .add64(999)
      .encrypt();

    await (
      await contract.storeMultiple(
        encrypted.handles[0],
        encrypted.handles[1],
        encrypted.inputProof
      )
    ).wait();

    const handle32 = await contract.getStoredUint32();
    const clear32 = await fhevm.userDecryptEuint(FhevmType.euint32, handle32, contractAddress, deployer);
    expect(clear32).to.equal(42n);

    const handle64 = await contract.getStoredUint64();
    const clear64 = await fhevm.userDecryptEuint(FhevmType.euint64, handle64, contractAddress, deployer);
    expect(clear64).to.equal(999n);
  });

  it("should emit InputStored event", async function () {
    const enc = await fhevm
      .createEncryptedInput(contractAddress, deployer.address)
      .add32(1)
      .encrypt();
    const tx = await contract.storeUint32(enc.handles[0], enc.inputProof);
    const receipt = await tx.wait();
    const event = receipt.logs.find((log: any) => log.fragment?.name === "InputStored");
    expect(event).to.not.be.undefined;
  });
});
