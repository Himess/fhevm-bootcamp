// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint8, externalEuint8, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Exercise 12: Build a Confidential Voting System
/// @notice Implement encrypted vote tallying with time-bounded proposals and reveal mechanism
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

    /// TODO 1: Create a new proposal
    /// - Set proposal description
    /// - Set deadline = block.timestamp + duration
    /// - Set revealed = false
    /// - Initialize yesVotes and noVotes to FHE.asEuint32(0)
    /// - FHE.allowThis() for both tallies
    /// - Emit ProposalCreated event with id, description, and deadline
    function createProposal(
        string calldata description,
        uint256 duration
    ) external onlyOwner {
        uint256 id = proposalCount++;

        // YOUR CODE HERE
    }

    /// TODO 2: Cast an encrypted vote (1 = yes, 0 = no)
    /// - Require proposalId < proposalCount ("Invalid proposal")
    /// - Require block.timestamp <= deadline ("Voting ended")
    /// - Require voter has not already voted ("Already voted")
    /// - Mark voter as having voted
    /// - Convert encVote using FHE.fromExternal(encVote, inputProof)
    /// - Compare with 1: ebool isYes = FHE.eq(voteValue, FHE.asEuint8(1))
    /// - Create oneVote = FHE.asEuint32(1) and zeroVote = FHE.asEuint32(0)
    /// - Use FHE.select(isYes, oneVote, zeroVote) for yes increment
    /// - Use FHE.select(isYes, zeroVote, oneVote) for no increment
    /// - Add increments to tallies using FHE.add()
    /// - FHE.allowThis() for both updated tallies
    /// - Emit VoteCast event
    function vote(uint256 proposalId, externalEuint8 encVote, bytes calldata inputProof) external {
        // YOUR CODE HERE
    }

    /// @notice Returns the encrypted yes vote tally for a proposal
    function getYesVotes(uint256 proposalId) external view returns (euint32) {
        return proposals[proposalId].yesVotes;
    }

    /// @notice Returns the encrypted no vote tally for a proposal
    function getNoVotes(uint256 proposalId) external view returns (euint32) {
        return proposals[proposalId].noVotes;
    }

    /// @notice Checks whether voting has ended for a proposal
    function isVotingEnded(uint256 proposalId) external view returns (bool) {
        return block.timestamp > proposals[proposalId].deadline;
    }
}
