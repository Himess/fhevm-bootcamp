# Module 06: Encrypted Inputs & ZK Proofs

> Learn how users submit truly private data to smart contracts using client-side encryption and zero-knowledge proofs.

| | |
|---|---|
| **Level** | Intermediate |
| **Duration** | 3h |
| **Prerequisites** | Module 05 |

## Learning Objectives

By the end of this module, you will be able to:

1. Explain why `FHE.asEuintXX()` with plaintext parameters is not truly private
2. Understand `externalEuintXX` types and the client-side encryption flow
3. Use `FHE.fromExternal()` to convert externally encrypted inputs to on-chain encrypted types
4. Implement contract functions that accept encrypted inputs
5. Understand the role of ZK proofs in validating encrypted inputs

## Contents

- [Lesson](./lesson.md)
- [Slides](./slides/slides.md)
- Contracts: [SecureInput.sol](../../contracts/SecureInput.sol)
- Tests: [SecureInput.test.ts](../../test/SecureInput.test.ts)
- [Exercise](./exercise.md)
- [Quiz](./quiz.md)

## Key Concepts

- **`externalEuintXX`** — Solidity type representing client-encrypted input data
- **`FHE.fromExternal()`** — Converts external encrypted input to an on-chain encrypted type
- **Client-side encryption** — Encrypting data before submitting to the blockchain
- **ZK proofs** — Proving the encrypted input is well-formed without revealing the plaintext

## Next Module

→ [Module 07: Decryption Patterns](../07-decryption/)
