// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint64, externalEuint64, ebool, eaddress } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title SealedBidAuction - Module 13: Encrypted sealed-bid auction
/// @notice Bids are encrypted using FHE. The highest bid is tracked with encrypted comparison.
///         Uses eaddress to privately track the highest bidder.
///         ETH deposits are required to prevent spam bidding.
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

    // Finalization results (public after reveal)
    mapping(uint256 => address) public winner;
    mapping(uint256 => uint64) public winningBidAmount;

    uint256 public auctionCount;
    address public owner;

    event AuctionCreated(uint256 indexed auctionId, string item, uint256 deadline, uint64 reservePrice);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder);
    event AuctionEnded(uint256 indexed auctionId);
    event AuctionFinalized(uint256 indexed auctionId, address winner, uint64 winningBid);
    event DepositWithdrawn(uint256 indexed auctionId, address indexed bidder, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Create a new auction with a reserve price
    function createAuction(string calldata item, uint256 duration, uint64 reservePrice) external onlyOwner {
        uint256 id = auctionCount++;
        auctions[id].item = item;
        auctions[id].deadline = block.timestamp + duration;
        auctions[id].reservePrice = reservePrice;
        _highestBid[id] = FHE.asEuint64(0);
        FHE.allowThis(_highestBid[id]);

        _highestBidder[id] = FHE.asEaddress(address(0));
        FHE.allowThis(_highestBidder[id]);

        emit AuctionCreated(id, item, auctions[id].deadline, reservePrice);
    }

    /// @notice Place an encrypted bid with ETH deposit
    /// @param auctionId The auction to bid on
    /// @param encBid The encrypted bid amount
    /// @param inputProof The proof for the encrypted input
    function bid(uint256 auctionId, externalEuint64 encBid, bytes calldata inputProof) external payable {
        require(auctionId < auctionCount, "Invalid auction");
        require(block.timestamp <= auctions[auctionId].deadline, "Bidding ended");
        require(!auctions[auctionId].ended, "Auction ended");
        require(!hasBid[auctionId][msg.sender], "Already bid");
        require(msg.value > 0, "Must deposit ETH");

        euint64 newBid = FHE.fromExternal(encBid, inputProof);

        // Store the bid
        _bids[auctionId][msg.sender] = newBid;
        FHE.allowThis(_bids[auctionId][msg.sender]);
        FHE.allow(_bids[auctionId][msg.sender], msg.sender);

        // Track ETH deposit
        deposits[auctionId][msg.sender] = msg.value;

        // Update highest bid using encrypted select
        ebool isHigher = FHE.gt(newBid, _highestBid[auctionId]);
        _highestBid[auctionId] = FHE.select(isHigher, newBid, _highestBid[auctionId]);
        FHE.allowThis(_highestBid[auctionId]);

        // Update highest bidder using eaddress select
        _highestBidder[auctionId] = FHE.select(isHigher, FHE.asEaddress(msg.sender), _highestBidder[auctionId]);
        FHE.allowThis(_highestBidder[auctionId]);

        hasBid[auctionId][msg.sender] = true;
        auctions[auctionId].bidders.push(msg.sender);

        emit BidPlaced(auctionId, msg.sender);
    }

    /// @notice End the auction (only after deadline)
    function endAuction(uint256 auctionId) external onlyOwner {
        require(auctionId < auctionCount, "Invalid auction");
        require(block.timestamp > auctions[auctionId].deadline, "Not yet ended");
        require(!auctions[auctionId].ended, "Already ended");

        auctions[auctionId].ended = true;

        // Make highest bid publicly decryptable for result reveal
        FHE.makePubliclyDecryptable(_highestBid[auctionId]);
        FHE.makePubliclyDecryptable(_highestBidder[auctionId]);

        emit AuctionEnded(auctionId);
    }

    /// @notice Finalize the auction by setting the winner after off-chain decryption
    /// @dev fhEVM v0.9+ flow (Gateway was discontinued): after endAuction() marks values as
    ///      publicly decryptable, admin calls publicDecrypt() off-chain via the relayer SDK
    ///      to retrieve _highestBidder and _highestBid, then submits them here.
    ///      Use FHE.checkSignatures() to verify decrypted results on-chain if needed.
    function finalizeAuction(uint256 auctionId, address winnerAddress, uint64 winningBid) external onlyOwner {
        require(auctionId < auctionCount, "Invalid auction");
        require(auctions[auctionId].ended, "Auction not ended");
        require(!auctions[auctionId].finalized, "Already finalized");

        auctions[auctionId].finalized = true;
        winner[auctionId] = winnerAddress;
        winningBidAmount[auctionId] = winningBid;

        emit AuctionFinalized(auctionId, winnerAddress, winningBid);
    }

    /// @notice Withdraw ETH deposit (non-winners only, after auction is finalized)
    function withdrawDeposit(uint256 auctionId) external {
        require(auctions[auctionId].finalized, "Auction not finalized");
        require(msg.sender != winner[auctionId], "Winner cannot withdraw");
        uint256 amount = deposits[auctionId][msg.sender];
        require(amount > 0, "No deposit");

        deposits[auctionId][msg.sender] = 0;
        (bool sent, ) = payable(msg.sender).call{ value: amount }("");
        require(sent, "Transfer failed");
        emit DepositWithdrawn(auctionId, msg.sender, amount);
    }

    /// @notice Get the encrypted highest bid handle
    function getHighestBid(uint256 auctionId) external view returns (euint64) {
        return _highestBid[auctionId];
    }

    /// @notice Get a bidder's own encrypted bid handle
    function getMyBid(uint256 auctionId) external view returns (euint64) {
        return _bids[auctionId][msg.sender];
    }

    /// @notice Get number of bidders
    function getBidderCount(uint256 auctionId) external view returns (uint256) {
        return auctions[auctionId].bidders.length;
    }

    /// @notice Get the encrypted highest bidder handle (eaddress)
    function getHighestBidder(uint256 auctionId) external view returns (eaddress) {
        return _highestBidder[auctionId];
    }
}
