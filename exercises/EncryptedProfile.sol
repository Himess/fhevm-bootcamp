// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ebool, euint8, euint32, eaddress} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title EncryptedProfile - Exercise: Build an encrypted user profile
/// @notice Students: implement the TODO sections
contract EncryptedProfile is ZamaEthereumConfig {
    // TODO 1: Declare encrypted state variables
    // - _isVerified (ebool)
    // - _age (euint8)
    // - _score (euint32)

    address public profileOwner;

    constructor() {
        profileOwner = msg.sender;
        // TODO 2: Initialize encrypted variables with default values
    }

    modifier onlyOwner() {
        require(msg.sender == profileOwner, "Not owner");
        _;
    }

    /// @notice Set the verification status
    /// TODO 3: Implement this function
    /// - Accept a bool parameter
    /// - Convert to ebool using FHE.asEbool()
    /// - Set ACL permissions (allowThis + allow for msg.sender)
    function setVerified(bool value) external onlyOwner {
        // YOUR CODE HERE
    }

    /// @notice Set the age
    /// TODO 4: Implement this function
    function setAge(uint8 value) external onlyOwner {
        // YOUR CODE HERE
    }

    /// @notice Set the score
    /// TODO 5: Implement this function
    function setScore(uint32 value) external onlyOwner {
        // YOUR CODE HERE
    }

    /// @notice Get the encrypted verification status
    function getVerified() external view returns (ebool) {
        // TODO 6: Return the encrypted bool
    }

    /// @notice Get the encrypted age
    function getAge() external view returns (euint8) {
        // TODO 6: Return the encrypted age
    }

    /// @notice Get the encrypted score
    function getScore() external view returns (euint32) {
        // TODO 6: Return the encrypted score
    }

    /// @notice Check if age is above a threshold (returns encrypted bool)
    /// TODO 7 (Bonus): Implement using FHE.ge()
    function isAboveAge(uint8 threshold) external returns (ebool) {
        // YOUR CODE HERE
        // Hint: FHE.ge(_age, FHE.asEuint8(threshold))
    }
}
