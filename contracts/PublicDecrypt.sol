// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title PublicDecrypt - Module 07: Public decryption demo
/// @notice Demonstrates encrypted storage, user-specific decryption, and public decryptability
/// @dev fhEVM v0.9+ decryption flow (Gateway/Oracle pattern was discontinued):
///      1. On-chain:  FHE.makePubliclyDecryptable(ciphertext) marks a value for decryption
///      2. Off-chain: publicDecrypt() via the relayer SDK retrieves the plaintext
///      3. On-chain:  FHE.checkSignatures() verifies the decrypted result before use
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
    function setEncryptedValue(externalEuint32 encValue, bytes calldata inputProof) external {
        _encryptedValue = FHE.fromExternal(encValue, inputProof);
        FHE.allowThis(_encryptedValue);
        FHE.allow(_encryptedValue, msg.sender);
        hasValue = true;
        isPubliclyDecryptable = false;
        emit ValueSet(msg.sender);
    }

    /// @notice Make the encrypted value publicly decryptable
    /// @dev After calling this, anyone can retrieve the plaintext off-chain via publicDecrypt() (Relayer SDK)
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
