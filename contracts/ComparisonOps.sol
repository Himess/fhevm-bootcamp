// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ComparisonOps - Module 04: Comparison operations returning ebool
contract ComparisonOps is ZamaEthereumConfig {
    ebool private _result;

    function getResult() external view returns (ebool) {
        return _result;
    }

    function eqOp(uint32 a, uint32 b) external {
        _result = FHE.eq(FHE.asEuint32(a), FHE.asEuint32(b));
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }

    function neOp(uint32 a, uint32 b) external {
        _result = FHE.ne(FHE.asEuint32(a), FHE.asEuint32(b));
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }

    function ltOp(uint32 a, uint32 b) external {
        _result = FHE.lt(FHE.asEuint32(a), FHE.asEuint32(b));
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }

    function leOp(uint32 a, uint32 b) external {
        _result = FHE.le(FHE.asEuint32(a), FHE.asEuint32(b));
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }

    function gtOp(uint32 a, uint32 b) external {
        _result = FHE.gt(FHE.asEuint32(a), FHE.asEuint32(b));
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }

    function geOp(uint32 a, uint32 b) external {
        _result = FHE.ge(FHE.asEuint32(a), FHE.asEuint32(b));
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }
}
