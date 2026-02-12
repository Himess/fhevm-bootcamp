# Module 10: Quiz -- Frontend Integration

Test your knowledge of connecting a frontend to FHEVM contracts.

---

### Question 1

What library is used to encrypt inputs on the frontend for FHEVM?

- A) `@fhevm/solidity`
- B) `fhevmjs` ✅
- C) `ethers.js`
- D) `web3-fhe`

> fhevmjs is the official JavaScript/TypeScript library for interacting with FHEVM from the browser.

---

### Question 2

What type does a contract parameter use to receive encrypted data from the frontend?

- A) `euint32`
- B) `bytes32`
- C) `externalEuint32` ✅
- D) `uint256`

> External types like `externalEuint32` represent encrypted data crossing the contract boundary from off-chain.

---

### Question 3

How do you convert an `externalEuint32` to a usable `euint32` inside a contract?

- A) `FHE.decrypt(externalVal)`
- B) `FHE.asEuint32(externalVal)`
- C) `FHE.fromExternal(externalVal, proof)` ✅
- D) `euint32(externalVal)`

> `FHE.fromExternal(val, proof)` converts external encrypted types to internal encrypted types for use with FHE operations. Both the encrypted handle and the input proof are required.

---

### Question 4

Why must `createEncryptedInput()` receive both the contract address and user address?

- A) To determine the gas price
- B) To select the correct FHE scheme
- C) To prevent replay attacks by binding the input to a specific context ✅
- D) To automatically set the ACL permissions

> Binding the encrypted input to a specific contract and user prevents the encrypted bytes from being replayed in a different context.

---

### Question 5

What is the purpose of the EIP-712 signature during decryption?

- A) To pay the gas fee for decryption
- B) To encrypt the data for the user
- C) To prove the user has ACL access to the ciphertext ✅
- D) To register the user on the gateway

> The EIP-712 signature proves to the gateway that the requesting user has been granted ACL access to the ciphertext on-chain.

---

### Question 6

What does the gateway do during the decryption process?

- A) Decrypts the ciphertext and returns the plaintext directly
- B) Re-encrypts the ciphertext with the user's temporary public key ✅
- C) Sends the FHE private key to the user
- D) Stores the plaintext in a database

> The gateway re-encrypts the value with the user's temporary public key, so only the user can decrypt it locally.

---

### Question 7

How should the FHE instance be managed in a React application?

- A) Create a new instance for every transaction
- B) Create once per page load and reuse (singleton pattern) ✅
- C) Create one per React component
- D) It does not need initialization

> The FHE instance fetches the network's public key during creation. It should be initialized once and reused to avoid redundant network calls.

---

### Question 8

Which method encrypts a 32-bit unsigned integer on the frontend?

- A) `input.encrypt32(value)`
- B) `input.addUint32(value)`
- C) `input.add32(value)` ✅
- D) `FHE.encrypt(value, 32)`

> The fhevmjs input object provides `add8()`, `add16()`, `add32()`, `add64()`, etc.

---

### Question 9

On the ABI level, how does an `externalEuint32` parameter appear?

- A) `uint32`
- B) `uint256`
- C) `bytes32` ✅
- D) `address`

> External encrypted types are serialized as `bytes32` handles when crossing the ABI boundary, accompanied by a separate `bytes calldata` input proof parameter.

---

### Question 10

Why should you invalidate cached decrypted values after a write transaction?

- A) The cache takes up too much memory
- B) The encrypted handle changes after state updates, so cached values are stale ✅
- C) The gateway requires a fresh signature every time
- D) Ethers.js does not support caching

> After a transaction modifies encrypted state, the on-chain ciphertext handle changes, making previously cached decrypted values incorrect.

---

## Scoring

| Score | Rating |
|-------|--------|
| 10/10 | Excellent -- You are ready for Module 11! |
| 7-9/10 | Good -- Review the items you missed. |
| 4-6/10 | Fair -- Re-read the lesson before proceeding. |
| 0-3/10 | Needs work -- Go through the lesson and exercise again. |
