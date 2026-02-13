// SOLUTION: Module 12 - Confidential Voting
// This is the complete implementation of the ConfidentialVoting system.

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint8, externalEuint8, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ConfidentialVoting - Module 12: Private on-chain voting
/// @notice Vote tallies are encrypted until reveal. No one can see individual votes.
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

    /// @notice Create a new proposal with a voting deadline
    function createProposal(string calldata description, uint256 duration) external onlyOwner {
        uint256 id = proposalCount++;
        proposals[id].description = description;
        proposals[id].yesVotes = FHE.asEuint32(0);
        proposals[id].noVotes = FHE.asEuint32(0);
        proposals[id].deadline = block.timestamp + duration;

        FHE.allowThis(proposals[id].yesVotes);
        FHE.allowThis(proposals[id].noVotes);

        emit ProposalCreated(id, description, proposals[id].deadline);
    }

    /// @notice Cast an encrypted vote (0 = no, 1 = yes)
    function vote(uint256 proposalId, externalEuint8 encVote, bytes calldata inputProof) external {
        require(proposalId < proposalCount, "Invalid proposal");
        require(block.timestamp <= proposals[proposalId].deadline, "Voting ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        euint8 voteValue = FHE.fromExternal(encVote, inputProof);
        ebool isYes = FHE.eq(voteValue, FHE.asEuint8(1));

        // Increment yes or no tally using select
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
    }

    /// @notice Get encrypted yes vote count (for authorized viewers)
    function getYesVotes(uint256 proposalId) external view returns (euint32) {
        return proposals[proposalId].yesVotes;
    }

    /// @notice Get encrypted no vote count
    function getNoVotes(uint256 proposalId) external view returns (euint32) {
        return proposals[proposalId].noVotes;
    }

    /// @notice Reveal the voting result after the deadline
    /// @dev Makes encrypted tallies publicly decryptable via FHE.makePubliclyDecryptable()
    function revealResult(uint256 proposalId) external onlyOwner {
        require(proposalId < proposalCount, "Invalid proposal");
        require(block.timestamp > proposals[proposalId].deadline, "Voting not ended");
        require(!proposals[proposalId].revealed, "Already revealed");

        proposals[proposalId].revealed = true;

        FHE.makePubliclyDecryptable(proposals[proposalId].yesVotes);
        FHE.makePubliclyDecryptable(proposals[proposalId].noVotes);

        // Note: In production with Gateway, you would use:
        // Gateway.requestDecryption([yesVotes, noVotes], callbackSelector, ...)
        // and handle the result in a callback function.
        // Here we use makePubliclyDecryptable which marks the values for
        // off-chain decryption by anyone via the KMS.
    }

    /// @notice Check if voting deadline has passed
    function isVotingEnded(uint256 proposalId) external view returns (bool) {
        return block.timestamp > proposals[proposalId].deadline;
    }
}
