import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("ACLDemo", function () {
  let contract: any;
  let contractAddress: string;
  let owner: any;
  let alice: any;

  beforeEach(async function () {
    [owner, alice] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ACLDemo");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  it("should set deployer as owner", async function () {
    expect(await contract.owner()).to.equal(owner.address);
  });

  it("should allow owner to set secret", async function () {
    const tx = await contract.setSecret(42);
    const receipt = await tx.wait();
    const event = receipt.logs.find((log: any) => log.fragment?.name === "SecretUpdated");
    expect(event).to.not.be.undefined;
  });

  it("should decrypt secret for owner", async function () {
    await (await contract.setSecret(42)).wait();
    const handle = await contract.getSecret();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, owner);
    expect(clear).to.equal(42n);
  });

  it("should grant access to another user", async function () {
    await (await contract.setSecret(99)).wait();
    const tx = await contract.grantAccess(alice.address);
    const receipt = await tx.wait();
    const event = receipt.logs.find((log: any) => log.fragment?.name === "AccessGranted");
    expect(event).to.not.be.undefined;
  });

  it("should allow granted user to decrypt secret", async function () {
    await (await contract.setSecret(77)).wait();
    await (await contract.grantAccess(alice.address)).wait();
    const handle = await contract.getSecret();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, alice);
    expect(clear).to.equal(77n);
  });

  it("should reject non-owner from setting secret", async function () {
    try {
      await contract.connect(alice).setSecret(42);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Not the owner");
    }
  });

  it("owner should have access after setting secret", async function () {
    await (await contract.setSecret(10)).wait();
    const hasAccess = await contract.checkAccess();
    expect(hasAccess).to.equal(true);
  });

  it("should increment secret and maintain owner access", async function () {
    await (await contract.setSecret(100)).wait();
    await (await contract.incrementSecret()).wait();
    const handle = await contract.getSecret();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, owner);
    expect(clear).to.equal(101n);
  });

  it("should lose granted access after increment (ACL reset)", async function () {
    await (await contract.setSecret(50)).wait();
    await (await contract.grantAccess(alice.address)).wait();
    // Alice can access before increment
    const canAccess = await contract.connect(alice).checkAccess();
    expect(canAccess).to.equal(true);
    // Owner increments — new handle, old ACL gone
    await (await contract.incrementSecret()).wait();
    // Alice should NOT have access to the NEW handle
    const canAccessAfter = await contract.connect(alice).checkAccess();
    expect(canAccessAfter).to.equal(false);
  });

  it("should make secret publicly decryptable", async function () {
    await (await contract.setSecret(42)).wait();
    await (await contract.makePublic()).wait();
    // After makePubliclyDecryptable, the value should be decryptable
    const handle = await contract.getSecret();
    expect(handle).to.not.equal(0n);
  });
});
