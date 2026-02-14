// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint16, euint32, euint64, ebool, externalEuint32, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title OptimizedToken - Module 15 Solution
/// @notice The optimized version of InefficientToken with 30%+ gas savings.
///
/// OPTIMIZATIONS APPLIED:
///   1. Downsized euint64 → euint32 (balances capped at 1,000,000 fit in 32 bits)
///   2. Use plaintext operands instead of encrypting known constants
///   3. Pre-compute fee rate in plaintext (baseFee + surcharge = 3, a public value)
///   4. Replace comparison + select with FHE.max for threshold check
///   5. Remove redundant balance check (only check once with total deduction)
///   6. Batch parameter update into a single function
contract OptimizedToken is ZamaEthereumConfig {
    address public owner;

    // OPTIMIZATION 1: euint32 instead of euint64 (1,000,000 < 2^32)
    mapping(address => euint32) private _balances;
    mapping(address => bool) private _initialized;

    // Fee parameters (public, not secret) — stored as plain uint32
    uint32 public baseFee;
    uint32 public surcharge;

    // Threshold result — also downsized
    euint32 private _thresholdResult;

    event Minted(address indexed to, uint32 amount);
    event Transferred(address indexed from, address indexed to, uint32 amount);
    event ThresholdChecked(address indexed user);

    constructor() {
        owner = msg.sender;
        baseFee = 2;
        surcharge = 1;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function _initBalance(address user) internal {
        if (!_initialized[user]) {
            // OPTIMIZATION 2: use plaintext 0 directly
            _balances[user] = FHE.asEuint32(0);
            FHE.allowThis(_balances[user]);
            FHE.allow(_balances[user], user);
            _initialized[user] = true;
        }
    }

    /// @notice Mint tokens to an address
    function mint(address to, uint32 amount) external onlyOwner {
        _initBalance(to);

        // OPTIMIZATION 2: use plaintext amount directly (no encryption)
        _balances[to] = FHE.add(_balances[to], amount);

        // OPTIMIZATION 2: use plaintext cap (1_000_000 is public knowledge)
        _balances[to] = FHE.min(_balances[to], 1_000_000);

        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);
        emit Minted(to, amount);
    }

    /// @notice Transfer tokens from sender to recipient
    function transfer(address to, uint32 amount) external {
        _initBalance(msg.sender);
        _initBalance(to);

        // OPTIMIZATION 3: compute fee in plaintext — baseFee and surcharge are public!
        uint32 feeRate = baseFee + surcharge; // 3 (not secret, no need for FHE)
        uint32 feeAmount = (amount * feeRate) / 100; // plaintext arithmetic
        uint32 totalDeduct = amount + feeAmount;     // plaintext arithmetic

        // OPTIMIZATION 5: only one balance check with the total deduction amount
        // OPTIMIZATION 2: use plaintext totalDeduct as operand
        ebool hasEnough = FHE.ge(_balances[msg.sender], totalDeduct);

        // OPTIMIZATION 2: use plaintext operands for sub and add
        euint32 newSenderBal   = FHE.sub(_balances[msg.sender], totalDeduct);
        euint32 newReceiverBal = FHE.add(_balances[to], amount);

        // Conditional update (same logic, fewer encrypted operations)
        _balances[msg.sender] = FHE.select(hasEnough, newSenderBal, _balances[msg.sender]);
        _balances[to]         = FHE.select(hasEnough, newReceiverBal, _balances[to]);

        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);

        emit Transferred(msg.sender, to, amount);
    }

    /// @notice Check if user's balance exceeds a threshold; return max(balance, threshold)
    function checkThreshold(uint32 threshold) external {
        _initBalance(msg.sender);

        // OPTIMIZATION 4: use FHE.max with plaintext operand instead of gt + select
        // OPTIMIZATION 2: use plaintext threshold (not secret)
        _thresholdResult = FHE.max(_balances[msg.sender], threshold);

        FHE.allowThis(_thresholdResult);
        FHE.allow(_thresholdResult, msg.sender);

        emit ThresholdChecked(msg.sender);
    }

    /// @notice Get the threshold check result
    function getThresholdResult() external view returns (euint32) {
        return _thresholdResult;
    }

    /// @notice Get balance handle for a user
    function getBalance(address user) external view returns (euint32) {
        return _balances[user];
    }

    // OPTIMIZATION 6: batch parameter update
    function setFeeParams(uint32 newBaseFee, uint32 newSurcharge) external onlyOwner {
        baseFee = newBaseFee;
        surcharge = newSurcharge;
    }
}
