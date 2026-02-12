import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("EncryptedLottery", function () {
  let contract: any;
  let contractAddress: string;
  let owner: any;
  let player1: any;
  let player2: any;
  let player3: any;

  const TICKET_PRICE = ethers.parseEther("0.01");
  const DURATION = 60; // 60 seconds

  beforeEach(async function () {
    [owner, player1, player2, player3] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("EncryptedLottery");
    contract = await Factory.deploy(TICKET_PRICE, DURATION);
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  it("should deploy with correct parameters", async function () {
    expect(await contract.owner()).to.equal(owner.address);
    expect(await contract.ticketPrice()).to.equal(TICKET_PRICE);
    expect(await contract.drawn()).to.equal(false);
  });

  it("should allow buying a ticket", async function () {
    const tx = await contract.connect(player1).buyTicket({ value: TICKET_PRICE });
    const receipt = await tx.wait();
    const event = receipt.logs.find((log: any) => log.fragment?.name === "TicketPurchased");
    expect(event).to.not.be.undefined;
    expect(await contract.getPlayerCount()).to.equal(1n);
    expect(await contract.hasTicket(player1.address)).to.equal(true);
  });

  it("should prevent double ticket purchase", async function () {
    await (await contract.connect(player1).buyTicket({ value: TICKET_PRICE })).wait();
    try {
      await contract.connect(player1).buyTicket({ value: TICKET_PRICE });
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Already has ticket");
    }
  });

  it("should reject insufficient payment", async function () {
    try {
      await contract.connect(player1).buyTicket({ value: ethers.parseEther("0.001") });
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Insufficient payment");
    }
  });

  it("should track multiple players", async function () {
    await (await contract.connect(player1).buyTicket({ value: TICKET_PRICE })).wait();
    await (await contract.connect(player2).buyTicket({ value: TICKET_PRICE })).wait();
    await (await contract.connect(player3).buyTicket({ value: TICKET_PRICE })).wait();
    expect(await contract.getPlayerCount()).to.equal(3n);
  });

  it("should accumulate prize pool", async function () {
    await (await contract.connect(player1).buyTicket({ value: TICKET_PRICE })).wait();
    await (await contract.connect(player2).buyTicket({ value: TICKET_PRICE })).wait();
    const pool = await contract.getPrizePool();
    expect(pool).to.equal(TICKET_PRICE * 2n);
  });

  it("should draw winner after deadline", async function () {
    await (await contract.connect(player1).buyTicket({ value: TICKET_PRICE })).wait();
    await (await contract.connect(player2).buyTicket({ value: TICKET_PRICE })).wait();

    // Advance time past deadline
    await ethers.provider.send("evm_increaseTime", [DURATION + 1]);
    await ethers.provider.send("evm_mine", []);

    await (await contract.drawWinner()).wait();
    expect(await contract.drawn()).to.equal(true);

    const handle = await contract.getWinnerIndex();
    expect(handle).to.not.equal(ethers.ZeroHash);
  });

  it("should prevent drawing before deadline", async function () {
    await (await contract.connect(player1).buyTicket({ value: TICKET_PRICE })).wait();
    try {
      await contract.drawWinner();
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Lottery still open");
    }
  });

  it("should prevent non-owner from drawing", async function () {
    await (await contract.connect(player1).buyTicket({ value: TICKET_PRICE })).wait();
    await ethers.provider.send("evm_increaseTime", [DURATION + 1]);
    await ethers.provider.send("evm_mine", []);
    try {
      await contract.connect(player1).drawWinner();
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Not the owner");
    }
  });

  it("should reveal winner and allow prize claim", async function () {
    await (await contract.connect(player1).buyTicket({ value: TICKET_PRICE })).wait();

    await ethers.provider.send("evm_increaseTime", [DURATION + 1]);
    await ethers.provider.send("evm_mine", []);

    await (await contract.drawWinner()).wait();

    // Reveal with index 0 (only 1 player)
    await (await contract.revealWinner(0)).wait();
    expect(await contract.winner()).to.equal(player1.address);

    // Claim prize
    const balanceBefore = await ethers.provider.getBalance(player1.address);
    const tx = await contract.connect(player1).claimPrize();
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;
    const balanceAfter = await ethers.provider.getBalance(player1.address);

    expect(balanceAfter + gasUsed - balanceBefore).to.equal(TICKET_PRICE);
  });
});
