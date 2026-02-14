# FHEVM Glossary

An A-to-Z reference of terminology used in FHE, fhEVM, and confidential smart contract development.

---

## A

**ACL (Access Control List)**
A per-ciphertext permission system in fhEVM that tracks which addresses (contracts or users) are authorized to operate on or view a specific encrypted value. Every new ciphertext starts with an empty ACL and must be explicitly populated using `FHE.allow()` or `FHE.allowThis()`.

**Allow**
The act of granting an address permission to use an encrypted value. In the new API: `FHE.allow(ciphertext, address)` for persistent permission, `FHE.allowThis(ciphertext)` for the current contract, and `FHE.allowTransient(ciphertext, address)` for single-transaction permission.

**Arithmetic Circuit**
A mathematical representation of a computation as a series of addition and multiplication gates. FHE schemes operate on arithmetic or binary circuits to perform encrypted computation.

---

## B

**BFV (Brakerski-Fan-Vercauteren)**
An FHE scheme based on the Ring Learning With Errors (RLWE) problem. BFV is optimized for integer arithmetic and is one of the major FHE scheme families alongside BGV, CKKS, and TFHE.

**BGV (Brakerski-Gentry-Vaikuntanathan)**
An FHE scheme similar to BFV, designed for modular integer arithmetic. BGV uses modulus switching for noise management.

**Bootstrapping**
The process of refreshing a ciphertext to reduce accumulated noise, enabling further homomorphic operations. Bootstrapping is the key technique that makes Fully Homomorphic Encryption "fully" homomorphic, as it allows unlimited computation depth. In TFHE, bootstrapping is performed after every gate operation (programmable bootstrapping).

**Branchless Programming**
A programming paradigm where control flow does not depend on runtime values. In FHE, since encrypted values cannot be inspected, all conditional logic must be implemented without `if/else` branches, using constructs like `FHE.select()` instead.

---

## C

**Callback** *(Deprecated pattern)*
In earlier fhEVM versions (pre-v0.9), a function that the Gateway called when an asynchronous decryption request was complete. In the current version, decryption uses `FHE.makePubliclyDecryptable()` instead, which does not require callbacks.

**CKKS (Cheon-Kim-Kim-Song)**
An FHE scheme optimized for approximate arithmetic on real numbers. CKKS is commonly used in machine learning on encrypted data but is not used in fhEVM (which uses TFHE for exact integer arithmetic).

**Ciphertext**
The encrypted form of data. In fhEVM, ciphertexts are represented as handles (references) on-chain, while the actual encrypted data lives in the coprocessor. Operations on ciphertexts produce new ciphertexts.

**Confidential Smart Contract**
A smart contract that operates on encrypted data using FHE, ensuring that sensitive values remain private throughout computation. The contract logic is public (on-chain), but the data it processes is encrypted.

**Coprocessor**
A specialized computation engine in fhEVM that performs the actual FHE operations off-chain. The EVM sends encrypted operation requests to the coprocessor, which processes them and returns encrypted results. The coprocessor cannot decrypt the data it processes.

**Cross-Contract ACL**
The challenge of managing encrypted value permissions when one contract passes encrypted values to another. Requires explicit use of `FHE.allowTransient()` or `FHE.allow()` for the calling contract.

---

## D

**Decryption**
The process of converting a ciphertext back to plaintext. In fhEVM, decryption is either done through `FHE.makePubliclyDecryptable()` (on-chain reveal) or through re-encryption (user-specific off-chain decryption via `instance.userDecrypt()`). Decryption requires the network's private key, which is distributed among validators.

**Decryption Oracle** *(Deprecated)*
See "Gateway." The current API uses `FHE.makePubliclyDecryptable()` instead.

**Devnet**
A development network provided by Zama for testing fhEVM contracts with real FHE operations (as opposed to mock mode which simulates FHE locally).

---

## E

**eaddress**
The encrypted address type in fhEVM. Represents an encrypted Ethereum address. Operations available: `FHE.eq`, `FHE.ne`, `FHE.select`.

**ebool**
The encrypted boolean type in fhEVM. Produced by comparison operations (e.g., `FHE.gt`, `FHE.eq`) and consumed by `FHE.select` and boolean logic operations (`FHE.and`, `FHE.or`, `FHE.not`).

**ebytes64 / ebytes128 / ebytes256**
Encrypted byte array types of fixed sizes (64, 128, or 256 bytes). Used for arbitrary encrypted data that does not fit the integer or address types. Note: These types are defined in the type system but have limited FHE operation support in the current version.

**Encrypted Ternary**
See "FHE.select."

**euint8 / euint16 / euint32 / euint64 / euint128 / euint256**
Encrypted unsigned integer types in fhEVM, representing 8-bit through 256-bit encrypted values. Larger types support larger value ranges but incur higher gas costs for operations.

**externalEuintXX**
The type used for encrypted inputs in external function parameters (e.g., `externalEuint32`, `externalEuint64`). These represent raw encrypted data submitted by users via the Relayer SDK (`@zama-fhe/relayer-sdk`). Must be converted to the corresponding `euintXX` type using `FHE.fromExternal()` before use in FHE operations.

**ERC-7984**
A proposed standard for confidential tokens on fhEVM. Defines a standard interface for encrypted ERC-20 tokens with confidential balances and transfer amounts, including functions for encrypted transfers, ACL-gated balance queries, and integration with the fhEVM decryption infrastructure.

---

## F

**FHE (Fully Homomorphic Encryption)**
A form of encryption that allows arbitrary computations to be performed on encrypted data without decrypting it. The result of the computation, when decrypted, matches the result of performing the same computation on the plaintext data. First theorized by Rivest, Adleman, and Dertouzos in 1978 and first realized by Craig Gentry in 2009.

**FHE Library**
The Solidity library in the new fhEVM API that provides all encrypted operations. Imported as `FHE` from `@fhevm/solidity/lib/FHE.sol`. All operations are called as `FHE.add()`, `FHE.select()`, `FHE.allow()`, etc.

**FHE.add / FHE.sub / FHE.mul / FHE.div / FHE.rem**
Arithmetic operations on encrypted integers. Take two encrypted values (or one encrypted and one plaintext) and return an encrypted result.

**FHE.allow**
Grants persistent ACL permission for an address to use an encrypted value: `FHE.allow(ciphertext, address)`.

**FHE.allowThis**
Shortcut for `FHE.allow(ciphertext, address(this))`. Grants the current contract permission to use an encrypted value in future transactions.

**FHE.allowTransient**
Grants temporary ACL permission that expires at the end of the current transaction. Useful for cross-contract interactions.

**FHE.and / FHE.or / FHE.xor / FHE.not**
Bitwise (and boolean) operations on encrypted values. `FHE.and`, `FHE.or`, and `FHE.xor` also work on `ebool` for encrypted boolean logic.

**FHE.asEuintXX**
Converts a plaintext value or casts between encrypted types. For example, `FHE.asEuint32(5)` encrypts the plaintext value 5, and `FHE.asEuint32(euint8Var)` upcasts an `euint8` to `euint32`.

**FHE.eq / FHE.ne / FHE.gt / FHE.ge / FHE.lt / FHE.le**
Comparison operations on encrypted values. All return `ebool` (encrypted boolean).

**FHE.fromExternal**
Converts an external encrypted input (`externalEuintXX`) to the corresponding internal encrypted type (`euintXX`). Must be called on all encrypted function parameters before they can be used in operations.

**FHE.isSenderAllowed**
Checks whether `msg.sender` has ACL permission for a given ciphertext. Returns a plaintext `bool`.

**FHE.max / FHE.min**
Returns the encrypted maximum or minimum of two encrypted values. Equivalent to a comparison followed by a select.

**FHE.neg**
Returns the two's complement negation of an encrypted unsigned integer.

**FHE.randEuintXX**
Generates an encrypted random value of the specified type (e.g., `FHE.randEuint8()`, `FHE.randEuint32()`, `FHE.randEuint64()`). The randomness is generated within the FHE domain and is not observable by any party until decrypted.

**FHE.rotl / FHE.rotr**
Bitwise rotate left and rotate right on encrypted integers.

**FHE.sealoutput** *(Does not exist in v0.10.0)*
`FHE.sealoutput()` is **not** a function in `@fhevm/solidity` v0.10.0. Re-encryption for user-specific reads is handled entirely client-side: the contract returns the encrypted handle (after ACL check), and the client-side Relayer SDK (`@zama-fhe/relayer-sdk`) calls `instance.userDecrypt()` to re-encrypt the ciphertext via the KMS for the user to decrypt locally.

**FHE.select**
The encrypted ternary operator: `FHE.select(ebool condition, euintXX valueIfTrue, euintXX valueIfFalse)`. The fundamental branching primitive in FHE programming, replacing `if/else` for encrypted conditions.

**FHE.shl / FHE.shr**
Bitwise shift left and shift right on encrypted integers.

**fhEVM**
Zama's implementation of Fully Homomorphic Encryption on the Ethereum Virtual Machine. Combines the standard EVM with a TFHE coprocessor to enable confidential smart contracts.

**fhevmjs** *(Superseded)*
The original JavaScript/TypeScript client library for interacting with fhEVM. Has been replaced by the Relayer SDK (`@zama-fhe/relayer-sdk`), which is the current official JS/TS SDK for client-side encryption of inputs, re-encryption for viewing, and key management.

---

## G

**Gas (FHE context)**
The unit of computational cost on the EVM. FHE operations are significantly more expensive in gas than plaintext operations because they involve complex mathematical computations on ciphertexts. Gas costs scale with bit width and operation complexity.

**Gateway** — *(Deprecated)* In earlier fhEVM versions (pre-v0.9), an oracle service for asynchronous decryption via `Gateway.requestDecryption()`. In the current version (v0.9+), decryption uses `FHE.makePubliclyDecryptable()` instead. Do not use the Gateway pattern in new contracts.

**Gentry, Craig**
The computer scientist who constructed the first Fully Homomorphic Encryption scheme in 2009, based on ideal lattices. His PhD thesis ("A Fully Homomorphic Encryption Scheme") is one of the most significant breakthroughs in modern cryptography.

---

## H

**Handle**
The on-chain representation of a ciphertext in fhEVM. A handle is a reference (similar to a pointer) to the actual encrypted data stored in the coprocessor. Operations on handles are translated to FHE operations on the underlying ciphertexts.

**Homomorphic**
The property of an encryption scheme that allows mathematical operations on ciphertexts to correspond to operations on the underlying plaintexts. For example, if `Enc(a) + Enc(b) = Enc(a + b)`, the encryption is homomorphic with respect to addition.

**Hybrid Contract**
A smart contract that uses both encrypted and plaintext values, encrypting only the data that requires confidentiality. Hybrid designs can significantly reduce gas costs compared to fully encrypted contracts.

---

## I

**Information Leakage**
The unintended disclosure of information about encrypted values through observable side channels. In fhEVM, potential leakage vectors include: transaction reverts, gas consumption differences, event emissions, storage access patterns, and timing.

**Input Encryption**
The process of encrypting plaintext data on the client side before submitting it to an fhEVM contract. Performed using the Relayer SDK (`@zama-fhe/relayer-sdk`) and the network's FHE public key.

---

## K

**Key Management**
The system for managing the cryptographic keys used in fhEVM:
- **FHE Public Key:** Used by clients to encrypt inputs. Publicly available.
- **Network Key:** Used by the coprocessor to evaluate FHE operations. Distributed among validators.
- **User Keys:** Used for re-encryption (viewing encrypted data specific to a user).

---

## L

**Lattice-Based Cryptography**
The branch of cryptography underpinning all modern FHE schemes. Security is based on the hardness of lattice problems such as the Learning With Errors (LWE) and Ring-LWE problems. Believed to be quantum-resistant.

**Learning With Errors (LWE)**
A computational problem that is believed to be hard for both classical and quantum computers. LWE and its variants (Ring-LWE, Module-LWE) form the security foundation for TFHE and other FHE schemes.

**Lookup Table (LUT)**
In TFHE, a mechanism for evaluating arbitrary functions during bootstrapping. The programmable bootstrapping technique applies a lookup table to an encrypted value, enabling complex operations beyond simple addition and multiplication.

---

## M

**Mock Mode**
A local testing environment where FHE operations are simulated without actual encryption. The Hardhat fhEVM plugin provides mock mode for fast development iteration. Logic behaves identically to real FHE, but values are not actually encrypted.

**MPC (Multi-Party Computation)**
A cryptographic technique where multiple parties jointly compute a function over their inputs without revealing those inputs to each other. MPC is an alternative to FHE for privacy-preserving computation, with different trade-offs (MPC requires interaction, FHE does not).

---

## N

**Noise**
Random error deliberately added to ciphertexts in FHE schemes. Noise is essential for security but accumulates with each operation. If noise exceeds a threshold, decryption fails. Bootstrapping resets the noise level, enabling further computation.

**Noise Budget**
The amount of noise a ciphertext can tolerate before decryption becomes impossible. Each FHE operation consumes some noise budget. When the budget is exhausted, bootstrapping must be performed.

---

## O

**On-Chain Decryption**
Decryption that produces a plaintext value readable on the blockchain. Triggered by calling `FHE.makePubliclyDecryptable()`, after which the decryption oracle processes the ciphertext. The decrypted value is visible to all chain observers. Contrast with re-encryption, where the value remains encrypted on-chain.

**Overflow (Silent)**
In fhEVM, arithmetic overflow does not cause a revert. Instead, values silently wrap around. For example, `FHE.add` on `euint8` with values 200 and 100 produces 44 (300 mod 256) without any error signal.

---

## P

**Persistent Permission**
An ACL permission that persists across transactions. Set with `FHE.allow()` or `FHE.allowThis()`. The permission remains until the ciphertext is replaced with a new one (which has a fresh, empty ACL).

**Plaintext**
Unencrypted data. In the fhEVM context, plaintext values are standard Solidity types (`uint256`, `bool`, `address`) as opposed to their encrypted counterparts (`euint256`, `ebool`, `eaddress`).

**Programmable Bootstrapping**
A technique specific to TFHE where bootstrapping simultaneously resets noise and applies an arbitrary function (via a lookup table) to the encrypted value. This enables efficient evaluation of complex operations in a single bootstrapping step.

---

## R

**Re-encryption**
The process of transforming a ciphertext encrypted under the network key into a ciphertext encrypted under a specific user's key. This allows the user to decrypt the value client-side without revealing it on-chain. In fhEVM v0.10.0, re-encryption is performed client-side via the Relayer SDK's (`@zama-fhe/relayer-sdk`) `instance.userDecrypt()`, which communicates with the KMS. The contract simply returns the encrypted handle after verifying ACL permissions.

**Ring-LWE (Ring Learning With Errors)**
A variant of the LWE problem defined over polynomial rings. Ring-LWE provides better efficiency than standard LWE while maintaining equivalent security, and is the basis for most practical FHE schemes.

---

## S

**Sealed Output**
See "Re-encryption." In fhEVM v0.10.0, there is no on-chain `sealoutput` function. The contract returns the encrypted handle, and the client-side Relayer SDK (`instance.userDecrypt()`) handles re-encryption for the user.

**Select**
See "FHE.select."

**Side Channel**
An indirect method of extracting information from a system by observing its behavior (gas usage, timing, error patterns) rather than directly accessing the protected data. FHE contracts are susceptible to side-channel attacks through reverts, gas differences, and event emissions.

**Silent Fail**
A design pattern in FHE contracts where an operation that cannot proceed (e.g., transfer with insufficient balance) does nothing instead of reverting. Implemented using `FHE.select()` to choose between the "updated" state and the "unchanged" state. Silent fails prevent information leakage through revert patterns.

---

## T

**TEE (Trusted Execution Environment)**
A hardware-based approach to confidential computing (e.g., Intel SGX, ARM TrustZone). TEEs provide a secure enclave for computation but rely on hardware trust assumptions. FHE provides mathematical privacy guarantees without hardware trust.

**TFHE (Torus Fully Homomorphic Encryption)**
The FHE scheme used by Zama's fhEVM. TFHE operates on bits and small integers, using programmable bootstrapping for efficient gate-by-gate evaluation. TFHE provides exact (not approximate) computation and is particularly well-suited for boolean and integer operations.

**TFHE-rs**
Zama's Rust implementation of the TFHE scheme. The underlying cryptographic engine used by the fhEVM coprocessor.

**Threshold Decryption**
A distributed decryption protocol where the decryption key is split among multiple parties (e.g., validators), and a threshold number must cooperate to decrypt. fhEVM uses threshold decryption to ensure no single party can unilaterally decrypt data.

**Transient Permission**
An ACL permission that exists only for the duration of the current transaction. Set with `FHE.allowTransient()`. Useful for cross-contract calls where permanent permission is not needed.

---

## U

**Underflow (Silent)**
In fhEVM, arithmetic underflow does not cause a revert. `FHE.sub(5, 10)` on `euint8` produces 251 (256 - 5) without error. Always check with `FHE.ge()` and use `FHE.select()` before subtraction if underflow is undesired.

---

## Z

**Zama**
The company behind fhEVM and TFHE-rs. Zama develops open-source FHE tools for blockchain privacy, machine learning on encrypted data, and general-purpose FHE computation.

**ZamaEthereumConfig**
The base contract in the new fhEVM API that provides the necessary configuration for FHE operations. Contracts using fhEVM must inherit from `ZamaEthereumConfig` (imported from `@fhevm/solidity/config/ZamaConfig.sol`).

**Zero-Knowledge Proof (ZK Proof)**
A cryptographic method that allows one party to prove to another that a statement is true without revealing any information beyond the truth of the statement. ZK proofs are complementary to FHE: ZK proves properties about data without revealing it, while FHE computes on data without revealing it.
