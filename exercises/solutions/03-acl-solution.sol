// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract ACLSolution is ZamaEthereumConfig {
    mapping(address => euint64) private _balances;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function deposit(externalEuint64 encAmount, bytes calldata proof) external {
        euint64 amount = FHE.fromExternal(encAmount, proof);
        _balances[msg.sender] = FHE.add(_balances[msg.sender], amount);
        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);
    }

    function getBalance() external view returns (euint64) {
        return _balances[msg.sender];
    }

    function grantView(address viewer) external {
        FHE.allow(_balances[msg.sender], viewer);
    }
}
