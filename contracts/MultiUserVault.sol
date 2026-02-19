// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint64, externalEuint64, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title MultiUserVault - Module 05: Multi-user encrypted vault with ACL isolation
contract MultiUserVault is ZamaEthereumConfig {
    mapping(address => euint64) private _deposits;

    event Deposited(address indexed user);
    event Withdrawn(address indexed user);

    /// @notice Deposit an encrypted amount
    function deposit(externalEuint64 encAmount, bytes calldata inputProof) external {
        euint64 amount = FHE.fromExternal(encAmount, inputProof);
        _deposits[msg.sender] = FHE.add(_deposits[msg.sender], amount);
        FHE.allowThis(_deposits[msg.sender]);
        FHE.allow(_deposits[msg.sender], msg.sender);
        emit Deposited(msg.sender);
    }

    /// @notice Get caller's encrypted deposit handle
    function getMyDeposit() external view returns (euint64) {
        return _deposits[msg.sender];
    }

    /// @notice Withdraw: subtracts min(amount, balance) to prevent underflow
    function withdraw(externalEuint64 encAmount, bytes calldata inputProof) external {
        euint64 amount = FHE.fromExternal(encAmount, inputProof);
        ebool hasEnough = FHE.ge(_deposits[msg.sender], amount);
        euint64 withdrawAmount = FHE.select(hasEnough, amount, FHE.asEuint64(0));
        _deposits[msg.sender] = FHE.sub(_deposits[msg.sender], withdrawAmount);
        FHE.allowThis(_deposits[msg.sender]);
        FHE.allow(_deposits[msg.sender], msg.sender);
        emit Withdrawn(msg.sender);
    }
}
