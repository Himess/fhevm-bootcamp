# Module 08: Exercise — Encrypted Marketplace with Conditional Logic

## Objective

Build an encrypted marketplace contract that uses `FHE.select()` extensively for pricing tiers, inventory management, and conditional order fulfillment.

---

## Task: EncryptedMarketplace

Create a contract where:

1. Sellers list items with encrypted prices and encrypted quantities
2. Buyers place orders — the order only succeeds if the buyer has enough balance AND stock is available
3. A tiered discount is applied based on the quantity ordered
4. All logic must use `FHE.select()` — no plaintext branching on encrypted values

---

## Starter Code

### `contracts/EncryptedMarketplace.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedMarketplace is ZamaEthereumConfig {
    struct Item {
        address seller;
        euint64 pricePerUnit;
        euint32 stock;
        bool exists;
    }

    mapping(uint256 => Item) private _items;
    mapping(address => euint64) private _balances;
    mapping(address => bool) private _balInitialized;
    uint256 public nextItemId;

    function _initBalance(address user) internal {
        if (!_balInitialized[user]) {
            _balances[user] = FHE.asEuint64(0);
            FHE.allowThis(_balances[user]);
            FHE.allow(_balances[user], user);
            _balInitialized[user] = true;
        }
    }

    function deposit(uint64 amount) public {
        _initBalance(msg.sender);
        _balances[msg.sender] = FHE.add(_balances[msg.sender], FHE.asEuint64(amount));
        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);
    }

    function listItem(uint64 pricePerUnit, uint32 stock) public {
        uint256 itemId = nextItemId++;
        _items[itemId] = Item({
            seller: msg.sender,
            pricePerUnit: FHE.asEuint64(pricePerUnit),
            stock: FHE.asEuint32(stock),
            exists: true
        });
        FHE.allowThis(_items[itemId].pricePerUnit);
        FHE.allowThis(_items[itemId].stock);
    }

    /// @notice Buy `quantity` units of item `itemId`
    function buyItem(uint256 itemId, uint32 quantity) public {
        require(_items[itemId].exists, "Item not found");
        _initBalance(msg.sender);
        _initBalance(_items[itemId].seller);

        euint32 qty = FHE.asEuint32(quantity);

        // TODO Step 1: Calculate discount tier using nested FHE.select()
        // qty >= 100 -> 20% discount (multiplier = 80)
        // qty >= 50  -> 10% discount (multiplier = 90)
        // qty >= 10  -> 5% discount (multiplier = 95)
        // qty < 10   -> no discount (multiplier = 100)

        // TODO Step 2: Calculate total cost
        // totalCost = (pricePerUnit * quantity * multiplier) / 100

        // TODO Step 3: Check conditions with FHE.and()
        // hasStock = stock >= quantity
        // hasFunds = balance >= totalCost
        // valid = hasStock AND hasFunds

        // TODO Step 4: Conditional updates with FHE.select()
        // If valid: deduct from buyer, add to seller, reduce stock
        // If invalid: keep everything unchanged

        // TODO Step 5: ACL updates
    }

    function getBalance() public view returns (euint64) {
        require(FHE.isSenderAllowed(_balances[msg.sender]), "No access");
        return _balances[msg.sender];
    }
}
```

---

## Hints

<details>
<summary>Hint 1: Discount tier with nested selects</summary>

```solidity
euint64 multiplier = FHE.asEuint64(100);
multiplier = FHE.select(FHE.ge(qty, FHE.asEuint32(10)), FHE.asEuint64(95), multiplier);
multiplier = FHE.select(FHE.ge(qty, FHE.asEuint32(50)), FHE.asEuint64(90), multiplier);
multiplier = FHE.select(FHE.ge(qty, FHE.asEuint32(100)), FHE.asEuint64(80), multiplier);
```
</details>

<details>
<summary>Hint 2: Total cost calculation</summary>

```solidity
euint64 baseTotal = FHE.mul(_items[itemId].pricePerUnit, FHE.asEuint64(quantity));
euint64 discounted = FHE.mul(baseTotal, multiplier);
euint64 totalCost = FHE.div(discounted, 100);
```
</details>

<details>
<summary>Hint 3: Conditional updates</summary>

```solidity
ebool hasStock = FHE.ge(_items[itemId].stock, qty);
ebool hasFunds = FHE.ge(_balances[msg.sender], totalCost);
ebool valid = FHE.and(hasStock, hasFunds);

_balances[msg.sender] = FHE.select(valid,
    FHE.sub(_balances[msg.sender], totalCost), _balances[msg.sender]);
_balances[_items[itemId].seller] = FHE.select(valid,
    FHE.add(_balances[_items[itemId].seller], totalCost), _balances[_items[itemId].seller]);
_items[itemId].stock = FHE.select(valid,
    FHE.sub(_items[itemId].stock, qty), _items[itemId].stock);

FHE.allowThis(_balances[msg.sender]);
FHE.allow(_balances[msg.sender], msg.sender);
FHE.allowThis(_balances[_items[itemId].seller]);
FHE.allow(_balances[_items[itemId].seller], _items[itemId].seller);
FHE.allowThis(_items[itemId].stock);
```
</details>

---

## Bonus Challenges

1. **Add a refund function** using `FHE.select()` to only refund if the seller has enough balance.
2. **Add quantity limits** — Clamp the quantity to max 200 per order using `FHE.min()`.
3. **Add an `isOrderValid` function** returning `ebool` without executing the order.

---

## Success Criteria

- [ ] Contract compiles without errors
- [ ] Tiered discount uses nested `FHE.select()` calls
- [ ] Order validation combines conditions with `FHE.and()`
- [ ] All updates use `FHE.select()` for conditional execution
- [ ] No `if` branching on encrypted values
- [ ] All encrypted state updates include proper ACL calls
