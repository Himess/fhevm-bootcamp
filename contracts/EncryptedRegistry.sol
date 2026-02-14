// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title EncryptedRegistry - Module 17: Encrypted key-value storage with sharing
/// @notice A per-user encrypted key-value registry. Users can store encrypted uint64 values
///         under string keys, retrieve them, share access with other users, and delete entries.
///         Each user's storage is isolated -- only the owner (and explicitly shared recipients)
///         can access the encrypted values.
contract EncryptedRegistry is ZamaEthereumConfig {
    /// @dev Per-user, per-key encrypted value storage
    mapping(address => mapping(string => euint64)) private _store;

    /// @dev Track whether a key has been set for a user (plaintext, for existence checks)
    mapping(address => mapping(string => bool)) private _hasKey;

    /// @dev Track all keys a user has set (for enumeration)
    mapping(address => string[]) private _userKeys;

    /// @dev Track key index for efficient deletion from the keys array
    mapping(address => mapping(string => uint256)) private _keyIndex;

    event ValueSet(address indexed user, string key);
    event ValueDeleted(address indexed user, string key);
    event ValueShared(address indexed owner, string key, address indexed recipient);

    /// @notice Store an encrypted value under a string key
    /// @dev Overwrites any existing value for the same key. The caller is always
    ///      the owner of the key-value pair.
    /// @param key The string key to store under
    /// @param encValue The encrypted uint64 value
    /// @param inputProof Proof for the encrypted input
    function setValue(string calldata key, externalEuint64 encValue, bytes calldata inputProof) external {
        require(bytes(key).length > 0, "Key cannot be empty");
        require(bytes(key).length <= 64, "Key too long");

        euint64 value = FHE.fromExternal(encValue, inputProof);

        _store[msg.sender][key] = value;
        FHE.allowThis(_store[msg.sender][key]);
        FHE.allow(_store[msg.sender][key], msg.sender);

        // Track the key if it is new
        if (!_hasKey[msg.sender][key]) {
            _keyIndex[msg.sender][key] = _userKeys[msg.sender].length;
            _userKeys[msg.sender].push(key);
            _hasKey[msg.sender][key] = true;
        }

        emit ValueSet(msg.sender, key);
    }

    /// @notice Retrieve the encrypted value stored under a key
    /// @dev Returns the euint64 handle. The caller must have ACL access to decrypt.
    ///      If the key does not exist, returns an uninitialized handle.
    /// @param key The string key to look up
    /// @return The encrypted value handle
    function getValue(string calldata key) external view returns (euint64) {
        return _store[msg.sender][key];
    }

    /// @notice Retrieve another user's encrypted value (requires ACL sharing)
    /// @dev The value owner must have previously called shareValue() to grant access.
    /// @param owner_ The address that owns the value
    /// @param key The string key to look up
    /// @return The encrypted value handle
    function getSharedValue(address owner_, string calldata key) external view returns (euint64) {
        return _store[owner_][key];
    }

    /// @notice Check whether a key has been set (plaintext existence check)
    /// @param key The string key to check
    /// @return True if the key has a stored value
    function hasValue(string calldata key) external view returns (bool) {
        return _hasKey[msg.sender][key];
    }

    /// @notice Check whether another user has a specific key set
    /// @param user The address to check
    /// @param key The string key to check
    /// @return True if the user has a stored value for that key
    function hasValueFor(address user, string calldata key) external view returns (bool) {
        return _hasKey[user][key];
    }

    /// @notice Share an encrypted value with another user by granting them ACL access
    /// @dev The recipient can then call getSharedValue() and decrypt the value.
    ///      This does NOT copy the value -- it grants read access to the same handle.
    /// @param key The string key of the value to share
    /// @param recipient The address to grant access to
    function shareValue(string calldata key, address recipient) external {
        require(_hasKey[msg.sender][key], "Key does not exist");
        require(recipient != address(0), "Cannot share with zero address");
        require(recipient != msg.sender, "Cannot share with self");

        FHE.allow(_store[msg.sender][key], recipient);

        emit ValueShared(msg.sender, key, recipient);
    }

    /// @notice Delete a stored value
    /// @dev Clears the encrypted value and removes the key from tracking.
    ///      Sets the stored value to encrypted 0 (cannot truly delete an FHE handle,
    ///      but we overwrite it and mark it as unset).
    /// @param key The string key to delete
    function deleteValue(string calldata key) external {
        require(_hasKey[msg.sender][key], "Key does not exist");

        // Overwrite with encrypted zero
        _store[msg.sender][key] = FHE.asEuint64(0);
        FHE.allowThis(_store[msg.sender][key]);

        // Remove from keys array using swap-and-pop
        uint256 index = _keyIndex[msg.sender][key];
        uint256 lastIndex = _userKeys[msg.sender].length - 1;

        if (index != lastIndex) {
            string memory lastKey = _userKeys[msg.sender][lastIndex];
            _userKeys[msg.sender][index] = lastKey;
            _keyIndex[msg.sender][lastKey] = index;
        }

        _userKeys[msg.sender].pop();
        delete _keyIndex[msg.sender][key];
        _hasKey[msg.sender][key] = false;

        emit ValueDeleted(msg.sender, key);
    }

    /// @notice Get the number of keys stored by the caller
    /// @return The number of active keys
    function getKeyCount() external view returns (uint256) {
        return _userKeys[msg.sender].length;
    }

    /// @notice Get a key by index (for enumeration)
    /// @param index The index in the user's key array
    /// @return The key string at that index
    function getKeyAtIndex(uint256 index) external view returns (string memory) {
        require(index < _userKeys[msg.sender].length, "Index out of bounds");
        return _userKeys[msg.sender][index];
    }
}
