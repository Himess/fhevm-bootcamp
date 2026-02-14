# Module 17: Advanced FHE Design Patterns

> Master sophisticated patterns for building production-grade confidential applications.

| | |
|---|---|
| **Level** | Expert |
| **Duration** | 4h |
| **Prerequisites** | Modules 00-16 |

## Learning Objectives

1. Implement encrypted state machines with threshold-based transitions
2. Apply the LastError pattern for encrypted error handling
3. Design encrypted key-value registries with sharing capabilities
4. Build composable encrypted contracts
5. Handle cross-contract encrypted data flow

## Contents

- [Lesson](./lesson.md)
- [Slides](./slides/slides.md)
- Contracts: [EncryptedStateMachine.sol](../../contracts/EncryptedStateMachine.sol), [LastErrorPattern.sol](../../contracts/LastErrorPattern.sol), [EncryptedRegistry.sol](../../contracts/EncryptedRegistry.sol)
- Tests: [EncryptedStateMachine.test.ts](../../test/EncryptedStateMachine.test.ts), [LastErrorPattern.test.ts](../../test/LastErrorPattern.test.ts), [EncryptedRegistry.test.ts](../../test/EncryptedRegistry.test.ts)
- [Exercise](./exercise.md)
- [Quiz](./quiz.md)

## Key Concepts

- **Encrypted State Machine** -- State transitions driven by encrypted thresholds
- **LastError Pattern** -- Encrypted error codes for non-reverting feedback
- **Encrypted Registry** -- Key-value storage with per-user encryption and sharing
- **Composability** -- Passing encrypted values between contracts via ACL
- **Cross-Contract ACL** -- Granting contract-to-contract permissions for encrypted data

## Next Module

> [Module 18: Confidential DeFi](../18-confidential-defi/)
