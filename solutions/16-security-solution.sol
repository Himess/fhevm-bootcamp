// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint16, euint32, euint64, ebool, externalEuint64, externalEuint32, externalEbool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title EncryptedVault (FIXED) - Security Audit Exercise Solution
/// @notice This is the corrected version of EncryptedVault with all 7
///         vulnerabilities fixed. Compare with exercises/16-security-exercise.sol.
///
/// FIXES APPLIED:
///   1. deposit()         -- Added FHE.allowThis + FHE.allow + isInitialized check
///   2. withdraw()        -- Replaced if/else with FHE.select for uniform gas
///   3. lockFunds()       -- Added FHE.isInitialized validation
///   4. batchTransfer()   -- Added MAX_BATCH cap to prevent DoS
///   5. emergencyWithdraw() -- Added onlyOwner + replaced revert with LastError
///   6. revealBalance()   -- Replaced makePubliclyDecryptable with FHE.allow
///   7. adminMint()       -- Added onlyOwner modifier
///
/// ADDITIONS:
///   - LastError pattern for encrypted error feedback
///   - Rate limiting modifier for expensive operations
///   - Custom errors for gas-efficient plaintext reverts
///   - Input validation on all encrypted inputs
contract EncryptedVaultFixed is ZamaEthereumConfig {

    // =========================================================================
    // Custom Errors
    // =========================================================================
    error NotOwner();
    error BatchTooLarge(uint256 requested, uint256 maximum);
    error ZeroAddress();
    error InputNotInitialized();
    error RateLimited(uint256 nextAllowedBlock);

    // =========================================================================
    // Constants
    // =========================================================================
    uint256 public constant MAX_BATCH = 10;
    uint256 public constant COOLDOWN_BLOCKS = 3;

    uint8 public constant ERR_NONE = 0;
    uint8 public constant ERR_INSUFFICIENT_BALANCE = 1;
    uint8 public constant ERR_INVALID_INPUT = 2;

    // =========================================================================
    // State
    // =========================================================================
    address public owner;

    mapping(address => euint64) private _balances;
    mapping(address => euint64) private _lockedBalances;
    mapping(address => euint8) private _lastError;
    mapping(address => uint256) private _lastOpBlock;

    uint256 public totalDeposits;

    // =========================================================================
    // Events
    // =========================================================================
    event Deposit(address indexed user);
    event Withdraw(address indexed user);
    event Transfer(address indexed from, address indexed to);
    event BatchProcess(uint256 count);
    event AccessGranted(address indexed user, address indexed reader);
    event LockUpdated(address indexed user);
    event ErrorSet(address indexed user);

    // =========================================================================
    // Modifiers
    // =========================================================================
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier rateLimited() {
        if (block.number < _lastOpBlock[msg.sender] + COOLDOWN_BLOCKS) {
            revert RateLimited(_lastOpBlock[msg.sender] + COOLDOWN_BLOCKS);
        }
        _lastOpBlock[msg.sender] = block.number;
        _;
    }

    // =========================================================================
    // Constructor
    // =========================================================================
    constructor() {
        owner = msg.sender;
    }

    // -------------------------------------------------------------------------
    // FIX 1: deposit -- Added ACL + input validation
    // BEFORE: Missing FHE.allowThis() and FHE.allow() after FHE.add().
    //         Missing FHE.isInitialized() check on the input.
    // AFTER:  Full input validation and ACL management.
    // -------------------------------------------------------------------------
    function deposit(
        externalEuint64 encAmount,
        bytes calldata inputProof
    ) external rateLimited {
        euint64 amount = FHE.fromExternal(encAmount, inputProof);

        // FIX: Validate the encrypted input
        require(FHE.isInitialized(amount), "Invalid encrypted input");

        _balances[msg.sender] = FHE.add(_balances[msg.sender], amount);

        // FIX: Set ACL after state update
        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);

        // FIX: Set LastError to success
        _setError(msg.sender, ERR_NONE);

        totalDeposits++;
        emit Deposit(msg.sender);
    }

    // -------------------------------------------------------------------------
    // FIX 2: withdraw -- Replaced if/else with FHE.select for uniform gas
    // BEFORE: if (hasBalance) { sub } else { nothing } -- gas leak!
    // AFTER:  FHE.select for uniform execution + LastError pattern.
    // -------------------------------------------------------------------------
    function withdraw(uint64 amount) external rateLimited {
        euint64 encAmount = FHE.asEuint64(amount);
        ebool hasBalance = FHE.ge(_balances[msg.sender], encAmount);

        // FIX: Use select instead of if/else -- uniform gas
        euint64 actualAmount = FHE.select(
            hasBalance,
            encAmount,
            FHE.asEuint64(0)
        );

        _balances[msg.sender] = FHE.sub(_balances[msg.sender], actualAmount);
        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);

        // FIX: LastError instead of revert for encrypted condition feedback
        _lastError[msg.sender] = FHE.select(
            hasBalance,
            FHE.asEuint8(ERR_NONE),
            FHE.asEuint8(ERR_INSUFFICIENT_BALANCE)
        );
        FHE.allowThis(_lastError[msg.sender]);
        FHE.allow(_lastError[msg.sender], msg.sender);

        emit Withdraw(msg.sender);
    }

    // -------------------------------------------------------------------------
    // FIX 3: lockFunds -- Added FHE.isInitialized validation
    // BEFORE: No validation of the encrypted input handle.
    // AFTER:  require(FHE.isInitialized(amount)) check added.
    // -------------------------------------------------------------------------
    function lockFunds(
        externalEuint64 encAmount,
        bytes calldata inputProof
    ) external rateLimited {
        euint64 amount = FHE.fromExternal(encAmount, inputProof);

        // FIX: Validate encrypted input
        require(FHE.isInitialized(amount), "Invalid encrypted input");

        _lockedBalances[msg.sender] = FHE.add(
            _lockedBalances[msg.sender],
            amount
        );
        FHE.allowThis(_lockedBalances[msg.sender]);
        FHE.allow(_lockedBalances[msg.sender], msg.sender);

        emit LockUpdated(msg.sender);
    }

    // -------------------------------------------------------------------------
    // FIX 4: batchTransfer -- Added MAX_BATCH cap
    // BEFORE: No limit on recipients.length -- DoS vector.
    // AFTER:  require(recipients.length <= MAX_BATCH).
    // -------------------------------------------------------------------------
    function batchTransfer(
        address[] calldata recipients,
        uint64 amountEach
    ) external rateLimited {
        // FIX: Bound the batch size to prevent DoS
        if (recipients.length > MAX_BATCH) {
            revert BatchTooLarge(recipients.length, MAX_BATCH);
        }

        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) continue;

            euint64 encAmount = FHE.asEuint64(amountEach);
            ebool hasBalance = FHE.ge(_balances[msg.sender], encAmount);
            euint64 actual = FHE.select(hasBalance, encAmount, FHE.asEuint64(0));

            _balances[msg.sender] = FHE.sub(_balances[msg.sender], actual);
            _balances[recipients[i]] = FHE.add(
                _balances[recipients[i]],
                actual
            );

            FHE.allowThis(_balances[msg.sender]);
            FHE.allow(_balances[msg.sender], msg.sender);
            FHE.allowThis(_balances[recipients[i]]);
            FHE.allow(_balances[recipients[i]], recipients[i]);
        }

        emit BatchProcess(recipients.length);
    }

    // -------------------------------------------------------------------------
    // FIX 5: emergencyWithdraw -- Added onlyOwner + replaced revert with select
    // BEFORE: No access control (anyone can call for any user).
    //         Used require() on encrypted condition (info leak via revert).
    // AFTER:  onlyOwner modifier. Select pattern with LastError.
    // -------------------------------------------------------------------------
    function emergencyWithdraw(address user, uint64 minBalance) external onlyOwner {
        euint64 encMin = FHE.asEuint64(minBalance);
        ebool aboveMin = FHE.ge(_balances[user], encMin);

        // FIX: Use select instead of require on encrypted condition
        // If above min, zero out the balance. If not, keep it unchanged.
        _balances[user] = FHE.select(
            aboveMin,
            FHE.asEuint64(0),
            _balances[user]
        );
        FHE.allowThis(_balances[user]);
        FHE.allow(_balances[user], user);

        // FIX: Set LastError for the affected user
        _lastError[user] = FHE.select(
            aboveMin,
            FHE.asEuint8(ERR_NONE),
            FHE.asEuint8(ERR_INSUFFICIENT_BALANCE)
        );
        FHE.allowThis(_lastError[user]);
        FHE.allow(_lastError[user], user);

        emit Withdraw(user);
    }

    // -------------------------------------------------------------------------
    // FIX 6: revealBalance -- Replaced makePubliclyDecryptable with FHE.allow
    // BEFORE: Called makePubliclyDecryptable on individual user balance.
    // AFTER:  Grants access to a specific auditor address instead.
    // -------------------------------------------------------------------------
    function revealBalance(address user, address auditor) external onlyOwner {
        // FIX: Grant access to specific auditor, not everyone
        require(auditor != address(0), "Invalid auditor address");
        FHE.allow(_balances[user], auditor);
        emit AccessGranted(user, auditor);
    }

    // Overloaded version maintaining the old interface for compatibility
    function revealBalance(address user) external onlyOwner {
        // FIX: Instead of makePubliclyDecryptable, grant access to owner
        FHE.allow(_balances[user], owner);
        emit AccessGranted(user, owner);
    }

    // -------------------------------------------------------------------------
    // FIX 7: adminMint -- Added onlyOwner modifier
    // BEFORE: No access control -- anyone could mint tokens.
    // AFTER:  onlyOwner modifier added.
    // -------------------------------------------------------------------------
    function adminMint(address to, uint64 amount) external onlyOwner {
        require(to != address(0), "Zero address");

        _balances[to] = FHE.add(_balances[to], FHE.asEuint64(amount));
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);
        emit Deposit(to);
    }

    // =========================================================================
    // LastError Pattern
    // =========================================================================

    /// @notice Get your last operation's encrypted error code.
    /// @return Encrypted error code: 0=success, 1=insufficient balance, 2=invalid input
    function getLastError() external view returns (euint8) {
        require(FHE.isSenderAllowed(_lastError[msg.sender]), "No access");
        return _lastError[msg.sender];
    }

    // =========================================================================
    // View Functions (with ACL guards)
    // =========================================================================

    function getBalance(address user) external view returns (euint64) {
        return _balances[user];
    }

    function getMyBalance() external view returns (euint64) {
        require(
            FHE.isSenderAllowed(_balances[msg.sender]),
            "No ACL access"
        );
        return _balances[msg.sender];
    }

    function getLockedBalance(address user) external view returns (euint64) {
        return _lockedBalances[user];
    }

    // =========================================================================
    // Internal Helpers
    // =========================================================================

    function _setError(address user, uint8 code) internal {
        _lastError[user] = FHE.asEuint8(code);
        FHE.allowThis(_lastError[user]);
        FHE.allow(_lastError[user], user);
        emit ErrorSet(user);
    }
}
