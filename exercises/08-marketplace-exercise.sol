// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Exercise 8: Encrypted Marketplace with Conditional Logic
/// @notice Complete the TODOs to implement a marketplace using FHE.select()
contract EncryptedMarketplaceExercise is ZamaEthereumConfig {
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

    /// @notice Buy quantity units of item itemId
    function buyItem(uint256 itemId, uint32 quantity) public {
        require(_items[itemId].exists, "Item not found");
        _initBalance(msg.sender);
        _initBalance(_items[itemId].seller);

        euint32 qty = FHE.asEuint32(quantity);

        // TODO 1: Calculate discount tier using nested FHE.select()
        // qty >= 100 -> 20% discount (multiplier = 80)
        // qty >= 50  -> 10% discount (multiplier = 90)
        // qty >= 10  -> 5% discount  (multiplier = 95)
        // qty < 10   -> no discount   (multiplier = 100)

        // TODO 2: Calculate total cost
        // totalCost = (pricePerUnit * quantity * multiplier) / 100

        // TODO 3: Check conditions with FHE.and()
        // hasStock = stock >= quantity
        // hasFunds = balance >= totalCost
        // valid = hasStock AND hasFunds

        // TODO 4: Conditional updates with FHE.select()
        // If valid: deduct from buyer, add to seller, reduce stock
        // If invalid: keep everything unchanged

        // TODO 5: ACL updates for all modified encrypted values
    }

    function getBalance() public view returns (euint64) {
        require(FHE.isSenderAllowed(_balances[msg.sender]), "No access");
        return _balances[msg.sender];
    }

    function itemExists(uint256 itemId) public view returns (bool) {
        return _items[itemId].exists;
    }
}
