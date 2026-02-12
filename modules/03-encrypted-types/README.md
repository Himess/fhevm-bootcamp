# Module 03: Encrypted Types Deep Dive

> Master every encrypted data type available in FHEVM — from booleans to addresses to byte arrays.

| | |
|---|---|
| **Level** | Beginner |
| **Duration** | 2h |
| **Prerequisites** | Module 02 |

## Learning Objectives

By the end of this module, you will be able to:

1. List and describe all encrypted types: `ebool`, `euint4` through `euint256`, `eaddress`, `ebytes64`-`ebytes256`
2. Understand how encrypted values are represented as handles on-chain
3. Choose the correct encrypted type for a given use case
4. Properly store and manage encrypted state variables
5. Convert between plaintext and encrypted types using `FHE.asEuintXX()`

## Contents

- [Lesson](./lesson.md)
- [Slides](./slides/slides.md)
- Contracts: [EncryptedTypes.sol](../../contracts/EncryptedTypes.sol), [TypeConversions.sol](../../contracts/TypeConversions.sol)
- Tests: [EncryptedTypes.test.ts](../../test/EncryptedTypes.test.ts), [TypeConversions.test.ts](../../test/TypeConversions.test.ts)
- [Exercise](./exercise.md)
- [Quiz](./quiz.md)

## Key Concepts

- **Encrypted types** — `ebool`, `euint4`, `euint8`, `euint16`, `euint32`, `euint64`, `euint128`, `euint256`, `eaddress`, `ebytes64`, `ebytes128`, `ebytes256`
- **Handles** — On-chain references (uint256) to ciphertexts stored in the FHE co-processor
- **Type casting** — `FHE.asEuintXX()`, `FHE.asEbool()`, `FHE.asEaddress()`
- **Storage patterns** — How to declare, initialize, and update encrypted state

## Next Module

→ [Module 04: Operations on Encrypted Data](../04-operations/)
