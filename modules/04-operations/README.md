# Module 04: Operations on Encrypted Data

> Learn every arithmetic, bitwise, and comparison operation available for encrypted types.

| | |
|---|---|
| **Level** | Beginner |
| **Duration** | 2h |
| **Prerequisites** | Module 03 |

## Learning Objectives

By the end of this module, you will be able to:

1. Perform arithmetic operations (add, sub, mul, div, rem) on encrypted integers
2. Use bitwise operations (and, or, xor, not, shl, shr, rotl, rotr) on encrypted data
3. Apply comparison operations (eq, ne, gt, ge, lt, le) returning encrypted booleans
4. Understand min/max operations on encrypted values
5. Recognize type compatibility rules and overflow behavior

## Contents

- [Lesson](./lesson.md)
- [Slides](./slides/slides.md)
- Contracts: [ArithmeticOps.sol](../../contracts/ArithmeticOps.sol), [BitwiseOps.sol](../../contracts/BitwiseOps.sol), [ComparisonOps.sol](../../contracts/ComparisonOps.sol), [ConditionalDemo.sol](../../contracts/ConditionalDemo.sol), [EncryptedMinMax.sol](../../contracts/EncryptedMinMax.sol)
- Tests: [ArithmeticOps.test.ts](../../test/ArithmeticOps.test.ts), [BitwiseOps.test.ts](../../test/BitwiseOps.test.ts), [ComparisonOps.test.ts](../../test/ComparisonOps.test.ts)
- [Exercise](./exercise.md)
- [Quiz](./quiz.md)

## Key Concepts

- **Arithmetic** — `FHE.add()`, `FHE.sub()`, `FHE.mul()`, `FHE.div()`, `FHE.rem()`
- **Bitwise** — `FHE.and()`, `FHE.or()`, `FHE.xor()`, `FHE.not()`, `FHE.shl()`, `FHE.shr()`
- **Comparison** — `FHE.eq()`, `FHE.ne()`, `FHE.gt()`, `FHE.ge()`, `FHE.lt()`, `FHE.le()`
- **Conditional** — `FHE.select(ebool, a, b)` for branch-free encrypted logic
- **Shift/Rotate** — `FHE.shl()`, `FHE.shr()`, `FHE.rotl()`, `FHE.rotr()` (shift amount always euint8/uint8)
- **Min/Max** — `FHE.min()`, `FHE.max()`
- **Negation** — `FHE.neg()`

## Next Module

→ [Module 05: Access Control (ACL)](../05-access-control/)
