# Module 13: Quiz -- Sealed-Bid Auction

Test your knowledge of building privacy-preserving auctions with FHEVM.

---

### Question 1

What FHE operation is used to compare two encrypted bids?

- A) `FHE.eq(bidA, bidB)`
- B) `FHE.gt(bidA, bidB)` ✅
- C) `FHE.max(bidA, bidB)`
- D) `FHE.sub(bidA, bidB)`

> `FHE.gt()` returns an `ebool` indicating whether bidA is greater than bidB, allowing us to determine the higher bid without revealing either value.

---

### Question 2

Why does the auction use `FHE.select()` instead of directly assigning the new bid as highest?

- A) Because `FHE.select()` is more gas efficient
- B) Because we do not know if the new bid is actually higher -- the selection is based on an encrypted comparison ✅
- C) Because direct assignment is not supported for euint64
- D) Because `FHE.select()` automatically handles ACL

> The comparison result is an `ebool` (encrypted boolean). We cannot branch on it, so `FHE.select()` picks the correct value based on the encrypted condition.

---

### Question 3

What type is used to store the highest bidder's address in encrypted form?

- A) `address`
- B) `bytes32`
- C) `eaddress` ✅
- D) `euint160`

> `eaddress` is the encrypted address type in FHEVM. It supports `FHE.asEaddress()` and `FHE.select()` operations.

---

### Question 4

Why must bidders send an ETH deposit with their bid?

- A) To pay for FHE computation gas
- B) To ensure the winner can actually pay for the item they bid on ✅
- C) To fund the gateway decryption
- D) To prevent spam (gas alone is sufficient)

> Without a deposit, a bidder could submit an astronomically high encrypted bid without having the funds to back it up.

---

### Question 5

What advantage does FHE sealed-bid have over commit-reveal auctions?

- A) Lower gas costs
- B) No reveal phase needed -- bids are compared while still encrypted ✅
- C) Better Solidity compatibility
- D) Faster finalization

> In commit-reveal, bidders must come back to reveal their bids (and can grief by not revealing). FHE auctions compare bids on-chain without ever revealing them.

---

### Question 6

What happens if two bids are exactly equal when using `FHE.gt()`?

- A) The transaction reverts
- B) Both bidders become co-winners
- C) The earlier bidder keeps the lead because `FHE.gt()` returns false for equal values ✅
- D) The later bidder takes the lead

> `FHE.gt()` returns `false` when values are equal. Since the condition is false, `FHE.select()` keeps the existing highest bidder.

---

### Question 7

Why is each bidder limited to one bid per auction?

- A) To simplify the contract
- B) Allowing updates would reveal through timing that a bidder changed their mind, leaking information ✅
- C) Because FHE cannot overwrite encrypted values
- D) Because Ethereum limits transactions per address

> If a bidder updates their bid, the transaction itself reveals that they changed their strategy. A single-bid design avoids this side-channel.

---

### Question 8

What information is publicly visible during the bidding phase?

- A) All bid amounts
- B) The current highest bid
- C) Only that an address bid and how much ETH they deposited ✅
- D) Nothing at all

> The transaction and ETH transfer are visible (who bid, when, deposit amount). The encrypted bid amount and the current highest bid remain private.

---

### Question 9

How does `endAuction()` reveal the winner in this contract?

- A) The owner decrypts via the Gateway and submits the plaintext back on-chain
- B) The owner calls `FHE.allow()` and then re-encrypts the result
- C) `FHE.makePubliclyDecryptable()` is called on the highest bid and bidder, making them publicly readable ✅
- D) The winner must call a `reveal()` function themselves

> The contract calls `FHE.makePubliclyDecryptable()` on both `_highestBid` and `_highestBidder`, which marks them for public decryption without needing a Gateway intermediary.

---

### Question 10

How does the `bid()` function convert the encrypted input from the frontend?

- A) `FHE.fromExternal(encBid, msg.sender, proof)` -- 3 parameters
- B) `FHE.fromExternal(encBid, proof)` -- 2 parameters ✅
- C) `FHE.decrypt(encBid)` -- 1 parameter
- D) `FHE.asEuint64(encBid)` -- 1 parameter

> `FHE.fromExternal()` takes exactly 2 parameters: the external encrypted value and the proof. This converts the frontend's encrypted input into a usable `euint64` inside the contract.

---

## Scoring

| Score | Rating |
|-------|--------|
| 10/10 | Excellent -- You are ready for Module 14! |
| 7-9/10 | Good -- Review the items you missed. |
| 4-6/10 | Fair -- Re-read the lesson before proceeding. |
| 0-3/10 | Needs work -- Go through the lesson and exercise again. |
