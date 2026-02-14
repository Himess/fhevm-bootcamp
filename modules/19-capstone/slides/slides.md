---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 19: Capstone - Confidential DAO"
footer: "Zama Developer Program"
---

# Module 19: Capstone -- Confidential DAO

Combining tokens, voting, and treasury into a full DAO.

---

# What We Are Building

A Confidential DAO with:

1. **Governance Token** -- Confidential ERC-20 (encrypted balances)
2. **Weighted Voting** -- Vote power = token balance
3. **Treasury** -- ETH managed by the DAO
4. **Proposals** -- Spend treasury funds, approved by vote

All votes are private. All balances are encrypted.

<!--
Speaker notes: Set expectations for the capstone. This is the most complex project in the bootcamp -- it combines the confidential ERC-20 from Module 11 with weighted voting from Module 12, plus treasury management. Students should have their previous module code open for reference.
-->

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

Frontend (React + Relayer SDK)
  - Full dApp interface
```

<!--
Speaker notes: Show how the three components interact: the GovernanceToken is a standalone confidential ERC-20, the ConfidentialDAO reads token balances for vote weighting and manages proposals and treasury, and the frontend ties them together. Cross-contract ACL is the new concept here.
-->

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

<!--
Speaker notes: Cross-contract ACL is the key new concept. The user must explicitly grant the DAO contract access to their token balance using FHE.allow. Without this step, the DAO cannot read the user's balance for vote weighting. This is a one-time operation per user.
-->

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

<!--
Speaker notes: Compare this with Module 12's voting: instead of adding 1 or 0, we add the user's entire token balance or 0. FHE.select routes the weight to the correct tally. The token balance is read directly from the governance token contract via cross-contract ACL. This is weighted voting with complete privacy.
-->

---

# Module 12 vs. Module 19 Voting

| Feature | Module 12 | Module 19 |
|---------|-----------|-----------|
| Vote weight | 1 per voter | Token balance |
| Token integration | None | Cross-contract ACL |
| Treasury | None | ETH management |
| Execution | View results | Transfer funds |

<!--
Speaker notes: This comparison table shows how the capstone builds on Module 12. The three key upgrades are: token-weighted votes, cross-contract ACL for balance reading, and treasury execution that actually transfers ETH. This progression from simple to complex mirrors real DAO development.
-->

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

<!--
Speaker notes: Walk through all four phases. The key design decision is the finalization step: the admin makes tallies publicly decryptable, then anyone can read the results. Execution is a separate step that checks the decrypted results and transfers ETH. This separation prevents atomic manipulation.
-->

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

<!--
Speaker notes: The Proposal struct combines plaintext fields (description, recipient, amount, timestamps, flags) with encrypted fields (yesVotes, noVotes). The exists/finalized/executed flags control the lifecycle state machine. Note that the ETH amount is plaintext because it becomes public when the proposal is created.
-->

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

<!--
Speaker notes: The treasury has two parts: a receive() function that accepts ETH, and executeProposal that sends ETH to the approved recipient. The execute function takes decrypted vote counts as parameters and checks that yes > no. Discuss the trust assumption: the admin provides the decrypted values.
-->

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
| 10 | Relayer SDK frontend |
| 11 | Governance token |
| 12 | Private voting |

<!--
Speaker notes: Use this table to help students see how the capstone ties everything together. Each row represents a module concept that appears in the DAO. This is a great review moment -- ask students to identify where each concept appears in the code they have seen.
-->

---

# Security Considerations

| Risk | Mitigation |
|------|-----------|
| Double-voting with same tokens | Snapshot balances (advanced) |
| Admin manipulation | On-chain decrypt callback (advanced) |
| Treasury drain | Quorum, caps, cooldowns |
| Vote weight = 0 | Check weight > 0 before accepting |

<!--
Speaker notes: Discuss each security risk honestly. The snapshot problem (double-voting with transferred tokens) is the most serious and requires an advanced solution. Admin manipulation can be mitigated with on-chain decrypt callbacks. Quorum and caps prevent treasury drain. These are real DAO security considerations.
-->

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

<!--
Speaker notes: The frontend has four pages, each demonstrating different FHEVM interaction patterns. The dashboard reads and decrypts balances. Create Proposal is a standard transaction. Proposal Detail uses encrypted inputs for voting. Token Management handles cross-contract ACL grants.
-->

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

<!--
Speaker notes: Show the three key frontend interactions. The grantDAOAccess is a one-time setup. createProposal is a standard plaintext transaction. The vote interaction uses addBool(true) because the capstone uses externalEbool for the vote parameter, unlike Module 12 which used externalEuint8.
-->

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

<!--
Speaker notes: The testing strategy follows the full lifecycle. Have students implement these tests step by step. Each step depends on the previous one, so they must be run in order. The final verification -- checking ETH was actually transferred to the recipient -- confirms the entire pipeline works end to end.
-->

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

<!--
Speaker notes: This is the achievement slide. Read through each bullet point and let it sink in. Students started with Solidity basics and now can build complete confidential applications. These are real, deployable applications -- not toy examples. Acknowledge the effort it took to get here.
-->

---

# What is Next?

- Contribute to Zama's open-source ecosystem
- Build your own confidential dApp
- Explore advanced patterns (encrypted NFTs, private DEXs)
- Join the Zama developer community
- Push the boundaries of on-chain privacy!

**Congratulations on completing the FHEVM Bootcamp!**

<!--
Speaker notes: End on an inspiring note. Encourage students to start building their own projects immediately while the knowledge is fresh. Share links to Zama's Discord, GitHub, and documentation. Thank everyone for their time and participation.
-->
