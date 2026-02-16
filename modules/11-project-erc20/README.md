# Module 11: Confidential ERC-20

> Build a privacy-preserving ERC-20 token with fully encrypted balances using FHEVM.

| | |
|---|---|
| **Level** | Advanced |
| **Duration** | 4h |
| **Prerequisites** | Modules 01-10 |

## Learning Objectives

By the end of this module, you will be able to:

1. Implement an ERC-20 token with encrypted balances using `euint64`
2. Use `FHE.select()` to perform privacy-preserving transfers (no information leakage on failure)
3. Apply the ACL pattern for per-user balance access
4. Handle encrypted allowances for delegated transfers
5. Understand why failed transfers must send 0 instead of reverting
6. Connect the confidential ERC-20 to a frontend for encrypted operations

## Contents

- [Lesson](./lesson.md)
- [Slides](./slides/slides.md)
- Contracts: [ConfidentialERC20.sol](../../contracts/ConfidentialERC20.sol)
- Tests: [ConfidentialERC20.test.ts](../../test/ConfidentialERC20.test.ts)
- [Exercise](./exercise.md)
- [Quiz](./quiz.md)

## Key Concepts

- **Encrypted Balances** -- `mapping(address => euint64)` stores balances as ciphertexts
- **Privacy-Preserving Transfer** -- Failed transfers send 0 instead of reverting (no info leakage)
- **`FHE.select()`** -- Conditional logic: pick transfer amount or 0 based on encrypted comparison
- **Encrypted Allowances** -- Delegated spending with encrypted approval amounts
- **ACL on Balances** -- Each user can only decrypt their own balance

## Next Module

> [Module 12: Confidential Voting](../12-project-voting/)
