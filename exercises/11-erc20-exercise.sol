// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, ebool, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Exercise 11: Build a Confidential ERC-20 Token
/// @notice Implement encrypted balances, privacy-preserving transfers, and encrypted allowances
contract ConfidentialERC20 is ZamaEthereumConfig {
    string public name;
    string public symbol;
    uint8 public constant decimals = 6;
    uint64 public totalSupply;

    mapping(address => euint64) private _balances;
    mapping(address => mapping(address => euint64)) private _allowances;
    mapping(address => bool) private _initialized;

    event Transfer(address indexed from, address indexed to);
    event Approval(address indexed owner, address indexed spender);

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    /// @dev Initializes an account's encrypted balance to 0 if not already initialized
    function _initBalance(address account) internal {
        if (!_initialized[account]) {
            _balances[account] = FHE.asEuint64(0);
            FHE.allowThis(_balances[account]);
            FHE.allow(_balances[account], account);
            _initialized[account] = true;
        }
    }

    /// @notice Returns the encrypted balance of an account
    function balanceOf(address account) public view returns (euint64) {
        return _balances[account];
    }

    /// TODO 1: Transfer encrypted amount to a recipient
    /// - Convert encryptedAmount using FHE.fromExternal()
    /// - Call _transfer(msg.sender, to, amount)
    /// - Emit Transfer event (no amount in event!)
    function transfer(externalEuint64 encryptedAmount, bytes calldata inputProof, address to) external {
        // YOUR CODE HERE
    }

    /// TODO 2: Internal transfer using the no-revert pattern
    /// - Initialize both from and to balances
    /// - Check if from has enough balance: FHE.ge(_balances[from], amount)
    /// - Use FHE.select(hasEnough, amount, FHE.asEuint64(0)) for transferAmount
    /// - Subtract transferAmount from sender's balance using FHE.sub()
    /// - Add transferAmount to receiver's balance using FHE.add()
    /// - FHE.allowThis() and FHE.allow() for both from and to
    function _transfer(address from, address to, euint64 amount) internal {
        _initBalance(from);
        _initBalance(to);

        // YOUR CODE HERE
    }

    /// TODO 3: Approve a spender for an encrypted allowance
    /// - Convert encryptedAmount using FHE.fromExternal()
    /// - Set _allowances[msg.sender][spender] = amount
    /// - FHE.allowThis() the allowance
    /// - FHE.allow() for both msg.sender and spender
    /// - Emit Approval event
    function approve(externalEuint64 encryptedAmount, bytes calldata inputProof, address spender) external {
        // YOUR CODE HERE
    }

    /// @notice Returns the encrypted allowance that owner has granted to the caller
    function allowance(address owner) public view returns (euint64) {
        return _allowances[owner][msg.sender];
    }

    /// TODO 4: Transfer from another account using allowance (double-check pattern)
    /// - Convert encryptedAmount using FHE.fromExternal()
    /// - Check allowance >= amount using FHE.ge()
    /// - Check balance >= amount using FHE.ge()
    /// - Combine both checks with FHE.and()
    /// - Use FHE.select() to determine transferAmount
    /// - Update allowance: subtract transferAmount from current allowance
    /// - FHE.allowThis() and FHE.allow() for the updated allowance (from and msg.sender)
    /// - Call _transfer(from, to, transferAmount)
    /// - Emit Transfer event
    function transferFrom(
        address from,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof,
        address to
    ) external {
        // YOUR CODE HERE
    }
}
