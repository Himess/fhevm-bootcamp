// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Exercise 2: Encrypted Operations
/// @notice Implement basic FHE arithmetic and comparison operations
contract EncryptedOpsExercise is ZamaEthereumConfig {
    euint32 private _result;
    ebool private _boolResult;

    function getResult() external view returns (euint32) { return _result; }
    function getBoolResult() external view returns (ebool) { return _boolResult; }

    /// TODO 1: Add two encrypted values
    /// Hint: FHE.asEuint32() to encrypt, FHE.add() to add
    function addValues(uint32 a, uint32 b) external {
        // YOUR CODE HERE
    }

    /// TODO 2: Multiply two encrypted values
    function mulValues(uint32 a, uint32 b) external {
        // YOUR CODE HERE
    }

    /// TODO 3: Compare two encrypted values (is a > b?)
    /// Store result in _boolResult
    function isGreater(uint32 a, uint32 b) external {
        // YOUR CODE HERE
    }

    /// TODO 4: Find the minimum of two encrypted values
    function findMin(uint32 a, uint32 b) external {
        // YOUR CODE HERE
    }
}
