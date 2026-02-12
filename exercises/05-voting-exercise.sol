// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint8, externalEuint8, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Exercise 5: Build a Private Voting System
/// @notice Implement encrypted vote tallying
contract VotingExercise is ZamaEthereumConfig {
    struct Proposal {
        string title;
        euint32 yesVotes;
        euint32 noVotes;
    }

    Proposal[] public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    /// TODO 1: Create a new proposal
    /// - Initialize yesVotes and noVotes as FHE.asEuint32(0)
    /// - Set ACL on both with FHE.allowThis()
    function createProposal(string calldata title) external {
        require(msg.sender == owner, "Not owner");
        // YOUR CODE HERE
    }

    /// TODO 2: Cast an encrypted vote (1 = yes, 0 = no)
    /// - Prevent double voting
    /// - Use FHE.eq() to check if vote is yes
    /// - Use FHE.select() to add 1 to yes or no
    /// - Update ACL
    function vote(uint256 proposalId, externalEuint8 encVote, bytes calldata proof) external {
        require(proposalId < proposals.length, "Invalid proposal");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        // YOUR CODE HERE
    }
}
