# Module 00 - Lesson: Solidity Prerequisites

**Duration:** 2 hours
**Prerequisites:** Basic programming knowledge
**Learning Objectives:**
- Review Solidity fundamentals
- Understand Hardhat workflow
- Refresh cryptography basics

---

## Table of Contents

1. [Solidity Data Types](#1-solidity-data-types)
2. [Mappings & Structs](#2-mappings--structs)
3. [Events & Emit](#3-events--emit)
4. [Modifiers & Access Control](#4-modifiers--access-control)
5. [msg.sender, require, revert](#5-msgsender-require-revert)
6. [ERC-20 Standard Overview](#6-erc-20-standard-overview)
7. [Hardhat Testing Basics](#7-hardhat-testing-basics)
8. [Summary](#8-summary)

---

## 1. Solidity Data Types

Solidity is a statically-typed language. Every variable must have its type declared at compile time. The most commonly used types fall into two categories: **value types** and **reference types**.

### 1.1 Value Types

Value types are passed by value -- when you assign them to a new variable or pass them to a function, a copy is made.

#### `uint` / `int`

Unsigned and signed integers. The default size is 256 bits.

```solidity
uint256 public totalSupply;    // 0 to 2^256 - 1
int256  public temperature;    // -(2^255) to 2^255 - 1
uint8   public decimals = 18;  // 0 to 255
```

> **Tip:** Use `uint256` unless you have a specific reason to use a smaller size. The EVM operates on 256-bit words natively.

#### `address`

A 20-byte value representing an Ethereum address.

```solidity
address public owner;
address payable public treasury;  // can receive ETH via .transfer() / .send()
```

#### `bool`

A boolean, either `true` or `false`.

```solidity
bool public paused = false;
```

### 1.2 Reference Types

Reference types store a reference (pointer) to the data location.

#### `string`

UTF-8 encoded text of arbitrary length.

```solidity
string public name = "My Token";
```

#### `bytes`

Dynamically-sized byte array. For fixed sizes use `bytes1` through `bytes32`.

```solidity
bytes32 public merkleRoot;
bytes   public data;
```

### 1.3 Type Comparison Table

| Type      | Size      | Default Value | Example                |
|-----------|-----------|---------------|------------------------|
| `uint256` | 32 bytes  | `0`           | `uint256 x = 42;`     |
| `int256`  | 32 bytes  | `0`           | `int256 y = -1;`      |
| `bool`    | 1 byte    | `false`       | `bool ok = true;`     |
| `address` | 20 bytes  | `0x0...0`     | `address a = msg.sender;` |
| `string`  | dynamic   | `""`          | `string s = "hello";` |
| `bytes`   | dynamic   | `""`          | `bytes b = hex"cafe";`|
| `bytes32` | 32 bytes  | `0x0...0`     | `bytes32 h = keccak256(...);` |

---

## 2. Mappings & Structs

### 2.1 Mappings

A mapping is a key-value store. It is the most gas-efficient way to look up data by a key.

```solidity
// Syntax: mapping(KeyType => ValueType) visibility name;
mapping(address => uint256) public balances;
```

Mappings cannot be iterated, have no length, and all possible keys exist (unmapped keys return the default value for the value type).

#### Nested Mappings

```solidity
// ERC-20 allowance pattern
mapping(address => mapping(address => uint256)) public allowance;

function approve(address spender, uint256 amount) external {
    allowance[msg.sender][spender] = amount;
}
```

### 2.2 Structs

Structs let you define custom composite types.

```solidity
struct Proposal {
    uint256 id;
    string  description;
    uint256 voteCount;
    bool    executed;
}

Proposal[] public proposals;

function createProposal(string calldata _desc) external {
    proposals.push(Proposal({
        id: proposals.length,
        description: _desc,
        voteCount: 0,
        executed: false
    }));
}
```

### 2.3 Combining Mappings and Structs

```solidity
struct UserProfile {
    string  username;
    uint256 reputation;
    bool    exists;
}

mapping(address => UserProfile) public profiles;

function register(string calldata _username) external {
    require(!profiles[msg.sender].exists, "Already registered");
    profiles[msg.sender] = UserProfile(_username, 0, true);
}
```

---

## 3. Events & Emit

Events are the mechanism by which smart contracts communicate with the outside world. When emitted, events write data to the transaction log, which can be read by off-chain applications (frontends, indexers, subgraphs).

### 3.1 Declaring Events

```solidity
event Transfer(address indexed from, address indexed to, uint256 value);
event Deposit(address indexed user, uint256 amount);
```

The `indexed` keyword allows filtering on that parameter when querying logs. You may index up to three parameters per event.

### 3.2 Emitting Events

```solidity
function transfer(address to, uint256 amount) external {
    require(balances[msg.sender] >= amount, "Insufficient balance");

    balances[msg.sender] -= amount;
    balances[to] += amount;

    emit Transfer(msg.sender, to, amount);
}
```

### 3.3 Why Events Matter

- **Off-chain indexing:** Services like The Graph index events to build queryable APIs.
- **Debugging:** Events appear in transaction receipts and are visible in block explorers.
- **Cost:** Events are much cheaper than storage writes. They cost roughly 375 gas for the topic + 8 gas per byte of data.

---

## 4. Modifiers & Access Control

Modifiers allow you to attach reusable preconditions to functions.

### 4.1 The `onlyOwner` Pattern

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Ownable {
    address public owner;
    uint256 public fee;

    error NotOwner();

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;  // <-- placeholder for the function body
    }

    function setFee(uint256 _fee) external onlyOwner {
        // only the owner can call this
        fee = _fee;
    }
}
```

### 4.2 Custom Modifiers

```solidity
modifier whenNotPaused() {
    require(!paused, "Contract is paused");
    _;
}

modifier validAddress(address _addr) {
    require(_addr != address(0), "Invalid address");
    _;
}

function transfer(address to, uint256 amount)
    external
    whenNotPaused
    validAddress(to)
{
    // function body runs after both modifiers pass
}
```

### 4.3 Modifier Execution Order

When you stack multiple modifiers, they execute left to right. Each `_` is replaced by the next modifier (or the function body for the last modifier).

---

## 5. msg.sender, require, revert

### 5.1 `msg.sender`

`msg.sender` is a global variable that holds the address of the account (or contract) that directly called the current function.

```solidity
function whoAmI() external view returns (address) {
    return msg.sender;  // returns the caller's address
}
```

### 5.2 `require`

`require` is used for input validation. If the condition is `false`, the transaction reverts and any state changes in the current call are undone.

```solidity
function withdraw(uint256 amount) external {
    require(amount > 0, "Amount must be > 0");
    require(balances[msg.sender] >= amount, "Insufficient balance");

    balances[msg.sender] -= amount;
    payable(msg.sender).transfer(amount);
}
```

### 5.3 `revert` with Custom Errors

Since Solidity 0.8.4, custom errors provide a gas-efficient alternative to `require` with string messages.

```solidity
error InsufficientBalance(uint256 available, uint256 requested);

function withdraw(uint256 amount) external {
    if (balances[msg.sender] < amount) {
        revert InsufficientBalance(balances[msg.sender], amount);
    }
    // ...
}
```

### 5.4 Comparison

| Pattern | Gas Cost | Use When |
|---------|----------|----------|
| `require(cond, "msg")` | Higher (stores string) | Quick checks, readability |
| `if (!cond) revert CustomError()` | Lower | Production contracts, complex errors |

---

## 6. ERC-20 Standard Overview

ERC-20 is the most widely adopted token standard on Ethereum. It defines a common interface that all fungible tokens implement, enabling interoperability across wallets, DEXs, and DeFi protocols.

### 6.1 Interface

```solidity
interface IERC20 {
    // Returns the total supply of tokens
    function totalSupply() external view returns (uint256);

    // Returns the balance of a specific account
    function balanceOf(address account) external view returns (uint256);

    // Transfers tokens from the caller to a recipient
    function transfer(address to, uint256 amount) external returns (bool);

    // Returns the remaining allowance for a spender
    function allowance(address owner, address spender) external view returns (uint256);

    // Approves a spender to transfer up to `amount` tokens
    function approve(address spender, uint256 amount) external returns (bool);

    // Transfers tokens from one account to another (requires allowance)
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}
```

### 6.2 Minimal Implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SimpleToken {
    string  public name     = "SimpleToken";
    string  public symbol   = "STK";
    uint8   public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(uint256 _initialSupply) {
        totalSupply = _initialSupply * 10 ** decimals;
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");

        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
```

### 6.3 Key Concepts

- **`decimals`:** Most tokens use 18 decimals. USDC uses 6. Always check the decimals of a token before performing arithmetic.
- **Approve/TransferFrom pattern:** Allows contracts (like DEXs) to spend tokens on behalf of the owner. The owner first calls `approve(spender, amount)`, then the spender calls `transferFrom(owner, recipient, amount)`.
- **Zero-address checks:** Production code should check that `to != address(0)` to prevent accidental token burns.

---

## 7. Hardhat Testing Basics

Hardhat is the most popular Solidity development framework. It provides a local EVM environment, compilation, deployment scripting, and a testing framework built on Mocha and Chai.

### 7.1 Project Setup

```bash
mkdir my-project && cd my-project
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

### 7.2 Writing a Test

```javascript
// test/SimpleToken.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleToken", function () {
    let token;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        const SimpleToken = await ethers.getContractFactory("SimpleToken");
        token = await SimpleToken.deploy(1000);
        await token.waitForDeployment();
    });

    describe("Deployment", function () {
        it("should set the correct total supply", async function () {
            const totalSupply = await token.totalSupply();
            expect(totalSupply).to.equal(ethers.parseUnits("1000", 18));
        });

        it("should assign all tokens to the deployer", async function () {
            const ownerBalance = await token.balanceOf(owner.address);
            expect(ownerBalance).to.equal(await token.totalSupply());
        });
    });

    describe("Transfers", function () {
        it("should transfer tokens between accounts", async function () {
            const amount = ethers.parseUnits("100", 18);

            await token.transfer(addr1.address, amount);
            expect(await token.balanceOf(addr1.address)).to.equal(amount);
        });

        it("should revert when sender has insufficient balance", async function () {
            const amount = ethers.parseUnits("1", 18);

            await expect(
                token.connect(addr1).transfer(owner.address, amount)
            ).to.be.revertedWith("Insufficient balance");
        });

        it("should emit a Transfer event", async function () {
            const amount = ethers.parseUnits("50", 18);

            await expect(token.transfer(addr1.address, amount))
                .to.emit(token, "Transfer")
                .withArgs(owner.address, addr1.address, amount);
        });
    });
});
```

### 7.3 Running Tests

```bash
npx hardhat test                    # run all tests
npx hardhat test --grep "transfer"  # run tests matching pattern
npx hardhat test --verbose          # detailed output
```

### 7.4 Common Chai Matchers

| Matcher | Description | Example |
|---------|-------------|---------|
| `expect(x).to.equal(y)` | Strict equality | `expect(balance).to.equal(100n)` |
| `.to.be.revertedWith(msg)` | Expects revert with message | `expect(tx).to.be.revertedWith("...")` |
| `.to.be.revertedWithCustomError` | Expects custom error | `expect(tx).to.be.revertedWithCustomError(contract, "Err")` |
| `.to.emit(contract, event)` | Expects event emission | `expect(tx).to.emit(token, "Transfer")` |
| `.to.changeTokenBalance` | Checks token balance change | `expect(tx).to.changeTokenBalance(token, addr, 100)` |

### 7.5 Fixtures (Performance Optimization)

```javascript
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

async function deployFixture() {
    const [owner, addr1] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("SimpleToken");
    const token = await Token.deploy(1000);
    return { token, owner, addr1 };
}

describe("SimpleToken", function () {
    it("test 1", async function () {
        const { token, owner } = await loadFixture(deployFixture);
        // each test gets a fresh snapshot
    });
});
```

---

## 8. Summary

In this module you reviewed the essential Solidity building blocks:

- **Data types:** `uint256`, `address`, `bool`, `string`, `bytes` -- know when to use each.
- **Mappings & structs:** The primary data structures for on-chain storage.
- **Events:** Cheap, indexable logs for off-chain consumption.
- **Modifiers:** Reusable preconditions that keep your functions clean.
- **Validation:** `require` and custom `revert` errors for robust input checking.
- **ERC-20:** The standard fungible token interface every Solidity developer must know.
- **Hardhat testing:** Write, run, and debug tests locally before deploying.

These fundamentals form the foundation upon which fhEVM builds. In the next module, you will learn what Fully Homomorphic Encryption is and why it matters for blockchain privacy.

---

**Next:** [Module 01 - Introduction to FHE](../01-intro-to-fhe/README.md)
