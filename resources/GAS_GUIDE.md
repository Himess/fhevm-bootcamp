# FHEVM Gas Cost Guide

Understanding and optimizing gas costs is critical for building practical FHE smart contracts. FHE operations are orders of magnitude more expensive than their plaintext equivalents. This guide provides cost references, comparisons, and optimization strategies.

---

## Why FHE Gas Costs Are High

Every FHE operation in fhEVM is processed by a dedicated coprocessor that performs homomorphic computation on ciphertexts. The gas cost reflects:

1. **Ciphertext size:** Encrypted values are much larger than plaintext values. A 32-bit plaintext integer becomes a ciphertext of several kilobytes.
2. **Computation complexity:** Homomorphic operations (especially comparisons and multiplications) require extensive mathematical computation on lattice structures.
3. **Bit width scaling:** Larger encrypted types require more computation. Operations on `euint256` are significantly more expensive than on `euint8`.
4. **Bootstrapping:** Some operations require noise management (bootstrapping), which is the most expensive step in FHE.

---

## Gas Cost Reference Table

The following table provides approximate gas costs for FHE operations. Actual costs depend on the fhEVM version, network configuration, and coprocessor implementation. Use these as relative guidelines for optimization decisions.

### Arithmetic Operations

| Operation | euint4 | euint8 | euint16 | euint32 | euint64 | euint128 | euint256 |
|---|---|---|---|---|---|---|---|
| `FHE.add` | ~50k | ~80k | ~120k | ~180k | ~250k | ~400k | ~600k |
| `FHE.sub` | ~50k | ~80k | ~120k | ~180k | ~250k | ~400k | ~600k |
| `FHE.mul` | ~100k | ~150k | ~250k | ~400k | ~700k | ~1.2M | ~2M |
| `FHE.div` | ~150k | ~250k | ~400k | ~700k | ~1.2M | ~2M | ~3.5M |
| `FHE.rem` | ~150k | ~250k | ~400k | ~700k | ~1.2M | ~2M | ~3.5M |
| `FHE.neg` | ~40k | ~60k | ~90k | ~140k | ~200k | ~350k | ~500k |
| `FHE.min` | ~120k | ~180k | ~280k | ~450k | ~750k | ~1.3M | ~2.2M |
| `FHE.max` | ~120k | ~180k | ~280k | ~450k | ~750k | ~1.3M | ~2.2M |

### Comparison Operations

| Operation | euint4 | euint8 | euint16 | euint32 | euint64 | euint128 | euint256 |
|---|---|---|---|---|---|---|---|
| `FHE.eq` | ~80k | ~120k | ~180k | ~280k | ~450k | ~800k | ~1.4M |
| `FHE.ne` | ~80k | ~120k | ~180k | ~280k | ~450k | ~800k | ~1.4M |
| `FHE.gt` | ~80k | ~120k | ~180k | ~280k | ~450k | ~800k | ~1.4M |
| `FHE.ge` | ~80k | ~120k | ~180k | ~280k | ~450k | ~800k | ~1.4M |
| `FHE.lt` | ~80k | ~120k | ~180k | ~280k | ~450k | ~800k | ~1.4M |
| `FHE.le` | ~80k | ~120k | ~180k | ~280k | ~450k | ~800k | ~1.4M |

### Bitwise Operations

| Operation | euint4 | euint8 | euint16 | euint32 | euint64 | euint128 | euint256 |
|---|---|---|---|---|---|---|---|
| `FHE.and` | ~40k | ~60k | ~90k | ~140k | ~200k | ~350k | ~500k |
| `FHE.or` | ~40k | ~60k | ~90k | ~140k | ~200k | ~350k | ~500k |
| `FHE.xor` | ~40k | ~60k | ~90k | ~140k | ~200k | ~350k | ~500k |
| `FHE.not` | ~30k | ~50k | ~75k | ~120k | ~170k | ~300k | ~450k |
| `FHE.shl` | ~60k | ~90k | ~140k | ~220k | ~350k | ~600k | ~1M |
| `FHE.shr` | ~60k | ~90k | ~140k | ~220k | ~350k | ~600k | ~1M |
| `FHE.rotl` | ~60k | ~90k | ~140k | ~220k | ~350k | ~600k | ~1M |
| `FHE.rotr` | ~60k | ~90k | ~140k | ~220k | ~350k | ~600k | ~1M |

### Conditional Selection

| Operation | euint4 | euint8 | euint16 | euint32 | euint64 | euint128 | euint256 |
|---|---|---|---|---|---|---|---|
| `FHE.select` | ~50k | ~70k | ~100k | ~160k | ~230k | ~380k | ~560k |

### Other Operations

| Operation | Approximate Gas |
|---|---|
| `FHE.fromExternal()` (any type) | ~50k-150k (varies by type) |
| `FHE.asEuint32(plaintext)` | ~50k |
| `FHE.randEuint32()` | ~100k-200k |
| `FHE.allow()` | ~40k-50k |
| `FHE.allowThis()` | ~40k-50k |
| `FHE.allowTransient()` | ~25k-35k |

### Mixed Encrypted/Plaintext Operations

Operations where the second operand is a plaintext value are generally **cheaper** than fully encrypted operations:

| Pattern | Relative Cost |
|---|---|
| `FHE.add(encrypted, encrypted)` | 100% (baseline) |
| `FHE.add(encrypted, plaintext)` | ~60-80% of baseline |
| `FHE.mul(encrypted, plaintext)` | ~50-70% of baseline |
| `FHE.gt(encrypted, plaintext)` | ~60-80% of baseline |

---

## Cost Comparison: FHE vs Plaintext

For perspective, here is how FHE operations compare to their plaintext EVM equivalents:

| Operation | Plaintext Gas | FHE Gas (euint32) | Ratio |
|---|---|---|---|
| Addition | ~3 | ~180k | ~60,000x |
| Multiplication | ~5 | ~400k | ~80,000x |
| Comparison | ~3 | ~280k | ~93,000x |
| Storage write | ~5k-20k | Same (storing handle) | 1x |
| ACL management | N/A | ~40-50k per call | N/A |

**Key insight:** The gas cost is dominated by computation, not storage. Storing an encrypted value is cheap (it is just a handle/pointer). Operating on it is expensive.

---

## Type Selection Guide

Choosing the right encrypted type has the largest impact on gas costs.

### Decision Framework

```
Does the value fit in 4 bits (0-15)?     -> Use euint4
Does the value fit in 8 bits (0-255)?    -> Use euint8
Does the value fit in 16 bits (0-65535)? -> Use euint16
Does the value fit in 32 bits?           -> Use euint32
Does the value fit in 64 bits?           -> Use euint64
Does the value require > 64 bits?        -> Use euint128 or euint256
```

### Common Use Cases

| Use Case | Recommended Type | Reasoning |
|---|---|---|
| Boolean flags | `ebool` | Single bit, cheapest operations |
| Small counters (votes, scores) | `euint8` or `euint16` | Rarely exceed small ranges |
| Token amounts (6-decimal tokens) | `euint64` | Sufficient for most token amounts |
| Token amounts (18-decimal tokens) | `euint64` or `euint128` | 18-decimal tokens need more range |
| Timestamps | `euint32` or `euint64` | Unix timestamps fit in 32 bits until 2106 |
| Prices | `euint32` or `euint64` | Depends on precision needed |
| Addresses | `eaddress` | Fixed type, no choice |
| Arbitrary data | `ebytes64/128/256` | Fixed sizes |

### Gas Savings from Type Downsizing

| Scenario | Type Change | Operation | Gas Saved (approximate) |
|---|---|---|---|
| Vote counter (0-100) | `euint64` to `euint8` | `FHE.add` | ~68% |
| Score (0-1000) | `euint64` to `euint16` | `FHE.add` | ~52% |
| USDC balance (6 decimals) | `euint256` to `euint64` | `FHE.add` | ~58% |

---

## Optimization Strategies

### Strategy 1: Minimize the Number of FHE Operations

Every FHE operation costs gas. Restructure your logic to reduce the total count.

**Before (4 FHE operations):**

```solidity
euint32 a = FHE.add(x, y);
euint32 b = FHE.add(a, z);
euint32 c = FHE.mul(b, FHE.asEuint32(2));
// 3 add/mul operations + 1 asEuint32
```

**After (2 FHE operations):**

```solidity
// Pre-compute plaintext parts: if z is known, combine additions
euint32 sumXY = FHE.add(x, y);
euint32 result = FHE.add(FHE.mul(sumXY, 2), FHE.mul(z, 2));
// Actually, rethink: 2*(x+y+z) = 2*x + 2*y + 2*z
// If any operand is plaintext, exploit that
```

**General principle:** Combine operations where possible. Use plaintext second operands to avoid extra `FHE.asEuintXX()` calls.

### Strategy 2: Use Plaintext Operands When Possible

Operations with a plaintext second operand are cheaper than fully encrypted operations.

**Before (expensive):**

```solidity
euint32 fee = FHE.div(amount, FHE.asEuint32(100)); // div(encrypted, encrypted)
```

**After (cheaper):**

```solidity
euint32 fee = FHE.div(amount, 100); // div(encrypted, plaintext) -- cheaper
```

### Strategy 3: Cache Intermediate Results

Avoid recomputing the same encrypted value.

**Before (wasteful):**

```solidity
function process(externalEuint32 encVal, bytes calldata proof) external {
    euint32 val = FHE.fromExternal(encVal, proof);

    // FHE.gt computed twice with the same operands!
    euint32 capped = FHE.select(FHE.gt(val, FHE.asEuint32(100)), FHE.asEuint32(100), val);
    euint32 bonus = FHE.select(FHE.gt(val, FHE.asEuint32(100)), FHE.asEuint32(10), FHE.asEuint32(0));
}
```

**After (efficient):**

```solidity
function process(externalEuint32 encVal, bytes calldata proof) external {
    euint32 val = FHE.fromExternal(encVal, proof);

    // Compute comparison once, reuse
    ebool isAbove100 = FHE.gt(val, 100);
    euint32 capped = FHE.select(isAbove100, FHE.asEuint32(100), val);
    euint32 bonus = FHE.select(isAbove100, FHE.asEuint32(10), FHE.asEuint32(0));
}
```

### Strategy 4: Batch ACL Calls

ACL calls are relatively cheap but add up. Minimize them by structuring your code to grant permissions at the end.

**Before (scattered ACL):**

```solidity
balances[from] = newFromBal;
FHE.allowThis(balances[from]);
FHE.allow(balances[from], from);

balances[to] = newToBal;
FHE.allowThis(balances[to]);
FHE.allow(balances[to], to);

allowances[from][spender] = newAllowance;
FHE.allowThis(allowances[from][spender]);
FHE.allow(allowances[from][spender], from);
```

**After (batched at the end):** The code is functionally identical, but grouping ACL calls at the end improves readability (gas is the same per call, but organization helps auditing).

### Strategy 5: Use FHE.min/FHE.max Instead of Compare + Select

When you just need to clamp or bound a value, `FHE.min` and `FHE.max` are equivalent to a compare + select but expressed more cleanly. The gas cost is similar (they internally do a comparison + selection), but using them reduces code complexity and potential bugs.

```solidity
// Clamp a value between 10 and 100
euint32 clamped = FHE.max(FHE.min(value, FHE.asEuint32(100)), FHE.asEuint32(10));
```

### Strategy 6: Avoid Unnecessary Encryption

Not everything needs to be encrypted. Use plaintext for data that is already public.

**Before (everything encrypted):**

```solidity
euint32 private totalVotes;      // Total vote count -- is this really secret?
euint32 private votingDeadline;  // Block number deadline -- is this secret?
```

**After (hybrid):**

```solidity
uint256 public totalVoters;      // Number of voters is public (or can be)
uint256 public votingDeadline;   // Deadline is public
euint32 private yesVotes;        // Vote tally IS secret
euint32 private noVotes;         // Vote tally IS secret
```

### Strategy 7: Pre-compute Off-Chain When Possible

If a computation involves only plaintext values, do it off-chain and pass the result as a single encrypted input, rather than encrypting multiple values and computing on-chain.

**Before (3 on-chain FHE ops):**

```solidity
function submitOrder(externalEuint64 encPrice, externalEuint64 encQty, externalEuint64 encFee, bytes calldata proof) external {
    euint64 price = FHE.fromExternal(encPrice, proof);
    euint64 qty = FHE.fromExternal(encQty, proof);
    euint64 fee = FHE.fromExternal(encFee, proof);
    euint64 total = FHE.add(FHE.mul(price, qty), fee);  // 2 FHE ops
}
```

**After (0 on-chain FHE ops for the calculation):**

```solidity
// Client computes: total = price * qty + fee (in plaintext, then encrypts the result)
function submitOrder(externalEuint64 encTotal, bytes calldata proof) external {
    euint64 total = FHE.fromExternal(encTotal, proof);  // Just 1 conversion, 0 FHE ops
    FHE.allowThis(total);
}
```

**Caveat:** This only works if the contract does not need the individual components. If it needs both `price` and `total`, you must pass both.

---

## Gas Budgeting

### Estimating Transaction Gas

To estimate the gas for a transaction, sum up all FHE operations:

```
Total Gas = Base TX gas (21k)
          + Contract execution gas
          + Sum(FHE operation gas costs)
          + Sum(ACL operation gas costs)
          + Sum(Input conversion gas costs)
```

### Example: Encrypted ERC-20 Transfer

```
Operation                          | Gas
-----------------------------------|--------
Base transaction                   | 21,000
FHE.fromExternal (euint64)         | 100,000
FHE.ge (balance check)             | 450,000
FHE.sub (sender balance)           | 250,000
FHE.add (receiver balance)         | 250,000
FHE.select (sender)                | 230,000
FHE.select (receiver)              | 230,000
FHE.allowThis x2                   | 100,000
FHE.allow x2                       | 100,000
Contract logic overhead            | 50,000
-----------------------------------|--------
ESTIMATED TOTAL                    | ~1,781,000
```

### Gas Limit Configuration

For fhEVM contracts, set a high gas limit in your Hardhat config:

```javascript
// hardhat.config.js
module.exports = {
  networks: {
    hardhat: {
      gas: 30_000_000,        // 30M gas limit
      blockGasLimit: 30_000_000,
    },
  },
};
```

---

## Profiling Tools

### Hardhat Gas Reporter

```bash
npm install hardhat-gas-reporter --save-dev
```

```javascript
// hardhat.config.js
require("hardhat-gas-reporter");

module.exports = {
  gasReporter: {
    enabled: true,
    currency: "USD",
  },
};
```

### Manual Gas Measurement in Tests

```javascript
const tx = await contract.transfer(recipient, encryptedAmount);
const receipt = await tx.wait();
console.log(`Transfer gas used: ${receipt.gasUsed.toString()}`);
```

---

## Future Outlook

FHE gas costs are expected to decrease significantly over time due to:

1. **Hardware acceleration:** GPU and ASIC-based FHE accelerators are under development.
2. **Algorithmic improvements:** New FHE schemes and optimization techniques continue to emerge.
3. **Coprocessor optimization:** The TFHE-rs library is continuously optimized.
4. **Batching improvements:** Better batching of FHE operations at the coprocessor level.
5. **Network-level optimizations:** Custom gas pricing models that reflect actual computation costs more accurately.

Current costs should be viewed as early-stage pricing. The fundamental capability --- computing on encrypted data --- is the value proposition; the costs will follow Moore's Law-like improvements.
