// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedOpsSolution is ZamaEthereumConfig {
    euint32 private _result;
    ebool private _boolResult;

    function getResult() external view returns (euint32) { return _result; }
    function getBoolResult() external view returns (ebool) { return _boolResult; }

    function addValues(uint32 a, uint32 b) external {
        _result = FHE.add(FHE.asEuint32(a), FHE.asEuint32(b));
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }

    function mulValues(uint32 a, uint32 b) external {
        _result = FHE.mul(FHE.asEuint32(a), FHE.asEuint32(b));
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }

    function isGreater(uint32 a, uint32 b) external {
        _boolResult = FHE.gt(FHE.asEuint32(a), FHE.asEuint32(b));
        FHE.allowThis(_boolResult);
        FHE.allow(_boolResult, msg.sender);
    }

    function findMin(uint32 a, uint32 b) external {
        _result = FHE.min(FHE.asEuint32(a), FHE.asEuint32(b));
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }
}
