# Module 14: Testing & Debugging FHE Contracts

> Master the unique challenges of testing and debugging contracts where you cannot see the values being computed.

| | |
|---|---|
| **Level** | Advanced |
| **Duration** | 3h |
| **Prerequisites** | Modules 00-13 |

## Learning Objectives

By the end of this module, you will be able to:

1. Set up and configure the fhEVM mock testing environment
2. Write comprehensive tests for encrypted operations
3. Debug encrypted contracts without seeing intermediate values
4. Handle FHE-specific testing challenges
5. Use events and return values as debugging signals
6. Test ACL permissions and multi-user scenarios

## Contents

- [Lesson](./lesson.md)
- [Slides](./slides/slides.md)
- Contracts: [TestableVault.sol](../../contracts/TestableVault.sol)
- Tests: [TestableVault.test.ts](../../test/TestableVault.test.ts)
- [Exercise](./exercise.md)
- [Quiz](./quiz.md)

## Key Concepts

- **Mock Environment** -- @fhevm/hardhat-plugin provides a mock FHE environment for local testing
- **Encrypted Input** -- Creating valid encrypted inputs with proofs for test transactions
- **Decrypt in Tests** -- Using fhevm.userDecryptEuint() to verify encrypted state
- **Event-Driven Debugging** -- Using events as the primary debugging tool since console.log can't show encrypted values
- **ACL Testing** -- Verifying that permission boundaries work correctly
- **Silent Failures** -- FHE operations don't revert on overflow/underflow; testing requires careful state verification

## Next Module

> [Module 15: Gas Optimization for FHE](../15-gas-optimization/)
