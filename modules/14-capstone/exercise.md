# Module 14: Exercise -- Build a Confidential DAO

## Objective

Build a complete Confidential DAO system consisting of a governance token and a DAO contract with weighted encrypted voting, treasury management, and proposal execution.

---

## Overview

You will build two contracts:
1. **GovernanceToken** -- A confidential ERC-20 with cross-contract ACL support
2. **ConfidentialDAO** -- The main DAO contract with proposals, voting, and treasury

---

## Task 1: GovernanceToken

Extend the ConfidentialERC20 from Module 11 with DAO access support.

### Starter Code

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, ebool, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract GovernanceToken is ZamaEthereumConfig {
    string public name;
    string public symbol;
    uint8 public constant decimals = 6;
    uint64 public totalSupply;

    mapping(address => euint64) private _balances;
    mapping(address => bool) private _initialized;

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        owner = msg.sender;
    }

    function _initBalance(address account) internal {
        if (!_initialized[account]) {
            _balances[account] = FHE.asEuint64(0);
            FHE.allowThis(_balances[account]);
            FHE.allow(_balances[account], account);
            _initialized[account] = true;
        }
    }

    function mint(address to, uint64 amount) public onlyOwner {
        _initBalance(to);
        _balances[to] = FHE.add(_balances[to], FHE.asEuint64(amount));
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);
        totalSupply += amount;
    }

    function balanceOf(address account) public view returns (euint64) {
        return _balances[account];
    }

    function grantDAOAccess(address dao) public {
        // TODO: Require that msg.sender has been initialized
        // TODO: FHE.allow(_balances[msg.sender], dao) to grant the DAO contract read access
    }

    function transfer(address to, externalEuint64 encryptedAmount, bytes calldata inputProof) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        _transfer(msg.sender, to, amount);
    }

    function _transfer(address from, address to, euint64 amount) internal {
        _initBalance(from);
        _initBalance(to);

        // TODO: No-revert pattern (from Module 11)
        // TODO: Check balance >= amount
        // TODO: FHE.select for transfer amount
        // TODO: Update both balances
        // TODO: ACL for both from and to
    }
}
```

---

## Task 2: ConfidentialDAO

### Starter Code

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
        uint256 amount;
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

    event ProposalCreated(uint256 indexed proposalId, string description, address recipient, uint256 amount);
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

    receive() external payable {
        emit TreasuryFunded(msg.sender, msg.value);
    }

    function createProposal(
        string calldata description,
        address recipient,
        uint256 amount
    ) public returns (uint256) {
        uint256 proposalId = proposalCount++;

        // TODO: Set all proposal fields
        // TODO: Initialize yesVotes and noVotes to encrypted 0
        // TODO: Set startTime = block.timestamp, endTime = block.timestamp + votingDuration
        // TODO: FHE.allowThis() for both tallies
        // TODO: Emit ProposalCreated event

        return proposalId;
    }

    function vote(uint256 proposalId, externalEbool encryptedVote, bytes calldata inputProof) external {
        Proposal storage p = proposals[proposalId];

        // TODO: Validate: exists, active period, not already voted
        // TODO: Mark as voted

        // TODO: Get voter's token balance from governanceToken.balanceOf(msg.sender)
        // TODO: Convert encryptedVote with FHE.fromExternal(encryptedVote, inputProof)

        // TODO: Weighted vote:
        //   yesWeight = FHE.select(voteYes, weight, zero)
        //   noWeight = FHE.select(voteYes, zero, weight)
        // TODO: Add weights to tallies
        // TODO: FHE.allowThis() for both tallies
        // TODO: Emit VoteCast event
    }

    function finalize(uint256 proposalId) public onlyAdmin {
        Proposal storage p = proposals[proposalId];

        // TODO: Validate: exists, voting ended, not finalized
        // TODO: Set finalized = true
        // TODO: Mark both tallies as publicly decryptable using FHE.makePubliclyDecryptable()
        // TODO: Emit ProposalFinalized event
    }

    function executeProposal(
        uint256 proposalId,
        uint64 decryptedYes,
        uint64 decryptedNo
    ) public onlyAdmin {
        Proposal storage p = proposals[proposalId];

        // TODO: Require finalized and not executed
        // TODO: Require decryptedYes > decryptedNo (proposal approved)
        // TODO: Require treasury has enough ETH
        // TODO: Set executed = true
        // TODO: Transfer ETH to recipient
        // TODO: Emit ProposalExecuted event
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

## Step-by-Step Instructions

### Step 1: GovernanceToken

1. Implement `grantDAOAccess()` -- one line: `FHE.allow(_balances[msg.sender], dao)`
2. Implement `_transfer()` using the no-revert pattern from Module 11

### Step 2: ConfidentialDAO - createProposal

1. Set all proposal struct fields
2. Initialize encrypted tallies to 0
3. Set timing (start = now, end = now + duration)

### Step 3: ConfidentialDAO - vote

This is the most complex function:
1. Validate state (exists, active, not voted)
2. Read voter's token balance from the governance token
3. Convert the encrypted vote
4. Use `FHE.select()` to compute weighted yes/no
5. Add to tallies

### Step 4: ConfidentialDAO - finalize

1. Validate timing
2. Make tallies publicly decryptable

### Step 5: ConfidentialDAO - executeProposal

1. Check approval (yes > no)
2. Transfer ETH

---

## Hints

<details>
<summary>Hint 1: grantDAOAccess</summary>

```solidity
function grantDAOAccess(address dao) public {
    require(_initialized[msg.sender], "No balance");
    FHE.allow(_balances[msg.sender], dao);
}
```
</details>

<details>
<summary>Hint 2: vote function</summary>

```solidity
function vote(uint256 proposalId, externalEbool encryptedVote, bytes calldata inputProof) external {
    Proposal storage p = proposals[proposalId];
    require(p.exists, "No proposal");
    require(block.timestamp >= p.startTime, "Not started");
    require(block.timestamp < p.endTime, "Ended");
    require(!_hasVoted[proposalId][msg.sender], "Already voted");

    _hasVoted[proposalId][msg.sender] = true;

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
```
</details>

<details>
<summary>Hint 3: executeProposal</summary>

```solidity
function executeProposal(
    uint256 proposalId,
    uint64 decryptedYes,
    uint64 decryptedNo
) public onlyAdmin {
    Proposal storage p = proposals[proposalId];
    require(p.finalized, "Not finalized");
    require(!p.executed, "Already executed");
    require(decryptedYes > decryptedNo, "Not approved");
    require(address(this).balance >= p.amount, "Insufficient treasury");

    p.executed = true;
    payable(p.recipient).transfer(p.amount);

    emit ProposalExecuted(proposalId, p.recipient, p.amount);
}
```
</details>

---

## Bonus Challenges

1. **Quorum requirement:** Add a minimum total vote weight required for a proposal to be valid. After decryption, check that `yesVotes + noVotes >= quorum`.

2. **Proposal threshold:** Require that a proposer holds a minimum number of governance tokens to create a proposal.

3. **Timelock execution:** Add a delay between finalization and execution, allowing the community to react.

4. **Multiple proposals:** Allow multiple proposals to be active simultaneously with independent voting.

5. **Frontend:** Build a full React frontend with:
   - Wallet connection
   - Token balance display (decrypted)
   - Proposal creation form
   - Voting interface
   - Results display after finalization

---

## Success Criteria

- [ ] GovernanceToken compiles and supports minting, transfers, and DAO access grants
- [ ] ConfidentialDAO compiles and accepts proposals
- [ ] Weighted voting works using `FHE.select()` with token balances
- [ ] Duplicate voting is prevented
- [ ] Time-bounded voting works correctly
- [ ] Finalization makes tallies publicly decryptable
- [ ] Execution transfers ETH only for approved proposals
- [ ] All encrypted values have proper ACL calls
- [ ] Events are emitted at each lifecycle stage
- [ ] Treasury funding and balance checking work correctly
