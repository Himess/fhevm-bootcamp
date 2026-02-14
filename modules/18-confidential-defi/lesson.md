# Module 18: Confidential DeFi -- Lesson

## Introduction: Why Confidential DeFi?

Decentralized finance has transformed how we think about financial services. Lending, trading, and asset management can now happen without intermediaries. But there is a fundamental problem: **everything is public**.

On a standard EVM blockchain, every transaction is visible to everyone:

- Your collateral deposit amount is public
- Your loan size is public
- Your trading orders are public
- Your liquidation threshold is public

This transparency creates serious problems:

```
The Public DeFi Problem:

1. Front-running: MEV bots see your trade and execute ahead of you
2. Sandwich attacks: Bots place orders before AND after yours, extracting value
3. Liquidation hunting: Observers see when you are close to liquidation
4. Information asymmetry: Whales can see and exploit smaller traders
5. Strategic copying: Competitors can copy your trading strategy
```

In traditional finance, trade privacy is the default. When you place a limit order at a brokerage, other participants do not see your order until it is executed. When you take out a loan at a bank, other customers do not know your loan balance.

FHE (Fully Homomorphic Encryption) brings this privacy to on-chain DeFi. With FHEVM, we can build lending protocols where collateral and borrow amounts are encrypted, and order books where prices and quantities are hidden until execution.

This module builds two production-relevant DeFi primitives:
1. **ConfidentialLending** -- A lending protocol with encrypted collateral, borrowing, and interest
2. **EncryptedOrderBook** -- An order book with encrypted prices and amounts

---

## 1. Confidential Lending Protocol

### 1.1 Architecture Overview

A lending protocol has a straightforward lifecycle:

```
Lending Lifecycle:
1. User deposits collateral (encrypted amount)
2. User borrows against collateral (encrypted amount)
3. Protocol checks collateralization ratio (FHE comparison)
4. Interest accrues over time (FHE arithmetic on encrypted balance)
5. User repays borrow (FHE subtraction)
6. User withdraws collateral (with sufficiency check)
```

In our simplified model:
- **Collateral** is tracked per user as `euint64`
- **Borrow balance** is tracked per user as `euint64`
- **LTV (Loan-to-Value)** is 50%: you can borrow up to half your collateral
- **Interest** is 10% per accrual period (simplified)

### 1.2 Encrypted Collateral Management

Each user has two encrypted balances stored in mappings:

```solidity
mapping(address => euint64) private _collateral;
mapping(address => euint64) private _borrowBalance;
mapping(address => bool) private _initialized;
```

Both are initialized to encrypted zero when a user first interacts with the protocol:

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

Key points:
- `FHE.allowThis()` grants the contract permission to operate on the encrypted value
- `FHE.allow(handle, user)` grants the user permission to decrypt their own balance
- The `_initialized` flag prevents re-initialization (which would reset balances)

### 1.3 Depositing Collateral

Depositing adds encrypted collateral to the user's balance:

```solidity
function deposit(externalEuint64 encAmount, bytes calldata inputProof) external {
    _initUser(msg.sender);

    euint64 amount = FHE.fromExternal(encAmount, inputProof);

    _collateral[msg.sender] = FHE.add(_collateral[msg.sender], amount);
    FHE.allowThis(_collateral[msg.sender]);
    FHE.allow(_collateral[msg.sender], msg.sender);

    emit Deposited(msg.sender);
}
```

The deposit amount is encrypted end-to-end:
1. The user encrypts the amount client-side using `fhevm.createEncryptedInput()`
2. The encrypted value and proof are sent to the contract
3. `FHE.fromExternal()` converts the external input to an internal `euint64`
4. `FHE.add()` adds it to the existing collateral (both encrypted)
5. ACL is updated for the new handle (every FHE operation produces a new handle)

**Important:** After every FHE operation that produces a new handle, you must call `FHE.allowThis()` and `FHE.allow()` again. The ACL is per-handle, not per-slot.

### 1.4 The Collateralization Check with FHE

The core innovation is the on-chain collateralization check using encrypted values:

```solidity
function borrow(externalEuint64 encAmount, bytes calldata inputProof) external {
    _initUser(msg.sender);

    euint64 borrowAmount = FHE.fromExternal(encAmount, inputProof);

    // Total borrow after this request
    euint64 newBorrowBalance = FHE.add(_borrowBalance[msg.sender], borrowAmount);

    // 50% LTV check: newBorrowBalance <= collateral / 2
    euint64 maxBorrow = FHE.div(_collateral[msg.sender], 2);
    ebool withinLimit = FHE.le(newBorrowBalance, maxBorrow);

    // If within limit, apply the borrow; otherwise keep existing balance
    _borrowBalance[msg.sender] = FHE.select(
        withinLimit,
        newBorrowBalance,
        _borrowBalance[msg.sender]
    );
    FHE.allowThis(_borrowBalance[msg.sender]);
    FHE.allow(_borrowBalance[msg.sender], msg.sender);

    emit Borrowed(msg.sender);
}
```

Let us trace through the logic:

1. `borrowAmount` is the encrypted amount the user wants to borrow
2. `newBorrowBalance` adds this to any existing borrow (also encrypted)
3. `maxBorrow = collateral / 2` computes the maximum allowed borrow (encrypted division)
4. `withinLimit = FHE.le(newBorrowBalance, maxBorrow)` checks the LTV constraint -- this returns an `ebool` (encrypted boolean)
5. `FHE.select(withinLimit, newBorrowBalance, _borrowBalance[msg.sender])` conditionally updates the borrow balance

The critical insight: **we cannot use `if/else` on encrypted booleans**. The result of `FHE.le()` is encrypted -- we do not know if it is `true` or `false`. Instead, we use `FHE.select()` to pick between two encrypted values based on the encrypted condition.

### 1.5 The LastError Pattern

In traditional Solidity, a failed borrow would `revert`. But reverting leaks information:

```
Problem with revert:
- User tries to borrow X
- Transaction reverts with "Insufficient collateral"
- Observer now knows: user's collateral < 2X
- This narrows down the collateral range

Solution: silent failure
- User tries to borrow X
- Borrow balance stays the same (FHE.select picks the old value)
- No revert, no information leaked
- User checks their own balance to see if it changed
```

This is the **LastError pattern**: instead of reverting on failure, the contract silently does nothing. The user can decrypt their own balance to check whether the operation succeeded. The contract can optionally store an error code, but even the error code must be carefully managed to avoid leaking information about the encrypted state.

In our implementation, the `Borrowed` event is always emitted regardless of success. An observer only sees that a borrow attempt was made, but not whether it succeeded or how much was borrowed.

### 1.6 Interest Accrual on Encrypted Balances

Interest is calculated using FHE arithmetic:

```solidity
function accrueInterest(address user) external onlyOwner {
    _initUser(user);

    euint64 interest = FHE.div(_borrowBalance[user], 10);
    _borrowBalance[user] = FHE.add(_borrowBalance[user], interest);
    FHE.allowThis(_borrowBalance[user]);
    FHE.allow(_borrowBalance[user], user);

    emit InterestAccrued(user);
}
```

This adds 10% interest: `interest = borrowBalance / 10`, then `borrowBalance += interest`.

Key observations:
- The interest amount is never revealed -- it is computed entirely on encrypted data
- `FHE.div()` performs integer division on encrypted values
- The owner (or a keeper) triggers interest accrual per user
- In production, you would batch this across all users or use a per-block accrual model

### 1.7 Withdrawal with Collateral Sufficiency Check

Withdrawing collateral requires checking that the remaining collateral still covers the borrow:

```solidity
function withdraw(externalEuint64 encAmount, bytes calldata inputProof) external {
    _initUser(msg.sender);

    euint64 withdrawAmount = FHE.fromExternal(encAmount, inputProof);

    // Remaining collateral after withdrawal
    euint64 remaining = FHE.sub(_collateral[msg.sender], withdrawAmount);

    // Check: remaining >= 2 * borrowBalance
    euint64 requiredCollateral = FHE.mul(_borrowBalance[msg.sender], FHE.asEuint64(2));
    ebool isSafe = FHE.ge(remaining, requiredCollateral);

    // Also check withdrawAmount <= collateral (prevent underflow)
    ebool hasEnough = FHE.ge(_collateral[msg.sender], withdrawAmount);
    ebool canWithdraw = FHE.and(isSafe, hasEnough);

    _collateral[msg.sender] = FHE.select(
        canWithdraw,
        remaining,
        _collateral[msg.sender]
    );
    FHE.allowThis(_collateral[msg.sender]);
    FHE.allow(_collateral[msg.sender], msg.sender);

    emit Withdrawn(msg.sender);
}
```

Two checks are combined with `FHE.and()`:
1. **Safety check:** `remaining >= 2 * borrowBalance` ensures 50% LTV is maintained
2. **Underflow check:** `withdrawAmount <= collateral` prevents FHE subtraction underflow

If either check fails, the collateral remains unchanged (LastError pattern).

### 1.8 Repayment

Repayment reduces the borrow balance:

```solidity
function repay(externalEuint64 encAmount, bytes calldata inputProof) external {
    _initUser(msg.sender);

    euint64 repayAmount = FHE.fromExternal(encAmount, inputProof);

    // Cap repayment to the current borrow balance
    euint64 actualRepay = FHE.min(repayAmount, _borrowBalance[msg.sender]);

    _borrowBalance[msg.sender] = FHE.sub(_borrowBalance[msg.sender], actualRepay);
    FHE.allowThis(_borrowBalance[msg.sender]);
    FHE.allow(_borrowBalance[msg.sender], msg.sender);

    emit Repaid(msg.sender);
}
```

`FHE.min()` caps the repayment to the borrow balance. If the user tries to repay more than they owe, only the owed amount is subtracted. This prevents underflow without revealing the borrow balance.

---

## 2. Encrypted Order Book

### 2.1 Why Encrypted Order Books Matter

Traditional on-chain order books (like on Serum or dYdX v3) expose every order to everyone:

```
Traditional Order Book (public):
  BUY  100 units @ $50  (Alice)
  BUY   50 units @ $48  (Bob)
  SELL  75 units @ $52  (Carol)
  SELL 200 units @ $55  (Dave)

Problems:
- MEV bots see Alice's large buy order and front-run it
- Traders see the order book depth and manipulate prices
- Market makers' strategies are fully visible
- Dark pools exist in TradFi precisely to avoid this
```

An encrypted order book hides the critical information:

```
Encrypted Order Book:
  BUY  [encrypted] units @ [encrypted]  (Alice)
  BUY  [encrypted] units @ [encrypted]  (Bob)
  SELL [encrypted] units @ [encrypted]  (Carol)
  SELL [encrypted] units @ [encrypted]  (Dave)

What is public: order exists, trader address, buy/sell direction
What is private: price, amount, fill amount
```

### 2.2 Order Structure

Each order stores encrypted price and amount alongside public metadata:

```solidity
struct Order {
    address trader;
    euint64 price;
    euint64 amount;
    bool isBuy;
    bool isActive;
}

mapping(uint256 => Order) private _orders;
uint256 public orderCount;
uint256 public activeOrderCount;
uint256 public constant MAX_ACTIVE_ORDERS = 50;
```

Design decisions:
- **`trader` is public:** Addresses are always visible on-chain (transaction sender)
- **`isBuy` is public:** The direction (buy vs sell) must be known to match orders
- **`isActive` is public:** Needed for validation without FHE overhead
- **`price` and `amount` are encrypted:** These are the sensitive values
- **`MAX_ACTIVE_ORDERS = 50`:** Prevents DoS from unbounded order storage

### 2.3 Order Submission

Buy and sell order submission follow the same pattern:

```solidity
function submitBuyOrder(
    externalEuint64 encPrice,
    bytes calldata priceProof,
    externalEuint64 encAmount,
    bytes calldata amountProof
) external {
    require(activeOrderCount < MAX_ACTIVE_ORDERS, "Too many active orders");

    euint64 price = FHE.fromExternal(encPrice, priceProof);
    euint64 amount = FHE.fromExternal(encAmount, amountProof);

    uint256 orderId = orderCount++;
    _orders[orderId].trader = msg.sender;
    _orders[orderId].price = price;
    _orders[orderId].amount = amount;
    _orders[orderId].isBuy = true;
    _orders[orderId].isActive = true;

    FHE.allowThis(_orders[orderId].price);
    FHE.allow(_orders[orderId].price, msg.sender);
    FHE.allowThis(_orders[orderId].amount);
    FHE.allow(_orders[orderId].amount, msg.sender);

    activeOrderCount++;

    emit OrderSubmitted(orderId, msg.sender, true);
}
```

Note the dual encrypted inputs: both price and amount are encrypted separately, each with its own proof. The function takes four parameters for the encrypted data: two handles and two proofs. Both receive ACL grants for the contract and the trader.

### 2.4 Order Matching Logic

The matching function is the heart of the order book. It compares a buy order against a sell order:

```solidity
function matchOrders(uint256 buyOrderId, uint256 sellOrderId) external onlyOwner {
    require(_orders[buyOrderId].isActive, "Buy order not active");
    require(_orders[sellOrderId].isActive, "Sell order not active");
    require(_orders[buyOrderId].isBuy, "Not a buy order");
    require(!_orders[sellOrderId].isBuy, "Not a sell order");

    // Check if buy price >= sell price
    ebool canMatch = FHE.ge(
        _orders[buyOrderId].price,
        _orders[sellOrderId].price
    );

    // Fill amount = min of both order amounts
    euint64 fillAmount = FHE.min(
        _orders[buyOrderId].amount,
        _orders[sellOrderId].amount
    );

    // If prices are incompatible, fill becomes 0
    euint64 actualFill = FHE.select(canMatch, fillAmount, FHE.asEuint64(0));

    // Update remaining amounts
    _orders[buyOrderId].amount = FHE.sub(_orders[buyOrderId].amount, actualFill);
    _orders[sellOrderId].amount = FHE.sub(_orders[sellOrderId].amount, actualFill);

    // Update ACL for new handles
    FHE.allowThis(_orders[buyOrderId].amount);
    FHE.allow(_orders[buyOrderId].amount, _orders[buyOrderId].trader);
    FHE.allowThis(_orders[sellOrderId].amount);
    FHE.allow(_orders[sellOrderId].amount, _orders[sellOrderId].trader);

    emit OrderMatched(buyOrderId, sellOrderId);
}
```

Step-by-step breakdown:

1. **Price comparison:** `FHE.ge(buyPrice, sellPrice)` checks if the buy price is at least as high as the sell price. This returns an `ebool` -- we do not know the result.

2. **Fill calculation:** `FHE.min(buyAmount, sellAmount)` determines how much can be filled. If one order is for 100 units and the other for 60, the fill is 60.

3. **Conditional fill:** `FHE.select(canMatch, fillAmount, 0)` makes the fill 0 if prices are incompatible. This is the key privacy mechanism -- the fill either happens or it does not, and nobody can tell which.

4. **Amount update:** `FHE.sub(amount, actualFill)` reduces both orders by the fill amount. If `actualFill` is 0 (incompatible prices), the subtraction has no effect.

5. **ACL refresh:** New handles from `FHE.sub()` need fresh ACL grants.

### 2.5 What Is Public vs. Private

This is a critical distinction for any confidential DeFi protocol:

| Information | Visibility | Why |
|---|---|---|
| Order exists | Public | Transaction is on-chain |
| Trader address | Public | `msg.sender` is always visible |
| Buy/sell direction | Public | Stored as plaintext `bool` for matching efficiency |
| Order price | Private | Encrypted `euint64` |
| Order amount | Private | Encrypted `euint64` |
| Fill amount | Private | Computed with `FHE.min` and `FHE.select` |
| Whether match succeeded | Private | `actualFill` could be 0 or non-zero; only traders know |
| Order cancellation | Public | Changes `isActive` flag |

The `OrderMatched` event is emitted regardless of whether the match actually filled. An observer sees that a match was attempted between two order IDs, but not whether it succeeded or how much was filled.

### 2.6 Order Cancellation

Traders can cancel their own orders:

```solidity
function cancelOrder(uint256 orderId) external {
    require(orderId < orderCount, "Invalid order");
    require(_orders[orderId].isActive, "Order not active");
    require(_orders[orderId].trader == msg.sender, "Not your order");

    _orders[orderId].isActive = false;
    activeOrderCount--;

    emit OrderCancelled(orderId, msg.sender);
}
```

Cancellation is a plaintext operation -- it only flips a boolean. The encrypted price and amount remain in storage but are no longer matchable.

---

## 3. Privacy Trade-offs in DeFi

### 3.1 What You CAN Keep Private

With FHE, the following can remain encrypted:

- **Amounts:** Collateral deposits, borrow amounts, order quantities, fill sizes
- **Prices:** Limit order prices, liquidation thresholds, interest amounts
- **Balances:** User balances, collateral ratios, debt levels
- **Comparisons:** Whether a borrow is within LTV, whether orders matched

### 3.2 What You CANNOT Hide

Even with FHE, some information is inherently public on any blockchain:

- **Addresses:** `msg.sender` is always visible. Everyone knows who is interacting with the protocol.
- **Function calls:** Which function was called and when. An observer knows you called `borrow()` even if they do not know the amount.
- **Timing:** When you placed an order, when you repaid, how frequently you interact.
- **Gas usage:** Different FHE operations use different gas amounts, which can sometimes leak information about the code path taken.
- **Transaction count:** How many orders a trader has placed.

### 3.3 Hybrid Approaches

In practice, confidential DeFi protocols use a hybrid approach:

```
Hybrid Privacy Model:
- Encrypted: amounts, prices, balances (the "what")
- Public: addresses, function calls, timing (the "who" and "when")
- Semi-public: aggregated metrics (total TVL, order count)
```

This is analogous to traditional finance:
- Your bank knows your balance (encrypted on-chain)
- The public knows you have a bank account (address interaction)
- Aggregate statistics are published (total deposits)

### 3.4 Compliance Considerations

A common concern with privacy protocols is regulatory compliance. FHE-based DeFi can support compliance through:

1. **KYC gates:** Require address whitelisting before interaction (plaintext check before encrypted operations)
2. **Auditor access:** Grant specific addresses ACL access to encrypted balances via `FHE.allow(handle, auditor)`
3. **Threshold reporting:** Use FHE comparison to flag large transactions without revealing exact amounts
4. **Selective disclosure:** Users can choose to make their own balances publicly decryptable

---

## 4. Advanced DeFi Concepts with FHE

### 4.1 Encrypted AMMs (Concept)

An Automated Market Maker (AMM) with encrypted reserves is theoretically possible:

```
Standard AMM: x * y = k (constant product formula)
  - x = reserve of token A (public)
  - y = reserve of token B (public)
  - k = constant (public)

Encrypted AMM:
  - x = euint64 reserve of token A (encrypted)
  - y = euint64 reserve of token B (encrypted)
  - k check: FHE.mul(newX, newY) >= FHE.mul(oldX, oldY)
```

Challenges:
- The constant product formula requires `FHE.mul()` which is expensive
- Slippage protection needs encrypted comparison with user's minimum output
- Price oracle extraction is impossible (which is actually a feature -- prevents oracle manipulation)

### 4.2 Private Yield Farming

Yield farming with encrypted staking amounts:
- Users stake encrypted amounts
- Rewards are calculated using FHE arithmetic
- Compound interest uses iterative FHE operations
- Share-based models (like ERC-4626) work well because share prices can be public while individual holdings are private

### 4.3 Confidential Insurance Protocols

Insurance with encrypted premiums and claims:
- Premium amounts are encrypted (prevents adverse selection based on premium size)
- Claim amounts are encrypted (prevents targeting of high-value policies)
- Payout decisions use FHE comparison against policy limits
- Risk pools have encrypted total exposure

### 4.4 Future Standards

The FHE community is working on standards for confidential tokens and DeFi:
- **Confidential ERC-20:** Encrypted balances with standard transfer interface (already demonstrated in Module 11)
- **Encrypted vaults:** ERC-4626-style vaults with encrypted deposits and withdrawals
- **Cross-protocol composability:** How encrypted values move between DeFi protocols

---

## 5. Production Considerations

### 5.1 Gas Costs

FHE operations are significantly more expensive than plaintext operations:

```
Approximate FHE Gas Costs (relative):
- FHE.add()     ~50,000 gas
- FHE.sub()     ~50,000 gas
- FHE.mul()     ~100,000 gas
- FHE.div()     ~150,000 gas
- FHE.le()      ~50,000 gas
- FHE.select()  ~50,000 gas
- FHE.min()     ~100,000 gas

A single borrow() call in ConfidentialLending:
- FHE.fromExternal()  ~100,000
- FHE.add()           ~50,000
- FHE.div()           ~150,000
- FHE.le()            ~50,000
- FHE.select()        ~50,000
- ACL operations       ~50,000
Total:                ~450,000 gas

Compare to a plaintext lending protocol:
- SSTORE + arithmetic  ~30,000 gas
```

This 10-15x gas overhead is the cost of privacy. Optimization strategies include:
- Batching operations (e.g., accrue interest for multiple users in one transaction)
- Reducing FHE operations per function call
- Using smaller encrypted types (`euint8`, `euint16`) where the value range allows
- Caching intermediate FHE results across function calls

### 5.2 Liquidation Challenges

Liquidation in confidential lending is fundamentally harder:

```
Traditional Lending:
- Anyone can check if a position is undercollateralized
- Liquidation bots monitor all positions in real-time
- Immediate liquidation when health factor < 1

Confidential Lending:
- Nobody can see collateral or borrow amounts
- Cannot run off-chain health checks
- Liquidation must be triggered differently
```

Possible approaches:
1. **Self-reporting:** Users call a function that checks their own health factor using FHE and triggers liquidation if needed (relies on user cooperation)
2. **Keeper incentives:** A keeper calls `checkHealth(user)` which does the FHE check on-chain and grants a reward if liquidation occurs
3. **Time-based checks:** Interest accrual also checks health factor
4. **Threshold decryption:** After a certain condition, the health factor is made publicly decryptable

### 5.3 Oracle Integration

Price oracles with encrypted values present unique challenges:

- Chainlink feeds provide public prices -- these can be wrapped into `euint64` with `FHE.asEuint64(oraclePrice)`
- The oracle price itself may leak information about positions (if you know the price and the LTV, you can estimate ranges)
- Private oracle feeds (encrypted oracle responses) are an active research area

### 5.4 Composability

One of DeFi's greatest strengths is composability -- protocols building on each other. With FHE:

- Encrypted values can be passed between contracts if ACL is properly managed
- `FHE.allow(handle, otherContract)` grants another contract access to an encrypted value
- This enables lending protocol -> DEX -> yield aggregator pipelines with encrypted amounts
- Standard interfaces are needed for encrypted value passing (emerging area)

---

## 6. Full Code Walkthrough: ConfidentialLending.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint16, euint32, euint64, ebool, externalEuint64, externalEuint32}
    from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract ConfidentialLending is ZamaEthereumConfig {
    // Error codes for the LastError pattern
    enum ErrorCode {
        NO_ERROR,
        INSUFFICIENT_COLLATERAL,
        INSUFFICIENT_BORROW_BALANCE,
        INSUFFICIENT_COLLATERAL_FOR_WITHDRAWAL
    }

    // Encrypted balances per user
    mapping(address => euint64) private _collateral;
    mapping(address => euint64) private _borrowBalance;
    mapping(address => bool) private _initialized;
    mapping(address => ErrorCode) public lastError;

    address public owner;

    // Events for all operations
    event Deposited(address indexed user);
    event Withdrawn(address indexed user);
    event Borrowed(address indexed user);
    event Repaid(address indexed user);
    event InterestAccrued(address indexed user);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Initialize user balances to encrypted 0
    function _initUser(address user) internal { ... }

    // Deposit encrypted collateral
    function deposit(externalEuint64 encAmount, bytes calldata inputProof) external { ... }

    // Borrow with 50% LTV check (silent failure via FHE.select)
    function borrow(externalEuint64 encAmount, bytes calldata inputProof) external { ... }

    // Repay borrow (capped to balance via FHE.min)
    function repay(externalEuint64 encAmount, bytes calldata inputProof) external { ... }

    // Withdraw with collateral sufficiency check
    function withdraw(externalEuint64 encAmount, bytes calldata inputProof) external { ... }

    // Accrue 10% interest (owner only)
    function accrueInterest(address user) external onlyOwner { ... }

    // View functions returning encrypted handles
    function getCollateral() external view returns (euint64) { ... }
    function getBorrowBalance() external view returns (euint64) { ... }
}
```

The contract has 8 main functions:
1. `_initUser()` -- Internal initialization
2. `deposit()` -- Add collateral
3. `borrow()` -- Take a loan (with LTV check)
4. `repay()` -- Reduce loan (capped to balance)
5. `withdraw()` -- Remove collateral (with safety check)
6. `accrueInterest()` -- Add 10% interest (owner)
7. `getCollateral()` -- Read encrypted collateral handle
8. `getBorrowBalance()` -- Read encrypted borrow handle

---

## 7. Full Code Walkthrough: EncryptedOrderBook.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint16, euint32, euint64, ebool, externalEuint64, externalEuint32}
    from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedOrderBook is ZamaEthereumConfig {
    struct Order {
        address trader;
        euint64 price;
        euint64 amount;
        bool isBuy;
        bool isActive;
    }

    mapping(uint256 => Order) private _orders;
    uint256 public orderCount;
    uint256 public activeOrderCount;
    uint256 public constant MAX_ACTIVE_ORDERS = 50;

    address public owner;

    event OrderSubmitted(uint256 indexed orderId, address indexed trader, bool isBuy);
    event OrderMatched(uint256 indexed buyOrderId, uint256 indexed sellOrderId);
    event OrderCancelled(uint256 indexed orderId, address indexed trader);

    // Submit buy order with encrypted price + amount
    function submitBuyOrder(
        externalEuint64 encPrice, bytes calldata priceProof,
        externalEuint64 encAmount, bytes calldata amountProof
    ) external { ... }

    // Submit sell order (same signature)
    function submitSellOrder(...) external { ... }

    // Match a buy against a sell (owner/keeper only)
    function matchOrders(uint256 buyOrderId, uint256 sellOrderId) external onlyOwner { ... }

    // Cancel own order
    function cancelOrder(uint256 orderId) external { ... }

    // Read encrypted handles
    function getOrderAmount(uint256 orderId) external view returns (euint64) { ... }
    function getOrderPrice(uint256 orderId) external view returns (euint64) { ... }
}
```

The contract has 9 main functions:
1. `submitBuyOrder()` -- Place encrypted buy order
2. `submitSellOrder()` -- Place encrypted sell order
3. `matchOrders()` -- Match two orders (owner)
4. `cancelOrder()` -- Cancel own order
5. `getOrderAmount()` -- Read encrypted amount handle
6. `getOrderPrice()` -- Read encrypted price handle
7. `isOrderActive()` -- Check if order is active
8. `getOrderTrader()` -- Get trader address
9. `isOrderBuy()` -- Check order direction

---

## 8. Testing Confidential DeFi

Testing FHE-based DeFi requires the same patterns from earlier modules:

```typescript
// Encrypt input
const enc = await fhevm
  .createEncryptedInput(contractAddress, signer.address)
  .add64(amount)
  .encrypt();

// Call function
await contract.connect(signer).deposit(enc.handles[0], enc.inputProof);

// Decrypt and verify
const handle = await contract.connect(signer).getCollateral();
const value = await fhevm.userDecryptEuint(
  FhevmType.euint64, handle, contractAddress, signer
);
expect(value).to.equal(expectedAmount);
```

Key testing patterns for DeFi:
- **Test the happy path:** Deposit, borrow within limits, repay, withdraw
- **Test silent failures:** Borrow over limit, withdraw too much -- verify balance unchanged
- **Test multi-user isolation:** One user's actions should not affect another
- **Test interest accrual:** Verify arithmetic is correct across multiple accruals
- **Test edge cases:** Repay more than owed, withdraw all collateral with no borrow

---

## Summary

- **Confidential lending** encrypts collateral and borrow balances, enforcing LTV with `FHE.le()` and `FHE.select()`
- **Encrypted order books** hide prices and amounts while allowing on-chain matching with `FHE.ge()` and `FHE.min()`
- **The LastError pattern** avoids information leakage by using `FHE.select()` instead of `revert`
- **Privacy trade-offs:** Amounts and prices can be private; addresses, timing, and function calls cannot
- **Gas costs** are 10-15x higher than plaintext DeFi -- optimization matters
- **Liquidation** in confidential lending requires new mechanisms (keeper-based, self-reporting)
- **Composability** between encrypted DeFi protocols requires careful ACL management
- **Real-world DeFi** stands to benefit enormously: eliminating front-running, MEV extraction, and information asymmetry
- FHE-based DeFi is not theoretical -- the contracts in this module are functional and testable today
