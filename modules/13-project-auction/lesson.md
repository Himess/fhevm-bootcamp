# Module 13: Sealed-Bid Auction -- Lesson

## Introduction

Auctions on public blockchains suffer from a fundamental problem: **all bids are visible**. This enables:
- **Front-running:** MEV bots can see a bid in the mempool and outbid it
- **Bid sniping:** Waiting until the last second to bid just above the current highest
- **Collusion:** Bidders can coordinate based on visible bid history

A sealed-bid auction using FHEVM solves these problems by keeping all bids encrypted until the auction ends.

---

## 1. Auction Design

```
Auction Lifecycle:
1. Owner creates auction (item, duration, reserve price) via createAuction()
2. Bidding phase: bidders submit encrypted bids + ETH deposit
3. Each bid is compared against current highest (encrypted)
4. Bidding phase ends (deadline passes)
5. Owner calls endAuction() -- uses FHE.makePubliclyDecryptable()
6. Winner and winning bid are revealed on-chain
7. Losers call withdrawDeposit() to reclaim ETH
```

---

## 2. Key Design Decisions

### Multi-Auction Support

The contract supports multiple auctions via an `auctionId` system. Each auction has its own state stored in mappings:

```solidity
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
```

### ETH Deposits

Bidders must deposit ETH along with their encrypted bid. The deposit must be at least as large as the maximum possible bid. This ensures the winner can actually pay.

**Alternative:** Use a fixed deposit amount for all bidders, then settle the difference after the auction. This provides better privacy (deposit amount does not leak bid range).

### Encrypted Highest Bid Tracking

We maintain an `euint64` for the current highest bid per auction. On each new bid, we compare and update:

```solidity
ebool isHigher = FHE.gt(newBid, _highestBid[auctionId]);
_highestBid[auctionId] = FHE.select(isHigher, newBid, _highestBid[auctionId]);
```

### Winner Tracking with eaddress

We also track the highest bidder's address in encrypted form using `eaddress`:

```solidity
_highestBidder[auctionId] = FHE.select(
    isHigher,
    FHE.asEaddress(msg.sender),
    _highestBidder[auctionId]
);
```

This is a key pattern: `FHE.asEaddress(msg.sender)` converts a plaintext address into an encrypted `eaddress`, and `FHE.select()` conditionally picks between encrypted addresses based on the encrypted comparison result.

---

## 3. Complete SealedBidAuction Contract

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

        _highestBid[id] = FHE.asEuint64(0);
        FHE.allowThis(_highestBid[id]);

        _highestBidder[id] = FHE.asEaddress(address(0));
        FHE.allowThis(_highestBidder[id]);

        emit AuctionCreated(id, item, auctions[id].deadline, reservePrice);
    }

    function bid(uint256 auctionId, externalEuint64 encBid, bytes calldata proof) external payable {
        require(auctionId < auctionCount, "Invalid auction");
        require(block.timestamp <= auctions[auctionId].deadline, "Bidding ended");
        require(!auctions[auctionId].ended, "Auction ended");
        require(!hasBid[auctionId][msg.sender], "Already bid");
        require(msg.value > 0, "Must deposit ETH");

        euint64 newBid = FHE.fromExternal(encBid, proof);

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

    function endAuction(uint256 auctionId) external onlyOwner {
        require(auctionId < auctionCount, "Invalid auction");
        require(block.timestamp > auctions[auctionId].deadline, "Not yet ended");
        require(!auctions[auctionId].ended, "Already ended");

        auctions[auctionId].ended = true;

        FHE.makePubliclyDecryptable(_highestBid[auctionId]);
        FHE.makePubliclyDecryptable(_highestBidder[auctionId]);

        emit AuctionEnded(auctionId);
    }

    function withdrawDeposit(uint256 auctionId) external {
        require(auctions[auctionId].ended, "Auction not ended");
        require(msg.sender != winner[auctionId], "Winner cannot withdraw");
        uint256 amount = deposits[auctionId][msg.sender];
        require(amount > 0, "No deposit");

        deposits[auctionId][msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        emit DepositWithdrawn(auctionId, msg.sender, amount);
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

## 4. The createAuction Function

The owner creates auctions dynamically rather than setting parameters in the constructor:

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

    emit AuctionCreated(id, item, auctions[id].deadline, reservePrice);
}
```

Key points:
- `duration` is relative (seconds from now), converted to an absolute `deadline`
- `reservePrice` is stored as plaintext `uint64` -- it is the minimum acceptable bid
- Both `_highestBid` and `_highestBidder` are initialized to encrypted zero/null values
- `FHE.allowThis()` grants the contract permission to operate on these encrypted values

---

## 5. The bid Function in Detail

The core logic of the auction is in the `bid()` function:

```solidity
function bid(uint256 auctionId, externalEuint64 encBid, bytes calldata proof) external payable {
    require(msg.value > 0, "Must deposit ETH");
    require(!hasBid[auctionId][msg.sender], "Already bid");

    euint64 newBid = FHE.fromExternal(encBid, proof);

    // Compare: is this bid higher than the current highest?
    ebool isHigher = FHE.gt(newBid, _highestBid[auctionId]);

    // Update highest bid: pick the larger one
    _highestBid[auctionId] = FHE.select(isHigher, newBid, _highestBid[auctionId]);

    // Update highest bidder: pick the corresponding address
    _highestBidder[auctionId] = FHE.select(
        isHigher,
        FHE.asEaddress(msg.sender),
        _highestBidder[auctionId]
    );
}
```

Key observations:
- `FHE.fromExternal(encBid, proof)` takes exactly 2 parameters (the encrypted handle and the proof)
- The comparison and selection happen entirely on encrypted data
- Neither the bidder nor observers know if their bid is currently the highest
- Both `_highestBid` and `_highestBidder` are updated atomically
- `msg.value > 0` ensures the bidder deposits ETH to back their bid
- One bid per user is enforced with `hasBid` mapping

---

## 6. Encrypted Address (eaddress)

This contract uses `eaddress` -- an encrypted Ethereum address:

```solidity
eaddress private _highestBidder;

// Create from plaintext
_highestBidder[id] = FHE.asEaddress(msg.sender);

// Select between two encrypted addresses
_highestBidder[id] = FHE.select(isHigher,
    FHE.asEaddress(msg.sender), _highestBidder[id]);
```

The `eaddress` pattern is central to this contract:
1. `FHE.asEaddress(msg.sender)` wraps a plaintext address into an encrypted value
2. `FHE.select(condition, addrA, addrB)` picks one of two encrypted addresses based on an encrypted boolean
3. The winner's identity stays encrypted until `endAuction()` is called

---

## 7. Deposit Handling

Bidders must send ETH with their bid:

```solidity
require(msg.value > 0, "Must deposit ETH");
deposits[auctionId][msg.sender] = msg.value;
```

After the auction ends:
- **Losers:** Can call `withdrawDeposit(auctionId)` to reclaim their ETH
- **Winner:** Their deposit covers the winning bid (or partial settlement)

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

**Privacy consideration:** The deposit amount is plaintext (ETH transfers are visible). For maximum privacy, all bidders should deposit the same fixed amount.

---

## 8. Ending the Auction: FHE.makePubliclyDecryptable()

Instead of using a Gateway for decryption, this contract uses `FHE.makePubliclyDecryptable()`:

```solidity
function endAuction(uint256 auctionId) external onlyOwner {
    require(block.timestamp > auctions[auctionId].deadline, "Not yet ended");
    require(!auctions[auctionId].ended, "Already ended");

    auctions[auctionId].ended = true;

    // Make results publicly readable -- no Gateway needed
    FHE.makePubliclyDecryptable(_highestBid[auctionId]);
    FHE.makePubliclyDecryptable(_highestBidder[auctionId]);

    emit AuctionEnded(auctionId);
}
```

Key difference from Gateway-based decryption:
- **Gateway pattern:** Owner gets ACL access, decrypts via re-encryption, then submits plaintext back on-chain
- **`makePubliclyDecryptable` pattern:** The encrypted value is marked for public decryption -- anyone can read the result once the FHE network processes it
- This is simpler and removes the need for the owner to act as a trusted intermediary for decryption

---

## 9. Frontend: Placing a Bid

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
  { value: ethers.parseEther("1.0") } // ETH deposit
);
await tx.wait();
```

Note the three contract parameters: `auctionId`, the encrypted handle, and the proof, plus the ETH value sent with the transaction.

---

## 10. Privacy Advantages Over Traditional Auctions

| Aspect | Open Auction | Commit-Reveal | FHE Sealed-Bid |
|--------|-------------|---------------|----------------|
| Bids visible during auction | Yes | No (committed hash) | No (encrypted) |
| Front-running possible | Yes | Partially | No |
| Requires reveal phase | No | Yes | No |
| Bidder can refuse to reveal | N/A | Yes (griefing) | N/A |
| On-chain comparison | Plaintext | After reveal | Encrypted |

The FHE approach eliminates the reveal phase entirely. There is no "commit-reveal" -- bids are compared on-chain while still encrypted.

---

## 11. Handling Ties

What if two bids are equal? With `FHE.gt()`, equal bids return `false`, so the earlier bidder keeps the lead:

```solidity
ebool isHigher = FHE.gt(newBid, _highestBid[auctionId]);
// If equal, isHigher is false -> previous highest stays
```

If you want ties to go to the later bidder, use `FHE.ge()`:

```solidity
ebool isHigherOrEqual = FHE.ge(newBid, _highestBid[auctionId]);
```

---

## 12. Security Considerations

### Bid Validity

The encrypted bid could be any value. A malicious bidder could bid `type(uint64).max` without having the funds. The deposit requirement mitigates this, but for a production system, you would need more sophisticated settlement logic.

### One Bid Per Address

```solidity
require(!hasBid[auctionId][msg.sender], "Already bid");
```

Allowing bid updates would reveal that the bidder changed their mind (a timing side-channel). One bid per address is simpler and more private.

### Reserve Price

The `reservePrice` is stored per auction. It can be checked against the decrypted winning bid after the auction ends to determine if the auction met its minimum.

---

## Summary

- Sealed-bid auctions with FHE eliminate front-running and bid sniping
- `createAuction()` sets up item, duration, and reserve price; supports multiple auctions
- `bid()` requires an ETH deposit and enforces one-bid-per-user
- `FHE.fromExternal(encBid, proof)` converts external encrypted input (2 parameters)
- `FHE.gt()` compares bids without revealing values
- `FHE.select()` updates the highest bid and bidder atomically
- `eaddress` keeps the winner's identity encrypted: `FHE.select(isHigher, FHE.asEaddress(msg.sender), _highestBidder[auctionId])`
- `endAuction()` uses `FHE.makePubliclyDecryptable()` instead of Gateway-based decryption
- `withdrawDeposit(auctionId)` lets losers reclaim ETH after the auction ends
- No reveal phase needed (unlike commit-reveal schemes)
- Privacy of deposit amounts requires fixed-deposit designs
