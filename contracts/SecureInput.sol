// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint8, euint32, euint64, ebool, externalEuint8, externalEuint32, externalEuint64, externalEbool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title SecureInput - Module 06: Encrypted inputs & ZK proofs
contract SecureInput is ZamaEthereumConfig {
    euint8 private _storedUint8;
    euint32 private _storedUint32;
    euint64 private _storedUint64;
    ebool private _storedBool;

    event InputStored(address indexed sender, string inputType);

    /// @notice Store an encrypted uint8 from external input
    function storeUint8(externalEuint8 encValue, bytes calldata inputProof) external {
        _storedUint8 = FHE.fromExternal(encValue, inputProof);
        FHE.allowThis(_storedUint8);
        FHE.allow(_storedUint8, msg.sender);
        emit InputStored(msg.sender, "uint8");
    }

    /// @notice Store an encrypted uint32 from external input
    function storeUint32(externalEuint32 encValue, bytes calldata inputProof) external {
        _storedUint32 = FHE.fromExternal(encValue, inputProof);
        FHE.allowThis(_storedUint32);
        FHE.allow(_storedUint32, msg.sender);
        emit InputStored(msg.sender, "uint32");
    }

    /// @notice Store an encrypted uint64 from external input
    function storeUint64(externalEuint64 encValue, bytes calldata inputProof) external {
        _storedUint64 = FHE.fromExternal(encValue, inputProof);
        FHE.allowThis(_storedUint64);
        FHE.allow(_storedUint64, msg.sender);
        emit InputStored(msg.sender, "uint64");
    }

    /// @notice Store an encrypted bool from external input
    function storeBool(externalEbool encValue, bytes calldata inputProof) external {
        _storedBool = FHE.fromExternal(encValue, inputProof);
        FHE.allowThis(_storedBool);
        FHE.allow(_storedBool, msg.sender);
        emit InputStored(msg.sender, "bool");
    }

    /// @notice Store multiple encrypted values in one transaction (shared proof)
    function storeMultiple(externalEuint32 encA, externalEuint64 encB, bytes calldata inputProof) external {
        _storedUint32 = FHE.fromExternal(encA, inputProof);
        _storedUint64 = FHE.fromExternal(encB, inputProof);
        FHE.allowThis(_storedUint32);
        FHE.allow(_storedUint32, msg.sender);
        FHE.allowThis(_storedUint64);
        FHE.allow(_storedUint64, msg.sender);
        emit InputStored(msg.sender, "multiple");
    }

    function getStoredUint8() external view returns (euint8) {
        return _storedUint8;
    }
    function getStoredUint32() external view returns (euint32) {
        return _storedUint32;
    }
    function getStoredUint64() external view returns (euint64) {
        return _storedUint64;
    }
    function getStoredBool() external view returns (ebool) {
        return _storedBool;
    }
}
