# Module 16: Security Best Practices for FHE

> Learn to identify and prevent FHE-specific vulnerabilities that don't exist in traditional smart contracts.

| | |
|---|---|
| **Level** | Advanced |
| **Duration** | 3h |
| **Prerequisites** | Modules 00-15 |

## Learning Objectives

1. Identify FHE-specific attack vectors and vulnerabilities
2. Apply the select pattern to prevent information leakage
3. Implement proper ACL management for all encrypted values
4. Validate encrypted inputs and handle edge cases
5. Implement the LastError pattern for secure user feedback
6. Conduct a security audit on FHE contracts

## Contents

- [Lesson](./lesson.md)
- [Slides](./slides/slides.md)
- Contracts: [SecurityPatterns.sol](../../contracts/SecurityPatterns.sol), [VulnerableDemo.sol](../../contracts/VulnerableDemo.sol)
- Tests: [SecurityPatterns.test.ts](../../test/SecurityPatterns.test.ts), [VulnerableDemo.test.ts](../../test/VulnerableDemo.test.ts)
- [Exercise](./exercise.md)
- [Quiz](./quiz.md)

## Key Concepts

- **Information Leakage** -- Gas differences, revert patterns, and storage access can reveal encrypted data
- **ACL Hygiene** -- Every new encrypted value must have explicit permissions set
- **Input Validation** -- Always check FHE.isInitialized() for encrypted parameters
- **Uniform Execution** -- Use FHE.select() instead of if/else to prevent gas-based side channels
- **DoS Prevention** -- Rate-limit expensive FHE operations
- **LastError Pattern** -- Encrypted error codes for user feedback without information leakage

## Next Module

> [Module 17: Advanced FHE Design Patterns](../17-advanced-patterns/)
