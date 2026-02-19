# Module 17: Advanced FHE Design Patterns -- Lesson

**Duration:** 4 hours
**Prerequisites:** Module 16
**Learning Objectives:**
- Implement encrypted state machines and registries
- Master cross-contract FHE composability
- Build advanced data structures with encrypted values

## Introduction: Beyond Basic FHE

By now you know how to declare encrypted types, perform FHE operations, manage ACL permissions, handle encrypted inputs, request decryptions, and use conditional logic with `FHE.select()`. Those are the building blocks. This module teaches you how to combine them into **design patterns** that solve real problems in production confidential applications.

Think of it this way: Modules 03-09 taught you individual FHE "words." Modules 11-14 taught you to write "sentences." This module teaches you "paragraph structure" -- the higher-level patterns that determine whether your confidential application is robust, user-friendly, and gas-efficient.

We cover six patterns:

| Pattern | Problem It Solves | Key Technique |
|---------|------------------|---------------|
| Encrypted State Machine | Private transition conditions in workflows | `FHE.ge()` + `FHE.select()` on encrypted thresholds |
| LastError | No feedback when FHE operations silently fail | Encrypted error codes per user |
| Encrypted Registry | Flexible encrypted data storage with sharing | Nested mappings + ACL grants |
| Cross-Contract Composability | Passing encrypted values between contracts | `FHE.allow(handle, otherContract)` |
| Encrypted Batch Processing | Multiple FHE operations in one transaction | Bounded loops + gas awareness |
| Time-Locked Encrypted Values | Values that become decryptable at a future time | `block.timestamp` guards + `makePubliclyDecryptable()` |

---

## Pattern 1: Encrypted State Machines

### Why This Pattern Exists

Many decentralized applications follow a state machine: an escrow moves from Funded to Released, a game moves from Lobby to Playing to Finished, a milestone payment moves from Pending to Approved. In traditional Solidity, the transition conditions are public -- everyone can see *why* a state changed.

With FHE, we can make the **transition condition private** while keeping the **state itself public**. This is a powerful separation:

- **Public:** Which state the machine is in (observers need to know this to interact correctly)
- **Private:** Why and when the transition will happen (the encrypted threshold, counter, or condition)

### Use Cases

- **Escrow release:** Funds release when an encrypted milestone metric reaches a private target
- **Game logic:** A game round ends when an encrypted score reaches a hidden threshold
- **Milestone payments:** Payment unlocks when an encrypted deliverable count hits a private goal
- **Governance escalation:** A proposal escalates when encrypted support reaches a private quorum

### Implementation Walkthrough

Let us examine `EncryptedStateMachine.sol`:

```solidity
enum State {
    IDLE,
    ACTIVE,
    PAUSED,
    COMPLETED
}

State public currentState; // Public: everyone knows which state

euint32 private _threshold;  // Private: nobody knows the target
euint32 private _counter;    // Private: nobody knows the current count
```

The state enum is stored in plaintext. This is intentional -- if the state were encrypted, users would not know whether they can perform actions. The threshold and counter are encrypted, so the "distance to transition" is hidden.

**Setting the threshold:**

```solidity
function setThreshold(externalEuint32 encThreshold, bytes calldata inputProof) external onlyOwner {
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

The owner encrypts the threshold client-side and submits it. Nobody -- not even the contract -- "knows" the plaintext value. The comparison happens entirely in the FHE domain.

**Incrementing the counter:**

```solidity
function performAction() external inState(State.ACTIVE) {
    _counter = FHE.add(_counter, FHE.asEuint32(1));
    FHE.allowThis(_counter);

    actionCount++;
    emit ActionPerformed(msg.sender, actionCount);
}
```

Notice that `actionCount` is public (observers can see how many actions have been performed), but `_counter` is encrypted. In this simple example they track the same value, but in a real application you might have a more complex encrypted metric that differs from the public action count.

**Checking the transition:**

```solidity
function checkTransition() external inState(State.ACTIVE) {
    _transitionReady = FHE.ge(_counter, _threshold);
    FHE.allowThis(_transitionReady);
}
```

`FHE.ge()` computes whether `counter >= threshold` entirely in the encrypted domain. The result is an `ebool` -- nobody can read it without decryption.

**Revealing and executing:**

```solidity
function revealTransition() external onlyOwner inState(State.ACTIVE) {
    FHE.makePubliclyDecryptable(_transitionReady);
}

function executeTransition(bool isReady) external onlyOwner inState(State.ACTIVE) {
    if (isReady) {
        currentState = State.COMPLETED;
    }
}
```

The owner makes the transition result publicly decryptable, then submits the decrypted boolean. If the condition was met, the state advances. If not, the machine stays ACTIVE for more actions.

### Key Insight

The state machine pattern separates **what** (which state, public) from **why** (the condition, private). Observers see `ACTIVE -> COMPLETED` but never learn that the threshold was 42 or that the counter reached it on the 42nd action. They only learn that *some* encrypted condition was satisfied.

---

## Pattern 2: The LastError Pattern

### The Problem

This is arguably the most important pattern for FHE application usability. Here is the core problem:

In traditional Solidity, when a transfer fails due to insufficient balance, the transaction **reverts** with an error message. The user sees "Insufficient balance" in their wallet. Simple.

In FHE Solidity, we **cannot revert based on encrypted conditions**. Why? Because a revert is a public signal. If `transfer(encrypted_amount)` reverts only when the balance is too low, an observer can learn about the user's balance by watching which transactions revert. This is an information leak.

The standard FHE approach is to use `FHE.select()`:

```solidity
// Standard approach: silently transfer 0 on failure
ebool hasBalance = FHE.ge(balance, amount);
euint64 actualAmount = FHE.select(hasBalance, amount, FHE.asEuint64(0));
```

This never reverts. If the balance is insufficient, it transfers 0. But the user gets **no feedback** -- they do not know whether their transfer succeeded or failed, or why.

### The Solution: Encrypted Error Codes

The LastError pattern stores an **encrypted error code** per user after each operation:

```solidity
mapping(address => euint8) private _lastError;

// Error codes:
// 0 = SUCCESS
// 1 = INSUFFICIENT_BALANCE
// 2 = AMOUNT_TOO_LARGE
// 3 = SELF_TRANSFER
```

After a transfer, the contract computes an encrypted error code using nested `FHE.select()`:

```solidity
euint8 errorCode = FHE.asEuint8(0); // Start with SUCCESS

// If insufficient balance, set error to 1
errorCode = FHE.select(insufficientBalance, FHE.asEuint8(1), errorCode);

// If amount too large, set error to 2 (overrides insufficient balance)
errorCode = FHE.select(isTooLarge, FHE.asEuint8(2), errorCode);

// If self-transfer, set error to 3 (highest priority)
errorCode = FHE.select(isSelfTransfer, FHE.asEuint8(3), errorCode);

// Store for the user
_lastError[msg.sender] = errorCode;
FHE.allowThis(_lastError[msg.sender]);
FHE.allow(_lastError[msg.sender], msg.sender);
```

The user can then decrypt their error code:

```typescript
// Frontend: check what happened
const errorHandle = await token.connect(alice).getLastError();
const errorCode = await fhevm.userDecryptEuint(
  FhevmType.euint8, errorHandle, tokenAddress, alice
);

if (errorCode === 0n) console.log("Transfer succeeded!");
if (errorCode === 1n) console.log("Insufficient balance");
if (errorCode === 2n) console.log("Amount exceeds cap");
if (errorCode === 3n) console.log("Cannot transfer to yourself");
```

### Why This Is Private

The error code is encrypted and ACL-protected to the user. Only Alice can decrypt Alice's error. An observer sees that Alice called `transfer()` and it did not revert -- they learn nothing about whether it succeeded or failed.

### Error Code Priority

When multiple conditions fail simultaneously (for example, a self-transfer that also exceeds the cap), the last `FHE.select()` in the chain wins. Design your priority order intentionally:

```
Low priority    -->    High priority
INSUFFICIENT_BALANCE   AMOUNT_TOO_LARGE   SELF_TRANSFER
```

The code evaluates in order: if insufficient balance is set to 1, then amount-too-large overrides to 2, then self-transfer overrides to 3. This means the user always sees the "most important" error.

### Best Practice: Clear Before New Operations

```solidity
function clearError() external {
    _lastError[msg.sender] = FHE.asEuint8(0);
    FHE.allowThis(_lastError[msg.sender]);
    FHE.allow(_lastError[msg.sender], msg.sender);
}
```

Encourage users to call `clearError()` before performing a new operation. This prevents confusion from stale error codes. Alternatively, the `transfer()` function always overwrites the previous error, so calling clear is optional.

### Implementation Detail

Let us look at how the error code determines the actual transfer amount:

```solidity
// Only transfer if error code is 0 (SUCCESS)
ebool isSuccess = FHE.eq(errorCode, FHE.asEuint8(0));
euint64 actualAmount = FHE.select(isSuccess, amount, FHE.asEuint64(0));

// Update balances with actualAmount (0 on any error)
_balances[msg.sender] = FHE.sub(_balances[msg.sender], actualAmount);
_balances[to] = FHE.add(_balances[to], actualAmount);
```

The actual transfer amount is determined by the error code. If any error occurred, `actualAmount` is 0, so balances do not change. This is elegant: the error code computation and the transfer logic are unified through a single `isSuccess` check.

---

## Pattern 3: Encrypted Registries

### The Problem

Applications often need flexible encrypted storage -- not just tokens with fixed balance semantics, but arbitrary encrypted key-value pairs that users can store, retrieve, share, and delete.

Consider these use cases:
- A user stores encrypted medical records under keys like "blood_type", "allergies"
- A credential system stores encrypted scores under keys like "credit_score", "income"
- A configuration system stores encrypted parameters under keys like "risk_tolerance", "max_position"

### Implementation Walkthrough

`EncryptedRegistry.sol` implements a per-user encrypted key-value store:

```solidity
// Per-user, per-key encrypted value storage
mapping(address => mapping(string => euint64)) private _store;

// Track whether a key has been set (plaintext, for existence checks)
mapping(address => mapping(string => bool)) private _hasKey;
```

The double mapping `_store[user][key]` provides complete isolation between users. Alice's "salary" key is completely separate from Bob's "salary" key.

The `_hasKey` mapping is stored in plaintext. This is a design choice: existence of a key is public information, but the value is private. If you need to hide even the existence of keys, you would omit this mapping (at the cost of not being able to check existence cheaply).

**Storing a value:**

```solidity
function setValue(string calldata key, externalEuint64 encValue, bytes calldata inputProof) external {
    euint64 value = FHE.fromExternal(encValue, inputProof);

    _store[msg.sender][key] = value;
    FHE.allowThis(_store[msg.sender][key]);
    FHE.allow(_store[msg.sender][key], msg.sender);

    if (!_hasKey[msg.sender][key]) {
        _keyIndex[msg.sender][key] = _userKeys[msg.sender].length;
        _userKeys[msg.sender].push(key);
        _hasKey[msg.sender][key] = true;
    }
}
```

The key tracking arrays (`_userKeys`, `_keyIndex`) enable enumeration -- the user can list all their keys and iterate over them. This uses a swap-and-pop pattern for efficient deletion.

**Sharing a value:**

```solidity
function shareValue(string calldata key, address recipient) external {
    require(_hasKey[msg.sender][key], "Key does not exist");
    FHE.allow(_store[msg.sender][key], recipient);
}
```

Sharing is a single ACL grant. The recipient gets read access to the same encrypted handle -- no data is copied or re-encrypted. This is gas-efficient and leverages the FHE ACL system naturally.

The recipient reads the shared value through a separate function:

```solidity
function getSharedValue(address owner_, string calldata key) external view returns (euint64) {
    return _store[owner_][key];
}
```

**Deleting a value:**

```solidity
function deleteValue(string calldata key) external {
    _store[msg.sender][key] = FHE.asEuint64(0);
    FHE.allowThis(_store[msg.sender][key]);

    // Remove from keys array using swap-and-pop
    uint256 index = _keyIndex[msg.sender][key];
    uint256 lastIndex = _userKeys[msg.sender].length - 1;
    if (index != lastIndex) {
        string memory lastKey = _userKeys[msg.sender][lastIndex];
        _userKeys[msg.sender][index] = lastKey;
        _keyIndex[msg.sender][lastKey] = index;
    }
    _userKeys[msg.sender].pop();
    delete _keyIndex[msg.sender][key];
    _hasKey[msg.sender][key] = false;
}
```

We cannot truly "delete" an FHE handle from the blockchain -- the ciphertext is stored in the blockchain state forever. Instead, we overwrite it with encrypted zero and remove the key from tracking. From the application's perspective, the key no longer exists.

### Design Decision: What Should Be Public?

In the registry pattern, you must decide what metadata is public:

| Data | Public or Private? | Rationale |
|------|-------------------|-----------|
| Key names | Public | String keys are stored in plaintext for cheap lookups |
| Key existence | Public | The `_hasKey` mapping is plaintext |
| Number of keys | Public | Array length is plaintext |
| Values | **Private** | Encrypted with per-user ACL |

If you need to hide key names, you could hash them (`keccak256(key)`) and use `bytes32` instead of `string`. If you need to hide even the number of keys, you would need a more complex data structure (e.g., a fixed-size array with encrypted "empty" markers).

---

## Pattern 4: Cross-Contract Composability

### The Challenge

In a multi-contract system, Contract A might store an encrypted value that Contract B needs to read. FHE's ACL system prevents unauthorized access -- so how do you grant one contract access to another contract's encrypted data?

### The Solution: Explicit ACL Grants

The key insight is that ACL permissions can be granted to **any address**, including contract addresses:

```solidity
// In Contract A (Token):
function grantVaultAccess(address vault) external {
    // msg.sender (the user) grants the Vault contract access to their balance
    FHE.allow(_balances[msg.sender], vault);
}

// In Contract B (Vault):
function deposit() external {
    // The Vault can now read the user's token balance
    euint64 userBalance = token.balanceOf(msg.sender);
    // ... use userBalance in FHE operations ...
}
```

### The Flow

```
1. User holds tokens in Contract A (encrypted balance)
2. User calls A.grantVaultAccess(contractB_address)
   --> FHE.allow(balance, contractB)
3. User calls B.deposit()
   --> B reads A.balanceOf(user) and gets the euint64 handle
   --> B can now perform FHE operations on that handle
4. B stores its own encrypted values and grants ACL as needed
```

### Interface Design

When designing contracts that accept encrypted values from other contracts, define clear interfaces:

```solidity
interface IConfidentialToken {
    function balanceOf(address account) external view returns (euint64);
}

contract Vault is ZamaEthereumConfig {
    IConfidentialToken public token;

    function deposit(uint256 amount) external {
        euint64 balance = token.balanceOf(msg.sender);
        // Vault can now use this encrypted balance
    }
}
```

### Important: ACL Propagation

When Contract B creates a **new** encrypted value by operating on Contract A's data, the new value has its own ACL. You must explicitly grant permissions on the new value:

```solidity
function computeReward(address user) external {
    euint64 balance = token.balanceOf(user);
    euint64 reward = FHE.mul(balance, FHE.asEuint64(rewardRate));

    // The reward handle has NO permissions yet -- not even for the user
    _rewards[user] = reward;
    FHE.allowThis(_rewards[user]);
    FHE.allow(_rewards[user], user);
}
```

Every FHE operation produces a new handle with empty ACL. Always set permissions explicitly.

### Cross-Contract Pattern Summary

```
Contract A stores encrypted data
    |
    v
User grants Contract B access: FHE.allow(handle, contractB)
    |
    v
Contract B reads handle via Contract A's view function
    |
    v
Contract B computes new encrypted values
    |
    v
Contract B sets ACL on NEW values (the old ACL does not carry over)
```

---

## Pattern 5: Encrypted Batch Processing

### Why Batch?

Some operations naturally work on multiple items: distributing rewards to N users, updating N encrypted scores, or processing N encrypted votes. Doing these one-at-a-time costs N transactions, each with base gas overhead.

### The Rule: Bounded Iteration Only

Never use unbounded loops with FHE operations. Each FHE operation consumes significant gas compared to plaintext operations. An unbounded loop can easily exceed the block gas limit.

```solidity
// WRONG: Unbounded loop
function distributeRewards(address[] calldata users) external {
    for (uint256 i = 0; i < users.length; i++) {
        _balances[users[i]] = FHE.add(_balances[users[i]], FHE.asEuint64(reward));
        // Each iteration: ~200k-500k gas for FHE.add
    }
}
```

Instead, bound your loops:

```solidity
uint256 public constant MAX_BATCH = 5;

function distributeRewards(address[] calldata users) external {
    require(users.length <= MAX_BATCH, "Batch too large");

    for (uint256 i = 0; i < users.length; i++) {
        _balances[users[i]] = FHE.add(_balances[users[i]], FHE.asEuint64(reward));
        FHE.allowThis(_balances[users[i]]);
        FHE.allow(_balances[users[i]], users[i]);
    }
}
```

### Gas Estimation

FHE operations are significantly more expensive than plaintext:

| Operation | Approximate Gas |
|-----------|---------------|
| `FHE.add(euint64, euint64)` | ~200k |
| `FHE.sub(euint64, euint64)` | ~200k |
| `FHE.mul(euint64, euint64)` | ~300k |
| `FHE.ge(euint64, euint64)` | ~200k |
| `FHE.select(ebool, euint64, euint64)` | ~250k |
| `FHE.fromExternal()` | ~300k |

A batch of 5 FHE additions costs roughly 1M gas. Plan your batch sizes accordingly.

### The PerformBatchActions Pattern

Our `EncryptedStateMachine.sol` demonstrates a simple batch:

```solidity
function performBatchActions(uint8 count) external inState(State.ACTIVE) {
    require(count > 0 && count <= 10, "Count must be 1-10");

    // Single FHE operation regardless of count
    _counter = FHE.add(_counter, FHE.asEuint32(uint32(count)));
    FHE.allowThis(_counter);

    actionCount += count;
}
```

This is optimal because it reduces N FHE additions to a single FHE addition by pre-computing the sum in plaintext. Not all batch operations can be optimized this way, but always look for opportunities to minimize the number of FHE operations.

---

## Pattern 6: Time-Locked Encrypted Values

### The Concept

Sometimes you want an encrypted value to become publicly readable only after a certain time. Examples:
- Sealed bids revealed after the bidding period
- Encrypted votes decrypted after the voting deadline
- Secret game moves revealed after the round ends

### The Pattern

Combine `block.timestamp` (plaintext time) with `FHE.makePubliclyDecryptable()`:

```solidity
uint256 public revealTime;
euint64 private _secretValue;

function setSecret(externalEuint64 encValue, bytes calldata inputProof, uint256 lockDuration) external {
    _secretValue = FHE.fromExternal(encValue, inputProof);
    FHE.allowThis(_secretValue);
    revealTime = block.timestamp + lockDuration;
}

function reveal() external {
    require(block.timestamp >= revealTime, "Too early");
    FHE.makePubliclyDecryptable(_secretValue);
}
```

Before `revealTime`, the value is encrypted and only the contract can operate on it. After `revealTime`, anyone can call `reveal()` and the value becomes publicly decryptable.

### Important: Time Is Not Encrypted

`block.timestamp` is plaintext and controlled by validators. This means:
- The reveal time is public (everyone knows when the value will be decryptable)
- Validators have minor influence over `block.timestamp` (typically +-15 seconds)
- For high-stakes applications, use block numbers instead of timestamps for more predictability

### Use Case: Commitment Schemes

Time-locked encryption enables commit-reveal schemes without the separate reveal transaction:

```
Phase 1 (Commit): Users submit encrypted values
Phase 2 (Lock): No new submissions after deadline
Phase 3 (Reveal): Anyone calls reveal() after lockTime
   --> FHE.makePubliclyDecryptable() on all committed values
```

This is simpler than traditional commit-reveal because users do not need to separately reveal their commitments -- the FHE system handles it.

---

## Putting It All Together

### How Patterns Combine

Real applications use multiple patterns simultaneously:

**Encrypted Escrow** (exercise for this module):
- **State Machine**: CREATED -> FUNDED -> RELEASED / DISPUTED / EXPIRED
- **LastError**: Encrypted error codes when funding or releasing fails
- **Time-Lock**: Funds auto-release after a deadline
- **Cross-Contract**: Escrow reads token balances via ACL

**Confidential DEX:**
- **State Machine**: Order lifecycle (OPEN -> MATCHED -> SETTLED)
- **Encrypted Registry**: Order book with encrypted prices and quantities
- **Batch Processing**: Match multiple orders in one transaction
- **Cross-Contract**: DEX reads token balances for settlement

**Private Game:**
- **State Machine**: LOBBY -> PLAYING -> FINISHED
- **LastError**: Invalid move feedback without revealing game state
- **Time-Lock**: Moves revealed after round timer expires
- **Encrypted Registry**: Per-player encrypted game state

### Design Principles for Production FHE Contracts

1. **Minimize FHE operations.** Every encrypted operation costs 10-100x more gas than its plaintext equivalent. Compute as much as possible in plaintext and only encrypt what must be private.

2. **ACL is your access control layer.** Do not try to build your own permission system for encrypted data. Use `FHE.allow()` and `FHE.allowThis()` consistently.

3. **Never branch on encrypted conditions.** Use `FHE.select()` instead of `if/else`. The control flow must be identical regardless of the encrypted values.

4. **Use the LastError pattern for user feedback.** Silent failures are terrible UX. Always give users an encrypted error code they can decrypt to understand what happened.

5. **Keep state public when possible.** Encrypt only what must be private. Public state is cheaper and easier to reason about.

6. **Bound all loops.** Never iterate over an unbounded collection with FHE operations inside the loop.

7. **Design for composability.** Use interfaces and ACL grants to enable contract-to-contract encrypted data flow.

8. **Test with known values.** Encrypt known plaintext values in tests, then decrypt results to verify correctness. The test patterns from Module 14 apply directly.

### Pattern Selection Guide

| If you need... | Use this pattern |
|----------------|-----------------|
| Workflow with private conditions | Encrypted State Machine |
| User feedback without info leaks | LastError Pattern |
| Flexible encrypted data storage | Encrypted Registry |
| Multi-contract encrypted data flow | Cross-Contract Composability |
| Multiple FHE operations per tx | Encrypted Batch Processing |
| Reveal encrypted data at a future time | Time-Locked Encrypted Values |

---

## Summary

This module introduced six advanced patterns that transform basic FHE operations into production-ready design primitives:

1. **Encrypted State Machine** -- Public states with private transition conditions. The "why" stays encrypted even as the "what" is visible.

2. **LastError Pattern** -- Encrypted error codes per user, solving the FHE usability problem of silent failures. Users decrypt their own error to learn what happened.

3. **Encrypted Registry** -- Per-user key-value storage with sharing via ACL grants. Flexible enough for medical records, credentials, or configuration.

4. **Cross-Contract Composability** -- Explicit ACL grants between contracts enable multi-contract encrypted architectures.

5. **Encrypted Batch Processing** -- Bounded iteration over encrypted data, with gas-aware batch sizes.

6. **Time-Locked Encrypted Values** -- Combining plaintext timestamps with `makePubliclyDecryptable()` for timed reveals.

These patterns are not theoretical. They appear in every non-trivial FHE application. The exercise for this module asks you to combine three of them (State Machine, LastError, Time-Lock) into a working Encrypted Escrow contract. This is the kind of design work you will do when building real confidential dApps.

In the next module, you will see how these patterns scale to even more complex architectures as we approach the capstone project.
