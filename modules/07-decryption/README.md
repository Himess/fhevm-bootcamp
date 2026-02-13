# Module 07: Decryption Patterns

> Learn how to retrieve plaintext values from encrypted data — public decryption via `FHE.makePubliclyDecryptable()` and user-specific reencryption via ACL.

| | |
|---|---|
| **Level** | Intermediate |
| **Duration** | 2h |
| **Prerequisites** | Module 06 |

## Learning Objectives

By the end of this module, you will be able to:

1. Explain the difference between public decryption and user-specific reencryption
2. Use `FHE.makePubliclyDecryptable()` to reveal encrypted data publicly
3. Use `FHE.allow()` and the userDecrypt pattern for user-specific decryption
4. Write Hardhat tests that decrypt encrypted values
5. Understand when and why to decrypt — and when not to
6. (Advanced) Understand the Gateway/KMS architecture for production

## Contents

- [Lesson](./lesson.md)
- [Slides](./slides/slides.md)
- Contracts: [PublicDecrypt.sol](../../contracts/PublicDecrypt.sol), [UserDecrypt.sol](../../contracts/UserDecrypt.sol), [RevealableAuction.sol](../../contracts/RevealableAuction.sol)
- Tests: [PublicDecrypt.test.ts](../../test/PublicDecrypt.test.ts), [UserDecrypt.test.ts](../../test/UserDecrypt.test.ts), [RevealableAuction.test.ts](../../test/RevealableAuction.test.ts)
- [Exercise](./exercise.md)
- [Quiz](./quiz.md)

## Key Concepts

- **Public decryption** — `FHE.makePubliclyDecryptable(handle)` makes ciphertext publicly readable
- **User reencryption** — Client-side decryption for authorized users via ACL
- **`fhevm.userDecryptEuint()`** / **`fhevm.userDecryptEbool()`** — Hardhat test decryption API
- **`FHE.isSenderAllowed()`** — Guard view functions that return encrypted handles
- **Gateway** — Production service for async decryption (advanced, not used in Hardhat)

## Next Module

→ [Module 08: Conditional Logic](../08-conditional-logic/)
