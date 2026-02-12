# Module 09: On-Chain Randomness

> Generate truly unpredictable encrypted random numbers using the FHE co-processor.

| | |
|---|---|
| **Level** | Intermediate |
| **Duration** | 2h |
| **Prerequisites** | Module 08 |

## Learning Objectives

By the end of this module, you will be able to:

1. Explain why traditional on-chain randomness is problematic and how FHE solves it
2. Generate encrypted random values using `FHE.randEuintXX()` and `FHE.randEbool()`
3. Produce random numbers within a specific range
4. Build practical applications using encrypted randomness (lottery, shuffling, games)
5. Understand the security properties of FHE-based randomness

## Contents

- [Lesson](./lesson.md)
- [Slides](./slides/slides.md)
- [Exercise](./exercise.md)
- [Quiz](./quiz.md)

## Contracts

- `contracts/RandomDemo.sol` - Random number generation demos
- `contracts/EncryptedLottery.sol` - Encrypted lottery (buy ticket, draw winner, claim)

## Key Concepts

- **`FHE.randEuintXX()`** - Generate encrypted random unsigned integers
- **`FHE.randEbool()`** - Generate encrypted random booleans
- **Random in range** - Using `FHE.rem()` with random values
- **Unbiased randomness** - The random value is encrypted, so nobody can predict or front-run it

## Next Module

-> [Module 10: Frontend Integration](../10-frontend-integration/)
