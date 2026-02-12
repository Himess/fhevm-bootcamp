---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 03: Encrypted Types Deep Dive"
footer: "Zama Developer Program"
---

# Module 03: Encrypted Types Deep Dive

Master every encrypted data type in FHEVM.

---

# The Full Type Menu

| Type | Bits | Example Use |
|------|------|-------------|
| `ebool` | 1 | Flags, conditions |
| `euint8` | 8 | Scores, small counters |
| `euint16` | 16 | Item counts |
| `euint32` | 32 | General purpose |
| `euint64` | 64 | Balances, timestamps |
| `euint128` | 128 | Large numbers |
| `euint256` | 256 | Hashes, full range |
| `eaddress` | 160 | Hidden recipients |

---

# What is a Handle?

Encrypted values are NOT stored directly on the EVM.

```
EVM Storage              FHE Co-processor
┌──────────────┐         ┌─────────────────┐
│ handle: 0x1a │────────►│ Ciphertext #0x1a│
│ (uint256)    │         │ (encrypted data) │
└──────────────┘         └─────────────────┘
```

- Each `euint32`, `ebool`, etc. is a **uint256 handle** under the hood
- One storage slot per encrypted variable
- Handle `0` = uninitialized / invalid

---

# Creating Encrypted Values

```solidity
ebool   flag    = FHE.asEbool(true);
euint8  score   = FHE.asEuint8(100);
euint16 count   = FHE.asEuint16(5000);
euint32 balance = FHE.asEuint32(1000000);
euint64 big     = FHE.asEuint64(999999999);
```

All use the pattern: `FHE.asXXX(plaintext)`

---

# Encrypted Addresses

```solidity
eaddress private _hiddenRecipient;

function setRecipient(address addr) public {
    _hiddenRecipient = FHE.asEaddress(addr);
    FHE.allowThis(_hiddenRecipient);
}
```

Use cases:
- Anonymous voting
- Hidden transfer recipients
- Sealed-bid auctions

---

# Storage Pattern: Basic

```solidity
contract Vault is ZamaEthereumConfig {
    euint32 private _balance;

    constructor() {
        _balance = FHE.asEuint32(0);  // Initialize!
        FHE.allowThis(_balance);       // Grant access!
    }

    function deposit(uint32 amount) public {
        _balance = FHE.add(_balance, FHE.asEuint32(amount));
        FHE.allowThis(_balance);       // Re-grant after update!
    }
}
```

---

# Storage Pattern: Mappings

```solidity
mapping(address => euint32) private _balances;

function _setBalance(address user, uint32 amount) internal {
    _balances[user] = FHE.asEuint32(amount);
    FHE.allowThis(_balances[user]);  // Contract access
    FHE.allow(_balances[user], user); // User access
}
```

Mappings work exactly like regular Solidity — each value is a handle.

---

# ACL Basics: Who Can Use Encrypted Values?

When you create or update an encrypted value, you must grant access:

- **`FHE.allowThis(handle)`** — Allows **this contract** to use it in future txs
- **`FHE.allow(handle, address)`** — Allows a **specific address** to decrypt/reencrypt

```solidity
_secretValue = FHE.asEuint32(42);
FHE.allowThis(_secretValue);          // Contract can use it later
FHE.allow(_secretValue, msg.sender);   // Caller can decrypt/view it
```

### Why Two Separate Permissions?

- `allowThis` — even the creating contract needs permission for the *next* transaction
- `allow` — users need permission to request reencryption (off-chain viewing)

> **Deep dive:** Module 05 covers `allowTransient` and multi-party access patterns.

---

# The Golden Rules

### 1. Always Initialize
```solidity
// BAD: handle is 0, operations will revert
euint32 private _value;

// GOOD: valid ciphertext created
constructor() {
    _value = FHE.asEuint32(0);
    FHE.allowThis(_value);
}
```

---

# The Golden Rules (continued)

### 2. Always `FHE.allowThis()` After Updates
```solidity
function update() public {
    _value = FHE.add(_value, FHE.asEuint32(1));
    FHE.allowThis(_value);  // REQUIRED!
}
```

### 3. Use the Smallest Type
```solidity
// Storing age (0-150)?
euint8 age;    // GOOD: 8 bits is enough
euint256 age;  // BAD: wastes gas
```

---

# Plaintext Warning

```solidity
// The value 42 is VISIBLE in transaction calldata!
function setSecret(uint32 val) public {
    _secret = FHE.asEuint32(val);
}
```

`FHE.asEuintXX()` encrypts on-chain, but the **input is plaintext**.

For truly private inputs: use `externalEuintXX` + `FHE.fromExternal()` (Module 06).

---

# Gas Cost by Type

```
ebool    ████░░░░░░░░░░░░░░░░  Lowest
euint8   ██████░░░░░░░░░░░░░░
euint16  ███████░░░░░░░░░░░░░
euint32  █████████░░░░░░░░░░░  Medium
euint64  ████████████░░░░░░░░
euint128 ███████████████░░░░░
euint256 ████████████████████  Highest
```

**Rule:** Smallest type that fits = cheapest operations.

---

# Which Encrypted Type to Use?

```
Need a flag/boolean? --> ebool
Need to store an address privately? --> eaddress
Need arithmetic operations?
  +-- Values < 256? --> euint8 (lowest gas)
  +-- Values < 65,536? --> euint16
  +-- Values < 4 billion? --> euint32 (most common)
  +-- Large values? --> euint64 or euint128
  +-- Need 256-bit? --> euint256 (WARNING: NO arithmetic!)
```

> Rule of thumb: Use the smallest type that fits your data.
> Smaller types = lower gas costs.

---

# Type Casting Between Encrypted Types

## Upcasting (safe)
```solidity
euint8 small = FHE.asEuint8(42);
euint32 bigger = FHE.asEuint32(small); // safe
```

## Downcasting (truncates!)
```solidity
euint32 big = FHE.asEuint32(300);
euint8 truncated = FHE.asEuint8(big); // 300 mod 256 = 44!
```

## Casting chain:
`ebool <-> euint8 <-> euint16 <-> euint32 <-> euint64 <-> euint128 <-> euint256`

---

# Summary

1. **8 core encrypted types** covering all common data needs
2. Values stored as **uint256 handles** referencing co-processor ciphertexts
3. Create with `FHE.asXXX(plaintext)` — but plaintext is on-chain
4. Always **initialize** and **`FHE.allowThis()`** after every update
5. Use **`FHE.allowThis()`** for contract access and **`FHE.allow()`** for user access
6. Use the **smallest suitable type** to save gas

---

# Next Up

**Module 04: Operations on Encrypted Data**

Learn arithmetic, bitwise, and comparison operations on encrypted values.
