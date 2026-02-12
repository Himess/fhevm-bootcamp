// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title HelloFHEVM - First FHEVM contract for bootcamp Module 02
/// @notice Demonstrates basic encrypted counter operations
contract HelloFHEVM is ZamaEthereumConfig {
    euint32 private _counter;
    address public owner;

    event CounterIncremented(address indexed by);

    constructor() {
        owner = msg.sender;
    }

    /// @notice Increment the counter by an encrypted value
    function increment(externalEuint32 encryptedValue, bytes calldata inputProof) external {
        euint32 value = FHE.fromExternal(encryptedValue, inputProof);
        _counter = FHE.add(_counter, value);
        FHE.allowThis(_counter);
        FHE.allow(_counter, msg.sender);
        emit CounterIncremented(msg.sender);
    }

    /// @notice Get the encrypted counter handle
    function getCounter() external view returns (euint32) {
        return _counter;
    }
}
