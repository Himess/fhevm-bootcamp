![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Solidity](https://img.shields.io/badge/Solidity-0.8.27-363636?logo=solidity)
![Tests](https://img.shields.io/badge/Tests-328%20passing-brightgreen)
![Modules](https://img.shields.io/badge/Modules-20-blue)
![Contracts](https://img.shields.io/badge/Contracts-35-orange)
![Network](https://img.shields.io/badge/Network-Ethereum%20Sepolia-purple)

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
git clone https://github.com/Himess/fhevm-bootcamp.git
cd fhevm-bootcamp

# Install dependencies
npm install

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

    function setSecret(externalEuint32 encryptedValue, bytes calldata inputProof) external {
        secretNumber = FHE.fromExternal(encryptedValue, inputProof);
        FHE.allowThis(secretNumber);
    }

    function addToSecret(externalEuint32 encryptedValue, bytes calldata inputProof) external {
        euint32 input = FHE.fromExternal(encryptedValue, inputProof);
        secretNumber = FHE.add(secretNumber, input);
        FHE.allowThis(secretNumber);
    }
}
```

---

## Curriculum Overview

This bootcamp consists of **20 modules** organized into five progressive phases. Each module includes lecture content, code examples, hands-on exercises, and assessments.

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
| 14 | [Testing & Debugging FHE Contracts](modules/14-testing-debugging/) | Advanced | 3 hrs | Mastery |
| 15 | [Gas Optimization for FHE](modules/15-gas-optimization/) | Advanced | 3 hrs | Mastery |
| 16 | [Security Best Practices for FHE](modules/16-security/) | Advanced | 3 hrs | Mastery |
| 17 | [Advanced FHE Design Patterns](modules/17-advanced-patterns/) | Expert | 4 hrs | Mastery |
| 18 | [Confidential DeFi](modules/18-confidential-defi/) | Expert | 4 hrs | Mastery |
| 19 | [Capstone: Confidential DAO](modules/19-capstone/) | Expert | 5 hrs | Capstone |

**Total Duration: ~63 hours**

### Phase Breakdown

```
Phase 1: Foundation (Modules 00-03)           ~9 hours
  Solidity review, FHE concepts, development setup, encrypted types.

Phase 2: Core Development (Modules 04-09)     ~17 hours
  Operations, ACL, encrypted inputs, decryption, conditional logic, randomness.

Phase 3: Applications (Modules 10-13)         ~15 hours
  Frontend integration, confidential ERC-20, voting, sealed-bid auction.

Phase 4: Mastery (Modules 14-18)              ~17 hours
  Testing & debugging, gas optimization, security, design patterns, DeFi.

Phase 5: Capstone (Module 19)                 ~5 hours
  Build a complete Confidential DAO combining all concepts.
```

---

## Learning Paths

We offer three pacing options to fit different schedules:

| Path | Duration | Pace | Best For |
|---|---|---|---|
| **Intensive** | 7 days (1.5 weeks) | Full-time, ~9 hrs/day | Bootcamp cohorts, dedicated learners |
| **Part-Time** | 6 weeks | ~11 hrs/week | Working professionals |
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
├── contracts/                         # 35 Solidity contracts
│   ├── SimpleStorage.sol              # Module 00
│   ├── HelloFHEVM.sol                 # Module 02
│   ├── ConfidentialERC20.sol          # Module 11
│   ├── TestableVault.sol              # Module 14
│   ├── GasOptimized.sol               # Module 15
│   ├── SecurityPatterns.sol           # Module 16
│   ├── ConfidentialLending.sol        # Module 18
│   ├── ConfidentialDAO.sol            # Module 19 (capstone)
│   └── ...
├── test/                              # 35 test files (328 tests)
├── modules/                           # 20 learning modules
│   ├── 00-prerequisites/
│   │   ├── README.md                  # Module overview
│   │   ├── lesson.md                  # Detailed lesson
│   │   ├── slides/slides.md           # Marp slides
│   │   ├── exercise.md                # Hands-on exercises
│   │   └── quiz.md                    # Assessment
│   ├── 01-intro-to-fhe/
│   │   └── ...
│   └── 19-capstone/
│       └── ...
├── curriculum/
│   ├── SYLLABUS.md                    # Full 20-module syllabus
│   ├── LEARNING_PATHS.md              # Pacing options & schedules
│   └── INSTRUCTOR_GUIDE.md           # Teaching notes & rubrics
├── resources/
│   ├── CHEATSHEET.md                  # Quick reference card
│   ├── COMMON_PITFALLS.md             # Mistakes and fixes
│   ├── GAS_GUIDE.md                   # Gas cost reference
│   ├── SECURITY_CHECKLIST.md          # Audit checklist
│   └── GLOSSARY.md                    # A-Z terminology
├── exercises/                         # 20 exercise starter templates
├── solutions/                         # 20 complete solutions
├── frontend/                          # Interactive React demo dApp (Vercel deployed)
├── quiz/                              # Interactive web-based quiz (215 questions)
├── diagrams/                          # 6 architecture diagrams (Mermaid)
├── Dockerfile                         # Docker support for reproducible builds
├── docker-compose.yml                 # One-command test execution
├── QUICK_START.md                     # 10-minute setup guide
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
| Frontend Encryption | `@zama-fhe/relayer-sdk` (Relayer SDK) |
| Network | Ethereum Sepolia / local fhEVM node |

---

## Key API Reference

The bootcamp uses the **new FHEVM API** throughout:

```solidity
// Imports
import { FHE, euint32, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

// Convert external encrypted input
euint32 value = FHE.fromExternal(externalEncryptedInput, inputProof);

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
| Relayer SDK (Client Library) | [github.com/zama-ai/relayer-sdk](https://github.com/zama-ai/relayer-sdk) |
| TFHE-rs (Underlying Engine) | [github.com/zama-ai/tfhe-rs](https://github.com/zama-ai/tfhe-rs) |
| Zama Community | [community.zama.ai](https://community.zama.ai) |
| Zama Blog | [zama.ai/blog](https://www.zama.ai/blog) |
| Quick Reference | [resources/CHEATSHEET.md](resources/CHEATSHEET.md) |
| Common Pitfalls | [resources/COMMON_PITFALLS.md](resources/COMMON_PITFALLS.md) |
| Gas Optimization | [resources/GAS_GUIDE.md](resources/GAS_GUIDE.md) |
| Security Checklist | [resources/SECURITY_CHECKLIST.md](resources/SECURITY_CHECKLIST.md) |
| Glossary | [resources/GLOSSARY.md](resources/GLOSSARY.md) |

---

## Deployed Contracts (Ethereum Sepolia)

All 35 contracts deployed and verified on Ethereum Sepolia testnet. See [ONCHAIN_TESTS.md](ONCHAIN_TESTS.md) for full test results.

**Deployer:** `0xF505e2E71df58D7244189072008f25f6b6aaE5ae`

| Contract | Module | Address | Etherscan |
|----------|--------|---------|-----------|
| SimpleStorage | 00 | `0x8B7D25a45890d214db56790ae59afaE72273c1D3` | [View](https://sepolia.etherscan.io/address/0x8B7D25a45890d214db56790ae59afaE72273c1D3) |
| BasicToken | 00 | `0x790f57EA01ec1f903645723D6990Eeaa2a36a814` | [View](https://sepolia.etherscan.io/address/0x790f57EA01ec1f903645723D6990Eeaa2a36a814) |
| HelloFHEVM | 02 | `0xbFd008661B7222Dd974074f986D1eb18dD4dF1F1` | [View](https://sepolia.etherscan.io/address/0xbFd008661B7222Dd974074f986D1eb18dD4dF1F1) |
| EncryptedTypes | 03 | `0x56c52A3b621346DC47B7B2A4bE0230721EE48c12` | [View](https://sepolia.etherscan.io/address/0x56c52A3b621346DC47B7B2A4bE0230721EE48c12) |
| TypeConversions | 03 | `0x11c8ebc9A95B2A1DA4155b167dadA9B5925dde8f` | [View](https://sepolia.etherscan.io/address/0x11c8ebc9A95B2A1DA4155b167dadA9B5925dde8f) |
| ArithmeticOps | 04 | `0xB6D81352EA3Cd0426838B655D15097E0FaE80177` | [View](https://sepolia.etherscan.io/address/0xB6D81352EA3Cd0426838B655D15097E0FaE80177) |
| BitwiseOps | 04 | `0xb0bd1D30eDfaAbA1fc02F7A917820fD9edB24438` | [View](https://sepolia.etherscan.io/address/0xb0bd1D30eDfaAbA1fc02F7A917820fD9edB24438) |
| ComparisonOps | 04 | `0xB1141F0b2588aAb0C1fe819b1B6AF1C0a7564490` | [View](https://sepolia.etherscan.io/address/0xB1141F0b2588aAb0C1fe819b1B6AF1C0a7564490) |
| ACLDemo | 05 | `0xc4f08eB557DF912E3D1FdE79bf3465d5242ea53d` | [View](https://sepolia.etherscan.io/address/0xc4f08eB557DF912E3D1FdE79bf3465d5242ea53d) |
| MultiUserVault | 05 | `0xa988F5BFD7Fc19481Fdac5b55027b7Dc126a67e6` | [View](https://sepolia.etherscan.io/address/0xa988F5BFD7Fc19481Fdac5b55027b7Dc126a67e6) |
| SecureInput | 06 | `0x27d2b5247949606f913Db8c314EABB917fcffd96` | [View](https://sepolia.etherscan.io/address/0x27d2b5247949606f913Db8c314EABB917fcffd96) |
| PublicDecrypt | 07 | `0x605002BbB689457101104e8Ee3C76a8d5D23e5c8` | [View](https://sepolia.etherscan.io/address/0x605002BbB689457101104e8Ee3C76a8d5D23e5c8) |
| UserDecrypt | 07 | `0x5E3ef9A91AD33270f84B32ACFF91068Eea44c5ee` | [View](https://sepolia.etherscan.io/address/0x5E3ef9A91AD33270f84B32ACFF91068Eea44c5ee) |
| ConditionalDemo | 08 | `0x0A206f2BC275012703BA262B9577ABC49A4f6782` | [View](https://sepolia.etherscan.io/address/0x0A206f2BC275012703BA262B9577ABC49A4f6782) |
| EncryptedMinMax | 08 | `0xbA5c38093CefBbFA08577b08b0494D5c7738E4F6` | [View](https://sepolia.etherscan.io/address/0xbA5c38093CefBbFA08577b08b0494D5c7738E4F6) |
| RandomDemo | 09 | `0xe473aF953d269601402DEBcB2cc899aB594Ad31e` | [View](https://sepolia.etherscan.io/address/0xe473aF953d269601402DEBcB2cc899aB594Ad31e) |
| SimpleCounter | 10 | `0x17B6209385c2e36E6095b89572273175902547f9` | [View](https://sepolia.etherscan.io/address/0x17B6209385c2e36E6095b89572273175902547f9) |
| ConfidentialERC20 | 11 | `0x623b1653AB004661BC7832AC2930Eb42607C4013` | [View](https://sepolia.etherscan.io/address/0x623b1653AB004661BC7832AC2930Eb42607C4013) |
| ConfidentialVoting | 12 | `0xd80537D04652E1B4B591319d83812BbA6a9c1B14` | [View](https://sepolia.etherscan.io/address/0xd80537D04652E1B4B591319d83812BbA6a9c1B14) |
| PrivateVoting | 12 | `0x70Aa742C113218a12A6582f60155c2B299551A43` | [View](https://sepolia.etherscan.io/address/0x70Aa742C113218a12A6582f60155c2B299551A43) |
| SealedBidAuction | 13 | `0xC53c8E05661450919951f51E4da829a3AABD76A2` | [View](https://sepolia.etherscan.io/address/0xC53c8E05661450919951f51E4da829a3AABD76A2) |
| RevealableAuction | 13 | `0x8F1ae8209156C22dFD972352A415880040fB0b0c` | [View](https://sepolia.etherscan.io/address/0x8F1ae8209156C22dFD972352A415880040fB0b0c) |
| EncryptedMarketplace | 13 | `0x1E44074dF559E4f46De367ddbA0793fC710DB3a7` | [View](https://sepolia.etherscan.io/address/0x1E44074dF559E4f46De367ddbA0793fC710DB3a7) |
| EncryptedLottery | 09 | `0x32D3012EEE7e14175CA24Fc8e8dAb5b1Cebf929e` | [View](https://sepolia.etherscan.io/address/0x32D3012EEE7e14175CA24Fc8e8dAb5b1Cebf929e) |
| TestableVault | 14 | `0xfa2a63616aDe3E5BE4abFEdAF8E58780eaF0feE9` | [View](https://sepolia.etherscan.io/address/0xfa2a63616aDe3E5BE4abFEdAF8E58780eaF0feE9) |
| GasOptimized | 15 | `0x86daECb1Cc9Ce4862A8baFaF1f01aBe979a9b582` | [View](https://sepolia.etherscan.io/address/0x86daECb1Cc9Ce4862A8baFaF1f01aBe979a9b582) |
| GasBenchmark | 15 | `0x76da41a5bD46F428E32E79a081065697C5151693` | [View](https://sepolia.etherscan.io/address/0x76da41a5bD46F428E32E79a081065697C5151693) |
| SecurityPatterns | 16 | `0x59f51Da1Df210745bf64aABA55D1b874B26001f2` | [View](https://sepolia.etherscan.io/address/0x59f51Da1Df210745bf64aABA55D1b874B26001f2) |
| VulnerableDemo | 16 | `0x5AC6485D93CD0b90A7cF94eC706ef6e70DAEB778` | [View](https://sepolia.etherscan.io/address/0x5AC6485D93CD0b90A7cF94eC706ef6e70DAEB778) |
| EncryptedStateMachine | 17 | `0x17259782D5dB2C13a8A385211f8BE6b1001d0378` | [View](https://sepolia.etherscan.io/address/0x17259782D5dB2C13a8A385211f8BE6b1001d0378) |
| LastErrorPattern | 17 | `0x7f12c6D6b13C1E985D0efD1d79873c3e7F9c6c41` | [View](https://sepolia.etherscan.io/address/0x7f12c6D6b13C1E985D0efD1d79873c3e7F9c6c41) |
| EncryptedRegistry | 17 | `0xBF472B66b331303d9d7dF83195F7C355E332E137` | [View](https://sepolia.etherscan.io/address/0xBF472B66b331303d9d7dF83195F7C355E332E137) |
| ConfidentialLending | 18 | `0x8B5526092F6a230E23651f0Eb559fd758C42967A` | [View](https://sepolia.etherscan.io/address/0x8B5526092F6a230E23651f0Eb559fd758C42967A) |
| EncryptedOrderBook | 18 | `0xB0fcA1f21d598006c5Bd327c44140a3471787E82` | [View](https://sepolia.etherscan.io/address/0xB0fcA1f21d598006c5Bd327c44140a3471787E82) |
| ConfidentialDAO | 19 | `0x6C41b7E9b4e8fe2366Ba842f04E975ed7a4e9d72` | [View](https://sepolia.etherscan.io/address/0x6C41b7E9b4e8fe2366Ba842f04E975ed7a4e9d72) |

---

## Built With

| Technology | Purpose |
|------------|---------|
| [Zama fhEVM](https://docs.zama.ai/fhevm) | Fully Homomorphic Encryption on EVM |
| [Solidity 0.8.27](https://soliditylang.org/) | Smart contract language |
| [Hardhat](https://hardhat.org/) | Development & testing framework |
| [@zama-fhe/relayer-sdk](https://www.npmjs.com/package/@zama-fhe/relayer-sdk) | Client-side FHE encryption |
| [React + Vite](https://vitejs.dev/) | Frontend demo application |
| [Marp](https://marp.app/) | Presentation slides |
| [GitHub Actions](https://github.com/features/actions) | CI/CD pipeline |

---

## Live Demo & Interactive Quiz

| | Link |
|---|---|
| **Live Frontend** | [fhevm-bootcamp-demo.vercel.app](https://fhevm-bootcamp-demo.vercel.app) |
| **Interactive Quiz** | Open `quiz/index.html` in browser (215 questions, 20 modules) |
| **Quick Start** | [QUICK_START.md](QUICK_START.md) |

## Frontend Demo

An interactive React dApp is included in the `frontend/` directory. It connects to the deployed contracts on Sepolia and demonstrates:

- Client-side encryption with the Relayer SDK (`@zama-fhe/relayer-sdk`)
- Encrypted counter operations (SimpleCounter)
- Confidential token transfers (ConfidentialERC20)

```bash
cd frontend && npm install && npm run dev
```

See [frontend/README.md](frontend/README.md) for details.

---

## Contributing

We welcome contributions from the community. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on submitting improvements, new exercises, bug fixes, and translations.

---

## License

This curriculum is provided under the [MIT License](LICENSE). Code examples within this repository are free to use, modify, and distribute.

---

## Acknowledgments

This bootcamp curriculum was developed with reference to Zama's official documentation, examples, and community resources. Special thanks to the Zama team for building the foundational FHE tooling that makes confidential smart contracts possible.
