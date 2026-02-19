import { expect } from "chai";
import { ethers } from "hardhat";

describe("BasicToken", function () {
  let token: any;
  let owner: any;
  let alice: any;
  let bob: any;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("BasicToken");
    token = await Factory.deploy("TestToken", "TT", 18);
    await token.waitForDeployment();
  });

  it("should deploy with correct name, symbol, decimals", async function () {
    expect(await token.name()).to.equal("TestToken");
    expect(await token.symbol()).to.equal("TT");
    expect(await token.decimals()).to.equal(18n);
  });

  it("should allow owner to mint", async function () {
    await token.mint(alice.address, 1000);
    expect(await token.balances(alice.address)).to.equal(1000n);
    expect(await token.totalSupply()).to.equal(1000n);
  });

  it("should emit Transfer event on mint", async function () {
    const tx = await token.mint(alice.address, 500);
    const receipt = await tx.wait();
    const event = receipt.logs.find((log: any) => log.fragment?.name === "Transfer");
    expect(event).to.not.be.undefined;
    expect(event.args[0]).to.equal(ethers.ZeroAddress);
    expect(event.args[1]).to.equal(alice.address);
    expect(event.args[2]).to.equal(500n);
  });

  it("should transfer tokens", async function () {
    await token.mint(alice.address, 1000);
    await token.connect(alice).transfer(bob.address, 300);
    expect(await token.balances(alice.address)).to.equal(700n);
    expect(await token.balances(bob.address)).to.equal(300n);
  });

  it("should revert transfer with insufficient balance", async function () {
    await token.mint(alice.address, 100);
    try {
      await token.connect(alice).transfer(bob.address, 200);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Insufficient balance");
    }
  });

  it("should approve spender", async function () {
    await token.connect(alice).approve(bob.address, 500);
    expect(await token.allowances(alice.address, bob.address)).to.equal(500n);
  });

  it("should emit Approval event", async function () {
    const tx = await token.connect(alice).approve(bob.address, 500);
    const receipt = await tx.wait();
    const event = receipt.logs.find((log: any) => log.fragment?.name === "Approval");
    expect(event).to.not.be.undefined;
    expect(event.args[0]).to.equal(alice.address);
    expect(event.args[1]).to.equal(bob.address);
    expect(event.args[2]).to.equal(500n);
  });

  it("should transferFrom with allowance", async function () {
    await token.mint(alice.address, 1000);
    await token.connect(alice).approve(bob.address, 500);
    await token.connect(bob).transferFrom(alice.address, bob.address, 300);
    expect(await token.balances(alice.address)).to.equal(700n);
    expect(await token.balances(bob.address)).to.equal(300n);
    expect(await token.allowances(alice.address, bob.address)).to.equal(200n);
  });

  it("should revert transferFrom with insufficient allowance", async function () {
    await token.mint(alice.address, 1000);
    await token.connect(alice).approve(bob.address, 100);
    try {
      await token.connect(bob).transferFrom(alice.address, bob.address, 200);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Insufficient allowance");
    }
  });

  it("should revert mint from non-owner", async function () {
    try {
      await token.connect(alice).mint(alice.address, 1000);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Not the owner");
    }
  });
});
