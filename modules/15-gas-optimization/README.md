# Module 15: Gas Optimization for FHE

> Learn to minimize gas costs in FHE contracts where every encrypted operation costs 10-100x more than plaintext equivalents.

| | |
|---|---|
| **Level** | Advanced |
| **Duration** | 3h |
| **Prerequisites** | Modules 00-14 |

## Learning Objectives

1. Understand the gas cost model for FHE operations
2. Choose the right encrypted type size for each use case
3. Apply optimization patterns to reduce gas consumption
4. Profile and benchmark FHE contract gas usage
5. Identify and eliminate unnecessary encrypted operations

## Contents

- [Lesson](./lesson.md)
- [Slides](./slides/slides.md)
- Contracts: [GasOptimized.sol](../../contracts/GasOptimized.sol), [GasBenchmark.sol](../../contracts/GasBenchmark.sol)
- Tests: [GasOptimized.test.ts](../../test/GasOptimized.test.ts), [GasBenchmark.test.ts](../../test/GasBenchmark.test.ts)
- [Exercise](./exercise.md)
- [Quiz](./quiz.md)

## Key Concepts

- **Type Size Matters** -- euint8 operations cost less than euint64
- **Plaintext Operands** -- Using plaintext as second operand saves significant gas
- **Batch Processing** -- Grouping operations reduces per-operation overhead
- **Caching** -- Store intermediate encrypted results to avoid recomputation
- **Lazy Evaluation** -- Defer expensive operations until absolutely needed

## Next Module

> [Module 16: Security Best Practices for FHE](../16-security/)
