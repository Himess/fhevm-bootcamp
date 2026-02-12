# Module 14: Quiz -- Confidential DAO Capstone

Test your comprehensive understanding of building a full confidential DAO with FHEVM.

---

### Question 1

What is the purpose of `grantDAOAccess()` in the GovernanceToken?

- A) To transfer tokens to the DAO
- B) To allow the DAO contract to read the caller's encrypted token balance for vote weighting ✅
- C) To register the user as a DAO member
- D) To approve token spending by the DAO

> The DAO needs ACL access to read the voter's encrypted balance. `grantDAOAccess()` calls `FHE.allow(_balances[msg.sender], daoAddress)`.

---

### Question 2

How does weighted voting differ from the simple voting in Module 12?

- A) It uses `euint128` instead of `euint64`
- B) Each vote adds the voter's token balance instead of 1 ✅
- C) It requires multiple transactions per vote
- D) The weight is always fixed at 100

> In Module 12, each vote adds 1 to a tally. In the DAO, each vote adds the voter's encrypted token balance as the weight.

---

### Question 3

What is the correct `FHE.select()` pattern for weighted voting?

- A) `FHE.select(voteYes, FHE.asEuint64(1), FHE.asEuint64(0))`
- B) `FHE.select(voteYes, weight, FHE.asEuint64(0))` for yes, `FHE.select(voteYes, FHE.asEuint64(0), weight)` for no ✅
- C) `FHE.select(voteYes, weight, weight)`
- D) `FHE.mul(voteYes, weight)`

> For a Yes vote: `yesWeight = select(true, weight, 0) = weight`, `noWeight = select(true, 0, weight) = 0`. For a No vote: `yesWeight = select(false, weight, 0) = 0`, `noWeight = select(false, 0, weight) = weight`.

---

### Question 4

Why must the user call `grantDAOAccess()` before voting?

- A) To pay a registration fee
- B) Because `FHE.allow()` must be called by the balance owner to grant another contract ACL access to their encrypted balance ✅
- C) To lock their tokens during voting
- D) Because the DAO cannot call functions on the token contract

> ACL permissions on encrypted values can only be granted by an address that already has access. The user (who owns their balance) must explicitly grant access to the DAO contract.

---

### Question 5

What prevents the same tokens from being used to vote twice on the same proposal?

- A) Token transfers are disabled during voting
- B) The `_hasVoted` mapping prevents the same address from voting twice, but token transfers between addresses are not prevented ✅
- C) Tokens are burned when voting
- D) The governance token tracks voting history

> The basic implementation only prevents the same address from voting twice. A user could transfer tokens to a new address and vote again. Production systems use balance snapshots to prevent this.

---

### Question 6

What happens if the admin submits incorrect decrypted values in `executeProposal()`?

- A) The contract verifies against the encrypted values and reverts
- B) The incorrect values are accepted -- this is a trust assumption on the admin ✅
- C) The gateway prevents incorrect values
- D) The decrypted values are ignored

> In this design, the admin is trusted to submit correct decrypted values. A production system would use an on-chain decryption callback to eliminate this trust assumption.

---

### Question 7

How does the DAO treasury receive ETH?

- A) Through a dedicated `deposit()` function
- B) Through the `receive()` function, which accepts any ETH transfer ✅
- C) Through the governance token contract
- D) The admin manually sets the balance

> The `receive() external payable` function allows anyone to send ETH directly to the DAO contract address.

---

### Question 8

What condition must be met for `executeProposal()` to succeed?

- A) At least 50% of all tokens must have voted
- B) The proposal must be finalized AND `decryptedYes > decryptedNo` AND treasury has enough ETH ✅
- C) The admin must approve it
- D) All token holders must have voted

> Three conditions: the proposal is finalized (voting ended), yes votes exceed no votes (approved), and the treasury has sufficient ETH for the proposed amount.

---

### Question 9

Which modules' concepts are directly used in the Confidential DAO?

- A) Only Modules 11 and 12
- B) Only Modules 10-13
- C) Modules 03 (types), 04 (operations), 05 (ACL), 06 (inputs), 08 (select), 10 (frontend), 11 (ERC-20), 12 (voting) ✅
- D) All modules equally

> The DAO directly uses encrypted types, arithmetic operations, ACL management, encrypted inputs, conditional logic, frontend integration, token patterns, and voting patterns.

---

### Question 10

What is a balance snapshot and why would you need one?

- A) A backup of the token contract
- B) A record of all balances at a specific block number, preventing double-voting with transferred tokens ✅
- C) A compressed version of the balance mapping
- D) A frontend cache of decrypted values

> Without snapshots, a user could vote, transfer tokens to a new address, and vote again with the same tokens. Snapshots lock voting power at proposal creation time.

---

### Bonus Question

In a production confidential DAO, how would you eliminate the admin trust assumption for decryption?

- A) Use a multisig admin
- B) Use an on-chain decryption callback where the gateway submits decrypted values directly to the contract ✅
- C) Let any user decrypt
- D) Store results in plaintext

> An on-chain callback from the gateway would submit the decrypted tallies directly to the contract, removing the need to trust the admin to submit correct values.

---

## Scoring

| Score | Rating |
|-------|--------|
| 10-11/11 | Excellent -- You have mastered FHEVM development! |
| 7-9/11 | Good -- Review the items you missed. |
| 4-6/11 | Fair -- Re-read the lesson before proceeding. |
| 0-3/11 | Needs work -- Review Modules 10-13 and try again. |
