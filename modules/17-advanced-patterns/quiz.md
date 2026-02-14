# Module 17: Quiz -- Advanced FHE Design Patterns

Test your understanding of the six advanced patterns covered in this module.

---

### Question 1

In the Encrypted State Machine pattern, why is the state enum stored in plaintext while the threshold is encrypted?

- A) Because enums cannot be encrypted in FHE
- B) Because users need to know which state the machine is in to interact correctly, but the transition condition should stay private ✅
- C) Because plaintext state is cheaper and there is no security benefit to encrypting it
- D) Because the compiler requires enum values to be plaintext

> The state (IDLE, ACTIVE, COMPLETED) is public so users know what actions are available. The threshold that triggers the transition is private -- observers can see *which* state changed but never *why* it changed. This is the core insight of the pattern.

---

### Question 2

What is the main problem that the LastError pattern solves?

- A) FHE operations are too slow and need caching
- B) Traditional Solidity `require()` statements leak information about encrypted conditions, but silently doing nothing gives users no feedback ✅
- C) Error codes are needed for Solidity event logging
- D) FHE does not support try-catch blocks

> In FHE, we cannot `revert` based on encrypted conditions (that would leak information). But using `FHE.select()` to silently transfer 0 on failure gives the user no feedback. The LastError pattern stores an encrypted error code that only the user can decrypt.

---

### Question 3

In the LastError pattern, what determines the priority of error codes when multiple errors apply simultaneously?

- A) The error with the lowest numeric code always wins
- B) Error codes are ORed together
- C) The order of `FHE.select()` calls determines priority -- later selects override earlier ones ✅
- D) The first error detected always wins

> Each `FHE.select()` conditionally overwrites the error code. The last select in the chain has the highest priority. For example: `select(insufficientBalance, 1, code)` then `select(tooLarge, 2, code)` then `select(selfTransfer, 3, code)` means self-transfer (3) overrides everything.

---

### Question 4

In the Encrypted Registry, why is the `_hasKey` mapping stored in plaintext?

- A) Because mappings cannot hold encrypted booleans
- B) To enable cheap existence checks without FHE gas costs, accepting that key existence is public metadata ✅
- C) Because `ebool` is not supported in mappings
- D) It is a bug -- it should be encrypted

> Storing key existence in plaintext is a deliberate design choice. It allows `hasValue()` to be a simple boolean check without FHE gas overhead. The trade-off is that observers can see *which* keys exist for a user, but not the *values*. If key existence must be private, you would use a different approach (e.g., fixed-size arrays with encrypted markers).

---

### Question 5

What happens to ACL permissions when a contract computes a new encrypted value from an existing handle?

- A) The new value inherits all ACL permissions from the input handle
- B) The new value has NO permissions -- you must explicitly set them with `FHE.allow()` and `FHE.allowThis()` ✅
- C) The new value is automatically allowed for all addresses
- D) Only the contract that created it has access

> Every FHE operation produces a new handle with an empty ACL. This is a security feature -- derived values should not automatically inherit permissions. You must explicitly grant access to each new handle. Forgetting this is a common bug.

---

### Question 6

When implementing cross-contract composability, who must call `FHE.allow(handle, otherContract)`?

- A) The other contract (Contract B)
- B) The contract owner
- C) An address that already has ACL access to the handle -- typically the user who owns the data ✅
- D) The FHE gateway

> ACL grants can only be issued by an address that already has permission on the handle. Since the user owns their encrypted balance, the user must call `token.grantVaultAccess(vaultAddress)` which internally calls `FHE.allow(balance, vaultAddress)`.

---

### Question 7

Why should loops containing FHE operations always be bounded?

- A) Because Solidity does not support infinite loops
- B) Because each FHE operation costs 200k-500k gas, so an unbounded loop can easily exceed the block gas limit ✅
- C) Because FHE operations are asynchronous and cannot be batched
- D) Because the FHE library limits the number of operations per transaction

> FHE operations are 10-100x more expensive than plaintext operations. A single `FHE.add()` costs roughly 200k gas. A loop of 50 additions would cost 10M gas. Always enforce a maximum batch size (e.g., `require(users.length <= 5)`).

---

### Question 8

In the time-locked encryption pattern, what prevents early decryption of the secret value?

- A) The FHE system enforces a time lock on the ciphertext
- B) A plaintext `require(block.timestamp >= revealTime)` guard on the `reveal()` function that calls `makePubliclyDecryptable()` ✅
- C) The encryption key is time-dependent
- D) The value is re-encrypted each block until the unlock time

> The time lock is enforced at the Solidity level: the `reveal()` function checks `block.timestamp >= revealTime` before calling `FHE.makePubliclyDecryptable()`. Before this call, the value remains encrypted and only the contract can operate on it. The FHE system itself has no concept of time.

---

### Question 9

What is the correct approach when you need to transfer encrypted data between two contracts?

- A) Serialize the ciphertext and pass it as bytes
- B) Use a shared storage contract that both can access
- C) The user grants Contract B ACL access to their data in Contract A, then Contract B reads it via Contract A's view function ✅
- D) Re-encrypt the data using Contract B's key

> Cross-contract encrypted data flow works through the ACL system. The user (who has ACL access) grants Contract B permission via `FHE.allow()`. Contract B then reads the handle through Contract A's view function. No data copying or re-encryption is needed.

---

### Question 10

You are building a private auction with the following requirements: bids are encrypted, the highest bid is tracked, and bids are revealed after a deadline. Which combination of patterns would you use?

- A) LastError + Encrypted Registry
- B) Encrypted State Machine + Time-Locked Values + Cross-Contract Composability ✅
- C) Only the Encrypted State Machine pattern
- D) Encrypted Batch Processing + LastError

> The auction uses a **State Machine** (BIDDING -> REVEALING -> SETTLED), **Time-Locked Values** (bids revealed only after the deadline via `makePubliclyDecryptable()`), and **Cross-Contract Composability** (the auction reads token balances for deposit verification). You might also add LastError for bid rejection feedback.

---

## Answer Key

| Question | Answer |
|----------|--------|
| 1 | B |
| 2 | B |
| 3 | C |
| 4 | B |
| 5 | B |
| 6 | C |
| 7 | B |
| 8 | B |
| 9 | C |
| 10 | B |

## Scoring

| Score | Rating |
|-------|--------|
| 9-10/10 | Excellent -- You have mastered advanced FHE patterns! |
| 7-8/10 | Good -- Review the patterns you missed before the exercise. |
| 5-6/10 | Fair -- Re-read the lesson sections for the patterns you missed. |
| 0-4/10 | Needs work -- Review the full lesson and contract code before proceeding. |
