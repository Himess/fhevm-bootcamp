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

---

# Why euint8 Instead of ebool?

The vote input is `externalEuint8`, not `externalEbool`.

- **Flexibility:** `euint8` supports values 0-255
- **Multi-option ready:** Same signature for 2, 3, or N options
- **Pattern:** `FHE.eq(voteValue, FHE.asEuint8(1))` converts to `ebool`

```solidity
// Yes/No: 0 = no, 1 = yes
euint8 voteValue = FHE.fromExternal(encVote, proof);
ebool isYes = FHE.eq(voteValue, FHE.asEuint8(1));
```

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

---

# The Vote Function

```solidity
function vote(
    uint256 proposalId, externalEuint8 encVote,
    bytes calldata proof
) external {
    require(!hasVoted[proposalId][msg.sender]);
    hasVoted[proposalId][msg.sender] = true;

    euint8 voteValue = FHE.fromExternal(encVote, proof);
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

---

# Privacy Summary

| Aspect | Visibility |
|--------|-----------|
| Who voted | Public |
| When they voted | Public |
| What they voted | **Private** |
| Running tallies | **Private** |
| Final results | Public (after reveal) |

---

# Multi-Option Extension

```solidity
function voteMulti(
    uint256 proposalId, externalEuint8 encChoice,
    bytes calldata proof
) external {
    euint8 choice = FHE.fromExternal(encChoice, proof);
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

---

# Summary

- Encrypted voting prevents coercion, bandwagon effects, and front-running
- Votes sent as `euint8` (0=no, 1=yes) via `input.add8()` -- not `addBool()`
- `FHE.eq()` + `FHE.select()` adds 1 or 0 to each `euint32` tally
- Participation is public (duplicate prevention), choice is private
- Tallies locked during voting; only contract has ACL access
- Extends to multi-option votes with the same `euint8` input type

---

# Next Up

**Module 13: Sealed-Bid Auction**

Build a sealed-bid auction with encrypted bids!
