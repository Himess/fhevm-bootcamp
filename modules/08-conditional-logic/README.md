# Module 08: Conditional Logic

> Master branch-free programming with `FHE.select()` — the encrypted equivalent of if/else.

| | |
|---|---|
| **Level** | Intermediate |
| **Duration** | 3h |
| **Prerequisites** | Module 07 |

## Learning Objectives

By the end of this module, you will be able to:

1. Explain why traditional `if/else` branching cannot be used with encrypted values
2. Use `FHE.select()` as the encrypted conditional operator
3. Implement clamp, min, max, and bounded arithmetic using `FHE.select()`
4. Build complex multi-condition logic without branching
5. Recognize and avoid common branch-free programming pitfalls

## Contents

- [Lesson](./lesson.md)
- [Slides](./slides/slides.md)
- Contracts: [ConditionalDemo.sol](../../contracts/ConditionalDemo.sol), [EncryptedMinMax.sol](../../contracts/EncryptedMinMax.sol)
- Tests: [ConditionalDemo.test.ts](../../test/ConditionalDemo.test.ts), [EncryptedMinMax.test.ts](../../test/EncryptedMinMax.test.ts)
- [Exercise](./exercise.md)
- [Quiz](./quiz.md)

## Key Concepts

- **`FHE.select(condition, ifTrue, ifFalse)`** — Encrypted ternary operator
- **Branch-free programming** — Computing all branches and selecting the result
- **Encrypted clamp/min/max** — Bounding values without revealing them
- **Nested selects** — Building multi-way conditional logic

## Next Module

→ [Module 09: On-Chain Randomness](../09-random/)
