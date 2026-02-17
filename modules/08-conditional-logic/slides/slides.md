---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 08: Conditional Logic"
footer: "Zama Developer Program"
---

<style>
section { font-size: 18px; overflow: hidden; color: #1E293B; }
h1 { font-size: 28px; margin-bottom: 8px; color: #1E40AF; border-bottom: 2px solid #DBEAFE; padding-bottom: 6px; }
h2 { font-size: 22px; margin-bottom: 6px; color: #155E75; }
h3 { font-size: 19px; color: #92400E; }
code { font-size: 15px; background: #F1F5F9; color: #3730A3; padding: 1px 4px; border-radius: 3px; }
pre { font-size: 13px; line-height: 1.25; margin: 6px 0; background: #1E293B; color: #E2E8F0; border-radius: 6px; padding: 10px; border-left: 3px solid #6366F1; }
pre code { background: transparent; color: #E2E8F0; padding: 0; }
li { margin-bottom: 1px; line-height: 1.4; }
table { font-size: 15px; border-collapse: collapse; width: 100%; }
th { background: #1E40AF; color: white; padding: 6px 10px; text-align: left; }
td { padding: 5px 10px; border-bottom: 1px solid #E2E8F0; }
tr:nth-child(even) { background: #F8FAFC; }
p { margin-bottom: 4px; }
ul, ol { margin-top: 4px; margin-bottom: 4px; }
header { color: #3B82F6 !important; }
footer { color: #94A3B8 !important; }
section.small { font-size: 15px; }
section.small h1 { font-size: 24px; margin-bottom: 6px; }
section.small ol li { margin-bottom: 0; line-height: 1.3; }
</style>

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

<!--
Speaker notes: Start with this broken code example to establish the problem. The EVM's if statement requires a plaintext true/false, but ebool is a ciphertext. Ask students: "How would you solve this?" Then reveal FHE.select() on the next slide.
-->

---

# Comparison Operators

All return `ebool` (encrypted boolean):

| Operator | Meaning |
|----------|---------|
| `FHE.eq(a, b)` | a == b |
| `FHE.ne(a, b)` | a != b |
| `FHE.lt(a, b)` | a < b |
| `FHE.le(a, b)` | a <= b |
| `FHE.gt(a, b)` | a > b |
| `FHE.ge(a, b)` | a >= b |

`euint256` and `eaddress`: only `eq` / `ne`

<!--
Speaker notes: Quick review of comparison operators from Module 04. The key limitation to highlight: euint256 and eaddress only support equality checks, not ordering. This means you cannot do greater-than or less-than on encrypted addresses or 256-bit values.
-->

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

<!--
Speaker notes: FHE.select() is the single most important function in FHEVM after the arithmetic operations. It is the encrypted ternary operator. Both branches are always computed, and the correct one is selected based on the encrypted condition. Nobody learns which branch was taken.
-->

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

<!--
Speaker notes: Walk through this example step by step. First, FHE.ge compares balance and amount. Then FHE.sub computes the new balance. Finally, FHE.select picks the correct result. The subtraction always runs even if balance is less than amount -- the wrapping result is just discarded by select.
-->

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

<!--
Speaker notes: This safe subtraction pattern is a reusable building block. Have students write this function from memory. It appears in every token transfer, every withdrawal, and every function that subtracts encrypted values. Consider making it a library function.
-->

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

<!--
Speaker notes: The clamp pattern is useful for bounding values to a valid range. Note that FHE.min and FHE.max are built-in and more gas-efficient than writing your own select-based version. Use them whenever possible.
-->

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

<!--
Speaker notes: This is the exact pattern used in confidential ERC-20 transfers. Both the sender and receiver balances are updated using select with the same condition. If the transfer fails, BOTH balances stay the same -- no information leaks about whether it succeeded or failed.
-->

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

<!--
Speaker notes: Nested selects simulate if/else-if/else chains. The order matters -- evaluate from least specific to most specific (or vice versa) to get correct logic. Each select overrides the previous result if the condition is true. This is the FHEVM equivalent of a switch statement.
-->

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

<!--
Speaker notes: Boolean logic on ebool values uses FHE.and, FHE.or, and FHE.not -- the same operations from Module 04. These let you build complex conditions before passing them to FHE.select. The canTransfer example combines a balance check with a status check in one condition.
-->

---

# Key Rule: Both Branches Always Execute

```solidity
euint32 expensive = FHE.mul(x, y);  // ALWAYS runs
euint32 cheap     = FHE.add(x, y);  // ALWAYS runs

result = FHE.select(cond, expensive, cheap);
```

Gas cost = **sum of both branches**, not just the taken one.

<!--
Speaker notes: This is the most important gas implication of FHE conditional logic. Unlike regular if/else where only one branch executes, BOTH branches always run in FHE. This means if one branch has an expensive multiplication, you pay for it even if the condition is false. Design accordingly.
-->

---

# Gas Optimization Tips

1. **Reuse constants** -- Create `FHE.asEuint32(0)` once, not in every select
2. **Use built-in min/max** -- More efficient than manual select
3. **Minimize select chains** -- Restructure logic to reduce selects
4. **Smaller types** -- `euint8` selects cost less than `euint256`

<!--
Speaker notes: Practical optimization tips: create zero constants once and reuse them, use built-in min/max instead of manual select, and keep select chains as short as possible. Every select is a full FHE operation with significant gas cost.
-->

---

# Common Mistakes

| Mistake | Fix |
|---------|-----|
| `if (ebool)` | Use `FHE.select()` |
| Type mismatch in select | Both values same type |
| Assuming one branch runs | Both always execute |
| Forgetting `FHE.allowThis()` | Call after select stored |

<!--
Speaker notes: The if(ebool) mistake is the most common one -- students instinctively write if statements. Remind them: if you see ebool, use FHE.select. Also note the type mismatch issue: both values in a select must be the same encrypted type.
-->

---

# Summary

- **`FHE.select(cond, a, b)`** = encrypted ternary
- Both branches **always execute** (gas = both paths)
- Types of `a` and `b` must **match**
- **Nested selects** for multi-way logic
- Combine conditions: `FHE.and()`, `FHE.or()`, `FHE.not()`
- Built-in `FHE.min()` / `FHE.max()` for clamping

<!--
Speaker notes: FHE.select is the backbone of all FHEVM control flow. With types (Module 03), operations (Module 04), ACL (Module 05), inputs (Module 06), decryption (Module 07), and now conditional logic (Module 08), students have the complete toolkit for any FHEVM application.
-->

---

# Next Up

**Module 09: On-Chain Randomness**

Generate encrypted random numbers with `FHE.randEuintXX()`.

<!--
Speaker notes: Transition to Module 09 by asking: "What if you need a value that nobody knows -- not even the person creating it?" Randomness is the last core concept before we move to project modules.
-->
