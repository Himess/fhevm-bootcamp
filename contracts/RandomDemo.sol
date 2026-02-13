// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint32, euint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title RandomDemo - Module 09: On-chain encrypted randomness
contract RandomDemo is ZamaEthereumConfig {
    euint8 private _random8;
    euint32 private _random32;
    euint64 private _random64;

    event RandomGenerated(address indexed by, string randomType);

    function generateRandom8() external {
        _random8 = FHE.randEuint8();
        FHE.allowThis(_random8);
        FHE.allow(_random8, msg.sender);
        emit RandomGenerated(msg.sender, "uint8");
    }

    function generateRandom32() external {
        _random32 = FHE.randEuint32();
        FHE.allowThis(_random32);
        FHE.allow(_random32, msg.sender);
        emit RandomGenerated(msg.sender, "uint32");
    }

    function generateRandom64() external {
        _random64 = FHE.randEuint64();
        FHE.allowThis(_random64);
        FHE.allow(_random64, msg.sender);
        emit RandomGenerated(msg.sender, "uint64");
    }

    /// @notice Generate random in range [0, max) using modulo
    function randomInRange(uint32 max) external {
        require(max > 0, "Max must be > 0");
        _random32 = FHE.rem(FHE.randEuint32(), max);
        FHE.allowThis(_random32);
        FHE.allow(_random32, msg.sender);
        emit RandomGenerated(msg.sender, "range");
    }

    ebool private _randomBool;

    function generateRandomBool() external {
        _randomBool = FHE.randEbool();
        FHE.allowThis(_randomBool);
        FHE.allow(_randomBool, msg.sender);
        emit RandomGenerated(msg.sender, "bool");
    }

    function getRandomBool() external view returns (ebool) { return _randomBool; }
    function getRandom8() external view returns (euint8) { return _random8; }
    function getRandom32() external view returns (euint32) { return _random32; }
    function getRandom64() external view returns (euint64) { return _random64; }
}
