// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint64, externalEuint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title UserDecrypt - Module 05/07: Per-user secret storage with access sharing
/// @notice Demonstrates ACL-gated user decryption patterns
contract UserDecrypt is ZamaEthereumConfig {
    mapping(address => euint32) private _userSecrets;

    event SecretStored(address indexed user);

    /// @notice User stores their own encrypted secret
    function storeSecret(externalEuint32 encValue, bytes calldata inputProof) external {
        _userSecrets[msg.sender] = FHE.fromExternal(encValue, inputProof);
        FHE.allowThis(_userSecrets[msg.sender]);
        FHE.allow(_userSecrets[msg.sender], msg.sender);
        emit SecretStored(msg.sender);
    }

    /// @notice Get own secret handle (only the user has ACL access)
    function getMySecret() external view returns (euint32) {
        require(FHE.isSenderAllowed(_userSecrets[msg.sender]), "No secret stored or no access");
        return _userSecrets[msg.sender];
    }

    /// @notice Grant another address access to caller's secret
    function shareSecret(address to) external {
        require(euint32.unwrap(_userSecrets[msg.sender]) != 0, "No secret stored");
        FHE.allow(_userSecrets[msg.sender], to);
    }

    /// @notice Get another user's secret (requires ACL access via shareSecret)
    function getSharedSecret(address owner) external view returns (euint32) {
        require(euint32.unwrap(_userSecrets[owner]) != 0, "No secret stored");
        require(FHE.isSenderAllowed(_userSecrets[owner]), "Not authorized");
        return _userSecrets[owner];
    }

    /// @notice Check if caller has access to a specific user's secret
    function canAccess(address user) external view returns (bool) {
        return FHE.isSenderAllowed(_userSecrets[user]);
    }
}
