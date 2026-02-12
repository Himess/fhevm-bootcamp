# Module 00 - Exercise: Build a SimpleVault Contract

## Objective

Create a `SimpleVault` contract that allows users to deposit ETH, track balances using mappings, withdraw their funds, and includes basic access control. This exercise brings together all the concepts covered in Module 00.

---

## Requirements

1. **Deposit:** Users can deposit ETH into the vault. Their balance is tracked in a mapping.
2. **Withdraw:** Users can withdraw up to their deposited balance.
3. **Events:** Emit `Deposit` and `Withdrawal` events for every state-changing operation.
4. **Access Control:** Only the contract owner can call `emergencyWithdraw()`.
5. **Pause:** The owner can pause and unpause the contract. Deposits and withdrawals are blocked while paused.
6. **View Functions:** `getBalance()` returns the caller's vault balance; `getVaultTotal()` returns the contract's total ETH balance.

---

## Starter Code

Copy this into `contracts/SimpleVault.sol` and fill in the function bodies.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SimpleVault {
    // --- State Variables ---
    address public owner;
    bool public paused;
    mapping(address => uint256) private balances;

    // --- Events ---
    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    event EmergencyWithdrawal(address indexed owner, uint256 amount);
    event Paused(address indexed owner);
    event Unpaused(address indexed owner);

    // --- Errors ---
    error NotOwner();
    error ContractPaused();
    error ZeroAmount();
    error InsufficientBalance(uint256 available, uint256 requested);
    error TransferFailed();

    // --- Modifiers ---

    /// @dev Restricts access to the contract owner
    modifier onlyOwner() {
        // TODO: Revert with NotOwner() if caller is not the owner
        _;
    }

    /// @dev Blocks execution when the contract is paused
    modifier whenNotPaused() {
        // TODO: Revert with ContractPaused() if paused is true
        _;
    }

    // --- Constructor ---

    constructor() {
        // TODO: Set the deployer as the owner
    }

    // --- Core Functions ---

    /// @notice Deposit ETH into the vault
    function deposit() external payable whenNotPaused {
        // TODO:
        // 1. Revert with ZeroAmount() if msg.value is 0
        // 2. Add msg.value to the caller's balance in the mapping
        // 3. Emit the Deposit event
    }

    /// @notice Withdraw ETH from the vault
    /// @param amount The amount of ETH to withdraw (in wei)
    function withdraw(uint256 amount) external whenNotPaused {
        // TODO:
        // 1. Revert with ZeroAmount() if amount is 0
        // 2. Revert with InsufficientBalance if caller's balance < amount
        // 3. Subtract amount from the caller's balance (do this BEFORE transfer!)
        // 4. Transfer ETH to the caller using payable(msg.sender).call{value: amount}("")
        // 5. Revert with TransferFailed() if the transfer did not succeed
        // 6. Emit the Withdrawal event
    }

    /// @notice Owner-only emergency withdrawal of all contract funds
    function emergencyWithdraw() external onlyOwner {
        // TODO:
        // 1. Store the current contract balance in a local variable
        // 2. Transfer all ETH to the owner
        // 3. Revert with TransferFailed() if it fails
        // 4. Emit the EmergencyWithdrawal event
    }

    /// @notice Pause the contract (owner only)
    function pause() external onlyOwner {
        // TODO:
        // 1. Set paused to true
        // 2. Emit the Paused event
    }

    /// @notice Unpause the contract (owner only)
    function unpause() external onlyOwner {
        // TODO:
        // 1. Set paused to false
        // 2. Emit the Unpaused event
    }

    // --- View Functions ---

    /// @notice Returns the caller's deposited balance
    function getBalance() external view returns (uint256) {
        // TODO: Return the caller's balance from the mapping
    }

    /// @notice Returns the total ETH held in the vault
    function getVaultTotal() external view returns (uint256) {
        // TODO: Return the contract's ETH balance (address(this).balance)
    }
}
```

---

## Hints

Try to complete the exercise on your own first. If you get stuck, expand the hints below.

<details>
<summary>Hint 1: onlyOwner modifier</summary>

```solidity
modifier onlyOwner() {
    if (msg.sender != owner) revert NotOwner();
    _;
}
```
</details>

<details>
<summary>Hint 2: whenNotPaused modifier</summary>

```solidity
modifier whenNotPaused() {
    if (paused) revert ContractPaused();
    _;
}
```
</details>

<details>
<summary>Hint 3: deposit function</summary>

```solidity
function deposit() external payable whenNotPaused {
    if (msg.value == 0) revert ZeroAmount();
    balances[msg.sender] += msg.value;
    emit Deposit(msg.sender, msg.value);
}
```
</details>

<details>
<summary>Hint 4: withdraw function (CEI pattern)</summary>

The Checks-Effects-Interactions (CEI) pattern requires you to update state **before** making external calls to prevent reentrancy.

```solidity
function withdraw(uint256 amount) external whenNotPaused {
    if (amount == 0) revert ZeroAmount();
    if (balances[msg.sender] < amount) {
        revert InsufficientBalance(balances[msg.sender], amount);
    }

    balances[msg.sender] -= amount;  // Effect before Interaction

    (bool success, ) = payable(msg.sender).call{value: amount}("");
    if (!success) revert TransferFailed();

    emit Withdrawal(msg.sender, amount);
}
```
</details>

<details>
<summary>Hint 5: emergencyWithdraw function</summary>

```solidity
function emergencyWithdraw() external onlyOwner {
    uint256 total = address(this).balance;
    (bool success, ) = payable(owner).call{value: total}("");
    if (!success) revert TransferFailed();
    emit EmergencyWithdrawal(owner, total);
}
```
</details>

---

## Test Template

Use this template to verify your implementation:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("SimpleVault", function () {
    async function deployFixture() {
        const [owner, user1, user2] = await ethers.getSigners();
        const Vault = await ethers.getContractFactory("SimpleVault");
        const vault = await Vault.deploy();
        return { vault, owner, user1, user2 };
    }

    describe("Deployment", function () {
        it("should set the deployer as owner", async function () {
            const { vault, owner } = await loadFixture(deployFixture);
            expect(await vault.owner()).to.equal(owner.address);
        });

        it("should start unpaused", async function () {
            const { vault } = await loadFixture(deployFixture);
            expect(await vault.paused()).to.equal(false);
        });
    });

    describe("Deposits", function () {
        it("should accept ETH and update balance", async function () {
            const { vault, user1 } = await loadFixture(deployFixture);
            const amount = ethers.parseEther("1.0");

            await vault.connect(user1).deposit({ value: amount });
            expect(await vault.connect(user1).getBalance()).to.equal(amount);
        });

        it("should emit Deposit event", async function () {
            const { vault, user1 } = await loadFixture(deployFixture);
            const amount = ethers.parseEther("1.0");

            await expect(vault.connect(user1).deposit({ value: amount }))
                .to.emit(vault, "Deposit")
                .withArgs(user1.address, amount);
        });

        it("should revert on zero deposit", async function () {
            const { vault, user1 } = await loadFixture(deployFixture);
            await expect(
                vault.connect(user1).deposit({ value: 0 })
            ).to.be.revertedWithCustomError(vault, "ZeroAmount");
        });
    });

    describe("Withdrawals", function () {
        it("should allow withdrawal of deposited amount", async function () {
            const { vault, user1 } = await loadFixture(deployFixture);
            const amount = ethers.parseEther("1.0");

            await vault.connect(user1).deposit({ value: amount });
            await vault.connect(user1).withdraw(amount);
            expect(await vault.connect(user1).getBalance()).to.equal(0);
        });

        it("should revert when withdrawing more than balance", async function () {
            const { vault, user1 } = await loadFixture(deployFixture);
            const amount = ethers.parseEther("1.0");

            await expect(
                vault.connect(user1).withdraw(amount)
            ).to.be.revertedWithCustomError(vault, "InsufficientBalance");
        });
    });

    describe("Access Control", function () {
        it("should allow only owner to pause", async function () {
            const { vault, user1 } = await loadFixture(deployFixture);
            await expect(
                vault.connect(user1).pause()
            ).to.be.revertedWithCustomError(vault, "NotOwner");
        });

        it("should block deposits when paused", async function () {
            const { vault, owner, user1 } = await loadFixture(deployFixture);
            await vault.connect(owner).pause();
            await expect(
                vault.connect(user1).deposit({ value: ethers.parseEther("1.0") })
            ).to.be.revertedWithCustomError(vault, "ContractPaused");
        });
    });
});
```

---

## Expected Output

When all functions are correctly implemented and you run `npx hardhat test`:

```
  SimpleVault
    Deployment
      ✓ should set the deployer as owner
      ✓ should start unpaused
    Deposits
      ✓ should accept ETH and update balance
      ✓ should emit Deposit event
      ✓ should revert on zero deposit
    Withdrawals
      ✓ should allow withdrawal of deposited amount
      ✓ should revert when withdrawing more than balance
    Access Control
      ✓ should allow only owner to pause
      ✓ should block deposits when paused

  9 passing
```

---

## Bonus Challenges

1. Add a `transferOwnership(address newOwner)` function with proper validation.
2. Add a `receive()` fallback that calls `deposit()` so users can send ETH directly.
3. Track total deposits per user (cumulative, not just current balance) using a separate mapping.
