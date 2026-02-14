# Module 17: Exercise -- Build an Encrypted Escrow

## Objective

Combine three patterns from this module -- **Encrypted State Machine**, **LastError**, and **Time-Locked Values** -- into a working Encrypted Escrow contract. The escrow holds encrypted payment amounts, transitions through states based on encrypted conditions, provides encrypted error feedback, and enforces time-based deadlines.

---

## Overview

An escrow is a financial arrangement where a third party holds funds on behalf of two parties until predefined conditions are met. In our encrypted escrow:

- **Depositor** creates an escrow with an encrypted payment amount and a deadline
- **Arbiter** (trusted third party) can release funds to the beneficiary or refund the depositor
- Encrypted conditions determine whether release is allowed
- If the deadline passes without release, the depositor can reclaim funds
- All operations provide encrypted error feedback via the LastError pattern

---

## States

```
CREATED  -->  FUNDED  -->  RELEASED
                |
                +-------->  DISPUTED  -->  RESOLVED
                |
                +-------->  EXPIRED (after deadline)
```

---

## Starter Code

The starter contract is available at `exercises/17-patterns-exercise.sol`. It contains the struct definitions, state variables, events, and function signatures with TODO comments. Your job is to implement each function body.

---

## Task 1: Fund the Escrow

Implement `fundEscrow()`:
- Accept an encrypted amount via `externalEuint64` and `bytes calldata inputProof`
- Only the depositor can fund
- Only callable in CREATED state
- Store the encrypted amount
- Transition state to FUNDED
- Set ACL on the stored amount

---

## Task 2: Release Funds

Implement `releaseFunds()`:
- Only the arbiter can release
- Only callable in FUNDED state
- Must be before the deadline (`block.timestamp < deadline`)
- Compare encrypted escrow amount to an encrypted minimum (set at creation)
- Use `FHE.ge()` to check if `amount >= minimumAmount`
- Use `FHE.select()` to determine actual release: full amount if condition met, 0 if not
- Set LastError: 0 = SUCCESS, 1 = BELOW_MINIMUM
- Transition state to RELEASED on success
- Make the released amount publicly decryptable

---

## Task 3: Dispute

Implement `dispute()`:
- Either depositor or beneficiary can dispute
- Only callable in FUNDED state
- Must be before the deadline
- Transition state to DISPUTED

---

## Task 4: Resolve Dispute

Implement `resolveDispute()`:
- Only the arbiter can resolve
- Only callable in DISPUTED state
- Takes an `externalEuint64` representing the amount to send to the beneficiary
- The remainder goes back to the depositor
- Set LastError: 0 = SUCCESS, 2 = RESOLUTION_EXCEEDS_ESCROW
- Use `FHE.le()` to verify resolution amount does not exceed escrow amount
- Make both amounts publicly decryptable
- Transition state to RESOLVED

---

## Task 5: Claim Expired Funds

Implement `claimExpired()`:
- Only the depositor can claim
- Only callable in FUNDED state
- Must be after the deadline (`block.timestamp >= deadline`)
- Transition state to EXPIRED
- Make the refund amount publicly decryptable

---

## Task 6: Error Retrieval

Implement `getLastError()` and `clearError()` following the LastError pattern from the lesson.

---

## Hints

<details>
<summary>Hint 1: Release with encrypted condition check</summary>

```solidity
ebool meetsMinimum = FHE.ge(_escrowAmount, _minimumAmount);
euint64 releaseAmount = FHE.select(meetsMinimum, _escrowAmount, FHE.asEuint64(0));

// Set error code
euint8 errorCode = FHE.select(meetsMinimum, FHE.asEuint8(0), FHE.asEuint8(1));
_lastError[msg.sender] = errorCode;
FHE.allowThis(_lastError[msg.sender]);
FHE.allow(_lastError[msg.sender], msg.sender);

// Only transition if successful
// Note: state transitions must be based on public data in practice.
// For this exercise, the arbiter submits the decrypted result after reveal.
```
</details>

<details>
<summary>Hint 2: Resolve dispute with encrypted split</summary>

```solidity
euint64 resolution = FHE.fromExternal(encResolution, inputProof);

// Check resolution <= escrow amount
ebool isValid = FHE.le(resolution, _escrowAmount);
euint64 toBeneficiary = FHE.select(isValid, resolution, FHE.asEuint64(0));
euint64 toDepositor = FHE.select(isValid, FHE.sub(_escrowAmount, resolution), _escrowAmount);
```
</details>

<details>
<summary>Hint 3: Time-locked expiration</summary>

```solidity
function claimExpired() external {
    require(msg.sender == depositor, "Not depositor");
    require(currentState == State.FUNDED, "Not funded");
    require(block.timestamp >= deadline, "Not expired yet");

    currentState = State.EXPIRED;
    FHE.makePubliclyDecryptable(_escrowAmount);
}
```
</details>

---

## Testing Your Implementation

Write tests that verify:

1. **Happy path:** Create escrow, fund it, release to beneficiary
2. **Below minimum:** Release fails when escrow amount is below the minimum, error code = 1
3. **Dispute and resolve:** Fund, dispute, resolve with a split
4. **Expiration:** Fund, wait past deadline, depositor claims
5. **Error retrieval:** Verify encrypted error codes can be decrypted
6. **Access control:** Only depositor can fund, only arbiter can release/resolve

---

## Bonus Challenges

1. **Multi-party escrow:** Support multiple depositors contributing to the same escrow, with encrypted individual contributions tracked separately.

2. **Partial release:** Allow the arbiter to release a partial encrypted amount, keeping the remainder in escrow for future release.

3. **Encrypted arbiter fee:** The arbiter takes an encrypted percentage of the escrow as a fee. Use `FHE.mul()` and `FHE.div()` to compute it.

4. **Appeal mechanism:** After dispute resolution, allow either party to appeal within a time window, re-entering the DISPUTED state.

---

## Success Criteria

- [ ] Contract compiles with `pragma solidity ^0.8.24`
- [ ] All six states are reachable through valid transitions
- [ ] Encrypted amounts are properly stored with `FHE.allowThis()` and `FHE.allow()`
- [ ] Release checks encrypted condition using `FHE.ge()` and `FHE.select()`
- [ ] LastError pattern stores encrypted error codes per user
- [ ] Time-lock enforces deadline with `block.timestamp`
- [ ] `makePubliclyDecryptable()` is called on revealed amounts
- [ ] Events emitted at each state transition
- [ ] Access control enforced (depositor, beneficiary, arbiter roles)
- [ ] Tests cover happy path, error cases, and time-based expiration
