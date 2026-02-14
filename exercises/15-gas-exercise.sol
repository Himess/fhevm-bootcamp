// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint16, euint32, euint64, ebool, externalEuint32, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title InefficientToken - Module 15 Exercise
/// @notice A deliberately inefficient confidential token contract.
///         Students must optimize this to reduce gas by at least 30%.
///
/// KNOWN INEFFICIENCIES (for students to find and fix):
///   1. Uses euint64 for balances that never exceed 1,000,000 (fits in euint32)
///   2. Encrypts plaintext constants before every operation
///   3. Recomputes fee rate from base components on every transfer
///   4. Uses comparison + select instead of FHE.max for threshold check
///   5. Performs the same balance comparison twice in transfer()
///   6. Individual setter functions instead of batched parameter update
contract InefficientToken is ZamaEthereumConfig {
    address public owner;

    // INEFFICIENCY 1: euint64 for balances capped at 1,000,000
    mapping(address => euint64) private _balances;
    mapping(address => bool) private _initialized;

    // Fee parameters (public, not secret)
    uint64 public baseFee;
    uint64 public surcharge;

    // Threshold result
    euint64 private _thresholdResult;

    event Minted(address indexed to, uint64 amount);
    event Transferred(address indexed from, address indexed to, uint64 amount);
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
            // INEFFICIENCY 2: encrypts constant 0
            _balances[user] = FHE.asEuint64(0);
            FHE.allowThis(_balances[user]);
            FHE.allow(_balances[user], user);
            _initialized[user] = true;
        }
    }

    /// @notice Mint tokens to an address
    function mint(address to, uint64 amount) external onlyOwner {
        _initBalance(to);

        // INEFFICIENCY 2: encrypts the amount before adding
        euint64 encAmount = FHE.asEuint64(amount);
        _balances[to] = FHE.add(_balances[to], encAmount);

        // INEFFICIENCY 2: encrypts the cap constant before comparison
        euint64 encCap = FHE.asEuint64(1_000_000);
        _balances[to] = FHE.min(_balances[to], encCap);

        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);
        emit Minted(to, amount);
    }

    /// @notice Transfer tokens from sender to recipient
    function transfer(address to, uint64 amount) external {
        _initBalance(msg.sender);
        _initBalance(to);

        // INEFFICIENCY 2: encrypts the amount
        euint64 encAmount = FHE.asEuint64(amount);

        // INEFFICIENCY 5: first balance check
        ebool hasEnough = FHE.ge(_balances[msg.sender], encAmount);

        // INEFFICIENCY 3: recomputes fee rate from components every call
        euint64 encBaseFee   = FHE.asEuint64(baseFee);
        euint64 encSurcharge = FHE.asEuint64(surcharge);
        euint64 feeRate      = FHE.add(encBaseFee, encSurcharge);  // fee = 3%

        // Calculate fee: amount * feeRate / 100
        euint64 feeAmount = FHE.div(FHE.mul(encAmount, feeRate), 100);

        // Total deduction = amount + fee
        euint64 totalDeduct = FHE.add(encAmount, feeAmount);

        // INEFFICIENCY 5: second balance check (same check repeated!)
        ebool hasEnoughWithFee = FHE.ge(_balances[msg.sender], totalDeduct);

        // Update balances
        euint64 newSenderBal   = FHE.sub(_balances[msg.sender], totalDeduct);
        euint64 newReceiverBal = FHE.add(_balances[to], encAmount);

        // Conditional update
        _balances[msg.sender] = FHE.select(hasEnoughWithFee, newSenderBal, _balances[msg.sender]);
        _balances[to]         = FHE.select(hasEnoughWithFee, newReceiverBal, _balances[to]);

        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);

        emit Transferred(msg.sender, to, amount);
    }

    /// @notice Check if user's balance exceeds a threshold; return max(balance, threshold)
    function checkThreshold(uint64 threshold) external {
        _initBalance(msg.sender);

        // INEFFICIENCY 2: encrypts the threshold
        euint64 encThreshold = FHE.asEuint64(threshold);

        // INEFFICIENCY 4: uses comparison + select instead of FHE.max
        ebool isAbove = FHE.gt(_balances[msg.sender], encThreshold);
        _thresholdResult = FHE.select(isAbove, _balances[msg.sender], encThreshold);

        FHE.allowThis(_thresholdResult);
        FHE.allow(_thresholdResult, msg.sender);

        emit ThresholdChecked(msg.sender);
    }

    /// @notice Get the threshold check result
    function getThresholdResult() external view returns (euint64) {
        return _thresholdResult;
    }

    /// @notice Get balance handle for a user
    function getBalance(address user) external view returns (euint64) {
        return _balances[user];
    }

    // INEFFICIENCY 6: separate functions to set fee parameters
    function setBaseFee(uint64 newBaseFee) external onlyOwner {
        baseFee = newBaseFee;
    }

    function setSurcharge(uint64 newSurcharge) external onlyOwner {
        surcharge = newSurcharge;
    }
}
