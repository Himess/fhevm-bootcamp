// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title IConfidentialToken - Interface for cross-contract encrypted balance reading
interface IConfidentialToken {
    function balanceOf(address account) external view returns (euint64);
}

/// @title CrossContractToken - A simple confidential token that exposes encrypted balances
/// @notice Demonstrates the "provider" side of cross-contract FHE composability (Module 17)
contract CrossContractToken is ZamaEthereumConfig {
    string public name;
    address public owner;
    mapping(address => euint64) private _balances;

    event Mint(address indexed to, uint64 amount);
    event BalanceAccessGranted(address indexed user, address indexed grantedTo);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor(string memory _name) {
        name = _name;
        owner = msg.sender;
    }

    /// @notice Mint tokens (plaintext amount, only owner)
    function mint(address to, uint64 amount) external onlyOwner {
        _balances[to] = FHE.add(_balances[to], amount);
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);
        emit Mint(to, amount);
    }

    /// @notice Get encrypted balance handle — requires ACL access
    function balanceOf(address account) external view returns (euint64) {
        return _balances[account];
    }

    /// @notice User grants another contract access to read their encrypted balance
    /// @dev This is the KEY cross-contract pattern: user must explicitly grant access
    function grantBalanceAccess(address to) external {
        FHE.allow(_balances[msg.sender], to);
        emit BalanceAccessGranted(msg.sender, to);
    }
}

/// @title CrossContractVault - Reads encrypted balances from CrossContractToken
/// @notice Demonstrates the "consumer" side of cross-contract FHE composability (Module 17)
/// @dev This contract reads encrypted data from CrossContractToken via ACL grants
contract CrossContractVault is ZamaEthereumConfig {
    IConfidentialToken public token;
    address public owner;

    // Vault stores its own encrypted deposits per user
    mapping(address => euint64) private _vaultDeposits;
    // Track encrypted rewards per user
    mapping(address => euint64) private _rewards;

    uint64 public constant REWARD_RATE = 10; // 10% reward

    event Deposited(address indexed user, uint64 amount);
    event RewardComputed(address indexed user);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor(address _token) {
        token = IConfidentialToken(_token);
        owner = msg.sender;
    }

    /// @notice Deposit a plaintext amount into the vault
    function deposit(uint64 amount) external {
        _vaultDeposits[msg.sender] = FHE.add(_vaultDeposits[msg.sender], amount);
        FHE.allowThis(_vaultDeposits[msg.sender]);
        FHE.allow(_vaultDeposits[msg.sender], msg.sender);
        emit Deposited(msg.sender, amount);
    }

    /// @notice Compute reward based on token balance (cross-contract read!)
    /// @dev User must first call token.grantBalanceAccess(vaultAddress)
    ///      so that this vault has ACL access to read their encrypted balance
    function computeReward(address user) external onlyOwner {
        // Cross-contract read: get the user's encrypted token balance
        // This only works if the user granted ACL access to this vault contract
        euint64 tokenBalance = token.balanceOf(user);

        // Compute reward: 10% of token balance
        // Uses plaintext operand for gas efficiency (Module 15 pattern)
        euint64 reward = FHE.div(FHE.mul(tokenBalance, REWARD_RATE), 100);

        // Store the reward — this is a NEW encrypted value with its own ACL
        _rewards[user] = reward;
        FHE.allowThis(_rewards[user]);
        FHE.allow(_rewards[user], user);

        emit RewardComputed(user);
    }

    /// @notice Get encrypted vault deposit handle
    function getDeposit(address user) external view returns (euint64) {
        return _vaultDeposits[user];
    }

    /// @notice Get encrypted reward handle
    function getReward(address user) external view returns (euint64) {
        return _rewards[user];
    }
}
