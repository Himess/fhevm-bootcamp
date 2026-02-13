---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 13: Sealed-Bid Auction"
footer: "Zama Developer Program"
---

# Module 13: Sealed-Bid Auction

Building a privacy-preserving auction with encrypted bids.

---

# The Problem with On-Chain Auctions

```
Alice bids 100 ETH  (visible in mempool)
   --> MEV bot sees it
   --> MEV bot bids 101 ETH
   --> Alice loses, pays more gas
```

- Front-running: bots outbid visible transactions
- Bid sniping: last-second bids based on current highest
- Collusion: bidders coordinate based on visible bids

---

# FHE Solution: Encrypted Bids

```
Alice bids [encrypted]
Bob bids [encrypted]
Carol bids [encrypted]

Contract compares encrypted bids
Nobody knows who is winning
Auction ends -> winner revealed
```

---

# Auction Lifecycle

```
1. Owner calls createAuction(item, duration, reservePrice)
2. Bidding phase:
   - Bidders send encrypted bids + ETH deposit
   - Each bid compared against highest (encrypted)
3. Deadline passes
4. Owner calls endAuction(auctionId)
   - FHE.makePubliclyDecryptable() reveals results
5. Losers call withdrawDeposit(auctionId)
```

---

# Core: Encrypted Bid Comparison

```solidity
euint64 newBid = FHE.fromExternal(encBid, inputProof);

// Is this bid higher than current highest?
ebool isHigher = FHE.gt(newBid, _highestBid[auctionId]);

// Update highest bid
_highestBid[auctionId] = FHE.select(
    isHigher, newBid, _highestBid[auctionId]);

// Update highest bidder (eaddress pattern)
_highestBidder[auctionId] = FHE.select(
    isHigher,
    FHE.asEaddress(msg.sender),
    _highestBidder[auctionId]);
```

---

# The eaddress Pattern

```solidity
eaddress private _highestBidder;

// Create from plaintext address
FHE.asEaddress(msg.sender)

// Select between encrypted addresses
FHE.select(isHigher,
    FHE.asEaddress(msg.sender),
    _highestBidder[auctionId])
```

The winner's identity is encrypted until `endAuction()` is called.

---

# Contract Structure

```solidity
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
    mapping(uint256 => euint64) internal _highestBid;
    mapping(uint256 => eaddress) internal _highestBidder;
    mapping(uint256 => mapping(address => euint64)) internal _bids;
    mapping(uint256 => mapping(address => uint256)) public deposits;
    mapping(uint256 => mapping(address => bool)) public hasBid;
}
```

---

# Creating an Auction

```solidity
function createAuction(
    string calldata item,
    uint256 duration,
    uint64 reservePrice
) external onlyOwner {
    uint256 id = auctionCount++;
    auctions[id].item = item;
    auctions[id].deadline = block.timestamp + duration;
    auctions[id].reservePrice = reservePrice;

    _highestBid[id] = FHE.asEuint64(0);
    FHE.allowThis(_highestBid[id]);
    _highestBidder[id] = FHE.asEaddress(address(0));
    FHE.allowThis(_highestBidder[id]);
}
```

---

# Placing a Bid

```solidity
function bid(
    uint256 auctionId,
    externalEuint64 encBid,
    bytes calldata inputProof
) external payable {
    require(!hasBid[auctionId][msg.sender], "Already bid");
    require(msg.value > 0, "Must deposit ETH");

    euint64 newBid = FHE.fromExternal(encBid, inputProof);
    deposits[auctionId][msg.sender] = msg.value;

    ebool isHigher = FHE.gt(newBid, _highestBid[auctionId]);
    _highestBid[auctionId] = FHE.select(
        isHigher, newBid, _highestBid[auctionId]);
    _highestBidder[auctionId] = FHE.select(
        isHigher,
        FHE.asEaddress(msg.sender),
        _highestBidder[auctionId]);
}
```

---

# Ending the Auction: makePubliclyDecryptable

```solidity
function endAuction(uint256 auctionId) external onlyOwner {
    require(block.timestamp > auctions[auctionId].deadline);
    require(!auctions[auctionId].ended);
    auctions[auctionId].ended = true;

    // No Gateway needed -- public decryption
    FHE.makePubliclyDecryptable(_highestBid[auctionId]);
    FHE.makePubliclyDecryptable(_highestBidder[auctionId]);
}
```

Anyone can read the result once the FHE network processes it.

---

# Deposit Handling

During bidding:
```solidity
require(msg.value > 0, "Must deposit ETH");
deposits[auctionId][msg.sender] = msg.value;
```

After auction ends (losers):
```solidity
function withdrawDeposit(uint256 auctionId) external {
    require(auctions[auctionId].ended);
    require(msg.sender != winner[auctionId]);
    uint256 amount = deposits[auctionId][msg.sender];
    deposits[auctionId][msg.sender] = 0;
    payable(msg.sender).transfer(amount);
}
```

---

# FHE vs. Commit-Reveal

| Feature | Commit-Reveal | FHE Sealed-Bid |
|---------|--------------|----------------|
| Bid hidden during auction | Yes (hash) | Yes (encrypted) |
| Requires reveal phase | **Yes** | **No** |
| Bidder can grief (not reveal) | **Yes** | **No** |
| On-chain comparison | After reveal | **While encrypted** |
| Front-running protection | Partial | **Full** |

---

# Handling Ties

```solidity
// FHE.gt(): equal bids -> false
// First bidder keeps the lead
ebool isHigher = FHE.gt(newBid, _highestBid[auctionId]);

// To prefer later bidder on ties:
ebool isHigherOrEqual = FHE.ge(newBid, _highestBid[auctionId]);
```

---

# Privacy Considerations

| Aspect | Visibility |
|--------|-----------|
| Who bid | Public (address + deposit tx) |
| Bid amounts | **Private** (encrypted) |
| Deposit amounts | Public (ETH transfers visible) |
| Current highest | **Private** during auction |
| Winner | **Private** until endAuction() |
| Final price | Public after makePubliclyDecryptable |

**For max privacy:** Use fixed deposit amounts for all bidders.

---

# Frontend: Placing a Bid

```typescript
const instance = await initFhevm();
const input = instance.createEncryptedInput(
  auctionAddress, userAddress
);
input.add64(myBidAmount);
const encrypted = await input.encrypt();

const tx = await contract.bid(
  auctionId,
  encrypted.handles[0],
  encrypted.inputProof,
  { value: ethers.parseEther("1.0") }
);
await tx.wait();
```

---

# Summary

- FHE sealed-bid auctions eliminate front-running and bid sniping
- `createAuction()` supports multiple auctions with reserve prices
- `bid()` requires ETH deposit + enforces one-bid-per-user
- `FHE.gt()` + `FHE.select()` track highest bid on encrypted data
- `eaddress` + `FHE.asEaddress()` keep the winner encrypted
- `endAuction()` uses `FHE.makePubliclyDecryptable()` (no Gateway)
- `withdrawDeposit()` lets losers reclaim ETH
- Fixed deposits improve privacy

---

# Next Up

**Module 14: Capstone -- Confidential DAO**

Combine tokens, voting, and treasury into a full DAO!
