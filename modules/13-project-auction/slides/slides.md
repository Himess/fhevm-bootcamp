---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 13: Sealed-Bid Auction"
---

<style>
section { font-size: 18px; overflow: hidden; color: #1E293B; }
h1 { font-size: 28px; margin-bottom: 8px; color: #1E40AF; border-bottom: 2px solid #DBEAFE; padding-bottom: 6px; }
h2 { font-size: 22px; margin-bottom: 6px; color: #155E75; }
h3 { font-size: 19px; color: #92400E; }
code { font-size: 15px; background: #F1F5F9; color: #3730A3; padding: 1px 4px; border-radius: 3px; }
pre { font-size: 13px; line-height: 1.25; margin: 6px 0; background: #1E293B; color: #E2E8F0; border-radius: 6px; padding: 10px; border-left: 3px solid #6366F1; }
pre code { background: transparent; color: #E2E8F0; padding: 0; }
li { margin-bottom: 1px; line-height: 1.4; }
table { font-size: 15px; border-collapse: collapse; width: 100%; }
th { background: #1E40AF; color: white; padding: 6px 10px; text-align: left; }
td { padding: 5px 10px; border-bottom: 1px solid #E2E8F0; }
tr:nth-child(even) { background: #F8FAFC; }
p { margin-bottom: 4px; }
ul, ol { margin-top: 4px; margin-bottom: 4px; }
header { color: #3B82F6 !important; }
footer { color: #94A3B8 !important; }
section.small { font-size: 15px; }
section.small h1 { font-size: 24px; margin-bottom: 6px; }
section.small ol li { margin-bottom: 0; line-height: 1.3; }
</style>

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

<!--
Speaker notes: Start with the MEV problem to motivate the auction design. Front-running is a real issue that costs DeFi users millions. Bid sniping and collusion are additional problems in standard on-chain auctions. Ask students if they have experienced any of these.
-->

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

<!--
Speaker notes: The FHE solution is elegant: all bids are encrypted, the contract compares them while they remain encrypted, and nobody knows who is winning until the auction ends. This eliminates all three problems from the previous slide in one design.
-->

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

<!--
Speaker notes: Walk through the full auction lifecycle. Note the ETH deposit requirement -- this ensures bidders have skin in the game. The endAuction function uses makePubliclyDecryptable instead of the Gateway, which simplifies the reveal process. Losers can withdraw their deposits after the auction ends.
-->

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

<!--
Speaker notes: This is the core comparison logic. FHE.gt compares the new bid against the current highest. FHE.select updates both the highest bid and the highest bidder if the new bid is higher. Both use the same ebool condition, ensuring consistency. Nobody can see which bid is winning.
-->

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

<!--
Speaker notes: eaddress is used here to hide the winner's identity during the auction. FHE.asEaddress converts a plaintext address to an encrypted one, and FHE.select picks between encrypted addresses. This is the first practical use of eaddress in the bootcamp -- it was introduced in Module 03.
-->

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

<!--
Speaker notes: Review the contract structure. Note the separation between the plaintext Auction struct and the encrypted mappings. Encrypted data (bids, highest bid, highest bidder) uses separate mappings because Solidity structs cannot contain encrypted types directly. Deposits are plaintext ETH amounts.
-->

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

<!--
Speaker notes: The auction creation initializes both the highest bid (encrypted zero) and the highest bidder (encrypted zero address). Both require allowThis. The reserve price is plaintext -- it is a public minimum that all bidders should know. The deadline uses block.timestamp for simplicity.
-->

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

<!--
Speaker notes: Walk through the bid function. It requires ETH deposit and enforces one-bid-per-user. The encrypted bid is converted with FHE.fromExternal, then compared against the current highest. Both the highest bid and bidder are updated atomically using the same isHigher condition. Note the ACL grants for the new highest values.
-->

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

<!--
Speaker notes: The endAuction function is simple: check deadline, check not already ended, then make both the highest bid and bidder publicly decryptable. No Gateway callback needed. After the FHE network processes it, anyone can read the winner and winning bid.
-->

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

<!--
Speaker notes: Deposit handling uses the checks-effects-interactions pattern: check ended, check not winner, zero the deposit before transferring ETH. The winner's deposit stays in the contract as payment. Losers get their full deposit back. Discuss potential improvements like partial deposit locking.
-->

---

# FHE vs. Commit-Reveal

| Feature | Commit-Reveal | FHE Sealed-Bid |
|---------|--------------|----------------|
| Bid hidden during auction | Yes (hash) | Yes (encrypted) |
| Requires reveal phase | **Yes** | **No** |
| Bidder can grief (not reveal) | **Yes** | **No** |
| On-chain comparison | After reveal | **While encrypted** |
| Front-running protection | Partial | **Full** |

<!--
Speaker notes: This comparison highlights FHE's advantages over commit-reveal. The biggest win: no reveal phase means no griefing. In commit-reveal, a bidder can refuse to reveal and block the auction. With FHE, the contract can determine the winner without any bidder action.
-->

---

# Handling Ties

```solidity
// FHE.gt(): equal bids -> false
// First bidder keeps the lead
ebool isHigher = FHE.gt(newBid, _highestBid[auctionId]);

// To prefer later bidder on ties:
ebool isHigherOrEqual = FHE.ge(newBid, _highestBid[auctionId]);
```

<!--
Speaker notes: Tie handling is a design decision. FHE.gt means the first bidder wins ties (first-come advantage). FHE.ge means the last bidder wins ties (recency advantage). Neither approach reveals tie information. Discuss which is fairer with students.
-->

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

<!--
Speaker notes: Walk through the privacy table. The main leak is deposit amounts, which are visible ETH transfers. If Alice deposits 10 ETH and Bob deposits 1 ETH, observers can infer Alice's bid is higher. Fixed deposits solve this: everyone deposits the same amount, eliminating this side channel.
-->

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

<!--
Speaker notes: The frontend bid code shows the complete flow: encrypt the bid amount with add64, then call bid with the encrypted handle, proof, and ETH value. The ETH deposit is sent as msg.value using the standard ethers.js value option.
-->

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

<!--
Speaker notes: Recap the auction module. This is the most complex project so far, combining encrypted inputs, FHE comparisons, eaddress, FHE.select, makePubliclyDecryptable, and ETH handling. Students now have three complete project examples to reference for their capstone.
-->

---

# Next Up

**Module 14: Testing & Debugging FHE Contracts**

Learn how to test encrypted contracts with mock environments, debug FHE operations, and ensure correctness.

<!--
Speaker notes: Transition to testing by saying: "Now that you have built real projects, you need to know how to test and debug them properly. FHE contracts require special testing patterns that we will cover next."
-->
