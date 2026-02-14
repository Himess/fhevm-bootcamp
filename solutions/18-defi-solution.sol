// SOLUTION: Module 18 - Confidential Swap
// This is the complete implementation of the ConfidentialSwap exercise.

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint16, euint32, euint64, ebool, externalEuint64, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ConfidentialSwap - Module 18: Privacy-preserving token swap
/// @notice Users exchange encrypted amounts of Token A and Token B
///         at a fixed exchange rate (1 A = 2 B) enforced via FHE.
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

    /// @dev Initialize a user's encrypted balances to 0
    function _initUser(address user) internal {
        if (!_initialized[user]) {
            _balanceA[user] = FHE.asEuint64(0);
            FHE.allowThis(_balanceA[user]);
            FHE.allow(_balanceA[user], user);

            _balanceB[user] = FHE.asEuint64(0);
            FHE.allowThis(_balanceB[user]);
            FHE.allow(_balanceB[user], user);

            _initialized[user] = true;
        }
    }

    /// @notice Deposit Token A (encrypted amount)
    /// @param encAmount The encrypted deposit amount
    /// @param inputProof The proof for the encrypted input
    function depositTokenA(externalEuint64 encAmount, bytes calldata inputProof) external {
        _initUser(msg.sender);

        euint64 amount = FHE.fromExternal(encAmount, inputProof);

        _balanceA[msg.sender] = FHE.add(_balanceA[msg.sender], amount);
        FHE.allowThis(_balanceA[msg.sender]);
        FHE.allow(_balanceA[msg.sender], msg.sender);

        emit Deposited(msg.sender, true);
    }

    /// @notice Deposit Token B (encrypted amount)
    /// @param encAmount The encrypted deposit amount
    /// @param inputProof The proof for the encrypted input
    function depositTokenB(externalEuint64 encAmount, bytes calldata inputProof) external {
        _initUser(msg.sender);

        euint64 amount = FHE.fromExternal(encAmount, inputProof);

        _balanceB[msg.sender] = FHE.add(_balanceB[msg.sender], amount);
        FHE.allowThis(_balanceB[msg.sender]);
        FHE.allow(_balanceB[msg.sender], msg.sender);

        emit Deposited(msg.sender, false);
    }

    /// @notice Swap Token A for Token B at fixed rate (1 A = 2 B)
    /// @dev If insufficient Token A balance, swap silently does nothing (LastError pattern)
    /// @param encAmountA The encrypted amount of Token A to swap
    /// @param inputProof The proof for the encrypted input
    function swapAtoB(externalEuint64 encAmountA, bytes calldata inputProof) external {
        _initUser(msg.sender);

        euint64 amountA = FHE.fromExternal(encAmountA, inputProof);

        // Calculate Token B output: amountA * RATE
        euint64 outputB = FHE.mul(amountA, FHE.asEuint64(RATE));

        // Check if user has enough Token A
        ebool hasFunds = FHE.ge(_balanceA[msg.sender], amountA);

        // Conditionally update balances
        _balanceA[msg.sender] = FHE.select(
            hasFunds,
            FHE.sub(_balanceA[msg.sender], amountA),
            _balanceA[msg.sender]
        );

        _balanceB[msg.sender] = FHE.select(
            hasFunds,
            FHE.add(_balanceB[msg.sender], outputB),
            _balanceB[msg.sender]
        );

        // Update ACL for new handles
        FHE.allowThis(_balanceA[msg.sender]);
        FHE.allow(_balanceA[msg.sender], msg.sender);
        FHE.allowThis(_balanceB[msg.sender]);
        FHE.allow(_balanceB[msg.sender], msg.sender);

        emit Swapped(msg.sender, true);
    }

    /// @notice Swap Token B for Token A at fixed rate (2 B = 1 A)
    /// @dev If insufficient Token B balance, swap silently does nothing (LastError pattern)
    /// @param encAmountB The encrypted amount of Token B to swap
    /// @param inputProof The proof for the encrypted input
    function swapBtoA(externalEuint64 encAmountB, bytes calldata inputProof) external {
        _initUser(msg.sender);

        euint64 amountB = FHE.fromExternal(encAmountB, inputProof);

        // Calculate Token A output: amountB / RATE
        euint64 outputA = FHE.div(amountB, RATE);

        // Check if user has enough Token B
        ebool hasFunds = FHE.ge(_balanceB[msg.sender], amountB);

        // Conditionally update balances
        _balanceB[msg.sender] = FHE.select(
            hasFunds,
            FHE.sub(_balanceB[msg.sender], amountB),
            _balanceB[msg.sender]
        );

        _balanceA[msg.sender] = FHE.select(
            hasFunds,
            FHE.add(_balanceA[msg.sender], outputA),
            _balanceA[msg.sender]
        );

        // Update ACL for new handles
        FHE.allowThis(_balanceA[msg.sender]);
        FHE.allow(_balanceA[msg.sender], msg.sender);
        FHE.allowThis(_balanceB[msg.sender]);
        FHE.allow(_balanceB[msg.sender], msg.sender);

        emit Swapped(msg.sender, false);
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
