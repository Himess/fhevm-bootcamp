---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 16: Security Best Practices for FHE"
footer: "Zama Developer Program"
---

# Module 16: Security Best Practices for FHE

Identifying and preventing FHE-specific vulnerabilities.

---

# FHE Security is Different

Traditional smart contracts: data is public, protect the **logic**.

FHE contracts: data is encrypted, protect the **metadata**.

Metadata that can leak information:
- Gas consumption
- Transaction success / failure
- Storage access patterns
- Function selectors
- Timing

<!--
Speaker notes: Set the stage by explaining that FHE changes the security model fundamentally. In traditional contracts, everyone can read storage. In FHE, the data is encrypted but the "side channels" are the new attack surface. Everything around the data -- gas, timing, reverts -- can reveal what the encrypted data contains.
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
Speaker notes: This is the roadmap for the module. Each of these seven vulnerabilities is unique to FHE or significantly amplified by FHE. Traditional smart contract audits do not check for most of these. Walk through each one in the following slides.
-->

---

# Vulnerability 1: Gas Side Channel

```solidity
// VULNERABLE
if (FHE.decrypt(hasBalance)) {
    // Branch A: ~400k gas
    _balances[from] = FHE.sub(...);
    _balances[to] = FHE.add(...);
} else {
    // Branch B: ~30k gas
}
// Observer sees 400k → sufficient balance
// Observer sees 30k  → insufficient balance
```

**The encrypted condition is revealed through gas!**

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
Gas is identical regardless of the condition.

<!--
Speaker notes: FHE.select is the core pattern for FHE security. It is the encrypted ternary operator. Both the true and false values are computed, and the result is selected based on the encrypted condition. Since both computations happen regardless, gas is uniform. Ask: "Can anyone think of a case where select is NOT sufficient?"
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

Every FHE operation = new handle = empty ACL.

<!--
Speaker notes: This was covered in Module 05 but it is so critical it bears repeating in the security module. The #1 bug in FHE contracts is forgetting allowThis after an operation. Emphasize: EVERY operation. Not just initialization. Every add, sub, select, comparison that writes to state needs allowThis.
-->

---

# Vulnerability 3: Unvalidated Inputs

```solidity
// VULNERABLE: No validation
euint64 amount = FHE.fromExternal(encAmount, inputProof);
// Missing: require(FHE.isInitialized(amount), "Invalid");
_balances[user] = FHE.add(_balances[user], amount);
```

**Fix: Always validate after fromExternal().**

```solidity
euint64 amount = FHE.fromExternal(encAmount, inputProof);
require(FHE.isInitialized(amount), "Invalid encrypted input");
```

Also validate stored handles before use:
```solidity
require(FHE.isInitialized(_balances[user]), "No balance");
```

<!--
Speaker notes: FHE.fromExternal validates the ZK proof, but the resulting handle could still be uninitialized if something went wrong. Always check isInitialized as a belt-and-suspenders approach. Also check stored values before using them in operations -- a user who never deposited has an uninitialized balance.
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
require(recipients.length <= MAX_BATCH, "Too large");
```

<!--
Speaker notes: FHE operations are 10x-100x more expensive than regular Solidity operations. A loop that is safe with normal operations becomes a DoS vector with FHE. Always calculate worst-case gas: iterations x operations x gas-per-op. If it can exceed the block gas limit, add a cap.
-->

---

# Vulnerability 5: Error Leak via Revert

```solidity
// VULNERABLE: Revert reveals encrypted condition
ebool hasBalance = FHE.ge(_balances[user], amount);
require(FHE.decrypt(hasBalance), "Insufficient balance");
// Revert → balance < amount (LEAKED!)
// Success → balance >= amount (LEAKED!)
```

**Fix: The LastError Pattern.**

```solidity
euint64 actual = FHE.select(hasBalance, amount, FHE.asEuint64(0));
_lastError[user] = FHE.select(
    hasBalance,
    FHE.asEuint8(0),  // success
    FHE.asEuint8(1)   // insufficient balance
);
// Transaction ALWAYS succeeds. User decrypts error code privately.
```

<!--
Speaker notes: The LastError pattern is the FHE equivalent of try/catch. Instead of reverting (which leaks the condition), we always succeed and store an encrypted error code. Only the user can decrypt their error code to learn what happened. The outside world sees a successful transaction regardless of the outcome.
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
- Aggregate statistics

**Unsafe uses:**
- Individual balances
- Personal votes
- Private bids

<!--
Speaker notes: makePubliclyDecryptable is irreversible. Once called, there is no way to re-encrypt the value. It should only be used for values that are DESIGNED to become public -- like the result of a vote or the winner of an auction. Never use it on individual user data. If you need to share with specific parties, use FHE.allow() instead.
-->

---

# Vulnerability 7: Missing Access Control

```solidity
// VULNERABLE: Anyone can mint!
function openMint(address to, uint64 amount) external {
    _balances[to] = FHE.add(_balances[to], FHE.asEuint64(amount));
    FHE.allowThis(_balances[to]);
    FHE.allow(_balances[to], to);
}
```

**Fix: Add access control.**

```solidity
function secureMint(address to, uint64 amount) external onlyOwner {
    // ... same logic but protected
}
```

Encryption does not replace authorization.

<!--
Speaker notes: This seems obvious but it is worth repeating: FHE encrypts data, it does not control who can call functions. A contract with perfect FHE patterns but missing onlyOwner on the mint function is still completely broken. Access control is orthogonal to encryption.
-->

---

# The LastError Pattern in Detail

```solidity
// Error code constants
uint8 constant ERR_NONE = 0;
uint8 constant ERR_INSUFFICIENT = 1;
uint8 constant ERR_LIMIT = 2;

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
function getLastError() view returns (euint8) {
    require(FHE.isSenderAllowed(_lastError[msg.sender]));
    return _lastError[msg.sender];
}
```

<!--
Speaker notes: Walk through the full LastError flow. The user calls a function, the function sets an encrypted error code, the user decrypts the error code in a separate step. The error code is per-user and encrypted, so nobody else can see it. This is the privacy-preserving equivalent of Solidity's require/revert error messages.
-->

---

# Security Audit Checklist

**ACL:**
- [ ] `allowThis()` after every encrypted state update
- [ ] `allow(h, user)` for every user who needs access
- [ ] `isSenderAllowed()` on view functions returning handles

**Information Leakage:**
- [ ] No if/else on encrypted conditions (use `select`)
- [ ] No require/revert on encrypted conditions (use LastError)
- [ ] No makePubliclyDecryptable on user data

**Robustness:**
- [ ] All encrypted inputs validated (`isInitialized`)
- [ ] All FHE loops bounded
- [ ] Rate limiting on expensive operations
- [ ] Access control on admin functions

<!--
Speaker notes: This checklist should be used for every FHE contract audit. Print it out and go through it line by line. If any item is unchecked, the contract has a vulnerability. Suggest students laminate this list and keep it at their desk.
-->

---

# Practical Exercise

**Your mission:** Audit `exercises/16-security-exercise.sol`

Find **7 vulnerabilities** and write a fixed version.

| Task | Points |
|------|--------|
| Identify all 7 vulnerabilities | 35 |
| Write correct fixes | 35 |
| Fixed contract compiles | 10 |
| Same external interface | 10 |
| LastError pattern added | 5 |
| Rate limiting added | 5 |

Reference: `contracts/SecurityPatterns.sol`

<!--
Speaker notes: Give students 45-60 minutes for this exercise. They should work individually first, then discuss in pairs. After the exercise, do a full walkthrough of VulnerableDemo.sol on the projector, identifying each vulnerability and showing the fix from SecurityPatterns.sol.
-->

---

# The Seven Rules of FHE Security

1. **Never branch** on encrypted conditions -- use `FHE.select()`
2. **Always set ACL** after every FHE state update
3. **Always validate** encrypted inputs with `isInitialized()`
4. **Bound all FHE loops** -- cap iterations and rate-limit
5. **Use LastError**, not revert, for encrypted conditions
6. **Never reveal** individual data -- only aggregates
7. **Protect admin functions** -- encryption is not authorization

<!--
Speaker notes: These seven rules are the core takeaway of the entire module. If students remember nothing else, they should remember these seven rules. Write them on the whiteboard and leave them visible for the rest of the session.
-->

---

# Summary

- FHE protects **data** but not **metadata** (gas, timing, reverts)
- `FHE.select()` is your most important security tool
- ACL management is the #1 source of bugs
- LastError pattern replaces require/revert for encrypted conditions
- Always validate inputs, bound loops, and rate-limit
- `makePubliclyDecryptable` is irreversible -- use sparingly

**Next:** Apply these patterns in your capstone project.

<!--
Speaker notes: Wrap up by asking students to share one thing they learned that surprised them. Many will say the gas side channel was the most eye-opening. Emphasize that FHE security is a new field and these patterns will evolve as the technology matures. The fundamentals -- uniform execution, ACL hygiene, input validation -- will remain constant.
-->
