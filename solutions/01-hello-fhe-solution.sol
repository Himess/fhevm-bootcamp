// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Solution 1: Hello FHE
contract HelloFHESolution is ZamaEthereumConfig {
    euint32 private _secret;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function setSecret(uint32 value) external {
        _secret = FHE.asEuint32(value);
        FHE.allowThis(_secret);
        FHE.allow(_secret, msg.sender);
    }

    function setSecretEncrypted(externalEuint32 encValue, bytes calldata inputProof) external {
        _secret = FHE.fromExternal(encValue, inputProof);
        FHE.allowThis(_secret);
        FHE.allow(_secret, msg.sender);
    }

    function getSecret() external view returns (euint32) {
        return _secret;
    }
}
