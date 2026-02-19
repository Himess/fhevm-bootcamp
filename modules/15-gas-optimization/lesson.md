# Module 15: Gas Optimization for FHE -- Lesson

**Duration:** 3 hours
**Prerequisites:** Module 14
**Learning Objectives:**
- Optimize FHE gas costs through type selection and plaintext operands
- Implement batch processing patterns
- Profile and benchmark encrypted operations

## Introduction: Why Gas Matters Even More with FHE

Every Solidity developer knows that gas optimization matters. But when you work with Fully Homomorphic Encryption on fhEVM, gas optimization is not a "nice to have" -- it is a survival skill.

Here is the core problem: a simple plaintext addition (`uint256 a + b`) costs roughly **3-5 gas**. An encrypted addition (`FHE.add(euint32, euint32)`) costs approximately **90,000 gas**. That is a factor of roughly **20,000x** more expensive. Multiply that across a realistic contract with dozens of operations, and you can hit the block gas limit with a single function call.

This has real consequences:

- **Users pay real money.** On mainnet, a single FHE-heavy transaction could cost tens or hundreds of dollars in gas fees.
- **Block gas limits are finite.** A block on Ethereum has a 30M gas limit. A contract with 300+ FHE operations in one function may simply be impossible to execute.
- **UX degrades.** Slow, expensive transactions drive users away from your dApp.

The good news: there are concrete, repeatable patterns that can reduce your FHE gas costs by 30-70% without changing the logic of your contract. This module teaches every one of them.

---

## 1. The FHE Gas Cost Model

Before you can optimize, you need to understand what things cost. The table below shows approximate gas costs for common FHE operations across all encrypted integer types. These values are representative of the fhEVM coprocessor model and may vary slightly across versions.

### Complete Gas Cost Table

| Operation | euint8 | euint16 | euint32 | euint64 | euint128 | euint256 |
|-----------|--------|---------|---------|---------|----------|----------|
| `FHE.add` (enc+enc) | ~50k | ~65k | ~90k | ~130k | ~180k | ~250k |
| `FHE.add` (enc+plain) | ~35k | ~45k | ~65k | ~95k | ~135k | ~190k |
| `FHE.sub` (enc-enc) | ~50k | ~65k | ~90k | ~130k | ~180k | ~250k |
| `FHE.mul` (enc*enc) | ~120k | ~150k | ~200k | ~300k | ~450k | ~600k |
| `FHE.mul` (enc*plain) | ~80k | ~100k | ~140k | ~210k | ~320k | ~430k |
| `FHE.div` (enc/plain) | ~50k | ~65k | ~90k | ~130k | ~180k | ~250k |
| `FHE.rem` (enc%plain) | ~50k | ~65k | ~90k | ~130k | ~180k | ~250k |
| `FHE.select` | ~45k | ~50k | ~60k | ~80k | ~110k | ~150k |
| `FHE.eq` | ~45k | ~50k | ~60k | ~80k | ~110k | ~150k |
| `FHE.ne` | ~45k | ~50k | ~60k | ~80k | ~110k | ~150k |
| `FHE.gt` / `FHE.lt` | ~45k | ~50k | ~60k | ~80k | ~110k | ~150k |
| `FHE.ge` / `FHE.le` | ~45k | ~50k | ~60k | ~80k | ~110k | ~150k |
| `FHE.min` / `FHE.max` | ~90k | ~100k | ~120k | ~160k | ~220k | ~300k |
| `FHE.and` / `FHE.or` | ~30k | ~35k | ~45k | ~60k | ~85k | ~120k |
| `FHE.xor` | ~30k | ~35k | ~45k | ~60k | ~85k | ~120k |
| `FHE.not` | ~25k | ~30k | ~40k | ~55k | ~75k | ~110k |
| `FHE.neg` | ~45k | ~55k | ~75k | ~110k | ~155k | ~215k |
| `FHE.shl` / `FHE.shr` | ~90k | ~100k | ~120k | ~160k | ~220k | ~300k |
| `FHE.rotl` / `FHE.rotr` | ~90k | ~100k | ~120k | ~160k | ~220k | ~300k |
| `FHE.randEuintXX` | ~70k | ~90k | ~120k | ~170k | ~230k | ~310k |
| `FHE.asEuintXX` (cast) | ~30k | ~35k | ~45k | ~65k | ~90k | ~125k |

### Key Observations

1. **Multiplication is the most expensive arithmetic operation** -- roughly 2x the cost of addition at every type size.
2. **Plaintext operands are 25-35% cheaper** than encrypted-encrypted variants.
3. **Larger types cost more** -- going from euint8 to euint64 roughly doubles or triples the cost for most operations.
4. **Comparisons are relatively cheap** -- similar cost to addition.
5. **Bitwise operations are the cheapest** -- useful when you can express logic with AND/OR/XOR.
6. **Random number generation scales with type size** -- generating a random euint256 is ~4x more expensive than euint8.

### The Cost of Type Conversion

Converting between types with `FHE.asEuintXX()` itself costs gas. If you are frequently upcasting from euint8 to euint32 within a function, those casts add up. Design your types at the contract level to avoid unnecessary conversions.

---

## 2. Optimization Strategy 1: Choose the Right Type Size

This is the simplest and often the most impactful optimization. If a value is guaranteed to fit in 8 bits, use `euint8` instead of `euint32` or `euint64`.

### Examples of Right-Sized Types

| Data | Range | Best Type |
|------|-------|-----------|
| Age | 0 -- 255 | `euint8` |
| Percentage | 0 -- 100 | `euint8` |
| Year | 2000 -- 2100 | `euint16` |
| Token balance | 0 -- 2^64 | `euint64` |
| Vote count (small DAO) | 0 -- 65535 | `euint16` |
| Boolean flag | 0 or 1 | `ebool` |

### Code Example

```solidity
// INEFFICIENT: uses euint64 for age (0-255)
euint64 private _age;

function setAge(uint64 age) external {
    _age = FHE.asEuint64(age);           // ~65k gas for cast
    _age = FHE.add(_age, FHE.asEuint64(1)); // ~130k gas for add
    // Total: ~195k gas
}

// OPTIMIZED: uses euint8 for age
euint8 private _age;

function setAge(uint8 age) external {
    _age = FHE.asEuint8(age);            // ~30k gas for cast
    _age = FHE.add(_age, 1);             // ~35k gas for add (plaintext!)
    // Total: ~65k gas -- 67% savings!
}
```

### When You Cannot Use Small Types

Sometimes you need the range. Token balances in DeFi often require `euint64` or even `euint128`. That is fine -- do not artificially truncate data. The point is: do not use a bigger type when a smaller one is sufficient.

---

## 3. Optimization Strategy 2: Use Plaintext Operands

When one of the two operands in an FHE operation is a known constant or a value that does not need to be secret, pass it as a plaintext. The FHE coprocessor can optimize the circuit when it knows one operand is in the clear.

### The Rule

If the second operand is **not secret**, always pass it as a plaintext:

```solidity
// INEFFICIENT: encrypts a known constant, then adds
euint32 enc = FHE.asEuint32(value);
euint32 ten = FHE.asEuint32(10);     // unnecessary encryption
euint32 result = FHE.add(enc, ten);   // enc+enc: ~90k gas
// Total: ~135k gas (45k cast + 90k add)

// OPTIMIZED: plaintext second operand
euint32 enc = FHE.asEuint32(value);
euint32 result = FHE.add(enc, 10);    // enc+plain: ~65k gas
// Total: ~110k gas (45k cast + 65k add) -- 19% savings on this pair alone
```

### Which Operations Support Plaintext Operands?

All of the following accept a plaintext as the second (right-hand) operand:

- Arithmetic: `add`, `sub`, `mul`, `rem`
- Comparison: `eq`, `ne`, `lt`, `le`, `gt`, `ge`
- Min/Max: `min`, `max`
- Bitwise: `and`, `or`, `xor`
- Shift/Rotate: `shl`, `shr`, `rotl`, `rotr`

**Division** (`div`) already requires a plaintext divisor -- you cannot divide by an encrypted value.

### Common Mistake: Double Encryption

A frequent pattern we see in beginner code:

```solidity
// BAD: encrypts "1" to increment
euint32 one = FHE.asEuint32(1);
balance = FHE.add(balance, one);

// GOOD: uses plaintext "1"
balance = FHE.add(balance, 1);
```

The savings seem small per call, but in a loop or a contract called thousands of times, they compound.

---

## 4. Optimization Strategy 3: Minimize the Number of FHE Operations

Every FHE operation has a significant fixed cost. Reducing the total number of operations is often more impactful than optimizing individual ones.

### Combine Conditions

Instead of evaluating two conditions with separate comparisons and selects, combine them:

```solidity
// INEFFICIENT: 2 comparisons + 2 selects = 4 FHE ops
ebool tooLow = FHE.lt(enc, minVal);
euint32 step1 = FHE.select(tooLow, minVal, enc);
ebool tooHigh = FHE.gt(step1, maxVal);
euint32 result = FHE.select(tooHigh, maxVal, step1);
// 4 FHE ops: lt (~60k) + select (~60k) + gt (~60k) + select (~60k) = ~240k

// OPTIMIZED: 2 built-in ops
euint32 result = FHE.min(FHE.max(enc, minVal), maxVal);
// 2 FHE ops: max (~120k) + min (~120k) = ~240k
// Same gas in this case, but simpler code and fewer storage writes
```

### Pre-compute in Plaintext

Anything that can be computed in plaintext should be computed in plaintext:

```solidity
// INEFFICIENT: computes discount in encrypted space
euint32 price = FHE.asEuint32(100);
euint32 discountRate = FHE.asEuint32(10);
euint32 discountAmount = FHE.mul(price, discountRate);
euint32 finalPrice = FHE.sub(price, FHE.div(discountAmount, 100));
// 4 FHE ops!

// OPTIMIZED: apply 10% discount = multiply by 90/100
euint32 price = FHE.asEuint32(100);
euint32 finalPrice = FHE.mul(price, 90);
finalPrice = FHE.div(finalPrice, 100);
// 2 FHE ops -- 50% fewer operations
```

### Avoid Redundant Work

Watch for patterns where you compute the same encrypted value multiple times:

```solidity
// INEFFICIENT: computes isEligible twice
function checkAndProcess(euint32 age) internal {
    ebool isAdult = FHE.ge(age, 18);
    // ... some logic using isAdult ...

    // Later in the same function:
    ebool isAdultAgain = FHE.ge(age, 18); // redundant!
}

// OPTIMIZED: compute once, reuse
function checkAndProcess(euint32 age) internal {
    ebool isAdult = FHE.ge(age, 18);
    // ... use isAdult everywhere it is needed ...
}
```

---

## 5. Optimization Strategy 4: Batch Processing

In traditional Solidity, individual transactions are cheap enough that making three separate calls is often fine. With FHE, each transaction has a base overhead (21,000 gas for the transaction itself, plus contract call overhead). Batching multiple updates into a single transaction amortizes this overhead.

### Example: Updating Multiple Balances

```solidity
// INEFFICIENT: three separate transactions
function updateBalanceA(uint32 amount) external {
    _balanceA = FHE.add(_balanceA, amount);
    FHE.allowThis(_balanceA);
    FHE.allow(_balanceA, msg.sender);
}

function updateBalanceB(uint32 amount) external {
    _balanceB = FHE.add(_balanceB, amount);
    FHE.allowThis(_balanceB);
    FHE.allow(_balanceB, msg.sender);
}

function updateBalanceC(uint32 amount) external {
    _balanceC = FHE.add(_balanceC, amount);
    FHE.allowThis(_balanceC);
    FHE.allow(_balanceC, msg.sender);
}
// 3 transactions: 3 x 21k base + 3 x FHE ops + 3 x SSTORE

// OPTIMIZED: one batched transaction
function updateAllBalances(uint32 amtA, uint32 amtB, uint32 amtC) external {
    _balanceA = FHE.add(_balanceA, amtA);
    _balanceB = FHE.add(_balanceB, amtB);
    _balanceC = FHE.add(_balanceC, amtC);
    FHE.allowThis(_balanceA);
    FHE.allowThis(_balanceB);
    FHE.allowThis(_balanceC);
    FHE.allow(_balanceA, msg.sender);
    FHE.allow(_balanceB, msg.sender);
    FHE.allow(_balanceC, msg.sender);
}
// 1 transaction: 1 x 21k base + 3 x FHE ops + 3 x SSTORE
// Saves ~42k gas from avoided transaction overhead
```

### When Batching Helps Most

- Contracts with multiple state updates per user action (e.g., updating balances, counters, and timestamps)
- Admin operations that configure multiple parameters
- Batch minting or transferring tokens

### When Batching Does NOT Help

- If the batch function hits the block gas limit, it defeats the purpose
- If individual operations need to be independently authorized

---

## 6. Optimization Strategy 5: Caching and Storage Trade-offs

If an encrypted value is computed from other encrypted values, and those source values do not change often, **cache the result** instead of recomputing it every time.

### Example: Tax Rate Calculation

```solidity
// INEFFICIENT: recomputes tax rate from components every call
function applyTax(uint32 price) external {
    euint32 baseTax   = FHE.asEuint32(10);
    euint32 surcharge = FHE.asEuint32(5);
    euint32 taxRate   = FHE.add(baseTax, surcharge); // recomputed!
    euint32 encPrice  = FHE.asEuint32(price);
    _result = FHE.mul(encPrice, taxRate);
    // 4 FHE ops: 2 casts + 1 add + 1 mul = ~375k gas
}

// OPTIMIZED: cache the tax rate, computed once
euint32 private _cachedTaxRate;

function setupTaxRate() external onlyOwner {
    euint32 baseTax   = FHE.asEuint32(10);
    euint32 surcharge = FHE.asEuint32(5);
    _cachedTaxRate = FHE.add(baseTax, surcharge);
    FHE.allowThis(_cachedTaxRate);
    // One-time cost: ~170k gas
}

function applyTax(uint32 price) external {
    euint32 encPrice = FHE.asEuint32(price);
    _result = FHE.mul(encPrice, _cachedTaxRate);
    // Per-call cost: 1 cast + 1 mul = ~245k gas (35% savings per call!)
}
```

### The Storage Trade-off

Storing an encrypted value in a state variable (`SSTORE`) costs gas too -- roughly 20,000 gas for a new slot, 5,000 for an update. So the trade-off is:

| Scenario | Better Approach |
|----------|-----------------|
| Value recomputed 1-2 times | Recompute (storage cost not worth it) |
| Value recomputed 3+ times | Cache it (amortized savings exceed storage cost) |
| Value changes every block | Recompute (cache invalidated immediately) |
| Value changes rarely | Cache it (big win) |

---

## 7. Optimization Strategy 6: Lazy Evaluation

Lazy evaluation means deferring an expensive computation until its result is actually needed. If the result may never be needed (e.g., the user might overwrite it first), you save the cost entirely.

### Example: Deferred Squaring

```solidity
// INEFFICIENT: computes square immediately on every update
function updateValue(uint32 value) external {
    euint32 enc = FHE.asEuint32(value);
    euint32 squared = FHE.mul(enc, enc);    // expensive!
    _result = FHE.add(squared, 1);
    // 3 FHE ops every call
}

// OPTIMIZED: stores the base value, defers the expensive part
euint32 private _base;
bool private _dirty;

function updateValue(uint32 value) external {
    _base = FHE.asEuint32(value);
    FHE.allowThis(_base);
    _dirty = true;
    // 1 FHE op -- defers the mul
}

function computeResult() external {
    require(_dirty, "Nothing to compute");
    euint32 squared = FHE.mul(_base, _base);
    _result = FHE.add(squared, 1);
    _dirty = false;
    // 2 FHE ops -- only when result is actually needed
}
```

If `updateValue` is called 10 times before `computeResult` is called once, you save 9 multiplications worth of gas (9 x ~200k = ~1.8M gas saved).

### When Lazy Evaluation Works

- Values are updated more frequently than they are read
- Expensive computations (mul, shifts) are involved
- The contract can tolerate a "stale" intermediate state

### When It Does NOT Work

- Every update must be immediately visible to other contracts
- The computation is cheap (addition) and not worth the complexity

---

## 8. Gas Profiling Technique

You cannot optimize what you cannot measure. Here is how to profile FHE gas usage in your Hardhat tests.

### Using `receipt.gasUsed`

```typescript
it("should measure gas for an FHE operation", async function () {
  const tx = await contract.someFunction(42);
  const receipt = await tx.wait();
  console.log(`Gas used: ${receipt.gasUsed}`);
});
```

### Comparing Two Implementations

```typescript
it("should compare inefficient vs optimized", async function () {
  const tx1 = await contract.inefficient_version(42);
  const receipt1 = await tx1.wait();

  const tx2 = await contract.optimized_version(42);
  const receipt2 = await tx2.wait();

  const savings = receipt1.gasUsed - receipt2.gasUsed;
  const pct = (Number(savings) * 100) / Number(receipt1.gasUsed);
  console.log(`Savings: ${savings} gas (${pct.toFixed(1)}%)`);
});
```

### Setting Gas Budgets

For production contracts, establish maximum gas budgets per function:

```typescript
it("transfer should use less than 500k gas", async function () {
  const tx = await contract.transfer(recipient, 100);
  const receipt = await tx.wait();
  expect(receipt.gasUsed).to.be.lessThan(500_000n);
});
```

This acts as a regression test: if a future refactor accidentally adds FHE operations, the test will fail.

### The GasBenchmark Contract

The `GasBenchmark.sol` contract in this module provides isolated benchmarks for individual FHE operations. Run the tests and examine the output:

```bash
npx hardhat test test/GasBenchmark.test.ts
```

Each test logs the gas cost of a single operation, giving you a real-world reference table for your specific fhEVM version.

---

## 9. Real-World Example: Optimizing a Confidential ERC-20 Transfer

Let us walk through a realistic optimization of a confidential token transfer function.

### Before: Naive Implementation

```solidity
function transfer(address to, uint32 amount) external {
    euint32 encAmount = FHE.asEuint32(amount);

    // Check balance >= amount (encrypted comparison)
    ebool hasEnough = FHE.ge(_balances[msg.sender], encAmount);

    // Compute new balances
    euint32 newSenderBal   = FHE.sub(_balances[msg.sender], encAmount);
    euint32 newReceiverBal = FHE.add(_balances[to], encAmount);

    // Conditionally apply (if balance was sufficient)
    _balances[msg.sender] = FHE.select(hasEnough, newSenderBal, _balances[msg.sender]);
    _balances[to]         = FHE.select(hasEnough, newReceiverBal, _balances[to]);

    // ACL
    FHE.allowThis(_balances[msg.sender]);
    FHE.allow(_balances[msg.sender], msg.sender);
    FHE.allowThis(_balances[to]);
    FHE.allow(_balances[to], to);
}
// Operations: 1 cast + 1 ge + 1 sub + 1 add + 2 select = 6 FHE ops
// Estimated gas: ~45k + ~60k + ~90k + ~90k + ~120k = ~405k
```

### After: Optimized Implementation

```solidity
function transfer(address to, uint32 amount) external {
    // Use plaintext operand for the amount (no cast needed for comparisons/arithmetic)
    ebool hasEnough = FHE.ge(_balances[msg.sender], amount);  // enc vs plain

    euint32 newSenderBal   = FHE.sub(_balances[msg.sender], amount);  // enc - plain
    euint32 newReceiverBal = FHE.add(_balances[to], amount);           // enc + plain

    _balances[msg.sender] = FHE.select(hasEnough, newSenderBal, _balances[msg.sender]);
    _balances[to]         = FHE.select(hasEnough, newReceiverBal, _balances[to]);

    FHE.allowThis(_balances[msg.sender]);
    FHE.allow(_balances[msg.sender], msg.sender);
    FHE.allowThis(_balances[to]);
    FHE.allow(_balances[to], to);
}
// Operations: 1 ge(plain) + 1 sub(plain) + 1 add(plain) + 2 select = 5 FHE ops
// Estimated gas: ~45k + ~65k + ~65k + ~120k = ~295k
// Savings: ~110k gas (27%)
```

The only change: we removed the `FHE.asEuint32(amount)` cast and used the plaintext `amount` directly as the second operand in `ge`, `sub`, and `add`. This eliminated the cast entirely and made the arithmetic operations cheaper.

---

## 10. Real-World Example: Optimizing a Voting Contract

### Before: Naive Voting

```solidity
function vote(uint32 candidateId, uint32 weight) external {
    euint32 encWeight = FHE.asEuint32(weight);
    euint32 encId     = FHE.asEuint32(candidateId);

    // Check if voter is eligible (weight > 0)
    ebool isEligible = FHE.gt(encWeight, FHE.asEuint32(0));

    // Check if candidate is valid (id < numCandidates)
    ebool isValid = FHE.lt(encId, FHE.asEuint32(numCandidates));

    // Both must be true
    ebool canVote = FHE.and(isEligible, isValid);

    // Add weight to candidate tally
    euint32 newTally = FHE.add(_tallies[candidateId], encWeight);
    _tallies[candidateId] = FHE.select(canVote, newTally, _tallies[candidateId]);

    FHE.allowThis(_tallies[candidateId]);
}
// 4 casts + 2 comparisons + 1 and + 1 add + 1 select = 9 FHE ops
```

### After: Optimized Voting

```solidity
function vote(uint32 candidateId, uint32 weight) external {
    require(candidateId < numCandidates, "Invalid candidate"); // plaintext check!
    require(weight > 0, "Zero weight");                         // plaintext check!

    // Both checks were on publicly-known values -- no FHE needed
    _tallies[candidateId] = FHE.add(_tallies[candidateId], weight); // enc + plain

    FHE.allowThis(_tallies[candidateId]);
}
// 0 casts + 0 comparisons + 1 add(plain) = 1 FHE op
// Savings: 8 FHE operations eliminated!
```

The key insight: `candidateId` and `weight` were **not secret** in the original design. The only secret is the running tally. By moving the validation to plaintext `require()` statements, we eliminated 8 of 9 FHE operations.

> **Lesson:** Before encrypting a value, ask yourself: "Does this value actually need to be confidential?" If not, keep it in plaintext.

---

## 11. Optimization Checklist

Use this checklist when reviewing your FHE contracts:

- [ ] **Right-sized types?** Are you using the smallest encrypted type that fits your data?
- [ ] **Plaintext operands?** For every FHE operation, is the second operand truly secret? If not, pass it as plaintext.
- [ ] **Minimum operations?** Can any FHE operations be eliminated by refactoring or pre-computing in plaintext?
- [ ] **Batch updates?** Are there multiple state changes that can be combined into a single transaction?
- [ ] **Cached intermediates?** Are there encrypted values being recomputed that could be stored?
- [ ] **Lazy evaluation?** Are there expensive computations that can be deferred?
- [ ] **Redundant comparisons?** Can `gt + select` be replaced with `max`? Can `lt + select` be replaced with `min`?
- [ ] **Unnecessary casts?** Are you calling `FHE.asEuintXX()` on values that could be passed as plaintext operands directly?
- [ ] **Gas budget tests?** Do your tests verify that key functions stay within a gas budget?
- [ ] **Profiled?** Have you measured actual gas usage with `receipt.gasUsed`?

---

## 12. Common Anti-Patterns

### Anti-Pattern 1: "Encrypt Everything"

```solidity
// BAD: encrypts the contract owner address check
ebool isOwner = FHE.eq(FHE.asEuint32(uint32(uint160(msg.sender))),
                       FHE.asEuint32(uint32(uint160(owner))));

// GOOD: owner is public, use plaintext
require(msg.sender == owner, "Not owner");
```

### Anti-Pattern 2: "One Operation Per Transaction"

```solidity
// BAD: separate transactions for each step
function step1_addBalance(uint32 amt) external { ... }
function step2_checkLimit() external { ... }
function step3_applyFee() external { ... }

// GOOD: combine into one
function updateBalance(uint32 amt) external {
    // add + check + fee in one transaction
}
```

### Anti-Pattern 3: "Ignoring Type Sizes"

```solidity
// BAD: using euint256 for a boolean flag
euint256 private _isActive;

// GOOD: use ebool
ebool private _isActive;
```

### Anti-Pattern 4: "Recomputing Constants"

```solidity
// BAD: encrypts "100" every time the function is called
function applyPercent(euint32 value) internal returns (euint32) {
    return FHE.div(FHE.mul(value, FHE.asEuint32(percentage)), FHE.asEuint32(100));
}

// GOOD: use plaintext for the constant 100
function applyPercent(euint32 value) internal returns (euint32) {
    return FHE.div(FHE.mul(value, percentage), 100);
}
```

---

## 13. Summary of Gas Savings by Pattern

| Pattern | Typical Savings | Difficulty |
|---------|----------------|------------|
| Right-sized types | 30-60% | Easy |
| Plaintext operands | 15-35% | Easy |
| Minimize operations | 20-80% | Medium |
| Batch processing | 10-20% (tx overhead) | Easy |
| Caching | 25-50% (on repeated calls) | Medium |
| Lazy evaluation | 0-90% (depends on access pattern) | Hard |
| Redundant select elimination | 10-30% | Medium |
| Avoid unnecessary casts | 5-15% | Easy |

---

## 14. What is Next?

In the exercise for this module, you will be given a deliberately inefficient confidential token contract. Your task is to apply the patterns from this lesson to reduce its gas consumption by at least 30%. Use the gas profiling techniques to measure your progress.

Then, in the quiz, you will test your understanding of the gas cost model and optimization strategies.

---

## Key Takeaways

1. FHE operations cost 10-100x more gas than plaintext equivalents. Optimization is not optional.
2. The single biggest win is usually **using plaintext operands** -- it requires zero architectural changes.
3. **Right-sizing types** is the second easiest win -- use euint8 when 8 bits suffice.
4. Always **measure gas** with `receipt.gasUsed` before and after optimizing.
5. Ask yourself for every encrypted value: "Does this actually need to be secret?"
