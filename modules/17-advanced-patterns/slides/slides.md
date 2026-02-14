---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 17: Advanced FHE Design Patterns"
footer: "Zama Developer Program"
---

# Module 17: Advanced FHE Design Patterns

Six patterns for building production-grade confidential applications.

---

# Why Advanced Patterns?

Basic FHE gives you **encrypted variables** and **operations**.

Advanced patterns give you **architecture**:

- How to structure stateful workflows with private conditions
- How to give users feedback when operations silently fail
- How to build flexible encrypted data storage
- How to connect multiple encrypted contracts

<!--
Speaker notes: Frame this as the transition from knowing individual FHE operations to knowing how to design complete applications. Students already know the building blocks. This module teaches them how to assemble those blocks into robust, user-friendly systems.
-->

---

# The Six Patterns

| # | Pattern | Key Problem |
|---|---------|------------|
| 1 | Encrypted State Machine | Private transition conditions |
| 2 | LastError | User feedback without info leaks |
| 3 | Encrypted Registry | Flexible encrypted key-value storage |
| 4 | Cross-Contract Composability | Multi-contract encrypted data flow |
| 5 | Batch Processing | Multiple FHE ops per transaction |
| 6 | Time-Locked Values | Timed reveal of encrypted data |

<!--
Speaker notes: Give a quick overview of all six patterns before diving into each one. Emphasize that these are not academic exercises -- they appear in every production FHE application. Ask students which ones they think would be most useful for their projects.
-->

---

# Pattern 1: Encrypted State Machine

**Public:** Which state the machine is in (IDLE, ACTIVE, COMPLETED)

**Private:** Why and when the transition happens (encrypted threshold)

```solidity
enum State { IDLE, ACTIVE, PAUSED, COMPLETED }
State public currentState;       // Public

euint32 private _threshold;      // Private
euint32 private _counter;        // Private
```

<!--
Speaker notes: The key insight is the separation between public state and private condition. Everyone can see the machine moved from ACTIVE to COMPLETED, but nobody knows that the threshold was 42 or that the counter just reached it. Use cases include escrow release, milestone payments, and game logic.
-->

---

# State Machine: Transition Check

```solidity
// Compare counter to threshold -- entirely encrypted
function checkTransition() external inState(State.ACTIVE) {
    _transitionReady = FHE.ge(_counter, _threshold);
    FHE.allowThis(_transitionReady);
}

// Reveal the result
function revealTransition() external onlyOwner {
    FHE.makePubliclyDecryptable(_transitionReady);
}

// Execute based on decrypted result
function executeTransition(bool isReady) external onlyOwner {
    if (isReady) {
        currentState = State.COMPLETED;
    }
}
```

<!--
Speaker notes: Walk through the three-step process: check (encrypted comparison), reveal (make publicly decryptable), execute (use the decrypted boolean). The reveal step is where the privacy boundary is crossed. Before reveal, nobody knows. After reveal, everyone knows. The execute step simply uses the now-public information.
-->

---

# Pattern 2: The LastError Pattern

**The Problem:** FHE cannot revert on encrypted conditions (reverts leak info).

Using `FHE.select()` alone silently transfers 0 on failure.

**User experience:** "Did my transfer work?" ... silence.

**Solution:** Store an **encrypted error code** per user.

```solidity
mapping(address => euint8) private _lastError;

// 0 = SUCCESS
// 1 = INSUFFICIENT_BALANCE
// 2 = AMOUNT_TOO_LARGE
// 3 = SELF_TRANSFER
```

<!--
Speaker notes: This is the most important pattern for usability. Ask students: what happens in the ConfidentialERC20 when a transfer fails? Answer: it silently transfers 0. The user has no idea what happened. The LastError pattern solves this by giving each user an encrypted error code they can decrypt to learn the result.
-->

---

# LastError: How It Works

```solidity
euint8 errorCode = FHE.asEuint8(0); // SUCCESS

// Check conditions, set error codes (later = higher priority)
errorCode = FHE.select(insufficientBalance,
    FHE.asEuint8(1), errorCode);
errorCode = FHE.select(isTooLarge,
    FHE.asEuint8(2), errorCode);
errorCode = FHE.select(isSelfTransfer,
    FHE.asEuint8(3), errorCode);

// Store for user
_lastError[msg.sender] = errorCode;
FHE.allow(_lastError[msg.sender], msg.sender);

// Transfer 0 on any error
ebool isSuccess = FHE.eq(errorCode, FHE.asEuint8(0));
euint64 actual = FHE.select(isSuccess, amount, FHE.asEuint64(0));
```

<!--
Speaker notes: Walk through the nested FHE.select chain. The last select always wins. If multiple errors apply (e.g., self-transfer AND too large), the highest priority error code is stored. The user decrypts their error code client-side to learn what happened. Only the user can decrypt their own error.
-->

---

# LastError: User-Side Decryption

```typescript
// After a transfer, check what happened:
const errorHandle = await token.connect(alice).getLastError();
const errorCode = await fhevm.userDecryptEuint(
  FhevmType.euint8, errorHandle, tokenAddress, alice
);

switch (errorCode) {
  case 0n: console.log("Success!"); break;
  case 1n: console.log("Insufficient balance"); break;
  case 2n: console.log("Amount exceeds cap"); break;
  case 3n: console.log("Cannot self-transfer"); break;
}
```

<!--
Speaker notes: The frontend calls getLastError() to get the encrypted handle, then decrypts it using the user's key. Only the user can see their own error code. An observer sees that Alice called transfer() and it did not revert -- they learn nothing about whether it succeeded or why it failed.
-->

---

# Pattern 3: Encrypted Registry

Per-user encrypted key-value storage with sharing.

```solidity
mapping(address => mapping(string => euint64)) private _store;

// Alice stores: "salary" -> encrypted(85000)
// Bob stores:   "salary" -> encrypted(72000)
// Complete isolation between users
```

**Sharing:** `FHE.allow(_store[msg.sender][key], recipient)`

The recipient gets read access to the same handle -- no data copied.

<!--
Speaker notes: The registry pattern enables flexible encrypted storage beyond just token balances. Use cases include medical records, credit scores, configuration parameters, and any scenario where users need to store arbitrary encrypted values. The sharing mechanism leverages FHE's ACL system naturally -- one line grants read access.
-->

---

# Pattern 4: Cross-Contract Composability

Passing encrypted data between contracts via ACL grants.

```
1. User holds tokens in Contract A
2. User calls: A.grantAccess(contractB)
   --> FHE.allow(balance, contractB)
3. Contract B reads: A.balanceOf(user)
   --> Gets the euint64 handle
4. Contract B computes new values
   --> Must set ACL on ALL new handles
```

**Key rule:** New handles from FHE operations have **empty ACL**.

<!--
Speaker notes: Cross-contract composability is essential for multi-contract architectures like our ConfidentialDAO (Module 19). The critical gotcha is that derived values have empty ACL. If Contract B computes a reward from Contract A's balance, the reward handle has no permissions until Contract B explicitly grants them.
-->

---

# Pattern 5: Encrypted Batch Processing

**Rule:** Always bound your loops.

```solidity
uint256 public constant MAX_BATCH = 5;

function distributeRewards(address[] calldata users) external {
    require(users.length <= MAX_BATCH, "Too large");

    for (uint256 i = 0; i < users.length; i++) {
        _balances[users[i]] = FHE.add(
            _balances[users[i]], FHE.asEuint64(reward));
        FHE.allowThis(_balances[users[i]]);
        FHE.allow(_balances[users[i]], users[i]);
    }
}
```

FHE.add() costs ~200k gas. 5 iterations = ~1M gas.

<!--
Speaker notes: Emphasize the gas costs. A single FHE addition costs roughly 200k gas -- that is 10x the cost of a standard ERC-20 transfer. Students must always think about gas when designing batch operations. Show the math: 5 FHE.add operations plus 10 FHE.allow calls adds up quickly. Always enforce a maximum batch size.
-->

---

# Pattern 6: Time-Locked Encrypted Values

Combine `block.timestamp` (plaintext) with `makePubliclyDecryptable()`:

```solidity
uint256 public revealTime;
euint64 private _secretValue;

function setSecret(externalEuint64 enc, bytes calldata proof,
    uint256 lockDuration) external {
    _secretValue = FHE.fromExternal(enc, proof);
    revealTime = block.timestamp + lockDuration;
}

function reveal() external {
    require(block.timestamp >= revealTime, "Too early");
    FHE.makePubliclyDecryptable(_secretValue);
}
```

<!--
Speaker notes: Time-locked encryption is simpler than traditional commit-reveal because users do not need a separate reveal transaction. The FHE ciphertext is already on-chain -- we just control when it becomes decryptable. The time check is plaintext (block.timestamp) which is public and slightly manipulable by validators. For high-stakes applications, use block numbers instead.
-->

---

# Combining Patterns: Encrypted Escrow

The exercise combines three patterns:

```
State Machine: CREATED -> FUNDED -> RELEASED / EXPIRED
LastError:     Error codes for failed releases
Time-Lock:     Funds expire after deadline
```

```solidity
function releaseFunds() external onlyArbiter inState(FUNDED) {
    require(block.timestamp < deadline, "Expired");

    ebool meetsMin = FHE.ge(_amount, _minimum);
    euint8 error = FHE.select(meetsMin,
        FHE.asEuint8(0), FHE.asEuint8(1));
    _lastError[msg.sender] = error;
    // ...
}
```

<!--
Speaker notes: The exercise asks students to build an escrow that uses the state machine for lifecycle management, LastError for feedback when release conditions are not met, and time-lock for automatic expiration. This mirrors how real production contracts combine multiple patterns. Walk through the key function to show how the patterns interact.
-->

---

# Design Principles Summary

1. **Minimize FHE operations** -- Each costs 10-100x more gas
2. **Never branch on encrypted conditions** -- Use `FHE.select()`
3. **Always set ACL on new handles** -- New handles have empty ACL
4. **Use LastError for feedback** -- Silent failures are bad UX
5. **Keep state public when possible** -- Only encrypt what must be private
6. **Bound all loops** -- Never unbounded FHE iteration
7. **Design for composability** -- Use interfaces + ACL grants

<!--
Speaker notes: These seven principles should guide every FHE contract design decision. Read through each one and give a concrete example. Ask students which principle they have violated most often in previous modules. The most common mistakes are forgetting ACL on new handles (principle 3) and branching on encrypted conditions (principle 2).
-->

---

# Pattern Selection Guide

| If you need... | Use... |
|----------------|--------|
| Workflow with private conditions | State Machine |
| User feedback without info leaks | LastError |
| Flexible encrypted data storage | Registry |
| Multi-contract encrypted data flow | Cross-Contract |
| Multiple FHE ops per transaction | Batch Processing |
| Reveal data at a future time | Time-Lock |

<!--
Speaker notes: This is a reference slide students should bookmark. When designing a new FHE application, start by identifying which patterns you need. Most non-trivial applications use at least two or three patterns. The exercise demonstrates combining three patterns, and the capstone in Module 19 will combine even more.
-->

---

# What is Next?

- **Exercise:** Build an Encrypted Escrow using State Machine + LastError + Time-Lock
- **Module 19:** Capstone project combining all patterns into a Confidential DAO

You now have the design vocabulary for production FHE applications.

<!--
Speaker notes: Summarize the module by emphasizing that these patterns are the difference between a toy FHE contract and a production one. The exercise is challenging but directly applicable. Encourage students to think about which patterns they would use in their own project ideas.
-->
