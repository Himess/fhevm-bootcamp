// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title SimpleCounter - Module 10: Frontend integration demo contract
contract SimpleCounter is ZamaEthereumConfig {
    mapping(address => euint32) private _counts;

    event CountIncremented(address indexed user);

    /// @notice Increment caller's counter by encrypted value
    function increment(externalEuint32 encValue, bytes calldata inputProof) external {
        euint32 value = FHE.fromExternal(encValue, inputProof);
        _counts[msg.sender] = FHE.add(_counts[msg.sender], value);
        FHE.allowThis(_counts[msg.sender]);
        FHE.allow(_counts[msg.sender], msg.sender);
        emit CountIncremented(msg.sender);
    }

    /// @notice Get caller's encrypted count handle (for reencryption)
    function getMyCount() external view returns (euint32) {
        return _counts[msg.sender];
    }
}
