# Module 05: Access Control (ACL) — Lesson

**Duration:** 3 hours
**Prerequisites:** Module 04
**Learning Objectives:**
- Master the ACL system (allow/allowThis/allowTransient)
- Implement multi-user encrypted data access
- Understand permission lifecycles

## Introduction

In a public blockchain, all state is readable by everyone. With FHE, the data is encrypted — but who decides who can **operate** on it or **decrypt** it? The FHEVM Access Control List (ACL) system answers this question.

Every ciphertext has an associated ACL that tracks which addresses (EOAs or contracts) are authorized to use it. Without proper ACL management, even the contract that created the ciphertext cannot use it in subsequent transactions.

---

## 1. Why ACL is Necessary

### The Problem

Consider a token contract that stores encrypted balances:

```solidity
mapping(address => euint64) private _balances;
```

Without ACL:
- The contract itself could not read its own stored ciphertexts in future transactions
- Users could not request decryption of their own balances
- Other contracts could not interact with the ciphertexts

### The Solution

The ACL system provides **granular, per-ciphertext permissions**. Each time you create or update a ciphertext, you must explicitly grant access to the entities that need it.

---

## 2. `FHE.allowThis(handle)` — Self-Permission

The most common ACL call. Grants the **current contract** permission to use a ciphertext.

```solidity
euint32 private _value;

constructor() {
    _value = FHE.asEuint32(0);
    FHE.allowThis(_value);  // Contract can use _value later
}

function increment() public {
    _value = FHE.add(_value, FHE.asEuint32(1));
    // _value is a NEW ciphertext — need to re-grant access
    FHE.allowThis(_value);
}
```

### Why is This Needed Every Time?

Every FHE operation produces a **new ciphertext** with a **new handle**. The ACL entry for the old handle does not carry over to the new one. You must call `FHE.allowThis()` after every assignment to a state variable.

```
Operation: _value = FHE.add(_value, FHE.asEuint32(1))

Before: _value -> handle 0xAAA (ACL: [this contract])
After:  _value -> handle 0xBBB (ACL: [empty!])
                                 ↑ Must call FHE.allowThis()
```

---

## 3. `FHE.allow(handle, address)` — Grant to Specific Address

Grants a specific address (EOA or contract) persistent access to a ciphertext.

```solidity
mapping(address => euint64) private _balances;

function _updateBalance(address user, euint64 newBalance) internal {
    _balances[user] = newBalance;
    FHE.allowThis(newBalance);      // Contract can use it
    FHE.allow(newBalance, user);     // User can decrypt it
}
```

### Common Pattern: Allow Owner + Contract

```solidity
function deposit(uint64 amount) public {
    euint64 newBalance = FHE.add(_balances[msg.sender], FHE.asEuint64(amount));
    _balances[msg.sender] = newBalance;
    FHE.allowThis(newBalance);           // Contract access
    FHE.allow(newBalance, msg.sender);   // User access
}
```

### Granting Access to Another Contract

```solidity
function shareWith(address otherContract) public {
    FHE.allow(_balances[msg.sender], otherContract);
}
```

This enables composability between FHEVM contracts.

---

## 4. `FHE.allowTransient(handle, address)` — Temporary Permission

Grants access that lasts only for the **current transaction**. This is useful when:
- A contract needs to pass ciphertexts to another contract within a single transaction
- You want to avoid persisting unnecessary ACL entries (saves gas on storage)

```solidity
function processAndForward(address processor) public {
    euint32 result = FHE.add(_value, FHE.asEuint32(1));

    // Only valid during this transaction
    FHE.allowTransient(result, processor);

    // processor contract can use `result` in this same tx
    IProcessor(processor).handle(result);
    // After the transaction, processor loses access
}
```

### Transient vs Persistent

| Feature | `FHE.allow()` | `FHE.allowTransient()` |
|---------|---------------|----------------------|
| Duration | Permanent | Transaction only |
| Storage cost | Higher (persistent) | Lower (transient) |
| Use case | User access, long-term | Inter-contract calls |

---

## 5. `FHE.makePubliclyDecryptable(handle)` — Public Reveal

Makes an encrypted value decryptable by **any** address. Use this when you want to reveal a result publicly — for example, the outcome of a vote or the winner of an auction.

```solidity
// After tallying votes, reveal the result publicly
function revealResult() external onlyOwner {
    FHE.makePubliclyDecryptable(_totalYesVotes);
    FHE.makePubliclyDecryptable(_totalNoVotes);
}
```

> ⚠️ **Warning:** Once made publicly decryptable, ANYONE can see the plaintext value. This is irreversible for that handle. Use only for values meant to be public.

**When to use each ACL function:**

| Function | Use Case |
|----------|----------|
| `FHE.allowThis(handle)` | Contract needs to use the value in future transactions |
| `FHE.allow(handle, addr)` | Grant a specific user access to decrypt |
| `FHE.allowTransient(handle, addr)` | Temporary access within the same transaction (inter-contract calls) |
| `FHE.makePubliclyDecryptable(handle)` | Reveal result to everyone (vote outcomes, auction winners, etc.) |
| `FHE.isSenderAllowed(handle)` | Check if caller has access (for view function guards) |

---

## 6. `FHE.isSenderAllowed(handle)` — Permission Check

Returns `true` if `msg.sender` is authorized to use the given ciphertext.

```solidity
function viewMyBalance() public view returns (euint64) {
    require(FHE.isSenderAllowed(_balances[msg.sender]), "Not authorized");
    return _balances[msg.sender];
}
```

### Use Cases

- Guard functions that return encrypted handles
- Verify authorization before processing ciphertexts from external callers
- Implement role-based access to encrypted data

---

## 7. ACL Patterns

### Pattern 1: Token Balance ACL

```solidity
contract EncryptedToken is ZamaEthereumConfig {
    mapping(address => euint64) private _balances;

    function transfer(address to, uint64 amount) public {
        euint64 amt = FHE.asEuint64(amount);

        // Check sender has enough (encrypted comparison)
        ebool hasEnough = FHE.ge(_balances[msg.sender], amt);

        // Compute new balances
        euint64 newSenderBal = FHE.sub(_balances[msg.sender], amt);
        euint64 newReceiverBal = FHE.add(_balances[to], amt);

        // Conditional update (only if hasEnough)
        _balances[msg.sender] = FHE.select(hasEnough, newSenderBal, _balances[msg.sender]);
        _balances[to] = FHE.select(hasEnough, newReceiverBal, _balances[to]);

        // ACL: contract + sender
        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);

        // ACL: contract + receiver
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);
    }
}
```

### Pattern 2: Multi-Contract Composability

```solidity
contract Vault is ZamaEthereumConfig {
    euint64 private _totalDeposits;

    function getTotalForAudit(address auditor) public {
        // Give auditor temporary access
        FHE.allowTransient(_totalDeposits, auditor);
    }
}

contract Auditor is ZamaEthereumConfig {
    function audit(Vault vault) public {
        vault.getTotalForAudit(address(this));
        // Now this contract can use the ciphertext within this tx
    }
}
```

### Pattern 3: Gated Access with Roles

```solidity
contract GatedData is ZamaEthereumConfig {
    euint32 private _secretData;
    mapping(address => bool) public authorized;

    function grantAccess(address user) public onlyOwner {
        authorized[user] = true;
        FHE.allow(_secretData, user);
    }

    function revokeAccess(address user) public onlyOwner {
        authorized[user] = false;
        // Note: ACL revocation requires re-encrypting with a new handle
        // The old handle remains accessible. Best practice: rotate the data.
    }
}
```

---

## 8. Important ACL Rules

### Rule 1: New Handle = New ACL

Every FHE operation creates a new ciphertext with a fresh handle. The new handle has an **empty ACL**.

```solidity
euint32 a = FHE.asEuint32(10);
FHE.allowThis(a);  // handle_A is allowed

euint32 b = FHE.add(a, FHE.asEuint32(1));
// b has handle_B — NOT in the ACL yet!
FHE.allowThis(b);  // Now handle_B is allowed
```

### Rule 2: The Creator Gets No Automatic Access

Even the contract that creates a ciphertext does not automatically have access to it. You must always call `FHE.allowThis()`.

### Rule 3: ACL is Per-Handle, Not Per-Variable

```solidity
euint32 private _x;

// Transaction 1
_x = FHE.asEuint32(10);  // handle_A
FHE.allowThis(_x);        // ACL[handle_A] = [this]

// Transaction 2
_x = FHE.asEuint32(20);  // handle_B (different handle!)
// ACL[handle_B] is empty — _x is now unusable!
FHE.allowThis(_x);        // Fix: ACL[handle_B] = [this]
```

### Rule 4: Revocation is Not Direct

There is no `FHE.revoke()`. Once an address has access to a handle, it retains access. To "revoke," you must create a new ciphertext (new handle) and only grant access to the still-authorized parties.

---

## 9. Common Mistakes

### Mistake 1: Forgetting `FHE.allowThis()` After Update

```solidity
function update() public {
    _value = FHE.add(_value, FHE.asEuint32(1));
    // MISSING: FHE.allowThis(_value);
    // Next transaction using _value WILL FAIL
}
```

### Mistake 2: Not Granting User Access

```solidity
function setBalance(address user, uint64 amount) public {
    _balances[user] = FHE.asEuint64(amount);
    FHE.allowThis(_balances[user]);
    // MISSING: FHE.allow(_balances[user], user);
    // User cannot decrypt their own balance!
}
```

### Mistake 3: Using `allow` Instead of `allowTransient` for Temporary Needs

```solidity
// Wasteful — persists unnecessary ACL entry
FHE.allow(tempResult, helperContract);

// Better — access expires after transaction
FHE.allowTransient(tempResult, helperContract);
```

---

## Input Validation with FHE.isInitialized()

Before operating on encrypted values received from external sources, validate they are properly initialized:

```solidity
function processValue(euint64 value) internal {
    require(FHE.isInitialized(value), "Invalid encrypted input");
    // Now safe to operate on value
}
```

`FHE.isInitialized()` returns `true` if the handle points to a valid ciphertext. This prevents operating on uninitialized (zero) handles that could cause unexpected behavior. We'll explore this further in Module 16 (Security).

---

## Summary

| Function | Purpose | Duration |
|----------|---------|----------|
| `FHE.allowThis(handle)` | Grant current contract access | Persistent |
| `FHE.allow(handle, addr)` | Grant specific address access | Persistent |
| `FHE.allowTransient(handle, addr)` | Grant temporary access | Transaction only |
| `FHE.makePubliclyDecryptable(handle)` | Reveal to everyone | Persistent (irreversible) |
| `FHE.isSenderAllowed(handle)` | Check if msg.sender has access | N/A (view) |

**Key rules (5 ACL functions):**
1. Every new ciphertext has an empty ACL
2. Always `FHE.allowThis()` after every state update
3. Use `FHE.allow()` for users who need to decrypt
4. Use `FHE.allowTransient()` for inter-contract calls within one transaction
5. Use `FHE.makePubliclyDecryptable()` to reveal values to everyone (irreversible)
6. No direct revocation — rotate data instead
