# Module 12: Exercise -- Build a Confidential Voting System

## Objective

Implement a `ConfidentialVoting` contract where votes are encrypted, tallies are hidden during voting, and results are only revealed after the deadline.

---

## Task: ConfidentialVoting

### Starter Code

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint8, externalEuint8, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

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

    function createProposal(
        string calldata description,
        uint256 duration
    ) external onlyOwner {
        uint256 id = proposalCount++;

        // TODO: Set proposal fields (description, deadline = block.timestamp + duration, revealed = false)
        // TODO: Initialize yesVotes and noVotes to encrypted 0 using FHE.asEuint32(0)
        // TODO: FHE.allowThis() for both tallies
        // TODO: Emit ProposalCreated event with id, description, and deadline
    }

    function vote(uint256 proposalId, externalEuint8 encVote, bytes calldata inputProof) external {
        // TODO: Require proposalId < proposalCount ("Invalid proposal")
        // TODO: Require block.timestamp <= proposals[proposalId].deadline ("Voting ended")
        // TODO: Require voter has not already voted
        // TODO: Mark voter as having voted

        // TODO: Convert encVote using FHE.fromExternal(encVote, inputProof) -> euint8 voteValue
        // TODO: Compare with 1 to get ebool: ebool isYes = FHE.eq(voteValue, FHE.asEuint8(1))
        // TODO: Create euint32 oneVote = FHE.asEuint32(1) and zeroVote = FHE.asEuint32(0)
        // TODO: Use FHE.select(isYes, oneVote, zeroVote) for yes increment
        // TODO: Use FHE.select(isYes, zeroVote, oneVote) for no increment
        // TODO: Add increments to tallies using FHE.add()
        // TODO: FHE.allowThis() for both updated tallies
        // TODO: Emit VoteCast event
    }

    function getYesVotes(uint256 proposalId) external view returns (euint32) {
        return proposals[proposalId].yesVotes;
    }

    function getNoVotes(uint256 proposalId) external view returns (euint32) {
        return proposals[proposalId].noVotes;
    }

    function isVotingEnded(uint256 proposalId) external view returns (bool) {
        return block.timestamp > proposals[proposalId].deadline;
    }
}
```

---

## Step-by-Step Instructions

### Step 1: createProposal

- Set the proposal description
- Compute the deadline: `block.timestamp + duration`
- Set `revealed = false`
- Use `FHE.asEuint32(0)` for both `yesVotes` and `noVotes`
- Grant `FHE.allowThis()` for both tallies (the contract needs access)
- Emit `ProposalCreated` with id, description, and deadline

### Step 2: vote

This is the core function:
1. Validate: proposalId is valid, deadline has not passed, voter has not voted
2. Mark voter as having voted
3. Convert `externalEuint8` with `FHE.fromExternal(encVote, inputProof)` to get `euint8 voteValue`
4. Compare against 1: `ebool isYes = FHE.eq(voteValue, FHE.asEuint8(1))`
5. Use `FHE.select(isYes, oneVote, zeroVote)` for `yesIncrement`
6. Use `FHE.select(isYes, zeroVote, oneVote)` for `noIncrement`
7. Add increments to tallies with `FHE.add()`
8. Update ACL with `FHE.allowThis()` for both tallies
9. Emit `VoteCast` event

---

## Hints

<details>
<summary>Hint 1: createProposal</summary>

```solidity
proposals[id].description = description;
proposals[id].yesVotes = FHE.asEuint32(0);
proposals[id].noVotes = FHE.asEuint32(0);
proposals[id].deadline = block.timestamp + duration;
proposals[id].revealed = false;

FHE.allowThis(proposals[id].yesVotes);
FHE.allowThis(proposals[id].noVotes);

emit ProposalCreated(id, description, proposals[id].deadline);
```
</details>

<details>
<summary>Hint 2: vote function</summary>

```solidity
require(proposalId < proposalCount, "Invalid proposal");
require(block.timestamp <= proposals[proposalId].deadline, "Voting ended");
require(!hasVoted[proposalId][msg.sender], "Already voted");

euint8 voteValue = FHE.fromExternal(encVote, inputProof);
ebool isYes = FHE.eq(voteValue, FHE.asEuint8(1));

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
```
</details>

---

## Bonus Challenges

1. **Reveal function:** Add a `revealResults(uint256 proposalId)` function that the owner can call after the deadline. It should grant ACL access to the owner via `FHE.allow()`, decrypt the tallies, and store the plaintext results in `yesResult` and `noResult`. Set `revealed = true` and emit the `ResultRevealed` event.

2. **Multi-option voting:** Extend the contract to support proposals with N options (not just Yes/No). Use the same `externalEuint8` input as an option index and loop through options with `FHE.eq()` + `FHE.select()`.

3. **Voter eligibility:** Add a whitelist of eligible voters that the owner can manage. Only whitelisted addresses can vote.

4. **Quorum check:** After the deadline, add a function that checks if the total votes (yes + no) meet a minimum quorum threshold. Use `FHE.ge()` to compare the encrypted total against a plaintext threshold.

5. **Delegation:** Allow voters to delegate their vote to another address before the voting period starts.

---

## Success Criteria

- [ ] Contract compiles without errors
- [ ] Proposals are created with encrypted zero tallies (`euint32`)
- [ ] Voters can submit encrypted votes via `externalEuint8` (0=no, 1=yes)
- [ ] `FHE.eq(voteValue, FHE.asEuint8(1))` correctly converts vote to `ebool`
- [ ] Duplicate voting is prevented
- [ ] Deadline-based check enforces the voting window
- [ ] `FHE.select()` updates both tallies on every vote
- [ ] Tallies cannot be decrypted (only contract has ACL via `allowThis`)
- [ ] All encrypted values have proper ACL calls
- [ ] Frontend uses `input.add8(1)` (not `input.addBool(true)`)
