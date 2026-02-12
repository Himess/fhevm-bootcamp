# Module 07: Decryption Patterns

> Learn the different ways to retrieve plaintext values from encrypted data — public decryption, user-specific reencryption, and the Gateway/KMS architecture.

| | |
|---|---|
| **Level** | Intermediate |
| **Duration** | 2h |
| **Prerequisites** | Module 06 |

## Learning Objectives

By the end of this module, you will be able to:

1. Explain the difference between public decryption and user-specific reencryption
2. Request asynchronous decryption through the Gateway
3. Implement callback-based decryption patterns in contracts
4. Understand the KMS (Key Management Service) role in decryption
5. Use reencryption to let individual users view their own encrypted data

## Contents

- [Lesson](./lesson.md)
- [Slides](./slides/slides.md)
- Contracts: [PublicDecrypt.sol](../../contracts/PublicDecrypt.sol), [UserDecrypt.sol](../../contracts/UserDecrypt.sol)
- Tests: [PublicDecrypt.test.ts](../../test/PublicDecrypt.test.ts), [UserDecrypt.test.ts](../../test/UserDecrypt.test.ts)
- [Exercise](./exercise.md)
- [Quiz](./quiz.md)

## Key Concepts

- **Public decryption** — Reveals plaintext to everyone (on-chain state change)
- **Reencryption** — Re-encrypts data under a user's key so only they can decrypt
- **Gateway** — Off-chain service that coordinates decryption requests
- **KMS (Key Management Service)** — Threshold decryption service for the FHE secret key
- **Asynchronous decryption** — Decryption is not instant; uses a callback pattern

## Next Module

→ [Module 08: Conditional Logic](../08-conditional-logic/)
