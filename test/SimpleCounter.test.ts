import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("SimpleCounter", function () {
  let contract: any;
  let contractAddress: string;
  let alice: any;
  let bob: any;

  beforeEach(async function () {
    [alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("SimpleCounter");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  it("should increment counter with encrypted value", async function () {
    const enc = await fhevm.createEncryptedInput(contractAddress, alice.address).add32(5).encrypt();
    await (await contract.connect(alice).increment(enc.handles[0], enc.inputProof)).wait();

    const handle = await contract.connect(alice).getMyCount();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, alice);
    expect(clear).to.equal(5n);
  });

  it("should accumulate multiple increments", async function () {
    const enc1 = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(3)
      .encrypt();
    await (await contract.connect(alice).increment(enc1.handles[0], enc1.inputProof)).wait();

    const enc2 = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(7)
      .encrypt();
    await (await contract.connect(alice).increment(enc2.handles[0], enc2.inputProof)).wait();

    const handle = await contract.connect(alice).getMyCount();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, alice);
    expect(clear).to.equal(10n);
  });

  it("should isolate counters per user", async function () {
    const encAlice = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(100)
      .encrypt();
    await (
      await contract.connect(alice).increment(encAlice.handles[0], encAlice.inputProof)
    ).wait();

    const encBob = await fhevm
      .createEncryptedInput(contractAddress, bob.address)
      .add32(200)
      .encrypt();
    await (await contract.connect(bob).increment(encBob.handles[0], encBob.inputProof)).wait();

    const handleAlice = await contract.connect(alice).getMyCount();
    const clearAlice = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      handleAlice,
      contractAddress,
      alice,
    );
    expect(clearAlice).to.equal(100n);

    const handleBob = await contract.connect(bob).getMyCount();
    const clearBob = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      handleBob,
      contractAddress,
      bob,
    );
    expect(clearBob).to.equal(200n);
  });

  it("should emit CountIncremented event", async function () {
    const enc = await fhevm.createEncryptedInput(contractAddress, alice.address).add32(1).encrypt();
    const tx = await contract.connect(alice).increment(enc.handles[0], enc.inputProof);
    const receipt = await tx.wait();
    const event = receipt.logs.find((log: any) => log.fragment?.name === "CountIncremented");
    expect(event).to.not.be.undefined;
  });
});
