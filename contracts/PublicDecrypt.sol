// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title PublicDecrypt - Module 07: Public decryption demo
/// @notice Demonstrates encrypted storage, user-specific decryption, and public decryptability
/// @dev In production, public decryption uses the Gateway callback pattern (GatewayConfig).
///      This contract demonstrates the `FHE.makePubliclyDecryptable()` pattern available in fhEVM v0.10.
///
// ──────────────────────────────────────────────────────────────────────
// GATEWAY CALLBACK REFERENCE (for devnet/mainnet with Gateway deployed)
// ──────────────────────────────────────────────────────────────────────
//
// On networks where the Gateway is deployed (Ethereum Sepolia, mainnet), you can
// use the async decryption callback pattern instead of makePubliclyDecryptable():
//
//   import {Gateway} from "@fhevm/solidity/gateway/GatewayConfig.sol";
//
//   uint256[] memory cts = new uint256[](1);
//   cts[0] = FHE.toUint256(_encryptedValue);
//   Gateway.requestDecryption(cts, this.decryptionCallback.selector, 0, block.timestamp + 100, false);
//
//   function decryptionCallback(uint256 requestId, uint32 decryptedValue) public onlyGateway returns (bool) {
//       revealedValue = decryptedValue;
//       return true;
//   }
//
// The Gateway pattern provides on-chain access to the decrypted plaintext via a callback.
// makePubliclyDecryptable() instead marks values for off-chain decryption by anyone via the KMS.
// Both patterns are valid; choose based on whether you need the plaintext on-chain or off-chain.
// ──────────────────────────────────────────────────────────────────────
contract PublicDecrypt is ZamaEthereumConfig {
    euint32 private _encryptedValue;
    bool public hasValue;
    bool public isPubliclyDecryptable;

    event ValueSet(address indexed by);
    event ValueMadePublic(address indexed by);

    /// @notice Store an encrypted value from plaintext (owner convenience)
    function setValue(uint32 value) external {
        _encryptedValue = FHE.asEuint32(value);
        FHE.allowThis(_encryptedValue);
        FHE.allow(_encryptedValue, msg.sender);
        hasValue = true;
        isPubliclyDecryptable = false;
        emit ValueSet(msg.sender);
    }

    /// @notice Store an encrypted value from encrypted input
    function setEncryptedValue(externalEuint32 encValue, bytes calldata proof) external {
        _encryptedValue = FHE.fromExternal(encValue, proof);
        FHE.allowThis(_encryptedValue);
        FHE.allow(_encryptedValue, msg.sender);
        hasValue = true;
        isPubliclyDecryptable = false;
        emit ValueSet(msg.sender);
    }

    /// @notice Make the encrypted value publicly decryptable
    /// @dev After calling this, anyone with the handle can request decryption via the Gateway/KMS
    function makePublic() external {
        require(hasValue, "No value set");
        FHE.makePubliclyDecryptable(_encryptedValue);
        isPubliclyDecryptable = true;
        emit ValueMadePublic(msg.sender);
    }

    /// @notice Get the encrypted handle (for off-chain decryption via reencryption)
    function getEncryptedValue() external view returns (euint32) {
        return _encryptedValue;
    }

    /// @notice Perform a comparison and get the encrypted result
    function compare(uint32 a, uint32 b) external returns (ebool) {
        ebool result = FHE.gt(FHE.asEuint32(a), FHE.asEuint32(b));
        FHE.allowThis(result);
        FHE.allow(result, msg.sender);
        return result;
    }
}
