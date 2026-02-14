// SOLUTION: Module 14 - Capstone Confidential DAO
// Complete implementation matching the exercise architecture.

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, ebool, externalEuint64, externalEbool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

// ============================================================
// PART 1: GovernanceToken
// ============================================================

/// @title Solution 14 (Part 1): Governance Token
/// @notice A confidential ERC-20 token with DAO access support for weighted voting
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

    /// @dev Initializes an account's encrypted balance to 0 if not already initialized
    function _initBalance(address account) internal {
        if (!_initialized[account]) {
            _balances[account] = FHE.asEuint64(0);
            FHE.allowThis(_balances[account]);
            FHE.allow(_balances[account], account);
            _initialized[account] = true;
        }
    }

    /// @notice Mint tokens to an address (owner only, plaintext amount)
    function mint(address to, uint64 amount) public onlyOwner {
        _initBalance(to);
        _balances[to] = FHE.add(_balances[to], FHE.asEuint64(amount));
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);
        totalSupply += amount;
    }

    /// @notice Returns the encrypted balance of an account
    function balanceOf(address account) public view returns (euint64) {
        return _balances[account];
    }

    /// SOLUTION TODO 1: Grant a DAO contract read access to the caller's encrypted balance
    function grantDAOAccess(address dao) public {
        require(_initialized[msg.sender], "No balance");
        FHE.allow(_balances[msg.sender], dao);
    }

    /// @notice Transfer tokens to another address
    function transfer(address to, externalEuint64 encryptedAmount, bytes calldata inputProof) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        _transfer(msg.sender, to, amount);
    }

    /// SOLUTION TODO 2: Internal transfer using the no-revert pattern
    function _transfer(address from, address to, euint64 amount) internal {
        _initBalance(from);
        _initBalance(to);

        ebool hasEnough = FHE.ge(_balances[from], amount);
        euint64 transferAmount = FHE.select(hasEnough, amount, FHE.asEuint64(0));

        _balances[from] = FHE.sub(_balances[from], transferAmount);
        _balances[to] = FHE.add(_balances[to], transferAmount);

        FHE.allowThis(_balances[from]);
        FHE.allow(_balances[from], from);
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);
    }
}

// ============================================================
// PART 2: ConfidentialDAO
// ============================================================

interface IGovernanceToken {
    function balanceOf(address account) external view returns (euint64);
}

/// @title Solution 14 (Part 2): Confidential DAO
/// @notice Proposals, weighted encrypted voting, treasury management, and execution
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

    /// @notice Accept ETH deposits to fund the treasury
    receive() external payable {
        emit TreasuryFunded(msg.sender, msg.value);
    }

    /// SOLUTION TODO 3: Create a new proposal
    function createProposal(
        string calldata description,
        address recipient,
        uint256 amount
    ) public returns (uint256) {
        uint256 proposalId = proposalCount++;

        Proposal storage p = proposals[proposalId];
        p.description = description;
        p.recipient = recipient;
        p.amount = amount;
        p.startTime = block.timestamp;
        p.endTime = block.timestamp + votingDuration;
        p.exists = true;
        p.finalized = false;
        p.executed = false;

        p.yesVotes = FHE.asEuint64(0);
        p.noVotes = FHE.asEuint64(0);
        FHE.allowThis(p.yesVotes);
        FHE.allowThis(p.noVotes);

        emit ProposalCreated(proposalId, description, recipient, amount);

        return proposalId;
    }

    /// SOLUTION TODO 4: Cast a weighted encrypted vote
    function vote(uint256 proposalId, externalEbool encryptedVote, bytes calldata inputProof) external {
        Proposal storage p = proposals[proposalId];

        require(p.exists, "Proposal does not exist");
        require(block.timestamp >= p.startTime && block.timestamp < p.endTime, "Voting not active");
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

    /// SOLUTION TODO 5: Finalize a proposal after voting ends (admin only)
    function finalize(uint256 proposalId) public onlyAdmin {
        Proposal storage p = proposals[proposalId];

        require(p.exists, "Proposal does not exist");
        require(block.timestamp >= p.endTime, "Voting not ended");
        require(!p.finalized, "Already finalized");

        p.finalized = true;

        FHE.allow(p.yesVotes, admin);
        FHE.allow(p.noVotes, admin);

        emit ProposalFinalized(proposalId);
    }

    /// SOLUTION TODO 6: Execute an approved proposal (admin only)
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

    /// @notice Returns encrypted vote tallies for a finalized proposal
    function getProposalResults(uint256 proposalId) public view returns (euint64, euint64) {
        Proposal storage p = proposals[proposalId];
        require(p.finalized, "Not finalized");
        return (p.yesVotes, p.noVotes);
    }

    /// @notice Check if an address has voted on a proposal
    function hasVoted(uint256 proposalId, address voter) public view returns (bool) {
        return _hasVoted[proposalId][voter];
    }

    /// @notice Returns the current treasury balance
    function treasuryBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
