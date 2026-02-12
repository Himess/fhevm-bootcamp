# Module 01 - Exercises: Introduction to FHE

## Exercise 1: Encryption Fundamentals (15 min)

### Part A: Classify the Encryption Type
For each scenario, identify if it uses **symmetric** or **asymmetric** encryption:

1. Alice sends Bob a message using his public key
2. A company encrypts its database with a single master key
3. SSH key-pair authentication
4. AES-256 encrypted file storage
5. TLS certificate verification

<details>
<summary>Answer Key</summary>

1. Asymmetric — uses Bob's public key, only his private key decrypts
2. Symmetric — single master key for both encrypt/decrypt
3. Asymmetric — SSH uses public/private key pairs
4. Symmetric — AES is a symmetric cipher
5. Asymmetric — certificates use public/private keys
</details>

### Part B: Homomorphic Encryption Properties
Given plaintext values a=5 and b=3, and an FHE scheme where E(x) represents encryption:

1. If we compute `FHE.add(E(5), E(3))` and decrypt the result, what do we get?
2. If we compute `FHE.mul(E(5), E(3))` and decrypt the result, what do we get?
3. Why can't we simply check `E(5) == E(5)` to see if two encrypted values are equal?

<details>
<summary>Answer Key</summary>

1. 8 — homomorphic addition preserves the plaintext addition
2. 15 — homomorphic multiplication preserves the plaintext multiplication
3. Encrypted values include randomness (nonce), so encrypting the same plaintext twice produces different ciphertexts. Instead, we use `FHE.eq(E(5), E(5))` which returns an encrypted boolean.
</details>

## Exercise 2: FHE Scheme Comparison (10 min)

Fill in the table:

| Feature | PHE | SHE | FHE |
|---------|-----|-----|-----|
| Addition | ? | ? | ? |
| Multiplication | ? | ? | ? |
| Unlimited Operations | ? | ? | ? |
| Real-world example | ? | ? | ? |

<details>
<summary>Answer Key</summary>

| Feature | PHE | SHE | FHE |
|---------|-----|-----|-----|
| Addition | Yes (additive) or Yes (multiplicative) | Yes | Yes |
| Multiplication | No (additive) or Yes (multiplicative) | Yes | Yes |
| Unlimited Operations | Yes (for supported op) | No (noise budget) | Yes (bootstrapping) |
| Real-world example | RSA (multiplicative), Paillier (additive) | BGV, BFV | TFHE (Zama) |
</details>

## Exercise 3: Privacy Solution Comparison (10 min)

For each use case, which privacy technology is BEST suited and why?

1. Proving you are over 18 without revealing your exact age
2. Computing average salary across companies without any company seeing others' data
3. Running an encrypted smart contract where the computation itself is confidential
4. Processing data in a secure cloud environment

<details>
<summary>Answer Key</summary>

1. **ZK-Proofs** — ideal for proving a property without revealing the underlying data
2. **MPC** — multiple parties can jointly compute without revealing individual inputs
3. **FHE (fhEVM)** — compute on encrypted data on-chain without ever decrypting
4. **TEE** — hardware-level isolation for data processing (but requires trust in hardware)
</details>

## Exercise 4: fhEVM Architecture (15 min)

### Part A: Component Matching
Match each fhEVM component with its role:

| Component | Role |
|-----------|------|
| 1. FHE Library (FHE.sol) | A. Stores encryption/decryption keys securely |
| 2. Coprocessor | B. Provides Solidity API for encrypted operations |
| 3. Gateway | C. Executes heavy FHE computations off-chain |
| 4. KMS (Key Management Service) | D. Mediates decryption requests between chain and KMS |

<details>
<summary>Answer Key</summary>

1-B, 2-C, 3-D, 4-A
</details>

### Part B: Transaction Flow
Order these steps for an encrypted token transfer on fhEVM:

- [ ] FHE.le() compares encrypted balance with encrypted amount
- [ ] User encrypts transfer amount client-side
- [ ] FHE.sub() and FHE.add() update encrypted balances
- [ ] User submits encrypted input with proof to the contract
- [ ] FHE.select() chooses: if sufficient balance, transfer; else no change
- [ ] FHE.fromExternal() verifies and converts the input
- [ ] FHE.allow() grants access to new balance for sender and receiver

<details>
<summary>Answer Key</summary>

Correct order:
1. User encrypts transfer amount client-side
2. User submits encrypted input with proof to the contract
3. FHE.fromExternal() verifies and converts the input
4. FHE.le() compares encrypted balance with encrypted amount
5. FHE.select() chooses: if sufficient balance, transfer; else no change
6. FHE.sub() and FHE.add() update encrypted balances
7. FHE.allow() grants access to new balance for sender and receiver
</details>

## Exercise 5: About Zama (5 min)

Answer the following questions about Zama:

1. What is Zama's core technology contribution to the blockchain space?
2. Name two key products/libraries that Zama provides.
3. What does TFHE stand for and why is it significant for fhEVM?

<details>
<summary>Answer Key</summary>

1. Zama provides open-source FHE (Fully Homomorphic Encryption) tools for blockchain and AI, enabling computation on encrypted data.
2. fhEVM (encrypted smart contracts), TFHE-rs (Rust FHE library), Concrete (FHE compiler), Concrete ML (encrypted ML).
3. TFHE = Torus Fully Homomorphic Encryption. It is significant because it supports fast bootstrapping, enabling unlimited encrypted computations without noise accumulation, making it practical for smart contract execution.
</details>
