import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("CrossContractDemo", function () {
  let token: any;
  let vault: any;
  let tokenAddress: string;
  let vaultAddress: string;
  let deployer: any;
  let alice: any;

  beforeEach(async function () {
    [deployer, alice] = await ethers.getSigners();

    // Deploy CrossContractToken
    const TokenFactory = await ethers.getContractFactory("CrossContractToken");
    token = await TokenFactory.deploy("Cross Token");
    await token.waitForDeployment();
    tokenAddress = await token.getAddress();

    // Deploy CrossContractVault pointing to the token
    const VaultFactory = await ethers.getContractFactory("CrossContractVault");
    vault = await VaultFactory.deploy(tokenAddress);
    await vault.waitForDeployment();
    vaultAddress = await vault.getAddress();
  });

  describe("CrossContractToken", function () {
    it("should deploy with correct name", async function () {
      expect(await token.name()).to.equal("Cross Token");
    });

    it("should mint tokens to user", async function () {
      await (await token.mint(alice.address, 1000)).wait();

      const handle = await token.balanceOf(alice.address);
      const balance = await fhevm.userDecryptEuint(FhevmType.euint64, handle, tokenAddress, alice);
      expect(balance).to.equal(1000n);
    });

    it("should grant balance access to vault contract", async function () {
      await (await token.mint(alice.address, 500)).wait();
      // Alice grants the vault contract access to her encrypted balance
      await (await token.connect(alice).grantBalanceAccess(vaultAddress)).wait();
      // No revert = success (ACL grant is not directly verifiable in mock)
    });

    it("should emit BalanceAccessGranted event", async function () {
      await (await token.mint(alice.address, 100)).wait();
      const tx = await token.connect(alice).grantBalanceAccess(vaultAddress);
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => log.fragment?.name === "BalanceAccessGranted");
      expect(event).to.not.be.undefined;
    });
  });

  describe("CrossContractVault", function () {
    it("should deploy pointing to correct token", async function () {
      expect(await vault.token()).to.equal(tokenAddress);
    });

    it("should accept deposits", async function () {
      await (await vault.connect(alice).deposit(250)).wait();

      const handle = await vault.getDeposit(alice.address);
      const deposit = await fhevm.userDecryptEuint(FhevmType.euint64, handle, vaultAddress, alice);
      expect(deposit).to.equal(250n);
    });

    it("should accumulate multiple deposits", async function () {
      await (await vault.connect(alice).deposit(100)).wait();
      await (await vault.connect(alice).deposit(200)).wait();

      const handle = await vault.getDeposit(alice.address);
      const deposit = await fhevm.userDecryptEuint(FhevmType.euint64, handle, vaultAddress, alice);
      expect(deposit).to.equal(300n);
    });
  });

  describe("Cross-Contract Composability", function () {
    it("should compute reward from cross-contract token balance", async function () {
      // Step 1: Mint tokens to Alice in the token contract
      await (await token.mint(alice.address, 1000)).wait();

      // Step 2: Alice grants the vault contract ACL access to her balance
      await (await token.connect(alice).grantBalanceAccess(vaultAddress)).wait();

      // Step 3: Owner triggers reward computation (reads Alice's token balance cross-contract)
      await (await vault.computeReward(alice.address)).wait();

      // Step 4: Alice decrypts her reward (10% of 1000 = 100)
      const rewardHandle = await vault.getReward(alice.address);
      const reward = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        rewardHandle,
        vaultAddress,
        alice,
      );
      expect(reward).to.equal(100n);
    });

    it("should compute reward for different balances", async function () {
      await (await token.mint(alice.address, 500)).wait();
      await (await token.connect(alice).grantBalanceAccess(vaultAddress)).wait();
      await (await vault.computeReward(alice.address)).wait();

      const rewardHandle = await vault.getReward(alice.address);
      const reward = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        rewardHandle,
        vaultAddress,
        alice,
      );
      // 10% of 500 = 50
      expect(reward).to.equal(50n);
    });

    it("should handle zero balance reward", async function () {
      // Alice has no tokens minted, but grants access
      await (await token.connect(alice).grantBalanceAccess(vaultAddress)).wait();
      await (await vault.computeReward(alice.address)).wait();

      const rewardHandle = await vault.getReward(alice.address);
      const reward = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        rewardHandle,
        vaultAddress,
        alice,
      );
      expect(reward).to.equal(0n);
    });

    it("should keep vault deposits and token balance independent", async function () {
      // Alice has tokens and vault deposits — they are separate
      await (await token.mint(alice.address, 1000)).wait();
      await (await vault.connect(alice).deposit(250)).wait();

      // Check token balance
      const tokenHandle = await token.balanceOf(alice.address);
      const tokenBal = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        tokenHandle,
        tokenAddress,
        alice,
      );
      expect(tokenBal).to.equal(1000n);

      // Check vault deposit
      const vaultHandle = await vault.getDeposit(alice.address);
      const vaultBal = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        vaultHandle,
        vaultAddress,
        alice,
      );
      expect(vaultBal).to.equal(250n);
    });

    it("should only allow owner to compute rewards", async function () {
      let reverted = false;
      try {
        await (await vault.connect(alice).computeReward(alice.address)).wait();
      } catch {
        reverted = true;
      }
      expect(reverted).to.be.true;
    });

    it("should emit RewardComputed event", async function () {
      await (await token.mint(alice.address, 100)).wait();
      await (await token.connect(alice).grantBalanceAccess(vaultAddress)).wait();

      const tx = await vault.computeReward(alice.address);
      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => log.fragment?.name === "RewardComputed");
      expect(event).to.not.be.undefined;
    });
  });
});
