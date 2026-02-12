// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract ConfidentialTokenSolution is ZamaEthereumConfig {
    string public name;
    string public symbol;
    mapping(address => euint64) internal _balances;
    address public owner;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        owner = msg.sender;
    }

    function mint(address to, uint64 amount) external {
        require(msg.sender == owner, "Not owner");
        _balances[to] = FHE.add(_balances[to], FHE.asEuint64(amount));
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);
    }

    function transfer(address to, externalEuint64 encAmount, bytes calldata proof) external {
        euint64 amount = FHE.fromExternal(encAmount, proof);
        ebool hasEnough = FHE.ge(_balances[msg.sender], amount);
        euint64 transferAmount = FHE.select(hasEnough, amount, FHE.asEuint64(0));

        _balances[msg.sender] = FHE.sub(_balances[msg.sender], transferAmount);
        _balances[to] = FHE.add(_balances[to], transferAmount);

        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);
    }

    function balanceOf(address account) external view returns (euint64) {
        return _balances[account];
    }
}
