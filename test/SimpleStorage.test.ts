import { expect } from "chai";
import { ethers } from "hardhat";

describe("SimpleStorage", function () {
  let simpleStorage: any;
  let owner: any;
  let other: any;

  beforeEach(async function () {
    [owner, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("SimpleStorage");
    simpleStorage = await Factory.deploy();
    await simpleStorage.waitForDeployment();
  });

  it("should deploy with storedValue = 0", async function () {
    expect(await simpleStorage.storedValue()).to.equal(0n);
  });

  it("should set the deployer as owner", async function () {
    expect(await simpleStorage.owner()).to.equal(owner.address);
  });

  it("should allow owner to set value", async function () {
    await simpleStorage.set(42);
    expect(await simpleStorage.get()).to.equal(42n);
  });

  it("should emit ValueChanged event on set", async function () {
    const tx = await simpleStorage.set(100);
    const receipt = await tx.wait();
    const event = receipt.logs.find(
      (log: any) => log.fragment?.name === "ValueChanged"
    );
    expect(event).to.not.be.undefined;
    expect(event.args[0]).to.equal(100n);
  });

  it("should revert when non-owner tries to set", async function () {
    try {
      await simpleStorage.connect(other).set(99);
      expect.fail("Should have reverted");
    } catch (error: any) {
      expect(error.message).to.include("Not the owner");
    }
  });

  it("should return value via get()", async function () {
    await simpleStorage.set(77);
    expect(await simpleStorage.get()).to.equal(77n);
  });
});
