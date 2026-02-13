# Module 13: Exercise -- Build a Sealed-Bid Auction

## Objective

Implement a `SealedBidAuction` contract where bids are encrypted, the highest bid is tracked using FHE comparisons, and the winner is only revealed after the auction ends via `FHE.makePubliclyDecryptable()`.

---

## Task: SealedBidAuction

### Starter Code

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64, ebool, eaddress} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

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

        // TODO: Initialize _highestBid[id] to encrypted 0
        // TODO: Initialize _highestBidder[id] to encrypted address(0)
        // TODO: FHE.allowThis() for both

        // TODO: Emit AuctionCreated event
    }

    function bid(uint256 auctionId, externalEuint64 encBid, bytes calldata inputProof) external payable {
        // TODO: Require auctionId is valid (< auctionCount)
        // TODO: Require auction deadline has not passed
        // TODO: Require auction has not ended
        // TODO: Require sender has not already bid (hasBid mapping)
        // TODO: Require msg.value > 0 (ETH deposit)

        // TODO: Convert encBid with FHE.fromExternal(encBid, inputProof) -- 2 params
        // TODO: Store bid in _bids mapping with ACL (allowThis + allow for sender)
        // TODO: Store deposit amount in deposits mapping

        // TODO: Compare bid against _highestBid[auctionId] using FHE.gt()
        // TODO: Update _highestBid[auctionId] with FHE.select()
        // TODO: FHE.allowThis() for _highestBid[auctionId]

        // TODO: Update _highestBidder[auctionId] with FHE.select() and FHE.asEaddress(msg.sender)
        // TODO: FHE.allowThis() for _highestBidder[auctionId]

        // TODO: Mark hasBid and push to bidders array
        // TODO: Emit BidPlaced event
    }

    function endAuction(uint256 auctionId) external onlyOwner {
        // TODO: Require auctionId is valid
        // TODO: Require deadline has passed (block.timestamp > deadline)
        // TODO: Require auction has not already ended
        // TODO: Set ended to true

        // TODO: Call FHE.makePubliclyDecryptable() on _highestBid[auctionId]
        // TODO: Call FHE.makePubliclyDecryptable() on _highestBidder[auctionId]

        // TODO: Emit AuctionEnded event
    }

    function withdrawDeposit(uint256 auctionId) external {
        // TODO: Require auction has ended
        // TODO: Require sender is not the winner
        // TODO: Get deposit amount and require > 0
        // TODO: Set deposit to 0 (re-entrancy protection)
        // TODO: Transfer ETH back to sender
        // TODO: Emit DepositWithdrawn event
    }

    function getHighestBid(uint256 auctionId) external view returns (euint64) {
        return _highestBid[auctionId];
    }

    function getMyBid(uint256 auctionId) external view returns (euint64) {
        return _bids[auctionId][msg.sender];
    }

    function getBidderCount(uint256 auctionId) external view returns (uint256) {
        return auctions[auctionId].bidders.length;
    }

    function getHighestBidder(uint256 auctionId) external view returns (eaddress) {
        return _highestBidder[auctionId];
    }
}
```

---

## Step-by-Step Instructions

### Step 1: createAuction

Initialize the encrypted highest bid and bidder for the new auction:
- `_highestBid[id] = FHE.asEuint64(0)`
- `_highestBidder[id] = FHE.asEaddress(address(0))`
- Grant `FHE.allowThis()` for both
- Emit `AuctionCreated` with the auction id, item, deadline, and reservePrice

### Step 2: bid Function

This is the core function:
1. Validate auction id, deadline, duplicate bids, and ETH deposit
2. Convert encrypted input: `FHE.fromExternal(encBid, inputProof)` (2 parameters)
3. Store the bid with ACL and record the deposit
4. Compare with `FHE.gt(newBid, _highestBid[auctionId])`
5. Update `_highestBid` with `FHE.select()`
6. Update `_highestBidder` with `FHE.select(isHigher, FHE.asEaddress(msg.sender), _highestBidder[auctionId])`
7. Update ACL with `FHE.allowThis()` for both

### Step 3: endAuction

- Verify the auction deadline has passed
- Mark auction as ended
- Call `FHE.makePubliclyDecryptable()` on both `_highestBid` and `_highestBidder` (no Gateway needed)

### Step 4: withdrawDeposit

- Only after auction has ended
- Only for non-winners
- Transfer ETH back using `payable(msg.sender).transfer()`
- Zero out the deposit before transferring (re-entrancy protection)

---

## Hints

<details>
<summary>Hint 1: createAuction initialization</summary>

```solidity
_highestBid[id] = FHE.asEuint64(0);
FHE.allowThis(_highestBid[id]);

_highestBidder[id] = FHE.asEaddress(address(0));
FHE.allowThis(_highestBidder[id]);

emit AuctionCreated(id, item, auctions[id].deadline, reservePrice);
```
</details>

<details>
<summary>Hint 2: bid function</summary>

```solidity
function bid(uint256 auctionId, externalEuint64 encBid, bytes calldata inputProof) external payable {
    require(auctionId < auctionCount, "Invalid auction");
    require(block.timestamp <= auctions[auctionId].deadline, "Bidding ended");
    require(!auctions[auctionId].ended, "Auction ended");
    require(!hasBid[auctionId][msg.sender], "Already bid");
    require(msg.value > 0, "Must deposit ETH");

    euint64 newBid = FHE.fromExternal(encBid, inputProof);

    _bids[auctionId][msg.sender] = newBid;
    FHE.allowThis(_bids[auctionId][msg.sender]);
    FHE.allow(_bids[auctionId][msg.sender], msg.sender);

    deposits[auctionId][msg.sender] = msg.value;

    ebool isHigher = FHE.gt(newBid, _highestBid[auctionId]);
    _highestBid[auctionId] = FHE.select(isHigher, newBid, _highestBid[auctionId]);
    FHE.allowThis(_highestBid[auctionId]);

    _highestBidder[auctionId] = FHE.select(
        isHigher,
        FHE.asEaddress(msg.sender),
        _highestBidder[auctionId]
    );
    FHE.allowThis(_highestBidder[auctionId]);

    hasBid[auctionId][msg.sender] = true;
    auctions[auctionId].bidders.push(msg.sender);

    emit BidPlaced(auctionId, msg.sender);
}
```
</details>

<details>
<summary>Hint 3: endAuction function</summary>

```solidity
function endAuction(uint256 auctionId) external onlyOwner {
    require(auctionId < auctionCount, "Invalid auction");
    require(block.timestamp > auctions[auctionId].deadline, "Not yet ended");
    require(!auctions[auctionId].ended, "Already ended");

    auctions[auctionId].ended = true;

    FHE.makePubliclyDecryptable(_highestBid[auctionId]);
    FHE.makePubliclyDecryptable(_highestBidder[auctionId]);

    emit AuctionEnded(auctionId);
}
```
</details>

<details>
<summary>Hint 4: withdrawDeposit function</summary>

```solidity
function withdrawDeposit(uint256 auctionId) external {
    require(auctions[auctionId].ended, "Auction not ended");
    require(msg.sender != winner[auctionId], "Winner cannot withdraw");
    uint256 amount = deposits[auctionId][msg.sender];
    require(amount > 0, "No deposit");

    deposits[auctionId][msg.sender] = 0;
    payable(msg.sender).transfer(amount);
    emit DepositWithdrawn(auctionId, msg.sender, amount);
}
```
</details>

---

## Bonus Challenges

1. **Fixed deposit amount:** Modify the contract so all bidders must deposit exactly the same amount (e.g., 1 ETH). This prevents deposit amounts from leaking bid ranges.

2. **Bid update:** Allow bidders to update their bid (but only increase, never decrease). Track the bid update count to limit updates.

3. **Second-price auction (Vickrey):** Track both the highest and second-highest bids. The winner pays the second-highest price. Requires tracking two encrypted values.

4. **Multi-item auction:** Allow the auction to sell N items to the N highest bidders. Track the top N bids using an encrypted sorting approach.

---

## Success Criteria

- [ ] Contract compiles without errors
- [ ] `createAuction()` initializes encrypted highest bid and bidder with `FHE.asEuint64(0)` and `FHE.asEaddress(address(0))`
- [ ] `bid()` uses `FHE.fromExternal(encBid, inputProof)` with 2 parameters
- [ ] Bids are compared with `FHE.gt()` and updated with `FHE.select()`
- [ ] Highest bidder uses `FHE.select(isHigher, FHE.asEaddress(msg.sender), _highestBidder[auctionId])`
- [ ] One bid per address per auction is enforced
- [ ] ETH deposit is required with each bid
- [ ] `endAuction()` calls `FHE.makePubliclyDecryptable()` on both highest bid and bidder
- [ ] Losers can withdraw deposits after auction ends via `withdrawDeposit(auctionId)`
- [ ] Winner cannot withdraw their deposit
