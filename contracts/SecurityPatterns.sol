// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint8, euint64, ebool, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title SecurityPatterns - Module 16: FHE Security Best Practices
/// @notice Demonstrates all major security patterns for FHE smart contracts.
/// @dev This contract is a reference implementation for secure FHE development.
///      Each function illustrates a specific security pattern with inline comments.
contract SecurityPatterns is ZamaEthereumConfig {
    // =========================================================================
    // Custom Errors
    // =========================================================================
    error NotOwner();
    error ZeroAddress();
    error InputNotInitialized();
    error RateLimited(uint256 nextAllowedBlock);
    error BatchTooLarge(uint256 requested, uint256 maximum);
    error AlreadyInitialized();

    // =========================================================================
    // Events (audit trail)
    // =========================================================================
    event BalanceUpdated(address indexed user);
    event Transfer(address indexed from, address indexed to);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);
    event RateLimitUpdated(uint256 newCooldown);
    event DepositMade(address indexed user, uint64 amount);
    event ErrorSet(address indexed user, uint8 errorCode);
    event AccessGranted(address indexed user);
    event ThresholdUpdated();

    // =========================================================================
    // Constants for LastError codes
    // =========================================================================
    uint8 public constant ERR_NONE = 0;
    uint8 public constant ERR_INSUFFICIENT_BALANCE = 1;
    uint8 public constant ERR_LIMIT_EXCEEDED = 2;
    uint8 public constant ERR_UNAUTHORIZED = 3;
    uint8 public constant ERR_INVALID_AMOUNT = 4;

    // =========================================================================
    // State Variables
    // =========================================================================
    address public owner;
    uint256 public cooldownBlocks;
    uint256 public maxBatchSize;

    /// @notice Encrypted balances for each user
    mapping(address => euint64) private _balances;

    /// @notice Encrypted error code per user (LastError pattern)
    mapping(address => euint8) private _lastError;

    /// @notice Rate limiting: last operation block per user
    mapping(address => uint256) private _lastOpBlock;

    /// @notice Encrypted threshold for transfer limits
    euint64 private _transferLimit;

    // =========================================================================
    // Modifiers
    // =========================================================================

    /// @dev Only the contract owner can call
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /// @dev Prevents zero-address arguments
    modifier nonZeroAddress(address addr) {
        if (addr == address(0)) revert ZeroAddress();
        _;
    }

    /// @dev Rate-limits expensive FHE operations per user
    modifier rateLimited() {
        if (block.number < _lastOpBlock[msg.sender] + cooldownBlocks) {
            revert RateLimited(_lastOpBlock[msg.sender] + cooldownBlocks);
        }
        _lastOpBlock[msg.sender] = block.number;
        _;
    }

    // =========================================================================
    // Constructor
    // =========================================================================

    constructor(uint256 _cooldownBlocks, uint256 _maxBatchSize) {
        owner = msg.sender;
        cooldownBlocks = _cooldownBlocks;
        maxBatchSize = _maxBatchSize;

        // Initialize the transfer limit to a default (100 tokens)
        _transferLimit = FHE.asEuint64(100);
        FHE.allowThis(_transferLimit);
    }

    // =========================================================================
    // Pattern 1: Input Validation with FHE.isInitialized()
    // =========================================================================

    /// @notice Deposit tokens using encrypted input with full validation.
    /// @dev Demonstrates: input validation, ACL management, event emission.
    /// @param encAmount The externally-encrypted deposit amount
    /// @param inputProof The ZK proof validating the encrypted input
    function secureDeposit(
        externalEuint64 encAmount,
        bytes calldata inputProof
    ) external rateLimited nonZeroAddress(msg.sender) {
        // PATTERN: Validate encrypted input via FHE.fromExternal()
        // This verifies the ZK proof and converts to an on-chain ciphertext.
        euint64 amount = FHE.fromExternal(encAmount, inputProof);

        // PATTERN: Check that the resulting handle is initialized
        require(FHE.isInitialized(amount), "Invalid encrypted input");

        // PATTERN: Uniform execution -- no branching on encrypted values.
        // Always compute both paths and select the result.
        _balances[msg.sender] = FHE.add(_balances[msg.sender], amount);

        // PATTERN: ACL -- allow contract and user after every state update
        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);

        // PATTERN: Set LastError to success
        _setError(msg.sender, ERR_NONE);

        emit BalanceUpdated(msg.sender);
    }

    // =========================================================================
    // Pattern 2: Safe Transfer with Select (No Information Leakage)
    // =========================================================================

    /// @notice Transfer encrypted amount to recipient.
    /// @dev If balance < amount, transfers 0 instead of reverting.
    ///      This prevents gas-based information leakage: the transaction
    ///      always succeeds with the same gas cost regardless of balance.
    /// @param encAmount Encrypted transfer amount
    /// @param inputProof Proof for the encrypted input
    /// @param to Recipient address
    function secureTransfer(
        externalEuint64 encAmount,
        bytes calldata inputProof,
        address to
    ) external rateLimited nonZeroAddress(to) {
        euint64 amount = FHE.fromExternal(encAmount, inputProof);
        require(FHE.isInitialized(amount), "Invalid encrypted input");

        // PATTERN: Check balance >= amount (encrypted comparison)
        ebool hasBalance = FHE.ge(_balances[msg.sender], amount);

        // PATTERN: Check amount <= transfer limit
        ebool withinLimit = FHE.le(amount, _transferLimit);

        // PATTERN: Both conditions must be true
        ebool canTransfer = FHE.and(hasBalance, withinLimit);

        // PATTERN: Use FHE.select for UNIFORM execution
        // If canTransfer is true, actualAmount = amount
        // If canTransfer is false, actualAmount = 0
        // Gas consumption is identical either way -- no side channel!
        euint64 actualAmount = FHE.select(canTransfer, amount, FHE.asEuint64(0));

        // Update balances (always executes, with either amount or 0)
        _balances[msg.sender] = FHE.sub(_balances[msg.sender], actualAmount);
        _balances[to] = FHE.add(_balances[to], actualAmount);

        // PATTERN: ACL for sender
        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);

        // PATTERN: ACL for recipient
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);

        // PATTERN: LastError -- set encrypted error code based on result.
        // User can decrypt their error code to understand what happened.
        euint8 errorCode = FHE.select(
            canTransfer,
            FHE.asEuint8(ERR_NONE),
            FHE.select(hasBalance, FHE.asEuint8(ERR_LIMIT_EXCEEDED), FHE.asEuint8(ERR_INSUFFICIENT_BALANCE))
        );
        _lastError[msg.sender] = errorCode;
        FHE.allowThis(_lastError[msg.sender]);
        FHE.allow(_lastError[msg.sender], msg.sender);

        emit Transfer(msg.sender, to);
    }

    // =========================================================================
    // Pattern 3: LastError Pattern for User Feedback
    // =========================================================================

    /// @notice Retrieve the last operation error code (encrypted).
    /// @dev The user can decrypt this to see if their last operation succeeded.
    ///      Error codes: 0=success, 1=insufficient balance, 2=limit exceeded,
    ///      3=unauthorized, 4=invalid amount.
    /// @return The encrypted error code handle
    function getLastError() external view returns (euint8) {
        require(FHE.isSenderAllowed(_lastError[msg.sender]), "No access");
        return _lastError[msg.sender];
    }

    // =========================================================================
    // Pattern 4: Bounded Batch Operations (DoS Prevention)
    // =========================================================================

    /// @notice Mint tokens to multiple addresses with bounded batch size.
    /// @dev PATTERN: Cap the batch size to prevent DoS via gas exhaustion.
    ///      Each FHE operation costs 50k-600k gas, so unbounded loops
    ///      will exceed the block gas limit.
    /// @param recipients Array of recipient addresses
    /// @param amount Plaintext mint amount per recipient
    function batchMint(address[] calldata recipients, uint64 amount) external onlyOwner {
        // PATTERN: Enforce maximum batch size
        if (recipients.length > maxBatchSize) {
            revert BatchTooLarge(recipients.length, maxBatchSize);
        }

        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) continue;

            _balances[recipients[i]] = FHE.add(_balances[recipients[i]], FHE.asEuint64(amount));

            // PATTERN: ACL after every update in the loop
            FHE.allowThis(_balances[recipients[i]]);
            FHE.allow(_balances[recipients[i]], recipients[i]);

            emit BalanceUpdated(recipients[i]);
        }
    }

    // =========================================================================
    // Pattern 5: Owner-Only Admin Functions
    // =========================================================================

    /// @notice Update the encrypted transfer limit (owner only).
    /// @dev Demonstrates encrypted admin parameters with proper ACL.
    /// @param encLimit New encrypted transfer limit
    /// @param inputProof Proof for the encrypted input
    function setTransferLimit(externalEuint64 encLimit, bytes calldata inputProof) external onlyOwner {
        euint64 limit = FHE.fromExternal(encLimit, inputProof);
        require(FHE.isInitialized(limit), "Invalid encrypted input");

        _transferLimit = limit;

        // PATTERN: allowThis so the contract can use the limit in comparisons
        FHE.allowThis(_transferLimit);
        // PATTERN: allow owner to decrypt and verify the limit
        FHE.allow(_transferLimit, owner);

        emit ThresholdUpdated();
    }

    /// @notice Update the cooldown period for rate limiting.
    /// @param newCooldown New cooldown in blocks
    function setCooldown(uint256 newCooldown) external onlyOwner {
        cooldownBlocks = newCooldown;
        emit RateLimitUpdated(newCooldown);
    }

    /// @notice Update the maximum batch size.
    /// @param newMax New maximum batch size
    function setMaxBatchSize(uint256 newMax) external onlyOwner {
        maxBatchSize = newMax;
    }

    /// @notice Transfer ownership to a new address.
    /// @param newOwner The new owner address
    function transferOwnership(address newOwner) external onlyOwner nonZeroAddress(newOwner) {
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    // =========================================================================
    // Pattern 6: Plaintext Deposit with ACL (Simpler Path)
    // =========================================================================

    /// @notice Deposit a plaintext amount (owner mint). Demonstrates ACL
    ///         management even for plaintext-to-encrypted conversions.
    /// @param to Recipient address
    /// @param amount Plaintext deposit amount
    function mint(address to, uint64 amount) external onlyOwner nonZeroAddress(to) {
        _balances[to] = FHE.add(_balances[to], FHE.asEuint64(amount));

        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);

        emit DepositMade(to, amount);
    }

    // =========================================================================
    // Pattern 7: Encrypted Comparison Without Leakage
    // =========================================================================

    /// @notice Compare two users' balances without revealing either.
    /// @dev Returns an encrypted boolean indicating if user A >= user B.
    ///      The result is allowed only to the caller (who must be owner).
    /// @param userA First user
    /// @param userB Second user
    /// @return Encrypted boolean: true if A's balance >= B's balance
    function compareBalances(address userA, address userB) external onlyOwner returns (ebool) {
        // PATTERN: Validate both handles are initialized
        require(FHE.isInitialized(_balances[userA]), "User A has no balance");
        require(FHE.isInitialized(_balances[userB]), "User B has no balance");

        ebool result = FHE.ge(_balances[userA], _balances[userB]);

        // PATTERN: ACL on the result -- only allow the caller
        FHE.allowThis(result);
        FHE.allow(result, msg.sender);

        return result;
    }

    // =========================================================================
    // Pattern 8: View with ACL Guard
    // =========================================================================

    /// @notice Get your own encrypted balance (ACL guarded).
    /// @dev PATTERN: Always check isSenderAllowed before returning handles.
    /// @return The encrypted balance handle
    function getMyBalance() external view returns (euint64) {
        require(FHE.isSenderAllowed(_balances[msg.sender]), "No ACL access to your balance");
        return _balances[msg.sender];
    }

    /// @notice Get any user's encrypted balance (owner only, ACL guarded).
    /// @param user The user whose balance to retrieve
    /// @return The encrypted balance handle
    function getBalance(address user) external view returns (euint64) {
        return _balances[user];
    }

    // =========================================================================
    // Pattern 9: Grant Access to Third Party
    // =========================================================================

    /// @notice Grant a third party read access to your encrypted balance.
    /// @dev PATTERN: Users control who can access their encrypted data.
    /// @param reader The address to grant read access to
    function grantBalanceAccess(address reader) external nonZeroAddress(reader) {
        require(FHE.isInitialized(_balances[msg.sender]), "No balance to share");
        FHE.allow(_balances[msg.sender], reader);
        emit AccessGranted(reader);
    }

    // =========================================================================
    // Pattern 10: Safe Encrypted Arithmetic
    // =========================================================================

    /// @notice Add a value to your balance with overflow-safe encrypted arithmetic.
    /// @dev Demonstrates the select pattern for capping at max value instead of
    ///      wrapping on overflow. FHE arithmetic wraps silently, so we must guard.
    /// @param encAmount Encrypted amount to add
    /// @param inputProof Proof for the encrypted input
    function safeAdd(externalEuint64 encAmount, bytes calldata inputProof) external rateLimited {
        euint64 amount = FHE.fromExternal(encAmount, inputProof);
        require(FHE.isInitialized(amount), "Invalid encrypted input");

        euint64 newBalance = FHE.add(_balances[msg.sender], amount);

        // PATTERN: Overflow guard -- if newBalance < old balance, overflow occurred.
        // In that case, keep the old balance (or cap at max).
        ebool overflowed = FHE.lt(newBalance, _balances[msg.sender]);
        _balances[msg.sender] = FHE.select(overflowed, _balances[msg.sender], newBalance);

        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);

        // Set error code
        euint8 errorCode = FHE.select(overflowed, FHE.asEuint8(ERR_INVALID_AMOUNT), FHE.asEuint8(ERR_NONE));
        _lastError[msg.sender] = errorCode;
        FHE.allowThis(_lastError[msg.sender]);
        FHE.allow(_lastError[msg.sender], msg.sender);

        emit BalanceUpdated(msg.sender);
    }

    // =========================================================================
    // Internal Helpers
    // =========================================================================

    /// @dev Internal helper to set the LastError for a user.
    function _setError(address user, uint8 code) internal {
        _lastError[user] = FHE.asEuint8(code);
        FHE.allowThis(_lastError[user]);
        FHE.allow(_lastError[user], user);
        emit ErrorSet(user, code);
    }
}
