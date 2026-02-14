# Module 19: Capstone -- Confidential DAO -- Lesson

## Introduction

This capstone project brings together every concept from the bootcamp into a single, comprehensive application: a **Confidential DAO**. This DAO features:

1. **Confidential Governance Tokens** (Module 11) -- Encrypted balances determine voting power
2. **Private Voting** (Module 12) -- Votes are encrypted; tallies hidden until finalization
3. **Treasury Management** -- Proposals to spend DAO funds
4. **Frontend Integration** (Module 10) -- Full dApp interface

This is a challenging project that combines encrypted types, operations, ACL, conditional logic, decryption, and frontend integration.

> **Architecture Note:** This lesson teaches a **two-contract architecture** (GovernanceToken + ConfidentialDAO) with weighted voting for educational purposes — it demonstrates cross-contract ACL, interface patterns, and advanced FHE composition. The reference implementation in `contracts/ConfidentialDAO.sol` uses a **simplified monolithic architecture** (single contract, unweighted votes) that is easier to test and deploy. Both approaches are valid; the two-contract version is the "stretch goal" for students who want a deeper challenge.

---

## 1. System Architecture

```
ConfidentialDAO (main contract)
    |
    |-- GovernanceToken (ConfidentialERC20)
    |       - Encrypted balances
    |       - Voting power source
    |
    |-- Proposals
    |       - Description + amount
    |       - Encrypted yes/no tallies
    |       - Weighted by token balance
    |
    |-- Treasury
    |       - ETH held by the DAO
    |       - Released via approved proposals
    |
    v
Frontend (React + Relayer SDK)
    - Create proposals
    - Cast weighted votes
    - View results after finalization
    - Execute approved proposals
```

---

## 2. The Governance Token

We use a simplified version of the confidential ERC-20 from Module 11. The DAO contract needs to read token balances for vote weighting, so we must set up cross-contract ACL.

```solidity
// In GovernanceToken: allow the DAO contract to read balances
function grantDAOAccess(address dao) public {
    FHE.allow(_balances[msg.sender], dao);
}
```

When a user wants to vote, they first grant the DAO contract access to their token balance. The DAO can then use the encrypted balance as the vote weight.

---

## 3. Weighted Voting

Unlike Module 12's simple Yes/No voting (each vote = 1), the DAO uses **weighted voting** where your vote power equals your token balance:

```solidity
function vote(uint256 proposalId, externalEbool encryptedVote, bytes calldata inputProof) external {
    // Get the voter's token balance (DAO must have ACL access)
    euint64 weight = governanceToken.balanceOf(msg.sender);

    ebool voteYes = FHE.fromExternal(encryptedVote, inputProof);

    euint64 zero = FHE.asEuint64(0);
    euint64 yesWeight = FHE.select(voteYes, weight, zero);
    euint64 noWeight = FHE.select(voteYes, zero, weight);

    p.yesVotes = FHE.add(p.yesVotes, yesWeight);
    p.noVotes = FHE.add(p.noVotes, noWeight);
}
```

The voter's entire token balance is used as the vote weight. If they vote Yes, their full balance is added to `yesVotes` and 0 to `noVotes` (and vice versa).

---

## 4. Complete ConfidentialDAO Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, ebool, externalEbool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

interface IGovernanceToken {
    function balanceOf(address account) external view returns (euint64);
}

contract ConfidentialDAO is ZamaEthereumConfig {
    struct Proposal {
        string description;
        address recipient;
        uint256 amount; // ETH amount to transfer if approved
        uint256 startTime;
        uint256 endTime;
        euint64 yesVotes;
        euint64 noVotes;
        bool exists;
        bool finalized;
        bool executed;
    }

    address public admin;
    IGovernanceToken public governanceToken;
    uint256 public proposalCount;
    uint256 public votingDuration;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) private _hasVoted;

    event ProposalCreated(
        uint256 indexed proposalId,
        string description,
        address recipient,
        uint256 amount
    );
    event VoteCast(uint256 indexed proposalId, address indexed voter);
    event ProposalFinalized(uint256 indexed proposalId);
    event ProposalExecuted(uint256 indexed proposalId, address recipient, uint256 amount);
    event TreasuryFunded(address indexed from, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    constructor(address _governanceToken, uint256 _votingDuration) {
        admin = msg.sender;
        governanceToken = IGovernanceToken(_governanceToken);
        votingDuration = _votingDuration;
    }

    // Accept ETH for the treasury
    receive() external payable {
        emit TreasuryFunded(msg.sender, msg.value);
    }

    function createProposal(
        string calldata description,
        address recipient,
        uint256 amount
    ) public returns (uint256) {
        require(amount <= address(this).balance, "Insufficient treasury");

        uint256 proposalId = proposalCount++;

        proposals[proposalId].description = description;
        proposals[proposalId].recipient = recipient;
        proposals[proposalId].amount = amount;
        proposals[proposalId].startTime = block.timestamp;
        proposals[proposalId].endTime = block.timestamp + votingDuration;
        proposals[proposalId].yesVotes = FHE.asEuint64(0);
        proposals[proposalId].noVotes = FHE.asEuint64(0);
        proposals[proposalId].exists = true;

        FHE.allowThis(proposals[proposalId].yesVotes);
        FHE.allowThis(proposals[proposalId].noVotes);

        emit ProposalCreated(proposalId, description, recipient, amount);
        return proposalId;
    }

    function vote(uint256 proposalId, externalEbool encryptedVote, bytes calldata inputProof) external {
        Proposal storage p = proposals[proposalId];
        require(p.exists, "Proposal does not exist");
        require(block.timestamp >= p.startTime, "Voting not started");
        require(block.timestamp < p.endTime, "Voting ended");
        require(!_hasVoted[proposalId][msg.sender], "Already voted");

        _hasVoted[proposalId][msg.sender] = true;

        // Get voter's token balance as vote weight
        // The voter must have previously granted ACL to this contract
        euint64 weight = governanceToken.balanceOf(msg.sender);

        ebool voteYes = FHE.fromExternal(encryptedVote, inputProof);
        euint64 zero = FHE.asEuint64(0);

        euint64 yesWeight = FHE.select(voteYes, weight, zero);
        euint64 noWeight = FHE.select(voteYes, zero, weight);

        p.yesVotes = FHE.add(p.yesVotes, yesWeight);
        p.noVotes = FHE.add(p.noVotes, noWeight);

        FHE.allowThis(p.yesVotes);
        FHE.allowThis(p.noVotes);

        emit VoteCast(proposalId, msg.sender);
    }

    function finalize(uint256 proposalId) public onlyAdmin {
        Proposal storage p = proposals[proposalId];
        require(p.exists, "Proposal does not exist");
        require(block.timestamp >= p.endTime, "Voting not ended");
        require(!p.finalized, "Already finalized");

        p.finalized = true;

        // Make vote tallies publicly decryptable
        FHE.makePubliclyDecryptable(p.yesVotes);
        FHE.makePubliclyDecryptable(p.noVotes);

        emit ProposalFinalized(proposalId);
    }

    function executeProposal(
        uint256 proposalId,
        uint64 decryptedYes,
        uint64 decryptedNo
    ) public onlyAdmin {
        Proposal storage p = proposals[proposalId];
        require(p.finalized, "Not finalized");
        require(!p.executed, "Already executed");
        require(decryptedYes > decryptedNo, "Proposal not approved");
        require(address(this).balance >= p.amount, "Insufficient treasury");

        p.executed = true;

        // Transfer ETH from treasury to recipient
        payable(p.recipient).transfer(p.amount);

        emit ProposalExecuted(proposalId, p.recipient, p.amount);
    }

    function getProposalResults(uint256 proposalId) public view returns (euint64, euint64) {
        Proposal storage p = proposals[proposalId];
        require(p.finalized, "Not finalized");
        return (p.yesVotes, p.noVotes);
    }

    function hasVoted(uint256 proposalId, address voter) public view returns (bool) {
        return _hasVoted[proposalId][voter];
    }

    function treasuryBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
```

---

## 5. Cross-Contract ACL Flow

This is a new concept. The DAO contract needs to read the voter's token balance, but the balance is encrypted and ACL-protected.

**Setup flow:**

```
1. User holds governance tokens (encrypted balance)
2. Before voting, user calls:
   governanceToken.grantDAOAccess(daoAddress)
   This executes: FHE.allow(_balances[msg.sender], daoAddress)
3. Now when user votes, the DAO contract can read:
   governanceToken.balanceOf(msg.sender)
   and get the euint64 balance
4. The DAO uses this balance as the vote weight
```

In the GovernanceToken contract:

```solidity
function grantDAOAccess(address dao) public {
    require(_initialized[msg.sender], "No balance");
    FHE.allow(_balances[msg.sender], dao);
}

// balanceOf needs to be callable by the DAO (not just msg.sender)
function balanceOf(address account) public view returns (euint64) {
    return _balances[account];
}
```

---

## 6. Proposal Lifecycle

```
Phase 1: Create
  - Anyone can create a proposal
  - Specifies: description, recipient, ETH amount
  - Voting period starts immediately

Phase 2: Vote
  - Token holders vote Yes/No (encrypted)
  - Vote weight = token balance at time of vote
  - One vote per address per proposal

Phase 3: Finalize
  - Admin finalizes after voting ends
  - Makes vote tallies publicly decryptable

Phase 4: Execute
  - Admin submits decrypted tallies
  - If yes > no: ETH transferred from treasury to recipient
  - If no >= yes: proposal rejected
```

---

## 7. Treasury Management

The DAO holds ETH in its treasury:

```solidity
// Anyone can fund the treasury
receive() external payable {
    emit TreasuryFunded(msg.sender, msg.value);
}

// Approved proposals transfer from treasury
payable(p.recipient).transfer(p.amount);
```

The treasury balance is public (ETH balance is always visible on-chain). This is a design choice -- you could track an "encrypted budget" separately if needed.

---

## 8. Security Considerations

### Vote Weight Manipulation

If a user transfers tokens after voting on one proposal, they could receive tokens and vote again (on the same proposal, from a different address that now holds the tokens). The `_hasVoted` mapping prevents the same address from voting twice, but not the same tokens from being used twice.

**Production solution:** Snapshot balances at proposal creation time. This requires additional data structures.

### Admin Trust

The admin can:
- Finalize proposals (timing control)
- Execute proposals (submits decrypted tallies)

The admin cannot:
- Change votes (encrypted)
- See individual votes (no ACL)
- Execute rejected proposals (yes > no check)

For a trustless design, consider using `FHE.makePubliclyDecryptable()` so anyone can verify vote tallies, and add on-chain execution logic based on the decrypted results.

### Treasury Drain

A series of proposals could drain the treasury. Consider:
- Minimum quorum (total votes must exceed a threshold)
- Proposal amount caps
- Cooldown periods between proposals

---

## 9. Frontend Architecture

```
Pages:
1. Dashboard
   - Treasury balance
   - Active proposals list
   - Your token balance (decrypted)

2. Create Proposal
   - Description, recipient, amount form
   - Submit transaction

3. Proposal Detail
   - Description, status, time remaining
   - Vote button (Yes/No)
   - Results (after finalization)

4. Token Management
   - Grant DAO access (one-time)
   - Transfer tokens
   - View balance
```

Key frontend interactions:

```typescript
// Grant DAO access (one-time per user)
await governanceToken.grantDAOAccess(daoAddress);

// Create proposal
await dao.createProposal(description, recipient, amount);

// Vote
const input = instance.createEncryptedInput(daoAddress, userAddress);
input.addBool(true); // Vote Yes
const encrypted = await input.encrypt();
await dao.vote(proposalId, encrypted.handles[0], encrypted.inputProof);

// Admin: finalize and execute
await dao.finalize(proposalId);
// ... decrypt via userDecryptEuint in tests ...
await dao.executeProposal(proposalId, yesVotes, noVotes);
```

---

## 10. Testing Strategy

```
Test 1: Token Distribution
  - Deploy GovernanceToken
  - Mint tokens to 3 test accounts
  - Verify encrypted balances

Test 2: DAO Setup
  - Deploy ConfidentialDAO with token address
  - Fund treasury with ETH
  - Each user grants DAO access

Test 3: Proposal Creation
  - Create a proposal (recipient, amount)
  - Verify proposal fields

Test 4: Voting
  - User A votes Yes (weight = 100 tokens)
  - User B votes No (weight = 50 tokens)
  - User C votes Yes (weight = 75 tokens)
  - Verify duplicate prevention

Test 5: Finalization and Execution
  - Finalize after voting period
  - Decrypt tallies (Yes = 175, No = 50)
  - Execute proposal
  - Verify ETH transferred to recipient

Test 6: Rejection
  - Create another proposal
  - Majority votes No
  - Execute should fail (no > yes)
```

---

## Summary

The Confidential DAO combines all FHEVM concepts:

| Module | Concept Used |
|--------|-------------|
| 03: Encrypted Types | `euint64`, `ebool`, `eaddress` |
| 04: Operations | `FHE.add()`, `FHE.gt()` |
| 05: ACL | `FHE.allow()`, `FHE.allowThis()`, cross-contract ACL |
| 06: Inputs | `externalEbool`, `FHE.fromExternal()` |
| 07: Decryption | `makePubliclyDecryptable()` for tallies |
| 08: Conditional Logic | `FHE.select()` for weighted voting |
| 10: Frontend | Relayer SDK integration |
| 11: ERC-20 | Governance token with encrypted balances |
| 12: Voting | Private voting with encrypted tallies |

This capstone demonstrates that FHEVM can power real-world, privacy-preserving decentralized governance.
