// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Solution 3: ConfidentialToken — Encrypted ERC20-like Token with ACL
contract ConfidentialToken is ZamaEthereumConfig {
    address public owner;
    mapping(address => euint64) private _balances;
    mapping(address => bool) private _initialized;
    mapping(address => mapping(address => bool)) private _approvals;

    event Transfer(address indexed from, address indexed to);
    event Mint(address indexed to);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function _ensureInitialized(address user) internal {
        if (!_initialized[user]) {
            _balances[user] = FHE.asEuint64(0);
            FHE.allowThis(_balances[user]);
            FHE.allow(_balances[user], user);
            _initialized[user] = true;
        }
    }

    function mint(address to, uint64 amount) public onlyOwner {
        _ensureInitialized(to);
        _balances[to] = FHE.add(_balances[to], FHE.asEuint64(amount));
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);
        emit Mint(to);
    }

    function transfer(address to, uint64 amount) public {
        _ensureInitialized(msg.sender);
        _ensureInitialized(to);

        euint64 amt = FHE.asEuint64(amount);
        ebool hasEnough = FHE.ge(_balances[msg.sender], amt);

        euint64 newSenderBal = FHE.sub(_balances[msg.sender], amt);
        euint64 newReceiverBal = FHE.add(_balances[to], amt);

        _balances[msg.sender] = FHE.select(hasEnough, newSenderBal, _balances[msg.sender]);
        _balances[to] = FHE.select(hasEnough, newReceiverBal, _balances[to]);

        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);

        emit Transfer(msg.sender, to);
    }

    function approve(address spender) public {
        _approvals[msg.sender][spender] = true;
        if (_initialized[msg.sender]) {
            FHE.allow(_balances[msg.sender], spender);
        }
    }

    function balanceOf(address account) public view returns (euint64) {
        require(
            msg.sender == account || _approvals[account][msg.sender],
            "Not authorized"
        );
        require(
            FHE.isSenderAllowed(_balances[account]),
            "No ACL access"
        );
        return _balances[account];
    }

    function getMyBalance() public view returns (euint64) {
        require(FHE.isSenderAllowed(_balances[msg.sender]), "No ACL access");
        return _balances[msg.sender];
    }
}
