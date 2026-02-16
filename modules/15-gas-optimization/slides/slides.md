---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 15: Gas Optimization for FHE"
footer: "Zama Developer Program"
---

<style>
section { font-size: 22px; }
h1 { font-size: 32px; }
h2 { font-size: 28px; }
code { font-size: 18px; }
pre { font-size: 16px; line-height: 1.3; }
li { margin-bottom: 2px; }
table { font-size: 18px; }
</style>

# Module 15: Gas Optimization for FHE

Minimize gas costs where every encrypted operation costs 10-100x more than plaintext.

<!--
Speaker notes: Open with the shock factor -- a single FHE addition costs ~90k gas vs ~5 gas for a plaintext addition. That is a 20,000x difference. Optimization is not optional; it is survival.
-->

---

# Learning Objectives

By the end of this module, you will be able to:

1. Understand the FHE gas cost model and reference table
2. Apply **6 optimization strategies** to reduce gas costs 30-70%
3. Use **plaintext operands** to save 15-35% per operation
4. Select the **right-sized types** (euint8 vs euint64)
5. **Profile gas** usage in Hardhat tests
6. Identify and eliminate common FHE gas anti-patterns

<!--
Speaker notes: These six strategies are ordered from easiest to hardest. Strategies 1 and 2 require zero architectural changes and can be applied in minutes. Strategies 5 and 6 require more careful design but offer the biggest payoffs for the right use cases.
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
- UX degrades with slow, expensive transactions

<!--
Speaker notes: Show these numbers side-by-side. Let them sink in. Then ask the class: "How many FHE multiplications can fit in a single block?" Answer: about 150. That is your budget for an entire transaction.
-->

---

# The FHE Gas Cost Table

| Operation | euint8 | euint32 | euint64 | euint256 |
|-----------|--------|---------|---------|----------|
| `FHE.add` (enc+enc) | ~50k | ~90k | ~130k | ~250k |
| `FHE.add` (enc+plain) | ~35k | ~65k | ~95k | ~190k |
| `FHE.mul` (enc*enc) | ~120k | ~200k | ~300k | ~600k |
| `FHE.mul` (enc*plain) | ~80k | ~140k | ~210k | ~430k |
| `FHE.select` | ~45k | ~60k | ~80k | ~150k |
| `FHE.eq` / `FHE.gt` | ~45k | ~60k | ~80k | ~150k |
| `FHE.min` / `FHE.max` | ~90k | ~120k | ~160k | ~300k |
| `FHE.and` / `FHE.or` | ~30k | ~45k | ~60k | ~120k |

Two key patterns: **smaller types are cheaper** and **plaintext operands are cheaper**.

<!--
Speaker notes: Walk through the table row by row. Highlight the two trends: cost grows with type size, and plaintext operands save 25-35%. Multiplication is 2x more expensive than addition at every size. Bitwise operations are the cheapest. These two insights alone can cut gas by 50% in many contracts.
-->

---

# Key Observations from the Cost Table

1. **Multiplication is the most expensive** -- ~2x the cost of addition
2. **Plaintext operands are 25-35% cheaper** than enc+enc variants
3. **Larger types cost more** -- euint8 to euint64 roughly doubles cost
4. **Comparisons are relatively cheap** -- similar cost to addition
5. **Bitwise operations are the cheapest** -- useful for logic with AND/OR/XOR
6. **Type conversions cost gas too** -- avoid unnecessary `FHE.asEuintXX()` casts

<!--
Speaker notes: These observations form the foundation of every optimization strategy. Before writing a single line of optimized code, internalize these cost relationships. The biggest wins come from avoiding expensive operations and using cheaper alternatives.
-->

---

# Strategy 1: Choose the Right Type Size

| Data | Range | Best Type | vs euint64 savings |
|------|-------|-----------|--------------------|
| Age | 0-255 | `euint8` | ~60% |
| Percentage | 0-100 | `euint8` | ~60% |
| Boolean flag | 0 or 1 | `ebool` | ~70% |
| Vote count | 0-65535 | `euint16` | ~45% |
| Token balance | 0-2^32 | `euint32` | ~30% |

```solidity
// BAD: euint64 for age (0-255)
euint64 _age;  // add costs ~130k gas

// GOOD: euint8 for age
euint8 _age;   // add costs ~50k gas -- 62% cheaper!
```

<!--
Speaker notes: This is the lowest-effort optimization. Just change the type declaration. If the data fits in 8 bits, use euint8. Period. Do not use a bigger type when a smaller one is sufficient. But do not artificially truncate data either -- token balances in DeFi often genuinely need euint64.
-->

---

# Strategy 1: Full Example

```solidity
// INEFFICIENT: uses euint64 for age (0-255)
euint64 private _age;

function setAge(uint64 age) external {
    _age = FHE.asEuint64(age);              // ~65k gas
    _age = FHE.add(_age, FHE.asEuint64(1)); // ~130k gas
    // Total: ~195k gas
}

// OPTIMIZED: uses euint8 for age
euint8 private _age;

function setAge(uint8 age) external {
    _age = FHE.asEuint8(age);     // ~30k gas
    _age = FHE.add(_age, 1);      // ~35k gas (plaintext operand!)
    // Total: ~65k gas -- 67% savings!
}
```

<!--
Speaker notes: This example combines two strategies: right-sizing (euint64 to euint8) and plaintext operands (FHE.asEuint64(1) to just 1). Together they save 67%. Each strategy is simple on its own, but they compound.
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

**The Rule:** If the second operand is **not secret**, pass it as plaintext.

Supported: `add`, `sub`, `mul`, `eq`, `ne`, `lt`, `le`, `gt`, `ge`, `min`, `max`, `and`, `or`, `xor`, `shl`, `shr`, `rotl`, `rotr`

`div` already requires a plaintext divisor -- you cannot divide by encrypted values.

<!--
Speaker notes: Emphasize the rule. Every time you write FHE.asEuintXX for a known constant, stop and ask: "Can I just pass the plaintext directly?" The answer is almost always yes. This requires zero architectural changes.
-->

---

# Common Mistake: Double Encryption

```solidity
// BAD: encrypts "1" to increment a counter
euint32 one = FHE.asEuint32(1);
balance = FHE.add(balance, one);

// GOOD: uses plaintext "1"
balance = FHE.add(balance, 1);
```

```solidity
// BAD: encrypts percentage constant every call
function applyPercent(euint32 value) internal returns (euint32) {
    return FHE.div(FHE.mul(value, FHE.asEuint32(pct)), FHE.asEuint32(100));
}

// GOOD: plaintext constants
function applyPercent(euint32 value) internal returns (euint32) {
    return FHE.div(FHE.mul(value, pct), 100);
}
```

The savings seem small per call, but they compound across thousands of calls.

<!--
Speaker notes: Double encryption is the most common FHE gas anti-pattern. It is easy to spot in code review: any call to FHE.asEuintXX with a literal number or a public variable is a candidate for elimination.
-->

---

# Strategy 3: Minimize FHE Operations

```solidity
// INEFFICIENT: 4 FHE ops to compute discounted price
euint32 discountAmt = FHE.mul(price, FHE.asEuint32(10));
euint32 discount = FHE.div(discountAmt, FHE.asEuint32(100));
euint32 finalPrice = FHE.sub(price, discount);

// OPTIMIZED: 2 FHE ops -- pre-compute in plaintext
// 10% discount = multiply by 90, divide by 100
euint32 finalPrice = FHE.div(FHE.mul(price, 90), 100);
```

**Key question:** "Can any of this math happen in plaintext?"

Also watch for **redundant computations** -- compute once, reuse the result:
```solidity
// BAD: computes FHE.ge(age, 18) twice in same function
// GOOD: compute once, store in a local variable
```

<!--
Speaker notes: The key mental model is to push as much computation as possible out of the encrypted domain and into plaintext. Only encrypt what must be secret. Also cache intermediate results within a function to avoid redundant FHE operations.
-->

---

# Strategy 4: Batch Processing

```
Individual transactions:
  tx1: updateA()  ->  21k base + FHE ops
  tx2: updateB()  ->  21k base + FHE ops
  tx3: updateC()  ->  21k base + FHE ops
  Total overhead: 63k gas

Batched transaction:
  tx1: updateAll() ->  21k base + FHE ops
  Total overhead: 21k gas
  Savings: 42k gas from eliminated transaction overhead
```

```solidity
function updateAllBalances(uint32 amtA, uint32 amtB, uint32 amtC) external {
    _balanceA = FHE.add(_balanceA, amtA);
    _balanceB = FHE.add(_balanceB, amtB);
    _balanceC = FHE.add(_balanceC, amtC);
    // ACL for all three...
}
```

<!--
Speaker notes: The savings from batching are modest (42k from eliminated tx overhead) compared to the FHE operation costs themselves. But they add up, and the pattern is trivial to implement. Best for: admin operations, batch minting, multi-parameter updates.
-->

---

# Strategy 5: Cache Intermediate Results

```solidity
// INEFFICIENT: recomputes taxRate every call
function applyTax(uint32 price) external {
    euint32 taxRate = FHE.add(FHE.asEuint32(10), FHE.asEuint32(5));
    _result = FHE.mul(FHE.asEuint32(price), taxRate);
    // 4 FHE ops per call: ~375k gas
}

// OPTIMIZED: compute once, reuse
euint32 private _cachedTaxRate;

function setupTax() external onlyOwner { // called once
    _cachedTaxRate = FHE.add(FHE.asEuint32(10), FHE.asEuint32(5));
    FHE.allowThis(_cachedTaxRate);
    // One-time cost: ~170k gas
}

function applyTax(uint32 price) external {
    _result = FHE.mul(FHE.asEuint32(price), _cachedTaxRate);
    // Per-call cost: ~245k gas (35% savings!)
}
```

<!--
Speaker notes: Caching trades storage cost (SSTORE ~20k) for computation cost. If the cached value is used 3+ times, you break even and start saving. If the value changes every block, do not cache. If it changes rarely, caching is a big win.
-->

---

# The Caching Trade-off

| Scenario | Better Approach |
|----------|-----------------|
| Value recomputed 1-2 times | Recompute (storage cost not worth it) |
| Value recomputed 3+ times | Cache it (amortized savings exceed cost) |
| Value changes every block | Recompute (cache invalidated immediately) |
| Value changes rarely | Cache it (big win) |

Storage costs:
- **New slot (SSTORE):** ~20,000 gas
- **Update existing slot:** ~5,000 gas
- **FHE.add (euint32):** ~90,000 gas

Break-even: if caching saves one FHE op (~90k) for a ~20k storage cost, it pays off in **1 use**.

<!--
Speaker notes: Help students build intuition for when caching is worth it. The rule of thumb: if you save even one FHE operation by caching, the 20k storage cost is already paid for. FHE operations are so expensive that almost any caching strategy pays off quickly.
-->

---

# Strategy 6: Lazy Evaluation

Defer expensive operations until the result is actually needed.

```solidity
// EAGER: computes square on every update
function update(uint32 v) external {
    euint32 enc = FHE.asEuint32(v);
    _result = FHE.mul(enc, enc); // expensive! ~200k gas
}

// LAZY: only stores the base, computes when read
function update(uint32 v) external {
    _base = FHE.asEuint32(v);   // cheap: ~45k gas
    FHE.allowThis(_base);
    _dirty = true;
}

function getResult() external {
    require(_dirty, "Nothing to compute");
    _result = FHE.mul(_base, _base);  // computed once
    _dirty = false;
}
```

If `update()` is called 10 times before `getResult()`: saves **9 multiplications** (~1.8M gas).

<!--
Speaker notes: Lazy evaluation is the most impactful pattern when writes significantly outnumber reads. Common in counters, accumulators, and analytics contracts. The tradeoff: the contract tolerates a "stale" intermediate state between update and compute.
-->

---

# Strategy 7: Replace Select Chains with Min/Max

```solidity
// INEFFICIENT: comparison + select to clamp a value (4 FHE ops)
ebool tooLow = FHE.lt(value, minVal);
euint32 step1 = FHE.select(tooLow, minVal, value);
ebool tooHigh = FHE.gt(step1, maxVal);
euint32 result = FHE.select(tooHigh, maxVal, step1);

// OPTIMIZED: built-in min/max (2 FHE ops)
euint32 result = FHE.min(FHE.max(value, minVal), maxVal);
```

Also: `FHE.select(FHE.gt(a, b), a, b)` is just `FHE.max(a, b)`

Simpler code, fewer operations, same result.

<!--
Speaker notes: This is a code-smell pattern. Whenever you see gt/lt followed by select, check if max/min does the same thing. It often does, and it is always cleaner. Train yourself to recognize this pattern during code review.
-->

---

# Real-World Example: Confidential Transfer

```solidity
// BEFORE: 6 FHE ops, ~405k gas
euint32 encAmount = FHE.asEuint32(amount);         // cast
ebool ok = FHE.ge(balance[sender], encAmount);      // enc vs enc
euint32 newS = FHE.sub(balance[sender], encAmount); // enc - enc
euint32 newR = FHE.add(balance[to], encAmount);     // enc + enc
balance[sender] = FHE.select(ok, newS, balance[sender]);
balance[to]     = FHE.select(ok, newR, balance[to]);

// AFTER: 5 FHE ops, ~295k gas (27% savings)
ebool ok = FHE.ge(balance[sender], amount);  // enc vs plain
euint32 newS = FHE.sub(balance[sender], amount);
euint32 newR = FHE.add(balance[to], amount);
balance[sender] = FHE.select(ok, newS, balance[sender]);
balance[to]     = FHE.select(ok, newR, balance[to]);
```

One change: use plaintext `amount` instead of encrypting it.

<!--
Speaker notes: Walk through the diff line by line. The only change is removing the FHE.asEuint32(amount) cast and passing amount as a plaintext operand. This saves the cast + makes every operation cheaper. 27% savings for a one-line change.
-->

---

# Real-World Example: Optimizing Voting

```solidity
// BEFORE: 9 FHE ops -- encrypts everything
euint32 encWeight = FHE.asEuint32(weight);
euint32 encId = FHE.asEuint32(candidateId);
ebool isEligible = FHE.gt(encWeight, FHE.asEuint32(0));
ebool isValid = FHE.lt(encId, FHE.asEuint32(numCandidates));
ebool canVote = FHE.and(isEligible, isValid);
// ... select and add

// AFTER: 1 FHE op -- plaintext checks where possible
require(candidateId < numCandidates, "Invalid candidate");
require(weight > 0, "Zero weight");
_tallies[candidateId] = FHE.add(_tallies[candidateId], weight);
```

**Key insight:** candidateId and weight were **not secret**. Only the tally is.

<!--
Speaker notes: This is the most dramatic optimization in the module. 9 FHE operations reduced to 1. The lesson: before encrypting any value, ask "Does this actually need to be confidential?" If not, keep it in plaintext and use require for validation.
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

// Compare two implementations
const receipt1 = await (await contract.inefficient(42)).wait();
const receipt2 = await (await contract.optimized(42)).wait();
const savings = receipt1.gasUsed - receipt2.gasUsed;
const pct = (Number(savings) * 100) / Number(receipt1.gasUsed);
console.log(`Savings: ${savings} gas (${pct.toFixed(1)}%)`);
```

Always measure **before and after** optimizing. Set gas budgets to prevent regressions.

<!--
Speaker notes: Emphasize that gas profiling is not a one-time activity. Add gas budget assertions to your CI pipeline so that future changes do not accidentally reintroduce expensive patterns. The GasBenchmark.sol contract in this module provides isolated benchmarks for individual FHE operations.
-->

---

# Common Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| "Encrypt Everything" | Only encrypt values that need confidentiality |
| "One Operation Per Transaction" | Batch related operations |
| "Ignoring Type Sizes" (euint256 for a bool) | Use the smallest type that fits |
| "Recomputing Constants" | Use plaintext operands or cache |
| `gt + select` when `max` suffices | Use built-in `FHE.max` / `FHE.min` |

**The #1 question:** Before encrypting any value, ask:
> *"Does this actually need to be secret?"*

<!--
Speaker notes: Go through each anti-pattern and ask students to identify which strategy fixes it. The "Encrypt Everything" anti-pattern is the most common and the most impactful to fix. The voting contract example showed 89% savings just by moving non-secret checks to plaintext.
-->

---

# Optimization Checklist

- [ ] **Right-sized types?** Smallest type that fits the data?
- [ ] **Plaintext operands?** Is the second operand truly secret?
- [ ] **Minimum operations?** Can any math happen in plaintext?
- [ ] **Batched updates?** Multiple state changes in one transaction?
- [ ] **Cached intermediates?** Recomputed values that could be stored?
- [ ] **Lazy evaluation?** Expensive ops deferred until needed?
- [ ] **Min/max instead of select chains?** Built-in ops simpler?
- [ ] **No unnecessary casts?** `FHE.asEuintXX()` on known constants?
- [ ] **Gas budget tests?** Regression tests for gas consumption?
- [ ] **Profiled?** Measured with `receipt.gasUsed`?

<!--
Speaker notes: This is the checklist students should use when reviewing any FHE contract. Print it, pin it to the wall, refer to it in code reviews. Each item maps to one of the strategies covered in this module.
-->

---

# Exercise Preview

You will receive `InefficientToken.sol` -- a working but wasteful confidential token.

**Your mission:** Apply the patterns from this module to reduce gas by **30%+**.

Key problems to fix:
1. Uses `euint64` for balances capped at 1,000,000 (fits in `euint32`)
2. Encrypts plaintext constants before operations
3. Recomputes fee rate from scratch on every transfer
4. Uses `gt + select` instead of `FHE.max`

Use `receipt.gasUsed` to measure your progress.
Time: 45 minutes

<!--
Speaker notes: Have students work individually or in pairs. After 45 minutes, compare gas measurements as a class. Celebrate the biggest savings. The solution file shows the optimized version with inline gas comments.
-->

---

# Summary

| Pattern | Effort | Typical Savings |
|---------|--------|----------------|
| Right-sized types | Low | 30-60% |
| Plaintext operands | Low | 15-35% |
| Minimize operations | Medium | 20-80% |
| Batch processing | Low | 10-20% |
| Caching | Medium | 25-50% |
| Lazy evaluation | High | 0-90% |

**The #1 rule:** Before encrypting any value, ask: *"Does this actually need to be secret?"*

The biggest gas savings come not from clever tricks, but from realizing that most values do not need encryption.

<!--
Speaker notes: End with the most important lesson. The biggest gas savings come not from clever optimization tricks, but from realizing that most values in a typical contract do not need to be encrypted at all. Encrypt only what must be confidential. Combine multiple strategies for compound savings.
-->
