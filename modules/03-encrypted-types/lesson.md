# Module 03: Encrypted Types Deep Dive — Lesson

**Duration:** 3 hours
**Prerequisites:** Module 02
**Learning Objectives:**
- Master all encrypted types (ebool through euint256 and eaddress)
- Understand type casting and conversions
- Learn basic ACL patterns for storing encrypted values

## Introduction

FHEVM provides a rich set of encrypted data types that mirror familiar Solidity types. Understanding these types — their sizes, capabilities, gas costs, and storage behavior — is fundamental to writing effective confidential smart contracts.

---

## 1. Overview of Encrypted Types

FHEVM offers the following encrypted types:

| Encrypted Type | Plaintext Equivalent | Bit Width | Typical Use Case |
|---------------|---------------------|-----------|-----------------|
| `ebool` | `bool` | 2 bits | Flags, conditions |
| `euint8` | `uint8` | 8 bits | Small counters, scores |
| `euint16` | `uint16` | 16 bits | Moderate ranges |
| `euint32` | `uint32` | 32 bits | General purpose integers |
| `euint64` | `uint64` | 64 bits | Balances, timestamps |
| `euint128` | `uint128` | 128 bits | Large numbers |
| `euint256` | `uint256` | 256 bits | Hashes, full-range values |
| `eaddress` | `address` | 160 bits | Encrypted addresses |

---

## 2. Handles: How Encrypted Data Lives On-Chain

### What is a Handle?

When you create an encrypted value, the actual ciphertext is stored in the FHE co-processor. On the EVM side, your contract only holds a **handle** — a `uint256` reference that points to the ciphertext.

```
┌─────────────────────┐     ┌──────────────────────────┐
│   EVM Storage        │     │   FHE Co-processor       │
│                      │     │                          │
│  euint32 balance ────┼────►│  Ciphertext #0x1a2b...   │
│  (handle: 0x1a2b..)  │     │  (encrypted 32-bit value)│
└─────────────────────┘     └──────────────────────────┘
```

### Key Implications

1. **Storage cost** — Storing an encrypted value costs the same as storing a `uint256` (one storage slot).
2. **No on-chain inspection** — You cannot read or log the plaintext value from within the contract.
3. **Handle reuse** — The same plaintext encrypted twice will produce different handles (different ciphertexts).
4. **Null handle** — An uninitialized encrypted variable has handle `0`, which is invalid for operations.

---

## 3. Boolean Type: `ebool`

### Declaration and Initialization

```solidity
ebool private _isActive;

constructor() {
    _isActive = FHE.asEbool(true);
    FHE.allowThis(_isActive);
}
```

### Use Cases

- Encrypted flags (is a user verified? is an account frozen?)
- Results of encrypted comparisons
- Conditional logic with `FHE.select()`

### Creating from Comparisons

```solidity
euint32 a = FHE.asEuint32(10);
euint32 b = FHE.asEuint32(20);
ebool isGreater = FHE.gt(a, b);  // encrypted false
```

---

## 4. Unsigned Integer Types: `euint8` to `euint256`

### `euint8` — 8-bit Encrypted Integer

```solidity
euint8 private _score;

function setScore(uint8 score) public {
    _score = FHE.asEuint8(score);
    FHE.allowThis(_score);
}
```

Range: 0 to 255.

### `euint16` — 16-bit Encrypted Integer

```solidity
euint16 private _itemCount;

function addItem() public {
    _itemCount = FHE.add(_itemCount, FHE.asEuint16(1));
    FHE.allowThis(_itemCount);
}
```

Range: 0 to 65,535.

### `euint32` — 32-bit Encrypted Integer

The most commonly used type. Good balance between range and gas cost.

```solidity
euint32 private _balance;

function deposit(uint32 amount) public {
    _balance = FHE.add(_balance, FHE.asEuint32(amount));
    FHE.allowThis(_balance);
}
```

Range: 0 to 4,294,967,295.

### `euint64` — 64-bit Encrypted Integer

```solidity
euint64 private _totalSupply;

function mint(uint64 amount) public {
    _totalSupply = FHE.add(_totalSupply, FHE.asEuint64(amount));
    FHE.allowThis(_totalSupply);
}
```

Range: 0 to 18,446,744,073,709,551,615. Suitable for token balances and timestamps.

### `euint128` and `euint256`

For very large numbers. Note that larger types consume more gas for operations.

```solidity
euint128 private _largeValue;
euint256 private _hash;
```

> **Important Limitation:** `euint256` does NOT support arithmetic operations (add, sub, mul, min, max) or ordering comparisons (le, lt, ge, gt). It supports:
> - Bitwise: `FHE.and()`, `FHE.or()`, `FHE.xor()`
> - Equality: `FHE.eq()`, `FHE.ne()`
> - Shift/Rotate: `FHE.shl()`, `FHE.shr()`, `FHE.rotl()`, `FHE.rotr()`
> - Conditional: `FHE.select()`
>
> Use `euint128` or smaller for arithmetic operations.

---

## 5. Encrypted Address: `eaddress`

### Declaration and Usage

```solidity
eaddress private _secretRecipient;

function setRecipient(address recipient) public {
    _secretRecipient = FHE.asEaddress(recipient);
    FHE.allowThis(_secretRecipient);
}
```

### Use Cases

- Hidden recipients in transfer protocols
- Anonymous voting (hiding voter addresses)
- Sealed-bid auctions (hiding bidder identity)

### Comparing Encrypted Addresses

```solidity
ebool isSame = FHE.eq(_secretRecipient, FHE.asEaddress(msg.sender));
```

### Encrypted Bytes Types

fhEVM also provides encrypted byte string types for handling fixed-size binary data:

| Type | Size | Use Case |
|------|------|----------|
| `ebytes64` | 64 bytes | Short encrypted messages, compact data |
| `ebytes128` | 128 bytes | Medium encrypted payloads |
| `ebytes256` | 256 bytes | Large encrypted data, hash-sized values |

These types support equality comparison (`FHE.eq`) and bitwise operations but not arithmetic. They are useful when you need to store and compare encrypted data that doesn't represent a number.

---

## 6. Type Conversion Functions

All conversions go through `FHE.asXXX()`:

| Function | Input | Output |
|----------|-------|--------|
| `FHE.asEbool(bool)` | `bool` | `ebool` |
| `FHE.asEuint8(uint8)` | `uint8` | `euint8` |
| `FHE.asEuint16(uint16)` | `uint16` | `euint16` |
| `FHE.asEuint32(uint32)` | `uint32` | `euint32` |
| `FHE.asEuint64(uint64)` | `uint64` | `euint64` |
| `FHE.asEuint128(uint128)` | `uint128` | `euint128` |
| `FHE.asEuint256(uint256)` | `uint256` | `euint256` |
| `FHE.asEaddress(address)` | `address` | `eaddress` |

> **Important:** These functions encrypt plaintext values **on-chain**. The plaintext is visible in the transaction calldata. For truly private inputs from users, use `externalEuintXX` and `FHE.fromExternal()` (covered in Module 06).

### Encrypted-to-Encrypted Casting (Type Conversion)

fhEVM supports casting between encrypted types:

#### Upcasting (safe, no data loss):
```solidity
euint8 small = FHE.asEuint8(42);
euint32 bigger = FHE.asEuint32(small);  // 42 as euint32
```

#### Downcasting (may truncate):
```solidity
euint32 big = FHE.asEuint32(300);
euint8 truncated = FHE.asEuint8(big);  // 300 mod 256 = 44
```

> **Warning:** Downcasting silently truncates. There is no overflow check on encrypted values!

#### Bool-Integer conversion:
```solidity
ebool flag = FHE.asEbool(true);
euint8 asInt = FHE.asEuint8(flag);     // true -> 1
ebool backToBool = FHE.asEbool(asInt); // non-zero -> true
```

#### Supported casting chain:
`ebool <-> euint8 <-> euint16 <-> euint32 <-> euint64 <-> euint128 <-> euint256`

---

## 7. Storage Patterns

### Pattern 1: Initialize in Constructor

```solidity
euint32 private _value;

constructor() {
    _value = FHE.asEuint32(0);
    FHE.allowThis(_value);
}
```

### Pattern 2: Lazy Initialization

```solidity
euint32 private _value;
bool private _initialized;

function initialize(uint32 val) public {
    require(!_initialized, "Already initialized");
    _value = FHE.asEuint32(val);
    FHE.allowThis(_value);
    _initialized = true;
}
```

### Pattern 3: Mapping with Encrypted Values

```solidity
mapping(address => euint32) private _balances;

function setBalance(address user, uint32 amount) internal {
    _balances[user] = FHE.asEuint32(amount);
    FHE.allowThis(_balances[user]);
    FHE.allow(_balances[user], user);
}
```

### Pattern 4: Array of Encrypted Values

```solidity
euint32[] private _values;

function addValue(uint32 val) public {
    euint32 encrypted = FHE.asEuint32(val);
    FHE.allowThis(encrypted);
    _values.push(encrypted);
}
```

---

## 8. ACL Basics: Who Can Use Encrypted Values?

When you create or update an encrypted value, you must explicitly grant access to it:

- **`FHE.allowThis(handle)`** — Allows **this contract** to use the value in future transactions
- **`FHE.allow(handle, address)`** — Allows a **specific address** to request decryption/reencryption of the value

**Always call both after creating/updating an encrypted value:**

```solidity
_secretValue = FHE.asEuint32(42);
FHE.allowThis(_secretValue);          // Contract can use it in later txs
FHE.allow(_secretValue, msg.sender);   // Caller can decrypt/view it
```

### Why Two Separate Permissions?

- `allowThis` is needed because even the contract that created the ciphertext cannot use it in a *subsequent* transaction without permission
- `allow` is needed so users can request reencryption (off-chain viewing) of their data

> **Deep dive:** Module 05 covers the full ACL system in detail, including `allowTransient` and multi-party access patterns.

---

## 9. Gas Considerations

Larger types cost more gas for operations:

| Type | Relative Gas Cost |
|------|------------------|
| `ebool` | Lowest |
| `euint8` | Low |
| `euint16` | Low-Medium |
| `euint32` | Medium |
| `euint64` | Medium-High |
| `euint128` | High |
| `euint256` | Highest |

**Rule of thumb:** Always use the smallest type that fits your data range.

---

## 10. Common Mistakes

### Mistake 1: Using Uninitialized Encrypted Variables

```solidity
euint32 private _value; // Handle is 0 — INVALID!

function bad() public {
    // This will revert — _value has no valid ciphertext
    _value = FHE.add(_value, FHE.asEuint32(1));
}
```

**Fix:** Always initialize in the constructor.

### Mistake 2: Forgetting `FHE.allowThis()`

```solidity
function bad() public {
    _value = FHE.asEuint32(42);
    // Missing FHE.allowThis(_value)!
    // Later operations on _value will fail
}
```

### Mistake 3: Exposing Plaintext via `FHE.asEuintXX()`

```solidity
// The value 42 is visible in transaction calldata!
function setSecret(uint32 val) public {
    _secret = FHE.asEuint32(val);
}
```

**Fix:** For user-provided secrets, use encrypted inputs (Module 06).

---

## Summary

- FHEVM provides **8 core encrypted types** covering booleans, integers (8-256 bit), and addresses.
- Encrypted values are stored as **handles** (uint256 references) pointing to ciphertexts in the co-processor.
- Use `FHE.asXXX()` to convert plaintext to encrypted (but note the plaintext is visible on-chain).
- Always **initialize** encrypted variables and call `FHE.allowThis()` after updates.
- Use **`FHE.allowThis()`** for contract access and **`FHE.allow()`** for user access -- both are required after every update.
- Choose the **smallest type** that fits your data to minimize gas costs.
