---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 18: Confidential DeFi"
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

# Module 18: Confidential DeFi

Building privacy-preserving lending and trading protocols with FHE.

<!-- Speaker notes: Welcome to the DeFi module. This is where the patterns from Module 17 meet real financial applications. DeFi's biggest weakness is its transparency -- everything is visible to everyone. FHE fixes this by enabling computation on encrypted data. Today we build two production-relevant DeFi primitives: a lending protocol and an order book. -->

---

# Learning Objectives

By the end of this module, you will be able to:

1. Explain why **DeFi transparency** creates MEV, front-running, and liquidation hunting
2. Build a **confidential lending protocol** with encrypted collateral and borrow balances
3. Implement **LTV checks** entirely in the FHE domain using `FHE.le()` + `FHE.select()`
4. Design an **encrypted order book** with hidden prices and amounts
5. Analyze **privacy trade-offs** -- what can and cannot be hidden on-chain
6. Evaluate **gas costs** and optimization strategies for FHE DeFi

<!-- Speaker notes: These objectives cover both the theory (why confidential DeFi matters) and the practice (how to build it). By the end, students should be able to design their own confidential DeFi protocol by combining the patterns and primitives covered here. -->

---

# The Public DeFi Problem

```
Alice deposits 100,000 USDC as collateral
   --> Everyone sees her position size
   --> MEV bots calculate her liquidation price
   --> Sandwich attack when she swaps

Bob places a buy order at $2,500
   --> Front-runner sees it in mempool
   --> Front-runner buys at $2,499, sells to Bob at $2,501
   --> Bob gets a worse price
```

**MEV extraction costs DeFi users billions annually.**

In traditional finance, trade privacy is the default. FHE brings this to on-chain DeFi.

<!-- Speaker notes: Open with concrete examples of how transparency hurts DeFi users. MEV extraction is not theoretical -- it happens on every block. Front-running, sandwich attacks, and liquidation hunting are all enabled by public data. Ask students if they have experienced slippage from sandwich attacks. Traditional finance uses dark pools to solve this; FHE is the on-chain equivalent. -->

---

# The Solution: Encrypted DeFi

```
Alice deposits [encrypted] collateral
   --> Nobody knows her position size
   --> Liquidation price is hidden
   --> Cannot be targeted

Bob places a buy at [encrypted] price
   --> Front-runner sees nothing useful
   --> Order matches privately on-chain
   --> Fair execution for everyone
```

FHE enables **computation on encrypted data** without decryption.

The protocol enforces rules (LTV, price matching) without seeing plaintext values.

<!-- Speaker notes: Emphasize that FHE is not just hiding data -- it is computing on hidden data. The protocol can check if a borrow is within the LTV limit without knowing either the collateral or the borrow amount. This is fundamentally different from zero-knowledge proofs, which prove something about data but do not allow computation on it. -->

---

# What We Are Building

| Protocol | Purpose | Key FHE Operations |
|---|---|---|
| **ConfidentialLending** | Encrypted lending/borrowing | `add`, `sub`, `div`, `le`, `select`, `min` |
| **EncryptedOrderBook** | Private order matching | `ge`, `min`, `select`, `sub` |

Both use the **LastError pattern**: silent failure instead of revert.

Both demonstrate the **privacy boundary**: what stays encrypted vs. what is public.

<!-- Speaker notes: Introduce both contracts briefly. The lending contract protects position information (collateral, borrow amounts). The order book prevents front-running by hiding prices and quantities. Both share the same core FHE patterns but apply them to different DeFi problems. The LastError pattern is key to both -- no reverts, no information leaks. -->

---

# Confidential Lending: Architecture

```
User State (all encrypted per user):
  _collateral[user]     --> euint64 (encrypted collateral balance)
  _borrowBalance[user]  --> euint64 (encrypted borrow balance)

Lifecycle:
  1. deposit()        --> FHE.add(collateral, amount)
  2. borrow()         --> FHE.le(newBorrow, collateral/2) + FHE.select
  3. accrueInterest() --> FHE.div(borrow, 10) + FHE.add
  4. repay()          --> FHE.min(repayAmount, balance) + FHE.sub
  5. withdraw()       --> FHE.ge(remaining, 2*borrow) + FHE.select

LTV = 50%: borrow up to half your collateral
Interest = 10% per accrual (simplified)
```

<!-- Speaker notes: Walk through the architecture. Each user has two encrypted values: collateral and borrow balance. Every operation produces new handles that need ACL updates. The 50% LTV means you can borrow up to half your collateral. Interest is simplified to 10% per call for educational purposes. In production, you would use block-based accrual. -->

---

# User Initialization

```solidity
function _initUser(address user) internal {
    if (!_initialized[user]) {
        _collateral[user] = FHE.asEuint64(0);
        FHE.allowThis(_collateral[user]);
        FHE.allow(_collateral[user], user);

        _borrowBalance[user] = FHE.asEuint64(0);
        FHE.allowThis(_borrowBalance[user]);
        FHE.allow(_borrowBalance[user], user);

        _initialized[user] = true;
    }
}
```

- `FHE.allowThis()` -- contract can operate on the value
- `FHE.allow(handle, user)` -- user can decrypt their own balance
- `_initialized` flag prevents re-initialization (which would reset balances)

<!-- Speaker notes: This pattern should be familiar from previous modules. Every user starts with encrypted zero for both collateral and borrow balance. The key point is the double ACL: allowThis for the contract and allow for the user. The _initialized flag is critical -- without it, calling _initUser twice would reset a user's balances to zero. -->

---

# Depositing Collateral

```solidity
function deposit(externalEuint64 encAmount,
    bytes calldata inputProof) external {
    _initUser(msg.sender);

    euint64 amount = FHE.fromExternal(encAmount, inputProof);

    _collateral[msg.sender] = FHE.add(_collateral[msg.sender], amount);
    FHE.allowThis(_collateral[msg.sender]);
    FHE.allow(_collateral[msg.sender], msg.sender);

    emit Deposited(msg.sender);
}
```

End-to-end encrypted: user encrypts client-side, contract adds to encrypted balance, nobody sees the plaintext amount. After every FHE operation, update ACL on the new handle.

<!-- Speaker notes: Walk through the deposit flow. The user encrypts the amount on the frontend using createEncryptedInput. The contract converts it with FHE.fromExternal, adds it to the existing collateral with FHE.add, and updates ACL on the new handle. Emphasize: every FHE operation produces a new handle with empty ACL. The Deposited event reveals only that a deposit happened, not the amount. -->

---

# The 50% LTV Check (Core Innovation)

```solidity
function borrow(externalEuint64 encAmount,
    bytes calldata inputProof) external {
    _initUser(msg.sender);
    euint64 borrowAmount = FHE.fromExternal(encAmount, inputProof);

    // Total borrow after this request
    euint64 newBorrowBalance = FHE.add(_borrowBalance[msg.sender], borrowAmount);

    // 50% LTV: newBorrow <= collateral / 2
    euint64 maxBorrow = FHE.div(_collateral[msg.sender], 2);
    ebool withinLimit = FHE.le(newBorrowBalance, maxBorrow);

    // If within limit: apply borrow. If over limit: keep old balance.
    _borrowBalance[msg.sender] = FHE.select(
        withinLimit, newBorrowBalance, _borrowBalance[msg.sender]
    );
    FHE.allowThis(_borrowBalance[msg.sender]);
    FHE.allow(_borrowBalance[msg.sender], msg.sender);
}
```

<!-- Speaker notes: This is the core FHE pattern for DeFi. Step through each line carefully. FHE.div computes collateral/2 on encrypted data. FHE.le returns an encrypted boolean -- we do not know the result. FHE.select picks one of two encrypted values based on the encrypted condition. The caller cannot tell if it succeeded until they decrypt their own balance. No revert, no information leakage. -->

---

# Why Not Revert?

```
With revert (LEAKS information):
  Alice tries to borrow 6,000
  TX reverts: "Insufficient collateral"
  Observer knows: Alice's collateral < 12,000

  Repeat with 5,000: reverts
  Observer knows: collateral < 10,000

  Repeat with 3,000: succeeds
  Observer knows: 6,000 <= collateral < 10,000
```

**Binary search on reverts reveals encrypted values!**

`FHE.select()` makes success and failure **indistinguishable**. The transaction always succeeds. Only the user knows the outcome by decrypting their balance.

<!-- Speaker notes: This is the key insight for confidential DeFi. A revert is a binary signal that leaks information. An attacker can binary-search an encrypted value by submitting transactions with different amounts and observing which revert. With FHE.select, every transaction succeeds with identical gas and behavior. The only way to know the outcome is to decrypt your own balance. -->

---

# Interest Accrual on Encrypted Balances

```solidity
function accrueInterest(address user) external onlyOwner {
    _initUser(user);

    // 10% interest: borrowBalance / 10
    euint64 interest = FHE.div(_borrowBalance[user], 10);
    _borrowBalance[user] = FHE.add(_borrowBalance[user], interest);
    FHE.allowThis(_borrowBalance[user]);
    FHE.allow(_borrowBalance[user], user);

    emit InterestAccrued(user);
}
```

- Interest amount is never revealed -- computed entirely on encrypted data
- `FHE.div()` performs integer division on encrypted values
- Owner/keeper triggers accrual per user
- Production: use per-block accrual or batch processing

<!-- Speaker notes: Interest calculation is straightforward FHE arithmetic. FHE.div does integer division on encrypted values. FHE.add accumulates the interest. The interest amount itself is never revealed. Note that integer division truncates: if the borrow balance is 15, the interest is 1, not 1.5. In production, you would have block-based accrual rather than manual triggering. -->

---

# Repayment with FHE.min

```solidity
function repay(externalEuint64 encAmount,
    bytes calldata inputProof) external {
    _initUser(msg.sender);
    euint64 repayAmount = FHE.fromExternal(encAmount, inputProof);

    // Cap repayment to the current borrow balance
    euint64 actualRepay = FHE.min(repayAmount, _borrowBalance[msg.sender]);

    _borrowBalance[msg.sender] = FHE.sub(_borrowBalance[msg.sender], actualRepay);
    FHE.allowThis(_borrowBalance[msg.sender]);
    FHE.allow(_borrowBalance[msg.sender], msg.sender);
}
```

`FHE.min()` caps the repayment. If the user tries to repay more than owed, only the owed amount is subtracted. This prevents underflow without revealing the borrow balance.

<!-- Speaker notes: FHE.min is a powerful tool for capping values without branching. Without it, you would need an FHE.ge check plus FHE.select, which costs more gas. FHE.min does it in one operation. The result is: if repayAmount <= borrowBalance, subtract repayAmount. If repayAmount > borrowBalance, subtract borrowBalance (paying off the full loan). -->

---

# Withdrawal with Safety Check

```solidity
function withdraw(externalEuint64 encAmount,
    bytes calldata inputProof) external {
    _initUser(msg.sender);
    euint64 withdrawAmount = FHE.fromExternal(encAmount, inputProof);

    euint64 remaining = FHE.sub(_collateral[msg.sender], withdrawAmount);

    // Safety: remaining >= 2 * borrowBalance (50% LTV maintained)
    euint64 required = FHE.mul(_borrowBalance[msg.sender], FHE.asEuint64(2));
    ebool isSafe = FHE.ge(remaining, required);

    // Underflow: withdrawAmount <= collateral
    ebool hasEnough = FHE.ge(_collateral[msg.sender], withdrawAmount);
    ebool canWithdraw = FHE.and(isSafe, hasEnough);

    _collateral[msg.sender] = FHE.select(
        canWithdraw, remaining, _collateral[msg.sender]
    );
    // ... ACL updates ...
}
```

Two checks combined with `FHE.and()`: safety check AND underflow prevention.

<!-- Speaker notes: Withdrawal is the most complex operation because it has two encrypted conditions that must both be true. FHE.and combines them into a single ebool. If either check fails, the collateral remains unchanged -- the LastError pattern in action. Note that we check both conditions and combine them rather than nesting FHE.select calls. -->

---

# Encrypted Order Book: Architecture

```solidity
struct Order {
    address trader;   // Public  -- msg.sender is always visible
    euint64 price;    // Private -- hidden from everyone
    euint64 amount;   // Private -- hidden from everyone
    bool isBuy;       // Public  -- needed for matching logic
    bool isActive;    // Public  -- needed for validation
}

mapping(uint256 => Order) private _orders;
uint256 public constant MAX_ACTIVE_ORDERS = 50;
```

| Information | Visibility | Rationale |
|---|---|---|
| Order exists | Public | Transaction is on-chain |
| Trader address | Public | `msg.sender` is always visible |
| Buy/sell direction | Public | Must be known to match orders |
| Price | **Private** | Prevents front-running |
| Amount | **Private** | Prevents position hunting |

<!-- Speaker notes: Review the design decisions. The trader address must be public (it is msg.sender). The buy/sell direction must be public for the matching engine to work efficiently. But the critical information -- how much and at what price -- is encrypted. This prevents front-running because MEV bots cannot see the prices. MAX_ACTIVE_ORDERS prevents DoS from unbounded storage. -->

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

    uint256 orderId = orderCount++;
    _orders[orderId] = Order(msg.sender, price, amount, true, true);

    FHE.allowThis(_orders[orderId].price);
    FHE.allow(_orders[orderId].price, msg.sender);
    FHE.allowThis(_orders[orderId].amount);
    FHE.allow(_orders[orderId].amount, msg.sender);

    activeOrderCount++;
    emit OrderSubmitted(orderId, msg.sender, true);
}
```

Two encrypted inputs (price + amount), each with its own proof.

<!-- Speaker notes: Note the two separate encrypted inputs. Each has its own handle and proof -- they are encrypted independently on the frontend. MAX_ACTIVE_ORDERS prevents DoS. The event reveals that an order was placed and by whom, but not the price or amount. The sell order function is identical except isBuy is set to false. -->

---

# Order Matching (Heart of the Order Book)

```solidity
function matchOrders(uint256 buyId, uint256 sellId) external onlyOwner {
    // 1. Check price compatibility: buyPrice >= sellPrice
    ebool canMatch = FHE.ge(_orders[buyId].price, _orders[sellId].price);

    // 2. Fill amount = min of both order amounts
    euint64 fillAmount = FHE.min(
        _orders[buyId].amount, _orders[sellId].amount);

    // 3. Zero fill if prices incompatible
    euint64 actualFill = FHE.select(
        canMatch, fillAmount, FHE.asEuint64(0));

    // 4. Update remaining amounts
    _orders[buyId].amount  = FHE.sub(_orders[buyId].amount,  actualFill);
    _orders[sellId].amount = FHE.sub(_orders[sellId].amount, actualFill);

    // 5. ACL refresh on new handles...
    emit OrderMatched(buyId, sellId);
}
```

Nobody knows if the match succeeded or how much was filled.

<!-- Speaker notes: Walk through each step. FHE.ge checks if the buyer will pay at least the seller's price. FHE.min finds the smaller order for the fill. FHE.select zeros the fill if prices do not match. FHE.sub updates both orders. The event is emitted regardless of whether orders actually filled. An observer sees a match attempt but not the result. This is the privacy that eliminates front-running. -->

---

# Privacy Trade-offs in DeFi

| Can Keep Private | Cannot Hide |
|---|---|
| Deposit / borrow / order amounts | Wallet addresses (`msg.sender`) |
| Order prices | Which function was called |
| Fill amounts | When a transaction happened |
| Interest amounts | Number of transactions |
| Collateral ratios | Gas usage patterns |
| Whether a match succeeded | Contract interactions |

**FHE hides the "what" (amounts, prices). It cannot hide the "who" or "when."**

This parallels traditional finance: your bank knows your balance, the public knows you have an account, aggregate statistics are published.

<!-- Speaker notes: Be honest about limitations. FHE is powerful but not a silver bullet. Addresses are always public. Timing analysis can reveal patterns. Gas usage differs slightly between code paths. The goal is to make the most sensitive information (amounts, prices) private while accepting that metadata is public. Ask: is this level of privacy sufficient for most DeFi use cases? Answer: yes, because the most damaging attacks (front-running, MEV, liquidation hunting) depend on knowing amounts and prices. -->

---

# Compliance and Auditability

FHE-based DeFi can support regulatory compliance:

1. **KYC gates** -- Require address whitelisting before interaction
   (plaintext check before encrypted operations)

2. **Auditor access** -- Grant specific addresses ACL access
   `FHE.allow(handle, auditor)` enables selective disclosure

3. **Threshold reporting** -- FHE comparison flags large transactions
   without revealing exact amounts

4. **Selective disclosure** -- Users can voluntarily make balances public
   using `FHE.makePubliclyDecryptable()`

Privacy does not mean unaccountable. FHE's ACL system enables **privacy with auditability**.

<!-- Speaker notes: This is an important slide for addressing regulatory concerns. FHE privacy is not all-or-nothing. The ACL system allows granular access control. A regulator or auditor can be granted access to specific encrypted values without making them public to everyone. This is actually better than traditional finance, where privacy often means opacity. -->

---

# Gas Cost Reality

```
ConfidentialLending.borrow():
  FHE.fromExternal()  ~100,000 gas
  FHE.add()            ~50,000 gas
  FHE.div()           ~150,000 gas
  FHE.le()             ~50,000 gas
  FHE.select()         ~50,000 gas
  ACL operations        ~50,000 gas
  ─────────────────────────────────
  Total:              ~450,000 gas

Plaintext equivalent:   ~30,000 gas
Overhead:               ~15x
```

**Optimization strategies:**
- Use smaller types (`euint8`, `euint16`) where value ranges allow
- Batch operations (accrue interest for multiple users per tx)
- Cache intermediate FHE results across function calls
- Minimize FHE operations per function call

<!-- Speaker notes: Be transparent about costs. 15x is significant but manageable for high-value DeFi operations. A $10,000 loan where the gas cost is $5 instead of $0.30 is acceptable for the privacy benefit. Optimization is important: using euint8 instead of euint64 when values fit is a quick win. Batching interest accrual reduces per-user overhead. -->

---

# The Liquidation Challenge

```
Traditional Lending:
  Bot reads position --> calculates health --> liquidates immediately
  Works because all data is public

Confidential Lending:
  Bot cannot read position --> cannot calculate health --> ???
```

**Possible approaches:**

| Approach | How It Works | Tradeoff |
|----------|-------------|----------|
| Self-reporting | User triggers own health check | Relies on cooperation |
| Keeper incentive | Keeper calls on-chain FHE check | Gas cost for failed checks |
| Time-based | Check health during interest accrual | Delayed detection |
| Threshold reveal | Make health factor public when dangerous | Partial privacy loss |

This is the **hardest open problem** in confidential lending.

<!-- Speaker notes: This is the most interesting design challenge. Traditional liquidation depends on transparent positions. With FHE, we need entirely new mechanisms. The most promising approach is keeper-based: a keeper calls a function that does the FHE health check on-chain and earns a reward if liquidation occurs. The keeper does not need to know the position details -- the contract handles the check. -->

---

# Advanced Concepts

**Encrypted AMMs:** Constant product `x * y = k` with FHE.mul
- Prevents price oracle manipulation (a feature, not a bug)
- Challenge: FHE.mul is expensive and slippage protection needs encrypted comparison

**Private Yield Farming:** Encrypted staking amounts
- Share-based models (ERC-4626) work well: public share price, private holdings
- Prevents whale-watching strategies

**Confidential Insurance:** Hidden premiums and claims
- Prevents adverse selection based on premium size
- Payout decisions via FHE comparison against policy limits

**Cross-Protocol Composability:** `FHE.allow(handle, otherContract)`
- Enables encrypted DeFi Legos: lending -> DEX -> yield aggregator

<!-- Speaker notes: These are directions for further exploration. Encrypted AMMs are the holy grail -- swapping without revealing amounts or prices. Yield farming with encrypted stakes prevents whale-watching strategies. Insurance with encrypted premiums prevents adverse selection. Each of these could be a project in itself. Encourage students to pick one as a post-bootcamp project. -->

---

# Oracle Integration

Price oracles with encrypted values present unique challenges:

```solidity
// Wrapping a public oracle price into FHE
uint256 oraclePrice = chainlinkFeed.latestAnswer();
euint64 encPrice = FHE.asEuint64(uint64(oraclePrice));
// Now use encPrice in FHE comparisons
```

**Considerations:**
- Public oracle prices can narrow down encrypted position ranges
- If an observer knows the price AND the LTV, they can estimate collateral ranges
- Private oracle feeds (encrypted oracle responses) are an active research area
- Oracle manipulation remains a risk even with encrypted positions

<!-- Speaker notes: Oracle integration is an often-overlooked challenge. Even if collateral and borrow amounts are encrypted, a public price feed combined with the known LTV ratio can help narrow down position ranges. For example, if ETH price drops 20% and a liquidation event follows, an observer can estimate the position's health range. Private oracle feeds are being researched but are not yet production-ready. -->

---

# Testing Confidential DeFi

```typescript
// Encrypt and deposit
const enc = await fhevm
  .createEncryptedInput(contractAddress, signer.address)
  .add64(10000n)
  .encrypt();
await lending.connect(signer).deposit(enc.handles[0], enc.inputProof);

// Decrypt and verify
const handle = await lending.connect(signer).getCollateral();
const value = await fhevm.userDecryptEuint(
  FhevmType.euint64, handle, contractAddress, signer
);
expect(value).to.equal(10000n);
```

**Key test scenarios:**
- Happy path: deposit, borrow within limits, repay, withdraw
- Silent failures: borrow over limit, withdraw too much (verify balance unchanged)
- Multi-user isolation: one user's actions do not affect another
- Edge cases: repay more than owed, withdraw all with no borrow

<!-- Speaker notes: Testing FHE DeFi follows the same patterns from Module 14. Encrypt known values, perform operations, decrypt results, verify correctness. The critical tests are the silent failure cases -- you must verify that the balance did NOT change when the operation should have failed. This is the opposite of traditional testing where you check for reverts. -->

---

# Summary

1. **Confidential Lending** -- Encrypted collateral + borrow with FHE LTV enforcement
2. **Encrypted Order Book** -- Hidden prices + amounts with FHE matching
3. **LastError Pattern** -- `FHE.select()` over `revert` prevents info leaks via binary search
4. **Privacy Boundary** -- Amounts and prices are private; addresses and timing are not
5. **Gas Overhead** -- ~15x cost for privacy; optimize with smaller types and batching
6. **Liquidation** -- Hardest open problem; needs keeper-based or threshold designs
7. **Compliance** -- ACL grants enable privacy with selective auditability
8. **Composability** -- `FHE.allow(handle, otherContract)` enables encrypted DeFi Legos

FHE makes private finance possible on public blockchains.

<!-- Speaker notes: Wrap up by reinforcing the key takeaways. FHE-based DeFi is not theoretical -- these contracts work today. The gas overhead is the cost of privacy. The biggest open problems are liquidation and cross-protocol composability. Students should be excited that they can build real DeFi protocols with the patterns they have learned. -->

---

# Exercise: Confidential Swap

Build a `ConfidentialSwap` contract:

- Two token balances per user (Token A, Token B) -- both encrypted
- Fixed exchange rate: **1 A = 2 B**
- `swapAtoB(encAmount)`: spend A, receive `amount * 2` of B
- `swapBtoA(encAmount)`: spend B, receive `amount / 2` of A
- Insufficient balance: use `FHE.select()` (no revert, no information leak)
- Both balances update atomically

**Starter code:** `exercises/18-defi-exercise.sol`

<!-- Speaker notes: The exercise synthesizes everything from the lesson. Students implement a simpler version of the order book concept -- a fixed-rate swap. The key patterns are the same: FHE.fromExternal for inputs, FHE.ge for balance checks, FHE.select for conditional updates, and proper ACL management on every new handle. Give students 60-90 minutes. -->

---

# What is Next?

**Module 19: Capstone -- Confidential DAO**
- Governance tokens with encrypted balances
- Weighted voting where vote power = token balance
- Treasury management with proposal-based spending
- Cross-contract ACL between token and DAO contracts
- Full frontend integration

The capstone combines **everything** from the bootcamp into one application.

<!-- Speaker notes: Give students a preview of the capstone. It combines the confidential ERC-20 from Module 11, the voting from Module 12, the patterns from Module 17, and the DeFi thinking from this module into a complete governance application. Encourage students to review their Module 11 and 12 code before the next session. -->
