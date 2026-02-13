// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract AuctionSolution is ZamaEthereumConfig {
    address public owner;
    uint256 public deadline;
    bool public ended;

    mapping(address => euint64) private _bids;
    mapping(address => bool) public hasBid;
    euint64 private _highestBid;
    address[] public bidders;

    constructor(uint256 duration) {
        owner = msg.sender;
        deadline = block.timestamp + duration;
        _highestBid = FHE.asEuint64(0);
        FHE.allowThis(_highestBid);
    }

    function placeBid(externalEuint64 encBid, bytes calldata inputProof) external {
        require(block.timestamp <= deadline, "Bidding ended");
        require(!ended, "Auction ended");
        require(!hasBid[msg.sender], "Already bid");

        euint64 newBid = FHE.fromExternal(encBid, inputProof);
        _bids[msg.sender] = newBid;
        FHE.allowThis(_bids[msg.sender]);
        FHE.allow(_bids[msg.sender], msg.sender);

        ebool isHigher = FHE.gt(newBid, _highestBid);
        _highestBid = FHE.select(isHigher, newBid, _highestBid);
        FHE.allowThis(_highestBid);

        hasBid[msg.sender] = true;
        bidders.push(msg.sender);
    }

    function endAuction() external {
        require(msg.sender == owner, "Not owner");
        require(block.timestamp > deadline, "Not yet ended");
        require(!ended, "Already ended");
        ended = true;
    }

    function getMyBid() external view returns (euint64) {
        return _bids[msg.sender];
    }

    function getBidderCount() external view returns (uint256) {
        return bidders.length;
    }
}
