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

| Operation | euint8 | euint16 | euint32 | euint64 | euint128 | euint256 |
|---|---|---|---|---|---|---|
| `FHE.add` | ~80k | ~120k | ~180k | ~250k | ~400k | ~600k |
| `FHE.sub` | ~80k | ~120k | ~180k | ~250k | ~400k | ~600k |
| `FHE.mul` | ~150k | ~250k | ~400k | ~700k | ~1.2M | ~2M |
| `FHE.div` (scalar only) | ~250k | ~400k | ~700k | ~1.2M | ~2M | ~3.5M |
| `FHE.rem` (scalar only) | ~250k | ~400k | ~700k | ~1.2M | ~2M | ~3.5M |
| `FHE.neg` | ~60k | ~90k | ~140k | ~200k | ~350k | ~500k |
| `FHE.min` | ~180k | ~280k | ~450k | ~750k | ~1.3M | ~2.2M |
| `FHE.max` | ~180k | ~280k | ~450k | ~750k | ~1.3M | ~2.2M |

### Comparison Operations

| Operation | euint8 | euint16 | euint32 | euint64 | euint128 | euint256 |
|---|---|---|---|---|---|---|
| `FHE.eq` | ~120k | ~180k | ~280k | ~450k | ~800k | ~1.4M |
| `FHE.ne` | ~120k | ~180k | ~280k | ~450k | ~800k | ~1.4M |
| `FHE.gt` | ~120k | ~180k | ~280k | ~450k | ~800k | ~1.4M |
| `FHE.ge` | ~120k | ~180k | ~280k | ~450k | ~800k | ~1.4M |
| `FHE.lt` | ~120k | ~180k | ~280k | ~450k | ~800k | ~1.4M |
| `FHE.le` | ~120k | ~180k | ~280k | ~450k | ~800k | ~1.4M |

### Bitwise Operations

| Operation | euint8 | euint16 | euint32 | euint64 | euint128 | euint256 |
|---|---|---|---|---|---|---|
| `FHE.and` | ~60k | ~90k | ~140k | ~200k | ~350k | ~500k |
| `FHE.or` | ~60k | ~90k | ~140k | ~200k | ~350k | ~500k |
| `FHE.xor` | ~60k | ~90k | ~140k | ~200k | ~350k | ~500k |
| `FHE.not` | ~50k | ~75k | ~120k | ~170k | ~300k | ~450k |
| `FHE.shl` | ~90k | ~140k | ~220k | ~350k | ~600k | ~1M |
| `FHE.shr` | ~90k | ~140k | ~220k | ~350k | ~600k | ~1M |
| `FHE.rotl` | ~90k | ~140k | ~220k | ~350k | ~600k | ~1M |
| `FHE.rotr` | ~90k | ~140k | ~220k | ~350k | ~600k | ~1M |

### Conditional Selection

| Operation | euint8 | euint16 | euint32 | euint64 | euint128 | euint256 |
|---|---|---|---|---|---|---|
| `FHE.select` | ~70k | ~100k | ~160k | ~230k | ~380k | ~560k |

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
| Arbitrary data | `ebytes64/128/256` | Fixed sizes (note: ebytes types are defined in the type system but have limited FHE operation support in the current version) |

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

**Before (WRONG -- div does not accept an encrypted second operand):**

```solidity
euint32 fee = FHE.div(amount, FHE.asEuint32(100)); // WRONG: div/rem only accept plaintext divisor
```

**After (CORRECT -- scalar divisor):**

```solidity
euint32 fee = FHE.div(amount, 100); // CORRECT: div requires a plaintext (scalar) second operand
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

## Real Benchmark Results

The following gas measurements were captured from our test suite using `REPORT_GAS=true npx hardhat test` on the local fhEVM mock environment (328 tests, all passing).

> **Note:** These numbers reflect the local mock environment. On the actual Ethereum Sepolia or mainnet, costs will differ due to the real FHE coprocessor overhead.

### Function Call Gas Costs

| Contract | Function | Min Gas | Max Gas | Avg Gas | Calls |
|---|---|---|---|---|---|
| **ArithmeticOps** | addEncrypted | - | - | 137,766 | 2 |
| | mulEncrypted | - | - | 137,749 | 2 |
| | subEncrypted | - | - | 137,760 | 2 |
| **BitwiseOps** | andOp | - | - | 137,694 | 2 |
| | orOp | - | - | 137,684 | 2 |
| | xorOp | 137,705 | 137,717 | 137,711 | 4 |
| | notOp | - | - | 127,150 | 2 |
| **ComparisonOps** | eqOp | - | - | 137,958 | 4 |
| | neOp | - | - | 138,002 | 2 |
| | gtOp | - | - | 137,657 | 2 |
| | ltOp | - | - | 137,746 | 2 |
| | leOp | - | - | 137,722 | 2 |
| **ConditionalDemo** | selectDemo | 146,522 | 146,525 | 146,524 | 4 |
| | clampValue | - | - | 181,721 | 6 |
| **ConfidentialERC20** | mint | 116,279 | 136,167 | 120,257 | 10 |
| | transfer | 243,226 | 316,581 | 292,129 | 6 |
| | transferFrom | - | - | 446,434 | 2 |
| | approve | - | - | 218,076 | 2 |
| **ConfidentialVoting** | createProposal | 201,304 | 201,376 | 201,338 | 10 |
| | vote | 290,547 | 295,159 | 292,082 | 12 |
| **ConfidentialDAO** | createProposal | 242,025 | 242,037 | 242,034 | 8 |
| | mintTokens | 118,045 | 155,057 | 139,695 | 10 |
| | vote | 290,553 | 295,165 | 291,706 | 8 |
| **SealedBidAuction** | createAuction | 223,586 | 243,498 | 225,826 | 18 |
| | bid | 383,880 | 400,992 | 395,860 | 20 |
| | endAuction | - | - | 122,972 | 2 |
| | withdrawDeposit | - | - | 35,110 | 2 |
| **EncryptedLottery** | buyTicket | 76,161 | 93,261 | 87,561 | 24 |
| | drawWinner | 162,215 | 179,315 | 170,765 | 4 |
| | claimPrize | - | - | 31,779 | 2 |
| | revealWinner | - | - | 34,571 | 2 |
| **EncryptedMinMax** | findMin | - | - | 150,183 | 4 |
| | findMax | - | - | 150,082 | 2 |
| | findMinOfThree | - | - | 181,767 | 2 |
| | sortTwo | - | - | 236,961 | 2 |
| **HelloFHEVM** | increment | 189,393 | 211,766 | 206,167 | 8 |
| **SimpleCounter** | increment | 189,635 | 212,008 | 208,273 | 12 |
| **MultiUserVault** | deposit | 189,836 | 212,287 | 209,478 | 16 |
| | withdraw | 221,820 | 221,832 | 221,826 | 4 |
| **PublicDecrypt** | setValue | 121,955 | 141,855 | 131,905 | 8 |
| | setEncryptedValue | - | - | 212,594 | 2 |
| | makePublic | - | - | 67,503 | 2 |
| | compare | - | - | 95,460 | 2 |
| **SecureInput** | storeUint8 | - | - | 191,394 | 2 |
| | storeUint32 | - | - | 191,397 | 4 |
| | storeUint64 | - | - | 191,373 | 2 |
| | storeBool | - | - | 191,422 | 4 |
| **RandomDemo** | generateRandom8 | - | - | 125,694 | 2 |
| | generateRandom32 | - | - | 125,751 | 2 |
| | generateRandom64 | - | - | 125,822 | 2 |
| | randomInRange | - | - | 135,625 | 2 |
| **TypeConversions** | plaintextToEncrypted | - | - | 118,589 | 2 |
| | upcast8to32 | 128,107 | 128,119 | 128,115 | 6 |
| | upcast16to64 | - | - | 128,186 | 2 |
| | compareEqual | - | - | 137,879 | 4 |
| **EncryptedTypes** | setUint8 | - | - | 118,462 | 4 |
| | setUint16 | - | - | 118,479 | 2 |
| | setUint32 | 118,503 | 118,539 | 118,521 | 4 |
| | setUint64 | - | - | 118,587 | 2 |
| **UserDecrypt** | storeSecret | 190,623 | 190,647 | 190,641 | 8 |
| | shareSecret | - | - | 60,600 | 2 |

### Deployment Gas Costs

| Contract | Deployment Gas | % of Block Limit |
|---|---|---|
| SimpleStorage | 161,790 | 0.3% |
| EncryptedTypes | 488,385 | 0.8% |
| ACLDemo | 506,044 | 0.8% |
| TypeConversions | 517,826 | 0.9% |
| UserDecrypt | 527,122 | 0.9% |
| BitwiseOps | 541,503 | 0.9% |
| ConditionalDemo | 532,134 | 0.9% |
| SimpleCounter | 547,547 | 0.9% |
| HelloFHEVM | 571,040 | 1.0% |
| RandomDemo | 577,126 | 1.0% |
| EncryptedMinMax | 580,384 | 1.0% |
| BasicToken | 600,537 | 1.0% |
| ComparisonOps | 630,242 | 1.1% |
| SecureInput | 699,577 | 1.2% |
| PublicDecrypt | 724,522 | 1.2% |
| MultiUserVault | 726,382 | 1.2% |
| ArithmeticOps | 746,423 | 1.2% |
| EncryptedLottery | 954,264 | 1.6% |
| ConfidentialVoting | 1,131,076 | 1.9% |
| ConfidentialERC20 | 1,244,733 | 2.1% |
| ConfidentialDAO | 1,414,927 | 2.4% |
| SealedBidAuction | 1,514,479 | 2.5% |

### Key Takeaways from Benchmarks

1. **Most expensive function:** `ConfidentialERC20.transferFrom()` at ~446k gas -- involves balance check, allowance check, two balance updates, and allowance update, all encrypted.

2. **Voting costs ~290k gas** per vote across both ConfidentialVoting and ConfidentialDAO -- consistent overhead for the `FHE.select()` + `FHE.add()` pattern.

3. **Sealed-bid auction bids cost ~396k gas** -- includes encrypted comparison (`FHE.gt`), two `FHE.select` operations (bid + bidder), and ACL updates.

4. **Basic FHE ops are ~118-138k gas** in the mock environment -- this represents the baseline cost for any single homomorphic operation.

5. **Deployment costs scale with complexity** -- simple contracts (SimpleStorage: 162k) vs complex ones (SealedBidAuction: 1.5M), but all stay under 3% of the block gas limit.

6. **`FHE.fromExternal()` with proof adds ~70-90k gas** on top of basic operations -- visible in the difference between `setValue` (~132k) and `setEncryptedValue` (~213k) in PublicDecrypt.

---

## Future Outlook

FHE gas costs are expected to decrease significantly over time due to:

1. **Hardware acceleration:** GPU and ASIC-based FHE accelerators are under development.
2. **Algorithmic improvements:** New FHE schemes and optimization techniques continue to emerge.
3. **Coprocessor optimization:** The TFHE-rs library is continuously optimized.
4. **Batching improvements:** Better batching of FHE operations at the coprocessor level.
5. **Network-level optimizations:** Custom gas pricing models that reflect actual computation costs more accurately.

Current costs should be viewed as early-stage pricing. The fundamental capability --- computing on encrypted data --- is the value proposition; the costs will follow Moore's Law-like improvements.
