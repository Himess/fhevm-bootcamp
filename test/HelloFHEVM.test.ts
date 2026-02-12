import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

describe("HelloFHEVM", function () {
  let contract: any;
  let contractAddress: string;
  let deployer: any;
  let alice: any;

  beforeEach(async function () {
    [deployer, alice] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("HelloFHEVM");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  it("should deploy with counter as zero handle", async function () {
    const counter = await contract.getCounter();
    expect(counter).to.equal(ethers.ZeroHash);
  });

  it("should set deployer as owner", async function () {
    expect(await contract.owner()).to.equal(deployer.address);
  });

  it("should increment counter with encrypted value", async function () {
    const encrypted = await fhevm
      .createEncryptedInput(contractAddress, deployer.address)
      .add32(5)
      .encrypt();

    const tx = await contract.increment(encrypted.handles[0], encrypted.inputProof);
    await tx.wait();

    const counter = await contract.getCounter();
    expect(counter).to.not.equal(ethers.ZeroHash);
  });

  it("should allow multiple increments", async function () {
    // First increment
    const enc1 = await fhevm
      .createEncryptedInput(contractAddress, deployer.address)
      .add32(3)
      .encrypt();
    await (await contract.increment(enc1.handles[0], enc1.inputProof)).wait();

    // Second increment
    const enc2 = await fhevm
      .createEncryptedInput(contractAddress, deployer.address)
      .add32(7)
      .encrypt();
    await (await contract.increment(enc2.handles[0], enc2.inputProof)).wait();

    const counter = await contract.getCounter();
    expect(counter).to.not.equal(ethers.ZeroHash);
  });

  it("should allow different users to increment", async function () {
    // Alice increments
    const encrypted = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(7)
      .encrypt();

    await (await contract.connect(alice).increment(
      encrypted.handles[0],
      encrypted.inputProof
    )).wait();

    const counter = await contract.getCounter();
    expect(counter).to.not.equal(ethers.ZeroHash);
  });

  it("should emit CounterIncremented event", async function () {
    const encrypted = await fhevm
      .createEncryptedInput(contractAddress, deployer.address)
      .add32(1)
      .encrypt();

    const tx = await contract.increment(encrypted.handles[0], encrypted.inputProof);
    const receipt = await tx.wait();
    const event = receipt.logs.find((log: any) => log.fragment?.name === "CounterIncremented");
    expect(event).to.not.be.undefined;
  });
});
