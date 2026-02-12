# Module 07: Quiz — Decryption Patterns

Test your understanding of public decryption, reencryption, Gateway, and KMS.

---

### Question 1

What is the main difference between public decryption and reencryption?

- A) Public decryption is faster
- B) Public decryption reveals the plaintext to everyone on-chain; reencryption reveals it only to the requesting user ✅
- C) Reencryption is only for contracts, public decryption is only for users
- D) There is no difference — they are the same mechanism

---

### Question 2

Which configuration contract must you inherit for Gateway-based decryption?

- A) `ZamaEthereumConfig` only
- B) `GatewayConfig` only
- C) Both `ZamaEthereumConfig` and `GatewayConfig` ✅
- D) `KMSConfig`

---

### Question 3

Is decryption synchronous or asynchronous in FHEVM?

- A) Synchronous — the result is available in the same transaction
- B) Asynchronous — the result arrives via a callback in a separate transaction ✅
- C) It depends on the ciphertext size
- D) Synchronous for small values, asynchronous for large values

---

### Question 4

What modifier must the callback function use to ensure only the Gateway can call it?

- A) `onlyOwner`
- B) `onlyGateway` ✅
- C) `onlyKMS`
- D) `authorized`

---

### Question 5

What is the first parameter of every Gateway decryption callback function?

- A) `address sender`
- B) `bytes32 proof`
- C) `uint256 requestId` ✅
- D) `uint256 blockNumber`

---

### Question 6

How do you convert an `euint64` handle to the `uint256` format needed by `Gateway.requestDecryption()`?

- A) `uint256(encryptedValue)`
- B) `FHE.toUint256(encryptedValue)` ✅
- C) `FHE.handleOf(encryptedValue)`
- D) `abi.encode(encryptedValue)`

---

### Question 7

For reencryption to work, what must the contract have done for the user?

- A) Deployed a separate contract for them
- B) Granted them ACL access via `FHE.allow(handle, userAddress)` ✅
- C) Sent them the FHE private key
- D) Called `Gateway.requestReencryption()`

---

### Question 8

What is the role of the KMS in the decryption process?

- A) It stores all plaintext values
- B) It holds shares of the FHE secret key and performs threshold decryption ✅
- C) It validates transaction signatures
- D) It manages gas fees for decryption

---

### Question 9

Why should you minimize the number of decryption requests?

- A) Each decryption costs exactly 1 ETH
- B) Every decryption reveals information, reducing the overall privacy of the system ✅
- C) The Gateway can only handle 10 requests per day
- D) Decryption is not supported on mainnet

---

### Question 10

What happens if the Gateway does not respond before the deadline you set in `requestDecryption()`?

- A) The contract automatically reverts
- B) The decryption request expires and the callback is never called ✅
- C) The Gateway retries indefinitely
- D) The KMS takes over the request

---

## Scoring

| Score | Rating |
|-------|--------|
| 10/10 | Excellent — You are ready for Module 08! |
| 7-9/10 | Good — Review the items you missed. |
| 4-6/10 | Fair — Re-read the lesson before proceeding. |
| 0-3/10 | Needs work — Go through the lesson and exercise again. |
