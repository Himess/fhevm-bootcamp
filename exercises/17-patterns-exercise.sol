// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint16, euint32, euint64, ebool, externalEuint8, externalEuint32, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Exercise 17: Encrypted Escrow
/// @notice Combine State Machine + LastError + Time-Lock patterns into a working escrow.
///         The depositor funds the escrow with an encrypted amount. The arbiter can release
///         funds to the beneficiary (if conditions are met) or resolve disputes. If the
///         deadline passes, the depositor can reclaim expired funds.
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
    /// @param _beneficiary The address that receives funds on release
    /// @param _arbiter The trusted third party who can release or resolve
    /// @param _deadline Unix timestamp after which the depositor can reclaim funds
    /// @param encMinimum The encrypted minimum amount required for release
    /// @param inputProof Proof for the encrypted input
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

    /// TODO 1: Fund the escrow with an encrypted amount
    /// - Only the depositor can fund
    /// - Only callable in CREATED state
    /// - Convert the encrypted input using FHE.fromExternal(encAmount, inputProof)
    /// - Store the encrypted amount in _escrowAmount
    /// - FHE.allowThis(_escrowAmount) for contract access
    /// - Transition state to FUNDED
    /// - Emit EscrowFunded event
    function fundEscrow(externalEuint64 encAmount, bytes calldata inputProof)
        external
        onlyDepositor
        inState(State.CREATED)
    {
        // YOUR CODE HERE
    }

    /// TODO 2: Release funds to the beneficiary
    /// - Only the arbiter can release
    /// - Only callable in FUNDED state
    /// - Require block.timestamp < deadline ("Escrow expired")
    /// - Compare _escrowAmount >= _minimumAmount using FHE.ge()
    /// - Use FHE.select() to determine release amount:
    ///     If condition met: releaseAmount = _escrowAmount
    ///     If not: releaseAmount = 0
    /// - Set LastError using FHE.select():
    ///     If condition met: error = 0 (SUCCESS)
    ///     If not: error = 1 (BELOW_MINIMUM)
    /// - Store error for msg.sender with proper ACL
    /// - Store _releasedAmount with proper ACL
    /// - If release succeeds, call FHE.makePubliclyDecryptable(_releasedAmount)
    /// - Transition state to RELEASED (only if condition is met -- for simplicity,
    ///   always transition and let the decrypted result determine actual fund movement)
    /// - Emit FundsReleased event
    function releaseFunds() external onlyArbiter inState(State.FUNDED) {
        require(block.timestamp < deadline, "Escrow expired");

        // YOUR CODE HERE
    }

    /// TODO 3: Raise a dispute
    /// - Only the depositor or beneficiary can dispute
    /// - Only callable in FUNDED state
    /// - Require block.timestamp < deadline ("Escrow expired")
    /// - Transition state to DISPUTED
    /// - Emit DisputeRaised event
    function dispute() external inState(State.FUNDED) {
        require(
            msg.sender == depositor || msg.sender == beneficiary,
            "Not depositor or beneficiary"
        );
        require(block.timestamp < deadline, "Escrow expired");

        // YOUR CODE HERE
    }

    /// TODO 4: Resolve a dispute by splitting the escrow
    /// - Only the arbiter can resolve
    /// - Only callable in DISPUTED state
    /// - Convert encrypted resolution amount using FHE.fromExternal()
    /// - Check that resolution amount <= _escrowAmount using FHE.le()
    /// - Use FHE.select() to compute:
    ///     If valid: toBeneficiary = resolution, toDepositor = _escrowAmount - resolution
    ///     If invalid: toBeneficiary = 0, toDepositor = _escrowAmount
    /// - Set LastError:
    ///     If valid: error = 0 (SUCCESS)
    ///     If invalid: error = 2 (RESOLUTION_EXCEEDS_ESCROW)
    /// - Store error for msg.sender with proper ACL
    /// - Store _releasedAmount (to beneficiary) and _refundedAmount (to depositor)
    /// - FHE.makePubliclyDecryptable() for both amounts
    /// - Transition state to RESOLVED
    /// - Emit DisputeResolved event
    function resolveDispute(externalEuint64 encResolution, bytes calldata inputProof)
        external
        onlyArbiter
        inState(State.DISPUTED)
    {
        // YOUR CODE HERE
    }

    /// TODO 5: Claim expired funds
    /// - Only the depositor can claim
    /// - Only callable in FUNDED state
    /// - Require block.timestamp >= deadline ("Not expired yet")
    /// - Store _refundedAmount = _escrowAmount
    /// - FHE.allowThis(_refundedAmount)
    /// - FHE.makePubliclyDecryptable(_refundedAmount)
    /// - Transition state to EXPIRED
    /// - Emit FundsExpired event
    function claimExpired() external onlyDepositor inState(State.FUNDED) {
        require(block.timestamp >= deadline, "Not expired yet");

        // YOUR CODE HERE
    }

    /// TODO 6: Get the caller's last error code
    /// - Return _lastError[msg.sender]
    function getLastError() external view returns (euint8) {
        // YOUR CODE HERE
    }

    /// TODO 7: Clear the caller's error code
    /// - Set _lastError[msg.sender] to encrypted 0
    /// - FHE.allowThis() and FHE.allow() for the caller
    /// - Emit ErrorCleared event
    function clearError() external {
        // YOUR CODE HERE
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
