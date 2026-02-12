// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ConfidentialERC20 - Module 11: ERC-20 with encrypted balances
/// @notice Balances and allowances are encrypted. Transfer amounts are hidden.
/// @dev Key design: failed transfers silently transfer 0 (no revert = no info leak)
contract ConfidentialERC20 is ZamaEthereumConfig {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint64 public totalSupply;
    address public owner;

    mapping(address => euint64) internal _balances;
    mapping(address => mapping(address => euint64)) internal _allowances;

    event Transfer(address indexed from, address indexed to);
    event Approval(address indexed owner, address indexed spender);
    event Mint(address indexed to, uint64 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        decimals = 6;
        owner = msg.sender;
    }

    /// @notice Mint tokens to an address (plaintext amount, only owner)
    function mint(address to, uint64 amount) external onlyOwner {
        totalSupply += amount;
        _balances[to] = FHE.add(_balances[to], amount);
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);
        emit Mint(to, amount);
    }

    /// @notice Transfer encrypted amount to recipient
    /// @dev If balance < amount, transfers 0 instead of reverting (privacy!)
    function transfer(externalEuint64 encAmount, bytes calldata proof, address to) external {
        euint64 amount = FHE.fromExternal(encAmount, proof);
        _transfer(msg.sender, to, amount);
    }

    /// @notice Approve spender for encrypted amount
    function approve(externalEuint64 encAmount, bytes calldata proof, address spender) external {
        euint64 amount = FHE.fromExternal(encAmount, proof);
        _allowances[msg.sender][spender] = amount;
        FHE.allowThis(_allowances[msg.sender][spender]);
        FHE.allow(_allowances[msg.sender][spender], msg.sender);
        FHE.allow(_allowances[msg.sender][spender], spender);
        emit Approval(msg.sender, spender);
    }

    /// @notice TransferFrom with allowance check
    function transferFrom(
        address from,
        externalEuint64 encAmount,
        bytes calldata proof,
        address to
    ) external {
        euint64 amount = FHE.fromExternal(encAmount, proof);

        // Check allowance
        ebool hasAllowance = FHE.ge(_allowances[from][msg.sender], amount);
        euint64 transferAmount = FHE.select(hasAllowance, amount, FHE.asEuint64(0));

        // Deduct allowance
        _allowances[from][msg.sender] = FHE.sub(_allowances[from][msg.sender], transferAmount);
        FHE.allowThis(_allowances[from][msg.sender]);
        FHE.allow(_allowances[from][msg.sender], from);
        FHE.allow(_allowances[from][msg.sender], msg.sender);

        _transfer(from, to, transferAmount);
    }

    /// @notice Get encrypted balance handle (ACL protected)
    function balanceOf(address account) external view returns (euint64) {
        return _balances[account];
    }

    /// @notice Get encrypted allowance handle
    function allowance(address _owner, address spender) external view returns (euint64) {
        return _allowances[_owner][spender];
    }

    /// @dev Internal transfer with balance check (transfers 0 on insufficient balance)
    function _transfer(address from, address to, euint64 amount) internal {
        // Check balance >= amount
        ebool hasBalance = FHE.ge(_balances[from], amount);
        euint64 actualAmount = FHE.select(hasBalance, amount, FHE.asEuint64(0));

        // Update balances
        _balances[from] = FHE.sub(_balances[from], actualAmount);
        _balances[to] = FHE.add(_balances[to], actualAmount);

        // Set ACL permissions
        FHE.allowThis(_balances[from]);
        FHE.allow(_balances[from], from);
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);

        emit Transfer(from, to);
    }
}
