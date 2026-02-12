// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ConditionalDemo - Module 08: Branch-free conditional logic
contract ConditionalDemo is ZamaEthereumConfig {
    euint32 private _result;

    function getResult() external view returns (euint32) {
        return _result;
    }

    /// @notice Basic select: if condition then a else b
    function selectDemo(uint32 a, uint32 b, bool condition) external {
        euint32 encA = FHE.asEuint32(a);
        euint32 encB = FHE.asEuint32(b);
        ebool encCondition = FHE.asEbool(condition);
        _result = FHE.select(encCondition, encA, encB);
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }

    /// @notice Clamp a value between min and max (branch-free)
    function clampValue(uint32 value, uint32 minVal, uint32 maxVal) external {
        euint32 encValue = FHE.asEuint32(value);
        euint32 encMin = FHE.asEuint32(minVal);
        euint32 encMax = FHE.asEuint32(maxVal);

        // if value > max, use max
        ebool isAboveMax = FHE.gt(encValue, encMax);
        euint32 clamped = FHE.select(isAboveMax, encMax, encValue);

        // if clamped < min, use min
        ebool isBelowMin = FHE.lt(clamped, encMin);
        _result = FHE.select(isBelowMin, encMin, clamped);

        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }
}
