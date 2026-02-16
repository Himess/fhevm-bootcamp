# Quick Start Guide

Get the FHEVM Bootcamp running in under 10 minutes.

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 20+ |
| Git | 2.40+ |

Verify your setup:

```bash
node --version   # v20.x or higher
git --version    # 2.40+
```

---

## Setup (3 minutes)

```bash
# Clone the repository
git clone https://github.com/Himess/fhevm-bootcamp.git
cd fhevm-bootcamp

# Install dependencies
npm install

# Compile all 35 contracts
npx hardhat compile
```

Expected output after compile:

```
Generating typings for: 35 artifacts in dir: types for target: ethers-v6
Successfully generated 70 typings!
Compiled 35 Solidity files successfully
```

---

## Run Tests (2 minutes)

```bash
npm test
```

Expected output:

```
  SimpleStorage
    ✓ should store and retrieve a value
    ✓ should emit ValueChanged event
  ...

  328 passing (Xs)
```

All 328 tests run locally in mock FHE mode -- no testnet connection needed.

To run tests with gas reporting:

```bash
npm run test:gas
```

---

## Deploy to Sepolia (5 minutes)

### 1. Configure environment

```bash
# Copy the example env file
cp .env.example .env
```

Edit `.env` and add your private key:

```
PRIVATE_KEY=your_private_key_without_0x_prefix
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

> You need Sepolia ETH. Get some from https://www.alchemy.com/faucets/ethereum-sepolia

### 2. Deploy

```bash
npm run deploy:sepolia
```

Expected output:

```
============================================================
FHEVM Bootcamp - Sepolia Deployment
============================================================
Deployer: 0xYourAddress
Balance: 0.5 ETH

[Module 00] Deploying SimpleStorage...
  deployed: 0x...

[Module 02] Deploying HelloFHEVM...
  deployed: 0x...

...
Total: 11/11 deployed
```

### 3. Verify on Etherscan (optional)

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

---

## Explore the Curriculum

The bootcamp has **20 modules** across 5 phases. Start based on your experience:

| Your Level | Start Here | Module |
|---|---|---|
| New to Solidity | Module 00 | `modules/00-prerequisites/` |
| Know Solidity, new to FHE | Module 01 | `modules/01-intro-to-fhe/` |
| Know FHE basics | Module 04 | `modules/04-operations/` |
| Want to build apps | Module 11 | `modules/11-project-erc20/` |

Each module folder contains:

```
modules/XX-module-name/
  README.md        # Overview and learning objectives
  lesson.md        # Full lesson content
  slides/slides.md # Presentation slides (Marp format)
  exercise.md      # Hands-on exercises
  quiz.md          # Knowledge check
```

Matching contracts live in `contracts/`, tests in `test/`, exercises in `exercises/`, and solutions in `solutions/`.

---

## Key Commands

| Command | Description |
|---|---|
| `npm test` | Run all 328 tests (mock FHE mode) |
| `npm run test:gas` | Run tests with gas usage report |
| `npm run compile` | Compile all Solidity contracts |
| `npm run clean` | Remove artifacts, cache, types |
| `npm run build` | Clean + compile from scratch |
| `npm run deploy:local` | Deploy to local Hardhat network |
| `npm run deploy:sepolia` | Deploy to Ethereum Sepolia testnet |
| `npm run lint` | Lint Solidity files |
| `npm run format` | Check formatting |
| `npm run format:fix` | Auto-fix formatting |

---

## Key Resources

| Resource | Path |
|---|---|
| Cheatsheet | `resources/CHEATSHEET.md` |
| Common Pitfalls | `resources/COMMON_PITFALLS.md` |
| Gas Guide | `resources/GAS_GUIDE.md` |
| Security Checklist | `resources/SECURITY_CHECKLIST.md` |
| Glossary | `resources/GLOSSARY.md` |
| Full Syllabus | `curriculum/SYLLABUS.md` |
| Instructor Guide | `curriculum/INSTRUCTOR_GUIDE.md` |

---

## Docker (Alternative Setup)

If you prefer a containerized environment, no local Node.js installation needed:

```bash
# Run all tests (one command)
docker compose up

# Run with build output visible
docker compose up --build

# Run interactively
docker compose run --rm bootcamp sh
```

Inside the container you can run any command:

```bash
npx hardhat compile
npm test
npm run deploy:sepolia   # after configuring .env
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `npm install` fails | Delete `node_modules/` and `package-lock.json`, then run `npm install` again |
| Compile errors | Run `npm run clean` then `npm run compile` |
| Tests timeout | Increase mocha timeout: `npx hardhat test --timeout 60000` |
| Sepolia deploy fails | Check `.env` has correct `PRIVATE_KEY` and you have Sepolia ETH |
| TypeScript errors | Run `npm run build` to regenerate type bindings |
