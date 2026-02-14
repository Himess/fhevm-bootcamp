// SOLUTION: Module 17 - Encrypted Escrow
// This is the complete implementation combining State Machine + LastError + Time-Lock patterns.

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint16, euint32, euint64, ebool, externalEuint8, externalEuint32, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title EncryptedEscrow - Module 17: Solution
/// @notice Combines State Machine + LastError + Time-Lock patterns into a working escrow.
///
/// Error codes:
///   0 = SUCCESS
///   1 = BELOW_MINIMUM (release amount does not meet minimum threshold)
///   2 = RESOLUTION_EXCEEDS_ESCROW (dispute resolution exceeds escrow amount)
contract EncryptedEscrow is ZamaEthereumConfig {
    enum State {
        CREATED,
        FUNDED,
        RELEASED,
        DISPUTED,
        RESOLVED,
        EXPIRED
    }

    State public currentState;

    address public depositor;
    address public beneficiary;
    address public arbiter;

    uint256 public deadline;

    /// @dev The encrypted escrow amount (set when funded)
    euint64 private _escrowAmount;

    /// @dev The encrypted minimum amount required for release (set at creation)
    euint64 private _minimumAmount;

    /// @dev Encrypted amount released to beneficiary (set on release/resolve)
    euint64 private _releasedAmount;

    /// @dev Encrypted amount refunded to depositor (set on resolve/expire)
    euint64 private _refundedAmount;

    /// @dev LastError pattern: encrypted error code per user
    mapping(address => euint8) private _lastError;

    event EscrowCreated(address indexed depositor, address indexed beneficiary, address indexed arbiter, uint256 deadline);
    event EscrowFunded(address indexed depositor);
    event FundsReleased(address indexed arbiter);
    event DisputeRaised(address indexed raiser);
    event DisputeResolved(address indexed arbiter);
    event FundsExpired(address indexed depositor);
    event ErrorCleared(address indexed user);

    modifier onlyDepositor() {
        require(msg.sender == depositor, "Not depositor");
        _;
    }

    modifier onlyArbiter() {
        require(msg.sender == arbiter, "Not arbiter");
        _;
    }

    modifier inState(State _state) {
        require(currentState == _state, "Invalid state");
        _;
    }

    /// @notice Create the escrow with roles, deadline, and an encrypted minimum release amount
    constructor(
        address _beneficiary,
        address _arbiter,
        uint256 _deadline,
        externalEuint64 encMinimum,
        bytes calldata inputProof
    ) {
        require(_beneficiary != address(0), "Invalid beneficiary");
        require(_arbiter != address(0), "Invalid arbiter");
        require(_deadline > block.timestamp, "Deadline must be in the future");

        depositor = msg.sender;
        beneficiary = _beneficiary;
        arbiter = _arbiter;
        deadline = _deadline;
        currentState = State.CREATED;

        _minimumAmount = FHE.fromExternal(encMinimum, inputProof);
        FHE.allowThis(_minimumAmount);

        emit EscrowCreated(msg.sender, _beneficiary, _arbiter, _deadline);
    }

    /// @notice Fund the escrow with an encrypted amount
    function fundEscrow(externalEuint64 encAmount, bytes calldata inputProof)
        external
        onlyDepositor
        inState(State.CREATED)
    {
        _escrowAmount = FHE.fromExternal(encAmount, inputProof);
        FHE.allowThis(_escrowAmount);

        currentState = State.FUNDED;
        emit EscrowFunded(msg.sender);
    }

    /// @notice Release funds to the beneficiary (arbiter only, with encrypted condition check)
    function releaseFunds() external onlyArbiter inState(State.FUNDED) {
        require(block.timestamp < deadline, "Escrow expired");

        // Check encrypted condition: escrow amount >= minimum amount
        ebool meetsMinimum = FHE.ge(_escrowAmount, _minimumAmount);

        // Determine release amount using FHE.select
        euint64 releaseAmount = FHE.select(meetsMinimum, _escrowAmount, FHE.asEuint64(0));

        // Set LastError: 0 = SUCCESS, 1 = BELOW_MINIMUM
        euint8 errorCode = FHE.select(meetsMinimum, FHE.asEuint8(0), FHE.asEuint8(1));
        _lastError[msg.sender] = errorCode;
        FHE.allowThis(_lastError[msg.sender]);
        FHE.allow(_lastError[msg.sender], msg.sender);

        // Store released amount
        _releasedAmount = releaseAmount;
        FHE.allowThis(_releasedAmount);

        // Make released amount publicly decryptable for off-chain fund movement
        FHE.makePubliclyDecryptable(_releasedAmount);

        // Transition state to RELEASED
        // Note: The released amount may be 0 if condition was not met. The decrypted
        // result determines actual fund movement off-chain.
        currentState = State.RELEASED;
        emit FundsReleased(msg.sender);
    }

    /// @notice Raise a dispute (depositor or beneficiary)
    function dispute() external inState(State.FUNDED) {
        require(
            msg.sender == depositor || msg.sender == beneficiary,
            "Not depositor or beneficiary"
        );
        require(block.timestamp < deadline, "Escrow expired");

        currentState = State.DISPUTED;
        emit DisputeRaised(msg.sender);
    }

    /// @notice Resolve a dispute by splitting the escrow amount
    function resolveDispute(externalEuint64 encResolution, bytes calldata inputProof)
        external
        onlyArbiter
        inState(State.DISPUTED)
    {
        euint64 resolution = FHE.fromExternal(encResolution, inputProof);

        // Check resolution amount <= escrow amount
        ebool isValid = FHE.le(resolution, _escrowAmount);

        // Compute split: beneficiary gets resolution, depositor gets remainder
        euint64 toBeneficiary = FHE.select(isValid, resolution, FHE.asEuint64(0));
        euint64 toDepositor = FHE.select(
            isValid,
            FHE.sub(_escrowAmount, resolution),
            _escrowAmount
        );

        // Set LastError: 0 = SUCCESS, 2 = RESOLUTION_EXCEEDS_ESCROW
        euint8 errorCode = FHE.select(isValid, FHE.asEuint8(0), FHE.asEuint8(2));
        _lastError[msg.sender] = errorCode;
        FHE.allowThis(_lastError[msg.sender]);
        FHE.allow(_lastError[msg.sender], msg.sender);

        // Store both amounts
        _releasedAmount = toBeneficiary;
        FHE.allowThis(_releasedAmount);
        FHE.makePubliclyDecryptable(_releasedAmount);

        _refundedAmount = toDepositor;
        FHE.allowThis(_refundedAmount);
        FHE.makePubliclyDecryptable(_refundedAmount);

        currentState = State.RESOLVED;
        emit DisputeResolved(msg.sender);
    }

    /// @notice Claim expired funds (depositor only, after deadline)
    function claimExpired() external onlyDepositor inState(State.FUNDED) {
        require(block.timestamp >= deadline, "Not expired yet");

        _refundedAmount = _escrowAmount;
        FHE.allowThis(_refundedAmount);
        FHE.makePubliclyDecryptable(_refundedAmount);

        currentState = State.EXPIRED;
        emit FundsExpired(msg.sender);
    }

    /// @notice Get the caller's last error code (encrypted)
    function getLastError() external view returns (euint8) {
        return _lastError[msg.sender];
    }

    /// @notice Clear the caller's error code
    function clearError() external {
        _lastError[msg.sender] = FHE.asEuint8(0);
        FHE.allowThis(_lastError[msg.sender]);
        FHE.allow(_lastError[msg.sender], msg.sender);
        emit ErrorCleared(msg.sender);
    }

    /// @notice Get the encrypted escrow amount handle
    function getEscrowAmount() external view returns (euint64) {
        return _escrowAmount;
    }

    /// @notice Get the encrypted released amount handle
    function getReleasedAmount() external view returns (euint64) {
        return _releasedAmount;
    }

    /// @notice Get the encrypted refunded amount handle
    function getRefundedAmount() external view returns (euint64) {
        return _refundedAmount;
    }
}
