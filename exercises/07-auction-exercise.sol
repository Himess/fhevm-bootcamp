// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Exercise 7: Build a Sealed-Bid Auction
/// @notice Implement an auction where bids are encrypted
contract AuctionExercise is ZamaEthereumConfig {
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

    /// TODO 1: Place an encrypted bid
    /// - Check that bidding is still open
    /// - Convert the external input using FHE.fromExternal()
    /// - Store the bid for the sender
    /// - Update highest bid using FHE.gt() + FHE.select()
    /// - Track bidder in the bidders array
    /// - Set proper ACL
    function placeBid(externalEuint64 encBid, bytes calldata proof) external {
        // YOUR CODE HERE
    }

    /// TODO 2: End the auction (only after deadline, only owner)
    function endAuction() external {
        // YOUR CODE HERE
    }

    /// TODO 3: Get your own encrypted bid
    function getMyBid() external view returns (euint64) {
        // YOUR CODE HERE
    }

    function getBidderCount() external view returns (uint256) {
        return bidders.length;
    }
}
