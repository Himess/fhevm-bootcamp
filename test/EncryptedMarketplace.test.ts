import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("EncryptedMarketplace", function () {
  let contract: any;
  let contractAddress: string;
  let deployer: any;
  let buyer: any;

  beforeEach(async function () {
    [deployer, buyer] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("EncryptedMarketplace");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  it("should list an item", async function () {
    await (await contract.listItem(100, 50)).wait();
    expect(await contract.nextItemId()).to.equal(1n);
    expect(await contract.itemExists(0)).to.equal(true);
  });

  it("should purchase with enough balance and sufficient stock", async function () {
    // Seller lists item: price=100, stock=50
    await (await contract.listItem(100, 50)).wait();

    // Buyer deposits 10000
    await (await contract.connect(buyer).deposit(10000)).wait();

    // Buyer buys 5 units (no discount: 5 < 10)
    // Total = 100 * 5 * 100 / 100 = 500
    await (await contract.connect(buyer).buyItem(0, 5)).wait();

    // Check buyer balance: 10000 - 500 = 9500
    const handle = await contract.connect(buyer).getBalance();
    const balance = await fhevm.userDecryptEuint(FhevmType.euint64, handle, contractAddress, buyer);
    expect(balance).to.equal(9500n);
  });

  it("should apply 5% discount for quantity >= 10", async function () {
    // Seller lists: price=100, stock=100
    await (await contract.listItem(100, 100)).wait();

    // Buyer deposits 100000
    await (await contract.connect(buyer).deposit(100000)).wait();

    // Buyer buys 10 units (5% discount: multiplier=95)
    // Total = 100 * 10 * 95 / 100 = 950
    await (await contract.connect(buyer).buyItem(0, 10)).wait();

    const handle = await contract.connect(buyer).getBalance();
    const balance = await fhevm.userDecryptEuint(FhevmType.euint64, handle, contractAddress, buyer);
    expect(balance).to.equal(99050n); // 100000 - 950
  });

  it("should apply 10% discount for quantity >= 50", async function () {
    await (await contract.listItem(100, 200)).wait();
    await (await contract.connect(buyer).deposit(1000000)).wait();

    // Buy 50 units (10% discount: multiplier=90)
    // Total = 100 * 50 * 90 / 100 = 4500
    await (await contract.connect(buyer).buyItem(0, 50)).wait();

    const handle = await contract.connect(buyer).getBalance();
    const balance = await fhevm.userDecryptEuint(FhevmType.euint64, handle, contractAddress, buyer);
    expect(balance).to.equal(995500n); // 1000000 - 4500
  });

  it("should apply 20% discount for quantity >= 100", async function () {
    await (await contract.listItem(100, 200)).wait();
    await (await contract.connect(buyer).deposit(1000000)).wait();

    // Buy 100 units (20% discount: multiplier=80)
    // Total = 100 * 100 * 80 / 100 = 8000
    await (await contract.connect(buyer).buyItem(0, 100)).wait();

    const handle = await contract.connect(buyer).getBalance();
    const balance = await fhevm.userDecryptEuint(FhevmType.euint64, handle, contractAddress, buyer);
    expect(balance).to.equal(992000n); // 1000000 - 8000
  });

  it("should handle insufficient funds (no state change)", async function () {
    await (await contract.listItem(100, 50)).wait();

    // Buyer deposits only 100 (not enough for 5 units = 500)
    await (await contract.connect(buyer).deposit(100)).wait();

    // Buy 5 units — should fail silently (FHE.select keeps original values)
    await (await contract.connect(buyer).buyItem(0, 5)).wait();

    // Balance should remain 100 (no deduction)
    const handle = await contract.connect(buyer).getBalance();
    const balance = await fhevm.userDecryptEuint(FhevmType.euint64, handle, contractAddress, buyer);
    expect(balance).to.equal(100n);
  });

  it("should handle insufficient stock (no state change)", async function () {
    // Seller lists: price=10, stock=3
    await (await contract.listItem(10, 3)).wait();

    // Buyer deposits enough
    await (await contract.connect(buyer).deposit(10000)).wait();

    // Buy 5 units but only 3 in stock — should fail silently
    await (await contract.connect(buyer).buyItem(0, 5)).wait();

    // Balance should remain 10000
    const handle = await contract.connect(buyer).getBalance();
    const balance = await fhevm.userDecryptEuint(FhevmType.euint64, handle, contractAddress, buyer);
    expect(balance).to.equal(10000n);
  });

  it("should credit seller on successful purchase", async function () {
    // Deployer lists item: price=100, stock=50
    await (await contract.listItem(100, 50)).wait();

    // Buyer deposits and buys 5 units (no discount: 500)
    await (await contract.connect(buyer).deposit(10000)).wait();
    await (await contract.connect(buyer).buyItem(0, 5)).wait();

    // Seller (deployer) balance should be 500
    const handle = await contract.getBalance();
    const sellerBalance = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      handle,
      contractAddress,
      deployer,
    );
    expect(sellerBalance).to.equal(500n);
  });

  it("should withdraw funds from balance", async function () {
    // Buyer deposits 10000
    await (await contract.connect(buyer).deposit(10000)).wait();

    // Withdraw 3000
    await (await contract.connect(buyer).withdraw(3000)).wait();

    // Balance should be 7000
    const handle = await contract.connect(buyer).getBalance();
    const balance = await fhevm.userDecryptEuint(FhevmType.euint64, handle, contractAddress, buyer);
    expect(balance).to.equal(7000n);
  });

  it("should withdraw 0 on insufficient balance (no revert)", async function () {
    // Buyer deposits 100
    await (await contract.connect(buyer).deposit(100)).wait();

    // Try to withdraw 500 — silently withdraws 0
    await (await contract.connect(buyer).withdraw(500)).wait();

    // Balance should remain 100
    const handle = await contract.connect(buyer).getBalance();
    const balance = await fhevm.userDecryptEuint(FhevmType.euint64, handle, contractAddress, buyer);
    expect(balance).to.equal(100n);
  });
});
