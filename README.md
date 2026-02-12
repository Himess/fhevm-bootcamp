# FHEVM Bootcamp Curriculum

**A comprehensive, hands-on training program for building confidential smart contracts with Fully Homomorphic Encryption on the EVM.**

> Build smart contracts where data stays encrypted during computation. No decryption needed. No trusted third parties. Just math.

---

## What is FHEVM?

FHEVM brings Fully Homomorphic Encryption (FHE) to the Ethereum Virtual Machine. It allows smart contracts to operate on encrypted data without ever decrypting it. This enables a new class of on-chain applications where sensitive data --- balances, votes, bids, medical records --- remains confidential throughout the entire computation lifecycle.

This bootcamp teaches you to design, develop, audit, and deploy FHE-powered smart contracts using **Zama's fhEVM** stack and the latest `FHE` Solidity library.

---

## Quick Start

### Prerequisites

| Requirement | Minimum Version |
|---|---|
| Node.js | 20+ |
| npm / pnpm | 10+ / 9+ |
| Solidity knowledge | Intermediate |
| Hardhat or Foundry | Latest |
| Git | 2.40+ |

### Setup

```bash
# Clone the bootcamp repository
git clone https://github.com/your-org/fhevm-bootcamp.git
cd fhevm-bootcamp

# Install dependencies
npm install

# Install the fhEVM Solidity library
npm install fhevm

# Verify installation
npx hardhat compile
```

### Your First Encrypted Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract HelloFHEVM is ZamaEthereumConfig {
    euint32 private secretNumber;

    function setSecret(externalEuint32 encryptedValue, bytes calldata proof) external {
        secretNumber = FHE.fromExternal(encryptedValue, proof);
        FHE.allowThis(secretNumber);
    }

    function addToSecret(externalEuint32 encryptedValue, bytes calldata proof) external {
        euint32 input = FHE.fromExternal(encryptedValue, proof);
        secretNumber = FHE.add(secretNumber, input);
        FHE.allowThis(secretNumber);
    }
}
```

---

## Curriculum Overview

This bootcamp consists of **15 modules** organized into four progressive phases. Each module includes lecture content, code examples, hands-on exercises, and assessments.

### Module Map

| # | Module | Level | Duration | Phase |
|---|---|---|---|---|
| 00 | [Prerequisites & Solidity Review](modules/00-prerequisites/) | Beginner | 2 hrs | Foundation |
| 01 | [Introduction to FHE](modules/01-intro-to-fhe/) | Beginner | 2 hrs | Foundation |
| 02 | [Development Setup](modules/02-development-setup/) | Beginner | 2 hrs | Foundation |
| 03 | [Encrypted Types](modules/03-encrypted-types/) | Beginner | 3 hrs | Foundation |
| 04 | [Operations (Arithmetic, Bitwise, Comparison)](modules/04-operations/) | Intermediate | 3 hrs | Core |
| 05 | [Access Control (ACL)](modules/05-access-control/) | Intermediate | 3 hrs | Core |
| 06 | [Encrypted Inputs & Proofs](modules/06-encrypted-inputs/) | Intermediate | 3 hrs | Core |
| 07 | [Decryption Patterns](modules/07-decryption/) | Intermediate | 3 hrs | Core |
| 08 | [Conditional Logic](modules/08-conditional-logic/) | Intermediate | 3 hrs | Core |
| 09 | [On-Chain Randomness](modules/09-random/) | Intermediate | 2 hrs | Core |
| 10 | [Frontend Integration](modules/10-frontend-integration/) | Intermediate | 3 hrs | Applications |
| 11 | [Confidential ERC-20](modules/11-project-erc20/) | Advanced | 4 hrs | Applications |
| 12 | [Confidential Voting](modules/12-project-voting/) | Advanced | 4 hrs | Applications |
| 13 | [Sealed-Bid Auction](modules/13-project-auction/) | Advanced | 4 hrs | Applications |
| 14 | [Capstone: Confidential DAO](modules/14-capstone/) | Advanced | 5 hrs | Capstone |

**Total Duration: ~46 hours**

### Phase Breakdown

```
Phase 1: Foundation (Modules 00-03)           ~9 hours
  Solidity review, FHE concepts, development setup, encrypted types.

Phase 2: Core Development (Modules 04-09)     ~17 hours
  Operations, ACL, encrypted inputs, decryption, conditional logic, randomness.

Phase 3: Applications (Modules 10-13)         ~15 hours
  Frontend integration, confidential ERC-20, voting, sealed-bid auction.

Phase 4: Capstone (Module 14)                 ~5 hours
  Build a complete Confidential DAO combining all concepts.
```

---

## Learning Paths

We offer three pacing options to fit different schedules:

| Path | Duration | Pace | Best For |
|---|---|---|---|
| **Intensive** | 1 week (5 days) | Full-time, ~12 hrs/day | Bootcamp cohorts, dedicated learners |
| **Part-Time** | 4 weeks | ~16 hrs/week | Working professionals |
| **Self-Paced** | Flexible | Your schedule | Independent learners |

See [curriculum/LEARNING_PATHS.md](curriculum/LEARNING_PATHS.md) for detailed schedules.

---

## Assessment System

| Component | Weight | Description |
|---|---|---|
| Quizzes | 20% | End-of-module knowledge checks (multiple choice + short answer) |
| Exercises | 40% | Hands-on coding exercises graded on correctness, style, and security |
| Capstone Project | 40% | Original FHE application with documentation and presentation |

**Passing score: 70% overall, with at least 60% in each component.**

---

## Repository Structure

```
fhevm-bootcamp/
├── README.md                          # This file
├── CONTRIBUTING.md                    # Contribution guidelines
├── TODO_REPORT.md                     # Project status report
├── ONCHAIN_TESTS.md                   # Sepolia on-chain test results
├── hardhat.config.ts                  # Hardhat configuration
├── package.json                       # Dependencies & scripts
├── tsconfig.json                      # TypeScript configuration
├── .github/workflows/                 # CI/CD pipelines
│   ├── test.yml                       # Run tests on PR/push
│   └── slides.yml                     # Build Marp slides
├── contracts/                         # 22 Solidity contracts
│   ├── SimpleStorage.sol              # Module 00
│   ├── HelloFHEVM.sol                 # Module 02
│   ├── ConfidentialERC20.sol          # Module 11
│   ├── ConfidentialDAO.sol            # Module 14 (capstone)
│   └── ...
├── test/                              # 22 test files (139 tests)
├── modules/                           # 15 learning modules
│   ├── 00-prerequisites/
│   │   ├── README.md                  # Module overview
│   │   ├── lesson.md                  # Detailed lesson
│   │   ├── slides/slides.md           # Marp slides
│   │   ├── exercise.md                # Hands-on exercises
│   │   └── quiz.md                    # Assessment
│   ├── 01-intro-to-fhe/
│   │   └── ...
│   └── 14-capstone/
│       └── ...
├── curriculum/
│   ├── SYLLABUS.md                    # Full 15-module syllabus
│   ├── LEARNING_PATHS.md              # Pacing options & schedules
│   └── INSTRUCTOR_GUIDE.md           # Teaching notes & rubrics
├── resources/
│   ├── CHEATSHEET.md                  # Quick reference card
│   ├── COMMON_PITFALLS.md             # Mistakes and fixes
│   ├── GAS_GUIDE.md                   # Gas cost reference
│   ├── SECURITY_CHECKLIST.md          # Audit checklist
│   └── GLOSSARY.md                    # A-Z terminology
├── exercises/                         # 7 exercise starter templates
├── solutions/                         # 7 complete solutions
├── diagrams/                          # 6 architecture diagrams (Mermaid)
└── scripts/
    ├── deploy-all.ts                  # Deploy all contracts
    ├── build-slides.js                # Build Marp slides
    ├── postinstall.js                 # FHEVM plugin patch
    └── setup.sh                       # Automated environment setup
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Encryption Library | Zama TFHE-rs (underlying FHE engine) |
| Solidity Library | `@fhevm/solidity` (`FHE` library) |
| Configuration | `ZamaEthereumConfig` base contract |
| Development Framework | Hardhat + fhEVM plugin |
| Testing | Hardhat test / Foundry (mock mode) |
| Frontend Encryption | `fhevmjs` client library |
| Network | Zama devnet / local fhEVM node |

---

## Key API Reference

The bootcamp uses the **new FHEVM API** throughout:

```solidity
// Imports
import { FHE, euint32, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

// Convert external encrypted input
euint32 value = FHE.fromExternal(externalEncryptedInput, proof);

// Arithmetic
euint32 sum = FHE.add(a, b);
euint32 product = FHE.mul(a, b);

// Comparison
ebool isGreater = FHE.gt(a, b);

// Conditional selection (encrypted ternary)
euint32 result = FHE.select(condition, valueIfTrue, valueIfFalse);

// Access control
FHE.allowThis(encryptedValue);
FHE.allow(encryptedValue, addressToAllow);

// Random number generation
euint32 rand = FHE.randEuint32();
```

---

## Resources

| Resource | Link |
|---|---|
| Zama Documentation | [docs.zama.ai/fhevm](https://docs.zama.ai/fhevm) |
| fhEVM Solidity Library | [github.com/zama-ai/fhevm](https://github.com/zama-ai/fhevm) |
| fhevmjs (Client Library) | [github.com/zama-ai/fhevmjs](https://github.com/zama-ai/fhevmjs) |
| TFHE-rs (Underlying Engine) | [github.com/zama-ai/tfhe-rs](https://github.com/zama-ai/tfhe-rs) |
| Zama Community | [community.zama.ai](https://community.zama.ai) |
| Zama Blog | [zama.ai/blog](https://www.zama.ai/blog) |
| Quick Reference | [resources/CHEATSHEET.md](resources/CHEATSHEET.md) |
| Common Pitfalls | [resources/COMMON_PITFALLS.md](resources/COMMON_PITFALLS.md) |
| Gas Optimization | [resources/GAS_GUIDE.md](resources/GAS_GUIDE.md) |
| Security Checklist | [resources/SECURITY_CHECKLIST.md](resources/SECURITY_CHECKLIST.md) |
| Glossary | [resources/GLOSSARY.md](resources/GLOSSARY.md) |

---

## Contributing

We welcome contributions from the community. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on submitting improvements, new exercises, bug fixes, and translations.

---

## License

This curriculum is provided under the [MIT License](LICENSE). Code examples within this repository are free to use, modify, and distribute.

---

## Acknowledgments

This bootcamp curriculum was developed with reference to Zama's official documentation, examples, and community resources. Special thanks to the Zama team for building the foundational FHE tooling that makes confidential smart contracts possible.
