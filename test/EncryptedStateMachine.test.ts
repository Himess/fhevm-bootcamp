import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("EncryptedStateMachine", function () {
  let machine: any;
  let machineAddress: string;
  let owner: any;
  let alice: any;
  let bob: any;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("EncryptedStateMachine");
    machine = await Factory.deploy();
    await machine.waitForDeployment();
    machineAddress = await machine.getAddress();
  });

  it("should deploy in IDLE state", async function () {
    expect(await machine.currentState()).to.equal(0n); // IDLE = 0
    expect(await machine.thresholdSet()).to.equal(false);
    expect(await machine.actionCount()).to.equal(0n);
  });

  it("should allow owner to set encrypted threshold", async function () {
    const enc = await fhevm.createEncryptedInput(machineAddress, owner.address).add32(5).encrypt();
    await (await machine.setThreshold(enc.handles[0], enc.inputProof)).wait();

    expect(await machine.thresholdSet()).to.equal(true);
  });

  it("should transition from IDLE to ACTIVE", async function () {
    // Set threshold first
    const enc = await fhevm.createEncryptedInput(machineAddress, owner.address).add32(3).encrypt();
    await (await machine.setThreshold(enc.handles[0], enc.inputProof)).wait();

    // Activate
    await (await machine.activate()).wait();
    expect(await machine.currentState()).to.equal(1n); // ACTIVE = 1
  });

  it("should allow users to perform actions and increment counter", async function () {
    // Setup: set threshold and activate
    const enc = await fhevm.createEncryptedInput(machineAddress, owner.address).add32(5).encrypt();
    await (await machine.setThreshold(enc.handles[0], enc.inputProof)).wait();
    await (await machine.activate()).wait();

    // Perform actions
    await (await machine.connect(alice).performAction()).wait();
    await (await machine.connect(bob).performAction()).wait();
    await (await machine.connect(alice).performAction()).wait();

    expect(await machine.actionCount()).to.equal(3n);
  });

  it("should support batch actions", async function () {
    const enc = await fhevm.createEncryptedInput(machineAddress, owner.address).add32(10).encrypt();
    await (await machine.setThreshold(enc.handles[0], enc.inputProof)).wait();
    await (await machine.activate()).wait();

    await (await machine.connect(alice).performBatchActions(5)).wait();
    expect(await machine.actionCount()).to.equal(5n);
  });

  it("should handle full lifecycle: set threshold, activate, perform actions, check transition, complete", async function () {
    // Set threshold to 3
    const enc = await fhevm.createEncryptedInput(machineAddress, owner.address).add32(3).encrypt();
    await (await machine.setThreshold(enc.handles[0], enc.inputProof)).wait();

    // Activate
    await (await machine.activate()).wait();
    expect(await machine.currentState()).to.equal(1n); // ACTIVE

    // Perform 3 actions to reach threshold
    await (await machine.connect(alice).performAction()).wait();
    await (await machine.connect(bob).performAction()).wait();
    await (await machine.connect(alice).performAction()).wait();

    // Check transition
    await (await machine.checkTransition()).wait();

    // Reveal transition
    await (await machine.revealTransition()).wait();

    // Execute transition (counter=3 >= threshold=3, so isReady=true)
    await (await machine.executeTransition(true)).wait();
    expect(await machine.currentState()).to.equal(3n); // COMPLETED
  });

  it("should not transition when counter has not reached threshold", async function () {
    // Set threshold to 10
    const enc = await fhevm.createEncryptedInput(machineAddress, owner.address).add32(10).encrypt();
    await (await machine.setThreshold(enc.handles[0], enc.inputProof)).wait();

    // Activate
    await (await machine.activate()).wait();

    // Only perform 2 actions (below threshold of 10)
    await (await machine.connect(alice).performAction()).wait();
    await (await machine.connect(bob).performAction()).wait();

    // Check transition
    await (await machine.checkTransition()).wait();

    // Reveal transition
    await (await machine.revealTransition()).wait();

    // Execute with false (counter=2 < threshold=10)
    await (await machine.executeTransition(false)).wait();
    expect(await machine.currentState()).to.equal(1n); // Still ACTIVE
  });

  it("should support pause and resume", async function () {
    const enc = await fhevm.createEncryptedInput(machineAddress, owner.address).add32(5).encrypt();
    await (await machine.setThreshold(enc.handles[0], enc.inputProof)).wait();
    await (await machine.activate()).wait();

    // Pause
    await (await machine.pause()).wait();
    expect(await machine.currentState()).to.equal(2n); // PAUSED

    // Resume
    await (await machine.resume()).wait();
    expect(await machine.currentState()).to.equal(1n); // ACTIVE
  });

  it("should reject actions in wrong state", async function () {
    // Try to perform action in IDLE state
    try {
      await machine.connect(alice).performAction();
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Invalid state for this action");
    }
  });

  it("should reject activation without threshold set", async function () {
    try {
      await machine.activate();
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Threshold not set");
    }
  });
});
