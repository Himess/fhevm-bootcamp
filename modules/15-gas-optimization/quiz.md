# Module 15: Quiz -- Gas Optimization for FHE

Test your understanding of FHE gas costs and optimization strategies.

---

### Question 1

Which FHE arithmetic operation is the most gas-expensive for the same type size?

- A) `FHE.add()`
- B) `FHE.sub()`
- C) `FHE.mul()`
- D) `FHE.div()` (plaintext divisor)

> Multiplication is approximately 2x the cost of addition or division across all type sizes.

---

### Question 2

How much cheaper is `FHE.add(encryptedValue, 10)` compared to `FHE.add(encryptedValue, FHE.asEuint32(10))`?

- A) They cost the same
- B) About 15-35% cheaper
- C) About 2x cheaper
- D) About 10x cheaper

> Plaintext operands allow the FHE coprocessor to optimize the computation, saving roughly 25-35% on the operation plus the eliminated cast cost.

---

### Question 3

You need to store a user's age (0-150). Which encrypted type should you choose for gas efficiency?

- A) `euint256`
- B) `euint64`
- C) `euint32`
- D) `euint8`

> Age fits within 0-255 (8 bits). Using `euint8` gives the cheapest operations. Every operation on euint8 is roughly 40-60% cheaper than on euint64.

---

### Question 4

You have a function that computes the same encrypted tax rate from two encrypted components every time it is called. The components change once per month. What should you do?

- A) Nothing -- the recomputation cost is negligible
- B) Use lazy evaluation to defer the computation
- C) Cache the tax rate in a state variable and recompute only when components change
- D) Use a larger type to compute it faster

> Since the components change rarely (monthly), caching the intermediate result avoids recomputing it on every call. After the initial storage cost, every subsequent call saves the recomputation gas.

---

### Question 5

What is the primary benefit of batch processing in FHE contracts?

- A) It makes individual FHE operations cheaper
- B) It amortizes transaction overhead (base 21k gas) across multiple operations
- C) It enables parallel execution of FHE operations
- D) It allows the use of smaller types

> Each Ethereum transaction has a base cost of 21,000 gas plus call overhead. Combining three operations into one transaction saves two sets of this overhead (~42k gas). The FHE operations themselves cost the same either way.

---

### Question 6

Which of these is an anti-pattern in FHE contracts?

- A) Using `require(msg.sender == owner)` for access control
- B) Using `FHE.add(balance, amount)` with a plaintext `amount`
- C) Using `FHE.eq(FHE.asEuint32(uint32(uint160(msg.sender))), FHE.asEuint32(uint32(uint160(owner))))` for access control
- D) Caching intermediate encrypted results in state variables

> Encrypting publicly known values like `msg.sender` and `owner` is wasteful. Since both are public, a simple `require(msg.sender == owner)` achieves the same result at negligible gas cost.

---

### Question 7

In a confidential ERC-20 transfer, which of these values genuinely needs to be encrypted?

- A) The sender address
- B) The recipient address
- C) The token balance
- D) The block timestamp

> Addresses and timestamps are public on-chain. Only the balance (and transfer amount, if privacy is desired) needs encryption.

---

### Question 8

You have this code: `FHE.select(FHE.gt(a, b), a, b)`. What is a more gas-efficient replacement?

- A) `FHE.min(a, b)`
- B) `FHE.max(a, b)`
- C) `FHE.eq(a, b)`
- D) There is no better alternative

> `FHE.select(FHE.gt(a, b), a, b)` picks `a` when `a > b`, otherwise `b`. This is exactly `max(a, b)`. The built-in `FHE.max` replaces a comparison + select with a single operation.

---

### Question 9

A function updates a value 10 times before anyone reads the result. Each update involves an `FHE.mul()`. How can lazy evaluation help?

- A) It cannot help in this scenario
- B) It defers all 10 multiplications and executes them together
- C) It only performs the multiplication when the result is read, so only the final value's computation executes
- D) It replaces multiplication with addition

> With lazy evaluation, each of the first 9 updates simply overwrites the stored base value (cheap). Only when the result is actually needed does the expensive multiplication execute. This saves 9 x ~200k = ~1.8M gas.

---

### Question 10

You are profiling gas in Hardhat tests. Which approach correctly measures the gas used by a function call?

- A) `const gas = await contract.estimateGas.myFunction(args)`
- B) `const tx = await contract.myFunction(args); const receipt = await tx.wait(); console.log(receipt.gasUsed);`
- C) `console.log(tx.gasLimit)`
- D) `const gas = ethers.utils.formatEther(tx.value)`

> Option B is correct: you send the transaction, wait for the receipt, then read `receipt.gasUsed`. This gives the actual gas consumed. `estimateGas` gives an estimate (not actual), `gasLimit` is the maximum allowed, and `formatEther(value)` has nothing to do with gas measurement.

---

## Answer Key

| Question | Answer |
|----------|--------|
| 1 | C -- `FHE.mul()` |
| 2 | B -- About 15-35% cheaper |
| 3 | D -- `euint8` |
| 4 | C -- Cache the tax rate |
| 5 | B -- Amortizes transaction overhead |
| 6 | C -- Encrypting public addresses for access control |
| 7 | C -- The token balance |
| 8 | B -- `FHE.max(a, b)` |
| 9 | C -- Only the final value's computation executes |
| 10 | B -- Use `receipt.gasUsed` from the mined transaction |
