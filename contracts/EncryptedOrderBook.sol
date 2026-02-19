// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint64, ebool, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title EncryptedOrderBook - Module 18: Privacy-preserving order book
/// @notice Users submit encrypted limit orders (buy/sell) with encrypted prices and amounts.
///         An owner/keeper can match orders without revealing prices or amounts.
///         Only the existence of orders, trader addresses, and buy/sell direction are public.
///         Prices, amounts, and fill quantities remain encrypted throughout.
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

    // --- Events ---
    event OrderSubmitted(uint256 indexed orderId, address indexed trader, bool isBuy);
    event OrderMatched(uint256 indexed buyOrderId, uint256 indexed sellOrderId);
    event OrderCancelled(uint256 indexed orderId, address indexed trader);

    // --- Modifiers ---
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Submit a buy order with encrypted price and amount
    /// @param encPrice The encrypted limit price
    /// @param priceProof The proof for the encrypted price
    /// @param encAmount The encrypted order amount
    /// @param amountProof The proof for the encrypted amount
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

    /// @notice Submit a sell order with encrypted price and amount
    /// @param encPrice The encrypted limit price
    /// @param priceProof The proof for the encrypted price
    /// @param encAmount The encrypted order amount
    /// @param amountProof The proof for the encrypted amount
    function submitSellOrder(
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
        _orders[orderId].isBuy = false;
        _orders[orderId].isActive = true;

        FHE.allowThis(_orders[orderId].price);
        FHE.allow(_orders[orderId].price, msg.sender);
        FHE.allowThis(_orders[orderId].amount);
        FHE.allow(_orders[orderId].amount, msg.sender);

        activeOrderCount++;

        emit OrderSubmitted(orderId, msg.sender, false);
    }

    /// @notice Match a buy order against a sell order (owner/keeper only)
    /// @dev Checks if buyPrice >= sellPrice. If so, fills min(buyAmount, sellAmount).
    ///      If prices do not match, amounts remain unchanged (no revert).
    ///      The match event is emitted regardless, but amounts stay encrypted.
    /// @param buyOrderId The ID of the buy order
    /// @param sellOrderId The ID of the sell order
    function matchOrders(uint256 buyOrderId, uint256 sellOrderId) external onlyOwner {
        require(buyOrderId < orderCount, "Invalid buy order");
        require(sellOrderId < orderCount, "Invalid sell order");
        require(_orders[buyOrderId].isActive, "Buy order not active");
        require(_orders[sellOrderId].isActive, "Sell order not active");
        require(_orders[buyOrderId].isBuy, "Not a buy order");
        require(!_orders[sellOrderId].isBuy, "Not a sell order");

        // Check if buy price >= sell price (orders are compatible)
        ebool canMatch = FHE.ge(_orders[buyOrderId].price, _orders[sellOrderId].price);

        // Calculate fill amount: min of both order amounts
        euint64 fillAmount = FHE.min(_orders[buyOrderId].amount, _orders[sellOrderId].amount);

        // If canMatch is false, fillAmount becomes 0 (no actual fill)
        euint64 actualFill = FHE.select(canMatch, fillAmount, FHE.asEuint64(0));

        // Update remaining amounts
        _orders[buyOrderId].amount = FHE.sub(_orders[buyOrderId].amount, actualFill);
        _orders[sellOrderId].amount = FHE.sub(_orders[sellOrderId].amount, actualFill);

        // Update ACL for new amount handles
        FHE.allowThis(_orders[buyOrderId].amount);
        FHE.allow(_orders[buyOrderId].amount, _orders[buyOrderId].trader);
        FHE.allowThis(_orders[sellOrderId].amount);
        FHE.allow(_orders[sellOrderId].amount, _orders[sellOrderId].trader);

        emit OrderMatched(buyOrderId, sellOrderId);
    }

    /// @notice Cancel an order (only the trader who placed it)
    /// @param orderId The ID of the order to cancel
    function cancelOrder(uint256 orderId) external {
        require(orderId < orderCount, "Invalid order");
        require(_orders[orderId].isActive, "Order not active");
        require(_orders[orderId].trader == msg.sender, "Not your order");

        _orders[orderId].isActive = false;
        activeOrderCount--;

        emit OrderCancelled(orderId, msg.sender);
    }

    /// @notice Get the encrypted amount handle for an order
    /// @dev Only the trader who placed the order has ACL access to decrypt
    /// @param orderId The ID of the order
    function getOrderAmount(uint256 orderId) external view returns (euint64) {
        require(orderId < orderCount, "Invalid order");
        return _orders[orderId].amount;
    }

    /// @notice Get the encrypted price handle for an order
    /// @param orderId The ID of the order
    function getOrderPrice(uint256 orderId) external view returns (euint64) {
        require(orderId < orderCount, "Invalid order");
        return _orders[orderId].price;
    }

    /// @notice Check if an order is active
    /// @param orderId The ID of the order
    function isOrderActive(uint256 orderId) external view returns (bool) {
        require(orderId < orderCount, "Invalid order");
        return _orders[orderId].isActive;
    }

    /// @notice Get the trader address for an order
    /// @param orderId The ID of the order
    function getOrderTrader(uint256 orderId) external view returns (address) {
        require(orderId < orderCount, "Invalid order");
        return _orders[orderId].trader;
    }

    /// @notice Check if an order is a buy order
    /// @param orderId The ID of the order
    function isOrderBuy(uint256 orderId) external view returns (bool) {
        require(orderId < orderCount, "Invalid order");
        return _orders[orderId].isBuy;
    }
}
