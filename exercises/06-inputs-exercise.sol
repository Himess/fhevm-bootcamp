// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint64, externalEuint32, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Exercise 6: Secure Encrypted Input Handling
/// @notice Practice accepting and processing encrypted inputs from users
contract InputExercise is ZamaEthereumConfig {
    mapping(address => euint64) private _balances;
    euint32 private _totalDeposits;
    address public owner;

    constructor() {
        owner = msg.sender;
        _totalDeposits = FHE.asEuint32(0);
        FHE.allowThis(_totalDeposits);
    }

    /// TODO 1: Accept an encrypted deposit amount
    /// - Convert the external input using FHE.fromExternal()
    /// - Add it to the sender's balance
    /// - Update ACL for both the balance and totalDeposits
    function deposit(externalEuint64 encAmount, bytes calldata inputProof) external {
        // YOUR CODE HERE
    }

    /// TODO 2: Accept two encrypted values and return which is larger
    /// - Convert both external inputs
    /// - Use FHE.gt() to compare
    /// - Use FHE.select() to return the larger value
    /// - Store result and set ACL
    euint32 private _maxResult;

    function findMax(
        externalEuint32 encA, bytes calldata proofA,
        externalEuint32 encB, bytes calldata proofB
    ) external {
        // YOUR CODE HERE
    }

    /// TODO 3: Get the sender's encrypted balance (ACL-protected)
    function getMyBalance() external view returns (euint64) {
        // YOUR CODE HERE
    }

    function getMaxResult() external view returns (euint32) {
        return _maxResult;
    }
}
