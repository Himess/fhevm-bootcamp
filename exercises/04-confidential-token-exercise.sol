// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Exercise 4: Build a Confidential Token
/// @notice Implement private transfer logic with balance privacy
contract ConfidentialTokenExercise is ZamaEthereumConfig {
    string public name;
    string public symbol;
    mapping(address => euint64) internal _balances;
    address public owner;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        owner = msg.sender;
    }

    /// TODO 1: Mint tokens (only owner)
    /// - Create encrypted balance with FHE.add()
    /// - Set ACL permissions
    function mint(address to, uint64 amount) external {
        require(msg.sender == owner, "Not owner");
        // YOUR CODE HERE
    }

    /// TODO 2: Private transfer
    /// CRITICAL: Do NOT revert on insufficient balance!
    /// - Check balance with FHE.ge()
    /// - Use FHE.select() to transfer 0 if insufficient
    /// - Update both sender and receiver balances
    /// - Set ACL for both
    function transfer(address to, externalEuint64 encAmount, bytes calldata inputProof) external {
        // YOUR CODE HERE
    }

    /// TODO 3: View encrypted balance
    function balanceOf(address account) external view returns (euint64) {
        // YOUR CODE HERE
    }
}
