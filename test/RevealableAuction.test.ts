import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("RevealableAuction", function () {
  let contract: any;
  let contractAddress: string;
  let deployer: any;
  let alice: any;
  let bob: any;

  beforeEach(async function () {
    [deployer, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("RevealableAuction");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  it("should deploy with auction open", async function () {
    expect(await contract.auctionOpen()).to.equal(true);
    expect(await contract.revealed()).to.equal(false);
    expect(await contract.owner()).to.equal(deployer.address);
  });

  it("should accept encrypted bid", async function () {
    const enc = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(500)
      .encrypt();
    await (await contract.connect(alice).submitBid(enc.handles[0], enc.inputProof)).wait();

    expect(await contract.hasBid(alice.address)).to.equal(true);
  });

  it("should prevent double bidding", async function () {
    const enc1 = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(500)
      .encrypt();
    await (await contract.connect(alice).submitBid(enc1.handles[0], enc1.inputProof)).wait();

    const enc2 = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(600)
      .encrypt();

    let reverted = false;
    try {
      await (await contract.connect(alice).submitBid(enc2.handles[0], enc2.inputProof)).wait();
    } catch {
      reverted = true;
    }
    expect(reverted).to.equal(true);
  });

  it("should track highest bid and reveal correctly", async function () {
    // Alice bids 500
    const enc1 = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(500)
      .encrypt();
    await (await contract.connect(alice).submitBid(enc1.handles[0], enc1.inputProof)).wait();

    // Bob bids 1000
    const enc2 = await fhevm
      .createEncryptedInput(contractAddress, bob.address)
      .add64(1000)
      .encrypt();
    await (await contract.connect(bob).submitBid(enc2.handles[0], enc2.inputProof)).wait();

    // Close and reveal
    await (await contract.closeAuction()).wait();
    await (await contract.revealWinner()).wait();

    expect(await contract.revealed()).to.equal(true);

    // Decrypt the revealed highest bid
    const handle = await contract.getHighestBid();
    const value = await fhevm.userDecryptEuint(FhevmType.euint64, handle, contractAddress, deployer);
    expect(value).to.equal(1000n);
  });

  it("should allow user to view own bid", async function () {
    const enc = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(750)
      .encrypt();
    await (await contract.connect(alice).submitBid(enc.handles[0], enc.inputProof)).wait();

    const handle = await contract.connect(alice).getMyBid();
    const value = await fhevm.userDecryptEuint(FhevmType.euint64, handle, contractAddress, alice);
    expect(value).to.equal(750n);
  });

  it("should reject reveal while auction is open", async function () {
    let reverted = false;
    try {
      await (await contract.revealWinner()).wait();
    } catch {
      reverted = true;
    }
    expect(reverted).to.equal(true);
  });

  it("should reject bid after auction closes", async function () {
    await (await contract.closeAuction()).wait();

    const enc = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(500)
      .encrypt();

    let reverted = false;
    try {
      await (await contract.connect(alice).submitBid(enc.handles[0], enc.inputProof)).wait();
    } catch {
      reverted = true;
    }
    expect(reverted).to.equal(true);
  });
});
