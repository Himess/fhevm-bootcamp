// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Solution 4: Confidential Token
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
        _balances[to] = FHE.add(_balances[to], amount);
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);
    }

    function transfer(address to, externalEuint64 encAmount, bytes calldata inputProof) external {
        euint64 amount = FHE.fromExternal(encAmount, inputProof);

        // Check balance without reverting
        ebool hasBalance = FHE.ge(_balances[msg.sender], amount);
        euint64 actualAmount = FHE.select(hasBalance, amount, FHE.asEuint64(0));

        // Update balances
        _balances[msg.sender] = FHE.sub(_balances[msg.sender], actualAmount);
        _balances[to] = FHE.add(_balances[to], actualAmount);

        // Set ACL
        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);
    }

    function balanceOf(address account) external view returns (euint64) {
        return _balances[account];
    }
}
