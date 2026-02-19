# Module 02: FHEVM Development Setup — Lesson

**Duration:** 2 hours
**Prerequisites:** Module 01
**Learning Objectives:**
- Set up fhEVM development environment
- Write and deploy first encrypted contract
- Understand project structure

## Introduction

Before you can write confidential smart contracts, you need a proper development environment. This module walks you through every step — from installing Node.js and Hardhat to deploying and testing your first FHEVM contract.

---

## 1. Prerequisites & Tooling

### Required Software

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | >= 20.x | JavaScript runtime |
| npm / pnpm | Latest | Package manager |
| Hardhat | Latest | Smart contract framework |
| Git | Latest | Version control |

### Install Node.js

Download from [nodejs.org](https://nodejs.org) or use a version manager:

```bash
# Using nvm (recommended)
nvm install 20
nvm use 20
node --version  # Should print v20.x.x
```

---

## 2. Project Initialization

### Create a New Hardhat Project

```bash
mkdir my-fhevm-project
cd my-fhevm-project
npm init -y
npm install --save-dev hardhat
npx hardhat init
```

Select **"Create a TypeScript project"** when prompted.

### Install FHEVM Dependencies

```bash
npm install @fhevm/solidity
npm install --save-dev @nomicfoundation/hardhat-toolbox
npm install --save-dev @fhevm/hardhat-plugin @fhevm/mock-utils
```

---

## 3. Hardhat Configuration

Your `hardhat.config.ts` needs to be configured for FHEVM development:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@fhevm/hardhat-plugin";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localfhevm: {
      url: "http://localhost:8545",
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
      },
    },
  },
};

export default config;
```

---

## 4. Understanding `ZamaEthereumConfig`

Every FHEVM contract must inherit from a configuration contract that sets up the FHE environment. Zama provides a ready-made config:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract MyContract is ZamaEthereumConfig {
    // Your contract code here
}
```

**What `ZamaEthereumConfig` does:**
- Configures the FHE co-processor address
- Sets up the ACL (Access Control List) contract address
- Initializes the KMS (Key Management Service) verifier
- Provides the decryption oracle address for public decryption operations

> **Important:** You do NOT need to manually configure these addresses. `ZamaEthereumConfig` handles everything.

---

## 5. Your First Encrypted Contract

We will build up in two stages: first a simplified version to understand the basics, then the real-world pattern used in production contracts.

### Stage 1: Simplified Version (for learning)

This stripped-down counter initializes from a plaintext value and increments by a hardcoded encrypted `1`. It is useful for understanding the core FHE operations in isolation:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract SimpleCounterBasic is ZamaEthereumConfig {
    euint32 private counter;

    constructor() {
        // Initialize counter to encrypted zero (plaintext -> ciphertext on-chain)
        counter = FHE.asEuint32(0);
        FHE.allowThis(counter);
    }

    function increment() public {
        counter = FHE.add(counter, FHE.asEuint32(1));
        FHE.allowThis(counter);
    }

    function getCounter() public view returns (euint32) {
        return counter;
    }
}
```

**Key observations:**

1. **Named imports** -- `{FHE, euint32}` and `{ZamaEthereumConfig}` instead of bare `import "..."`. Named imports are the standard pattern in all FHEVM contracts.
2. **`euint32`** -- An encrypted 32-bit unsigned integer type.
3. **`FHE.asEuint32(0)`** -- Converts a plaintext value to a ciphertext on-chain.
4. **`FHE.add()`** -- Adds two encrypted values homomorphically.
5. **`FHE.allowThis()`** -- Grants the contract itself permission to use the ciphertext.

### Stage 2: Production Version (how real contracts work)

In a real contract, users do **not** send plaintext values. Instead, they encrypt input on the client side and pass the ciphertext handle plus a proof to the contract. This is the actual `HelloFHEVM.sol` pattern from this bootcamp:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract HelloFHEVM is ZamaEthereumConfig {
    euint32 private _counter;
    address public owner;

    event CounterIncremented(address indexed by);

    constructor() {
        owner = msg.sender;
    }

    function increment(externalEuint32 encryptedValue, bytes calldata inputProof) external {
        // Convert external ciphertext handle + proof into a usable euint32
        euint32 value = FHE.fromExternal(encryptedValue, inputProof);
        _counter = FHE.add(_counter, value);
        FHE.allowThis(_counter);
        FHE.allow(_counter, msg.sender);
        emit CounterIncremented(msg.sender);
    }

    function getCounter() external view returns (euint32) {
        return _counter;
    }
}
```

### What changed from Stage 1 to Stage 2?

| Aspect | Simplified (Stage 1) | Production (Stage 2) |
|--------|----------------------|----------------------|
| **Imports** | `{FHE, euint32}` | `{FHE, euint32, externalEuint32}` -- adds the external input type |
| **User input** | None -- hardcoded `FHE.asEuint32(1)` | `externalEuint32 encryptedValue, bytes calldata inputProof` -- user sends encrypted data |
| **Input conversion** | `FHE.asEuint32()` from plaintext | `FHE.fromExternal(encryptedValue, inputProof)` -- validates and converts client-encrypted input |
| **Access control** | Only `FHE.allowThis()` | `FHE.allowThis()` **and** `FHE.allow(_counter, msg.sender)` -- grants the caller permission to read the ciphertext |
| **Events** | None | `CounterIncremented` -- emits an event for off-chain indexing |
| **Visibility** | `public` | `external` -- more gas-efficient for functions only called externally |

> **Key takeaway:** In production FHEVM contracts, encrypted values always arrive from the client via `externalEuint32` + `inputProof`. The contract calls `FHE.fromExternal()` to validate and unwrap them, then uses `FHE.allow()` to grant specific addresses permission to access the result.

---

## 6. Compiling the Contract

```bash
npx hardhat compile
```

If everything is configured correctly, you should see:

```
Compiled 1 Solidity file successfully
```

### Common Compilation Errors

| Error | Solution |
|-------|----------|
| `Source not found: @fhevm/solidity` | Run `npm install @fhevm/solidity` |
| `ParserError: pragma solidity` | Ensure Solidity version matches (^0.8.24 or later) |

---

## 7. Writing a Basic Test

Create a test file at `test/HelloFHEVM.test.ts`. The `@fhevm/hardhat-plugin` provides a `fhevm` helper that lets you create encrypted inputs for testing:

```typescript
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
describe("HelloFHEVM", function () {
  it("should deploy successfully", async function () {
    const factory = await ethers.getContractFactory("HelloFHEVM");
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    expect(await contract.getAddress()).to.be.properAddress;
  });

  it("should increment with encrypted value", async function () {
    const [deployer] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("HelloFHEVM");
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    const addr = await contract.getAddress();

    const encrypted = await fhevm
      .createEncryptedInput(addr, deployer.address)
      .add32(5)
      .encrypt();
    await (await contract.increment(encrypted.handles[0], encrypted.inputProof)).wait();
  });
});
```

**What is happening in the test:**

1. `fhevm.createEncryptedInput(contractAddr, signerAddr)` -- creates an encrypted input builder bound to a specific contract and sender.
2. `.add32(5)` -- adds a 32-bit unsigned integer with plaintext value `5` to be encrypted.
3. `.encrypt()` -- produces `handles` (the ciphertext references) and `inputProof` (the ZK proof that the ciphertext is valid).
4. `contract.increment(encrypted.handles[0], encrypted.inputProof)` -- calls the contract exactly as a real user would.

Run tests:

```bash
npx hardhat test
```

---

## 8. Project Structure

After setup, your project should look like this:

```
my-fhevm-project/
├── contracts/
│   └── HelloFHEVM.sol
├── test/
│   └── HelloFHEVM.test.ts
├── hardhat.config.ts
├── package.json
├── tsconfig.json
└── node_modules/
    └── @fhevm/
        ├── solidity/
        │   ├── lib/
        │   │   └── FHE.sol
        │   └── config/
        │       └── ZamaConfig.sol
        ├── hardhat-plugin/
        └── mock-utils/
```

---

## Summary

| Step | Command / Action |
|------|-----------------|
| Initialize project | `npx hardhat init` |
| Install FHEVM | `npm install @fhevm/solidity` |
| Install dev tools | `npm install --save-dev @fhevm/hardhat-plugin @fhevm/mock-utils` |
| Import FHE library | `import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";` |
| Import config | `import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";` |
| Inherit config | `contract X is ZamaEthereumConfig { }` |
| Compile | `npx hardhat compile` |
| Test | `npx hardhat test` |

You now have a fully functional FHEVM development environment. In the next module, we will explore all the encrypted types available to you.
