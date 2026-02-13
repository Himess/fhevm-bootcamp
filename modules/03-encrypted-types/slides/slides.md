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

<!--
Speaker notes: Have students refer back to this table throughout the bootcamp. The most commonly used types are euint32 (general purpose), euint64 (balances), and ebool (conditions). Mention that euint256 has limited operations -- no arithmetic comparisons beyond eq/ne.
-->

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

<!--
Speaker notes: This is a critical concept -- encrypted values are not stored in the EVM directly. The EVM holds a uint256 handle that points to the actual ciphertext in the coprocessor. Think of handles like file descriptors or pointers. A handle of 0 means "no value" and will cause operations to revert.
-->

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

<!--
Speaker notes: The FHE.asXXX() pattern is how you convert plaintext to ciphertext on-chain. Stress that the plaintext value IS visible in the transaction calldata -- this is fine for constants and initialization, but not for user secrets. Module 06 covers truly private inputs.
-->

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

<!--
Speaker notes: eaddress is unique to FHEVM -- no other FHE framework has this. It enables hiding who the recipient of a transaction or winner of an auction is. Ask students to think about what other use cases benefit from hiding addresses.
-->

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

<!--
Speaker notes: This is the most important pattern in all of FHEVM. Every time you write to an encrypted state variable, you MUST call FHE.allowThis(). Point out the three places: constructor, deposit, and any other function that modifies _balance. This pattern will repeat in every contract.
-->

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

<!--
Speaker notes: Show that the mapping pattern is identical to standard Solidity -- the only difference is the ACL calls. Point out the dual grant: allowThis for the contract and allow for the user. This dual-grant pattern is what enables users to decrypt their own balances.
-->

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

<!--
Speaker notes: Explain the "why" behind the two permissions: allowThis is needed because even the contract that created the value loses access in the next transaction. allow is for users who need to see their own data. This is the most common source of bugs -- forgetting either one.
-->

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

<!--
Speaker notes: The "always initialize" rule catches many beginners. An uninitialized euint32 has handle 0, and any FHE operation on handle 0 will fail. Make this a class mantra: "Initialize, then allowThis."
-->

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

<!--
Speaker notes: Rule 2 (allowThis after updates) is worth repeating: every FHE operation creates a NEW handle, so the old ACL does not apply. Rule 3 (smallest type) directly impacts gas costs, which we will quantify on the next slide.
-->

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

<!--
Speaker notes: This is a crucial warning that students often miss. FHE.asEuint32(42) encrypts the value on-chain, but the number 42 is plaintext in the transaction calldata. Anyone reading the blockchain can see it. For user-provided secrets, always use externalEuintXX.
-->

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

<!--
Speaker notes: Use this gas bar chart to justify the "smallest type" rule. The difference between ebool and euint256 can be 10x or more in gas. For a contract doing many operations, this adds up significantly.
-->

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

<!--
Speaker notes: Walk through the decision tree with students. Ask: "What type would you use for a token balance? For an age check? For a flag?" Have students practice choosing types before showing the answer. Highlight the euint256 warning -- no arithmetic operations supported.
-->

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

<!--
Speaker notes: Upcasting is always safe because the value fits in the larger type. Downcasting is dangerous because it truncates silently -- there is no revert. This is similar to how Solidity handles uint casting, but with encrypted values you cannot even check the result. Warn students to be very careful with downcasting.
-->

---

# Summary

1. **8 core encrypted types** covering all common data needs
2. Values stored as **uint256 handles** referencing co-processor ciphertexts
3. Create with `FHE.asXXX(plaintext)` — but plaintext is on-chain
4. Always **initialize** and **`FHE.allowThis()`** after every update
5. Use **`FHE.allowThis()`** for contract access and **`FHE.allow()`** for user access
6. Use the **smallest suitable type** to save gas

<!--
Speaker notes: Review these six summary points as a checklist. Ask students to close their laptops and name the three golden rules from memory. Reinforce: initialize, allowThis after every update, smallest type.
-->

---

# Next Up

**Module 04: Operations on Encrypted Data**

Learn arithmetic, bitwise, and comparison operations on encrypted values.

<!--
Speaker notes: Transition by saying we now know how to declare encrypted types, and next we need to learn what operations we can perform on them. Module 04 is the "operator reference" module.
-->
