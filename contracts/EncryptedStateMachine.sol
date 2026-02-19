// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, ebool, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title EncryptedStateMachine - Module 17: State transitions driven by encrypted thresholds
/// @notice Demonstrates an encrypted state machine where the counter and threshold are both
///         encrypted, so observers can see WHICH state the machine is in, but never WHY
///         or WHEN a transition will happen. The transition condition stays fully private.
contract EncryptedStateMachine is ZamaEthereumConfig {
    enum State {
        IDLE,
        ACTIVE,
        PAUSED,
        COMPLETED
    }

    State public currentState;
    address public owner;

    /// @dev Encrypted threshold -- the target value that triggers a state transition
    euint32 private _threshold;

    /// @dev Encrypted counter -- incremented by user actions
    euint32 private _counter;

    /// @dev Encrypted flag indicating whether the transition condition is met (counter >= threshold)
    ebool private _transitionReady;

    /// @dev Track whether the threshold has been initialized
    bool public thresholdSet;

    /// @dev Track total number of actions performed (public metric)
    uint256 public actionCount;

    event StateChanged(State indexed oldState, State indexed newState);
    event ActionPerformed(address indexed actor, uint256 actionNumber);
    event ThresholdSet(address indexed setter);
    event TransitionChecked(address indexed checker);
    event TransitionRevealed();
    event MachineReset(address indexed resetter);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier inState(State _state) {
        require(currentState == _state, "Invalid state for this action");
        _;
    }

    constructor() {
        owner = msg.sender;
        currentState = State.IDLE;
    }

    /// @notice Set the encrypted threshold that determines when transitions occur
    /// @dev Only callable by the owner. The threshold value is encrypted, so no one
    ///      (not even an on-chain observer) knows what the target is.
    /// @param encThreshold The encrypted threshold value
    /// @param inputProof Proof for the encrypted input
    function setThreshold(externalEuint32 encThreshold, bytes calldata inputProof) external onlyOwner {
        euint32 threshold = FHE.fromExternal(encThreshold, inputProof);
        _threshold = threshold;
        FHE.allowThis(_threshold);

        // Initialize counter to 0 if not already set
        if (!thresholdSet) {
            _counter = FHE.asEuint32(0);
            FHE.allowThis(_counter);
        }

        thresholdSet = true;
        emit ThresholdSet(msg.sender);
    }

    /// @notice Activate the state machine -- move from IDLE to ACTIVE
    /// @dev Only the owner can activate, and threshold must be set first
    function activate() external onlyOwner inState(State.IDLE) {
        require(thresholdSet, "Threshold not set");

        State oldState = currentState;
        currentState = State.ACTIVE;
        emit StateChanged(oldState, State.ACTIVE);
    }

    /// @notice Perform an action that increments the encrypted counter
    /// @dev Anyone can perform an action while the machine is ACTIVE.
    ///      The counter value remains encrypted -- observers only see that
    ///      an action was performed, not the cumulative count.
    function performAction() external inState(State.ACTIVE) {
        _counter = FHE.add(_counter, 1);
        FHE.allowThis(_counter);

        actionCount++;
        emit ActionPerformed(msg.sender, actionCount);
    }

    /// @notice Perform multiple actions in a single transaction (batch)
    /// @param count Number of actions to perform (plaintext, max 10 for gas)
    function performBatchActions(uint8 count) external inState(State.ACTIVE) {
        require(count > 0 && count <= 10, "Count must be 1-10");

        _counter = FHE.add(_counter, FHE.asEuint32(uint32(count)));
        FHE.allowThis(_counter);

        actionCount += count;
        emit ActionPerformed(msg.sender, actionCount);
    }

    /// @notice Check whether the transition condition is met (counter >= threshold)
    /// @dev Computes the comparison in FHE and stores the encrypted boolean result.
    ///      The result itself is encrypted -- no one learns whether the condition is met
    ///      until revealTransition() is called.
    function checkTransition() external inState(State.ACTIVE) {
        require(thresholdSet, "Threshold not set");

        _transitionReady = FHE.ge(_counter, _threshold);
        FHE.allowThis(_transitionReady);

        emit TransitionChecked(msg.sender);
    }

    /// @notice Reveal the transition result and advance state if the condition is met
    /// @dev Makes the transition boolean publicly decryptable. In a real deployment,
    ///      an off-chain process would read the decrypted result and call executeTransition().
    ///      For the bootcamp, we make it publicly decryptable so anyone can verify.
    function revealTransition() external onlyOwner inState(State.ACTIVE) {
        require(FHE.isInitialized(_transitionReady), "Check transition first");

        FHE.makePubliclyDecryptable(_transitionReady);
        emit TransitionRevealed();
    }

    /// @notice Execute the state transition after the result has been revealed
    /// @dev The owner submits the decrypted boolean result. If true, state advances
    ///      to COMPLETED. If false, the machine stays ACTIVE for more actions.
    /// @param isReady The decrypted value of _transitionReady
    function executeTransition(bool isReady) external onlyOwner inState(State.ACTIVE) {
        if (isReady) {
            State oldState = currentState;
            currentState = State.COMPLETED;
            emit StateChanged(oldState, State.COMPLETED);
        }
        // If not ready, state remains ACTIVE -- users continue performing actions
    }

    /// @notice Pause the machine -- owner can pause for administrative reasons
    function pause() external onlyOwner inState(State.ACTIVE) {
        State oldState = currentState;
        currentState = State.PAUSED;
        emit StateChanged(oldState, State.PAUSED);
    }

    /// @notice Resume the machine from paused state
    function resume() external onlyOwner inState(State.PAUSED) {
        State oldState = currentState;
        currentState = State.ACTIVE;
        emit StateChanged(oldState, State.ACTIVE);
    }

    /// @notice Reset the machine back to IDLE for a new cycle
    /// @dev Clears the counter and threshold. Only callable from COMPLETED state.
    function reset() external onlyOwner inState(State.COMPLETED) {
        currentState = State.IDLE;
        thresholdSet = false;
        actionCount = 0;

        // Reset encrypted values
        _counter = FHE.asEuint32(0);
        FHE.allowThis(_counter);
        _threshold = FHE.asEuint32(0);
        FHE.allowThis(_threshold);

        emit MachineReset(msg.sender);
    }

    /// @notice Get the encrypted counter handle (ACL-protected)
    /// @dev Only the contract itself has access; used internally for comparisons
    function getCounter() external view returns (euint32) {
        return _counter;
    }

    /// @notice Get the encrypted threshold handle (ACL-protected)
    function getThreshold() external view returns (euint32) {
        return _threshold;
    }
}
