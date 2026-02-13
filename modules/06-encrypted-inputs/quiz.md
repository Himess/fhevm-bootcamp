# Module 06: Quiz — Encrypted Inputs & ZK Proofs

Test your understanding of client-side encryption and the `externalEuintXX` / `FHE.fromExternal(input, proof)` pattern.

---

### Question 1

Why is `FHE.asEuint32(plaintext)` not sufficient for private user inputs?

- A) It uses weak encryption
- B) The plaintext value is visible in the transaction calldata ✅
- C) It cannot encrypt values larger than 255
- D) It requires a gas subsidy

---

### Question 2

What is the correct Solidity type for receiving a client-encrypted 64-bit unsigned integer?

- A) `einput`
- B) `bytes calldata`
- C) `externalEuint64` ✅
- D) `euint64`

---

### Question 3

What function converts an external encrypted input to an on-chain encrypted type?

- A) `TFHE.asEuint64(input, proof)`
- B) `FHE.decrypt(input)`
- C) `FHE.fromExternal(input, proof)` ✅
- D) `FHE.convert(input)`

---

### Question 4

What additional parameter must accompany `externalEuintXX` in a function signature?

- A) `bytes memory data`
- B) `uint256 nonce`
- C) `bytes calldata proof` ✅
- D) No additional parameter is needed

---

### Question 5

What does the ZK proof bundled with an encrypted input guarantee?

- A) That the plaintext is less than 1000
- B) That the ciphertext is well-formed, the value is in range, and the submitter knows the plaintext ✅
- C) That the transaction was signed correctly
- D) That the gas cost is covered

---

### Question 6

Who performs the ZK proof verification when `FHE.fromExternal(input, proof)` is called?

- A) The client browser
- B) The Gateway service
- C) The FHE co-processor / `FHE.fromExternal(input, proof)` automatically ✅
- D) The contract developer must verify it manually

---

### Question 7

Which client library is used for encrypting values before sending to FHEVM contracts?

- A) `ethers.js`
- B) Relayer SDK (`@zama-fhe/relayer-sdk`) ✅
- C) `openzeppelin.js`
- D) `web3.js`

---

### Question 8

How do you encrypt multiple values in a single transaction (e.g., price and quantity)?

- A) Make separate transactions for each value
- B) Use `createEncryptedInput()`, call `.add64()` and `.add32()` on it, then `.encrypt()` ✅
- C) Concatenate the values into a single `uint256`
- D) Use `FHE.batchEncrypt()`

---

### Question 9

Can you use an `externalEuint32` directly in `FHE.add()`?

- A) Yes, it is automatically converted
- B) No, you must first call `FHE.fromExternal(input, proof)` to get a `euint32` ✅
- C) Yes, but only for addition operations
- D) No, external types cannot be used in contracts at all

---

### Question 10

When should you use `FHE.asEuintXX(value)` instead of `externalEuintXX`?

- A) When the value is a user's secret data
- B) When initializing state to zero or using non-sensitive contract-internal constants ✅
- C) When the value is very large
- D) Never — always use external inputs

---

### Question 11

When encrypting multiple values with `.add32().add64().encrypt()`, how many `inputProof` values are produced?

- A) One per encrypted value
- B) One shared proof for all values in that `encrypt()` call ✅
- C) None — proofs are generated on-chain
- D) Two — one for each type

<details>
<summary>Explanation</summary>
A single `encrypt()` call produces one shared `inputProof` that covers all handles created in that batch. You pass the same `inputProof` to the contract for all encrypted values from that batch.
</details>

---

### Question 12

After calling `FHE.fromExternal(input, proof)`, what must you do before storing the result?

- A) Nothing — it's ready to use
- B) Call `FHE.verify()` to validate the proof
- C) Call `FHE.allowThis()` and `FHE.allow()` to set ACL permissions ✅
- D) Convert it with `FHE.asEuint32()`

<details>
<summary>Explanation</summary>
`FHE.fromExternal()` returns a new encrypted handle. Like all new handles, it has no ACL permissions. You must call `FHE.allowThis(result)` for the contract to use it later, and `FHE.allow(result, msg.sender)` for the sender to decrypt it.
</details>

---

## Scoring

| Score | Rating |
|-------|--------|
| 11-12/12 | Excellent — You are ready for Module 07! |
| 8-10/12 | Good — Review the items you missed. |
| 5-7/12 | Fair — Re-read the lesson before proceeding. |
| 0-4/12 | Needs work — Go through the lesson and exercise again. |
