# Module 12: Confidential Voting -- Lesson

**Duration:** 4 hours
**Prerequisites:** Module 11
**Learning Objectives:**
- Build encrypted voting with homomorphic tallying
- Prevent double voting without revealing voter identity
- Implement result reveal mechanism

## Introduction

Voting is one of the most compelling use cases for FHE on blockchain. In traditional on-chain voting (e.g., governance DAOs), every vote is publicly visible. This creates problems:
- **Voter coercion** -- someone can verify how you voted
- **Bandwagon effects** -- seeing partial results influences voters
- **Front-running** -- last-minute strategic voting based on current tallies

With FHEVM, we can build a voting system where **individual votes are never revealed** and **tallies remain encrypted** until the election ends.

---

## 1. Design Overview

```
Voting Lifecycle:
1. Owner creates a proposal with a description and duration
2. Voting period opens immediately (deadline = now + duration)
3. Voters submit encrypted votes (0 = no, 1 = yes)
4. Nobody can see tallies during voting
5. Deadline passes -- voting closes
6. Results can be revealed (decrypted)
```

---

## 2. The Vote Encoding

Each vote is an encrypted `euint8` value: `1` for yes, `0` for no. Inside the contract, we use `FHE.eq()` to compare the encrypted vote against `1`, producing an `ebool`. We then use `FHE.select()` to add 1 to the matching tally and 0 to the other.

**Why `euint8` instead of `ebool`?** Using `euint8` is more flexible -- it supports multi-option voting later (e.g., 0, 1, 2, 3 for four options) without changing the function signature.

```solidity
// For a Yes/No vote:
// Vote value 1 (yes): yesCount += 1, noCount += 0
// Vote value 0 (no):  yesCount += 0, noCount += 1
```

This approach ensures that no matter what the voter chooses, the same operations happen on all tallies -- an observer cannot tell which option was selected.

---

## 3. Duplicate Vote Prevention

We must prevent double voting. Since we cannot use encrypted data for this (the contract needs to know definitively who voted), we use a plaintext mapping:

```solidity
mapping(uint256 => mapping(address => bool)) public hasVoted;
```

This reveals **that** someone voted, but not **how** they voted. This is an acceptable trade-off -- in most voting systems, voter participation is public.

---

## 4. Complete ConfidentialVoting Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint8, externalEuint8, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ConfidentialVoting - Module 12: Private on-chain voting
/// @notice Vote tallies are encrypted until reveal. No one can see individual votes.
contract ConfidentialVoting is ZamaEthereumConfig {
    struct Proposal {
        string description;
        euint32 yesVotes;
        euint32 noVotes;
        uint256 deadline;
        bool revealed;
        uint32 yesResult;
        uint32 noResult;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    uint256 public proposalCount;
    address public owner;

    event ProposalCreated(uint256 indexed proposalId, string description, uint256 deadline);
    event VoteCast(uint256 indexed proposalId, address indexed voter);
    event ResultRevealed(uint256 indexed proposalId, uint32 yesVotes, uint32 noVotes);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Create a new proposal with a voting deadline
    function createProposal(string calldata description, uint256 duration) external onlyOwner {
        uint256 id = proposalCount++;
        proposals[id].description = description;
        proposals[id].yesVotes = FHE.asEuint32(0);
        proposals[id].noVotes = FHE.asEuint32(0);
        proposals[id].deadline = block.timestamp + duration;
        proposals[id].revealed = false;

        FHE.allowThis(proposals[id].yesVotes);
        FHE.allowThis(proposals[id].noVotes);

        emit ProposalCreated(id, description, proposals[id].deadline);
    }

    /// @notice Cast an encrypted vote (0 = no, 1 = yes)
    function vote(uint256 proposalId, externalEuint8 encVote, bytes calldata inputProof) external {
        require(proposalId < proposalCount, "Invalid proposal");
        require(block.timestamp <= proposals[proposalId].deadline, "Voting ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        euint8 voteValue = FHE.fromExternal(encVote, inputProof);
        ebool isYes = FHE.eq(voteValue, FHE.asEuint8(1));

        // Increment yes or no tally using select
        euint32 oneVote = FHE.asEuint32(1);
        euint32 zeroVote = FHE.asEuint32(0);

        proposals[proposalId].yesVotes = FHE.add(
            proposals[proposalId].yesVotes,
            FHE.select(isYes, oneVote, zeroVote)
        );
        proposals[proposalId].noVotes = FHE.add(
            proposals[proposalId].noVotes,
            FHE.select(isYes, zeroVote, oneVote)
        );

        FHE.allowThis(proposals[proposalId].yesVotes);
        FHE.allowThis(proposals[proposalId].noVotes);

        hasVoted[proposalId][msg.sender] = true;
        emit VoteCast(proposalId, msg.sender);
    }

    /// @notice Get encrypted yes vote count (for authorized viewers)
    function getYesVotes(uint256 proposalId) external view returns (euint32) {
        return proposals[proposalId].yesVotes;
    }

    /// @notice Get encrypted no vote count
    function getNoVotes(uint256 proposalId) external view returns (euint32) {
        return proposals[proposalId].noVotes;
    }

    /// @notice Check if voting deadline has passed
    function isVotingEnded(uint256 proposalId) external view returns (bool) {
        return block.timestamp > proposals[proposalId].deadline;
    }
}
```

---

## 5. The Vote Function in Detail

```solidity
function vote(uint256 proposalId, externalEuint8 encVote, bytes calldata inputProof) external {
```

The voter sends an encrypted `euint8` value:
- `1` = Yes
- `0` = No

The encryption happens on the frontend:

```typescript
const input = instance.createEncryptedInput(contractAddress, userAddress);
input.add8(1); // Vote YES (or 0 for NO)
const encrypted = await input.encrypt();
const tx = await contract.vote(proposalId, encrypted.handles[0], encrypted.inputProof);
```

Inside the contract, the encrypted `euint8` is compared against `1` to produce an `ebool`:

```solidity
euint8 voteValue = FHE.fromExternal(encVote, inputProof);
ebool isYes = FHE.eq(voteValue, FHE.asEuint8(1));

euint32 oneVote = FHE.asEuint32(1);
euint32 zeroVote = FHE.asEuint32(0);

// If isYes: yes += 1, no += 0
// If !isYes: yes += 0, no += 1
euint32 yesIncrement = FHE.select(isYes, oneVote, zeroVote);
euint32 noIncrement = FHE.select(isYes, zeroVote, oneVote);
```

Both `yesVotes` and `noVotes` are always updated with an `FHE.add()`. The values added are encrypted 1 or 0, but nobody can tell which tally got the 1.

---

## 6. Why FHE.select() Instead of Branching

You might think of writing:

```solidity
// BAD: this leaks information!
if (decryptedVote == 1) {
    p.yesVotes = FHE.add(p.yesVotes, one);
} else {
    p.noVotes = FHE.add(p.noVotes, one);
}
```

This would require decrypting the vote, which defeats the purpose. With `FHE.select()`, the computation happens entirely on encrypted data.

---

## 7. Tallies and Result Viewing

During the voting period, nobody can decrypt the tallies -- the ACL for the tallies only grants access to the contract itself (via `allowThis`).

The contract provides view functions to access the encrypted tally handles:

```solidity
function getYesVotes(uint256 proposalId) external view returns (euint32) {
    return proposals[proposalId].yesVotes;
}

function getNoVotes(uint256 proposalId) external view returns (euint32) {
    return proposals[proposalId].noVotes;
}
```

These return encrypted handles. To actually read the values, the caller would need ACL access and would decrypt through the gateway. In the current contract, only the contract itself has ACL access during voting, so the tallies remain hidden.

**Note:** The contract does not yet include a `finalize()` function that grants ACL to the owner for decryption. The struct includes `revealed`, `yesResult`, and `noResult` fields that are prepared for a future reveal mechanism. This is a good exercise extension -- see the Bonus Challenges in the exercise.

---

## 8. Privacy Guarantees and Limitations

### What IS private:
- Individual vote choices (yes/no)
- Running tallies during the voting period
- The margin of victory (until results are revealed)

### What is NOT private:
- Whether an address voted (participation is public)
- When an address voted (timestamp is public)
- The final results (after reveal)

### Limitation: Vote Weight

In this basic design, every voter has equal weight (1 vote). For weighted voting (e.g., based on token holdings), you would need to integrate with a confidential ERC-20 (Module 11).

---

## 9. Multi-Option Voting Extension

For proposals with more than 2 options, extend the pattern. Since we already use `euint8` for the vote value, the function signature stays the same -- only the internal logic changes:

```solidity
struct MultiProposal {
    euint32[] optionVotes; // Array of encrypted tallies
    uint8 optionCount;
}

function voteMulti(uint256 proposalId, externalEuint8 encChoice, bytes calldata inputProof) external {
    euint8 choice = FHE.fromExternal(encChoice, inputProof);

    for (uint8 i = 0; i < p.optionCount; i++) {
        ebool isThisOption = FHE.eq(choice, FHE.asEuint8(i));
        euint32 increment = FHE.select(isThisOption, oneVote, zeroVote);
        p.optionVotes[i] = FHE.add(p.optionVotes[i], increment);
        FHE.allowThis(p.optionVotes[i]);
    }
}
```

The voter sends an encrypted option index. The contract loops through all options and adds 1 to the matching one and 0 to the rest. This is exactly why using `euint8` for the vote input is a better design choice than `ebool` -- it naturally extends to multi-option voting.

---

## Summary

- Encrypted voting keeps individual votes secret and tallies hidden during the election
- Votes are sent as encrypted `euint8` values (0 = no, 1 = yes) using `input.add8()` on the frontend
- `FHE.eq()` converts the `euint8` vote to an `ebool` for use with `FHE.select()`
- `FHE.select()` is the key primitive: add 1 or 0 to each tally based on the encrypted vote
- Tallies use `euint32` -- sufficient for vote counts and more gas-efficient than `euint64`
- Duplicate prevention uses a plaintext mapping (participation is public, choice is not)
- Both tallies are always updated with `FHE.add()` to prevent side-channel analysis
- The pattern extends to multi-option voting with encrypted option indices (same `euint8` input type)
