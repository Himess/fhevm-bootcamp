import { expect } from "chai";
import { ethers } from "hardhat";

describe("EncryptedProfile", function () {
  let contract: any;
  let owner: any;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("EncryptedProfile");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  it("should deploy with correct owner", async function () {
    expect(await contract.profileOwner()).to.equal(owner.address);
  });

  // TODO: Add tests for setVerified, setAge, setScore
  // TODO: Add tests for getVerified, getAge, getScore
  // TODO: Add test for isAboveAge bonus challenge

  // Hint: For encrypted tests, use fhevm.createEncryptedInput() if accepting external input
  // For plaintext-accepting functions (like this exercise), just call directly
});
