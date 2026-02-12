# Module 12: Quiz -- Confidential Voting

Test your knowledge of building privacy-preserving voting systems with FHEVM.

---

### Question 1

Why is `FHE.select()` used instead of an if/else branch for counting votes?

- A) If/else is not valid Solidity syntax
- B) If/else would require decrypting the vote, which leaks the voter's choice
- C) FHE.select() is faster than if/else
- D) If/else cannot work with euint32

> Branching on encrypted data would require decryption. `FHE.select()` performs the conditional logic entirely on encrypted values.

---

### Question 2

What happens to both tallies on every vote?

- A) Only the chosen tally is incremented
- B) Both tallies are always updated -- the chosen one by 1 and the other by 0
- C) The chosen tally is incremented and the other is decremented
- D) Both tallies are incremented by 1

> Both `FHE.add()` calls execute on every vote. The encrypted increment is 1 for the chosen option and 0 for the other. This prevents observers from seeing which tally changed.

---

### Question 3

Why is voter participation tracked in a plaintext mapping?

- A) FHE cannot store booleans
- B) The contract needs a definitive (non-encrypted) answer to prevent double voting
- C) To save gas
- D) Because the mapping is private, it is already hidden

> A `require` statement needs a plaintext boolean. We accept that "who voted" is public while keeping "how they voted" private.

---

### Question 4

Why does the contract use `externalEuint8` for the vote input instead of `externalEbool`?

- A) `externalEbool` does not exist in FHEVM
- B) `euint8` is more flexible -- it supports multi-option voting (0, 1, 2, ...) without changing the function signature
- C) `ebool` cannot be used with `FHE.select()`
- D) `euint8` uses less gas than `ebool`

> Using `euint8` allows the same function signature to support yes/no (0 or 1) and multi-option voting (0, 1, 2, 3, ...) without modification. The contract uses `FHE.eq(voteValue, FHE.asEuint8(1))` to convert to an `ebool` for the yes/no check.

---

### Question 5

What privacy guarantee does encrypted voting provide regarding partial results?

- A) Partial results are visible to the owner
- B) Partial results are visible after 50% of votes are in
- C) Partial results are never visible -- tallies remain encrypted until reveal
- D) Partial results are visible but encrypted

> Since tallies are `euint32` with ACL granted only to the contract during voting, nobody can decrypt the running totals.

---

### Question 6

How does the frontend encrypt a vote?

- A) `input.add64(1)` for Yes, `input.add64(0)` for No
- B) `input.addBool(true)` for Yes, `input.addBool(false)` for No
- C) `input.add8(1)` for Yes, `input.add8(0)` for No
- D) The contract encrypts the vote automatically

> The vote parameter is `externalEuint8`, so the frontend uses `input.add8()` to encrypt a uint8 value. `1` means yes, `0` means no.

---

### Question 7

What information does the `VoteCast` event reveal?

- A) The voter's address and their vote choice
- B) Only the proposal ID and the voter's address
- C) The voter's address, vote choice, and current tallies
- D) Nothing -- the event is encrypted

> The event contains `proposalId` and `voter` address. The vote choice is encrypted and not included in the event.

---

### Question 8

For a multi-option vote with 4 options, how many `FHE.add()` calls happen per vote?

- A) 1
- B) 2
- C) 4
- D) 8

> Each of the 4 option tallies is updated with `FHE.add()`. The increment is 1 for the chosen option and 0 for the other three.

---

### Question 9

What prevents anyone from decrypting tallies during the voting period?

- A) A time-locked smart contract
- B) The tallies only have `FHE.allowThis()` -- no external address has ACL access
- C) The gateway refuses decryption requests during voting
- D) The tallies are stored in a different contract

> Only `FHE.allowThis()` is called for tallies during voting. No external address (not even the owner) is granted ACL access to the encrypted tallies while voting is active.

---

### Question 10

How does the contract determine if an encrypted vote is "yes"?

- A) It decrypts the vote and checks the value
- B) It uses `FHE.eq(voteValue, FHE.asEuint8(1))` to produce an encrypted boolean
- C) It checks `voteValue == 1` in plaintext
- D) It uses `FHE.gt(voteValue, FHE.asEuint8(0))`

> The contract compares the encrypted `euint8` vote value against an encrypted `1` using `FHE.eq()`. This produces an `ebool` (`isYes`) that is then used with `FHE.select()` to determine the tally increments -- all without decryption.

---

## Scoring

| Score | Rating |
|-------|--------|
| 10/10 | Excellent -- You are ready for Module 13! |
| 7-9/10 | Good -- Review the items you missed. |
| 4-6/10 | Fair -- Re-read the lesson before proceeding. |
| 0-3/10 | Needs work -- Go through the lesson and exercise again. |
