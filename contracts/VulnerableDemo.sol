// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint16, euint32, euint64, ebool, externalEuint64, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title VulnerableDemo - Module 16: DELIBERATELY VULNERABLE for Educational Purposes
/// @notice !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
/// @notice !! WARNING: THIS CONTRACT CONTAINS INTENTIONAL SECURITY FLAWS.   !!
/// @notice !! DO NOT USE IN PRODUCTION. FOR TEACHING ONLY.                  !!
/// @notice !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
/// @dev Each function contains one or more FHE-specific vulnerabilities.
///      Comments marked "VULNERABLE:" explain the flaw.
///      Comments marked "FIX:" explain the correct approach.
contract VulnerableDemo is ZamaEthereumConfig {

    address public owner;

    mapping(address => euint64) private _balances;
    mapping(address => euint8) private _lastError;

    // Public counters for tracking (used in tests)
    uint256 public transferCount;

    event Transfer(address indexed from, address indexed to);
    event BalanceUpdated(address indexed user);
    event PublicResult(bool result);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    // =========================================================================
    // Vulnerability 1: Missing ACL Permissions
    // =========================================================================

    /// @notice Mint tokens -- MISSING allowThis and allow.
    /// @dev VULNERABLE: After minting, neither the contract nor the user
    ///      has ACL access to the new ciphertext. The contract cannot use
    ///      this balance in future transactions, and the user cannot decrypt it.
    /// FIX: Add FHE.allowThis(_balances[to]) and FHE.allow(_balances[to], to)
    ///      after every state update that produces a new ciphertext handle.
    function vulnerableMint(address to, uint64 amount) external onlyOwner {
        _balances[to] = FHE.asEuint64(amount);
        // VULNERABLE: Missing FHE.allowThis(_balances[to])
        // VULNERABLE: Missing FHE.allow(_balances[to], to)
        // FIX: Always set ACL after creating/updating encrypted values:
        //   FHE.allowThis(_balances[to]);
        //   FHE.allow(_balances[to], to);
        emit BalanceUpdated(to);
    }

    /// @notice Correctly minted balance for testing other vulnerabilities.
    /// @dev This function IS correct -- used to set up state for other tests.
    function setupMint(address to, uint64 amount) external onlyOwner {
        _balances[to] = FHE.asEuint64(amount);
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);
        emit BalanceUpdated(to);
    }

    // =========================================================================
    // Vulnerability 2: Branching on Encrypted Conditions (Gas Leak)
    // =========================================================================

    /// @notice Transfer that branches on encrypted condition -- LEAKS INFO.
    /// @dev VULNERABLE: The if/else branch on the encrypted comparison causes
    ///      different gas consumption depending on the branch taken.
    ///      An observer can determine if the sender had sufficient balance
    ///      by watching gas usage.
    ///
    ///      Branch A (has balance): executes FHE.sub + FHE.add + 4x ACL = ~400k gas
    ///      Branch B (no balance):  no FHE ops = ~30k gas
    ///      The 370k gas difference reveals the encrypted condition!
    ///
    /// FIX: Use FHE.select() to ensure uniform gas execution:
    ///   euint64 actual = FHE.select(hasBalance, amount, FHE.asEuint64(0));
    ///   _balances[from] = FHE.sub(_balances[from], actual);
    ///   _balances[to] = FHE.add(_balances[to], actual);
    function vulnerableTransfer(address to, uint64 amount) external {
        euint64 encAmount = FHE.asEuint64(amount);
        ebool hasBalance = FHE.ge(_balances[msg.sender], encAmount);

        // VULNERABLE: Branching on encrypted condition!
        // This creates a gas side-channel that reveals hasBalance.
        if (FHE.isInitialized(hasBalance)) {
            // Always take same path in this demo, but the pattern is the vulnerability
            _balances[msg.sender] = FHE.sub(_balances[msg.sender], encAmount);
            _balances[to] = FHE.add(_balances[to], encAmount);

            FHE.allowThis(_balances[msg.sender]);
            FHE.allow(_balances[msg.sender], msg.sender);
            FHE.allowThis(_balances[to]);
            FHE.allow(_balances[to], to);

            transferCount++;
        }
        // FIX: Replace entire if/else with:
        //   euint64 actual = FHE.select(hasBalance, encAmount, FHE.asEuint64(0));
        //   _balances[msg.sender] = FHE.sub(_balances[msg.sender], actual);
        //   _balances[to] = FHE.add(_balances[to], actual);
        //   FHE.allowThis(_balances[msg.sender]);
        //   FHE.allow(_balances[msg.sender], msg.sender);
        //   FHE.allowThis(_balances[to]);
        //   FHE.allow(_balances[to], to);

        emit Transfer(msg.sender, to);
    }

    // =========================================================================
    // Vulnerability 3: Missing Input Validation
    // =========================================================================

    /// @notice Deposit with no input validation -- UNSAFE.
    /// @dev VULNERABLE: Does not call FHE.isInitialized() after fromExternal().
    ///      An attacker could submit a malformed or zero handle, leading to
    ///      undefined behavior when the ciphertext is used in computations.
    /// FIX: Always validate:
    ///   euint64 amount = FHE.fromExternal(encAmount, inputProof);
    ///   require(FHE.isInitialized(amount), "Invalid encrypted input");
    function vulnerableDeposit(
        externalEuint64 encAmount,
        bytes calldata inputProof
    ) external {
        // VULNERABLE: No validation of the encrypted input
        euint64 amount = FHE.fromExternal(encAmount, inputProof);
        // VULNERABLE: Missing require(FHE.isInitialized(amount))

        _balances[msg.sender] = FHE.add(_balances[msg.sender], amount);
        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);

        emit BalanceUpdated(msg.sender);
    }

    // =========================================================================
    // Vulnerability 4: Unbounded FHE Operations (DoS Vector)
    // =========================================================================

    /// @notice Batch add to multiple users with NO size limit -- DoS VECTOR.
    /// @dev VULNERABLE: Each iteration performs multiple FHE operations
    ///      (~200k-600k gas each). With no cap on the array size, an attacker
    ///      can pass a large array to exceed the block gas limit, causing DoS.
    ///
    ///      Example: 50 recipients x 3 FHE ops x 200k gas = 30M gas (block limit!)
    ///
    /// FIX: Add a maximum batch size:
    ///   require(recipients.length <= MAX_BATCH, "Batch too large");
    function vulnerableBatchAdd(
        address[] calldata recipients,
        uint64 amount
    ) external onlyOwner {
        // VULNERABLE: No cap on recipients.length
        // An attacker (or even a well-meaning admin) can pass hundreds
        // of addresses, exhausting the block gas limit.
        // FIX: require(recipients.length <= 10, "Batch too large");
        for (uint256 i = 0; i < recipients.length; i++) {
            _balances[recipients[i]] = FHE.add(
                _balances[recipients[i]],
                FHE.asEuint64(amount)
            );
            FHE.allowThis(_balances[recipients[i]]);
            FHE.allow(_balances[recipients[i]], recipients[i]);
        }
    }

    // =========================================================================
    // Vulnerability 5: Improper Error Handling (Reverts Leak Information)
    // =========================================================================

    /// @notice Withdraw that reverts on insufficient balance -- LEAKS INFO.
    /// @dev VULNERABLE: Reverting with a reason string when an encrypted
    ///      condition fails reveals information about the encrypted state.
    ///      An observer knows the balance was insufficient because the tx reverted.
    ///
    /// FIX: Use the LastError pattern instead of reverting:
    ///   euint64 actual = FHE.select(hasBalance, amount, FHE.asEuint64(0));
    ///   // Set encrypted error code for user to check later
    ///   _lastError[msg.sender] = FHE.select(hasBalance, asEuint8(0), asEuint8(1));
    function vulnerableWithdraw(uint64 amount) external {
        euint64 encAmount = FHE.asEuint64(amount);

        // VULNERABLE: This comparison + require reveals the encrypted condition!
        // If the tx reverts, everyone knows the balance was insufficient.
        // If it succeeds, everyone knows the balance was sufficient.
        // VULNERABLE: We compute a comparison but never use it to guard the subtraction.
        // In a real vulnerable contract, the developer might try to decrypt and branch.
        // FIX: Use FHE.select(hasBalance, subtracted, original) to guard the operation.
        ebool hasBalance = FHE.ge(_balances[msg.sender], encAmount);
        euint64 newBalance = FHE.sub(_balances[msg.sender], encAmount);

        // VULNERABLE: Ignoring the check result → underflow is silently allowed
        _balances[msg.sender] = newBalance;
        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);

        // FIX: Use select pattern instead:
        //   euint64 actual = FHE.select(hasBalance, encAmount, FHE.asEuint64(0));
        //   _balances[msg.sender] = FHE.sub(_balances[msg.sender], actual);
        //   _lastError[msg.sender] = FHE.select(
        //       hasBalance, FHE.asEuint8(0), FHE.asEuint8(1)
        //   );
        //   FHE.allowThis(_lastError[msg.sender]);
        //   FHE.allow(_lastError[msg.sender], msg.sender);

        emit BalanceUpdated(msg.sender);
    }

    // =========================================================================
    // Vulnerability 6: Exposing Sensitive Data via makePubliclyDecryptable
    // =========================================================================

    /// @notice Make a user's balance publicly visible -- PRIVACY VIOLATION.
    /// @dev VULNERABLE: Calling makePubliclyDecryptable on individual user
    ///      balances completely destroys the privacy that FHE provides.
    ///      Once called, ANYONE can decrypt and see the user's balance.
    ///      This is irreversible.
    ///
    /// FIX: Never use makePubliclyDecryptable on individual user data.
    ///      Only use it for aggregate or non-sensitive values like
    ///      total supply, vote tallies, or auction results.
    function vulnerableRevealBalance(address user) external onlyOwner {
        // VULNERABLE: Revealing a user's private balance to everyone!
        FHE.makePubliclyDecryptable(_balances[user]);
        // FIX: Use FHE.allow(_balances[user], specificAuditor) instead
        //      to grant access only to authorized parties.
    }

    // =========================================================================
    // Vulnerability 7: No Access Control on Sensitive Operations
    // =========================================================================

    /// @notice Anyone can mint tokens -- MISSING ACCESS CONTROL.
    /// @dev VULNERABLE: No onlyOwner modifier. Any address can call this
    ///      function and mint arbitrary amounts to any address.
    /// FIX: Add onlyOwner modifier or role-based access control.
    function vulnerableOpenMint(address to, uint64 amount) external {
        // VULNERABLE: No access control -- anyone can mint!
        // FIX: Add `onlyOwner` modifier
        _balances[to] = FHE.add(_balances[to], FHE.asEuint64(amount));
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);
        emit BalanceUpdated(to);
    }

    // =========================================================================
    // Helper: Read balance (for testing)
    // =========================================================================

    /// @notice Get encrypted balance handle.
    function getBalance(address user) external view returns (euint64) {
        return _balances[user];
    }
}
