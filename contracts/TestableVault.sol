// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint64, ebool, externalEuint32, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title TestableVault - Module 14: Multi-user encrypted vault for testing patterns
/// @notice Demonstrates all key patterns needed for comprehensive FHE contract testing:
///         per-user balances, owner-controlled limits, encrypted conditionals, and events.
/// @dev Every state mutation emits an event so tests can verify behavior without decrypting.
contract TestableVault is ZamaEthereumConfig {
    // ---------------------------------------------------------------
    // State
    // ---------------------------------------------------------------

    address public owner;
    euint64 internal _withdrawalLimit;

    mapping(address => euint64) internal _balances;

    /// @notice Total number of deposits across all users (plaintext counter for testing)
    uint256 public depositCount;

    /// @notice Total number of withdrawals across all users (plaintext counter for testing)
    uint256 public withdrawalCount;

    // ---------------------------------------------------------------
    // Events -- primary debugging tool for FHE contracts
    // ---------------------------------------------------------------

    event Deposited(address indexed user, uint256 depositIndex);
    event Withdrawn(address indexed user, uint256 withdrawalIndex);
    event WithdrawalLimitSet(address indexed setter);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ---------------------------------------------------------------
    // Custom errors -- better test assertions than require strings
    // ---------------------------------------------------------------

    error NotOwner(address caller);
    error ZeroAddressOwner();

    // ---------------------------------------------------------------
    // Modifiers
    // ---------------------------------------------------------------

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner(msg.sender);
        _;
    }

    // ---------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------

    constructor() {
        owner = msg.sender;

        // Initialize the withdrawal limit to max uint64 (no limit by default)
        _withdrawalLimit = FHE.asEuint64(type(uint64).max);
        FHE.allowThis(_withdrawalLimit);
        FHE.allow(_withdrawalLimit, msg.sender);
    }

    // ---------------------------------------------------------------
    // Core functions
    // ---------------------------------------------------------------

    /// @notice Deposit an encrypted amount into the caller's vault balance
    /// @param encAmount The encrypted deposit amount (euint64)
    /// @param inputProof The proof for the encrypted input
    function deposit(externalEuint64 encAmount, bytes calldata inputProof) external {
        euint64 amount = FHE.fromExternal(encAmount, inputProof);

        _balances[msg.sender] = FHE.add(_balances[msg.sender], amount);

        // ACL: contract can operate on the balance, user can read it
        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);

        depositCount++;
        emit Deposited(msg.sender, depositCount);
    }

    /// @notice Withdraw an encrypted amount from the caller's vault balance
    /// @dev Uses the select pattern: if the user has enough balance AND the amount
    ///      is within the withdrawal limit, the full amount is withdrawn.
    ///      Otherwise, 0 is withdrawn. This never reverts on encrypted conditions.
    /// @param encAmount The encrypted withdrawal amount (euint64)
    /// @param inputProof The proof for the encrypted input
    function withdraw(externalEuint64 encAmount, bytes calldata inputProof) external {
        euint64 amount = FHE.fromExternal(encAmount, inputProof);

        // Check 1: does the user have enough balance?
        ebool hasEnough = FHE.ge(_balances[msg.sender], amount);

        // Check 2: is the amount within the withdrawal limit?
        ebool withinLimit = FHE.le(amount, _withdrawalLimit);

        // Both conditions must be true
        ebool canWithdraw = FHE.and(hasEnough, withinLimit);

        // If either check fails, withdraw 0 instead (silent failure for privacy)
        euint64 withdrawAmount = FHE.select(canWithdraw, amount, FHE.asEuint64(0));

        _balances[msg.sender] = FHE.sub(_balances[msg.sender], withdrawAmount);

        // Update ACL
        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);

        withdrawalCount++;
        emit Withdrawn(msg.sender, withdrawalCount);
    }

    // ---------------------------------------------------------------
    // Owner functions
    // ---------------------------------------------------------------

    /// @notice Set a global withdrawal limit (encrypted)
    /// @dev Only the owner can set this. All users' withdrawals are capped by this limit.
    /// @param encLimit The encrypted withdrawal limit
    /// @param inputProof The proof for the encrypted input
    function setWithdrawalLimit(externalEuint64 encLimit, bytes calldata inputProof) external onlyOwner {
        _withdrawalLimit = FHE.fromExternal(encLimit, inputProof);
        FHE.allowThis(_withdrawalLimit);
        FHE.allow(_withdrawalLimit, msg.sender);

        emit WithdrawalLimitSet(msg.sender);
    }

    /// @notice Transfer ownership to a new address
    /// @param newOwner The address of the new owner
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddressOwner();
        address previousOwner = owner;
        owner = newOwner;

        // Grant the new owner permission to read the withdrawal limit
        FHE.allow(_withdrawalLimit, newOwner);

        emit OwnershipTransferred(previousOwner, newOwner);
    }

    // ---------------------------------------------------------------
    // View functions
    // ---------------------------------------------------------------

    /// @notice Get the caller's encrypted balance handle
    /// @dev Only the caller (who has ACL permission) can decrypt this
    /// @return The encrypted balance (euint64 handle)
    function getBalance() external view returns (euint64) {
        return _balances[msg.sender];
    }

    /// @notice Get a specific user's encrypted balance handle
    /// @dev Useful for the owner or other authorized parties
    /// @param user The address to query
    /// @return The encrypted balance (euint64 handle)
    function getBalanceOf(address user) external view returns (euint64) {
        return _balances[user];
    }

    /// @notice Get the encrypted withdrawal limit handle
    /// @dev Only the owner (who has ACL permission) can decrypt this
    /// @return The encrypted withdrawal limit (euint64 handle)
    function getWithdrawalLimit() external view returns (euint64) {
        return _withdrawalLimit;
    }
}
