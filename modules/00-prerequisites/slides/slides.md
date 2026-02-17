---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 00: Prerequisites"
footer: "Zama Developer Program"
---

<style>
section { font-size: 18px; overflow: hidden; color: #1E293B; }
h1 { font-size: 28px; margin-bottom: 8px; color: #1E40AF; border-bottom: 2px solid #DBEAFE; padding-bottom: 6px; }
h2 { font-size: 22px; margin-bottom: 6px; color: #155E75; }
h3 { font-size: 19px; color: #92400E; }
code { font-size: 15px; background: #F1F5F9; color: #3730A3; padding: 1px 4px; border-radius: 3px; }
pre { font-size: 13px; line-height: 1.25; margin: 6px 0; background: #1E293B; color: #E2E8F0; border-radius: 6px; padding: 10px; border-left: 3px solid #6366F1; }
pre code { background: transparent; color: #E2E8F0; padding: 0; }
li { margin-bottom: 1px; line-height: 1.4; }
table { font-size: 15px; border-collapse: collapse; width: 100%; }
th { background: #1E40AF; color: white; padding: 6px 10px; text-align: left; }
td { padding: 5px 10px; border-bottom: 1px solid #E2E8F0; }
tr:nth-child(even) { background: #F8FAFC; }
p { margin-bottom: 4px; }
ul, ol { margin-top: 4px; margin-bottom: 4px; }
header { color: #3B82F6 !important; }
footer { color: #94A3B8 !important; }
section.small { font-size: 15px; }
section.small h1 { font-size: 24px; margin-bottom: 6px; }
section.small ol li { margin-bottom: 0; line-height: 1.3; }
</style>

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

<!--
Speaker notes: Give a quick overview of why these fundamentals matter before jumping into FHE. Reassure students that this is a refresher -- if they already know Solidity well, this module will be fast.
-->

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

<!--
Speaker notes: Stress that uint256 is the default and most common integer type in Solidity. Mention that in FHEVM, these types will have encrypted equivalents -- this table will map directly to Module 03.
-->

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

<!--
Speaker notes: Emphasize that mappings cannot be iterated -- this is a common gotcha for new Solidity developers. The Proposal struct here foreshadows the voting contract in Module 12.
-->

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

<!--
Speaker notes: Walk through the modifier pattern step by step -- the underscore placeholder is where the function body runs. Mention that FHEVM contracts will use similar patterns for access control on encrypted data.
-->

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

<!--
Speaker notes: Highlight that events are critical for frontend integration. In FHEVM, event design changes because you cannot include encrypted amounts in events -- this will be covered in Module 11.
-->

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

<!--
Speaker notes: Make sure students understand the approve-then-transferFrom flow since it will be replicated with encrypted allowances in Module 11. Ask: "Why does ERC-20 need two separate steps instead of one?"
-->

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

<!--
Speaker notes: Briefly walk through describe/beforeEach/it structure. The same test pattern will be used throughout the bootcamp, with added FHE-specific helpers for encrypted inputs and decryption.
-->

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

<!--
Speaker notes: Encourage students to attempt this without looking at the solution first. This vault pattern will be a foundation for the encrypted vault patterns they will build later with FHE.
-->

---

# Key Takeaways

1. **Know your types** -- `uint256` for amounts, `address` for accounts, `bool` for flags
2. **Mappings are your primary storage** -- fast, cheap, but not iterable
3. **Events are essential** -- they bridge on-chain state to off-chain applications
4. **Modifiers keep code DRY** -- reusable access control and validation
5. **`require` / `revert`** -- always validate inputs and state
6. **ERC-20 is foundational** -- every DeFi protocol interacts with this standard
7. **Test everything** -- Hardhat + Chai gives you a complete local testing environment

<!--
Speaker notes: Quickly recap each point and ask if there are any questions before moving on. Remind students that all of these patterns will carry forward into every FHEVM module.
-->

---

# Next Up

## Module 01: Introduction to FHE

- What is Homomorphic Encryption?
- Why does blockchain need privacy?
- How FHEVM brings FHE to Solidity

**See you in Module 01!**

<!--
Speaker notes: Transition to Module 01 by teasing the fundamental question: "What if we could compute on data without ever seeing it?" Let students take a short break if needed.
-->
