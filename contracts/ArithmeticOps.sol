// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ArithmeticOps - Module 04: Arithmetic operations on encrypted data
contract ArithmeticOps is ZamaEthereumConfig {
    euint32 private _result;

    function getResult() external view returns (euint32) {
        return _result;
    }

    /// @notice Add two encrypted values
    function addEncrypted(uint32 a, uint32 b) external {
        euint32 encA = FHE.asEuint32(a);
        euint32 encB = FHE.asEuint32(b);
        _result = FHE.add(encA, encB);
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }

    /// @notice Add encrypted + plaintext
    function addPlaintext(uint32 a, uint32 plaintextB) external {
        euint32 encA = FHE.asEuint32(a);
        _result = FHE.add(encA, plaintextB);
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }

    /// @notice Subtract two encrypted values
    function subEncrypted(uint32 a, uint32 b) external {
        euint32 encA = FHE.asEuint32(a);
        euint32 encB = FHE.asEuint32(b);
        _result = FHE.sub(encA, encB);
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }

    /// @notice Multiply two encrypted values
    function mulEncrypted(uint32 a, uint32 b) external {
        euint32 encA = FHE.asEuint32(a);
        euint32 encB = FHE.asEuint32(b);
        _result = FHE.mul(encA, encB);
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }

    /// @notice Divide encrypted by plaintext (encrypted / plaintext only!)
    function divByPlaintext(uint32 a, uint32 plaintextB) external {
        euint32 encA = FHE.asEuint32(a);
        _result = FHE.div(encA, plaintextB);
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }

    /// @notice Remainder: encrypted % plaintext
    function remByPlaintext(uint32 a, uint32 plaintextB) external {
        euint32 encA = FHE.asEuint32(a);
        _result = FHE.rem(encA, plaintextB);
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }

    /// @notice Min of two encrypted values
    function minEncrypted(uint32 a, uint32 b) external {
        euint32 encA = FHE.asEuint32(a);
        euint32 encB = FHE.asEuint32(b);
        _result = FHE.min(encA, encB);
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }

    /// @notice Max of two encrypted values
    function maxEncrypted(uint32 a, uint32 b) external {
        euint32 encA = FHE.asEuint32(a);
        euint32 encB = FHE.asEuint32(b);
        _result = FHE.max(encA, encB);
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }

    /// @notice Negate encrypted value
    function negEncrypted(uint32 a) external {
        euint32 encA = FHE.asEuint32(a);
        _result = FHE.neg(encA);
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }
}
