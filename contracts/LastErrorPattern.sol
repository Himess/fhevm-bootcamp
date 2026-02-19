// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint8, euint64, ebool, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title LastErrorPattern - Module 17: Encrypted error feedback without reverts
/// @notice Demonstrates the LastError pattern: instead of reverting on encrypted condition
///         failures (which would leak information), the contract stores an encrypted error
///         code per user. The user can decrypt their own error code to learn what happened.
///
/// @dev Error codes:
///   0 = SUCCESS          -- Operation completed successfully
///   1 = INSUFFICIENT_BALANCE -- Sender does not have enough tokens
///   2 = AMOUNT_TOO_LARGE -- Transfer amount exceeds the per-transfer cap
///   3 = SELF_TRANSFER    -- Sender and recipient are the same address
contract LastErrorPattern is ZamaEthereumConfig {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint64 public totalSupply;
    address public owner;

    /// @dev Maximum transfer amount per transaction (plaintext cap for gas reasons)
    uint64 public constant MAX_TRANSFER = 1_000_000;

    mapping(address => euint64) private _balances;

    /// @dev Encrypted error code per user -- the core of the LastError pattern
    mapping(address => euint8) private _lastError;

    event Transfer(address indexed from, address indexed to);
    event Mint(address indexed to, uint64 amount);
    event ErrorCleared(address indexed user);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        decimals = 6;
        owner = msg.sender;
    }

    /// @notice Mint tokens to an address (plaintext amount, only owner)
    function mint(address to, uint64 amount) external onlyOwner {
        totalSupply += amount;
        _balances[to] = FHE.add(_balances[to], FHE.asEuint64(amount));
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);
        emit Mint(to, amount);
    }

    /// @notice Transfer encrypted amount to recipient using the LastError pattern
    /// @dev This function NEVER reverts based on encrypted conditions. Instead:
    ///      - If balance < amount: sets error 1, transfers 0
    ///      - If amount > MAX_TRANSFER: sets error 2, transfers 0
    ///      - If to == msg.sender: sets error 3, transfers 0 (plaintext check)
    ///      - On success: sets error 0, transfers the amount
    /// @param encAmount Encrypted transfer amount
    /// @param inputProof Proof for the encrypted input
    /// @param to Recipient address
    function transfer(externalEuint64 encAmount, bytes calldata inputProof, address to) external {
        euint64 amount = FHE.fromExternal(encAmount, inputProof);

        // Check 1: Self-transfer (plaintext check -- addresses are public)
        // We still do this in FHE style to avoid branching on encrypted state
        ebool isSelfTransfer = FHE.asEbool(msg.sender == to);

        // Check 2: Amount exceeds per-transfer cap
        ebool isTooLarge = FHE.gt(amount, FHE.asEuint64(MAX_TRANSFER));

        // Check 3: Insufficient balance
        ebool hasBalance = FHE.ge(_balances[msg.sender], amount);
        ebool insufficientBalance = FHE.not(hasBalance);

        // Determine error code using nested FHE.select:
        // Priority: self-transfer (3) > too large (2) > insufficient balance (1) > success (0)
        euint8 errorCode = FHE.asEuint8(0); // Start with SUCCESS

        // If insufficient balance, set error to 1
        errorCode = FHE.select(insufficientBalance, FHE.asEuint8(1), errorCode);

        // If amount too large, set error to 2 (overrides insufficient balance)
        errorCode = FHE.select(isTooLarge, FHE.asEuint8(2), errorCode);

        // If self-transfer, set error to 3 (highest priority)
        errorCode = FHE.select(isSelfTransfer, FHE.asEuint8(3), errorCode);

        // Store the error code for the sender
        _lastError[msg.sender] = errorCode;
        FHE.allowThis(_lastError[msg.sender]);
        FHE.allow(_lastError[msg.sender], msg.sender);

        // Determine actual transfer amount: 0 on any error, requested amount on success
        ebool isSuccess = FHE.eq(errorCode, FHE.asEuint8(0));
        euint64 actualAmount = FHE.select(isSuccess, amount, FHE.asEuint64(0));

        // Update balances
        _balances[msg.sender] = FHE.sub(_balances[msg.sender], actualAmount);
        _balances[to] = FHE.add(_balances[to], actualAmount);

        // Set ACL permissions
        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);

        emit Transfer(msg.sender, to);
    }

    /// @notice Get the encrypted error code for the caller
    /// @dev The user can decrypt this to learn the result of their last transfer.
    ///      Only the user themselves has ACL permission to decrypt.
    /// @return The encrypted error code (euint8)
    function getLastError() external view returns (euint8) {
        return _lastError[msg.sender];
    }

    /// @notice Clear the caller's error code (set to 0 = SUCCESS)
    /// @dev Good practice to clear before a new operation so stale errors do not confuse the user
    function clearError() external {
        _lastError[msg.sender] = FHE.asEuint8(0);
        FHE.allowThis(_lastError[msg.sender]);
        FHE.allow(_lastError[msg.sender], msg.sender);
        emit ErrorCleared(msg.sender);
    }

    /// @notice Get encrypted balance handle (ACL protected)
    function balanceOf(address account) external view returns (euint64) {
        return _balances[account];
    }

    /// @notice Check if an address has a stored error (plaintext convenience)
    /// @dev Returns true if the error handle is initialized (meaning at least one transfer was attempted)
    function hasError(address account) external view returns (bool) {
        return FHE.isInitialized(_lastError[account]);
    }
}
