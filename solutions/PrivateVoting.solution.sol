// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint32, ebool, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title PrivateVoting Solution — Complete encrypted voting implementation
contract PrivateVotingSolution is ZamaEthereumConfig {
    address public owner;
    bool public votingOpen;
    uint8 public candidateCount;

    mapping(address => bool) private _hasVoted;

    euint32 private _tally0;
    euint32 private _tally1;
    euint32 private _tally2;
    euint32 private _tally3;

    event VoteCast(address indexed voter);
    event VotingClosed();

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(uint8 _candidateCount) {
        require(_candidateCount >= 2 && _candidateCount <= 4, "2-4 candidates");
        owner = msg.sender;
        candidateCount = _candidateCount;
        votingOpen = true;

        _tally0 = FHE.asEuint32(0);
        _tally1 = FHE.asEuint32(0);
        _tally2 = FHE.asEuint32(0);
        _tally3 = FHE.asEuint32(0);
        FHE.allowThis(_tally0);
        FHE.allowThis(_tally1);
        FHE.allowThis(_tally2);
        FHE.allowThis(_tally3);
    }

    function vote(externalEuint8 encryptedVote, bytes calldata inputProof) external {
        require(votingOpen, "Voting closed");
        require(!_hasVoted[msg.sender], "Already voted");

        euint8 v = FHE.fromExternal(encryptedVote, inputProof);

        euint32 one = FHE.asEuint32(1);
        euint32 zero = FHE.asEuint32(0);

        ebool is0 = FHE.eq(v, FHE.asEuint8(0));
        _tally0 = FHE.add(_tally0, FHE.select(is0, one, zero));

        ebool is1 = FHE.eq(v, FHE.asEuint8(1));
        _tally1 = FHE.add(_tally1, FHE.select(is1, one, zero));

        ebool is2 = FHE.eq(v, FHE.asEuint8(2));
        _tally2 = FHE.add(_tally2, FHE.select(is2, one, zero));

        ebool is3 = FHE.eq(v, FHE.asEuint8(3));
        _tally3 = FHE.add(_tally3, FHE.select(is3, one, zero));

        _hasVoted[msg.sender] = true;

        FHE.allowThis(_tally0);
        FHE.allowThis(_tally1);
        FHE.allowThis(_tally2);
        FHE.allowThis(_tally3);

        emit VoteCast(msg.sender);
    }

    function closeVoting() public onlyOwner {
        votingOpen = false;
        emit VotingClosed();
    }

    function revealTallies() public onlyOwner {
        require(!votingOpen, "Voting still open");
        FHE.makePubliclyDecryptable(_tally0);
        FHE.allow(_tally0, msg.sender);
        FHE.makePubliclyDecryptable(_tally1);
        FHE.allow(_tally1, msg.sender);
        if (candidateCount > 2) {
            FHE.makePubliclyDecryptable(_tally2);
            FHE.allow(_tally2, msg.sender);
        }
        if (candidateCount > 3) {
            FHE.makePubliclyDecryptable(_tally3);
            FHE.allow(_tally3, msg.sender);
        }
    }

    function getTally(uint8 candidateId) public view returns (euint32) {
        require(!votingOpen, "Voting still open");
        require(candidateId < candidateCount, "Invalid candidate");
        if (candidateId == 0) return _tally0;
        if (candidateId == 1) return _tally1;
        if (candidateId == 2) return _tally2;
        return _tally3;
    }

    function hasVoted(address voter) public view returns (bool) {
        return _hasVoted[voter];
    }
}
