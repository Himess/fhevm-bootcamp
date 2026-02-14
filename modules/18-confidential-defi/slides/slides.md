---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 18: Confidential DeFi"
footer: "Zama Developer Program"
---

# Module 18: Confidential DeFi

Building privacy-preserving lending and trading with FHE.

---

# The Problem: Public DeFi

```
Alice deposits 100,000 USDC as collateral
   --> Everyone sees her position size
   --> MEV bots calculate her liquidation price
   --> Sandwich attack when she swaps

Bob places a buy order at $2,500
   --> Front-runner sees it in mempool
   --> Front-runner buys at $2,499
   --> Bob gets a worse price
```

DeFi's transparency is its biggest vulnerability.

<!--
Speaker notes: Open with concrete examples of how transparency hurts DeFi users. MEV extraction costs users billions annually. Front-running is not theoretical -- it happens on every block. Ask students if they have experienced slippage from sandwich attacks.
-->

---

# The Solution: Encrypted DeFi

```
Alice deposits [encrypted] collateral
   --> Nobody knows her position size
   --> Liquidation price is hidden
   --> Cannot be targeted

Bob places a buy at [encrypted] price
   --> Front-runner sees nothing useful
   --> Order matches privately
   --> Fair execution
```

FHE enables computations on encrypted data without decryption.

<!--
Speaker notes: Emphasize that FHE is not just hiding data -- it is computing on hidden data. The protocol can enforce rules (LTV checks, price matching) without ever seeing the actual values. This is fundamentally different from zero-knowledge proofs, which prove something about data without revealing it but do not allow computation.
-->

---

# What We Are Building

| Protocol | Purpose | FHE Operations |
|---|---|---|
| **ConfidentialLending** | Encrypted lending/borrowing | `add`, `div`, `le`, `select`, `min` |
| **EncryptedOrderBook** | Private order matching | `ge`, `min`, `select`, `sub` |

Both use the **LastError pattern**: silent failure instead of revert.

<!--
Speaker notes: Introduce both contracts briefly. The lending contract is about protecting position information. The order book is about preventing front-running. Both share the same FHE patterns but apply them differently. The LastError pattern is key to both.
-->

---

# Confidential Lending: Architecture

```
User State (all encrypted):
  _collateral[user]     --> euint64
  _borrowBalance[user]  --> euint64

Operations:
  deposit()        --> FHE.add(collateral, amount)
  borrow()         --> FHE.le(newBorrow, collateral/2) + FHE.select
  repay()          --> FHE.min(repayAmount, balance) + FHE.sub
  withdraw()       --> FHE.ge(remaining, 2*borrow) + FHE.select
  accrueInterest() --> FHE.div(borrow, 10) + FHE.add
```

<!--
Speaker notes: Walk through the state model. Each user has two encrypted values. Every operation produces new handles that need ACL updates. The 50% LTV means you can borrow up to half your collateral. Interest is simplified to 10% per call.
-->

---

# The 50% LTV Check

```solidity
euint64 newBorrowBalance = FHE.add(_borrowBalance[msg.sender], borrowAmount);
euint64 maxBorrow = FHE.div(_collateral[msg.sender], 2);
ebool withinLimit = FHE.le(newBorrowBalance, maxBorrow);

_borrowBalance[msg.sender] = FHE.select(
    withinLimit,
    newBorrowBalance,         // if within limit: apply borrow
    _borrowBalance[msg.sender] // if over limit: keep old balance
);
```

No revert. No information leakage. The borrow either happens or it does not.

<!--
Speaker notes: This is the core FHE pattern for DeFi. Step through each line. FHE.div computes collateral/2 on encrypted data. FHE.le returns an encrypted boolean. FHE.select picks one of two encrypted values based on the encrypted condition. The caller does not know if it succeeded until they decrypt their own balance.
-->

---

# Why Not Revert?

```
With revert (leaks information):
  Alice tries to borrow 6000
  TX reverts: "Insufficient collateral"
  Observer knows: Alice's collateral < 12000

Without revert (LastError pattern):
  Alice tries to borrow 6000
  TX succeeds (borrow balance unchanged)
  Observer knows: Alice tried to borrow (nothing else)
```

`FHE.select()` makes success and failure indistinguishable.

<!--
Speaker notes: This is the key insight. In traditional Solidity, a revert is a binary signal that leaks information. If you try to borrow X and it reverts, the observer knows your collateral is less than 2X. With FHE.select, the transaction always succeeds. The only way to know if it worked is to decrypt your own balance.
-->

---

# Interest Accrual

```solidity
function accrueInterest(address user) external onlyOwner {
    euint64 interest = FHE.div(_borrowBalance[user], 10);
    _borrowBalance[user] = FHE.add(_borrowBalance[user], interest);
    // ACL updates...
}
```

- 10% interest per accrual: `borrowBalance / 10`
- Entirely on encrypted data
- Owner/keeper triggers it per user

<!--
Speaker notes: Interest calculation is straightforward FHE arithmetic. FHE.div does integer division on encrypted values. FHE.add accumulates the interest. The interest amount itself is never revealed. In production, you would have block-based accrual rather than manual triggering.
-->

---

# Encrypted Order Book: Architecture

```
Order {
    address trader   (public)
    euint64 price    (encrypted)
    euint64 amount   (encrypted)
    bool isBuy       (public)
    bool isActive    (public)
}

Public:  order exists, who placed it, buy/sell direction
Private: price, amount, fill quantity
```

<!--
Speaker notes: Review what is public vs private. The trader address must be public (it is msg.sender). The buy/sell direction must be public for the matching engine to work. But the critical information -- how much and at what price -- is encrypted. This prevents front-running because MEV bots cannot see the prices.
-->

---

# Order Submission

```solidity
function submitBuyOrder(
    externalEuint64 encPrice,  bytes calldata priceProof,
    externalEuint64 encAmount, bytes calldata amountProof
) external {
    require(activeOrderCount < MAX_ACTIVE_ORDERS, "Too many");

    euint64 price  = FHE.fromExternal(encPrice, priceProof);
    euint64 amount = FHE.fromExternal(encAmount, amountProof);

    // Store order with ACL grants...
    activeOrderCount++;
    emit OrderSubmitted(orderId, msg.sender, true);
}
```

Two encrypted inputs: price and amount, each with its own proof.

<!--
Speaker notes: Note the two separate encrypted inputs. Each has its own handle and proof. MAX_ACTIVE_ORDERS prevents DoS. The event reveals that an order was placed and by whom, but not the price or amount. The sell order function is identical except isBuy is false.
-->

---

# Order Matching

```solidity
// 1. Check price compatibility
ebool canMatch = FHE.ge(buyPrice, sellPrice);

// 2. Calculate fill
euint64 fillAmount = FHE.min(buyAmount, sellAmount);

// 3. Zero fill if prices incompatible
euint64 actualFill = FHE.select(canMatch, fillAmount, FHE.asEuint64(0));

// 4. Update amounts
buyOrder.amount  = FHE.sub(buyOrder.amount,  actualFill);
sellOrder.amount = FHE.sub(sellOrder.amount, actualFill);
```

Nobody knows if the match succeeded or how much was filled.

<!--
Speaker notes: This is the most important slide for the order book. Walk through each step. FHE.ge checks if the buyer is willing to pay at least the seller's price. FHE.min finds the smaller order. FHE.select zeros the fill if prices do not match. FHE.sub updates both orders. The event is emitted regardless, so observers cannot tell if orders actually filled.
-->

---

# Privacy Trade-offs

| Can Keep Private | Cannot Hide |
|---|---|
| Deposit amounts | Wallet addresses |
| Borrow amounts | Which function was called |
| Order prices | When a transaction happened |
| Order quantities | Number of transactions |
| Fill amounts | Gas usage patterns |
| Interest amounts | Contract interactions |

FHE hides the **what**, not the **who** or **when**.

<!--
Speaker notes: Be honest about limitations. FHE is powerful but not a silver bullet. Addresses are always public. Timing analysis can still reveal patterns. Gas usage differs slightly between code paths. The goal is to make the most sensitive information (amounts, prices) private while accepting that metadata is public.
-->

---

# Gas Cost Reality

```
ConfidentialLending.borrow():
  FHE.fromExternal()  ~100,000 gas
  FHE.add()           ~50,000 gas
  FHE.div()           ~150,000 gas
  FHE.le()            ~50,000 gas
  FHE.select()        ~50,000 gas
  ACL operations       ~50,000 gas
  ─────────────────────────────
  Total:              ~450,000 gas

Plaintext equivalent:  ~30,000 gas
Overhead:              ~15x
```

Privacy has a cost. Optimize by minimizing FHE operations per call.

<!--
Speaker notes: Be transparent about costs. 15x is significant but manageable for high-value DeFi operations. A $10,000 loan where the gas cost is $5 instead of $0.30 is acceptable for the privacy benefit. Optimization strategies include using smaller types, batching operations, and caching intermediate results.
-->

---

# Liquidation Challenge

```
Traditional:  Bot reads position -> calculates health -> liquidates
Confidential: Bot cannot read position -> cannot calculate health -> ???

Solutions:
1. Self-reporting (user triggers own check)
2. Keeper incentive (on-chain FHE health check)
3. Time-based (check during interest accrual)
4. Threshold reveal (make health factor public when dangerous)
```

<!--
Speaker notes: This is the hardest open problem in confidential lending. Traditional liquidation depends on transparent positions. With FHE, we need new mechanisms. The most promising approach is keeper-based: a keeper calls a function that does the FHE health check on-chain and earns a reward if liquidation occurs. The keeper does not need to know the position details.
-->

---

# Advanced Concepts

- **Encrypted AMMs:** Constant product formula with FHE.mul
- **Private yield farming:** Encrypted staking with FHE arithmetic
- **Confidential insurance:** Hidden premiums and claim amounts
- **Cross-protocol composability:** FHE.allow(handle, otherContract)

The building blocks from this module apply to all DeFi primitives.

<!--
Speaker notes: These are directions for further exploration. Encrypted AMMs are the holy grail -- swapping without revealing amounts or prices. Yield farming with encrypted stakes prevents whale-watching strategies. Insurance with encrypted premiums prevents adverse selection. Composability via FHE.allow enables DeFi Legos with privacy.
-->

---

# Exercise: Confidential Swap

Build a `ConfidentialSwap` contract:
- Two token balances per user (Token A, Token B) -- both encrypted
- Fixed exchange rate: 1 A = 2 B
- `swapAtoB()`: spend A, receive B (rate * amount)
- `swapBtoA()`: spend B, receive A (amount / rate)
- Insufficient balance: `FHE.select()` (no revert)

Starter code: `exercises/18-defi-exercise.sol`

<!--
Speaker notes: The exercise synthesizes everything from the lesson. Students implement a simpler version of the order book concept -- a fixed-rate swap. The key patterns are the same: FHE.fromExternal for inputs, FHE.ge for balance checks, FHE.select for conditional updates, and proper ACL management.
-->

---

# Summary

1. **Confidential Lending:** Encrypted collateral + borrow with FHE LTV checks
2. **Encrypted Order Book:** Hidden prices + amounts with FHE matching
3. **LastError Pattern:** `FHE.select()` over `revert` to prevent info leaks
4. **Privacy Boundary:** Amounts are private; addresses and timing are not
5. **Production Reality:** ~15x gas overhead, liquidation needs new designs
6. **DeFi Value:** Eliminates front-running, MEV, and position hunting

FHE makes private finance possible on public blockchains.

<!--
Speaker notes: Wrap up by reinforcing the key takeaways. FHE is not a toy -- these contracts work today. The gas overhead is the cost of privacy. The biggest open problems are liquidation and cross-protocol composability. Students should be excited that they can build real DeFi protocols with these patterns.
-->
