// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint16, euint32, euint64, ebool, externalEuint64, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Exercise 18: Build a Confidential Swap
/// @notice Implement a simple token swap where users exchange encrypted amounts
///         of Token A and Token B at a fixed exchange rate enforced via FHE.
///         Uses the LastError pattern: insufficient balance does not revert.
contract ConfidentialSwap is ZamaEthereumConfig {
    // Exchange rate: 1 Token A = RATE Token B
    uint64 public constant RATE = 2;

    // Encrypted balances per user
    mapping(address => euint64) private _balanceA;
    mapping(address => euint64) private _balanceB;
    mapping(address => bool) private _initialized;

    address public owner;

    // Events
    event Deposited(address indexed user, bool isTokenA);
    event Swapped(address indexed user, bool isAtoB);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// TODO 1: Initialize a user's encrypted balances to 0
    /// - Check if user is already initialized (_initialized mapping)
    /// - If not: set _balanceA[user] = FHE.asEuint64(0)
    /// - FHE.allowThis() and FHE.allow(user) for _balanceA
    /// - Same for _balanceB
    /// - Set _initialized[user] = true
    function _initUser(address user) internal {
        // YOUR CODE HERE
    }

    /// TODO 2: Deposit Token A (encrypted amount)
    /// - Call _initUser(msg.sender)
    /// - Convert encAmount with FHE.fromExternal(encAmount, inputProof) -- 2 params
    /// - Add to _balanceA: FHE.add(_balanceA[msg.sender], amount)
    /// - FHE.allowThis() and FHE.allow(msg.sender) for the new balance
    /// - Emit Deposited(msg.sender, true)
    function depositTokenA(externalEuint64 encAmount, bytes calldata inputProof) external {
        // YOUR CODE HERE
    }

    /// TODO 3: Deposit Token B (encrypted amount)
    /// - Same pattern as depositTokenA but for _balanceB
    /// - Emit Deposited(msg.sender, false)
    function depositTokenB(externalEuint64 encAmount, bytes calldata inputProof) external {
        // YOUR CODE HERE
    }

    /// TODO 4: Swap Token A for Token B
    /// - Call _initUser(msg.sender)
    /// - Convert encAmountA with FHE.fromExternal()
    /// - Calculate outputB: FHE.mul(amountA, FHE.asEuint64(RATE))
    /// - Check balance: ebool hasFunds = FHE.ge(_balanceA[msg.sender], amountA)
    /// - Update _balanceA with FHE.select():
    ///   - If hasFunds: FHE.sub(_balanceA[msg.sender], amountA)
    ///   - If not: _balanceA[msg.sender] (unchanged)
    /// - Update _balanceB with FHE.select():
    ///   - If hasFunds: FHE.add(_balanceB[msg.sender], outputB)
    ///   - If not: _balanceB[msg.sender] (unchanged)
    /// - FHE.allowThis() and FHE.allow(msg.sender) for both balances
    /// - Emit Swapped(msg.sender, true)
    function swapAtoB(externalEuint64 encAmountA, bytes calldata inputProof) external {
        // YOUR CODE HERE
    }

    /// TODO 5: Swap Token B for Token A
    /// - Same pattern as swapAtoB but reversed
    /// - Calculate outputA: FHE.div(amountB, RATE)
    /// - Check _balanceB >= amountB
    /// - Update both balances with FHE.select()
    /// - Emit Swapped(msg.sender, false)
    function swapBtoA(externalEuint64 encAmountB, bytes calldata inputProof) external {
        // YOUR CODE HERE
    }

    /// @notice Get caller's encrypted Token A balance handle
    function getBalanceA() external view returns (euint64) {
        return _balanceA[msg.sender];
    }

    /// @notice Get caller's encrypted Token B balance handle
    function getBalanceB() external view returns (euint64) {
        return _balanceB[msg.sender];
    }

    /// @notice Check if a user has been initialized
    function isUserInitialized(address user) external view returns (bool) {
        return _initialized[user];
    }
}
