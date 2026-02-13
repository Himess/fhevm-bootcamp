# Module 08: Conditional Logic — Lesson

## Introduction

In standard Solidity, you write `if (balance >= amount) { ... }` to branch on a condition. With encrypted values, this is **impossible** — you cannot branch on an encrypted boolean because the EVM does not know whether it is true or false.

FHEVM solves this with `FHE.select()`, an encrypted ternary operator that evaluates **both** branches and picks the correct result — all while keeping the condition encrypted.

---

## 1. Why Branching Fails with Encrypted Data

### The Problem

```solidity
// THIS DOES NOT WORK with encrypted values
ebool hasEnough = FHE.ge(balance, amount);

if (hasEnough) {  // ERROR: Cannot convert ebool to bool
    balance = FHE.sub(balance, amount);
}
```

The EVM needs a plaintext `bool` for `if` statements. An `ebool` is an encrypted value — the EVM cannot read it without decryption.

### The Solution: Compute Both Branches

Instead of choosing which code path to execute, you **execute both paths** and use `FHE.select()` to pick the correct result:

```solidity
ebool hasEnough = FHE.ge(balance, amount);

euint64 newBalance = FHE.sub(balance, amount);    // Path A: deduct
// Path B: keep original balance (no code needed)

balance = FHE.select(hasEnough, newBalance, balance);
// If hasEnough: balance = newBalance
// If !hasEnough: balance = balance (unchanged)
```

---

## 1.5 Comparison Operators Reference

All encrypted comparison operators return `ebool`:

| Operator | Description | Example | Returns |
|----------|-------------|---------|---------|
| `FHE.eq(a, b)` | Equal | `FHE.eq(encAge, FHE.asEuint32(18))` | `ebool` |
| `FHE.ne(a, b)` | Not equal | `FHE.ne(encStatus, FHE.asEuint8(0))` | `ebool` |
| `FHE.lt(a, b)` | Less than | `FHE.lt(encBid, encReserve)` | `ebool` |
| `FHE.le(a, b)` | Less than or equal | `FHE.le(encAge, FHE.asEuint32(65))` | `ebool` |
| `FHE.gt(a, b)` | Greater than | `FHE.gt(encBalance, encCost)` | `ebool` |
| `FHE.ge(a, b)` | Greater than or equal | `FHE.ge(encBalance, encPrice)` | `ebool` |

> **Type restrictions:**
> - `euint256` only supports `FHE.eq()` and `FHE.ne()` — NO ordering comparisons (`lt`/`le`/`gt`/`ge`)
> - `eaddress` only supports `FHE.eq()` and `FHE.ne()`
> - Cross-type comparisons are supported with auto-upcast (e.g., `FHE.gt(euint32, euint64)` → result is `ebool`)

---

## 2. `FHE.select()` — The Encrypted Ternary

### Syntax

```solidity
FHE.select(condition, valueIfTrue, valueIfFalse)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `condition` | `ebool` | Encrypted boolean condition |
| `valueIfTrue` | `euintXX` / `ebool` / `eaddress` | Value returned when condition is true |
| `valueIfFalse` | `euintXX` / `ebool` / `eaddress` | Value returned when condition is false |
| **Returns** | Same as value types | The selected encrypted value |

### Type Rules

- `valueIfTrue` and `valueIfFalse` must be the **same type**
- The return type matches the value types
- The condition must be an `ebool`
- Works with **all** encrypted types: `euint8`, `euint16`, `euint32`, `euint64`, `euint128`, `euint256`, `ebool`, `eaddress`

### Basic Examples

```solidity
// Ternary: result = (a > b) ? a : b
ebool aIsLarger = FHE.gt(a, b);
euint32 result = FHE.select(aIsLarger, a, b);  // max(a, b)

// Ternary: flag = (x == 0) ? true : false
ebool isZero = FHE.eq(x, FHE.asEuint32(0));
ebool flag = FHE.select(isZero, FHE.asEbool(true), FHE.asEbool(false));

// Select encrypted address
eaddress winner = FHE.select(aWins, playerA, playerB);
```

---

## 3. Common Patterns

### Pattern 1: Safe Subtraction (No Underflow)

```solidity
function safeSub(euint32 a, euint32 b) internal returns (euint32) {
    ebool canSub = FHE.ge(a, b);
    euint32 diff = FHE.sub(a, b);
    euint32 zero = FHE.asEuint32(0);
    euint32 result = FHE.select(canSub, diff, zero);
    FHE.allowThis(result);
    return result;
}
```

### Pattern 2: Clamp (Min and Max Bound)

```solidity
function clamp(euint32 value, uint32 minVal, uint32 maxVal) internal returns (euint32) {
    euint32 atLeastMin = FHE.max(value, FHE.asEuint32(minVal));
    euint32 clamped = FHE.min(atLeastMin, FHE.asEuint32(maxVal));
    FHE.allowThis(clamped);
    return clamped;
}
```

Note: `FHE.min()` and `FHE.max()` are built-in and internally use `FHE.select()`. You can also write them manually:

```solidity
// Manual min
ebool isSmaller = FHE.lt(a, b);
euint32 minVal = FHE.select(isSmaller, a, b);

// Manual max
ebool isLarger = FHE.gt(a, b);
euint32 maxVal = FHE.select(isLarger, a, b);
```

### Pattern 3: Conditional Transfer

```solidity
function transfer(address to, uint64 amount) public {
    euint64 amt = FHE.asEuint64(amount);
    ebool hasEnough = FHE.ge(_balances[msg.sender], amt);

    // Compute both outcomes
    euint64 senderAfter = FHE.sub(_balances[msg.sender], amt);
    euint64 receiverAfter = FHE.add(_balances[to], amt);

    // Select based on condition
    _balances[msg.sender] = FHE.select(hasEnough, senderAfter, _balances[msg.sender]);
    _balances[to] = FHE.select(hasEnough, receiverAfter, _balances[to]);

    // ACL
    FHE.allowThis(_balances[msg.sender]);
    FHE.allow(_balances[msg.sender], msg.sender);
    FHE.allowThis(_balances[to]);
    FHE.allow(_balances[to], to);
}
```

### Pattern 4: Increment with Cap

```solidity
function incrementCapped(euint32 value, uint32 cap) internal returns (euint32) {
    euint32 incremented = FHE.add(value, FHE.asEuint32(1));
    ebool belowCap = FHE.lt(value, FHE.asEuint32(cap));
    euint32 result = FHE.select(belowCap, incremented, value);
    FHE.allowThis(result);
    return result;
}
```

---

## 4. Nested Selects: Multi-Way Conditions

For multi-way branching (like switch/case), nest multiple `FHE.select()` calls:

### Example: Tiered Pricing

```solidity
// Price tiers:
// quantity >= 100 -> price = 5
// quantity >= 50  -> price = 8
// quantity >= 10  -> price = 10
// quantity < 10   -> price = 15

function getPrice(euint32 quantity) internal returns (euint32) {
    euint32 price = FHE.asEuint32(15);  // default: < 10

    price = FHE.select(FHE.ge(quantity, FHE.asEuint32(10)), FHE.asEuint32(10), price);
    price = FHE.select(FHE.ge(quantity, FHE.asEuint32(50)), FHE.asEuint32(8), price);
    price = FHE.select(FHE.ge(quantity, FHE.asEuint32(100)), FHE.asEuint32(5), price);

    FHE.allowThis(price);
    return price;
}
```

### Example: Category Assignment

```solidity
// Assign category: 0-25=0, 26-50=1, 51-75=2, 76+=3
function categorize(euint8 score) internal returns (euint8) {
    euint8 cat = FHE.asEuint8(0);
    cat = FHE.select(FHE.gt(score, FHE.asEuint8(25)), FHE.asEuint8(1), cat);
    cat = FHE.select(FHE.gt(score, FHE.asEuint8(50)), FHE.asEuint8(2), cat);
    cat = FHE.select(FHE.gt(score, FHE.asEuint8(75)), FHE.asEuint8(3), cat);
    FHE.allowThis(cat);
    return cat;
}
```

---

## 5. Boolean Logic with Encrypted Conditions

You can combine multiple encrypted conditions:

### Encrypted AND

```solidity
ebool encAnd = FHE.and(condA, condB);
```

### Encrypted OR

```solidity
ebool encOr = FHE.or(condA, condB);
```

### Encrypted NOT

```solidity
ebool encNot = FHE.not(condition);
```

### Complex Condition Example

```solidity
// Transfer allowed if: sender has enough AND recipient is not blacklisted
ebool hasEnough = FHE.ge(_balances[msg.sender], amount);
ebool notBlacklisted = FHE.ne(_status[to], FHE.asEuint8(BLACKLISTED));
ebool canTransfer = FHE.and(hasEnough, notBlacklisted);

_balances[msg.sender] = FHE.select(canTransfer, newSenderBal, _balances[msg.sender]);
_balances[to] = FHE.select(canTransfer, newReceiverBal, _balances[to]);
```

---

## 6. Gas Optimization Tips

### Tip 1: Reuse Encrypted Constants

```solidity
// BAD: Creates a new ciphertext each time
result = FHE.select(cond1, FHE.asEuint32(0), result);
result = FHE.select(cond2, FHE.asEuint32(0), result);

// GOOD: Create once, reuse
euint32 zero = FHE.asEuint32(0);
result = FHE.select(cond1, zero, result);
result = FHE.select(cond2, zero, result);
```

### Tip 2: Use Built-in Min/Max

```solidity
// Use the built-in instead of manual select:
value = FHE.min(value, maxEnc);
```

### Tip 3: Minimize the Number of Selects

Each `FHE.select()` has a gas cost. Restructure logic to use fewer selects when possible.

---

## 7. Practical Example: Encrypted Auction Bid Validation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, ebool, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract BidValidator is ZamaEthereumConfig {
    euint64 private _minBid;
    euint64 private _maxBid;
    euint64 private _currentHighest;

    constructor(uint64 minBid, uint64 maxBid) {
        _minBid = FHE.asEuint64(minBid);
        _maxBid = FHE.asEuint64(maxBid);
        _currentHighest = FHE.asEuint64(0);
        FHE.allowThis(_minBid);
        FHE.allowThis(_maxBid);
        FHE.allowThis(_currentHighest);
    }

    function validateAndSubmitBid(externalEuint64 encBid, bytes calldata inputProof) external {
        euint64 bid = FHE.fromExternal(encBid, inputProof);

        ebool aboveMin = FHE.ge(bid, _minBid);
        ebool belowMax = FHE.le(bid, _maxBid);
        ebool beatsHighest = FHE.gt(bid, _currentHighest);

        ebool valid = FHE.and(aboveMin, FHE.and(belowMax, beatsHighest));

        _currentHighest = FHE.select(valid, bid, _currentHighest);
        FHE.allowThis(_currentHighest);
    }
}
```

---

## 8. Common Mistakes

### Mistake 1: Trying to Use `if` with `ebool`

```solidity
// WRONG
if (FHE.gt(a, b)) { ... }  // Compilation error

// CORRECT
result = FHE.select(FHE.gt(a, b), valueA, valueB);
```

### Mistake 2: Forgetting Both Branches Execute

Both branches are **always** computed. Gas cost is the sum of both.

### Mistake 3: Type Mismatch in Select

```solidity
// WRONG — different types
FHE.select(cond, euint32_val, euint64_val);  // ERROR

// CORRECT — same types
FHE.select(cond, euint32_a, euint32_b);  // OK
```

---

## Summary

| Concept | Details |
|---------|---------|
| **`FHE.select(cond, a, b)`** | Returns `a` if cond is true, `b` if false |
| **Both branches execute** | Gas = cost of both paths combined |
| **Types must match** | `a` and `b` must be the same encrypted type |
| **Nested selects** | Chain for multi-way conditions |
| **Boolean logic** | Use `FHE.and()`, `FHE.or()`, `FHE.not()` to combine conditions |
| **Built-in helpers** | `FHE.min()`, `FHE.max()` use select internally |

**Key principle:** In FHE, you never branch — you always compute all paths and **select** the correct result.
