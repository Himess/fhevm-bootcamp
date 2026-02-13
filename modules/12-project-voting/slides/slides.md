---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 12: Confidential Voting"
footer: "Zama Developer Program"
---

# Module 12: Confidential Voting

Building a private voting system with encrypted tallies.

---

# Why Private Voting?

Public on-chain voting has problems:

| Problem | Description |
|---------|-------------|
| **Coercion** | Someone can verify how you voted |
| **Bandwagon** | Seeing partial results influences voters |
| **Front-running** | Strategic last-minute voting |

FHE solves all three: votes and tallies stay encrypted.

<!--
Speaker notes: These three problems are real and well-documented in existing DAOs. Coercion means an employer or government can verify how you voted. Bandwagon effect means early results influence late voters. FHE solves all three because nobody can see any vote or tally until the reveal.
-->

---

# Voting Lifecycle

```
1. Owner creates proposal (description + duration)
2. Voting opens immediately (deadline = now + duration)
3. Voters submit encrypted votes (0=no, 1=yes)
4. Nobody sees tallies during voting
5. Deadline passes -- voting closes
6. Results can be revealed (decrypted)
```

<!--
Speaker notes: Walk through the lifecycle step by step. Emphasize that during phase 3-4 (voting), nobody can see tallies. The reveal only happens after voting closes. Ask: "What would happen if tallies were visible during voting?"
-->

---

# Core Data Structure

```solidity
struct Proposal {
    string description;
    euint32 yesVotes;     // Encrypted tally
    euint32 noVotes;      // Encrypted tally
    uint256 deadline;
    bool revealed;
    uint32 yesResult;     // Plaintext (after reveal)
    uint32 noResult;      // Plaintext (after reveal)
}

mapping(uint256 => Proposal) public proposals;
mapping(uint256 => mapping(address => bool))
    public hasVoted;
```

<!--
Speaker notes: Point out the mix of encrypted and plaintext fields. yesVotes and noVotes are euint32 (encrypted tallies). deadline and revealed are plaintext because they do not need privacy. yesResult and noResult store the plaintext results after reveal. This hybrid approach is common in FHEVM contracts.
-->

---

# Why euint8 Instead of ebool?

The vote input is `externalEuint8`, not `externalEbool`.

- **Flexibility:** `euint8` supports values 0-255
- **Multi-option ready:** Same signature for 2, 3, or N options
- **Pattern:** `FHE.eq(voteValue, FHE.asEuint8(1))` converts to `ebool`

```solidity
// Yes/No: 0 = no, 1 = yes
euint8 voteValue = FHE.fromExternal(encVote, inputProof);
ebool isYes = FHE.eq(voteValue, FHE.asEuint8(1));
```

<!--
Speaker notes: Explain why euint8 instead of ebool for the vote input. Using euint8 provides flexibility for multi-option voting (0, 1, 2, etc.) without changing the function signature. The FHE.eq converts to ebool for the yes/no branching logic.
-->

---

# Creating a Proposal

```solidity
function createProposal(
    string calldata description,
    uint256 duration
) external onlyOwner {
    uint256 id = proposalCount++;
    proposals[id].description = description;
    proposals[id].yesVotes = FHE.asEuint32(0);
    proposals[id].noVotes = FHE.asEuint32(0);
    proposals[id].deadline = block.timestamp + duration;
    proposals[id].revealed = false;
    FHE.allowThis(proposals[id].yesVotes);
    FHE.allowThis(proposals[id].noVotes);
    emit ProposalCreated(id, description,
        proposals[id].deadline);
}
```

<!--
Speaker notes: Walk through proposal creation. Both tallies are initialized to encrypted zero and granted allowThis. The deadline is set using block.timestamp + duration. Note that the event includes the description and deadline but no encrypted data -- events must remain plaintext.
-->

---

# The Vote Function

```solidity
function vote(
    uint256 proposalId, externalEuint8 encVote,
    bytes calldata inputProof
) external {
    require(!hasVoted[proposalId][msg.sender]);
    hasVoted[proposalId][msg.sender] = true;

    euint8 voteValue = FHE.fromExternal(encVote, inputProof);
    ebool isYes = FHE.eq(voteValue, FHE.asEuint8(1));

    euint32 oneVote = FHE.asEuint32(1);
    euint32 zeroVote = FHE.asEuint32(0);

    // If yes: yes+=1, no+=0
    // If no:  yes+=0, no+=1
    p.yesVotes = FHE.add(p.yesVotes,
        FHE.select(isYes, oneVote, zeroVote));
    p.noVotes = FHE.add(p.noVotes,
        FHE.select(isYes, zeroVote, oneVote));
}
```

<!--
Speaker notes: This is the core voting logic. Walk through it carefully: FHE.eq determines if the vote is "yes," then FHE.select creates a 1 or 0 increment for each tally. Both tallies are always updated -- if yes gets +1, no gets +0, and vice versa. An observer cannot tell which tally received the real vote.
-->

---

# Why FHE.select() Is Essential

```solidity
// BAD: requires decryption, leaks info
if (decryptedVote == 1) {
    yesVotes += 1;
} else {
    noVotes += 1;
}

// GOOD: fully encrypted computation
ebool isYes = FHE.eq(voteValue, FHE.asEuint8(1));
yesInc = FHE.select(isYes, oneVote, zeroVote);
noInc  = FHE.select(isYes, zeroVote, oneVote);
yesVotes = FHE.add(yesVotes, yesInc);
noVotes  = FHE.add(noVotes, noInc);
```

Both tallies are **always** updated. Observer cannot tell which got the 1.

<!--
Speaker notes: Compare the bad (if/else) approach with the good (FHE.select) approach. The bad version requires decrypting the vote, which defeats the purpose of encryption. The good version keeps everything encrypted and uses select to route the increment. This is the fundamental FHE programming pattern.
-->

---

# Duplicate Prevention

```solidity
mapping(uint256 => mapping(address => bool))
    public hasVoted;

require(!hasVoted[proposalId][msg.sender],
        "Already voted");
hasVoted[proposalId][msg.sender] = true;
```

**Trade-off:**
- Participation is public (who voted is visible)
- Vote choice is private (what they voted is encrypted)

<!--
Speaker notes: Discuss the privacy trade-off: participation is public but choice is private. This is similar to real elections where who voted is recorded but the ballot is secret. If even participation must be hidden, more advanced techniques like anonymous credentials would be needed.
-->

---

# Tallies and Result Viewing

```solidity
function getYesVotes(uint256 proposalId)
    external view returns (euint32) {
    return proposals[proposalId].yesVotes;
}

function getNoVotes(uint256 proposalId)
    external view returns (euint32) {
    return proposals[proposalId].noVotes;
}
```

These return encrypted handles. Only ACL-authorized callers
can decrypt. During voting: only the contract has ACL.

**Note:** No `finalize()` function yet -- `revealed`, `yesResult`,
`noResult` fields are ready for a future reveal mechanism.

<!--
Speaker notes: The getters return encrypted handles, not plaintext. During voting, only the contract has ACL access, so nobody can decrypt the tallies. After the reveal, the plaintext fields (yesResult, noResult) will hold the final counts. This two-phase design ensures privacy during voting.
-->

---

# Frontend: Casting a Vote

```typescript
const instance = await initFhevm();
const input = instance.createEncryptedInput(
  contractAddress, userAddress
);
input.add8(1); // Vote YES (0 for NO)

const encrypted = await input.encrypt();
const tx = await contract.vote(
  proposalId, encrypted.handles[0],
  encrypted.inputProof
);
await tx.wait();
```

Note: `add8(1)` not `addBool(true)` -- matches `externalEuint8`.

<!--
Speaker notes: A critical detail: use add8(1) on the client side because the contract expects externalEuint8, not externalEbool. The type must match exactly. Using addBool would create an externalEbool which does not match the function signature.
-->

---

# Frontend: Reading Results

```typescript
// Only after results are revealed / ACL granted
const yesHandle = await contract.getYesVotes(proposalId);
const noHandle = await contract.getNoVotes(proposalId);

const yesVotes = await instance.reencrypt(
  yesHandle, privateKey, publicKey,
  signature, contractAddress, ownerAddress
);

const noVotes = await instance.reencrypt(
  noHandle, privateKey, publicKey,
  signature, contractAddress, ownerAddress
);
```

<!--
Speaker notes: The frontend reading pattern uses reencryption through the gateway. This only works after the owner has been granted ACL access. During active voting, only the contract has access, so this would fail for regular users until results are revealed.
-->

---

# Privacy Summary

| Aspect | Visibility |
|--------|-----------|
| Who voted | Public |
| When they voted | Public |
| What they voted | **Private** |
| Running tallies | **Private** |
| Final results | Public (after reveal) |

<!--
Speaker notes: This privacy summary is a useful reference for explaining the system to stakeholders. The key message: vote choice and running tallies are private, everything else is public. This matches real-world secret ballot systems.
-->

---

# Multi-Option Extension

```solidity
function voteMulti(
    uint256 proposalId, externalEuint8 encChoice,
    bytes calldata inputProof
) external {
    euint8 choice = FHE.fromExternal(encChoice, inputProof);
    for (uint8 i = 0; i < optionCount; i++) {
        ebool isThis = FHE.eq(
            choice, FHE.asEuint8(i));
        euint32 inc = FHE.select(
            isThis, oneVote, zeroVote);
        optionVotes[i] = FHE.add(
            optionVotes[i], inc);
    }
}
```

Same `externalEuint8` input -- `euint8` naturally extends to N options.

<!--
Speaker notes: The multi-option extension demonstrates why we chose euint8 over ebool. The same function signature and input type works for 2, 3, or up to 256 options. The loop checks each option with FHE.eq and adds 1 or 0 to each tally. Gas cost scales linearly with the number of options.
-->

---

# Summary

- Encrypted voting prevents coercion, bandwagon effects, and front-running
- Votes sent as `euint8` (0=no, 1=yes) via `input.add8()` -- not `addBool()`
- `FHE.eq()` + `FHE.select()` adds 1 or 0 to each `euint32` tally
- Participation is public (duplicate prevention), choice is private
- Tallies locked during voting; only contract has ACL access
- Extends to multi-option votes with the same `euint8` input type

<!--
Speaker notes: Summarize the voting module by connecting back to the ballot box analogy from Module 01. Students have now built the very system that was introduced as a concept. Emphasize that this is production-ready with minor additions like finalization and access control.
-->

---

# Next Up

**Module 13: Sealed-Bid Auction**

Build a sealed-bid auction with encrypted bids!

<!--
Speaker notes: Transition to Module 13 by asking: "What other systems benefit from hidden information that is eventually revealed?" Auctions are a perfect fit -- bids must be hidden during bidding but the winner needs to be announced.
-->
