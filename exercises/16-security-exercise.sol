// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint16, euint32, euint64, ebool, externalEuint64, externalEuint32, externalEbool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title EncryptedVault - Security Audit Exercise
/// @notice This contract contains 7 FHE-specific security vulnerabilities.
///         Your task is to find all of them and produce a fixed version.
///
/// INSTRUCTIONS:
///   1. Read each function carefully
///   2. Identify the vulnerability (marked with subtle hints in the code)
///   3. Write the fix in your solution contract (solutions/16-security-solution.sol)
///   4. Ensure your fixed contract maintains the same external interface
///
/// VULNERABILITIES TO FIND: 7 total
///   Categories: gas leak, missing ACL, unvalidated input, DoS,
///               error leak, privacy violation, missing access control
contract EncryptedVault is ZamaEthereumConfig {

    address public owner;

    mapping(address => euint64) private _balances;
    mapping(address => euint64) private _lockedBalances;

    uint256 public totalDeposits;

    event Deposit(address indexed user);
    event Withdraw(address indexed user);
    event Transfer(address indexed from, address indexed to);
    event BatchProcess(uint256 count);
    event BalanceRevealed(address indexed user);
    event LockUpdated(address indexed user);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    // -------------------------------------------------------------------------
    // Function 1: deposit
    // Hint: What happens to the ACL after the FHE.add operation?
    // -------------------------------------------------------------------------
    function deposit(
        externalEuint64 encAmount,
        bytes calldata inputProof
    ) external {
        euint64 amount = FHE.fromExternal(encAmount, inputProof);

        _balances[msg.sender] = FHE.add(_balances[msg.sender], amount);
        // Something is missing here...

        totalDeposits++;
        emit Deposit(msg.sender);
    }

    // -------------------------------------------------------------------------
    // Function 2: withdraw
    // Hint: What does the gas consumption reveal about the encrypted balance?
    // -------------------------------------------------------------------------
    function withdraw(uint64 amount) external {
        euint64 encAmount = FHE.asEuint64(amount);
        ebool hasBalance = FHE.ge(_balances[msg.sender], encAmount);

        // Is this pattern safe for FHE?
        if (FHE.isInitialized(hasBalance)) {
            _balances[msg.sender] = FHE.sub(_balances[msg.sender], encAmount);
            FHE.allowThis(_balances[msg.sender]);
            FHE.allow(_balances[msg.sender], msg.sender);
        }
        // What happens if the balance is insufficient? Is gas uniform?

        emit Withdraw(msg.sender);
    }

    // -------------------------------------------------------------------------
    // Function 3: lockFunds
    // Hint: Is the encrypted input properly validated?
    // -------------------------------------------------------------------------
    function lockFunds(
        externalEuint64 encAmount,
        bytes calldata inputProof
    ) external {
        euint64 amount = FHE.fromExternal(encAmount, inputProof);
        // Should we check anything about 'amount' before using it?

        _lockedBalances[msg.sender] = FHE.add(
            _lockedBalances[msg.sender],
            amount
        );
        FHE.allowThis(_lockedBalances[msg.sender]);
        FHE.allow(_lockedBalances[msg.sender], msg.sender);

        emit LockUpdated(msg.sender);
    }

    // -------------------------------------------------------------------------
    // Function 4: batchTransfer
    // Hint: What happens if someone passes 100 recipients?
    // -------------------------------------------------------------------------
    function batchTransfer(
        address[] calldata recipients,
        uint64 amountEach
    ) external {
        for (uint256 i = 0; i < recipients.length; i++) {
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
    // Function 5: emergencyWithdraw
    // Hint: Does the revert pattern reveal anything about the encrypted state?
    //       Also: who can call this function?
    // -------------------------------------------------------------------------
    function emergencyWithdraw(address user, uint64 minBalance) external {
        // Should there be access control here?
        euint64 encMin = FHE.asEuint64(minBalance);
        ebool aboveMin = FHE.ge(_balances[user], encMin);

        // The contract checks the encrypted condition and reverts if false.
        // What information does this reveal?
        require(FHE.isInitialized(aboveMin), "Balance check failed");

        _balances[user] = FHE.asEuint64(0);
        FHE.allowThis(_balances[user]);
        FHE.allow(_balances[user], user);

        emit Withdraw(user);
    }

    // -------------------------------------------------------------------------
    // Function 6: revealBalance
    // Hint: Should individual balances be made publicly decryptable?
    // -------------------------------------------------------------------------
    function revealBalance(address user) external onlyOwner {
        // Is this appropriate for individual user data?
        FHE.makePubliclyDecryptable(_balances[user]);
        emit BalanceRevealed(user);
    }

    // -------------------------------------------------------------------------
    // Function 7: adminMint
    // Hint: Check the access control modifier.
    // -------------------------------------------------------------------------
    function adminMint(address to, uint64 amount) external {
        // Is this function properly protected?
        _balances[to] = FHE.add(_balances[to], FHE.asEuint64(amount));
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);
        emit Deposit(to);
    }

    // -------------------------------------------------------------------------
    // Helper: Read balance
    // -------------------------------------------------------------------------
    function getBalance(address user) external view returns (euint64) {
        return _balances[user];
    }

    function getLockedBalance(address user) external view returns (euint64) {
        return _lockedBalances[user];
    }
}
