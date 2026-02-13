import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("UserDecrypt", function () {
  let contract: any;
  let contractAddress: string;
  let alice: any;
  let bob: any;

  beforeEach(async function () {
    [alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("UserDecrypt");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  it("should store user secret via encrypted input", async function () {
    const enc = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(42)
      .encrypt();
    const tx = await contract.connect(alice).storeSecret(enc.handles[0], enc.inputProof);
    const receipt = await tx.wait();
    const event = receipt.logs.find((log: any) => log.fragment?.name === "SecretStored");
    expect(event).to.not.be.undefined;
  });

  it("should decrypt own secret", async function () {
    const enc = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(123)
      .encrypt();
    await (await contract.connect(alice).storeSecret(enc.handles[0], enc.inputProof)).wait();

    const handle = await contract.connect(alice).getMySecret();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, alice);
    expect(clear).to.equal(123n);
  });

  it("should share secret with another user", async function () {
    const enc = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(999)
      .encrypt();
    await (await contract.connect(alice).storeSecret(enc.handles[0], enc.inputProof)).wait();
    await (await contract.connect(alice).shareSecret(bob.address)).wait();

    // Bob should now have access
    const hasAccess = await contract.connect(bob).canAccess(alice.address);
    expect(hasAccess).to.equal(true);
  });

  it("should allow Bob to decrypt Alice's shared secret", async function () {
    const enc = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(777)
      .encrypt();
    await (await contract.connect(alice).storeSecret(enc.handles[0], enc.inputProof)).wait();
    await (await contract.connect(alice).shareSecret(bob.address)).wait();

    const handle = await contract.connect(bob).getSharedSecret(alice.address);
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, bob);
    expect(clear).to.equal(777n);
  });

  it("should reject getSharedSecret without access", async function () {
    const enc = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(999)
      .encrypt();
    await (await contract.connect(alice).storeSecret(enc.handles[0], enc.inputProof)).wait();

    try {
      await contract.connect(bob).getSharedSecret(alice.address);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Not authorized");
    }
  });

  it("should deny access to non-shared user", async function () {
    const enc = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(999)
      .encrypt();
    await (await contract.connect(alice).storeSecret(enc.handles[0], enc.inputProof)).wait();

    // Bob should NOT have access (not shared)
    const hasAccess = await contract.connect(bob).canAccess(alice.address);
    expect(hasAccess).to.equal(false);
  });
});
