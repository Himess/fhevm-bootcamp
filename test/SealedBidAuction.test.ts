import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("SealedBidAuction", function () {
  let auction: any;
  let auctionAddress: string;
  let owner: any;
  let alice: any;
  let bob: any;
  let charlie: any;

  beforeEach(async function () {
    [owner, alice, bob, charlie] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("SealedBidAuction");
    auction = await Factory.deploy();
    await auction.waitForDeployment();
    auctionAddress = await auction.getAddress();
  });

  it("should create an auction with reserve price", async function () {
    await (await auction.createAuction("Rare NFT", 3600, 100)).wait();
    expect(await auction.auctionCount()).to.equal(1n);
  });

  it("should place a bid with ETH deposit", async function () {
    await (await auction.createAuction("Test Item", 3600, 0)).wait();

    const enc = await fhevm
      .createEncryptedInput(auctionAddress, alice.address)
      .add64(1000)
      .encrypt();
    await (
      await auction.connect(alice).bid(0, enc.handles[0], enc.inputProof, { value: ethers.parseEther("0.1") })
    ).wait();

    expect(await auction.hasBid(0, alice.address)).to.equal(true);
    expect(await auction.getBidderCount(0)).to.equal(1n);
    expect(await auction.deposits(0, alice.address)).to.equal(ethers.parseEther("0.1"));
  });

  it("should reject bid without ETH deposit", async function () {
    await (await auction.createAuction("No Deposit", 3600, 0)).wait();

    const enc = await fhevm
      .createEncryptedInput(auctionAddress, alice.address)
      .add64(500)
      .encrypt();
    try {
      await auction.connect(alice).bid(0, enc.handles[0], enc.inputProof);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Must deposit ETH");
    }
  });

  it("should accept multiple bids from different bidders", async function () {
    await (await auction.createAuction("Multi Bid", 3600, 0)).wait();

    const enc1 = await fhevm
      .createEncryptedInput(auctionAddress, alice.address)
      .add64(500)
      .encrypt();
    await (
      await auction.connect(alice).bid(0, enc1.handles[0], enc1.inputProof, { value: ethers.parseEther("0.1") })
    ).wait();

    const enc2 = await fhevm
      .createEncryptedInput(auctionAddress, bob.address)
      .add64(1000)
      .encrypt();
    await (
      await auction.connect(bob).bid(0, enc2.handles[0], enc2.inputProof, { value: ethers.parseEther("0.2") })
    ).wait();

    const enc3 = await fhevm
      .createEncryptedInput(auctionAddress, charlie.address)
      .add64(750)
      .encrypt();
    await (
      await auction.connect(charlie).bid(0, enc3.handles[0], enc3.inputProof, { value: ethers.parseEther("0.15") })
    ).wait();

    expect(await auction.getBidderCount(0)).to.equal(3n);
  });

  it("should reject duplicate bid from same bidder", async function () {
    await (await auction.createAuction("No Rebid", 3600, 0)).wait();

    const enc1 = await fhevm
      .createEncryptedInput(auctionAddress, alice.address)
      .add64(100)
      .encrypt();
    await (
      await auction.connect(alice).bid(0, enc1.handles[0], enc1.inputProof, { value: ethers.parseEther("0.1") })
    ).wait();

    const enc2 = await fhevm
      .createEncryptedInput(auctionAddress, alice.address)
      .add64(500)
      .encrypt();
    try {
      await auction.connect(alice).bid(0, enc2.handles[0], enc2.inputProof, { value: ethers.parseEther("0.1") });
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Already bid");
    }
  });

  it("should track highest bid (encrypted)", async function () {
    await (await auction.createAuction("Highest Bid", 3600, 0)).wait();

    const enc1 = await fhevm
      .createEncryptedInput(auctionAddress, alice.address)
      .add64(100)
      .encrypt();
    await (
      await auction.connect(alice).bid(0, enc1.handles[0], enc1.inputProof, { value: ethers.parseEther("0.1") })
    ).wait();

    const enc2 = await fhevm
      .createEncryptedInput(auctionAddress, bob.address)
      .add64(200)
      .encrypt();
    await (
      await auction.connect(bob).bid(0, enc2.handles[0], enc2.inputProof, { value: ethers.parseEther("0.1") })
    ).wait();

    // Advance time past deadline
    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine", []);
    await (await auction.endAuction(0)).wait();

    // Verify highest bid handle exists (makePubliclyDecryptable called by endAuction)
    const highestHandle = await auction.getHighestBid(0);
    expect(highestHandle).to.not.equal(ethers.ZeroHash);

    // Verify individual bids via user decrypt (bidders have ACL access to their own bids)
    const aliceBidHandle = await auction.connect(alice).getMyBid(0);
    const aliceBid = await fhevm.userDecryptEuint(FhevmType.euint64, aliceBidHandle, auctionAddress, alice);
    expect(aliceBid).to.equal(100n);

    const bobBidHandle = await auction.connect(bob).getMyBid(0);
    const bobBid = await fhevm.userDecryptEuint(FhevmType.euint64, bobBidHandle, auctionAddress, bob);
    expect(bobBid).to.equal(200n);
  });

  it("should track highest bidder (eaddress)", async function () {
    await (await auction.createAuction("Bidder Track", 3600, 0)).wait();

    const enc = await fhevm
      .createEncryptedInput(auctionAddress, alice.address)
      .add64(999)
      .encrypt();
    await (
      await auction.connect(alice).bid(0, enc.handles[0], enc.inputProof, { value: ethers.parseEther("0.1") })
    ).wait();

    const bidderHandle = await auction.getHighestBidder(0);
    expect(bidderHandle).to.not.equal(ethers.ZeroHash);
  });

  it("should reject bid on invalid auction", async function () {
    const enc = await fhevm
      .createEncryptedInput(auctionAddress, alice.address)
      .add64(100)
      .encrypt();
    try {
      await auction.connect(alice).bid(999, enc.handles[0], enc.inputProof, { value: ethers.parseEther("0.1") });
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Invalid auction");
    }
  });

  it("should only allow owner to create auctions", async function () {
    try {
      await auction.connect(alice).createAuction("Unauthorized", 3600, 0);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Not the owner");
    }
  });

  it("should allow non-winner deposit withdrawal and block winner withdrawal", async function () {
    await (await auction.createAuction("Withdraw Test", 100, 0)).wait();

    // Alice bids 500
    const enc1 = await fhevm
      .createEncryptedInput(auctionAddress, alice.address)
      .add64(500)
      .encrypt();
    await (
      await auction.connect(alice).bid(0, enc1.handles[0], enc1.inputProof, { value: ethers.parseEther("1.0") })
    ).wait();

    // Bob bids 1000 (higher)
    const enc2 = await fhevm
      .createEncryptedInput(auctionAddress, bob.address)
      .add64(1000)
      .encrypt();
    await (
      await auction.connect(bob).bid(0, enc2.handles[0], enc2.inputProof, { value: ethers.parseEther("1.0") })
    ).wait();

    // Wait for deadline to pass
    await ethers.provider.send("evm_increaseTime", [101]);
    await ethers.provider.send("evm_mine", []);

    // End auction and finalize with bob as winner
    await (await auction.endAuction(0)).wait();
    await (await auction.finalizeAuction(0, bob.address, 1000)).wait();

    // Verify winner is set
    expect(await auction.winner(0)).to.equal(bob.address);
    expect(await auction.winningBidAmount(0)).to.equal(1000n);

    // Winner (bob) cannot withdraw
    try {
      await auction.connect(bob).withdrawDeposit(0);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Winner cannot withdraw");
    }

    // Non-winner (alice) can withdraw
    const balBefore = await ethers.provider.getBalance(alice.address);
    const tx = await auction.connect(alice).withdrawDeposit(0);
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;
    const balAfter = await ethers.provider.getBalance(alice.address);

    expect(balAfter + gasUsed - balBefore).to.equal(ethers.parseEther("1.0"));
    expect(await auction.deposits(0, alice.address)).to.equal(0n);
  });

  it("should reject withdrawal before auction ends", async function () {
    await (await auction.createAuction("Early Withdraw", 3600, 0)).wait();

    const enc = await fhevm
      .createEncryptedInput(auctionAddress, alice.address)
      .add64(100)
      .encrypt();
    await (
      await auction.connect(alice).bid(0, enc.handles[0], enc.inputProof, { value: ethers.parseEther("0.1") })
    ).wait();

    try {
      await auction.connect(alice).withdrawDeposit(0);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Auction not ended");
    }
  });
});
