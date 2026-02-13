// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64, ebool, eaddress} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Exercise 13: Build a Sealed-Bid Auction
/// @notice Implement a multi-auction contract with encrypted bids, ETH deposits,
///         and winner reveal via FHE.makePubliclyDecryptable()
contract SealedBidAuction is ZamaEthereumConfig {
    struct Auction {
        string item;
        uint256 deadline;
        uint64 reservePrice;
        bool ended;
        bool finalized;
        address[] bidders;
    }

    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => mapping(address => euint64)) internal _bids;
    mapping(uint256 => mapping(address => bool)) public hasBid;
    mapping(uint256 => mapping(address => uint256)) public deposits;
    mapping(uint256 => euint64) internal _highestBid;
    mapping(uint256 => eaddress) internal _highestBidder;

    mapping(uint256 => address) public winner;
    mapping(uint256 => uint64) public winningBidAmount;

    uint256 public auctionCount;
    address public owner;

    event AuctionCreated(uint256 indexed auctionId, string item, uint256 deadline, uint64 reservePrice);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder);
    event AuctionEnded(uint256 indexed auctionId);
    event DepositWithdrawn(uint256 indexed auctionId, address indexed bidder, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// TODO 1: Create a new auction
    /// - Set auction fields: item, deadline (block.timestamp + duration), reservePrice, ended=false, finalized=false
    /// - Initialize _highestBid[id] to FHE.asEuint64(0)
    /// - Initialize _highestBidder[id] to FHE.asEaddress(address(0))
    /// - FHE.allowThis() for both
    /// - Emit AuctionCreated event with id, item, deadline, and reservePrice
    function createAuction(
        string calldata item,
        uint256 duration,
        uint64 reservePrice
    ) external onlyOwner {
        uint256 id = auctionCount++;
        auctions[id].item = item;
        auctions[id].deadline = block.timestamp + duration;
        auctions[id].reservePrice = reservePrice;
        auctions[id].ended = false;
        auctions[id].finalized = false;

        // YOUR CODE HERE
    }

    /// TODO 2: Place an encrypted bid with an ETH deposit
    /// - Require auctionId < auctionCount ("Invalid auction")
    /// - Require block.timestamp <= deadline ("Bidding ended")
    /// - Require auction has not ended ("Auction ended")
    /// - Require sender has not already bid ("Already bid")
    /// - Require msg.value > 0 ("Must deposit ETH")
    /// - Convert encBid with FHE.fromExternal(encBid, inputProof)
    /// - Store bid in _bids mapping
    /// - FHE.allowThis() and FHE.allow(sender) for the stored bid
    /// - Store deposit amount in deposits mapping
    /// - Compare new bid against _highestBid using FHE.gt()
    /// - Update _highestBid with FHE.select(isHigher, newBid, _highestBid)
    /// - FHE.allowThis() for _highestBid
    /// - Update _highestBidder with FHE.select(isHigher, FHE.asEaddress(msg.sender), _highestBidder)
    /// - FHE.allowThis() for _highestBidder
    /// - Mark hasBid and push to bidders array
    /// - Emit BidPlaced event
    function bid(uint256 auctionId, externalEuint64 encBid, bytes calldata inputProof) external payable {
        // YOUR CODE HERE
    }

    /// TODO 3: End an auction after the deadline (owner only)
    /// - Require auctionId < auctionCount ("Invalid auction")
    /// - Require block.timestamp > deadline ("Not yet ended")
    /// - Require auction has not already ended ("Already ended")
    /// - Set ended = true
    /// - Call FHE.makePubliclyDecryptable() on _highestBid[auctionId]
    /// - Call FHE.makePubliclyDecryptable() on _highestBidder[auctionId]
    /// - Emit AuctionEnded event
    function endAuction(uint256 auctionId) external onlyOwner {
        // YOUR CODE HERE
    }

    /// TODO 4: Withdraw deposit after auction ends (non-winners only)
    /// - Require auction has ended ("Auction not ended")
    /// - Require msg.sender is not the winner ("Winner cannot withdraw")
    /// - Get deposit amount and require > 0 ("No deposit")
    /// - Set deposit to 0 before transfer (re-entrancy protection)
    /// - Transfer ETH back to sender using payable(msg.sender).transfer()
    /// - Emit DepositWithdrawn event
    function withdrawDeposit(uint256 auctionId) external {
        // YOUR CODE HERE
    }

    /// @notice Returns the encrypted highest bid for an auction
    function getHighestBid(uint256 auctionId) external view returns (euint64) {
        return _highestBid[auctionId];
    }

    /// @notice Returns the caller's encrypted bid for an auction
    function getMyBid(uint256 auctionId) external view returns (euint64) {
        return _bids[auctionId][msg.sender];
    }

    /// @notice Returns the number of bidders for an auction
    function getBidderCount(uint256 auctionId) external view returns (uint256) {
        return auctions[auctionId].bidders.length;
    }

    /// @notice Returns the encrypted highest bidder address for an auction
    function getHighestBidder(uint256 auctionId) external view returns (eaddress) {
        return _highestBidder[auctionId];
    }
}
