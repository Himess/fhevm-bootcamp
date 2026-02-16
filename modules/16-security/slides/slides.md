---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 16: Security Best Practices for FHE"
footer: "Zama Developer Program"
---

<style>
section { font-size: 18px; overflow: hidden; }
h1 { font-size: 28px; margin-bottom: 8px; }
h2 { font-size: 22px; margin-bottom: 6px; }
h3 { font-size: 19px; }
code { font-size: 15px; }
pre { font-size: 13px; line-height: 1.25; margin: 6px 0; }
li { margin-bottom: 1px; line-height: 1.4; }
table { font-size: 15px; }
p { margin-bottom: 4px; }
ul, ol { margin-top: 4px; margin-bottom: 4px; }
</style>

# Module 16: Security Best Practices for FHE

Identifying and preventing FHE-specific vulnerabilities.

---

# Learning Objectives

By the end of this module, you will be able to:

1. Explain how FHE changes the smart contract security model
2. Identify the **7 critical FHE-specific vulnerabilities**
3. Use `FHE.select()` to prevent **gas side-channel attacks**
4. Apply proper **ACL management** after every state update
5. Implement the **LastError pattern** for encrypted error handling
6. Validate encrypted inputs with `FHE.isInitialized()`
7. Audit FHE contracts using the security checklist

<!--
Speaker notes: Set the stage by explaining that FHE changes the security model fundamentally. In traditional contracts, everyone can read storage. In FHE, the data is encrypted but the "side channels" are the new attack surface. This module covers seven FHE-specific vulnerabilities that traditional security audits do not check for.
-->

---

# FHE Security is Different

Traditional smart contracts: data is public, protect the **logic**.

FHE contracts: data is encrypted, protect the **metadata**.

| Visible to Everyone | Protected by FHE |
|---------------------|-------------------|
| Gas consumption | Encrypted parameter values |
| Transaction success / failure | Internal encrypted state |
| Function selectors | Comparison results |
| Sender / recipient addresses | Encrypted error codes |
| Storage access patterns | Encrypted storage values |
| Timing of transactions | Encrypted intermediates |

<!--
Speaker notes: This table defines the boundary of FHE protection. Everything on the left is observable by anyone watching the blockchain. Everything on the right is hidden by encryption. Your job as a developer is to ensure that the observable properties reveal nothing about the encrypted state.
-->

---

# The Seven FHE Vulnerabilities

| # | Vulnerability | Attack Vector |
|---|---------------|---------------|
| 1 | Gas side channel | if/else on encrypted condition |
| 2 | Missing ACL | Encrypted data becomes inaccessible |
| 3 | Unvalidated inputs | Malformed ciphertexts |
| 4 | DoS via FHE loops | Block gas limit exhaustion |
| 5 | Error info leak | Revert reveals encrypted state |
| 6 | Privacy violation | makePubliclyDecryptable misuse |
| 7 | Missing access control | Unauthorized state changes |

<!--
Speaker notes: This is the roadmap for the module. Each of these seven vulnerabilities is unique to FHE or significantly amplified by FHE. Traditional smart contract audits do not check for most of these. We will walk through each one in the following slides with code examples and fixes.
-->

---

# Vulnerability 1: Gas Side Channel

```solidity
// VULNERABLE: Gas reveals the encrypted condition
if (FHE.decrypt(hasBalance)) {
    // Branch A: ~400k gas (FHE.sub + FHE.add + 4 ACL calls)
    _balances[from] = FHE.sub(...);
    _balances[to] = FHE.add(...);
} else {
    // Branch B: ~30k gas (no FHE operations)
}
// Observer sees 400k gas -> sufficient balance
// Observer sees 30k gas  -> insufficient balance
```

**The encrypted condition is revealed through gas consumption!**

<!--
Speaker notes: This is the most critical FHE vulnerability. Draw the gas difference on the whiteboard: 400k vs 30k. Anyone monitoring the mempool or looking at the transaction receipt can immediately determine the encrypted condition. This completely defeats the encryption.
-->

---

# Fix: Uniform Execution with FHE.select()

```solidity
// SECURE: Same gas regardless of condition
euint64 actual = FHE.select(
    hasBalance,
    amount,              // true path
    FHE.asEuint64(0)     // false path
);

// Always executes -- transfers 'amount' or '0'
_balances[from] = FHE.sub(_balances[from], actual);
_balances[to] = FHE.add(_balances[to], actual);
```

`FHE.select()` computes both paths and selects the result.
Gas is **identical** regardless of the condition.

> **Rule:** Never branch (if/else, while, for) on encrypted conditions. Always use `FHE.select()`.

<!--
Speaker notes: FHE.select is the core pattern for FHE security. It is the encrypted ternary operator. Both the true and false values are computed, and the result is selected based on the encrypted condition. Since both computations happen regardless, gas is uniform.
-->

---

# Additional Gas Leak Vectors

Beyond if/else, watch for these subtle gas leaks:

| Pattern | Why It Leaks | Fix |
|---------|-------------|-----|
| `if (condition) return;` | Early return vs continuation has different gas | Use `FHE.select()` |
| `for (i < encryptedCount)` | Loop count reveals the encrypted value | Fixed iteration count |
| Conditional `SSTORE` | Writing vs not writing has different gas | Always write (select result) |
| Conditional external call | Calling vs not calling another contract | Always call (with 0 if false) |

All must be replaced with **uniform execution patterns**.

<!--
Speaker notes: These are the subtle variants of the gas side channel. An early return looks innocent but has different gas than continuing execution. A loop bounded by an encrypted value is particularly dangerous because the exact value is leaked through the number of iterations. Always think: "Does any observable property change based on encrypted state?"
-->

---

# Vulnerability 2: Missing ACL

```solidity
// VULNERABLE: No ACL after state update
_balances[to] = FHE.asEuint64(amount);
// Contract cannot use _balances[to] in future txs!
// User cannot decrypt their balance!
```

**Fix: Always set ACL after every FHE state update.**

```solidity
_balances[to] = FHE.asEuint64(amount);
FHE.allowThis(_balances[to]);      // Contract access
FHE.allow(_balances[to], to);      // User access
```

Every FHE operation = **new handle** = **empty ACL**.

<!--
Speaker notes: This was covered in Module 05 but it is so critical it bears repeating in the security module. The #1 bug in FHE contracts is forgetting allowThis after an operation. Emphasize: EVERY operation. Not just initialization. Every add, sub, select, comparison that writes to state needs allowThis.
-->

---

# ACL After FHE.select()

A subtle case: `FHE.select()` always produces a **new handle**.

```solidity
_balances[msg.sender] = FHE.select(condition, valueA, valueB);
// The result is a NEW handle -- ACL is empty!
FHE.allowThis(_balances[msg.sender]);      // Required
FHE.allow(_balances[msg.sender], msg.sender); // Required
```

| Mistake | Consequence |
|---------|-------------|
| Forgot `allowThis` after `FHE.add()` | Contract cannot use the sum next tx |
| Forgot `allow(h, user)` after transfer | Recipient cannot decrypt balance |
| Set ACL on old handle, not new | ACL is per-handle, not per-variable |
| Used `allow` for temporary inter-contract call | Wasted gas; use `allowTransient` |

<!--
Speaker notes: The select case trips up even experienced developers. Regardless of which branch was selected, the result is a brand new handle with an empty ACL. You must set allowThis and allow on every new handle, every time.
-->

---

# Vulnerability 3: Unvalidated Inputs

```solidity
// VULNERABLE: No validation after fromExternal
euint64 amount = FHE.fromExternal(encAmount, inputProof);
// Missing: require(FHE.isInitialized(amount), "Invalid");
_balances[user] = FHE.add(_balances[user], amount);
```

**Fix: Always validate after fromExternal().**

```solidity
euint64 amount = FHE.fromExternal(encAmount, inputProof);
require(FHE.isInitialized(amount), "Invalid encrypted input");
```

Also validate **stored handles** before use:
```solidity
require(FHE.isInitialized(_balances[user]), "No balance");
```

<!--
Speaker notes: FHE.fromExternal validates the ZK proof, but the resulting handle could still be uninitialized if something went wrong. Always check isInitialized as a belt-and-suspenders approach. Also check stored values before using them -- a user who never deposited has an uninitialized balance.
-->

---

# Vulnerability 4: DoS via Unbounded FHE Loops

FHE operations cost **50k - 600k gas each**.

```solidity
// VULNERABLE: No cap on array length
for (uint i = 0; i < recipients.length; i++) {
    _balances[recipients[i]] = FHE.add(...);  // ~200k
    FHE.allowThis(...);                        // ~50k
    FHE.allow(...);                            // ~50k
}
// 50 recipients = 50 x 300k = 15M gas!
```

**Fix: Cap iterations + rate limit.**

```solidity
uint256 public constant MAX_BATCH = 10;
require(recipients.length <= MAX_BATCH, "Batch too large");
```

<!--
Speaker notes: FHE operations are 10x-100x more expensive than regular Solidity operations. A loop that is safe with normal operations becomes a DoS vector with FHE. Always calculate worst-case gas: iterations x operations x gas-per-op. If it can exceed the block gas limit, add a cap.
-->

---

# Additional DoS Mitigations

**Rate limiting per user:**
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

Additional strategies:
- **Require deposits** for expensive operations (economic disincentive)
- **Pagination** for large dataset operations
- **Gas cost estimation** before execution

<!--
Speaker notes: Rate limiting prevents a single user from spamming expensive FHE operations. The cooldown-based approach is simple and effective. For higher-stakes contracts, consider requiring a deposit that is refunded after the operation completes, making DoS attacks economically costly.
-->

---

# Vulnerability 5: Error Leak via Revert

```solidity
// VULNERABLE: Revert reveals encrypted condition
ebool hasBalance = FHE.ge(_balances[user], amount);
require(FHE.decrypt(hasBalance), "Insufficient balance");
// Revert -> balance < amount (LEAKED!)
// Success -> balance >= amount (LEAKED!)
```

**Fix: The LastError Pattern.**

```solidity
euint64 actual = FHE.select(hasBalance, amount, FHE.asEuint64(0));
_lastError[user] = FHE.select(
    hasBalance,
    FHE.asEuint8(0),  // ERR_NONE (success)
    FHE.asEuint8(1)   // ERR_INSUFFICIENT
);
// Transaction ALWAYS succeeds. User decrypts error code privately.
```

<!--
Speaker notes: The LastError pattern is the FHE equivalent of try/catch. Instead of reverting (which leaks the condition), we always succeed and store an encrypted error code. Only the user can decrypt their error code to learn what happened. The outside world sees a successful transaction regardless of the outcome.
-->

---

# The LastError Pattern in Detail

```solidity
// Error code constants
uint8 constant ERR_NONE = 0;
uint8 constant ERR_INSUFFICIENT = 1;
uint8 constant ERR_LIMIT = 2;
uint8 constant ERR_UNAUTHORIZED = 3;

mapping(address => euint8) private _lastError;

// Set error (encrypted, only user can read)
_lastError[user] = FHE.select(
    condition,
    FHE.asEuint8(ERR_NONE),
    FHE.asEuint8(ERR_INSUFFICIENT)
);
FHE.allowThis(_lastError[user]);
FHE.allow(_lastError[user], user);

// Read error (ACL protected)
function getLastError() external view returns (euint8) {
    require(FHE.isSenderAllowed(_lastError[msg.sender]));
    return _lastError[msg.sender];
}
```

<!--
Speaker notes: Walk through the full LastError flow. The user calls a function, the function sets an encrypted error code, the user decrypts the error code in a separate step. The error code is per-user and encrypted, so nobody else can see it. This is the privacy-preserving equivalent of Solidity's require/revert error messages.
-->

---

# When Can You Still Revert?

You can safely use `require()` and `revert()` on **plaintext** conditions:

```solidity
// SAFE: These are all plaintext checks
require(msg.sender != address(0), "Zero address");
require(amount <= MAX_AMOUNT, "Amount too large");
require(msg.sender == owner, "Not owner");
require(recipients.length <= MAX_BATCH, "Batch too large");
```

**The rule:** Revert on **plaintext** conditions, use **LastError** for **encrypted** conditions.

Plaintext reverts do not leak encrypted state -- the condition is already public.

<!--
Speaker notes: This distinction is critical. Plaintext require statements are safe because the condition is already publicly known (ownership, zero address, array length). Only encrypted conditions must use the LastError pattern. Students should clearly distinguish which conditions in their contracts are plaintext vs encrypted.
-->

---

# Vulnerability 6: Privacy Violation

```solidity
// VULNERABLE: Exposes individual user data
FHE.makePubliclyDecryptable(_balances[user]);
// Now ANYONE can see this user's balance. Irreversible!
```

**Safe uses of makePubliclyDecryptable:**
- Vote tallies (after voting ends)
- Auction results (after auction closes)
- Aggregate statistics (total supply)

**Unsafe uses:**
- Individual balances
- Personal votes before tallying
- Private bids before auction closes

> **Rule:** Never call `makePubliclyDecryptable` on individual user data.

<!--
Speaker notes: makePubliclyDecryptable is irreversible. Once called, there is no way to re-encrypt the value. It should only be used for values that are DESIGNED to become public -- like the result of a vote or the winner of an auction. If you need to share with specific parties, use FHE.allow() to grant access to specific addresses.
-->

---

# Vulnerability 7: Missing Access Control

```solidity
// VULNERABLE: Anyone can mint tokens!
function openMint(address to, uint64 amount) external {
    _balances[to] = FHE.add(_balances[to], FHE.asEuint64(amount));
    FHE.allowThis(_balances[to]);
    FHE.allow(_balances[to], to);
}

// SECURE: Only owner can mint
function secureMint(address to, uint64 amount) external onlyOwner {
    // ... same logic but protected
}
```

**Encryption does not replace authorization.**
FHE encrypts data. Access control protects functions. Both are needed.

<!--
Speaker notes: This seems obvious but it is worth repeating: FHE encrypts data, it does not control who can call functions. A contract with perfect FHE patterns but missing onlyOwner on the mint function is still completely broken. Access control is orthogonal to encryption.
-->

---

# Front-Running and MEV Considerations

Even with FHE, metadata is visible:
- **Function selector** -- which function was called
- **Recipient address** -- if it is a plaintext parameter
- **Transaction timing** -- when submitted relative to other events
- **Sender address** -- always visible as `msg.sender`

**Mitigations:**
1. Use **commit-reveal** for time-sensitive operations
2. **Batch operations** to reduce per-operation information leakage
3. Consider **encrypted recipients** where the protocol supports it
4. Avoid `makePubliclyDecryptable` on individual data

<!--
Speaker notes: Even though FHE hides the amounts, an observer still knows that Alice sent tokens to Bob at a specific time. The function selector is always visible. For maximum privacy, consider commit-reveal patterns and encrypted recipients where feasible.
-->

---

# Security Audit Checklist

**ACL Management:**
- [ ] `allowThis()` after every encrypted state update
- [ ] `allow(h, user)` for every user who needs access
- [ ] `isSenderAllowed()` on view functions returning handles

**Information Leakage:**
- [ ] No if/else on encrypted conditions (use `FHE.select`)
- [ ] No require/revert on encrypted conditions (use LastError)
- [ ] No `makePubliclyDecryptable` on individual user data
- [ ] Gas consumption is uniform across all execution paths

**Robustness:**
- [ ] All encrypted inputs validated (`FHE.isInitialized`)
- [ ] All FHE loops bounded with MAX constants
- [ ] Rate limiting on expensive operations
- [ ] Access control on admin functions

<!--
Speaker notes: This checklist should be used for every FHE contract audit. Print it out and go through it line by line. If any item is unchecked, the contract has a vulnerability. Suggest students laminate this list and keep it at their desk.
-->

---

# The Seven Rules of FHE Security

1. **Never branch** on encrypted conditions -- use `FHE.select()`
2. **Always set ACL** after every FHE state update
3. **Always validate** encrypted inputs with `FHE.isInitialized()`
4. **Bound all FHE loops** -- cap iterations and rate-limit
5. **Use LastError**, not revert, for encrypted conditions
6. **Never reveal** individual user data -- only aggregates
7. **Protect admin functions** -- encryption is not authorization

<!--
Speaker notes: These seven rules are the core takeaway of the entire module. If students remember nothing else, they should remember these seven rules. Write them on the whiteboard and leave them visible for the rest of the session.
-->

---

# Exercise Preview

**Your mission:** Audit `exercises/16-security-exercise.sol`

Find **7 vulnerabilities** and write a fixed version.

| Task | Points |
|------|--------|
| Identify all 7 vulnerabilities | 35 |
| Write correct fixes | 35 |
| Fixed contract compiles | 10 |
| Same external interface maintained | 10 |
| LastError pattern implemented | 5 |
| Rate limiting added | 5 |

Reference: `contracts/SecurityPatterns.sol`
Time: 45-60 minutes

<!--
Speaker notes: Give students 45-60 minutes for this exercise. They should work individually first, then discuss in pairs. After the exercise, do a full walkthrough of VulnerableDemo.sol on the projector, identifying each vulnerability and showing the fix from SecurityPatterns.sol.
-->

---

# Summary

- FHE protects **data** but not **metadata** (gas, timing, reverts)
- `FHE.select()` is your most important security tool -- uniform execution
- **ACL management** is the #1 source of bugs -- every new handle needs it
- **LastError pattern** replaces require/revert for encrypted conditions
- Always **validate inputs**, **bound loops**, and **rate-limit**
- `makePubliclyDecryptable` is irreversible -- only for aggregates
- Encryption does **not** replace access control -- both are needed

Think of your FHE contract as a **black box**: ensure all observable properties reveal nothing about the encrypted state inside.

<!--
Speaker notes: Wrap up by asking students to share one thing they learned that surprised them. Many will say the gas side channel was the most eye-opening. Emphasize that FHE security is a new field and these patterns will evolve as the technology matures. The fundamentals -- uniform execution, ACL hygiene, input validation -- will remain constant.
-->
