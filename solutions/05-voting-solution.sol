// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint8, externalEuint8, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Solution 5: Private Voting System
contract VotingSolution is ZamaEthereumConfig {
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

    function createProposal(string calldata title) external {
        require(msg.sender == owner, "Not owner");
        Proposal storage p = proposals.push();
        p.title = title;
        p.yesVotes = FHE.asEuint32(0);
        p.noVotes = FHE.asEuint32(0);
        FHE.allowThis(p.yesVotes);
        FHE.allowThis(p.noVotes);
    }

    function vote(uint256 proposalId, externalEuint8 encVote, bytes calldata proof) external {
        require(proposalId < proposals.length, "Invalid proposal");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        euint8 voteValue = FHE.fromExternal(encVote, proof);
        ebool isYes = FHE.eq(voteValue, FHE.asEuint8(1));

        euint32 one = FHE.asEuint32(1);
        euint32 zero = FHE.asEuint32(0);

        proposals[proposalId].yesVotes = FHE.add(
            proposals[proposalId].yesVotes,
            FHE.select(isYes, one, zero)
        );
        proposals[proposalId].noVotes = FHE.add(
            proposals[proposalId].noVotes,
            FHE.select(isYes, zero, one)
        );

        FHE.allowThis(proposals[proposalId].yesVotes);
        FHE.allowThis(proposals[proposalId].noVotes);

        hasVoted[proposalId][msg.sender] = true;
    }
}
