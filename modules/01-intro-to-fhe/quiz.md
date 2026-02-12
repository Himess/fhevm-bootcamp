# Module 01 - Quiz: Introduction to FHE

Test your understanding of Fully Homomorphic Encryption and its application to blockchain. Each question has one correct answer.

---

### Question 1

What is the key property of Homomorphic Encryption that distinguishes it from traditional encryption?

- A) It uses larger key sizes for stronger security
- B) It allows computation directly on encrypted data without decrypting it
- C) It is faster than AES encryption
- D) It eliminates the need for encryption keys entirely

<details>
<summary>Answer</summary>

**B) It allows computation directly on encrypted data without decrypting it**

Homomorphic encryption is unique because you can perform arithmetic operations on ciphertexts, and the decrypted result matches what you would get from computing on the original plaintexts.
</details>

---

### Question 2

What is the main difference between Partially Homomorphic Encryption (PHE) and Fully Homomorphic Encryption (FHE)?

- A) PHE is more secure than FHE
- B) PHE supports only one type of operation (add OR multiply), while FHE supports both with unlimited operations
- C) FHE can only work with boolean values
- D) PHE is newer and more efficient than FHE

<details>
<summary>Answer</summary>

**B) PHE supports only one type of operation (add OR multiply), while FHE supports both with unlimited operations**

PHE schemes like RSA (multiplication) or Paillier (addition) support only one operation type. FHE supports both addition and multiplication for an unlimited number of operations, enabling arbitrary computations.
</details>

---

### Question 3

What technique does FHE use to prevent noise from accumulating and corrupting ciphertexts after many operations?

- A) Key rotation
- B) Bootstrapping
- C) Hash chaining
- D) Zero-knowledge proofs

<details>
<summary>Answer</summary>

**B) Bootstrapping**

Bootstrapping is a procedure that "refreshes" a ciphertext by reducing its noise level. This is the breakthrough technique (first described by Craig Gentry in 2009) that makes unlimited homomorphic operations possible.
</details>

---

### Question 4

Why is the Solidity `private` keyword insufficient for data privacy on Ethereum?

- A) The compiler ignores the `private` keyword
- B) Private variables can still be read directly from blockchain storage by anyone
- C) Private variables are automatically published in transaction logs
- D) The `private` keyword only works on testnets

<details>
<summary>Answer</summary>

**B) Private variables can still be read directly from blockchain storage by anyone**

The `private` keyword only prevents other contracts from reading the variable via Solidity. Anyone can read any storage slot on-chain using `eth_getStorageAt` or similar tools. There is no true data privacy on a public blockchain by default.
</details>

---

### Question 5

Which privacy solution requires trust in hardware manufacturers?

- A) Zero-Knowledge Proofs
- B) Multi-Party Computation
- C) Trusted Execution Environments (TEE)
- D) Fully Homomorphic Encryption

<details>
<summary>Answer</summary>

**C) Trusted Execution Environments (TEE)**

TEEs like Intel SGX and ARM TrustZone rely on special hardware to create secure enclaves. You must trust that the hardware manufacturer has not introduced backdoors and that the hardware is resistant to side-channel attacks.
</details>

---

### Question 6

In the fhEVM architecture, which component performs the actual FHE computations (addition, multiplication, comparison on ciphertexts)?

- A) The Gateway
- B) The KMS
- C) The Coprocessor
- D) The user's browser

<details>
<summary>Answer</summary>

**C) The Coprocessor**

The Coprocessor is the computational engine that executes FHE operations. When a smart contract calls functions like `FHE.add()` or `FHE.le()`, the heavy cryptographic computation is delegated to the Coprocessor.
</details>

---

### Question 7

What is the role of the Gateway in the fhEVM architecture?

- A) It compiles Solidity contracts to FHE circuits
- B) It stores all encrypted data on IPFS
- C) It enforces access control for decryption requests
- D) It generates the global FHE key pair

<details>
<summary>Answer</summary>

**C) It enforces access control for decryption requests**

The Gateway mediates decryption requests. It checks on-chain ACL (Access Control List) permissions to verify that the requesting address is authorized to decrypt a given value, then coordinates with the KMS for threshold decryption.
</details>

---

### Question 8

Which of the following is an encrypted data type available in fhEVM?

- A) `efloat`
- B) `euint64`
- C) `estring`
- D) `emap`

<details>
<summary>Answer</summary>

**B) `euint64`**

fhEVM provides encrypted versions of integer types (`euint4` through `euint256`), `ebool`, `eaddress`, and `ebytes` variants. There is no `efloat`, `estring`, or `emap` type.
</details>

---

### Question 9

How does FHE-based private voting improve upon standard on-chain governance?

- A) It makes voting faster
- B) It reduces gas costs for voting transactions
- C) Individual votes are encrypted, preventing coercion and vote buying, with only the final tally decrypted
- D) It allows votes to be changed after submission

<details>
<summary>Answer</summary>

**C) Individual votes are encrypted, preventing coercion and vote buying, with only the final tally decrypted**

With FHE voting, each vote is encrypted. The smart contract tallies encrypted votes homomorphically. Individual votes are never visible during or after the voting period -- only the final aggregated result is decrypted. This creates a true secret ballot.
</details>

---

### Question 10

What is the primary trade-off of using FHE compared to other privacy solutions?

- A) FHE requires hardware trust assumptions
- B) FHE can only perform addition, not multiplication
- C) FHE has significant computational overhead (operations are much slower than plaintext)
- D) FHE data cannot be stored on-chain

<details>
<summary>Answer</summary>

**C) FHE has significant computational overhead (operations are much slower than plaintext)**

FHE provides the strongest privacy guarantee (data is never decrypted during computation, no hardware trust needed), but at the cost of performance. Operations on ciphertexts are 10x to 1000x slower than on plaintext. This is the fundamental trade-off, though performance is improving rapidly.
</details>

---

## Scoring

| Score   | Assessment                                    |
|---------|-----------------------------------------------|
| 9-10    | Excellent -- you have a strong grasp of FHE theory |
| 7-8     | Good -- review the topics you missed          |
| 5-6     | Fair -- re-read the relevant lesson sections  |
| Below 5 | Review the entire lesson before proceeding    |
