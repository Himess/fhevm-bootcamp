// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, ebool, externalEuint64, externalEbool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

// ============================================================
// PART 1: GovernanceToken
// ============================================================

/// @title Exercise 14 (Part 1): Governance Token
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

    /// TODO 1: Grant a DAO contract read access to the caller's encrypted balance
    /// - Require that msg.sender has been initialized ("No balance")
    /// - Call FHE.allow(_balances[msg.sender], dao)
    function grantDAOAccess(address dao) public {
        // YOUR CODE HERE
    }

    /// @notice Transfer tokens to another address
    function transfer(address to, externalEuint64 encryptedAmount, bytes calldata inputProof) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        _transfer(msg.sender, to, amount);
    }

    /// TODO 2: Internal transfer using the no-revert pattern (from Module 11)
    /// - Initialize both from and to balances
    /// - Check balance >= amount using FHE.ge()
    /// - Use FHE.select(hasEnough, amount, FHE.asEuint64(0)) for transferAmount
    /// - Subtract transferAmount from sender, add to receiver
    /// - FHE.allowThis() and FHE.allow() for both from and to
    function _transfer(address from, address to, euint64 amount) internal {
        _initBalance(from);
        _initBalance(to);

        // YOUR CODE HERE
    }
}

// ============================================================
// PART 2: ConfidentialDAO
// ============================================================

interface IGovernanceToken {
    function balanceOf(address account) external view returns (euint64);
}

/// @title Exercise 14 (Part 2): Confidential DAO
/// @notice Implement proposals, weighted encrypted voting, treasury management, and execution
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

    /// TODO 3: Create a new proposal
    /// - Set all proposal fields: description, recipient, amount, exists=true, finalized=false, executed=false
    /// - Set startTime = block.timestamp, endTime = block.timestamp + votingDuration
    /// - Initialize yesVotes and noVotes to FHE.asEuint64(0)
    /// - FHE.allowThis() for both tallies
    /// - Emit ProposalCreated event
    /// - Return the proposalId
    function createProposal(
        string calldata description,
        address recipient,
        uint256 amount
    ) public returns (uint256) {
        uint256 proposalId = proposalCount++;

        // YOUR CODE HERE

        return proposalId;
    }

    /// TODO 4: Cast a weighted encrypted vote
    /// - Validate: proposal exists, voting period is active, voter has not already voted
    /// - Mark voter as having voted
    /// - Get voter's token balance: governanceToken.balanceOf(msg.sender) -> euint64 weight
    /// - Convert encrypted vote: FHE.fromExternal(encryptedVote, inputProof) -> ebool voteYes
    /// - Create zero = FHE.asEuint64(0)
    /// - Compute yesWeight = FHE.select(voteYes, weight, zero)
    /// - Compute noWeight = FHE.select(voteYes, zero, weight)
    /// - Add weights to tallies: p.yesVotes = FHE.add(p.yesVotes, yesWeight), same for no
    /// - FHE.allowThis() for both updated tallies
    /// - Emit VoteCast event
    function vote(uint256 proposalId, externalEbool encryptedVote, bytes calldata inputProof) external {
        Proposal storage p = proposals[proposalId];

        // YOUR CODE HERE
    }

    /// TODO 5: Finalize a proposal after voting ends (admin only)
    /// - Validate: proposal exists, voting has ended (block.timestamp >= endTime), not already finalized
    /// - Set finalized = true
    /// - FHE.allow() both tallies (yesVotes, noVotes) for admin to enable decryption
    /// - Emit ProposalFinalized event
    function finalize(uint256 proposalId) public onlyAdmin {
        Proposal storage p = proposals[proposalId];

        // YOUR CODE HERE
    }

    /// TODO 6: Execute an approved proposal (admin only)
    /// - Require finalized and not executed
    /// - Require decryptedYes > decryptedNo ("Not approved")
    /// - Require treasury has enough ETH: address(this).balance >= p.amount ("Insufficient treasury")
    /// - Set executed = true
    /// - Transfer ETH to p.recipient using payable(p.recipient).transfer(p.amount)
    /// - Emit ProposalExecuted event
    function executeProposal(
        uint256 proposalId,
        uint64 decryptedYes,
        uint64 decryptedNo
    ) public onlyAdmin {
        Proposal storage p = proposals[proposalId];

        // YOUR CODE HERE
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
