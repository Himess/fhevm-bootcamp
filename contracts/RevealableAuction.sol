// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint64, eaddress, ebool, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title RevealableAuction - Module 07: Sealed-bid auction with public reveal
/// @notice Bids are encrypted; winner is revealed via makePubliclyDecryptable()
contract RevealableAuction is ZamaEthereumConfig {
    address public owner;
    bool public auctionOpen;
    bool public revealed;

    mapping(address => euint64) private _bids;
    mapping(address => bool) private _hasBid;

    euint64 private _highestBid;
    eaddress private _highestBidder;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        auctionOpen = true;

        _highestBid = FHE.asEuint64(0);
        _highestBidder = FHE.asEaddress(address(0));
        FHE.allowThis(_highestBid);
        FHE.allowThis(_highestBidder);
    }

    /// @notice Submit a sealed bid
    function submitBid(externalEuint64 encryptedBid, bytes calldata inputProof) external {
        require(auctionOpen, "Auction closed");
        require(!_hasBid[msg.sender], "Already bid");

        euint64 bid = FHE.fromExternal(encryptedBid, inputProof);
        _bids[msg.sender] = bid;
        _hasBid[msg.sender] = true;

        ebool isHigher = FHE.gt(bid, _highestBid);
        _highestBid = FHE.select(isHigher, bid, _highestBid);
        _highestBidder = FHE.select(isHigher, FHE.asEaddress(msg.sender), _highestBidder);

        FHE.allowThis(_bids[msg.sender]);
        FHE.allow(_bids[msg.sender], msg.sender);
        FHE.allowThis(_highestBid);
        FHE.allowThis(_highestBidder);
    }

    /// @notice Close the auction (owner only)
    function closeAuction() public onlyOwner {
        require(auctionOpen, "Already closed");
        auctionOpen = false;
    }

    /// @notice Reveal the winning bid publicly
    function revealWinner() public onlyOwner {
        require(!auctionOpen, "Close auction first");
        require(!revealed, "Already revealed");

        FHE.makePubliclyDecryptable(_highestBid);
        FHE.makePubliclyDecryptable(_highestBidder);
        FHE.allow(_highestBid, msg.sender);
        revealed = true;
    }

    /// @notice Get own bid handle (ACL-protected)
    function getMyBid() public view returns (euint64) {
        require(_hasBid[msg.sender], "No bid placed");
        require(FHE.isSenderAllowed(_bids[msg.sender]), "Not authorized");
        return _bids[msg.sender];
    }

    /// @notice Get highest bid handle (only after reveal)
    function getHighestBid() public view returns (euint64) {
        require(revealed, "Not revealed yet");
        return _highestBid;
    }

    /// @notice Check if an address has bid
    function hasBid(address bidder) public view returns (bool) {
        return _hasBid[bidder];
    }
}
