// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Exercise 3: Access Control
/// @notice Build a private vault with proper ACL management
contract ACLExercise is ZamaEthereumConfig {
    mapping(address => euint64) private _balances;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    /// TODO 1: Deposit encrypted amount
    /// - Convert external input with FHE.fromExternal()
    /// - Add to user's balance with FHE.add()
    /// - Set ACL: FHE.allowThis() and FHE.allow() for msg.sender
    function deposit(externalEuint64 encAmount, bytes calldata proof) external {
        // YOUR CODE HERE
    }

    /// TODO 2: Return caller's encrypted balance handle
    /// Note: Only the user themselves should be able to decrypt this
    function getBalance() external view returns (euint64) {
        // YOUR CODE HERE
    }

    /// TODO 3: Grant another address permission to view caller's balance
    /// Hint: Use FHE.allow()
    function grantView(address viewer) external {
        // YOUR CODE HERE
    }
}
