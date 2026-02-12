---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 00: Prerequisites"
footer: "Zama Developer Program"
---

# Module 00: Solidity Prerequisites

**FHEVM Bootcamp**

A refresher on Solidity fundamentals before diving into FHE

---

# What You Will Learn

- Solidity data types: `uint`, `address`, `bool`, `string`, `bytes`
- Mappings and structs for on-chain storage
- Access control with modifiers
- Events for off-chain communication
- The ERC-20 token standard
- Writing tests with Hardhat

---

# Solidity Data Types

## Value Types

| Type      | Size     | Example                  |
|-----------|----------|--------------------------|
| `uint256` | 32 bytes | `uint256 total = 1000;`  |
| `int256`  | 32 bytes | `int256 temp = -5;`      |
| `bool`    | 1 byte   | `bool active = true;`    |
| `address` | 20 bytes | `address owner = msg.sender;` |

## Reference Types

| Type     | Size    | Example                    |
|----------|---------|----------------------------|
| `string` | dynamic | `string name = "Token";`   |
| `bytes`  | dynamic | `bytes data = hex"cafe";`  |

---

# Mappings & Structs

## Mappings -- Key-Value Storage

```solidity
mapping(address => uint256) public balances;
mapping(address => mapping(address => uint256)) public allowance;
```

- Cannot be iterated
- All keys exist (default value returned if unset)

## Structs -- Custom Types

```solidity
struct Proposal {
    uint256 id;
    string  description;
    uint256 voteCount;
    bool    executed;
}
```

---

# Access Control

## The `onlyOwner` Modifier

```solidity
address public owner;

modifier onlyOwner() {
    require(msg.sender == owner, "Not the owner");
    _;  // function body executes here
}

function pause() external onlyOwner {
    paused = true;
}
```

## Stacking Modifiers

```solidity
function transfer(address to, uint256 amount)
    external
    whenNotPaused
    validAddress(to)
{ ... }
```

Modifiers execute **left to right**.

---

# Events

## Declaration and Emission

```solidity
event Transfer(address indexed from, address indexed to, uint256 value);
event Deposit(address indexed user, uint256 amount);

function deposit() external payable {
    balances[msg.sender] += msg.value;
    emit Deposit(msg.sender, msg.value);
}
```

## Why Events Matter

- Off-chain indexing (The Graph, Etherscan)
- Transaction receipts and debugging
- Cheaper than storage (~375 gas + 8 gas/byte)
- Up to **3 indexed parameters** per event

---

# ERC-20 Token Standard

## Core Interface

```solidity
function totalSupply()  external view returns (uint256);
function balanceOf(address account) external view returns (uint256);
function transfer(address to, uint256 amount) external returns (bool);
function approve(address spender, uint256 amount) external returns (bool);
function transferFrom(address from, address to, uint256 amount) external returns (bool);
function allowance(address owner, address spender) external view returns (uint256);
```

## Key Flow

```
Owner --approve(spender, 100)--> Contract
Spender --transferFrom(owner, recipient, 50)--> Contract
```

---

# Testing with Hardhat

## Test Structure

```javascript
describe("SimpleToken", function () {
    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();
        const Factory = await ethers.getContractFactory("SimpleToken");
        token = await Factory.deploy(1000);
    });

    it("should transfer tokens", async function () {
        await token.transfer(addr1.address, 100);
        expect(await token.balanceOf(addr1.address)).to.equal(100);
    });

    it("should revert on insufficient balance", async function () {
        await expect(
            token.connect(addr1).transfer(owner.address, 1)
        ).to.be.revertedWith("Insufficient balance");
    });
});
```

Run: `npx hardhat test`

---

# Exercise Preview

## Build a SimpleVault Contract

You will create a contract that:

1. Accepts ETH deposits and tracks balances per user
2. Allows users to withdraw their own funds
3. Emits `Deposit` and `Withdrawal` events
4. Has an `onlyOwner` emergency withdraw function
5. Includes a `pause` mechanism

This exercise combines **all** the concepts from this module.

---

# Key Takeaways

1. **Know your types** -- `uint256` for amounts, `address` for accounts, `bool` for flags
2. **Mappings are your primary storage** -- fast, cheap, but not iterable
3. **Events are essential** -- they bridge on-chain state to off-chain applications
4. **Modifiers keep code DRY** -- reusable access control and validation
5. **`require` / `revert`** -- always validate inputs and state
6. **ERC-20 is foundational** -- every DeFi protocol interacts with this standard
7. **Test everything** -- Hardhat + Chai gives you a complete local testing environment

---

# Next Up

## Module 01: Introduction to FHE

- What is Homomorphic Encryption?
- Why does blockchain need privacy?
- How FHEVM brings FHE to Solidity

**See you in Module 01!**
