import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("EncryptedOrderBook", function () {
  let orderBook: any;
  let orderBookAddress: string;
  let owner: any;
  let alice: any;
  let bob: any;
  let charlie: any;

  beforeEach(async function () {
    [owner, alice, bob, charlie] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("EncryptedOrderBook");
    orderBook = await Factory.deploy();
    await orderBook.waitForDeployment();
    orderBookAddress = await orderBook.getAddress();
  });

  it("should submit a buy order", async function () {
    const enc = await fhevm
      .createEncryptedInput(orderBookAddress, alice.address)
      .add64(100) // price
      .add64(50)  // amount
      .encrypt();
    await (
      await orderBook.connect(alice).submitBuyOrder(
        enc.handles[0], enc.inputProof,
        enc.handles[1], enc.inputProof
      )
    ).wait();

    expect(await orderBook.orderCount()).to.equal(1n);
    expect(await orderBook.activeOrderCount()).to.equal(1n);
    expect(await orderBook.isOrderActive(0)).to.equal(true);
    expect(await orderBook.isOrderBuy(0)).to.equal(true);
    expect(await orderBook.getOrderTrader(0)).to.equal(alice.address);
  });

  it("should submit a sell order", async function () {
    const enc = await fhevm
      .createEncryptedInput(orderBookAddress, bob.address)
      .add64(200) // price
      .add64(30)  // amount
      .encrypt();
    await (
      await orderBook.connect(bob).submitSellOrder(
        enc.handles[0], enc.inputProof,
        enc.handles[1], enc.inputProof
      )
    ).wait();

    expect(await orderBook.orderCount()).to.equal(1n);
    expect(await orderBook.isOrderBuy(0)).to.equal(false);
    expect(await orderBook.getOrderTrader(0)).to.equal(bob.address);
  });

  it("should match compatible orders (buy price >= sell price)", async function () {
    // Alice submits buy at price 150, amount 40
    const encBuy = await fhevm
      .createEncryptedInput(orderBookAddress, alice.address)
      .add64(150) // price
      .add64(40)  // amount
      .encrypt();
    await (
      await orderBook.connect(alice).submitBuyOrder(
        encBuy.handles[0], encBuy.inputProof,
        encBuy.handles[1], encBuy.inputProof
      )
    ).wait();

    // Bob submits sell at price 100, amount 40
    const encSell = await fhevm
      .createEncryptedInput(orderBookAddress, bob.address)
      .add64(100) // price
      .add64(40)  // amount
      .encrypt();
    await (
      await orderBook.connect(bob).submitSellOrder(
        encSell.handles[0], encSell.inputProof,
        encSell.handles[1], encSell.inputProof
      )
    ).wait();

    // Owner matches orders
    await (await orderBook.matchOrders(0, 1)).wait();

    // Both orders should have 0 remaining amount (fully filled)
    const buyAmountHandle = await orderBook.getOrderAmount(0);
    const buyAmount = await fhevm.userDecryptEuint(FhevmType.euint64, buyAmountHandle, orderBookAddress, alice);
    expect(buyAmount).to.equal(0n);

    const sellAmountHandle = await orderBook.getOrderAmount(1);
    const sellAmount = await fhevm.userDecryptEuint(FhevmType.euint64, sellAmountHandle, orderBookAddress, bob);
    expect(sellAmount).to.equal(0n);
  });

  it("should not fill incompatible orders (buy price < sell price)", async function () {
    // Alice submits buy at price 50, amount 40
    const encBuy = await fhevm
      .createEncryptedInput(orderBookAddress, alice.address)
      .add64(50)  // price
      .add64(40)  // amount
      .encrypt();
    await (
      await orderBook.connect(alice).submitBuyOrder(
        encBuy.handles[0], encBuy.inputProof,
        encBuy.handles[1], encBuy.inputProof
      )
    ).wait();

    // Bob submits sell at price 100, amount 40
    const encSell = await fhevm
      .createEncryptedInput(orderBookAddress, bob.address)
      .add64(100) // price
      .add64(40)  // amount
      .encrypt();
    await (
      await orderBook.connect(bob).submitSellOrder(
        encSell.handles[0], encSell.inputProof,
        encSell.handles[1], encSell.inputProof
      )
    ).wait();

    // Owner tries to match — prices incompatible, amounts unchanged
    await (await orderBook.matchOrders(0, 1)).wait();

    // Both orders should still have 40 remaining (no fill)
    const buyAmountHandle = await orderBook.getOrderAmount(0);
    const buyAmount = await fhevm.userDecryptEuint(FhevmType.euint64, buyAmountHandle, orderBookAddress, alice);
    expect(buyAmount).to.equal(40n);

    const sellAmountHandle = await orderBook.getOrderAmount(1);
    const sellAmount = await fhevm.userDecryptEuint(FhevmType.euint64, sellAmountHandle, orderBookAddress, bob);
    expect(sellAmount).to.equal(40n);
  });

  it("should cancel an order", async function () {
    const enc = await fhevm
      .createEncryptedInput(orderBookAddress, alice.address)
      .add64(100)
      .add64(50)
      .encrypt();
    await (
      await orderBook.connect(alice).submitBuyOrder(
        enc.handles[0], enc.inputProof,
        enc.handles[1], enc.inputProof
      )
    ).wait();

    expect(await orderBook.activeOrderCount()).to.equal(1n);

    await (await orderBook.connect(alice).cancelOrder(0)).wait();

    expect(await orderBook.isOrderActive(0)).to.equal(false);
    expect(await orderBook.activeOrderCount()).to.equal(0n);
  });

  it("should handle multiple users submitting orders", async function () {
    // Alice buys
    const encAlice = await fhevm
      .createEncryptedInput(orderBookAddress, alice.address)
      .add64(120)
      .add64(25)
      .encrypt();
    await (
      await orderBook.connect(alice).submitBuyOrder(
        encAlice.handles[0], encAlice.inputProof,
        encAlice.handles[1], encAlice.inputProof
      )
    ).wait();

    // Bob sells
    const encBob = await fhevm
      .createEncryptedInput(orderBookAddress, bob.address)
      .add64(110)
      .add64(30)
      .encrypt();
    await (
      await orderBook.connect(bob).submitSellOrder(
        encBob.handles[0], encBob.inputProof,
        encBob.handles[1], encBob.inputProof
      )
    ).wait();

    // Charlie buys
    const encCharlie = await fhevm
      .createEncryptedInput(orderBookAddress, charlie.address)
      .add64(115)
      .add64(10)
      .encrypt();
    await (
      await orderBook.connect(charlie).submitBuyOrder(
        encCharlie.handles[0], encCharlie.inputProof,
        encCharlie.handles[1], encCharlie.inputProof
      )
    ).wait();

    expect(await orderBook.orderCount()).to.equal(3n);
    expect(await orderBook.activeOrderCount()).to.equal(3n);
    expect(await orderBook.getOrderTrader(0)).to.equal(alice.address);
    expect(await orderBook.getOrderTrader(1)).to.equal(bob.address);
    expect(await orderBook.getOrderTrader(2)).to.equal(charlie.address);
  });

  it("should prevent non-owner from matching orders", async function () {
    // Submit a buy and sell order
    const encBuy = await fhevm
      .createEncryptedInput(orderBookAddress, alice.address)
      .add64(100)
      .add64(10)
      .encrypt();
    await (
      await orderBook.connect(alice).submitBuyOrder(
        encBuy.handles[0], encBuy.inputProof,
        encBuy.handles[1], encBuy.inputProof
      )
    ).wait();

    const encSell = await fhevm
      .createEncryptedInput(orderBookAddress, bob.address)
      .add64(90)
      .add64(10)
      .encrypt();
    await (
      await orderBook.connect(bob).submitSellOrder(
        encSell.handles[0], encSell.inputProof,
        encSell.handles[1], encSell.inputProof
      )
    ).wait();

    try {
      await orderBook.connect(alice).matchOrders(0, 1);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Not the owner");
    }
  });

  it("should verify remaining amounts after partial fill", async function () {
    // Alice buy order: price 200, amount 100
    const encBuy = await fhevm
      .createEncryptedInput(orderBookAddress, alice.address)
      .add64(200)
      .add64(100)
      .encrypt();
    await (
      await orderBook.connect(alice).submitBuyOrder(
        encBuy.handles[0], encBuy.inputProof,
        encBuy.handles[1], encBuy.inputProof
      )
    ).wait();

    // Bob sell order: price 150, amount 60
    const encSell = await fhevm
      .createEncryptedInput(orderBookAddress, bob.address)
      .add64(150)
      .add64(60)
      .encrypt();
    await (
      await orderBook.connect(bob).submitSellOrder(
        encSell.handles[0], encSell.inputProof,
        encSell.handles[1], encSell.inputProof
      )
    ).wait();

    // Match: fill = min(100, 60) = 60
    await (await orderBook.matchOrders(0, 1)).wait();

    // Buy order remaining: 100 - 60 = 40
    const buyAmountHandle = await orderBook.getOrderAmount(0);
    const buyAmount = await fhevm.userDecryptEuint(FhevmType.euint64, buyAmountHandle, orderBookAddress, alice);
    expect(buyAmount).to.equal(40n);

    // Sell order remaining: 60 - 60 = 0
    const sellAmountHandle = await orderBook.getOrderAmount(1);
    const sellAmount = await fhevm.userDecryptEuint(FhevmType.euint64, sellAmountHandle, orderBookAddress, bob);
    expect(sellAmount).to.equal(0n);
  });
});
