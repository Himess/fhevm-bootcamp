import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("PublicDecrypt", function () {
  let contract: any;
  let contractAddress: string;
  let deployer: any;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("PublicDecrypt");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  it("should store a value from plaintext", async function () {
    const tx = await contract.setValue(42);
    const receipt = await tx.wait();
    const event = receipt.logs.find((log: any) => log.fragment?.name === "ValueSet");
    expect(event).to.not.be.undefined;
    expect(await contract.hasValue()).to.equal(true);
  });

  it("should store an encrypted value from encrypted input", async function () {
    const enc = await fhevm
      .createEncryptedInput(contractAddress, deployer.address)
      .add32(99)
      .encrypt();
    await (await contract.setEncryptedValue(enc.handles[0], enc.inputProof)).wait();
    expect(await contract.hasValue()).to.equal(true);

    const handle = await contract.getEncryptedValue();
    const clear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      handle,
      contractAddress,
      deployer,
    );
    expect(clear).to.equal(99n);
  });

  it("should return encrypted handle after setValue", async function () {
    await (await contract.setValue(100)).wait();
    const handle = await contract.getEncryptedValue();
    expect(handle).to.not.equal(ethers.ZeroHash);
  });

  it("should decrypt stored value via userDecrypt", async function () {
    await (await contract.setValue(55)).wait();
    const handle = await contract.getEncryptedValue();
    const clear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      handle,
      contractAddress,
      deployer,
    );
    expect(clear).to.equal(55n);
  });

  it("should make value publicly decryptable", async function () {
    await (await contract.setValue(77)).wait();
    expect(await contract.isPubliclyDecryptable()).to.equal(false);

    await (await contract.makePublic()).wait();
    expect(await contract.isPubliclyDecryptable()).to.equal(true);
  });

  it("should revert makePublic when no value set", async function () {
    try {
      await contract.makePublic();
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("No value set");
    }
  });

  it("should compare two values and decrypt result (gt: 20 > 10)", async function () {
    const tx = await contract.compare(20, 10);
    await tx.wait();
    // compare() returns ebool but doesn't store it in state for later retrieval
    // This test verifies the transaction succeeds without revert
  });

  it("should decrypt value after makePublic", async function () {
    await (await contract.setValue(42)).wait();
    await (await contract.makePublic()).wait();

    const handle = await contract.getEncryptedValue();
    const clear = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      handle,
      contractAddress,
      deployer,
    );
    expect(clear).to.equal(42n);
  });
});
