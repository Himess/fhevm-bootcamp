// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Exercise 3: ConfidentialToken — Encrypted ERC20-like Token with ACL
/// @notice Build a minimal encrypted token that properly manages ACL for balances
contract ConfidentialToken is ZamaEthereumConfig {
    address public owner;
    mapping(address => euint64) private _balances;
    mapping(address => bool) private _initialized;
    mapping(address => mapping(address => bool)) private _approvals;

    event Transfer(address indexed from, address indexed to);
    event Mint(address indexed to);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function _ensureInitialized(address user) internal {
        if (!_initialized[user]) {
            _balances[user] = FHE.asEuint64(0);
            FHE.allowThis(_balances[user]);
            FHE.allow(_balances[user], user);
            _initialized[user] = true;
        }
    }

    /// TODO 1: Mint tokens to a recipient
    /// - Call _ensureInitialized(to)
    /// - Add amount to recipient's balance using FHE.add()
    /// - Set ACL: FHE.allowThis() and FHE.allow() for recipient
    function mint(address to, uint64 amount) public onlyOwner {
        _ensureInitialized(to);
        // YOUR CODE HERE
        emit Mint(to);
    }

    /// TODO 2: Transfer tokens from sender to recipient
    /// - Call _ensureInitialized for both sender and recipient
    /// - Check sender has enough balance using FHE.ge()
    /// - Compute new balances using FHE.sub() and FHE.add()
    /// - Use FHE.select() for conditional update (only transfer if enough balance)
    /// - Update ACL for both sender and receiver balances
    function transfer(address to, uint64 amount) public {
        _ensureInitialized(msg.sender);
        _ensureInitialized(to);

        euint64 amt = FHE.asEuint64(amount);

        // YOUR CODE HERE

        emit Transfer(msg.sender, to);
    }

    /// TODO 3: Approve another address to view your balance
    /// - Store approval flag
    /// - If balance is initialized, grant spender access via FHE.allow()
    function approve(address spender) public {
        // YOUR CODE HERE
    }

    /// TODO 4: View any account's balance (with authorization check)
    /// - Check if msg.sender is the account owner OR an approved spender
    /// - Check FHE.isSenderAllowed() for the balance handle
    /// - Return the encrypted balance
    function balanceOf(address account) public view returns (euint64) {
        // YOUR CODE HERE
    }

    /// TODO 5: Shorthand to view your own balance
    /// - Verify msg.sender has access using FHE.isSenderAllowed()
    /// - Return own balance
    function getMyBalance() public view returns (euint64) {
        // YOUR CODE HERE
    }
}
