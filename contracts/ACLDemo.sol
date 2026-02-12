// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ACLDemo - Module 05: Access Control List demonstrations
contract ACLDemo is ZamaEthereumConfig {
    euint32 private _ownerSecret;
    address public owner;

    event SecretUpdated(address indexed by);
    event AccessGranted(address indexed to);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    /// @notice Owner sets a secret value and grants themselves access
    function setSecret(uint32 value) external onlyOwner {
        _ownerSecret = FHE.asEuint32(value);
        FHE.allowThis(_ownerSecret);
        FHE.allow(_ownerSecret, msg.sender);
        emit SecretUpdated(msg.sender);
    }

    /// @notice Owner grants access to another address
    function grantAccess(address to) external onlyOwner {
        FHE.allow(_ownerSecret, to);
        emit AccessGranted(to);
    }

    /// @notice Get the encrypted secret handle (ACL protected)
    function getSecret() external view returns (euint32) {
        return _ownerSecret;
    }

    /// @notice Check if caller has access to the secret
    function checkAccess() external view returns (bool) {
        return FHE.isSenderAllowed(_ownerSecret);
    }
}
