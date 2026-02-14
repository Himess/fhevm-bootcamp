---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 15: Gas Optimization for FHE"
footer: "Zama Developer Program"
---

# Module 15: Gas Optimization for FHE

Minimize gas costs where every encrypted operation costs 10-100x more than plaintext.

<!--
Speaker notes: Open with the shock factor -- a single FHE addition costs ~90k gas vs ~5 gas for a plaintext addition. That is a 20,000x difference. Optimization is not optional; it is survival.
-->

---

# Why Gas Matters Even More with FHE

| Operation | Plaintext Cost | FHE Cost (euint32) | Factor |
|-----------|---------------|-------------------|--------|
| Addition | ~5 gas | ~90,000 gas | 18,000x |
| Multiplication | ~5 gas | ~200,000 gas | 40,000x |
| Comparison | ~3 gas | ~60,000 gas | 20,000x |

- Block gas limit: **30M gas**
- A function with 300 FHE additions could fill an entire block
- Users pay real ETH for every operation

<!--
Speaker notes: Show these numbers side-by-side. Let them sink in. Then ask the class: "How many FHE multiplications can fit in a single block?" Answer: about 150. That is your budget for an entire transaction.
-->

---

# The FHE Gas Cost Table

| Operation | euint8 | euint32 | euint64 |
|-----------|--------|---------|---------|
| `FHE.add` (enc+enc) | ~50k | ~90k | ~130k |
| `FHE.add` (enc+plain) | ~35k | ~65k | ~95k |
| `FHE.mul` (enc*enc) | ~120k | ~200k | ~300k |
| `FHE.mul` (enc*plain) | ~80k | ~140k | ~210k |
| `FHE.select` | ~45k | ~60k | ~80k |
| `FHE.eq` / `FHE.gt` | ~45k | ~60k | ~80k |
| `FHE.min` / `FHE.max` | ~90k | ~120k | ~160k |

Two key patterns: **smaller types are cheaper** and **plaintext operands are cheaper**.

<!--
Speaker notes: Walk through the table row by row. Highlight the two trends: cost grows with type size, and plaintext operands save 25-35%. These two insights alone can cut gas by 50% in many contracts.
-->

---

# Strategy 1: Choose the Right Type Size

| Data | Range | Best Type | vs euint64 savings |
|------|-------|-----------|--------------------|
| Age | 0-255 | euint8 | ~60% |
| Percentage | 0-100 | euint8 | ~60% |
| Vote count | 0-65535 | euint16 | ~45% |
| Token balance | 0-2^32 | euint32 | ~30% |

```solidity
// BAD: euint64 for age
euint64 _age;  // add costs ~130k

// GOOD: euint8 for age
euint8 _age;   // add costs ~50k -- 62% cheaper!
```

<!--
Speaker notes: This is the lowest-effort optimization. Just change the type declaration. If the data fits in 8 bits, use euint8. Period.
-->

---

# Strategy 2: Use Plaintext Operands

```solidity
// INEFFICIENT: encrypts a known constant
euint32 ten = FHE.asEuint32(10);        // ~45k gas
euint32 result = FHE.add(enc, ten);      // ~90k gas
// Total: ~135k

// OPTIMIZED: plaintext second operand
euint32 result = FHE.add(enc, 10);       // ~65k gas
// Total: ~65k -- 52% cheaper!
```

**Rule:** If the second operand is not secret, pass it as plaintext.

Applies to: `add`, `sub`, `mul`, `eq`, `ne`, `lt`, `le`, `gt`, `ge`, `min`, `max`, `and`, `or`, `xor`, `shl`, `shr`, `rotl`, `rotr`

<!--
Speaker notes: Emphasize the rule. Every time you write FHE.asEuintXX for a known constant, stop and ask: "Can I just pass the plaintext directly?" The answer is almost always yes.
-->

---

# Strategy 3: Minimize Operations

```solidity
// INEFFICIENT: 4 FHE ops to compute discounted price
euint32 discountAmt = FHE.mul(price, FHE.asEuint32(10));
euint32 discount = FHE.div(discountAmt, FHE.asEuint32(100));
euint32 finalPrice = FHE.sub(price, discount);

// OPTIMIZED: 2 FHE ops -- pre-compute in plaintext
// 10% discount = multiply by 90, divide by 100
euint32 finalPrice = FHE.div(FHE.mul(price, 90), 100);
```

Ask yourself: **"Can any of this math happen in plaintext?"**

<!--
Speaker notes: The key mental model is to push as much computation as possible out of the encrypted domain and into plaintext. Only encrypt what must be secret.
-->

---

# Strategy 4: Batch Processing

```
Individual transactions:
  tx1: updateA()  →  21k base + FHE ops
  tx2: updateB()  →  21k base + FHE ops
  tx3: updateC()  →  21k base + FHE ops
  Total overhead: 63k gas

Batched transaction:
  tx1: updateAll() →  21k base + FHE ops
  Total overhead: 21k gas
  Savings: 42k gas
```

Combine multiple state updates into a single function when possible.

<!--
Speaker notes: The savings from batching are modest (42k from eliminated tx overhead) compared to the FHE operation costs themselves. But they add up, and the pattern is trivial to implement.
-->

---

# Strategy 5: Cache Intermediate Results

```solidity
// INEFFICIENT: recomputes taxRate every call
function applyTax(uint32 price) external {
    euint32 taxRate = FHE.add(FHE.asEuint32(10), FHE.asEuint32(5));
    _result = FHE.mul(FHE.asEuint32(price), taxRate);
    // 4 FHE ops per call
}

// OPTIMIZED: compute once, reuse
euint32 private _cachedTaxRate;

function setupTax() external { // called once
    _cachedTaxRate = FHE.add(FHE.asEuint32(10), FHE.asEuint32(5));
}

function applyTax(uint32 price) external {
    _result = FHE.mul(FHE.asEuint32(price), _cachedTaxRate);
    // 2 FHE ops per call -- 50% fewer!
}
```

<!--
Speaker notes: Caching trades storage cost (SSTORE ~20k) for computation cost. If the cached value is used 3+ times, you break even and start saving.
-->

---

# Strategy 6: Lazy Evaluation

Defer expensive operations until the result is actually needed.

```solidity
// EAGER: computes square on every update
function update(uint32 v) external {
    euint32 enc = FHE.asEuint32(v);
    _result = FHE.mul(enc, enc); // expensive!
}

// LAZY: only stores the base, computes when read
function update(uint32 v) external {
    _base = FHE.asEuint32(v); // cheap
    _dirty = true;
}

function getResult() external {
    if (_dirty) {
        _result = FHE.mul(_base, _base); // computed once
        _dirty = false;
    }
}
```

If `update()` is called 10 times before `getResult()`: saves **9 multiplications** (~1.8M gas).

<!--
Speaker notes: Lazy evaluation is the most impactful pattern when writes significantly outnumber reads. Common in counters, accumulators, and analytics contracts.
-->

---

# Strategy 7: Replace Select Chains with Min/Max

```solidity
// INEFFICIENT: comparison + select to clamp
ebool tooLow = FHE.lt(value, minVal);
euint32 step1 = FHE.select(tooLow, minVal, value);
ebool tooHigh = FHE.gt(step1, maxVal);
euint32 result = FHE.select(tooHigh, maxVal, step1);
// 4 FHE ops

// OPTIMIZED: built-in min/max
euint32 result = FHE.min(FHE.max(value, minVal), maxVal);
// 2 FHE ops -- cleaner and equivalent
```

Also: `FHE.select(FHE.gt(a, b), a, b)` is just `FHE.max(a, b)`

<!--
Speaker notes: This is a code-smell pattern. Whenever you see gt/lt followed by select, check if max/min does the same thing. It often does, and it is always cleaner.
-->

---

# Real-World Example: Confidential Transfer

```solidity
// BEFORE: 6 FHE ops, ~405k gas
euint32 encAmount = FHE.asEuint32(amount);
ebool ok = FHE.ge(balance[sender], encAmount);
euint32 newS = FHE.sub(balance[sender], encAmount);
euint32 newR = FHE.add(balance[to], encAmount);
balance[sender] = FHE.select(ok, newS, balance[sender]);
balance[to]     = FHE.select(ok, newR, balance[to]);

// AFTER: 5 FHE ops, ~295k gas (27% savings)
ebool ok = FHE.ge(balance[sender], amount);  // plaintext!
euint32 newS = FHE.sub(balance[sender], amount);
euint32 newR = FHE.add(balance[to], amount);
balance[sender] = FHE.select(ok, newS, balance[sender]);
balance[to]     = FHE.select(ok, newR, balance[to]);
```

One change: use plaintext `amount` instead of encrypting it first.

<!--
Speaker notes: Walk through the diff line by line. The only change is removing the FHE.asEuint32(amount) cast and passing amount as a plaintext operand. This saves the cast + makes every operation cheaper. 27% savings for a one-line change.
-->

---

# Gas Profiling in Tests

```typescript
it("should measure gas", async function () {
  const tx = await contract.transfer(to, 100);
  const receipt = await tx.wait();
  console.log(`Gas: ${receipt.gasUsed}`);

  // Set a gas budget as a regression test
  expect(receipt.gasUsed).to.be.lessThan(500_000n);
});
```

Always measure before and after optimizing. Set gas budgets to prevent regressions.

<!--
Speaker notes: Emphasize that gas profiling is not a one-time activity. Add gas budget assertions to your CI pipeline so that future changes do not accidentally reintroduce expensive patterns.
-->

---

# Optimization Checklist

- [ ] Right-sized types? (euint8 vs euint64)
- [ ] Plaintext operands where possible?
- [ ] Minimum number of FHE operations?
- [ ] Batched state updates?
- [ ] Cached intermediate results?
- [ ] Lazy evaluation for expensive ops?
- [ ] Min/max instead of select chains?
- [ ] No unnecessary type casts?
- [ ] Gas budget tests in place?

<!--
Speaker notes: This is the checklist students should use when reviewing any FHE contract. Print it, pin it to the wall, refer to it in code reviews.
-->

---

# Exercise: Optimize the Inefficient Token

You will receive `InefficientToken.sol` -- a working but wasteful confidential token.

**Your mission:** Apply the patterns from this module to reduce gas by 30%+.

Key problems to fix:
1. Uses `euint64` for balances capped at 1,000,000 (fits in euint32)
2. Encrypts plaintext constants before operations
3. Recomputes fee rate from scratch on every transfer
4. Uses `gt + select` instead of `FHE.max`

Time: 45 minutes

<!--
Speaker notes: Have students work individually or in pairs. After 45 minutes, compare gas measurements as a class. Celebrate the biggest savings.
-->

---

# Summary

| Pattern | Effort | Impact |
|---------|--------|--------|
| Right-sized types | Low | 30-60% |
| Plaintext operands | Low | 15-35% |
| Minimize operations | Medium | 20-80% |
| Batch processing | Low | 10-20% |
| Caching | Medium | 25-50% |
| Lazy evaluation | High | 0-90% |

**The #1 rule:** Before encrypting any value, ask: *"Does this actually need to be secret?"*

<!--
Speaker notes: End with the most important lesson. The biggest gas savings come not from clever optimization tricks, but from realizing that most values in a typical contract do not need to be encrypted at all. Encrypt only what must be confidential.
-->
