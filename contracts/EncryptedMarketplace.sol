// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title EncryptedMarketplace - Module 08: Conditional logic with FHE.select()
/// @notice Marketplace with encrypted prices, stock, balances, and tiered discounts
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

    event ItemListed(uint256 indexed itemId, address indexed seller);
    event OrderPlaced(uint256 indexed itemId, address indexed buyer, uint32 quantity);

    function _initBalance(address user) internal {
        if (!_balInitialized[user]) {
            _balances[user] = FHE.asEuint64(0);
            FHE.allowThis(_balances[user]);
            FHE.allow(_balances[user], user);
            _balInitialized[user] = true;
        }
    }

    /// @notice Deposit funds (plaintext amount for simplicity)
    function deposit(uint64 amount) public {
        _initBalance(msg.sender);
        _balances[msg.sender] = FHE.add(_balances[msg.sender], FHE.asEuint64(amount));
        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);
    }

    /// @notice List an item for sale
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
        emit ItemListed(itemId, msg.sender);
    }

    /// @notice Buy quantity units of item itemId with tiered discount
    function buyItem(uint256 itemId, uint32 quantity) public {
        require(_items[itemId].exists, "Item not found");
        address seller = _items[itemId].seller;
        _initBalance(msg.sender);
        _initBalance(seller);

        euint64 totalCost = _computeCost(itemId, quantity);
        euint32 qty = FHE.asEuint32(quantity);

        // Check conditions
        ebool hasStock = FHE.ge(_items[itemId].stock, qty);
        ebool hasFunds = FHE.ge(_balances[msg.sender], totalCost);
        ebool valid = FHE.and(hasStock, hasFunds);

        // Conditional updates with FHE.select()
        _balances[msg.sender] = FHE.select(valid,
            FHE.sub(_balances[msg.sender], totalCost), _balances[msg.sender]);
        _balances[seller] = FHE.select(valid,
            FHE.add(_balances[seller], totalCost), _balances[seller]);
        _items[itemId].stock = FHE.select(valid,
            FHE.sub(_items[itemId].stock, qty), _items[itemId].stock);

        // ACL updates
        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);
        FHE.allowThis(_balances[seller]);
        FHE.allow(_balances[seller], seller);
        FHE.allowThis(_items[itemId].stock);

        emit OrderPlaced(itemId, msg.sender, quantity);
    }

    /// @dev Compute discounted total cost for an order
    function _computeCost(uint256 itemId, uint32 quantity) internal returns (euint64) {
        euint32 qty = FHE.asEuint32(quantity);

        // Tiered discount using nested FHE.select()
        euint64 multiplier = FHE.asEuint64(100);
        multiplier = FHE.select(FHE.ge(qty, FHE.asEuint32(10)), FHE.asEuint64(95), multiplier);
        multiplier = FHE.select(FHE.ge(qty, FHE.asEuint32(50)), FHE.asEuint64(90), multiplier);
        multiplier = FHE.select(FHE.ge(qty, FHE.asEuint32(100)), FHE.asEuint64(80), multiplier);

        // Total cost = (price * quantity * multiplier) / 100
        euint64 baseTotal = FHE.mul(_items[itemId].pricePerUnit, FHE.asEuint64(quantity));
        euint64 discounted = FHE.mul(baseTotal, multiplier);
        return FHE.div(discounted, 100);
    }

    /// @notice Withdraw funds from marketplace balance
    /// @dev Uses FHE.select to transfer 0 on insufficient balance (no revert = no info leak)
    function withdraw(uint64 amount) external {
        _initBalance(msg.sender);
        euint64 encAmount = FHE.asEuint64(amount);
        ebool hasFunds = FHE.ge(_balances[msg.sender], encAmount);
        _balances[msg.sender] = FHE.select(hasFunds,
            FHE.sub(_balances[msg.sender], encAmount), _balances[msg.sender]);
        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);
    }

    /// @notice Get own encrypted balance
    function getBalance() public view returns (euint64) {
        require(FHE.isSenderAllowed(_balances[msg.sender]), "No access");
        return _balances[msg.sender];
    }

    /// @notice Check if item exists
    function itemExists(uint256 itemId) public view returns (bool) {
        return _items[itemId].exists;
    }
}
