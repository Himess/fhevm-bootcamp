# Module 05: Access Control (ACL)

> Understand and implement the FHEVM Access Control List system that governs who can use encrypted data.

| | |
|---|---|
| **Level** | Intermediate |
| **Duration** | 3h |
| **Prerequisites** | Module 04 |

## Learning Objectives

By the end of this module, you will be able to:

1. Explain why ACL is necessary for encrypted data on a public blockchain
2. Use `FHE.allow()` to grant specific addresses access to ciphertexts
3. Use `FHE.allowThis()` to grant the current contract access
4. Use `FHE.allowTransient()` for temporary, transaction-scoped permissions
5. Check permissions with `FHE.isSenderAllowed()`
6. Design secure ACL patterns for multi-contract architectures

## Contents

- [Lesson](./lesson.md)
- [Slides](./slides/slides.md)
- Contracts: [ACLDemo.sol](../../contracts/ACLDemo.sol), [MultiUserVault.sol](../../contracts/MultiUserVault.sol), [UserDecrypt.sol](../../contracts/UserDecrypt.sol), [PublicDecrypt.sol](../../contracts/PublicDecrypt.sol)
- Tests: [ACLDemo.test.ts](../../test/ACLDemo.test.ts), [MultiUserVault.test.ts](../../test/MultiUserVault.test.ts)
- [Exercise](./exercise.md)
- [Quiz](./quiz.md)

## Key Concepts

- **ACL (Access Control List)** — On-chain permission system for ciphertexts
- **`FHE.allow(handle, address)`** — Persistent permission grant
- **`FHE.allowThis(handle)`** — Grant the current contract access
- **`FHE.allowTransient(handle, address)`** — Transaction-scoped permission
- **`FHE.isSenderAllowed(handle)`** — Check if `msg.sender` has access
- **`FHE.makePubliclyDecryptable(handle)`** — Make ciphertext decryptable by anyone

## Next Module

→ [Module 06: Encrypted Inputs & ZK Proofs](../06-encrypted-inputs/)
