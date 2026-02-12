# Module 07: Exercise — Decryptable Auction Contract

## Objective

Build a sealed-bid auction contract that uses both **encrypted inputs** for private bids and **public decryption** via the Gateway to reveal the winning bid and winner.

---

## Task: RevealableAuction

Create an auction contract with these features:

1. Users submit sealed bids using `externalEuint64`
2. The contract tracks the highest bid and the highest bidder (both encrypted)
3. The owner can close the auction and request decryption of the winning bid
4. A Gateway callback reveals the winning amount publicly
5. Users can view their own bids via reencryption (return encrypted handle with ACL)

---

## Starter Code

### `contracts/RevealableAuction.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, eaddress, ebool, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {GatewayConfig} from "@fhevm/solidity/gateway/GatewayConfig.sol";

contract RevealableAuction is ZamaEthereumConfig, GatewayConfig {
    address public owner;
    bool public auctionOpen;
    bool public revealed;

    mapping(address => euint64) private _bids;
    mapping(address => bool) private _hasBid;

    euint64 private _highestBid;
    eaddress private _highestBidder;

    // Revealed values (plaintext, set by callback)
    uint64 public winningBid;

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

    function submitBid(externalEuint64 encryptedBid, bytes calldata proof) external {
        require(auctionOpen, "Auction closed");
        require(!_hasBid[msg.sender], "Already bid");

        // TODO: Convert external input with FHE.fromExternal(encryptedBid, proof)
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

    function requestReveal() public onlyOwner {
        require(!auctionOpen, "Close auction first");
        require(!revealed, "Already revealed");

        // TODO: Create uint256[] with _highestBid handle
        // TODO: Call Gateway.requestDecryption() with callback selector
    }

    function revealCallback(uint256 requestId, uint64 decryptedBid) public onlyGateway {
        // TODO: Store the decrypted winning bid
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

1. **Constructor**: Initialize `_highestBid` and `_highestBidder` with encrypted zero values.

2. **`submitBid`**: Convert input, store bid, compare with highest, update with `FHE.select()`.

3. **`closeAuction`**: Simple flag flip.

4. **`requestReveal`**: Build the ciphertext handle array and call `Gateway.requestDecryption()`.

5. **`revealCallback`**: Receive the plaintext and store it.

6. **`getMyBid`**: ACL check and return handle for reencryption.

---

## Hints

<details>
<summary>Hint 1: submitBid with highest bid tracking</summary>

```solidity
function submitBid(externalEuint64 encryptedBid, bytes calldata proof) external {
    require(auctionOpen, "Auction closed");
    require(!_hasBid[msg.sender], "Already bid");

    euint64 bid = FHE.fromExternal(encryptedBid, proof);
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
<summary>Hint 2: requestReveal</summary>

```solidity
function requestReveal() public onlyOwner {
    require(!auctionOpen, "Close auction first");
    require(!revealed, "Already revealed");

    uint256[] memory cts = new uint256[](1);
    cts[0] = FHE.toUint256(_highestBid);

    Gateway.requestDecryption(
        cts,
        this.revealCallback.selector,
        0,
        block.timestamp + 100,
        false
    );
}
```
</details>

<details>
<summary>Hint 3: revealCallback and getMyBid</summary>

```solidity
function revealCallback(uint256 requestId, uint64 decryptedBid) public onlyGateway {
    winningBid = decryptedBid;
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

1. **Reveal the winner's address too** — Add the `_highestBidder` eaddress to the decryption request and update the callback to receive both the bid amount and the winner's address.

2. **Add a `claimPrize` function** — After reveal, the winner can call this function. Compare `msg.sender` with the revealed winner address.

3. **Implement bid minimum** — Require that submitted bids are at least some minimum value (checked encrypted using `FHE.ge()`).

---

## Success Criteria

- [ ] Contract compiles without errors
- [ ] Inherits both `ZamaEthereumConfig` and `GatewayConfig`
- [ ] `submitBid` uses `externalEuint64` + `bytes calldata proof` and `FHE.fromExternal(input, proof)`
- [ ] Highest bid is tracked using `FHE.gt()` + `FHE.select()`
- [ ] `requestReveal` calls `Gateway.requestDecryption()` with correct parameters
- [ ] `revealCallback` uses `onlyGateway` modifier
- [ ] `getMyBid` checks `FHE.isSenderAllowed()` before returning
- [ ] All encrypted state updates have proper ACL calls
