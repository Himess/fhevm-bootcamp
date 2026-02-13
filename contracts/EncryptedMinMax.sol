// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title EncryptedMinMax - Module 08: Find min/max using select
contract EncryptedMinMax is ZamaEthereumConfig {
    euint32 private _resultA;
    euint32 private _resultB;

    function getResultA() external view returns (euint32) { return _resultA; }
    function getResultB() external view returns (euint32) { return _resultB; }

    /// @notice Find min of two encrypted values
    function findMin(uint32 a, uint32 b) external {
        euint32 encA = FHE.asEuint32(a);
        euint32 encB = FHE.asEuint32(b);
        ebool aIsLess = FHE.lt(encA, encB);
        _resultA = FHE.select(aIsLess, encA, encB);
        FHE.allowThis(_resultA);
        FHE.allow(_resultA, msg.sender);
    }

    /// @notice Find max of two encrypted values
    function findMax(uint32 a, uint32 b) external {
        euint32 encA = FHE.asEuint32(a);
        euint32 encB = FHE.asEuint32(b);
        ebool aIsGreater = FHE.gt(encA, encB);
        _resultA = FHE.select(aIsGreater, encA, encB);
        FHE.allowThis(_resultA);
        FHE.allow(_resultA, msg.sender);
    }

    /// @notice Sort two values: resultA = smaller, resultB = larger
    function sortTwo(uint32 a, uint32 b) external {
        euint32 encA = FHE.asEuint32(a);
        euint32 encB = FHE.asEuint32(b);
        ebool aIsLess = FHE.lt(encA, encB);
        _resultA = FHE.select(aIsLess, encA, encB); // min
        _resultB = FHE.select(aIsLess, encB, encA); // max
        FHE.allowThis(_resultA);
        FHE.allowThis(_resultB);
        FHE.allow(_resultA, msg.sender);
        FHE.allow(_resultB, msg.sender);
    }

    /// @notice Find minimum using built-in FHE.min()
    function findMinBuiltin(uint32 a, uint32 b) external {
        euint32 encA = FHE.asEuint32(a);
        euint32 encB = FHE.asEuint32(b);
        _resultA = FHE.min(encA, encB);
        FHE.allowThis(_resultA);
        FHE.allow(_resultA, msg.sender);
    }

    /// @notice Find maximum using built-in FHE.max()
    function findMaxBuiltin(uint32 a, uint32 b) external {
        euint32 encA = FHE.asEuint32(a);
        euint32 encB = FHE.asEuint32(b);
        _resultA = FHE.max(encA, encB);
        FHE.allowThis(_resultA);
        FHE.allow(_resultA, msg.sender);
    }

    /// @notice Find min of three encrypted values
    function findMinOfThree(uint32 a, uint32 b, uint32 c) external {
        euint32 encA = FHE.asEuint32(a);
        euint32 encB = FHE.asEuint32(b);
        euint32 encC = FHE.asEuint32(c);

        ebool abLess = FHE.lt(encA, encB);
        euint32 minAB = FHE.select(abLess, encA, encB);
        ebool abcLess = FHE.lt(minAB, encC);
        _resultA = FHE.select(abcLess, minAB, encC);

        FHE.allowThis(_resultA);
        FHE.allow(_resultA, msg.sender);
    }
}
