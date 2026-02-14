# Module 18: Quiz -- Confidential DeFi

Test your knowledge of building privacy-preserving DeFi protocols with FHE.

---

### Question 1

In the ConfidentialLending contract, how is the 50% LTV (Loan-to-Value) check implemented?

- A) `require(borrowAmount <= collateral / 2, "Over limit")`
- B) `FHE.le(newBorrowBalance, FHE.div(collateral, 2))` with `FHE.select()` to conditionally update the balance
- C) `FHE.gt(collateral, FHE.mul(borrowAmount, 2))` with a revert on false
- D) The contract decrypts both values and compares them in plaintext

> B is correct. The comparison is done entirely on encrypted values using `FHE.le()`, which returns an `ebool`. Since we cannot branch on an encrypted boolean, `FHE.select()` picks between the new balance (if within limit) or the old balance (if over limit). No revert, no decryption.

---

### Question 2

Why does the lending contract use `FHE.select()` instead of `require()` for the borrow limit check?

- A) Because `FHE.select()` is more gas efficient than `require()`
- B) Because `require()` cannot be used inside FHE functions
- C) Because reverting would leak information -- it reveals that the borrow exceeded the limit
- D) Because `FHE.select()` is the only way to update encrypted state

> C is correct. A `revert` reveals to observers that the borrow condition failed, which leaks information about the user's collateral level. `FHE.select()` silently keeps the old value if the condition fails, making successful and failed borrows indistinguishable to observers.

---

### Question 3

In the EncryptedOrderBook, what information is visible to a public observer when two orders are matched?

- A) The fill price, fill amount, and whether the match succeeded
- B) Only that a match was attempted between two order IDs (prices and amounts remain encrypted)
- C) The exact prices of both orders but not the amounts
- D) Nothing at all -- the entire transaction is hidden

> B is correct. The `OrderMatched` event emits both order IDs, and the function call itself is public. However, the fill amount is computed with `FHE.min()` and conditionally applied with `FHE.select()`. An observer cannot tell if the match actually filled or if the prices were incompatible (fill = 0).

---

### Question 4

How does `matchOrders()` handle incompatible prices (buy price < sell price)?

- A) The transaction reverts with "Prices incompatible"
- B) The `actualFill` becomes `FHE.asEuint64(0)` via `FHE.select()`, and both order amounts remain unchanged
- C) The orders are automatically cancelled
- D) The sell price is adjusted to match the buy price

> B is correct. `FHE.ge(buyPrice, sellPrice)` returns an encrypted false if prices are incompatible. `FHE.select(canMatch, fillAmount, FHE.asEuint64(0))` sets the actual fill to encrypted 0. Subtracting 0 from both amounts leaves them unchanged.

---

### Question 5

Why does the ConfidentialLending contract use `FHE.min(repayAmount, borrowBalance)` in the repay function?

- A) To find the minimum gas cost
- B) To cap the repayment to the actual borrow balance, preventing FHE subtraction underflow
- C) To calculate the interest rate
- D) To determine the collateral ratio

> B is correct. If a user tries to repay more than they owe, `FHE.sub(borrowBalance, repayAmount)` could underflow. `FHE.min()` ensures the actual repayment never exceeds the borrow balance, so the subtraction is always safe.

---

### Question 6

How is interest accrued in the ConfidentialLending contract?

- A) `interest = FHE.mul(borrowBalance, FHE.asEuint64(110)) / 100`
- B) `interest = FHE.div(borrowBalance, 10)` then `FHE.add(borrowBalance, interest)`
- C) The contract decrypts the balance, adds 10%, and re-encrypts
- D) Interest is tracked in a separate plaintext mapping

> B is correct. Interest is 10% of the borrow balance, calculated as `borrowBalance / 10`. This is then added to the borrow balance. All operations are on encrypted values -- the interest amount is never revealed.

---

### Question 7

What is the purpose of `MAX_ACTIVE_ORDERS = 50` in the EncryptedOrderBook?

- A) To limit gas costs per transaction
- B) To prevent Denial-of-Service attacks from creating unbounded orders that bloat storage
- C) To ensure fair access for all traders
- D) To comply with regulatory requirements

> B is correct. Without a limit, an attacker could submit thousands of orders, filling up storage and making the contract expensive to interact with. The cap ensures bounded resource usage.

---

### Question 8

In the withdrawal function, why are two separate checks combined with `FHE.and()`?

- A) To save gas by avoiding two `FHE.select()` calls
- B) To check both that the remaining collateral covers the borrow AND that the user has enough collateral to withdraw (preventing underflow)
- C) To verify the user's identity and balance simultaneously
- D) Because `FHE.select()` only accepts `ebool` from `FHE.and()`

> B is correct. Two conditions must both be true: (1) `remaining >= 2 * borrowBalance` ensures the LTV stays safe, and (2) `collateral >= withdrawAmount` ensures the subtraction does not underflow. `FHE.and()` combines both encrypted booleans into a single condition for `FHE.select()`.

---

### Question 9

Which of the following CANNOT be kept private in an FHE-based DeFi protocol?

- A) Borrow amounts
- B) Order prices
- C) The address of the user interacting with the protocol
- D) Collateral balances

> C is correct. `msg.sender` is always publicly visible on-chain. While amounts, prices, and balances can be encrypted with FHE, the Ethereum address making the transaction is inherently public.

---

### Question 10

What is the main challenge with implementing liquidation in a confidential lending protocol?

- A) FHE does not support comparison operations
- B) Nobody can see collateral or borrow amounts, so traditional off-chain health monitoring is impossible
- C) Liquidation requires decrypting all user balances
- D) Interest cannot be calculated on encrypted values

> B is correct. In traditional lending, liquidation bots monitor all positions in real-time. With encrypted balances, off-chain monitoring is impossible. Solutions include keeper-based on-chain health checks, self-reporting, or threshold-based public decryption of health factors.

---

## Answer Key

| Question | Answer |
|----------|--------|
| 1 | B |
| 2 | C |
| 3 | B |
| 4 | B |
| 5 | B |
| 6 | B |
| 7 | B |
| 8 | B |
| 9 | C |
| 10 | B |

## Scoring

| Score | Rating |
|-------|--------|
| 10/10 | Excellent -- You have mastered confidential DeFi! |
| 7-9/10 | Good -- Review the items you missed. |
| 4-6/10 | Fair -- Re-read the lesson before proceeding. |
| 0-3/10 | Needs work -- Go through the lesson and exercise again. |
