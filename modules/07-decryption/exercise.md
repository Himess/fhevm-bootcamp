# Module 07: Exercise — Revealable Auction Contract

## Objective

Build a sealed-bid auction contract that uses **encrypted inputs** for private bids and **public decryption** via `FHE.makePubliclyDecryptable()` to reveal the winning bid after the auction closes.

---

## Task: RevealableAuction

Create an auction contract with these features:

1. Users submit sealed bids using `externalEuint64`
2. The contract tracks the highest bid and the highest bidder (both encrypted)
3. The owner can close the auction and reveal the winning bid publicly
4. Users can view their own bids via ACL-protected reencryption

---

## Starter Code

### `contracts/RevealableAuction.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, eaddress, ebool, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

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
        revealed = false;

        // TODO: Initialize _highestBid to encrypted 0
        // TODO: Initialize _highestBidder to encrypted address(0)
        // TODO: FHE.allowThis() for both
    }

    function submitBid(externalEuint64 encryptedBid, bytes calldata inputProof) external {
        require(auctionOpen, "Auction closed");
        require(!_hasBid[msg.sender], "Already bid");

        // TODO: Convert external input with FHE.fromExternal(encryptedBid, inputProof)
        // TODO: Store the bid in _bids mapping
        // TODO: Mark _hasBid as true

        // TODO: Compare with _highestBid using FHE.gt()
        // TODO: Update _highestBid using FHE.select()
        // TODO: Update _highestBidder using FHE.select()

        // TODO: ACL for bid (contract + user)
        // TODO: ACL for _highestBid and _highestBidder (contract)
    }

    function closeAuction() public onlyOwner {
        require(auctionOpen, "Already closed");
        auctionOpen = false;
    }

    function revealWinner() public onlyOwner {
        require(!auctionOpen, "Close auction first");
        require(!revealed, "Already revealed");

        // TODO: Call FHE.makePubliclyDecryptable() for _highestBid
        // TODO: Set revealed to true
    }

    function getMyBid() public view returns (euint64) {
        require(_hasBid[msg.sender], "No bid placed");
        // TODO: Check FHE.isSenderAllowed() for the user's bid
        // TODO: Return the encrypted bid handle
    }
}
```

---

## Step-by-Step Instructions

1. **Constructor**: Initialize `_highestBid` with `FHE.asEuint64(0)` and `_highestBidder` with `FHE.asEaddress(address(0))`. Call `FHE.allowThis()` for both.

2. **`submitBid`**: Convert input with `FHE.fromExternal()`, store bid, compare with `FHE.gt()`, update with `FHE.select()`, set ACL permissions.

3. **`closeAuction`**: Simple flag flip (already implemented).

4. **`revealWinner`**: Call `FHE.makePubliclyDecryptable(_highestBid)` and set `revealed = true`.

5. **`getMyBid`**: Check `FHE.isSenderAllowed()` and return the encrypted handle.

---

## Hints

<details>
<summary>Hint 1: Constructor initialization</summary>

```solidity
constructor() {
    owner = msg.sender;
    auctionOpen = true;
    revealed = false;

    _highestBid = FHE.asEuint64(0);
    _highestBidder = FHE.asEaddress(address(0));
    FHE.allowThis(_highestBid);
    FHE.allowThis(_highestBidder);
}
```
</details>

<details>
<summary>Hint 2: submitBid with highest bid tracking</summary>

```solidity
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
```
</details>

<details>
<summary>Hint 3: revealWinner and getMyBid</summary>

```solidity
function revealWinner() public onlyOwner {
    require(!auctionOpen, "Close auction first");
    require(!revealed, "Already revealed");

    FHE.makePubliclyDecryptable(_highestBid);
    revealed = true;
}

function getMyBid() public view returns (euint64) {
    require(_hasBid[msg.sender], "No bid placed");
    require(FHE.isSenderAllowed(_bids[msg.sender]), "Not authorized");
    return _bids[msg.sender];
}
```
</details>

---

## Bonus Challenges

1. **Reveal the winner's address too** — Also call `FHE.makePubliclyDecryptable(_highestBidder)` in `revealWinner()`.

2. **Add a reserve price** — In the constructor, set a minimum bid amount. In `submitBid`, use `FHE.ge()` to check the bid meets the reserve.

3. **Add bid count tracking** — Track the total number of bids and emit events.

---

## Success Criteria

- [ ] Contract compiles without errors
- [ ] Inherits `ZamaEthereumConfig` (NOT `GatewayConfig`)
- [ ] `submitBid` uses `externalEuint64` + `bytes calldata inputProof` and `FHE.fromExternal(input, inputProof)`
- [ ] Highest bid is tracked using `FHE.gt()` + `FHE.select()`
- [ ] `revealWinner` uses `FHE.makePubliclyDecryptable()` (NOT Gateway)
- [ ] `getMyBid` checks `FHE.isSenderAllowed()` before returning
- [ ] All encrypted state updates have proper ACL calls
