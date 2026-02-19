# Module 04: Operations on Encrypted Data — Lesson

**Duration:** 3 hours
**Prerequisites:** Module 03
**Learning Objectives:**
- Perform arithmetic operations on encrypted values
- Use bitwise and comparison operations
- Understand gas costs of FHE operations

## Introduction

The power of FHE lies in performing computations directly on encrypted data. FHEVM exposes a comprehensive set of operations through the `FHE` library. This module covers every operation category: arithmetic, bitwise, and comparison.

---

## 1. Arithmetic Operations

### Addition: `FHE.add()`

```solidity
euint32 a = FHE.asEuint32(10);
euint32 b = FHE.asEuint32(20);
euint32 sum = FHE.add(a, b); // encrypted 30
```

You can also add an encrypted value with a plaintext:

```solidity
euint32 result = FHE.add(a, 5); // encrypted 15
```

### Subtraction: `FHE.sub()`

```solidity
euint32 a = FHE.asEuint32(20);
euint32 b = FHE.asEuint32(5);
euint32 diff = FHE.sub(a, b); // encrypted 15
```

> **Overflow behavior:** If `b > a`, the result wraps around (unsigned underflow). There is no revert. You must handle this in your logic using comparisons.

### Multiplication: `FHE.mul()`

```solidity
euint32 a = FHE.asEuint32(6);
euint32 b = FHE.asEuint32(7);
euint32 product = FHE.mul(a, b); // encrypted 42
```

> **Warning:** Multiplication is the most gas-expensive arithmetic operation. Use sparingly and prefer smaller types.

### Division: `FHE.div()`

Division is only supported with a **plaintext** divisor:

```solidity
euint32 a = FHE.asEuint32(100);
euint32 result = FHE.div(a, 3); // encrypted 33 (integer division)
```

> **Note:** You cannot divide two encrypted values. The divisor must be plaintext. Division by zero returns 0 (no revert in FHE).

### Remainder: `FHE.rem()`

Like division, remainder requires a **plaintext** operand:

```solidity
euint32 a = FHE.asEuint32(100);
euint32 result = FHE.rem(a, 3); // encrypted 1
```

### Negation: `FHE.neg()`

Returns the two's complement negation:

```solidity
euint32 a = FHE.asEuint32(5);
euint32 negA = FHE.neg(a); // encrypted (2^32 - 5)
```

---

## 2. Arithmetic Operations Summary Table

| Operation | Function | Operands | Notes |
|-----------|----------|----------|-------|
| Addition | `FHE.add(a, b)` | enc + enc, enc + plain | Wraps on overflow |
| Subtraction | `FHE.sub(a, b)` | enc - enc, enc - plain | Wraps on underflow |
| Multiplication | `FHE.mul(a, b)` | enc * enc, enc * plain | High gas cost |
| Division | `FHE.div(a, b)` | enc / plain only | No enc/enc division |
| Remainder | `FHE.rem(a, b)` | enc % plain only | No enc/enc remainder |
| Negation | `FHE.neg(a)` | enc | Two's complement |

---

## 3. Bitwise Operations

### AND: `FHE.and()`

```solidity
euint8 a = FHE.asEuint8(0b11001100);
euint8 b = FHE.asEuint8(0b10101010);
euint8 result = FHE.and(a, b); // encrypted 0b10001000 = 136
```

### OR: `FHE.or()`

```solidity
euint8 result = FHE.or(a, b); // encrypted 0b11101110 = 238
```

### XOR: `FHE.xor()`

```solidity
euint8 result = FHE.xor(a, b); // encrypted 0b01100110 = 102
```

### NOT: `FHE.not()`

```solidity
euint8 a = FHE.asEuint8(0b11001100);
euint8 result = FHE.not(a); // encrypted 0b00110011 = 51
```

### Shift and Rotate Operations

Shift and rotate operations are available for `euint8` through `euint128`. The shift amount is **always** `euint8` or `uint8`, regardless of the value type being shifted.

```solidity
euint32 value = FHE.asEuint32(16);

// Shift left by 2: 16 << 2 = 64
euint32 shifted = FHE.shl(value, FHE.asEuint8(2));
// OR with plaintext shift amount:
euint32 shifted2 = FHE.shl(value, 2);  // uint8 literal

// Shift right by 1: 16 >> 1 = 8
euint32 rightShifted = FHE.shr(value, 1);
```

> ⚠️ **Important:** The shift amount (second parameter) must ALWAYS be `euint8` or `uint8`, regardless of the first operand's type.

> **Shift Modulo:** The shift amount is taken modulo the bit width of the type. For example, `FHE.shl(euint8_val, 10)` is equivalent to `FHE.shl(euint8_val, 2)` because `10 mod 8 = 2`. This applies to `shl`, `shr`, `rotl`, and `rotr`.

### Shift Left: `FHE.shl()`

```solidity
euint32 a = FHE.asEuint32(1);
euint32 result = FHE.shl(a, 3); // 1 << 3 = 8
```

### Shift Right: `FHE.shr()`

```solidity
euint32 a = FHE.asEuint32(16);
euint32 result = FHE.shr(a, 2); // 16 >> 2 = 4
```

### Rotate Left: `FHE.rotl()`

```solidity
euint32 a = FHE.asEuint32(0x80000001);
euint32 result = FHE.rotl(a, 1); // 0x00000003 (circular shift)
```

### Rotate Right: `FHE.rotr()`

```solidity
euint32 a = FHE.asEuint32(1);
euint32 result = FHE.rotr(a, 1); // 0x80000000 (circular shift)
```

---

## 4. Bitwise Operations Summary Table

| Operation | Function | Operands |
|-----------|----------|----------|
| AND | `FHE.and(a, b)` | enc & enc, enc & plain |
| OR | `FHE.or(a, b)` | enc \| enc, enc \| plain |
| XOR | `FHE.xor(a, b)` | enc ^ enc, enc ^ plain |
| NOT | `FHE.not(a)` | ~enc |
| Shift Left | `FHE.shl(a, b)` | enc, shift amount: euint8/uint8 |
| Shift Right | `FHE.shr(a, b)` | enc, shift amount: euint8/uint8 |
| Rotate Left | `FHE.rotl(a, b)` | enc, shift amount: euint8/uint8 |
| Rotate Right | `FHE.rotr(a, b)` | enc, shift amount: euint8/uint8 |

---

## 5. Comparison Operations

All comparison operations return an `ebool` (encrypted boolean).

### Equal: `FHE.eq()`

```solidity
euint32 a = FHE.asEuint32(42);
euint32 b = FHE.asEuint32(42);
ebool isEqual = FHE.eq(a, b); // encrypted true
```

### Not Equal: `FHE.ne()`

```solidity
ebool isNotEqual = FHE.ne(a, b); // encrypted false
```

### Greater Than: `FHE.gt()`

```solidity
euint32 a = FHE.asEuint32(10);
euint32 b = FHE.asEuint32(5);
ebool result = FHE.gt(a, b); // encrypted true
```

### Greater Than or Equal: `FHE.ge()`

```solidity
ebool result = FHE.ge(a, b); // encrypted true
```

### Less Than: `FHE.lt()`

```solidity
ebool result = FHE.lt(a, b); // encrypted false
```

### Less Than or Equal: `FHE.le()`

```solidity
ebool result = FHE.le(a, b); // encrypted false
```

---

## 6. Comparison Operations Summary Table

| Operation | Function | Returns |
|-----------|----------|---------|
| Equal | `FHE.eq(a, b)` | `ebool` |
| Not Equal | `FHE.ne(a, b)` | `ebool` |
| Greater Than | `FHE.gt(a, b)` | `ebool` |
| Greater or Equal | `FHE.ge(a, b)` | `ebool` |
| Less Than | `FHE.lt(a, b)` | `ebool` |
| Less or Equal | `FHE.le(a, b)` | `ebool` |

All comparisons support encrypted-encrypted and encrypted-plaintext operands.

---

## 7. Min and Max

```solidity
euint32 a = FHE.asEuint32(10);
euint32 b = FHE.asEuint32(20);

euint32 smaller = FHE.min(a, b); // encrypted 10
euint32 larger  = FHE.max(a, b); // encrypted 20
```

These are extremely useful for clamping values:

```solidity
// Clamp to maximum of 100
euint32 clamped = FHE.min(value, FHE.asEuint32(100));

// Clamp to minimum of 10
euint32 atLeast10 = FHE.max(value, FHE.asEuint32(10));
```

---

## 8. Cross-Type Operation Support

### Automatic Type Upcasting

fhEVM supports operations between different encrypted types! The result is automatically upcast to the larger type:

```solidity
euint8 small = FHE.asEuint8(10);
euint32 big = FHE.asEuint32(1000);

// Cross-type addition: result is euint32
euint32 sum = FHE.add(small, big);  // ✅ Works! Result: 1010 as euint32

// Cross-type comparison: result is ebool
ebool isLess = FHE.lt(small, big);  // ✅ Works!
```

> **Rule:** When mixing types, the result type is always the LARGER of the two operand types.
> **Supported combinations:** All pairs of euint8, euint16, euint32, euint64, euint128.

### Encrypted + Plaintext

Many operations accept one encrypted and one plaintext operand:

```solidity
euint32 a = FHE.asEuint32(10);

// These are valid:
FHE.add(a, 5);       // euint32 + plaintext
FHE.mul(a, 3);       // euint32 * plaintext
FHE.eq(a, 10);       // euint32 == plaintext
FHE.shl(a, 2);       // euint32 << 2 (shift amount always uint8)
```

The plaintext is automatically encrypted to match the encrypted operand's type.

---

## 9. Operation Support by Type

Not all operations are available for all encrypted types:

| Operation | euint8-128 | euint256 | eaddress | ebool |
|-----------|-----------|----------|----------|-------|
| add, sub, mul | ✅ | ❌ | ❌ | ❌ |
| div, rem (scalar) | ✅ | ❌ | ❌ | ❌ |
| min, max | ✅ | ❌ | ❌ | ❌ |
| le, lt, ge, gt | ✅ | ❌ | ❌ | ❌ |
| eq, ne | ✅ | ✅ | ✅ | ✅ |
| and, or, xor | ✅ | ✅ | ❌ | ✅ |
| not, neg | ✅ | ✅ | ❌ | ✅ (not) |
| shl, shr, rotl, rotr | ✅ | ✅ | ❌ | ❌ |
| select | ✅ | ✅ | ✅ | ✅ |

> 💡 `euint256` is primarily useful for storing large hashes/IDs with equality checks.
> For arithmetic, use `euint128` or smaller.

---

## 10. Overflow and Underflow Behavior

FHEVM uses **wrapping arithmetic** (modular arithmetic):

```solidity
euint8 a = FHE.asEuint8(250);
euint8 b = FHE.asEuint8(10);

// 250 + 10 = 260, but euint8 max is 255
// Result wraps: 260 % 256 = 4
euint8 sum = FHE.add(a, b); // encrypted 4

// 5 - 10 = -5, wraps to 256 - 5 = 251
euint8 c = FHE.asEuint8(5);
euint8 diff = FHE.sub(c, b); // encrypted 251
```

> **Important:** There are NO overflow reverts in FHE. You must check bounds yourself if needed.

### Safe Subtraction Pattern

```solidity
function safeSub(euint32 a, euint32 b) internal returns (euint32) {
    // Only subtract if a >= b, otherwise return 0
    ebool isValid = FHE.ge(a, b);
    euint32 diff = FHE.sub(a, b);
    euint32 zero = FHE.asEuint32(0);
    return FHE.select(isValid, diff, zero);
}
```

---

## 11. Practical Example: Encrypted Calculator

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedCalculator is ZamaEthereumConfig {
    euint32 private _result;

    constructor() {
        _result = FHE.asEuint32(0);
        FHE.allowThis(_result);
    }

    function add(uint32 value) public {
        _result = FHE.add(_result, FHE.asEuint32(value));
        FHE.allowThis(_result);
    }

    function subtract(uint32 value) public {
        // Safe subtraction: clamp at 0
        euint32 val = FHE.asEuint32(value);
        ebool canSubtract = FHE.ge(_result, val);
        euint32 diff = FHE.sub(_result, val);
        _result = FHE.select(canSubtract, diff, FHE.asEuint32(0));
        FHE.allowThis(_result);
    }

    function multiply(uint32 value) public {
        _result = FHE.mul(_result, FHE.asEuint32(value));
        FHE.allowThis(_result);
    }

    function clamp(uint32 minVal, uint32 maxVal) public {
        _result = FHE.max(_result, FHE.asEuint32(minVal));
        _result = FHE.min(_result, FHE.asEuint32(maxVal));
        FHE.allowThis(_result);
    }

    function getResult() public view returns (euint32) {
        return _result;
    }
}
```

---

## 12. Gas Cost Comparison

Operations ordered by approximate gas cost (lowest to highest):

1. **NOT** — Cheapest (single operand)
2. **AND, OR, XOR** — Bitwise is efficient
3. **ADD, SUB** — Standard arithmetic
4. **SHL, SHR, ROTL, ROTR** — Medium (shift operations)
5. **EQ, NE** — Equality checks
6. **GT, GE, LT, LE** — Ordering comparisons
7. **MIN, MAX** — Comparison + select
8. **MUL** — Most expensive arithmetic
9. **DIV, REM** — Expensive (plaintext divisor only)

---

## Summary

- **Arithmetic:** `add`, `sub`, `mul` (enc+enc), `div`, `rem` (enc+plain only), `neg`
- **Bitwise:** `and`, `or`, `xor`, `not`, `shl`, `shr`, `rotl`, `rotr` (shift amount always `euint8`/`uint8`)
- **Comparison:** `eq`, `ne`, `gt`, `ge`, `lt`, `le` — all return `ebool`
- **Min/Max:** `FHE.min()`, `FHE.max()` for clamping
- Cross-type operations are supported — result is automatically upcast to the larger type
- Arithmetic uses **wrapping** (no overflow reverts) — handle bounds manually
- Use `FHE.select()` for safe conditional patterns (covered in Module 08)
