---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 14: Capstone - Confidential DAO"
footer: "Zama Developer Program"
---

# Module 14: Capstone -- Confidential DAO

Combining tokens, voting, and treasury into a full DAO.

---

# What We Are Building

A Confidential DAO with:

1. **Governance Token** -- Confidential ERC-20 (encrypted balances)
2. **Weighted Voting** -- Vote power = token balance
3. **Treasury** -- ETH managed by the DAO
4. **Proposals** -- Spend treasury funds, approved by vote

All votes are private. All balances are encrypted.

---

# System Architecture

```
GovernanceToken (ConfidentialERC20)
  - Encrypted balances
  - Cross-contract ACL for DAO

ConfidentialDAO
  - Create proposals
  - Weighted encrypted voting
  - Treasury management
  - Finalize and execute

Frontend (React + fhevmjs)
  - Full dApp interface
```

---

# New Concept: Cross-Contract ACL

The DAO needs to read token balances for vote weighting.

```
1. User holds governance tokens
2. User calls:
   token.grantDAOAccess(daoAddress)
   --> FHE.allow(balance, daoAddress)
3. DAO can now read:
   token.balanceOf(user) --> euint64
4. DAO uses balance as vote weight
```

---

# Weighted Voting

```solidity
function vote(
    uint256 proposalId, externalEbool encVote,
    bytes calldata inputProof
) external {
    euint64 weight =
        governanceToken.balanceOf(msg.sender);

    ebool voteYes = FHE.fromExternal(encVote, inputProof);
    euint64 zero = FHE.asEuint64(0);

    euint64 yesWeight =
        FHE.select(voteYes, weight, zero);
    euint64 noWeight =
        FHE.select(voteYes, zero, weight);

    p.yesVotes = FHE.add(p.yesVotes, yesWeight);
    p.noVotes = FHE.add(p.noVotes, noWeight);
}
```

---

# Module 12 vs. Module 14 Voting

| Feature | Module 12 | Module 14 |
|---------|-----------|-----------|
| Vote weight | 1 per voter | Token balance |
| Token integration | None | Cross-contract ACL |
| Treasury | None | ETH management |
| Execution | View results | Transfer funds |

---

# Proposal Lifecycle

```
Phase 1: Create
  - Description, recipient, ETH amount
  - Voting starts immediately

Phase 2: Vote
  - Token holders submit encrypted Yes/No
  - Weight = token balance
  - One vote per address

Phase 3: Finalize
  - Admin finalizes after deadline
  - Makes tallies publicly decryptable

Phase 4: Execute
  - If yes > no: ETH transferred
  - If no >= yes: rejected
```

---

# Proposal Data Structure

```solidity
struct Proposal {
    string description;
    address recipient;
    uint256 amount;      // ETH to transfer
    uint256 startTime;
    uint256 endTime;
    euint64 yesVotes;    // Encrypted tally
    euint64 noVotes;     // Encrypted tally
    bool exists;
    bool finalized;
    bool executed;
}
```

---

# Treasury Management

```solidity
// Fund the treasury
receive() external payable {
    emit TreasuryFunded(msg.sender, msg.value);
}

// Execute approved proposal
function executeProposal(
    uint256 proposalId,
    uint64 decryptedYes,
    uint64 decryptedNo
) public onlyAdmin {
    require(decryptedYes > decryptedNo);
    require(address(this).balance >= p.amount);

    p.executed = true;
    payable(p.recipient).transfer(p.amount);
}
```

---

# Concepts Used from Each Module

| Module | Concept |
|--------|---------|
| 03 | `euint64`, `ebool`, `eaddress` |
| 04 | `FHE.add()`, `FHE.gt()` |
| 05 | Cross-contract ACL |
| 06 | `externalEbool`, `FHE.fromExternal()` |
| 07 | Public decryption (makePubliclyDecryptable) |
| 08 | `FHE.select()` weighted voting |
| 10 | fhevmjs frontend |
| 11 | Governance token |
| 12 | Private voting |

---

# Security Considerations

| Risk | Mitigation |
|------|-----------|
| Double-voting with same tokens | Snapshot balances (advanced) |
| Admin manipulation | On-chain decrypt callback (advanced) |
| Treasury drain | Quorum, caps, cooldowns |
| Vote weight = 0 | Check weight > 0 before accepting |

---

# Frontend Pages

```
1. Dashboard
   - Treasury balance, active proposals
   - Your token balance (decrypted)

2. Create Proposal
   - Description, recipient, amount

3. Proposal Detail
   - Vote Yes/No button
   - Results after finalization

4. Token Management
   - Grant DAO access
   - Transfer tokens
```

---

# Frontend: Key Interactions

```typescript
// One-time: grant DAO access
await token.grantDAOAccess(daoAddress);

// Create proposal
await dao.createProposal(
  desc, recipient, amount);

// Vote (encrypted)
const input = instance.createEncryptedInput(
  daoAddress, userAddress);
input.addBool(true); // Yes
const enc = await input.encrypt();
await dao.vote(proposalId, enc.handles[0], enc.inputProof);
```

---

# Testing Strategy

```
1. Deploy GovernanceToken + ConfidentialDAO
2. Mint tokens to test accounts
3. Grant DAO access from each account
4. Fund treasury with ETH
5. Create proposal
6. Cast weighted votes
7. Finalize + decrypt
8. Execute if approved
9. Verify ETH transferred
```

---

# What You Have Accomplished

After completing this bootcamp, you can:

- Write FHEVM contracts with encrypted types
- Perform arithmetic, bitwise, and comparison operations
- Manage ACL permissions for encrypted data
- Handle encrypted inputs from frontends
- Request decryption via the gateway
- Use conditional logic with `FHE.select()`
- Build real applications: tokens, voting, auctions, DAOs

---

# What is Next?

- Contribute to Zama's open-source ecosystem
- Build your own confidential dApp
- Explore advanced patterns (encrypted NFTs, private DEXs)
- Join the Zama developer community
- Push the boundaries of on-chain privacy!

**Congratulations on completing the FHEVM Bootcamp!**
