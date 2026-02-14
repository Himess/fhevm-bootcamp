import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("EncryptedRegistry", function () {
  let registry: any;
  let registryAddress: string;
  let owner: any;
  let alice: any;
  let bob: any;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("EncryptedRegistry");
    registry = await Factory.deploy();
    await registry.waitForDeployment();
    registryAddress = await registry.getAddress();
  });

  it("should deploy with zero keys", async function () {
    expect(await registry.connect(alice).getKeyCount()).to.equal(0n);
  });

  it("should store and retrieve an encrypted value", async function () {
    const enc = await fhevm
      .createEncryptedInput(registryAddress, alice.address)
      .add64(12345)
      .encrypt();
    await (await registry.connect(alice).setValue("myKey", enc.handles[0], enc.inputProof)).wait();

    // Check key exists
    expect(await registry.connect(alice).hasValue("myKey")).to.equal(true);
    expect(await registry.connect(alice).getKeyCount()).to.equal(1n);

    // Retrieve and decrypt value
    const handle = await registry.connect(alice).getValue("myKey");
    const clear = await fhevm.userDecryptEuint(FhevmType.euint64, handle, registryAddress, alice);
    expect(clear).to.equal(12345n);
  });

  it("should overwrite an existing key with a new value", async function () {
    // Set initial value
    const enc1 = await fhevm
      .createEncryptedInput(registryAddress, alice.address)
      .add64(100)
      .encrypt();
    await (await registry.connect(alice).setValue("balance", enc1.handles[0], enc1.inputProof)).wait();

    // Overwrite with new value
    const enc2 = await fhevm
      .createEncryptedInput(registryAddress, alice.address)
      .add64(999)
      .encrypt();
    await (await registry.connect(alice).setValue("balance", enc2.handles[0], enc2.inputProof)).wait();

    // Key count should still be 1
    expect(await registry.connect(alice).getKeyCount()).to.equal(1n);

    // Value should be the new one
    const handle = await registry.connect(alice).getValue("balance");
    const clear = await fhevm.userDecryptEuint(FhevmType.euint64, handle, registryAddress, alice);
    expect(clear).to.equal(999n);
  });

  it("should share a value with another user", async function () {
    // Alice stores a value
    const enc = await fhevm
      .createEncryptedInput(registryAddress, alice.address)
      .add64(42)
      .encrypt();
    await (await registry.connect(alice).setValue("secret", enc.handles[0], enc.inputProof)).wait();

    // Alice shares with Bob
    await (await registry.connect(alice).shareValue("secret", bob.address)).wait();

    // Bob can read the shared value
    const handle = await registry.connect(bob).getSharedValue(alice.address, "secret");
    const clear = await fhevm.userDecryptEuint(FhevmType.euint64, handle, registryAddress, bob);
    expect(clear).to.equal(42n);
  });

  it("should delete a value", async function () {
    // Store two values
    const enc1 = await fhevm
      .createEncryptedInput(registryAddress, alice.address)
      .add64(100)
      .encrypt();
    await (await registry.connect(alice).setValue("key1", enc1.handles[0], enc1.inputProof)).wait();

    const enc2 = await fhevm
      .createEncryptedInput(registryAddress, alice.address)
      .add64(200)
      .encrypt();
    await (await registry.connect(alice).setValue("key2", enc2.handles[0], enc2.inputProof)).wait();

    expect(await registry.connect(alice).getKeyCount()).to.equal(2n);

    // Delete key1
    await (await registry.connect(alice).deleteValue("key1")).wait();

    expect(await registry.connect(alice).getKeyCount()).to.equal(1n);
    expect(await registry.connect(alice).hasValue("key1")).to.equal(false);
    expect(await registry.connect(alice).hasValue("key2")).to.equal(true);
  });

  it("should isolate storage between users", async function () {
    // Alice stores a value
    const encAlice = await fhevm
      .createEncryptedInput(registryAddress, alice.address)
      .add64(111)
      .encrypt();
    await (await registry.connect(alice).setValue("data", encAlice.handles[0], encAlice.inputProof)).wait();

    // Bob stores a different value under the same key
    const encBob = await fhevm
      .createEncryptedInput(registryAddress, bob.address)
      .add64(222)
      .encrypt();
    await (await registry.connect(bob).setValue("data", encBob.handles[0], encBob.inputProof)).wait();

    // Each user retrieves their own value
    const aliceHandle = await registry.connect(alice).getValue("data");
    const aliceClear = await fhevm.userDecryptEuint(FhevmType.euint64, aliceHandle, registryAddress, alice);
    expect(aliceClear).to.equal(111n);

    const bobHandle = await registry.connect(bob).getValue("data");
    const bobClear = await fhevm.userDecryptEuint(FhevmType.euint64, bobHandle, registryAddress, bob);
    expect(bobClear).to.equal(222n);
  });

  it("should enumerate keys using getKeyAtIndex", async function () {
    const enc1 = await fhevm
      .createEncryptedInput(registryAddress, alice.address)
      .add64(10)
      .encrypt();
    await (await registry.connect(alice).setValue("alpha", enc1.handles[0], enc1.inputProof)).wait();

    const enc2 = await fhevm
      .createEncryptedInput(registryAddress, alice.address)
      .add64(20)
      .encrypt();
    await (await registry.connect(alice).setValue("beta", enc2.handles[0], enc2.inputProof)).wait();

    expect(await registry.connect(alice).getKeyCount()).to.equal(2n);
    expect(await registry.connect(alice).getKeyAtIndex(0)).to.equal("alpha");
    expect(await registry.connect(alice).getKeyAtIndex(1)).to.equal("beta");
  });

  it("should reject empty key", async function () {
    const enc = await fhevm
      .createEncryptedInput(registryAddress, alice.address)
      .add64(1)
      .encrypt();

    try {
      await registry.connect(alice).setValue("", enc.handles[0], enc.inputProof);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Key cannot be empty");
    }
  });

  it("should reject sharing non-existent key", async function () {
    try {
      await registry.connect(alice).shareValue("nonexistent", bob.address);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Key does not exist");
    }
  });
});
