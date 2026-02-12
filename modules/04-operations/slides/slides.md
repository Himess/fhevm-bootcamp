---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 04: Operations on Encrypted Data"
footer: "Zama Developer Program"
---

# Module 04: Operations on Encrypted Data

Arithmetic, bitwise, and comparison operations on encrypted values.

---

# Three Operation Categories

| Category | Examples | Returns |
|----------|----------|---------|
| **Arithmetic** | add, sub, mul, div, rem | `euintXX` |
| **Bitwise** | and, or, xor, not | `euintXX` |
| **Comparison** | eq, ne, gt, ge, lt, le | `ebool` |

Plus: `min`, `max`, `neg`

---

# Arithmetic Operations

```solidity
euint32 a = FHE.asEuint32(10);
euint32 b = FHE.asEuint32(3);

FHE.add(a, b);   // 13
FHE.sub(a, b);   // 7
FHE.mul(a, b);   // 30
FHE.div(a, 3);   // 3  (plaintext divisor only!)
FHE.rem(a, 3);   // 1  (plaintext divisor only!)
FHE.neg(a);      // 2^32 - 10
```

---

# Key Rule: Division and Remainder

`FHE.div()` and `FHE.rem()` require a **plaintext** second operand.

```solidity
// VALID
FHE.div(encryptedValue, 5);

// INVALID — will not compile
FHE.div(encryptedA, encryptedB);
```

Dividing two encrypted values is not supported in the current FHE scheme.

---

# Bitwise Operations

```solidity
euint8 a = FHE.asEuint8(0b11001100);
euint8 b = FHE.asEuint8(0b10101010);

FHE.and(a, b);  // 0b10001000
FHE.or(a, b);   // 0b11101110
FHE.xor(a, b);  // 0b01100110
FHE.not(a);     // 0b00110011
```

---

# Shift and Rotate -- Not Yet Available

> **Not Available Yet:** The shift and rotate operations (`FHE.shl()`, `FHE.shr()`, `FHE.rotl()`, `FHE.rotr()`) are defined in the TFHE specification but are **not yet available** in the current fhEVM release (v0.10). They may be added in future versions. For now, bitwise operations are limited to: `and`, `or`, `xor`, `not`.

```solidity
// NOT AVAILABLE in fhEVM v0.10 -- shown for reference only
// euint32 a = FHE.asEuint32(1);
// FHE.shl(a, 3);   // 8    (shift left)
// FHE.shr(a, 1);   // 0    (shift right)

// euint8 b = FHE.asEuint8(0b10000001);
// FHE.rotl(b, 1);  // 0b00000011  (rotate left)
// FHE.rotr(b, 1);  // 0b11000000  (rotate right)
```

---

# Comparison Operations

All return `ebool`:

```solidity
euint32 a = FHE.asEuint32(10);
euint32 b = FHE.asEuint32(20);

ebool r1 = FHE.eq(a, b);   // encrypted false
ebool r2 = FHE.ne(a, b);   // encrypted true
ebool r3 = FHE.gt(a, b);   // encrypted false
ebool r4 = FHE.ge(a, b);   // encrypted false
ebool r5 = FHE.lt(a, b);   // encrypted true
ebool r6 = FHE.le(a, b);   // encrypted true
```

---

# Min and Max

```solidity
euint32 a = FHE.asEuint32(10);
euint32 b = FHE.asEuint32(20);

euint32 smaller = FHE.min(a, b); // 10
euint32 larger  = FHE.max(a, b); // 20
```

**Great for clamping:**
```solidity
// value between 10 and 100
value = FHE.max(value, FHE.asEuint32(10));
value = FHE.min(value, FHE.asEuint32(100));
```

---

# Type Compatibility

Both operands must be the **same** encrypted type:

```solidity
// GOOD
FHE.add(euint32_val, euint32_val);

// ERROR — type mismatch
FHE.add(euint32_val, euint64_val);
```

Many operations also accept one plaintext operand:
```solidity
FHE.add(encryptedVal, 5);  // OK
FHE.eq(encryptedVal, 42);  // OK
```

---

# Overflow Behavior

FHEVM uses **wrapping arithmetic** — no reverts on overflow!

```solidity
euint8 a = FHE.asEuint8(250);
euint8 sum = FHE.add(a, FHE.asEuint8(10));
// 250 + 10 = 260 → wraps to 4

euint8 b = FHE.asEuint8(5);
euint8 diff = FHE.sub(b, FHE.asEuint8(10));
// 5 - 10 = -5 → wraps to 251
```

**You must check bounds manually!**

---

# Safe Subtraction Pattern

```solidity
function safeSub(
    euint32 a, euint32 b
) internal returns (euint32) {
    ebool isValid = FHE.ge(a, b);
    euint32 diff = FHE.sub(a, b);
    euint32 zero = FHE.asEuint32(0);
    return FHE.select(isValid, diff, zero);
}
```

Uses `FHE.select()` (covered in detail in Module 08).

---

# Gas Cost Ranking

```
NOT         █░░░░░░░░░  Cheapest
AND/OR/XOR  ██░░░░░░░░
ADD/SUB     ████░░░░░░
SHL/SHR     N/A (not yet available)
EQ/NE       █████░░░░░
GT/GE/LT/LE███████░░░
MIN/MAX     ████████░░
MUL         █████████░
DIV/REM     ██████████  Most Expensive
```

---

# Practical Example: Encrypted Counter with Bounds

```solidity
euint32 private _counter;
uint32 constant MAX = 1000;

function increment(uint32 amount) public {
    euint32 newVal = FHE.add(_counter, FHE.asEuint32(amount));
    // Clamp to MAX
    _counter = FHE.min(newVal, FHE.asEuint32(MAX));
    FHE.allowThis(_counter);
}
```

---

# Summary

| Category | Operations | Key Notes |
|----------|-----------|-----------|
| Arithmetic | add, sub, mul, div, rem, neg | div/rem: plaintext only |
| Bitwise | and, or, xor, not | Efficient gas |
| ~~Bitwise (coming soon)~~ | ~~shl, shr, rotl, rotr~~ | Not yet available in v0.10 |
| Comparison | eq, ne, gt, ge, lt, le | Return `ebool` |
| Min/Max | min, max | Great for clamping |

- Same-type operands required
- Wrapping arithmetic (no reverts)
- Handle bounds with comparisons + `FHE.select()`

---

# Next Up

**Module 05: Access Control (ACL)**

Learn `FHE.allow()`, `FHE.allowThis()`, `FHE.allowTransient()`, and `FHE.isSenderAllowed()`.
