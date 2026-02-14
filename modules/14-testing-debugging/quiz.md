# Module 14: Quiz -- Testing & Debugging FHE Contracts

Test your knowledge of FHE-specific testing patterns and debugging techniques.

---

### Question 1

What is the correct way to create an encrypted input for a test transaction?

- A) `fhevm.encrypt(contractAddress, value)`
- B) `fhevm.createEncryptedInput(contractAddress, signer.address).add64(value).encrypt()`
- C) `FHE.encrypt(value)` called from the test file
- D) `ethers.utils.encrypt(value, contractAddress)`

> `fhevm.createEncryptedInput()` takes the contract address and signer address, then you chain `.add64()` (or other type-specific method) and `.encrypt()` to get the handles and proof.

---

### Question 2

Why must you use `equal(42n)` instead of `equal(42)` when asserting decrypted values?

- A) Because Solidity uses unsigned integers
- B) Because `fhevm.userDecryptEuint()` returns a BigInt, and BigInt comparisons require the `n` suffix
- C) Because the `n` suffix adds error tolerance
- D) Because Hardhat requires BigInt for all numeric comparisons

> Values decrypted from FHE handles are JavaScript BigInts. Comparing a BigInt with a regular number using Chai's `equal()` will fail because they are different types.

---

### Question 3

What happens when an FHE contract uses `FHE.select(hasEnough, amount, FHE.asEuint64(0))` and `hasEnough` is false?

- A) The transaction reverts with "Insufficient balance"
- B) The function returns an error code
- C) The selected value is `FHE.asEuint64(0)`, so the operation proceeds with 0 -- no revert occurs
- D) The EVM throws an out-of-gas exception

> `FHE.select()` is the encrypted equivalent of a ternary operator. When the condition is false, it picks the third argument (0 in this case). The transaction succeeds but effectively does nothing useful. This is called "silent failure" and it is by design for privacy.

---

### Question 4

How do you verify that a "failed" encrypted operation (e.g., overdraft withdrawal) was handled correctly in a test?

- A) Use `expect(tx).to.be.revertedWith("Insufficient balance")`
- B) Check that the transaction receipt contains an error event
- C) Decrypt the balance after the operation and verify it is unchanged
- D) Use `expect(tx).to.emit(contract, "Error")`

> Since FHE contracts do not revert on encrypted condition failures, you cannot use `revertedWith`. Instead, decrypt the state after the operation and verify it equals the state before the operation (i.e., nothing changed).

---

### Question 5

What is the primary debugging tool for FHE contracts, given that `console.log()` cannot display encrypted values?

- A) Hardhat's built-in debugger
- B) Remix IDE's step-through debugger
- C) Events emitted by the contract with plaintext metadata
- D) The FHE.decrypt() function called inside the contract

> Events are the primary debugging mechanism. They can emit plaintext data like addresses, counters, and indices that help you trace execution without revealing encrypted values. `console.log()` on an encrypted handle only prints a meaningless handle identifier.

---

### Question 6

What happens if you pass `alice.address` to `createEncryptedInput()` but call the contract with `bob` as the signer?

- A) The input is automatically re-encrypted for Bob
- B) The proof verification fails because the encrypted input is bound to Alice's address
- C) The operation succeeds but the value is decrypted incorrectly
- D) Nothing -- the addresses are only used for logging

> Encrypted inputs are cryptographically bound to a specific contract address and signer address. If you create the input for Alice but send it as Bob, the proof will not validate and the transaction will fail.

---

### Question 7

Which of the following is the correct way to decrypt an `euint64` value in a test?

- A) `await fhevm.decrypt(handle)`
- B) `await fhevm.userDecryptEuint(FhevmType.euint64, handle, contractAddress, signer)`
- C) `await contract.decrypt(handle)`
- D) `await fhevm.userDecryptEuint(handle, contractAddress)`

> `fhevm.userDecryptEuint()` requires exactly four arguments: the FhevmType enum, the handle, the contract address, and the signer object. The signer must have ACL permission on the encrypted value.

---

### Question 8

Why do FHE contracts use the select pattern (`FHE.select(condition, valueIfTrue, valueIfFalse)`) instead of `require()` for encrypted conditions?

- A) Because `FHE.select()` uses less gas
- B) Because `require()` cannot evaluate an `ebool` -- encrypted booleans are not native Solidity bools
- C) Because `FHE.select()` is more secure
- D) Because Hardhat does not support `require()` in FHE mode

> `require()` expects a native Solidity `bool`. An `ebool` is an encrypted type that exists as a ciphertext handle -- the EVM does not know its plaintext value. You cannot branch on it. `FHE.select()` lets you choose between two encrypted values based on an encrypted condition, all within the FHE domain.

---

### Question 9

When testing ACL permissions, how do you verify that user B cannot access user A's encrypted balance?

- A) Call `contract.hasPermission(bob, handle)` and check it returns false
- B) Attempt to decrypt the handle as Bob and expect the decryption to fail
- C) Check that `FHE.allow()` was not called for Bob by reading contract storage
- D) ACL cannot be tested in the mock environment

> The most direct way to test ACL is to attempt decryption as an unauthorized user. If the ACL is correctly set (only Alice was granted access), Bob's decryption attempt will fail, which you can catch with try/catch.

---

### Question 10

What is the purpose of adding plaintext counters (like `depositCount`) to an FHE contract?

- A) They are required by the FHE runtime
- B) They allow gas estimation for encrypted operations
- C) They provide instantly readable state that tests can verify without the encrypt/decrypt cycle
- D) They replace events for debugging

> Plaintext counters and status variables can be read with a simple view call (`vault.depositCount()`), which is much faster and simpler than the full encrypt-act-decrypt-assert cycle. They serve as quick sanity checks that operations executed as expected.

---

## Answer Key

| Question | Answer | Key Concept |
|----------|--------|-------------|
| 1 | B | Encrypted input creation API |
| 2 | B | BigInt comparison requirement |
| 3 | C | Silent failure / select pattern |
| 4 | C | Testing silent failures via state verification |
| 5 | C | Events as debugging tool |
| 6 | B | Encrypted input is signer-bound |
| 7 | B | userDecryptEuint API signature |
| 8 | B | ebool is not bool; require does not work |
| 9 | B | ACL boundary testing via failed decryption |
| 10 | C | Plaintext checkpoints for fast verification |

## Scoring

| Score | Rating |
|-------|--------|
| 10/10 | Excellent -- You can write production-quality FHE tests! |
| 7-9/10 | Good -- Review the items you missed before the exercise. |
| 4-6/10 | Fair -- Re-read the lesson, focusing on the testing patterns section. |
| 0-3/10 | Needs work -- Go through the lesson and TestableVault example again. |
