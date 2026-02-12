// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title BitwiseOps - Module 04: Bitwise operations on encrypted data
contract BitwiseOps is ZamaEthereumConfig {
    euint32 private _result;

    function getResult() external view returns (euint32) {
        return _result;
    }

    function andOp(uint32 a, uint32 b) external {
        _result = FHE.and(FHE.asEuint32(a), FHE.asEuint32(b));
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }

    function orOp(uint32 a, uint32 b) external {
        _result = FHE.or(FHE.asEuint32(a), FHE.asEuint32(b));
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }

    function xorOp(uint32 a, uint32 b) external {
        _result = FHE.xor(FHE.asEuint32(a), FHE.asEuint32(b));
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }

    function notOp(uint32 a) external {
        _result = FHE.not(FHE.asEuint32(a));
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }

    // --- Shift Operations ---

    function shlOp(uint32 a, uint8 b) external {
        _result = FHE.shl(FHE.asEuint32(a), FHE.asEuint8(b));
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }

    function shrOp(uint32 a, uint8 b) external {
        _result = FHE.shr(FHE.asEuint32(a), FHE.asEuint8(b));
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }

    function rotlOp(uint32 a, uint8 b) external {
        _result = FHE.rotl(FHE.asEuint32(a), FHE.asEuint8(b));
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }

    function rotrOp(uint32 a, uint8 b) external {
        _result = FHE.rotr(FHE.asEuint32(a), FHE.asEuint8(b));
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }
}
