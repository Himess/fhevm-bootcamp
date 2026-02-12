# Module 02: FHEVM Development Setup

> Set up your development environment and deploy your first encrypted smart contract.

| | |
|---|---|
| **Level** | Beginner |
| **Duration** | 1h |
| **Prerequisites** | Module 01 |

## Learning Objectives

By the end of this module, you will be able to:

1. Install and configure all required tooling for FHEVM development
2. Initialize a Hardhat project with the FHEVM Solidity library
3. Understand the `ZamaEthereumConfig` configuration pattern
4. Write, compile, and deploy a minimal encrypted contract
5. Run basic tests against a local FHEVM node

## Contents

- [Lesson](./lesson.md)
- [Slides](./slides/slides.md)
- Contracts: [HelloFHEVM.sol](../../contracts/HelloFHEVM.sol)
- Tests: [HelloFHEVM.test.ts](../../test/HelloFHEVM.test.ts)
- [Exercise](./exercise.md)
- [Quiz](./quiz.md)

## Key Concepts

- **Hardhat + FHEVM plugin** — The primary development framework
- **`@fhevm/solidity`** — The Solidity library providing `FHE` operations
- **`ZamaEthereumConfig`** — Pre-built configuration for the Ethereum Sepolia network
- **Local devnet** — A local FHEVM-enabled node for testing

## Next Module

→ [Module 03: Encrypted Types Deep Dive](../03-encrypted-types/)
