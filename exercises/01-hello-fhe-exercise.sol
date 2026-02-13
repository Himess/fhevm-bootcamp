// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Exercise 1: Hello FHE
/// @notice Complete the TODOs to build your first FHE contract
contract HelloFHEExercise is ZamaEthereumConfig {
    euint32 private _secret;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    /// TODO 1: Store an encrypted value from plaintext
    /// Hint: Use FHE.asEuint32() and FHE.allowThis()
    function setSecret(uint32 value) external {
        // YOUR CODE HERE
    }

    /// TODO 2: Accept encrypted input from user
    /// Hint: Use FHE.fromExternal() with externalEuint32 and proof
    function setSecretEncrypted(externalEuint32 encValue, bytes calldata inputProof) external {
        // YOUR CODE HERE
    }

    /// TODO 3: Return the encrypted handle
    function getSecret() external view returns (euint32) {
        // YOUR CODE HERE
    }
}
