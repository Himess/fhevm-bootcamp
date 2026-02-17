---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 19: Capstone - Confidential DAO"
footer: "Zama Developer Program"
---

<style>
section { font-size: 18px; overflow: hidden; color: #1E293B; }
h1 { font-size: 28px; margin-bottom: 8px; color: #1E40AF; border-bottom: 2px solid #DBEAFE; padding-bottom: 6px; }
h2 { font-size: 22px; margin-bottom: 6px; color: #155E75; }
h3 { font-size: 19px; color: #92400E; }
code { font-size: 15px; background: #F1F5F9; color: #3730A3; padding: 1px 4px; border-radius: 3px; }
pre { font-size: 13px; line-height: 1.25; margin: 6px 0; background: #1E293B; color: #E2E8F0; border-radius: 6px; padding: 10px; border-left: 3px solid #6366F1; }
pre code { background: transparent; color: #E2E8F0; padding: 0; }
li { margin-bottom: 1px; line-height: 1.4; }
table { font-size: 15px; border-collapse: collapse; width: 100%; }
th { background: #1E40AF; color: white; padding: 6px 10px; text-align: left; }
td { padding: 5px 10px; border-bottom: 1px solid #E2E8F0; }
tr:nth-child(even) { background: #F8FAFC; }
p { margin-bottom: 4px; }
ul, ol { margin-top: 4px; margin-bottom: 4px; }
header { color: #3B82F6 !important; }
footer { color: #94A3B8 !important; }
section.small { font-size: 15px; }
section.small h1 { font-size: 24px; margin-bottom: 6px; }
section.small ol li { margin-bottom: 0; line-height: 1.3; }
</style>

# Module 19: Capstone -- Confidential DAO

Combining tokens, voting, treasury, and cross-contract ACL into a full governance system.

<!-- Speaker notes: Welcome to the capstone module. This is the culmination of everything students have learned throughout the bootcamp. The Confidential DAO combines the confidential ERC-20 from Module 11, the voting from Module 12, the patterns from Module 17, and the DeFi concepts from Module 18. Set expectations: this is the most complex project in the bootcamp. -->

---

# Learning Objectives

By the end of this module, you will be able to:

1. Design a **two-contract architecture** with a governance token and DAO contract
2. Implement **cross-contract ACL** for reading encrypted balances between contracts
3. Build **weighted voting** where vote power equals token balance
4. Manage a **treasury** with proposal-based spending and execution
5. Implement the **full proposal lifecycle**: create, vote, finalize, execute
6. Integrate the DAO with a **frontend** using the Relayer SDK

<!-- Speaker notes: These objectives represent the synthesis of the entire bootcamp. Each one draws from multiple previous modules. By completing this capstone, students demonstrate mastery of encrypted types, operations, ACL, inputs, decryption, conditional logic, and frontend integration all working together. -->

---

# What We Are Building

A Confidential DAO with four components:

1. **Governance Token** -- Confidential ERC-20 with encrypted balances
2. **Weighted Voting** -- Vote power = token balance (not 1-per-person)
3. **Treasury** -- ETH managed by the DAO, released via approved proposals
4. **Proposals** -- Create, vote, finalize, execute

All votes are **private**. All balances are **encrypted**. Results are revealed only after voting ends.

<!-- Speaker notes: Set expectations for the capstone. This is the most complex project in the bootcamp -- it combines the confidential ERC-20 from Module 11 with weighted voting from Module 12, plus treasury management and cross-contract ACL. Students should have their previous module code open for reference. The two-contract architecture is the stretch goal; a simpler monolithic version is also valid. -->

---

# System Architecture

```
GovernanceToken (ConfidentialERC20)
  |-- Encrypted balances (_balances[user] = euint64)
  |-- Cross-contract ACL: grantDAOAccess(daoAddress)
  |-- balanceOf(user) returns euint64
  |
ConfidentialDAO
  |-- Reads token balances for vote weighting
  |-- Proposals: description + recipient + ETH amount
  |-- Encrypted tallies: yesVotes, noVotes (euint64)
  |-- Treasury: ETH held by the contract
  |
Frontend (React + Relayer SDK)
  |-- Create proposals, cast votes, view results
  |-- Encrypted input for votes (externalEbool)
```

<!-- Speaker notes: Show how the three components interact. The GovernanceToken is a standalone confidential ERC-20. The ConfidentialDAO reads token balances for vote weighting and manages proposals and treasury. The frontend ties them together. The key new concept is cross-contract ACL: the DAO needs permission to read token balances. -->

---

# The Governance Token

A simplified confidential ERC-20 with one critical addition:

```solidity
// Standard: encrypted balances
mapping(address => euint64) private _balances;

// NEW: allow the DAO contract to read balances
function grantDAOAccess(address dao) public {
    require(_initialized[msg.sender], "No balance");
    FHE.allow(_balances[msg.sender], dao);
}

// balanceOf must be callable by the DAO (not just msg.sender)
function balanceOf(address account) public view returns (euint64) {
    return _balances[account];
}
```

The user grants the DAO contract read access to their encrypted balance. This is a **one-time** operation per user.

<!-- Speaker notes: The governance token is essentially the ConfidentialERC20 from Module 11 with one new function: grantDAOAccess. This function calls FHE.allow to grant the DAO contract address permission to read the user's encrypted balance. Without this step, the DAO would get a zero handle when calling balanceOf. Note that balanceOf returns the raw euint64 handle -- the DAO can use it directly in FHE operations. -->

---

# Cross-Contract ACL Flow (New Concept)

```
Step 1: User holds governance tokens (encrypted balance)

Step 2: User calls token.grantDAOAccess(daoAddress)
        --> Executes: FHE.allow(_balances[msg.sender], daoAddress)
        --> DAO contract now has permission to read this balance

Step 3: User calls dao.vote(proposalId, encryptedVote, proof)
        --> DAO reads: token.balanceOf(msg.sender)
        --> Gets the euint64 handle (with ACL access)
        --> Uses balance as vote weight in FHE.select

Step 4: DAO computes new tally values
        --> FHE.add(yesVotes, weight)
        --> Sets ACL on new handles with FHE.allowThis()
```

**Critical:** Step 2 must happen before Step 3. Without the ACL grant, the DAO cannot read the balance.

<!-- Speaker notes: Cross-contract ACL is the key new concept in this module. Walk through all four steps carefully. The user must explicitly grant the DAO access -- this is a security feature, not a limitation. Without explicit grants, contracts cannot read each other's encrypted data. This prevents unauthorized access to encrypted balances. Emphasize that this is a one-time operation per user per DAO contract. -->

---

# Weighted Voting (Module 12 vs. Module 19)

| Feature | Module 12 (Simple) | Module 19 (Weighted) |
|---------|-------------------|---------------------|
| Vote weight | 1 per voter | Token balance |
| Token integration | None | Cross-contract ACL |
| Treasury | None | ETH management |
| Execution | View results only | Transfer funds |
| Vote input | `externalEuint8` (0 or 1) | `externalEbool` (true/false) |

The upgrade from simple to weighted voting is the core architectural change.

<!-- Speaker notes: This comparison table shows how the capstone builds on Module 12. The three key upgrades are: token-weighted votes instead of one-per-person, cross-contract ACL for balance reading, and treasury execution that actually transfers ETH. This progression from simple to complex mirrors real DAO development in the wild. -->

---

# Weighted Voting Implementation

```solidity
function vote(uint256 proposalId, externalEbool encryptedVote,
    bytes calldata inputProof) external {
    Proposal storage p = proposals[proposalId];
    require(p.exists, "Proposal does not exist");
    require(block.timestamp >= p.startTime && block.timestamp < p.endTime);
    require(!_hasVoted[proposalId][msg.sender], "Already voted");

    _hasVoted[proposalId][msg.sender] = true;

    // Get voter's token balance as vote weight (cross-contract ACL)
    euint64 weight = governanceToken.balanceOf(msg.sender);

    ebool voteYes = FHE.fromExternal(encryptedVote, inputProof);
    euint64 zero = FHE.asEuint64(0);

    // Route weight to the correct tally
    euint64 yesWeight = FHE.select(voteYes, weight, zero);
    euint64 noWeight  = FHE.select(voteYes, zero, weight);

    p.yesVotes = FHE.add(p.yesVotes, yesWeight);
    p.noVotes  = FHE.add(p.noVotes, noWeight);
    FHE.allowThis(p.yesVotes);
    FHE.allowThis(p.noVotes);
}
```

<!-- Speaker notes: Compare this with Module 12's voting. Instead of adding 1 or 0, we add the user's entire token balance or 0. FHE.select routes the weight to the correct tally based on the encrypted vote. If the user votes Yes, their full balance goes to yesVotes and 0 to noVotes (and vice versa). The token balance is read directly from the governance token contract via cross-contract ACL. Nobody can see how anyone voted or how much weight they contributed. -->

---

# Proposal Data Structure

```solidity
struct Proposal {
    string description;     // Public: what the proposal is about
    address recipient;      // Public: who receives the funds
    uint256 amount;         // Public: how much ETH (plaintext)
    uint256 startTime;      // Public: when voting starts
    uint256 endTime;        // Public: when voting ends
    euint64 yesVotes;       // ENCRYPTED: total yes weight
    euint64 noVotes;        // ENCRYPTED: total no weight
    bool exists;            // Public: lifecycle flag
    bool finalized;         // Public: lifecycle flag
    bool executed;          // Public: lifecycle flag
}

mapping(uint256 => Proposal) public proposals;
mapping(uint256 => mapping(address => bool)) private _hasVoted;
```

The ETH amount is plaintext because it is publicly visible when the proposal is created. Vote tallies are encrypted until finalization.

<!-- Speaker notes: Walk through each field. The plaintext fields (description, recipient, amount, timestamps, flags) are public because they define the proposal. The encrypted fields (yesVotes, noVotes) are the vote tallies that remain hidden until finalization. The _hasVoted mapping prevents double-voting. Note that the ETH amount is intentionally public -- it becomes visible when the proposal is created as part of the transaction data. -->

---

# Proposal Lifecycle

```
Phase 1: CREATE
  - Anyone can create a proposal
  - Specifies: description, recipient, ETH amount
  - Voting period starts immediately
  - yesVotes and noVotes initialized to encrypted zero

Phase 2: VOTE
  - Token holders vote Yes or No (encrypted)
  - Vote weight = token balance at time of vote
  - One vote per address per proposal
  - Tallies accumulate encrypted, invisible to all

Phase 3: FINALIZE
  - Admin finalizes after voting period ends
  - makePubliclyDecryptable(yesVotes) and makePubliclyDecryptable(noVotes)
  - Anyone can now read the results

Phase 4: EXECUTE
  - Admin submits decrypted tallies
  - If yes > no: ETH transferred from treasury to recipient
  - If no >= yes: proposal rejected
```

<!-- Speaker notes: Walk through all four phases. Emphasize that during Phase 2, nobody can see the running tallies. The vote counts are completely hidden. Phase 3 is the key privacy boundary crossing: the admin makes tallies publicly decryptable, and from that point forward anyone can read the results. Phase 4 is a separate step that checks the results and transfers ETH. This separation prevents atomic manipulation. -->

---

# Creating a Proposal

```solidity
function createProposal(
    string calldata description, address recipient, uint256 amount
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
```

Vote tallies start at encrypted zero. `FHE.allowThis()` lets the contract accumulate votes.

<!-- Speaker notes: Proposal creation is mostly plaintext. The description, recipient, and amount are all public. The only FHE operations are initializing yesVotes and noVotes to encrypted zero and granting the contract ACL on them. This is needed so that the vote() function can later call FHE.add on these tallies. The voting period starts immediately and ends after votingDuration seconds. -->

---

# Finalization and Execution

```solidity
function finalize(uint256 proposalId) public onlyAdmin {
    Proposal storage p = proposals[proposalId];
    require(p.exists && block.timestamp >= p.endTime && !p.finalized);

    p.finalized = true;
    FHE.makePubliclyDecryptable(p.yesVotes);  // Cross the privacy boundary
    FHE.makePubliclyDecryptable(p.noVotes);

    emit ProposalFinalized(proposalId);
}

function executeProposal(uint256 proposalId,
    uint64 decryptedYes, uint64 decryptedNo) public onlyAdmin {
    Proposal storage p = proposals[proposalId];
    require(p.finalized && !p.executed);
    require(decryptedYes > decryptedNo, "Proposal not approved");
    require(address(this).balance >= p.amount, "Insufficient treasury");

    p.executed = true;
    payable(p.recipient).transfer(p.amount);

    emit ProposalExecuted(proposalId, p.recipient, p.amount);
}
```

<!-- Speaker notes: Finalization is the key privacy boundary crossing. makePubliclyDecryptable is irreversible -- once called, anyone can see the vote tallies. This is intentional: after voting ends, the results should be public. Execution is a separate step where the admin submits the decrypted values. The require(decryptedYes > decryptedNo) ensures only approved proposals execute. Discuss the trust assumption: the admin provides decrypted values. -->

---

# Treasury Management

```solidity
// Anyone can fund the treasury
receive() external payable {
    emit TreasuryFunded(msg.sender, msg.value);
}

// View treasury balance
function treasuryBalance() public view returns (uint256) {
    return address(this).balance;
}
```

**Design choices:**
- Treasury balance is **public** (ETH balance is always visible on-chain)
- Anyone can fund the treasury by sending ETH
- Only approved proposals can withdraw from the treasury
- Proposal amount is checked against treasury balance at creation time

**Production considerations:** quorum thresholds, proposal amount caps, cooldown periods between proposals to prevent treasury drain attacks.

<!-- Speaker notes: The treasury is straightforward -- it holds ETH and releases it via approved proposals. The key design choice is that the treasury balance is public. This is because ETH balances are always visible on-chain. If you needed a private budget, you could track an encrypted budget value separately. Discuss the security implications: without quorum requirements, a small group could drain the treasury with a series of proposals. -->

---

# Concepts Used from Every Module

| Module | Concept Applied in the DAO |
|--------|---------------------------|
| 03: Encrypted Types | `euint64` for vote tallies, `ebool` for vote direction |
| 04: Operations | `FHE.add()` for tally accumulation |
| 05: ACL | `FHE.allow()`, `FHE.allowThis()`, cross-contract ACL |
| 06: Inputs | `externalEbool` for encrypted vote submission |
| 07: Decryption | `makePubliclyDecryptable()` for finalized tallies |
| 08: Conditional Logic | `FHE.select()` for routing vote weight |
| 10: Frontend | Relayer SDK for encrypted vote creation |
| 11: ERC-20 | Governance token with encrypted balances |
| 12: Voting | Private voting with encrypted tallies |

<!-- Speaker notes: Use this table to help students see how the capstone ties everything together. Each row represents a module concept that appears in the DAO. This is a great review moment -- ask students to identify where each concept appears in the code they have seen. If a student is struggling with any concept, they can review that specific module. -->

---

# Security Considerations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Double-voting with transferred tokens | Inflated vote counts | Snapshot balances at proposal creation (advanced) |
| Admin manipulation of tallies | Fraudulent execution | On-chain decrypt callback (advanced) |
| Treasury drain via many proposals | Loss of funds | Quorum, amount caps, cooldown periods |
| Zero-weight voting | Wasted gas, cluttered records | Check `weight > 0` before accepting vote |
| Stale ACL grants | Vote fails unexpectedly | Re-grant after token transfers |

**The admin cannot:** change votes (encrypted), see individual votes (no ACL), execute rejected proposals (yes > no check enforced).

<!-- Speaker notes: Discuss each security risk honestly. The snapshot problem is the most serious -- if a user votes, transfers tokens to another address, and that address votes, the same tokens are counted twice. Production DAOs solve this with balance snapshots at proposal creation time. Admin manipulation can be mitigated with on-chain decrypt callbacks that verify the submitted values. These are real DAO security considerations that apply to all governance systems. -->

---

# Frontend Architecture

```
Page 1: Dashboard
  - Treasury balance (public ETH)
  - Active proposals list
  - Your token balance (decrypted via userDecryptEuint)

Page 2: Create Proposal
  - Description, recipient address, ETH amount
  - Submit plaintext transaction

Page 3: Proposal Detail
  - Description, status, time remaining
  - Vote Yes/No button (encrypted input)
  - Results displayed after finalization

Page 4: Token Management
  - Grant DAO access (one-time FHE.allow)
  - Transfer governance tokens
  - View your encrypted balance
```

<!-- Speaker notes: The frontend has four pages, each demonstrating different FHEVM interaction patterns. The dashboard reads and decrypts balances using userDecryptEuint. Create Proposal is a standard plaintext transaction. Proposal Detail uses encrypted inputs for voting via createEncryptedInput with addBool. Token Management handles the cross-contract ACL grant, which is a prerequisite for voting. -->

---

# Frontend: Key Interactions

```typescript
// One-time: grant DAO access to read your token balance
await governanceToken.connect(signer).grantDAOAccess(daoAddress);

// Create a proposal (plaintext transaction)
await dao.createProposal("Fund development", recipientAddr, ethAmount);

// Vote with encrypted input
const input = instance.createEncryptedInput(daoAddress, userAddress);
input.addBool(true); // Vote Yes (encrypted)
const encrypted = await input.encrypt();
await dao.vote(proposalId, encrypted.handles[0], encrypted.inputProof);

// Admin: finalize after voting period
await dao.finalize(proposalId);

// Read decrypted results and execute
const [yesHandle, noHandle] = await dao.getProposalResults(proposalId);
// ... decrypt via gateway or userDecryptEuint ...
await dao.executeProposal(proposalId, yesVotes, noVotes);
```

<!-- Speaker notes: Walk through the three key frontend flows. grantDAOAccess is a one-time setup per user. createProposal is a standard transaction with no encryption needed. The vote interaction uses addBool(true) for Yes or addBool(false) for No -- this creates an externalEbool. After finalization, the decrypted tallies can be read and submitted for execution. -->

---

# Testing Strategy

```
Test 1: Token Setup
  - Deploy GovernanceToken, mint to 3 accounts
  - Verify encrypted balances via decrypt

Test 2: DAO Setup
  - Deploy ConfidentialDAO(tokenAddress, votingDuration)
  - Fund treasury with ETH
  - Each user calls grantDAOAccess(daoAddress)

Test 3: Proposal Creation
  - Create proposal with description, recipient, amount
  - Verify proposal fields and existence

Test 4: Voting
  - User A votes Yes (weight: 100 tokens)
  - User B votes No (weight: 50 tokens)
  - User C votes Yes (weight: 75 tokens)
  - Verify _hasVoted prevents double-voting

Test 5: Finalize + Execute
  - Advance time past voting period
  - Finalize: makePubliclyDecryptable on tallies
  - Decrypt: Yes=175, No=50
  - Execute: verify ETH transferred to recipient

Test 6: Rejection
  - Majority votes No --> executeProposal reverts
```

<!-- Speaker notes: The testing strategy follows the full lifecycle. Have students implement these tests step by step. Each step depends on the previous one, so they must be run in order. The final verification -- checking ETH was actually transferred to the recipient -- confirms the entire pipeline works end to end. Test 6 is equally important: verify that rejected proposals cannot be executed. Use hardhat time manipulation to advance past the voting period. -->

---

# Capstone Project Guidelines

**Minimum requirements (passing):**
- Single-contract DAO with unweighted voting (reference: `contracts/ConfidentialDAO.sol`)
- Create proposals, cast encrypted votes, finalize, view results
- Basic tests demonstrating the full lifecycle

**Stretch goals (excellence):**
- Two-contract architecture with GovernanceToken + DAO
- Weighted voting using cross-contract ACL
- Treasury execution with ETH transfers
- Frontend with all four pages
- Comprehensive test suite including edge cases and rejections

**Evaluation criteria:**
- Correct FHE usage (operations, ACL, inputs, decryption)
- No information leaks (no branching on encrypted conditions)
- Code quality and documentation
- Test coverage

<!-- Speaker notes: Be clear about expectations. The minimum is a working single-contract DAO -- this is achievable for all students. The stretch goals are for students who want to demonstrate deeper understanding. The two-contract architecture with weighted voting is significantly harder due to cross-contract ACL. Encourage students to start with the minimum and extend incrementally. -->

---

# What You Have Accomplished

After completing this bootcamp, you can:

- Declare and use **encrypted types** (`euint8` through `euint256`, `ebool`, `eaddress`)
- Perform **FHE arithmetic, comparison, and bitwise operations** on encrypted data
- Manage **ACL permissions** with `FHE.allow()`, `FHE.allowThis()`, cross-contract grants
- Handle **encrypted inputs** from frontends with `FHE.fromExternal()`
- Request **decryption** via `makePubliclyDecryptable()` and user-side decrypt
- Use **conditional logic** with `FHE.select()` instead of branching
- Build **real applications**: tokens, voting, auctions, lending, order books, DAOs
- Apply **security patterns**: LastError, bounded loops, input validation
- Optimize for **gas efficiency** in FHE contracts
- Integrate with **React frontends** using the Relayer SDK

<!-- Speaker notes: This is the achievement slide. Read through each bullet point slowly. Students started with basic Solidity and now can build complete confidential applications. These are real, deployable applications -- not toy examples. Acknowledge the effort it took to get here. Each bullet represents a module's worth of learning. -->

---

# Beyond the Bootcamp

**Build:** Start your own confidential dApp project immediately while knowledge is fresh.

**Contribute:** Zama's open-source ecosystem welcomes contributions -- fhEVM, libraries, tooling.

**Explore:**
- Encrypted NFTs with hidden metadata
- Private DEX with encrypted AMM reserves
- Confidential identity and credential systems
- Cross-chain FHE protocols

**Connect:** Join the Zama developer community for support and collaboration.

**Congratulations on completing the FHEVM Bootcamp!**

<!-- Speaker notes: End on an inspiring note. Encourage students to start building their own projects immediately. Share links to Zama's Discord, GitHub, and documentation. Emphasize that FHE on blockchain is a rapidly evolving field -- the students are among the earliest builders. Their skills are rare and valuable. Thank everyone for their time, effort, and participation throughout the bootcamp. -->
