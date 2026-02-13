# Module 07: Quiz — Decryption Patterns

Test your understanding of public decryption, user-specific reencryption, and the ACL patterns.

---

### Question 1

What is the main difference between public decryption and user-specific reencryption?

- A) Public decryption is faster
- B) Public decryption reveals the plaintext to everyone; reencryption reveals it only to the authorized user ✅
- C) Reencryption is only for contracts, public decryption is only for users
- D) There is no difference — they are the same mechanism

---

### Question 2

What function makes an encrypted value decryptable by anyone?

- A) `FHE.decrypt(handle)`
- B) `FHE.makePubliclyDecryptable(handle)` ✅
- C) `FHE.allow(handle, address(0))`
- D) `Gateway.requestDecryption(handle)`

---

### Question 3

Is `FHE.makePubliclyDecryptable()` reversible?

- A) Yes, you can call `FHE.revokePublicAccess()`
- B) Yes, by creating a new handle and copying the value
- C) No, once made publicly decryptable it cannot be undone ✅
- D) Yes, but only the contract owner can reverse it

---

### Question 4

What must a contract do before a user can decrypt their own encrypted balance?

- A) Call `FHE.makePubliclyDecryptable()` on the balance
- B) Call `FHE.allow(balance, userAddress)` to grant ACL access ✅
- C) Send the user the FHE private key
- D) Nothing — users can always decrypt any value

---

### Question 5

In Hardhat tests, which function decrypts an encrypted uint32?

- A) `fhevm.decrypt(handle)`
- B) `fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, signer)` ✅
- C) `contract.decrypt(handle)`
- D) `FHE.decrypt(handle)`

---

### Question 6

What is the correct way to guard a view function that returns an encrypted handle?

- A) Use `onlyOwner` modifier
- B) Check `require(FHE.isSenderAllowed(handle), "No access")` ✅
- C) Check `require(msg.sender != address(0))`
- D) No guard needed — encrypted handles are safe to return

---

### Question 7

After performing `result = FHE.add(a, b)`, who has ACL access to `result`?

- A) Everyone who had access to `a` and `b`
- B) Only the contract (automatically)
- C) Nobody — ACL must be explicitly set for the new handle ✅
- D) The transaction sender automatically gets access

---

### Question 8

When should you use `FHE.makePubliclyDecryptable()` vs `FHE.allow()`?

- A) `makePubliclyDecryptable` for any decryption, `allow` is deprecated
- B) `makePubliclyDecryptable` when everyone should see the value; `allow` when only specific users should see it ✅
- C) They are interchangeable
- D) `allow` for public values, `makePubliclyDecryptable` for private values

---

### Question 9

Why should you minimize the number of decryption operations?

- A) Each decryption costs exactly 1 ETH
- B) Every decryption reveals information, reducing the overall privacy of the system ✅
- C) The system can only handle 10 decryptions per day
- D) Decryption is not supported on mainnet

---

### Question 10

What is the better pattern for checking if a balance exceeds 1000?

- A) Make the balance public, read it, then compare off-chain
- B) Use `FHE.gt(_balance, FHE.asEuint64(1000))` to compare while encrypted ✅
- C) Request Gateway decryption and compare in the callback
- D) Store the balance as plaintext and compare directly

<details>
<summary>Explanation</summary>
Keeping the comparison encrypted reveals only a boolean result (is it greater?), not the exact balance. Making the balance public would reveal the exact amount, which is a much larger privacy leak.
</details>

---

### Question 11

In a browser application using the Relayer SDK (`@zama-fhe/relayer-sdk`), how does a user decrypt their own encrypted data?

- A) They call a contract function that returns the plaintext
- B) They use `instance.reencrypt()` with their keypair and EIP-712 signature ✅
- C) They request decryption from the Gateway directly
- D) They download the FHE secret key and decrypt locally

---

### Question 12

What is the Gateway in the context of FHEVM production networks?

- A) A smart contract that stores all plaintext values
- B) An off-chain service that coordinates async decryption with the KMS using a callback pattern ✅
- C) A browser plugin for viewing encrypted values
- D) A Solidity library for encryption

<details>
<summary>Explanation</summary>
In production fhEVM networks, the Gateway is an off-chain relayer that handles decryption requests and coordinates with the KMS (Key Management Service). In the Hardhat development environment, decryption is simulated synchronously via `userDecryptEuint()`, so the Gateway is not needed for development and testing.
</details>

---

## Scoring

| Score | Rating |
|-------|--------|
| 11-12/12 | Excellent — You are ready for Module 08! |
| 8-10/12 | Good — Review the items you missed. |
| 5-7/12 | Fair — Re-read the lesson before proceeding. |
| 0-4/12 | Needs work — Go through the lesson and exercise again. |
