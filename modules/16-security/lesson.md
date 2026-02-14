# Module 16: Security Best Practices for FHE -- Lesson

## Introduction: FHE Security is Different

Security in traditional smart contracts focuses on reentrancy, integer overflow, access control, and front-running. The data itself is always public -- anyone can read any storage slot. The security model is about protecting *logic*, not *data*.

FHE contracts flip this entirely. The data is encrypted. Nobody can read storage slots and extract meaningful values. This is a massive privacy win, but it introduces a completely new attack surface that most Solidity developers have never encountered.

**The new attack surface is metadata.**

Even when data is encrypted, an attacker can observe:
- **Gas consumption** -- Different execution paths consume different gas
- **Transaction success or failure** -- Reverts vs. successful execution
- **Storage access patterns** -- Which slots are read/written
- **Function selectors** -- Which function was called (always visible)
- **Timing** -- When transactions are submitted relative to other events
- **ACL state** -- Who has been granted access to which ciphertext handles

These metadata channels can reveal information about encrypted values. The core discipline of FHE security is ensuring that **no metadata leaks correlate with encrypted state**.

This lesson covers the seven most critical FHE-specific vulnerabilities and the patterns to prevent them.

---

## 1. Vulnerability: Information Leakage via Gas Consumption

### The Problem

In traditional Solidity, branching on a condition is harmless because the condition is already public. In FHE contracts, branching on an encrypted condition creates a **gas side channel**.

Consider this vulnerable pattern:

```solidity
// VULNERABLE: Gas reveals the encrypted condition
function vulnerableTransfer(address to, uint64 amount) external {
    euint64 encAmount = FHE.asEuint64(amount);
    ebool hasBalance = FHE.ge(_balances[msg.sender], encAmount);

    if (FHE.decrypt(hasBalance)) {
        // Branch A: ~400k gas (FHE.sub + FHE.add + 4 ACL calls)
        _balances[msg.sender] = FHE.sub(_balances[msg.sender], encAmount);
        _balances[to] = FHE.add(_balances[to], encAmount);
        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);
    } else {
        // Branch B: ~30k gas (no FHE operations)
        // Do nothing
    }
}
```

An observer watching the transaction's gas usage sees:
- **~400k gas consumed** --> the sender had sufficient balance
- **~30k gas consumed** --> the sender had insufficient balance

The encrypted balance is leaked through gas consumption, completely defeating the purpose of encryption.

### The Fix: Uniform Execution with FHE.select()

`FHE.select()` is the FHE equivalent of a ternary operator, but it executes **both paths** and selects the result based on the encrypted condition. Gas consumption is identical regardless of which value is selected.

```solidity
// SECURE: Uniform gas consumption
function secureTransfer(address to, uint64 amount) external {
    euint64 encAmount = FHE.asEuint64(amount);
    ebool hasBalance = FHE.ge(_balances[msg.sender], encAmount);

    // Both paths computed, result selected -- same gas either way
    euint64 actualAmount = FHE.select(
        hasBalance,
        encAmount,           // if true: transfer the amount
        FHE.asEuint64(0)     // if false: transfer 0
    );

    _balances[msg.sender] = FHE.sub(_balances[msg.sender], actualAmount);
    _balances[to] = FHE.add(_balances[to], actualAmount);

    FHE.allowThis(_balances[msg.sender]);
    FHE.allow(_balances[msg.sender], msg.sender);
    FHE.allowThis(_balances[to]);
    FHE.allow(_balances[to], to);
}
```

**Key insight:** `FHE.select()` costs the same gas regardless of the condition's value. The observer sees identical gas consumption whether the transfer happened or not.

### The Rule

> **Never branch (if/else, while, for with encrypted bounds) on an encrypted condition. Always use FHE.select().**

### Additional Gas Leak Vectors

Beyond if/else, watch for these subtle gas leaks:

1. **Early returns:** `if (condition) return;` -- the return vs. continuation has different gas
2. **Dynamic loops:** `for (uint i = 0; i < encryptedCount; i++)` -- loop count reveals the encrypted value
3. **Storage writes:** Conditional storage writes (writing to a slot vs. not) have different gas costs
4. **External calls:** Calling another contract conditionally reveals the condition

All of these must be replaced with uniform execution patterns.

---

## 2. Vulnerability: Missing ACL Permissions

### The Problem

Every FHE operation produces a **new ciphertext** with a **new handle**. The new handle has an **empty ACL** -- no address has access, not even the contract that created it. If you forget to set the ACL:

- The **contract** cannot use the value in future transactions (operations on it will fail)
- The **user** cannot decrypt their own data (decryption requests are rejected)

```solidity
// VULNERABLE: No ACL after state update
function vulnerableMint(address to, uint64 amount) external onlyOwner {
    _balances[to] = FHE.asEuint64(amount);
    // Missing: FHE.allowThis(_balances[to]);
    // Missing: FHE.allow(_balances[to], to);
    // The balance exists but nobody can use it!
}
```

### The Fix: ACL After Every State Update

```solidity
// SECURE: Full ACL management
function secureMint(address to, uint64 amount) external onlyOwner {
    _balances[to] = FHE.asEuint64(amount);
    FHE.allowThis(_balances[to]);      // Contract can use it
    FHE.allow(_balances[to], to);      // User can decrypt it
}
```

### The ACL Checklist

After **every** FHE operation that writes to state, you must:

1. **`FHE.allowThis(handle)`** -- Always. The contract needs access for future operations.
2. **`FHE.allow(handle, user)`** -- For every user who should be able to decrypt the value.
3. Consider `FHE.allowTransient(handle, addr)` for inter-contract calls within the same transaction.

### Common ACL Mistakes

| Mistake | Consequence |
|---------|-------------|
| Forgot `allowThis` after `FHE.add()` | Contract cannot use the sum in the next tx |
| Forgot `allow(h, user)` after transfer | Recipient cannot decrypt their new balance |
| Set ACL on old handle, not new handle | ACL is per-handle, not per-variable |
| Used `allow` for temporary inter-contract call | Wasted gas; use `allowTransient` instead |
| Forgot to re-set ACL in every branch of select | Only one branch's ACL is applied |

### ACL After Select

A subtle case: when you use `FHE.select()`, the result is a new handle regardless of which branch was selected. You must set ACL on the result:

```solidity
_balances[msg.sender] = FHE.select(condition, valueA, valueB);
// The result is a NEW handle -- ACL is empty
FHE.allowThis(_balances[msg.sender]);
FHE.allow(_balances[msg.sender], msg.sender);
```

---

## 3. Vulnerability: Unvalidated Encrypted Inputs

### The Problem

When users submit encrypted inputs to your contract, you must validate them before use. An unvalidated input could be a malformed ciphertext, an uninitialized handle, or a handle from a different contract's ACL domain.

```solidity
// VULNERABLE: No input validation
function vulnerableDeposit(
    externalEuint64 encAmount,
    bytes calldata inputProof
) external {
    euint64 amount = FHE.fromExternal(encAmount, inputProof);
    // Missing: require(FHE.isInitialized(amount), "Invalid input");

    _balances[msg.sender] = FHE.add(_balances[msg.sender], amount);
    // If amount is an invalid handle, this add may produce garbage
}
```

### The Fix: Always Validate

```solidity
// SECURE: Full input validation
function secureDeposit(
    externalEuint64 encAmount,
    bytes calldata inputProof
) external {
    // Step 1: Convert and verify the ZK proof
    euint64 amount = FHE.fromExternal(encAmount, inputProof);

    // Step 2: Check the resulting handle is valid
    require(FHE.isInitialized(amount), "Invalid encrypted input");

    // Step 3: Now safe to use
    _balances[msg.sender] = FHE.add(_balances[msg.sender], amount);
    FHE.allowThis(_balances[msg.sender]);
    FHE.allow(_balances[msg.sender], msg.sender);
}
```

### Validation Checklist

1. **`FHE.fromExternal(encValue, inputProof)`** -- Always use this to convert external inputs. It validates the ZK proof that the ciphertext was correctly formed.
2. **`FHE.isInitialized(handle)`** -- Check that the handle is valid before use. This catches zero handles and uninitialized state.
3. **Check state variables too** -- Before using a stored encrypted value, verify it has been initialized:
   ```solidity
   require(FHE.isInitialized(_balances[user]), "User has no balance");
   ```

---

## 4. Vulnerability: Denial of Service via Unbounded FHE Operations

### The Problem

FHE operations are computationally expensive. Each operation costs between 50,000 and 600,000 gas depending on the type and operand size. A function with unbounded FHE operations inside a loop is a DoS vector.

```solidity
// VULNERABLE: No cap on array size
function vulnerableBatchAdd(
    address[] calldata recipients,
    uint64 amount
) external onlyOwner {
    for (uint256 i = 0; i < recipients.length; i++) {
        _balances[recipients[i]] = FHE.add(
            _balances[recipients[i]],
            FHE.asEuint64(amount)
        );
        FHE.allowThis(_balances[recipients[i]]);
        FHE.allow(_balances[recipients[i]], recipients[i]);
    }
}
```

With 3 FHE operations per iteration (add, allowThis, allow) at ~200k gas each, a batch of 50 recipients costs **~30M gas** -- at or beyond the block gas limit. An attacker who controls the input array can reliably DoS the function.

### The Fix: Bound All Loops and Rate-Limit

```solidity
uint256 public constant MAX_BATCH = 10;

function secureBatchAdd(
    address[] calldata recipients,
    uint64 amount
) external onlyOwner {
    require(recipients.length <= MAX_BATCH, "Batch too large");

    for (uint256 i = 0; i < recipients.length; i++) {
        _balances[recipients[i]] = FHE.add(
            _balances[recipients[i]],
            FHE.asEuint64(amount)
        );
        FHE.allowThis(_balances[recipients[i]]);
        FHE.allow(_balances[recipients[i]], recipients[i]);
    }
}
```

### Additional DoS Mitigations

1. **Rate limiting per user:**
   ```solidity
   mapping(address => uint256) private _lastOpBlock;
   uint256 public cooldownBlocks = 5;

   modifier rateLimited() {
       require(
           block.number >= _lastOpBlock[msg.sender] + cooldownBlocks,
           "Rate limited"
       );
       _lastOpBlock[msg.sender] = block.number;
       _;
   }
   ```

2. **Require deposits for expensive operations:** Charge a fee proportional to the FHE computation cost. This economically discourages DoS.

3. **Pagination:** For operations over large datasets, process items in pages rather than all at once.

### Gas Cost Reference for FHE Operations

| Operation | Approximate Gas Cost |
|-----------|---------------------|
| `FHE.asEuintXX()` (plaintext to encrypted) | ~50k |
| `FHE.add()`, `FHE.sub()` | ~150k-200k |
| `FHE.mul()` | ~300k-400k |
| `FHE.le()`, `FHE.ge()`, `FHE.eq()` | ~150k-200k |
| `FHE.select()` | ~200k-300k |
| `FHE.and()`, `FHE.or()`, `FHE.xor()` | ~150k |
| `FHE.allowThis()`, `FHE.allow()` | ~50k-100k |
| `FHE.fromExternal()` | ~200k-300k |

Use these estimates to calculate maximum loop iterations before hitting gas limits.

---

## 5. Vulnerability: Encrypted Error Handling

### The Problem

In traditional Solidity, you communicate errors via `require()` and `revert()`. But in FHE contracts, **reverting based on an encrypted condition leaks information**.

```solidity
// VULNERABLE: Revert reveals the encrypted condition
function vulnerableWithdraw(uint64 amount) external {
    euint64 encAmount = FHE.asEuint64(amount);
    ebool hasBalance = FHE.ge(_balances[msg.sender], encAmount);

    // If we could decrypt and revert here, the revert itself
    // tells the world that the user's balance is < amount.
    // Transaction success tells the world balance >= amount.
    // Either way, information about the encrypted balance is leaked.
}
```

### The Fix: The LastError Pattern

Instead of reverting, always succeed and store an encrypted error code that only the user can decrypt.

```solidity
// Error codes
uint8 constant ERR_NONE = 0;
uint8 constant ERR_INSUFFICIENT_BALANCE = 1;
uint8 constant ERR_LIMIT_EXCEEDED = 2;

mapping(address => euint8) private _lastError;

function secureWithdraw(uint64 amount) external {
    euint64 encAmount = FHE.asEuint64(amount);
    ebool hasBalance = FHE.ge(_balances[msg.sender], encAmount);

    // Always execute -- transfer actual amount or 0
    euint64 actualAmount = FHE.select(
        hasBalance,
        encAmount,
        FHE.asEuint64(0)
    );

    _balances[msg.sender] = FHE.sub(_balances[msg.sender], actualAmount);
    FHE.allowThis(_balances[msg.sender]);
    FHE.allow(_balances[msg.sender], msg.sender);

    // Set encrypted error code
    _lastError[msg.sender] = FHE.select(
        hasBalance,
        FHE.asEuint8(ERR_NONE),
        FHE.asEuint8(ERR_INSUFFICIENT_BALANCE)
    );
    FHE.allowThis(_lastError[msg.sender]);
    FHE.allow(_lastError[msg.sender], msg.sender);
}

// User can check their last error (only they can decrypt it)
function getLastError() external view returns (euint8) {
    require(FHE.isSenderAllowed(_lastError[msg.sender]), "No access");
    return _lastError[msg.sender];
}
```

### When Can You Still Revert?

You can safely `require()` and `revert()` on **plaintext** conditions:

```solidity
// SAFE: These are plaintext checks
require(msg.sender != address(0), "Zero address");          // plaintext
require(amount <= MAX_AMOUNT, "Amount too large");           // plaintext
require(msg.sender == owner, "Not owner");                   // plaintext
if (recipients.length > MAX_BATCH) revert BatchTooLarge();   // plaintext
```

The rule is: **revert on plaintext conditions, use LastError for encrypted conditions.**

### LastError Design Patterns

Define clear error codes as contract constants:

```solidity
uint8 public constant ERR_NONE = 0;                // Success
uint8 public constant ERR_INSUFFICIENT_BALANCE = 1; // Not enough funds
uint8 public constant ERR_LIMIT_EXCEEDED = 2;       // Over transfer limit
uint8 public constant ERR_UNAUTHORIZED = 3;         // Not permitted
uint8 public constant ERR_INVALID_AMOUNT = 4;       // Bad input value
```

Clients decrypt the error code after each transaction to understand the outcome.

---

## 6. Vulnerability: Front-Running and MEV

### The Problem

Even though FHE encrypts the values, certain metadata is always visible on-chain:

- **Function selector** -- Everyone knows which function you called
- **Recipient address** -- In a transfer, `to` is usually a plaintext parameter
- **Transaction timing** -- When you submitted relative to other transactions
- **Sender address** -- Always visible as `msg.sender`

An attacker knows Alice called `transfer(encryptedAmount, proof, bobAddress)` even though the amount is encrypted. They know:
- Alice is sending tokens to Bob
- The transfer is happening right now
- If they can observe Alice's balance changing (via ACL or public decryption), they learn the amount

### Mitigations

1. **Use encrypted recipients when possible:**
   ```solidity
   // If your protocol supports it, encrypt the recipient too
   function transfer(
       externalEuint64 encAmount,
       bytes calldata amountProof,
       // Recipient could be encoded as an encrypted address
       // or use stealth address patterns
   ) external { ... }
   ```

2. **Commit-reveal for time-sensitive operations:**
   ```solidity
   // Phase 1: Submit encrypted commitment
   function commit(bytes32 commitHash) external {
       _commits[msg.sender] = commitHash;
       _commitBlock[msg.sender] = block.number;
   }

   // Phase 2: Reveal after N blocks
   function reveal(
       externalEuint64 encValue,
       bytes calldata proof,
       bytes32 salt
   ) external {
       require(
           block.number > _commitBlock[msg.sender] + REVEAL_DELAY,
           "Too early"
       );
       require(
           keccak256(abi.encodePacked(msg.sender, salt)) == _commits[msg.sender],
           "Invalid reveal"
       );
       // Process the encrypted value
   }
   ```

3. **Batch operations:** Process multiple operations in a single transaction to reduce the information leaked per operation.

4. **Avoid makePubliclyDecryptable on individual data:** Only reveal aggregate values, not per-user data.

### What FHE Does NOT Protect

| Visible to Everyone | Protected by FHE |
|---------------------|-------------------|
| Function selector (which function) | Encrypted parameter values |
| Sender address (msg.sender) | Internal encrypted state |
| Recipient address (if plaintext param) | Comparison results |
| Gas consumption | Encrypted error codes |
| Block number / timestamp | Encrypted intermediate computations |
| Transaction success / failure | Encrypted storage values |

Understanding this boundary is essential for designing secure FHE protocols.

---

## 7. Vulnerability: Misuse of makePubliclyDecryptable

### The Problem

`FHE.makePubliclyDecryptable()` is a powerful but dangerous function. It makes an encrypted value decryptable by **any address**. This is irreversible -- once called, the ciphertext's plaintext value is effectively public.

```solidity
// VULNERABLE: Reveals individual user's private balance
function vulnerableRevealBalance(address user) external onlyOwner {
    FHE.makePubliclyDecryptable(_balances[user]);
    // Now ANYONE can decrypt user's balance. Privacy is destroyed.
}
```

### Safe Uses

- Revealing **aggregate** values: total supply, vote tallies, auction results
- Revealing **game outcomes** after the game ends
- Revealing **non-sensitive** protocol parameters

### Unsafe Uses

- Individual user balances
- Personal votes before tallying
- Private bids before auction closes
- Any per-user sensitive data

### The Rule

> **Never call makePubliclyDecryptable on individual user data. Only use it for aggregate or non-sensitive values that are meant to become public.**

If you need to grant access to specific parties, use `FHE.allow()` instead:

```solidity
// SECURE: Grant specific auditor access, not everyone
function grantAuditAccess(address auditor) external onlyOwner {
    FHE.allow(_balances[targetUser], auditor);
}
```

---

## 8. Security Audit Checklist for FHE Contracts

Use this checklist when reviewing any FHE contract:

### ACL Management
- [ ] Every FHE operation that writes to state is followed by `FHE.allowThis()`
- [ ] Every user-facing encrypted value has `FHE.allow(handle, user)` set
- [ ] `FHE.allowTransient()` is used for inter-contract calls (not `FHE.allow()`)
- [ ] View functions returning encrypted handles check `FHE.isSenderAllowed()`
- [ ] No overly permissive ACL (granting access to addresses that do not need it)

### Information Leakage
- [ ] No `if/else` or `while` branching on encrypted conditions
- [ ] All conditional logic uses `FHE.select()`
- [ ] No `require()` or `revert()` on encrypted conditions
- [ ] No early returns based on encrypted state
- [ ] Gas consumption is uniform across all execution paths

### Input Validation
- [ ] All external encrypted inputs validated with `FHE.fromExternal()`
- [ ] `FHE.isInitialized()` checked after `fromExternal()` and before using stored handles
- [ ] No use of unvalidated handles in arithmetic operations

### DoS Prevention
- [ ] All loops with FHE operations have bounded iteration counts
- [ ] Batch operations have maximum size limits
- [ ] Rate limiting on expensive FHE operations (per-user cooldowns)
- [ ] Gas costs estimated for worst-case loop execution

### Error Handling
- [ ] LastError pattern used for encrypted conditions (no reverts)
- [ ] Error codes are encrypted and ACL-protected
- [ ] Plaintext `require()` only for plaintext conditions (ownership, zero address, etc.)

### Privacy
- [ ] `FHE.makePubliclyDecryptable()` not used on individual user data
- [ ] Only aggregate/non-sensitive values are made publicly decryptable
- [ ] Encrypted recipients considered where applicable

### Access Control
- [ ] Admin functions protected by `onlyOwner` or role-based modifiers
- [ ] Ownership transfer function exists and is protected
- [ ] No public functions that modify critical encrypted state without authorization
- [ ] Custom errors used for clear failure reasons on plaintext conditions

---

## 9. Practical Exercise: Auditing VulnerableDemo.sol

Let us walk through `VulnerableDemo.sol` and identify each vulnerability.

### Vulnerability 1: `vulnerableMint()`

```solidity
function vulnerableMint(address to, uint64 amount) external onlyOwner {
    _balances[to] = FHE.asEuint64(amount);
    // MISSING: FHE.allowThis(_balances[to])
    // MISSING: FHE.allow(_balances[to], to)
}
```

**Issue:** No ACL permissions set. The contract cannot use this balance in future transactions, and the user cannot decrypt it.

**Fix:** Add two lines after the assignment:
```solidity
FHE.allowThis(_balances[to]);
FHE.allow(_balances[to], to);
```

### Vulnerability 2: `vulnerableTransfer()`

```solidity
if (FHE.isInitialized(hasBalance)) {
    // expensive FHE operations
    transferCount++;
}
```

**Issue:** Branching on an encrypted-derived condition creates a gas side channel. The `transferCount++` also reveals information via storage writes.

**Fix:** Use `FHE.select()` for uniform execution:
```solidity
euint64 actual = FHE.select(hasBalance, encAmount, FHE.asEuint64(0));
_balances[msg.sender] = FHE.sub(_balances[msg.sender], actual);
_balances[to] = FHE.add(_balances[to], actual);
```

### Vulnerability 3: `vulnerableDeposit()`

```solidity
euint64 amount = FHE.fromExternal(encAmount, inputProof);
// Missing: require(FHE.isInitialized(amount), "Invalid input");
```

**Issue:** No validation that the encrypted input is properly initialized. A malformed input could produce undefined behavior.

**Fix:** Add the `FHE.isInitialized()` check immediately after `fromExternal()`.

### Vulnerability 4: `vulnerableBatchAdd()`

```solidity
for (uint256 i = 0; i < recipients.length; i++) {
    // 3 FHE operations per iteration, no cap on recipients.length
}
```

**Issue:** No maximum batch size. An attacker can pass thousands of addresses to exceed the block gas limit.

**Fix:** Add `require(recipients.length <= MAX_BATCH, "Batch too large");`

### Vulnerability 5: `vulnerableWithdraw()`

**Issue:** The function subtracts from the balance unconditionally. In a real-world version with a decrypt-and-revert pattern, the revert itself leaks information about the encrypted balance.

**Fix:** Use the select pattern and LastError for user feedback.

### Vulnerability 6: `vulnerableRevealBalance()`

```solidity
FHE.makePubliclyDecryptable(_balances[user]);
```

**Issue:** Destroys the user's balance privacy. Anyone can now decrypt it.

**Fix:** Use `FHE.allow()` to grant access to specific authorized parties only.

### Vulnerability 7: `vulnerableOpenMint()`

```solidity
function vulnerableOpenMint(address to, uint64 amount) external {
    // No access control -- anyone can mint!
```

**Issue:** No `onlyOwner` modifier. Any user can mint arbitrary amounts.

**Fix:** Add the `onlyOwner` modifier.

---

## 10. Summary

FHE security requires a fundamentally different mindset from traditional smart contract security. The data is encrypted, but the metadata is not. Your security model must account for every observable side effect of your contract's execution.

### The Seven Rules of FHE Security

1. **Never branch on encrypted conditions.** Use `FHE.select()` for uniform execution.
2. **Always set ACL after every FHE state update.** `FHE.allowThis()` + `FHE.allow()` on every new handle.
3. **Always validate encrypted inputs.** `FHE.fromExternal()` + `FHE.isInitialized()` on every external input.
4. **Bound all FHE loops.** Cap iterations, rate-limit, and require deposits for expensive operations.
5. **Use LastError, not revert, for encrypted conditions.** Encrypted error codes preserve privacy.
6. **Never reveal individual data.** Only use `makePubliclyDecryptable()` for aggregate values.
7. **Protect admin functions.** Access control is still essential -- encryption does not replace authorization.

### Mental Model

Think of your FHE contract as a black box. An observer can see:
- What goes in (function call, sender, gas limit)
- What comes out (success/failure, gas used, events emitted)
- How long it takes (block inclusion timing)

Your job is to ensure that these observable properties reveal **nothing** about the encrypted state inside the box. Every function should consume the same gas, emit the same events, and succeed or fail based only on plaintext conditions, regardless of the encrypted values involved.

This is the discipline of FHE security.

---

## References

- [Zama fhEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Security Considerations](https://docs.zama.ai/fhevm/fundamentals/acl)
- SecurityPatterns.sol -- Reference implementation of all patterns in this lesson
- VulnerableDemo.sol -- Educational contract showing common mistakes
