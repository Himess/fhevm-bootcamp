// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ebool, euint8, euint16, euint32, euint64, eaddress} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title EncryptedTypes - Module 03: Demonstrates all encrypted types
contract EncryptedTypes is ZamaEthereumConfig {
    ebool private _secretBool;
    euint8 private _secretUint8;
    euint16 private _secretUint16;
    euint32 private _secretUint32;
    euint64 private _secretUint64;
    eaddress private _secretAddress;

    // --- Bool ---
    function setBool(bool value) external {
        _secretBool = FHE.asEbool(value);
        FHE.allowThis(_secretBool);
        FHE.allow(_secretBool, msg.sender);
    }

    function getBool() external view returns (ebool) {
        return _secretBool;
    }

    // --- Uint8 ---
    function setUint8(uint8 value) external {
        _secretUint8 = FHE.asEuint8(value);
        FHE.allowThis(_secretUint8);
        FHE.allow(_secretUint8, msg.sender);
    }

    function getUint8() external view returns (euint8) {
        return _secretUint8;
    }

    // --- Uint16 ---
    function setUint16(uint16 value) external {
        _secretUint16 = FHE.asEuint16(value);
        FHE.allowThis(_secretUint16);
        FHE.allow(_secretUint16, msg.sender);
    }

    function getUint16() external view returns (euint16) {
        return _secretUint16;
    }

    // --- Uint32 ---
    function setUint32(uint32 value) external {
        _secretUint32 = FHE.asEuint32(value);
        FHE.allowThis(_secretUint32);
        FHE.allow(_secretUint32, msg.sender);
    }

    function getUint32() external view returns (euint32) {
        return _secretUint32;
    }

    // --- Uint64 ---
    function setUint64(uint64 value) external {
        _secretUint64 = FHE.asEuint64(value);
        FHE.allowThis(_secretUint64);
        FHE.allow(_secretUint64, msg.sender);
    }

    function getUint64() external view returns (euint64) {
        return _secretUint64;
    }

    // --- Address ---
    function setAddress(address value) external {
        _secretAddress = FHE.asEaddress(value);
        FHE.allowThis(_secretAddress);
        FHE.allow(_secretAddress, msg.sender);
    }

    function getAddress() external view returns (eaddress) {
        return _secretAddress;
    }
}
