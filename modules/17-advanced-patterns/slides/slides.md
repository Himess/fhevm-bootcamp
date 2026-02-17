---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 17: Advanced FHE Design Patterns"
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

# Module 17: Advanced FHE Design Patterns

Six production-grade patterns for building confidential applications.

<!-- Speaker notes: Welcome students to the advanced patterns module. Frame this as the transition from knowing individual FHE operations to knowing how to architect complete applications. Previous modules taught the building blocks; this module teaches how to combine them into robust, user-friendly systems. -->

---

# Learning Objectives

By the end of this module, you will be able to:

1. Implement **encrypted state machines** with private transition conditions
2. Apply the **LastError pattern** for user feedback without information leaks
3. Build **encrypted registries** for flexible key-value storage with sharing
4. Design **cross-contract composability** using explicit ACL grants
5. Manage **encrypted batch processing** with bounded iteration
6. Create **time-locked encrypted values** for scheduled reveals

<!-- Speaker notes: These six patterns are the architectural vocabulary of FHE applications. Every non-trivial FHE application uses at least two or three of these. By the end of this module, students should be able to identify which patterns a given application needs and implement them correctly. -->

---

# From Building Blocks to Architecture

| Level | Modules | Analogy |
|-------|---------|---------|
| Words | 03-09 | Encrypted types, operations, ACL, inputs |
| Sentences | 11-14 | ERC-20, voting, auctions, testing |
| **Paragraphs** | **17** | **Design patterns that solve real problems** |

You know how to write FHE code. Now learn how to **design** FHE systems.

<!-- Speaker notes: Use the analogy to help students see where they are in their learning journey. They have mastered individual operations and even built complete contracts. This module teaches the higher-level thinking needed for production applications. Ask: what is the hardest thing about building your previous projects? Most will say something about user feedback or multi-contract coordination. -->

---

# The Six Patterns Overview

| # | Pattern | Problem It Solves |
|---|---------|-------------------|
| 1 | Encrypted State Machine | Private transition conditions in workflows |
| 2 | LastError | No feedback when FHE operations silently fail |
| 3 | Encrypted Registry | Flexible encrypted data storage with sharing |
| 4 | Cross-Contract Composability | Passing encrypted values between contracts |
| 5 | Encrypted Batch Processing | Multiple FHE operations in one transaction |
| 6 | Time-Locked Encrypted Values | Values that become decryptable at a future time |

<!-- Speaker notes: Give a quick overview of all six patterns before diving into each one. Emphasize that these are not academic exercises -- they appear in every production FHE application. Ask students which ones they think would be most useful for their own project ideas. -->

---

# Pattern 1: Encrypted State Machine

**Public:** Which state the machine is in (IDLE, ACTIVE, COMPLETED)
**Private:** Why and when the transition happens (encrypted threshold)

```solidity
enum State { IDLE, ACTIVE, PAUSED, COMPLETED }
State public currentState;       // Public -- everyone knows which state

euint32 private _threshold;      // Private -- nobody knows the target
euint32 private _counter;        // Private -- nobody knows the count
```

The state enum is intentionally plaintext. Users need to know the current state to interact correctly. The encrypted threshold hides the "distance to transition."

<!-- Speaker notes: The key insight is the separation between public state and private condition. Everyone can see the machine moved from ACTIVE to COMPLETED, but nobody knows that the threshold was 42 or that the counter just reached it. Use cases include escrow release, milestone payments, game logic, and governance escalation. -->

---

# State Machine: Setting the Threshold

```solidity
function setThreshold(externalEuint32 encThreshold,
    bytes calldata inputProof) external onlyOwner {
    euint32 threshold = FHE.fromExternal(encThreshold, inputProof);
    _threshold = threshold;
    FHE.allowThis(_threshold);

    if (!thresholdSet) {
        _counter = FHE.asEuint32(0);
        FHE.allowThis(_counter);
    }
    thresholdSet = true;
}
```

The owner encrypts the threshold client-side. Nobody -- not even the contract -- "knows" the plaintext value. The comparison happens entirely in the FHE domain.

<!-- Speaker notes: Walk through the function. The owner uses createEncryptedInput on the frontend to encrypt the threshold, then submits it. The contract stores the encrypted handle. Note the initialization of _counter to encrypted zero on first setup. The thresholdSet flag prevents re-initialization. -->

---

# State Machine: Check, Reveal, Execute

```solidity
// Step 1: Compare counter to threshold (encrypted)
function checkTransition() external inState(State.ACTIVE) {
    _transitionReady = FHE.ge(_counter, _threshold);
    FHE.allowThis(_transitionReady);
}

// Step 2: Make the result publicly decryptable
function revealTransition() external onlyOwner inState(State.ACTIVE) {
    FHE.makePubliclyDecryptable(_transitionReady);
}

// Step 3: Execute based on decrypted result
function executeTransition(bool isReady) external onlyOwner {
    if (isReady) {
        currentState = State.COMPLETED;
    }
}
```

Three-step process: **check** (encrypted), **reveal** (cross the privacy boundary), **execute** (use the public result).

<!-- Speaker notes: Walk through the three steps. The check uses FHE.ge to compare counter >= threshold, returning an ebool. The reveal makes that ebool publicly decryptable -- this is where the privacy boundary is crossed. The execute step simply uses the now-public boolean. Before reveal, nobody knows whether the threshold was met. After reveal, everyone knows. -->

---

# Pattern 2: The LastError Pattern

**The Problem:** FHE cannot revert on encrypted conditions (reverts leak info).

```
With revert (LEAKS information):
  Alice tries to transfer 500 tokens
  TX reverts: "Insufficient balance"
  Observer now knows: Alice's balance < 500

Without revert (LastError pattern):
  Alice tries to transfer 500 tokens
  TX succeeds (balance unchanged if insufficient)
  Observer knows: Alice attempted a transfer (nothing else)
```

**Solution:** Store an **encrypted error code** per user after each operation.

<!-- Speaker notes: This is arguably the most important pattern for FHE application usability. Ask students: what happens in the ConfidentialERC20 from Module 11 when a transfer fails? Answer: it silently transfers 0. The user has no idea what happened. The LastError pattern solves this by giving each user an encrypted error code they can decrypt to learn the result. -->

---

# LastError: Nested FHE.select Chain

```solidity
mapping(address => euint8) private _lastError;
// 0 = SUCCESS, 1 = INSUFFICIENT_BALANCE, 2 = TOO_LARGE, 3 = SELF_TRANSFER

euint8 errorCode = FHE.asEuint8(0); // Start with SUCCESS

// Check conditions -- later checks have higher priority
errorCode = FHE.select(insufficientBalance, FHE.asEuint8(1), errorCode);
errorCode = FHE.select(isTooLarge,          FHE.asEuint8(2), errorCode);
errorCode = FHE.select(isSelfTransfer,      FHE.asEuint8(3), errorCode);

// Store for the user (encrypted, ACL-protected)
_lastError[msg.sender] = errorCode;
FHE.allowThis(_lastError[msg.sender]);
FHE.allow(_lastError[msg.sender], msg.sender);

// Transfer 0 on any error
ebool isSuccess = FHE.eq(errorCode, FHE.asEuint8(0));
euint64 actual = FHE.select(isSuccess, amount, FHE.asEuint64(0));
```

<!-- Speaker notes: Walk through the nested FHE.select chain. The last select always wins -- if multiple errors apply simultaneously, the highest priority error code is stored. Design the priority order intentionally. The user decrypts their error code client-side using userDecryptEuint. Only the user can decrypt their own error -- an observer sees nothing. -->

---

# LastError: Client-Side Decryption

```typescript
// Frontend: check what happened after a transfer
const errorHandle = await token.connect(alice).getLastError();
const errorCode = await fhevm.userDecryptEuint(
  FhevmType.euint8, errorHandle, tokenAddress, alice
);

switch (errorCode) {
  case 0n: console.log("Transfer succeeded!"); break;
  case 1n: console.log("Insufficient balance"); break;
  case 2n: console.log("Amount exceeds cap"); break;
  case 3n: console.log("Cannot transfer to yourself"); break;
}
```

**Best Practice:** Call `clearError()` before new operations to avoid stale codes.

<!-- Speaker notes: The frontend calls getLastError() to get the encrypted handle, then decrypts it using the user's key. Only the user can see their own error code. An observer sees that Alice called transfer() and it did not revert -- they learn nothing about success or failure. Mention that clearError is optional since each transfer overwrites the previous error. -->

---

# Pattern 3: Encrypted Registry

Per-user encrypted key-value storage with sharing via ACL grants.

```solidity
// Per-user, per-key encrypted value storage
mapping(address => mapping(string => euint64)) private _store;
mapping(address => mapping(string => bool)) private _hasKey;
```

**Use cases:**
- Medical records: `"blood_type"`, `"allergies"`
- Credentials: `"credit_score"`, `"income"`
- Configuration: `"risk_tolerance"`, `"max_position"`

| Data | Public or Private? |
|------|-------------------|
| Key names | Public (stored as plaintext strings) |
| Key existence | Public (`_hasKey` mapping) |
| Number of keys | Public (array length) |
| **Values** | **Private** (encrypted with per-user ACL) |

<!-- Speaker notes: The registry pattern enables flexible encrypted storage beyond just token balances. The double mapping _store[user][key] provides complete isolation between users. Alice's "salary" key is completely separate from Bob's "salary" key. Note the design choice: key names are public for cheap lookups. If you need to hide key names, hash them with keccak256. -->

---

# Registry: Store, Share, Delete

```solidity
// Store a value
function setValue(string calldata key, externalEuint64 encValue,
    bytes calldata inputProof) external {
    euint64 value = FHE.fromExternal(encValue, inputProof);
    _store[msg.sender][key] = value;
    FHE.allowThis(_store[msg.sender][key]);
    FHE.allow(_store[msg.sender][key], msg.sender);
    // ... key tracking updates ...
}

// Share: one ACL grant, no data copied
function shareValue(string calldata key, address recipient) external {
    require(_hasKey[msg.sender][key], "Key does not exist");
    FHE.allow(_store[msg.sender][key], recipient);
}

// Delete: overwrite with encrypted zero, remove from tracking
function deleteValue(string calldata key) external {
    _store[msg.sender][key] = FHE.asEuint64(0);
    // ... swap-and-pop from keys array ...
}
```

<!-- Speaker notes: Sharing is elegant -- a single ACL grant gives the recipient read access to the same encrypted handle. No data is copied or re-encrypted. Deletion overwrites with encrypted zero since we cannot truly delete FHE handles from blockchain state. The swap-and-pop pattern for key array management is a standard Solidity optimization. -->

---

# Pattern 4: Cross-Contract Composability

Passing encrypted data between contracts via explicit ACL grants.

```
1. User holds tokens in Contract A (encrypted balance)
2. User calls A.grantVaultAccess(contractB_address)
   --> FHE.allow(balance, contractB)
3. User calls B.deposit()
   --> B reads A.balanceOf(user) and gets the euint64 handle
   --> B can now perform FHE operations on that handle
4. B stores its own encrypted values
   --> B MUST set ACL on ALL new handles (old ACL does not carry over)
```

**Critical rule:** Every FHE operation produces a new handle with **empty ACL**. Always set permissions explicitly on derived values.

<!-- Speaker notes: Cross-contract composability is essential for multi-contract architectures like the ConfidentialDAO in Module 19. The critical gotcha is that derived values have empty ACL. If Contract B computes a reward from Contract A's balance, the reward handle has no permissions until Contract B explicitly grants them. This catches many developers off guard. -->

---

# Cross-Contract: Interface Design

```solidity
interface IConfidentialToken {
    function balanceOf(address account) external view returns (euint64);
}

contract Vault is ZamaEthereumConfig {
    IConfidentialToken public token;

    function computeReward(address user) external {
        euint64 balance = token.balanceOf(user);
        euint64 reward = FHE.mul(balance, FHE.asEuint64(rewardRate));

        // The reward handle has NO permissions yet!
        _rewards[user] = reward;
        FHE.allowThis(_rewards[user]);   // Contract access
        FHE.allow(_rewards[user], user); // User access
    }
}
```

Every derived encrypted value needs fresh ACL grants.

<!-- Speaker notes: Show the interface pattern for cross-contract FHE. The Vault reads the token balance via the interface, computes a reward using FHE.mul, and stores it. The critical step is setting ACL on the new reward handle. Without allowThis, the Vault cannot use the reward in future operations. Without allow(user), the user cannot decrypt their reward. -->

---

# Pattern 5: Encrypted Batch Processing

**Rule:** Never use unbounded loops with FHE operations.

| Operation | Approximate Gas |
|-----------|----------------|
| `FHE.add(euint64, euint64)` | ~200k |
| `FHE.mul(euint64, euint64)` | ~300k |
| `FHE.select(ebool, euint64, euint64)` | ~250k |
| `FHE.fromExternal()` | ~300k |

**Optimization:** Reduce N FHE operations to fewer operations.

```solidity
// Instead of N separate FHE.add calls:
function performBatchActions(uint8 count) external {
    require(count > 0 && count <= 10, "Count must be 1-10");
    // Single FHE operation regardless of count
    _counter = FHE.add(_counter, FHE.asEuint32(uint32(count)));
    FHE.allowThis(_counter);
}
```

Pre-compute sums in plaintext when possible. Always enforce `MAX_BATCH`.

<!-- Speaker notes: Emphasize the gas costs. A single FHE addition costs roughly 200k gas -- 10x the cost of a standard ERC-20 transfer. A batch of 5 FHE additions costs roughly 1M gas. The optimization shown here reduces N additions to a single addition by pre-computing the sum in plaintext. Not all operations can be optimized this way, but always look for opportunities. -->

---

# Pattern 6: Time-Locked Encrypted Values

Combine `block.timestamp` (plaintext) with `makePubliclyDecryptable()`:

```solidity
uint256 public revealTime;
euint64 private _secretValue;

function setSecret(externalEuint64 encValue, bytes calldata inputProof,
    uint256 lockDuration) external {
    _secretValue = FHE.fromExternal(encValue, inputProof);
    FHE.allowThis(_secretValue);
    revealTime = block.timestamp + lockDuration;
}

function reveal() external {
    require(block.timestamp >= revealTime, "Too early");
    FHE.makePubliclyDecryptable(_secretValue);
}
```

**Before** `revealTime`: encrypted, only the contract can operate on it.
**After** `revealTime`: anyone can call `reveal()` and decrypt.

<!-- Speaker notes: Time-locked encryption is simpler than traditional commit-reveal because users do not need a separate reveal transaction. The FHE ciphertext is already on-chain -- we just control when it becomes decryptable. Note that block.timestamp is public and slightly manipulable by validators (+-15 seconds). For high-stakes applications, use block numbers instead. -->

---

# Time-Lock: Commit-Reveal Without the Reveal

Traditional commit-reveal requires three steps:
1. Commit a hash
2. Wait for deadline
3. Each user reveals their plaintext (separate transaction per user)

FHE time-lock simplifies to two steps:
1. Submit encrypted values (they are already on-chain)
2. After deadline, call `reveal()` once for all values

```
Phase 1 (Commit): Users submit encrypted values
Phase 2 (Lock):   No new submissions after deadline
Phase 3 (Reveal): Anyone calls reveal() after lockTime
   --> FHE.makePubliclyDecryptable() on all committed values
```

No per-user reveal transactions needed. The FHE system handles it.

<!-- Speaker notes: This simplification has practical implications. In a sealed-bid auction with 100 bidders, traditional commit-reveal requires 100 reveal transactions. FHE time-lock requires a single reveal call (or one per bid if you want granular control). The gas savings and UX improvement are significant. -->

---

# Combining Patterns: Real Applications

Real applications use multiple patterns simultaneously:

**Encrypted Escrow** (this module's exercise):
- State Machine: `CREATED -> FUNDED -> RELEASED / EXPIRED`
- LastError: Error codes for failed releases
- Time-Lock: Funds auto-release after deadline
- Cross-Contract: Reads token balances via ACL

**Confidential DEX:**
- State Machine: Order lifecycle `OPEN -> MATCHED -> SETTLED`
- Registry: Order book with encrypted prices and quantities
- Batch Processing: Match multiple orders in one transaction

**Private Game:**
- State Machine: `LOBBY -> PLAYING -> FINISHED`
- LastError: Invalid move feedback
- Time-Lock: Moves revealed after round timer

<!-- Speaker notes: Walk through each example and ask students which patterns they can identify. The escrow combines three patterns and is the exercise for this module. The confidential DEX is previewed for Module 18. The private game shows how patterns apply beyond finance. Emphasize that pattern selection is the first design decision. -->

---

# Design Principles for Production FHE

1. **Minimize FHE operations** -- Each costs 10-100x more gas than plaintext
2. **ACL is your access control layer** -- Use `FHE.allow()` and `FHE.allowThis()` consistently
3. **Never branch on encrypted conditions** -- Use `FHE.select()` instead of `if/else`
4. **Use the LastError pattern for feedback** -- Silent failures are terrible UX
5. **Keep state public when possible** -- Only encrypt what must be private
6. **Bound all loops** -- Never iterate unbounded with FHE inside the loop
7. **Design for composability** -- Use interfaces and ACL grants for cross-contract flow
8. **Test with known values** -- Encrypt known plaintext, decrypt results to verify

<!-- Speaker notes: These eight principles should guide every FHE contract design decision. Read through each one and give a concrete example. Ask students which principle they have violated most often in previous modules. The most common mistakes are forgetting ACL on new handles (principle 2) and branching on encrypted conditions (principle 3). -->

---

# Pattern Selection Guide

| If you need... | Use this pattern |
|----------------|-----------------|
| Workflow with private conditions | Encrypted State Machine |
| User feedback without info leaks | LastError Pattern |
| Flexible encrypted data storage | Encrypted Registry |
| Multi-contract encrypted data flow | Cross-Contract Composability |
| Multiple FHE operations per tx | Encrypted Batch Processing |
| Reveal encrypted data at a future time | Time-Locked Encrypted Values |

Most non-trivial applications need **two or three** patterns.

<!-- Speaker notes: This is a reference slide students should bookmark. When designing a new FHE application, start by identifying which patterns you need. The exercise demonstrates combining three patterns. The capstone in Module 19 will combine even more. Ask students to identify which patterns their dream project would need. -->

---

# Summary and Key Takeaways

1. **Encrypted State Machine** -- Public states with private transition conditions
2. **LastError Pattern** -- Encrypted error codes per user for silent-failure feedback
3. **Encrypted Registry** -- Per-user key-value storage with ACL-based sharing
4. **Cross-Contract Composability** -- Explicit ACL grants between contracts
5. **Encrypted Batch Processing** -- Bounded iteration with gas-aware batch sizes
6. **Time-Locked Encrypted Values** -- `block.timestamp` guards + `makePubliclyDecryptable()`

These patterns appear in **every** production FHE application. The difference between a toy demo and a production system is how well these patterns are applied.

<!-- Speaker notes: Summarize by emphasizing that these patterns are not theoretical. They are the difference between a contract that works in a test and one that works in production. Reinforce the key principles: minimize FHE ops, always set ACL, never branch on encrypted conditions, and use LastError for user feedback. -->

---

# Exercise: Encrypted Escrow

Build an `EncryptedEscrow` contract combining three patterns:

| Pattern | Usage |
|---------|-------|
| State Machine | `CREATED -> FUNDED -> RELEASED / EXPIRED` |
| LastError | Error codes when release conditions are not met |
| Time-Lock | Funds auto-expire after a configurable deadline |

**Requirements:**
- Buyer deposits encrypted funds, arbiter releases
- Release checks an encrypted minimum amount condition
- After deadline, buyer can reclaim funds
- Error codes: `0 = SUCCESS`, `1 = BELOW_MINIMUM`, `2 = EXPIRED`

Starter code: `exercises/17-patterns-exercise.sol`

<!-- Speaker notes: This exercise asks students to combine three patterns into a working escrow. It mirrors how real production contracts combine multiple patterns. Give students 60-90 minutes. The key challenge is getting the state transitions, LastError, and time-lock to work together without information leaks. Remind them: no reverts on encrypted conditions! -->

---

# What is Next?

**Module 18: Confidential DeFi**
- Encrypted lending protocol with LTV checks
- Encrypted order book with private prices
- Privacy trade-offs and gas cost analysis

**Module 19: Capstone -- Confidential DAO**
- Combines ALL patterns into a full governance application
- Governance tokens + weighted voting + treasury management

You now have the design vocabulary for production FHE applications.

<!-- Speaker notes: Give students a preview of the next two modules. Module 18 applies these patterns to DeFi-specific problems. Module 19 is the capstone that brings everything together. Encourage students to think about which patterns from this module will appear in those projects. Answer: almost all of them. -->
