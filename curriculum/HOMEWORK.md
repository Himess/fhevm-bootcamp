# Weekly Homework Assignments & Grading Criteria

## Overview

This document defines the four weekly homework assignments for the FHEVM Bootcamp 4-week program. Each homework is due at the end of its respective week and builds on the skills learned in that week's modules.

### Grading Scale

| Grade | Range |
|---|---|
| Distinction | 90-100% |
| Merit | 80-89% |
| Pass | 70-79% |
| Fail | Below 70% |

---

## Week 1 Homework: Encrypted Calculator

**Due:** End of Week 1
**Covers:** Modules 00-04 (Prerequisites, FHE Intro, Setup, Encrypted Types, Operations). Note: basic ACL patterns (`FHE.allowThis`, `FHE.allow`) are introduced in Module 03 as part of storing encrypted values.
**Estimated Time:** 3-4 hours

### Specification

Build an `EncryptedCalculator.sol` contract that:

1. Stores two encrypted values (`euint32 a` and `euint32 b`) per user
2. Provides `setA(uint32)` and `setB(uint32)` functions to set values from plaintext
3. Implements these operations, each returning and storing the result:
   - `add()` → a + b
   - `subtract()` → a - b
   - `multiply()` → a * b
   - `divide()` → a / b (plaintext divisor)
   - `compare()` → returns ebool (a > b)
   - `minimum()` → min(a, b)
   - `bitwiseAnd()` → a AND b
4. Each result is stored in a `euint32 lastResult` with proper ACL (allowThis + allow sender)
5. Emits `OperationPerformed(address indexed user, string operation)` event
6. Inherits `ZamaEthereumConfig`

### Required Tests (minimum 10)
- Test each of the 7 operations with known values
- Test ACL: verify sender has access to results
- Test divide by 1 (identity)
- Test compare with equal values (should return false for gt)

### Grading Rubric

| Criteria | Weight | Description |
|---|---|---|
| **Functionality** | 40% | All 7 operations work correctly with encrypted values. Contract compiles and deploys. |
| **Code Quality** | 20% | Clean imports (no unused), proper naming conventions, NatSpec comments on public functions. |
| **Testing** | 25% | Minimum 10 tests. Each operation tested. Edge cases included (zero values, equal values). |
| **ACL Management** | 15% | Every new ciphertext handle has `FHE.allowThis()` + `FHE.allow(handle, msg.sender)`. |

### Submission Checklist
- [ ] Contract compiles with `npx hardhat compile`
- [ ] All tests pass with `npx hardhat test`
- [ ] No unused imports
- [ ] Events emitted for each operation
- [ ] ACL set on every result

---

## Week 2 Homework: Encrypted Vault with Access Control

**Due:** End of Week 2
**Covers:** Modules 05-09 (ACL, Encrypted Inputs, Decryption, Conditionals, Randomness)
**Estimated Time:** 4-5 hours

### Specification

Build a `SecureVault.sol` contract that:

1. Allows users to deposit encrypted amounts using `externalEuint64` + `inputProof` (FHE.fromExternal)
2. Allows users to withdraw encrypted amounts with **no-revert pattern** (FHE.select -> transfer amount or 0)
3. Owner can set an encrypted **daily withdrawal limit** per user
4. Withdrawal checks BOTH: sufficient balance AND within limit (combine with FHE.and)
5. Owner can **grant read access** to a third party for any user's balance (FHE.allow)
6. Includes a `generateLuckyNumber()` function using `FHE.randEuint32()` that stores a random encrypted number per user
7. Users can make their own balance publicly decryptable via `FHE.makePubliclyDecryptable()`
8. Emits events: `Deposited(address)`, `Withdrawn(address)`, `LimitSet(address)`, `AccessGranted(address, address)`

### Required Tests (minimum 12)
- Deposit with encrypted input and verify balance
- Withdraw within balance (succeeds)
- Withdraw over balance (silently sends 0, no revert)
- Withdraw over limit (silently sends 0)
- Owner sets withdrawal limit
- Non-owner cannot set limit
- Grant access to third party
- Generate random number
- Make balance publicly decryptable
- Multi-user isolation (user A's deposit doesn't affect user B)
- Deposit + withdraw + verify remaining balance
- Double deposit accumulation

### Grading Rubric

| Criteria | Weight | Description |
|---|---|---|
| **Functionality** | 35% | All features work: deposit, withdraw, limits, access grant, randomness, public decrypt. |
| **Security Patterns** | 25% | No-revert pattern on withdraw. FHE.select used (not if/else on encrypted). Input validation with FHE.isInitialized(). |
| **Testing** | 25% | Minimum 12 tests. Silent failure cases verified (balance unchanged). Multi-user isolation tested. |
| **Code Quality** | 15% | Clean code, proper event emission, NatSpec documentation, no unused imports. |

### Submission Checklist
- [ ] Contract compiles
- [ ] All tests pass
- [ ] No revert on insufficient balance/limit (FHE.select pattern)
- [ ] FHE.fromExternal used for all external inputs
- [ ] FHE.isInitialized check after fromExternal
- [ ] Events emitted for all state changes

---

## Week 3 Homework: Confidential Token + Voting System

**Due:** End of Week 3
**Covers:** Modules 10-14 (Frontend, ERC-20, Voting, Auction, Testing)
**Estimated Time:** 5-6 hours

### Specification

Build TWO contracts that work together:

#### Contract 1: `ConfidentialToken.sol`
A simplified confidential ERC-20 with:
1. Encrypted balances (`mapping(address => euint64)`)
2. `mint(address to, uint64 amount)` -- owner only
3. `transfer(externalEuint64 encAmount, bytes calldata inputProof, address to)` -- with no-revert pattern
4. `balanceOf(address)` returns `euint64` handle
5. No amount in `Transfer` event (only from, to)
6. Total supply tracked as public `uint64`

#### Contract 2: `TokenVoting.sol`
An encrypted voting system that uses the token for eligibility:
1. References the ConfidentialToken contract
2. `createProposal(string description, uint256 durationSeconds)` -- owner only
3. `vote(uint256 proposalId, externalEuint64 encVote, bytes calldata inputProof)` -- vote weight = 1 (encrypted), voters must hold tokens (plaintext check: token balance handle must be initialized)
4. Encrypted `yesVotes` and `noVotes` tallies per proposal
5. `finalizeProposal(proposalId)` -- after deadline, makes tallies publicly decryptable
6. Duplicate vote prevention per proposal per address

### Required Tests (minimum 15)
- Token: mint, transfer success, transfer fail (silent), balance check
- Token: transfer to self, transfer zero
- Voting: create proposal, cast yes vote, cast no vote
- Voting: prevent double vote
- Voting: finalize after deadline
- Voting: reject finalize before deadline
- Voting: reject non-owner proposal creation
- Integration: mint tokens then vote
- Multi-user: 3 users vote, verify tally
- Edge case: vote on non-existent proposal

### Grading Rubric

| Criteria | Weight | Description |
|---|---|---|
| **Functionality** | 35% | Both contracts work correctly. Token transfers, voting, finalization all function. |
| **Architecture** | 20% | Clean separation between token and voting. Cross-contract interaction via interface. Events well-designed. |
| **Testing** | 25% | Minimum 15 tests. Both contracts tested. Integration tests included. Edge cases covered. |
| **Security** | 20% | No-revert on transfer. Duplicate vote prevention. ACL on all handles. No information leakage from events. |

### Submission Checklist
- [ ] Both contracts compile
- [ ] All tests pass
- [ ] No amounts in events
- [ ] No revert on insufficient token balance
- [ ] Duplicate vote prevention works
- [ ] Tallies only decryptable after finalization
- [ ] ACL correct on all handles

---

## Week 4 Homework: Capstone -- Confidential DAO

**Due:** End of Week 4
**Covers:** Modules 15-19 (Gas Optimization, Security, Advanced Patterns, DeFi, Capstone)
**Estimated Time:** 8-10 hours

### Specification

Build a complete **Confidential DAO** system consisting of two contracts:

#### Contract 1: `GovernanceToken.sol`
- Encrypted ERC-20 governance token (builds on Week 3)
- Minting, encrypted transfers with no-revert pattern
- `delegate(address)` -- delegate voting power (plaintext delegation mapping)
- Gas-optimized: use plaintext operands where possible (e.g., `FHE.add(balance, amount)` not `FHE.add(balance, FHE.asEuint64(amount))`)

#### Contract 2: `DAO.sol`
- `createProposal(string description, uint256 amount, address recipient, uint256 duration)` -- propose treasury spend
- `castVote(uint256 proposalId, externalEuint64 encSupport, bytes calldata inputProof)` -- encrypted yes/no vote (1=yes, 0=no)
- Encrypted tallies (`euint64 yesVotes`, `euint64 noVotes`)
- `finalizeProposal(proposalId)` -- after deadline, make tallies publicly decryptable
- `executeProposal(proposalId)` -- if yes > no (after finalize reveals result), transfer ETH from treasury
- `receive()` -- accept ETH donations to treasury
- Duplicate vote prevention
- LastError pattern for vote feedback

### Security Requirements (MANDATORY)
- [ ] FHE.isInitialized() check on all external inputs
- [ ] No branching on encrypted conditions (use FHE.select only)
- [ ] Rate limiting on expensive FHE operations (optional bonus)
- [ ] ACL on every new ciphertext handle
- [ ] No amounts in events
- [ ] Input validation on all public functions

### Required Tests (minimum 20)
- GovernanceToken: mint, transfer, delegate
- DAO: create proposal, cast yes, cast no
- DAO: prevent double vote
- DAO: finalize after deadline, reject before
- DAO: execute passing proposal (treasury transfer)
- DAO: reject execution of failing proposal
- DAO: accept treasury funding
- Security: non-owner cannot create proposals
- Security: non-owner cannot mint
- Integration: full lifecycle (mint -> fund treasury -> propose -> vote -> finalize -> execute)
- Multi-user: 3+ voters with different votes
- Edge cases: vote on non-existent proposal, execute before finalize, empty treasury

### Grading Rubric

| Criteria | Weight | Description |
|---|---|---|
| **Functionality** | 30% | Complete DAO lifecycle works: propose -> vote -> finalize -> execute. Treasury management functional. |
| **Security** | 25% | All 6 security requirements met. No information leakage. LastError pattern implemented. |
| **Testing** | 20% | Minimum 20 tests. Full lifecycle tested. Edge cases and failure scenarios covered. |
| **Code Quality** | 15% | Gas-optimized (plaintext operands). Clean architecture. NatSpec. No unused imports. Custom errors. |
| **Documentation** | 10% | README explaining architecture, design decisions, and security considerations. |

### Submission Checklist
- [ ] Both contracts compile
- [ ] All 20+ tests pass
- [ ] Full lifecycle works end-to-end
- [ ] All security requirements met
- [ ] Gas optimizations applied
- [ ] Events emit no sensitive data
- [ ] README with architecture explanation

---

## Submission Guidelines

### Format
Each homework should be submitted as:
1. Solidity contract(s) in `contracts/`
2. Test file(s) in `test/`
3. All tests passing with `npx hardhat test`

### Late Policy
- On time: full credit
- 1 day late: maximum 90%
- 2 days late: maximum 80%
- 3+ days late: maximum 70%

### Academic Integrity
- You may reference the bootcamp's example contracts and lesson materials
- You may use the Zama documentation
- All code must be your own work
- AI-assisted code is acceptable but must be reviewed and understood by the student
