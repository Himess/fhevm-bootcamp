---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 08: Conditional Logic"
footer: "Zama Developer Program"
---

# Module 08: Conditional Logic

Branch-free programming with `FHE.select()`.

---

# The Problem: No `if` with Encrypted Data

```solidity
ebool hasEnough = FHE.ge(balance, amount);

// THIS DOES NOT WORK
if (hasEnough) {
    balance = FHE.sub(balance, amount);
}
```

The EVM needs a **plaintext** `bool` for `if`.
An `ebool` is **encrypted** -- the EVM cannot read it.

---

# The Solution: `FHE.select()`

```solidity
FHE.select(condition, valueIfTrue, valueIfFalse)
```

The encrypted equivalent of:
```
condition ? valueIfTrue : valueIfFalse
```

Both branches are **always computed**.
The correct result is selected without revealing the condition.

---

# Basic Example

```solidity
ebool hasEnough = FHE.ge(balance, amount);

euint64 newBalance = FHE.sub(balance, amount);

balance = FHE.select(
    hasEnough,    // encrypted condition
    newBalance,   // if true: deducted balance
    balance       // if false: unchanged balance
);
```

Nobody (not even the EVM) knows which branch was taken.

---

# Pattern: Safe Subtraction

```solidity
function safeSub(euint32 a, euint32 b)
    internal returns (euint32)
{
    ebool canSub = FHE.ge(a, b);
    euint32 diff = FHE.sub(a, b);
    euint32 zero = FHE.asEuint32(0);
    return FHE.select(canSub, diff, zero);
}
```

If `a >= b`: return `a - b`
If `a < b`: return `0` (no underflow)

---

# Pattern: Clamp

```solidity
function clamp(euint32 value, uint32 lo, uint32 hi)
    internal returns (euint32)
{
    euint32 result = FHE.max(value, FHE.asEuint32(lo));
    result = FHE.min(result, FHE.asEuint32(hi));
    return result;
}
```

`FHE.min()` and `FHE.max()` use `FHE.select()` internally.

---

# Pattern: Conditional Transfer

```solidity
ebool ok = FHE.ge(_balances[from], amt);

euint64 newFrom = FHE.sub(_balances[from], amt);
euint64 newTo   = FHE.add(_balances[to], amt);

_balances[from] = FHE.select(ok, newFrom, _balances[from]);
_balances[to]   = FHE.select(ok, newTo, _balances[to]);
```

If insufficient funds: both balances remain unchanged.

---

# Nested Selects: Multi-Way Logic

```solidity
// Tiered pricing:
// qty >= 100: 5 | qty >= 50: 8 | qty >= 10: 10 | else: 15

euint32 price = FHE.asEuint32(15);  // default

price = FHE.select(
    FHE.ge(qty, FHE.asEuint32(10)),
    FHE.asEuint32(10), price);
price = FHE.select(
    FHE.ge(qty, FHE.asEuint32(50)),
    FHE.asEuint32(8), price);
price = FHE.select(
    FHE.ge(qty, FHE.asEuint32(100)),
    FHE.asEuint32(5), price);
```

---

# Combining Conditions

```solidity
// AND: both must be true
ebool both = FHE.and(condA, condB);

// OR: at least one true
ebool either = FHE.or(condA, condB);

// NOT: invert
ebool negated = FHE.not(condA);

// Complex condition
ebool canTransfer = FHE.and(
    FHE.ge(balance, amount),
    FHE.ne(status, FHE.asEuint8(BLOCKED))
);
```

---

# Key Rule: Both Branches Always Execute

```solidity
euint32 expensive = FHE.mul(x, y);  // ALWAYS runs
euint32 cheap     = FHE.add(x, y);  // ALWAYS runs

result = FHE.select(cond, expensive, cheap);
```

Gas cost = **sum of both branches**, not just the taken one.

---

# Gas Optimization Tips

1. **Reuse constants** -- Create `FHE.asEuint32(0)` once, not in every select
2. **Use built-in min/max** -- More efficient than manual select
3. **Minimize select chains** -- Restructure logic to reduce selects
4. **Smaller types** -- `euint8` selects cost less than `euint256`

---

# Common Mistakes

| Mistake | Fix |
|---------|-----|
| `if (ebool)` | Use `FHE.select()` |
| Type mismatch in select | Both values same type |
| Assuming one branch runs | Both always execute |
| Forgetting `FHE.allowThis()` | Call after select stored |

---

# Summary

- **`FHE.select(cond, a, b)`** = encrypted ternary
- Both branches **always execute** (gas = both paths)
- Types of `a` and `b` must **match**
- **Nested selects** for multi-way logic
- Combine conditions: `FHE.and()`, `FHE.or()`, `FHE.not()`
- Built-in `FHE.min()` / `FHE.max()` for clamping

---

# Next Up

**Module 09: On-Chain Randomness**

Generate encrypted random numbers with `FHE.randEuintXX()`.
