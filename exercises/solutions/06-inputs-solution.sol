// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint64, externalEuint32, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract InputSolution is ZamaEthereumConfig {
    mapping(address => euint64) private _balances;
    euint32 private _totalDeposits;
    address public owner;

    constructor() {
        owner = msg.sender;
        _totalDeposits = FHE.asEuint32(0);
        FHE.allowThis(_totalDeposits);
    }

    function deposit(externalEuint64 encAmount, bytes calldata proof) external {
        euint64 amount = FHE.fromExternal(encAmount, proof);
        _balances[msg.sender] = FHE.add(_balances[msg.sender], amount);
        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);
    }

    euint32 private _maxResult;

    function findMax(
        externalEuint32 encA, bytes calldata proofA,
        externalEuint32 encB, bytes calldata proofB
    ) external {
        euint32 a = FHE.fromExternal(encA, proofA);
        euint32 b = FHE.fromExternal(encB, proofB);
        ebool aIsGreater = FHE.gt(a, b);
        _maxResult = FHE.select(aIsGreater, a, b);
        FHE.allowThis(_maxResult);
        FHE.allow(_maxResult, msg.sender);
    }

    function getMyBalance() external view returns (euint64) {
        return _balances[msg.sender];
    }

    function getMaxResult() external view returns (euint32) {
        return _maxResult;
    }
}
