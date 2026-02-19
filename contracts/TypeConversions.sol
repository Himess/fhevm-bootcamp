// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, ebool, euint8, euint16, euint32, euint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title TypeConversions - Module 03: Demonstrates type casting between encrypted types
contract TypeConversions is ZamaEthereumConfig {
    euint8 private _result8;
    euint16 private _result16;
    euint32 private _result32;
    euint64 private _result64;
    ebool private _resultBool;

    /// @notice Upcast: euint8 -> euint32
    function upcast8to32(uint8 value) external {
        euint8 enc8 = FHE.asEuint8(value);
        _result32 = FHE.asEuint32(enc8);
        FHE.allowThis(_result32);
        FHE.allow(_result32, msg.sender);
    }

    function getResult32() external view returns (euint32) {
        return _result32;
    }

    /// @notice Upcast: euint16 -> euint64
    function upcast16to64(uint16 value) external {
        euint16 enc16 = FHE.asEuint16(value);
        _result64 = FHE.asEuint64(enc16);
        FHE.allowThis(_result64);
        FHE.allow(_result64, msg.sender);
    }

    function getResult64() external view returns (euint64) {
        return _result64;
    }

    /// @notice Comparison result: euint32 eq euint32 -> ebool
    function compareEqual(uint32 a, uint32 b) external {
        euint32 encA = FHE.asEuint32(a);
        euint32 encB = FHE.asEuint32(b);
        _resultBool = FHE.eq(encA, encB);
        FHE.allowThis(_resultBool);
        FHE.allow(_resultBool, msg.sender);
    }

    function getResultBool() external view returns (ebool) {
        return _resultBool;
    }

    /// @notice Plaintext to encrypted conversion
    function plaintextToEncrypted(uint32 plainValue) external {
        _result32 = FHE.asEuint32(plainValue);
        FHE.allowThis(_result32);
        FHE.allow(_result32, msg.sender);
    }
}
