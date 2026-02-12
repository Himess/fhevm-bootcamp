---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 02: FHEVM Development Setup"
footer: "Zama Developer Program"
---

# Module 02: FHEVM Development Setup

Set up your environment, write your first encrypted contract, compile and test it.

---

# What You Will Need

| Tool | Purpose |
|------|---------|
| **Node.js >= 20** | JavaScript runtime |
| **Hardhat** | Smart contract dev framework |
| **@fhevm/solidity** | FHE library for Solidity |
| **Git** | Version control |

---

# Step 1: Create a Hardhat Project

```bash
mkdir my-fhevm-project && cd my-fhevm-project
npm init -y
npm install --save-dev hardhat
npx hardhat init
# Select: "Create a TypeScript project"
```

---

# Step 2: Install FHEVM Solidity

```bash
npm install @fhevm/solidity
npm install --save-dev @fhevm/hardhat-plugin @fhevm/mock-utils
```

This gives you:
- `FHE.sol` -- The core library (`FHE.add`, `FHE.sub`, `FHE.allow`, etc.)
- `ZamaConfig.sol` -- Pre-built configuration for the Zama network
- Encrypted types -- `euint32`, `ebool`, `eaddress`, `externalEuint32`, and more
- `@fhevm/hardhat-plugin` -- Hardhat integration for encrypted input creation in tests

---

# The Two Essential Imports

```solidity
// The FHE operations library (named import)
import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";

// The network configuration (named import)
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
```

Every FHEVM contract needs **both**. Always use **named imports**.

---

# ZamaEthereumConfig

```solidity
contract MyContract is ZamaEthereumConfig {
    // Automatically configured:
    // - FHE co-processor address
    // - ACL contract address
    // - KMS verifier address
    // - Gateway address
}
```

No manual address configuration needed!

---

# Stage 1: Simplified Version (for learning)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract SimpleCounterBasic is ZamaEthereumConfig {
    euint32 private counter;
    constructor() {
        counter = FHE.asEuint32(0);
        FHE.allowThis(counter);
    }
    function increment() public {
        counter = FHE.add(counter, FHE.asEuint32(1));
        FHE.allowThis(counter);
    }
}
```

Hardcoded plaintext init + increment. Good for understanding the basics.

---

# Stage 2: Production Version (HelloFHEVM)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract HelloFHEVM is ZamaEthereumConfig {
    euint32 private _counter;
    address public owner;
    event CounterIncremented(address indexed by);
    constructor() { owner = msg.sender; }
    function increment(externalEuint32 encryptedValue,
                       bytes calldata inputProof) external {
        euint32 value = FHE.fromExternal(encryptedValue, inputProof);
        _counter = FHE.add(_counter, value);
        FHE.allowThis(_counter);
        FHE.allow(_counter, msg.sender);
        emit CounterIncremented(msg.sender);
    }
}
```

---

# What Changed? Stage 1 vs Stage 2

| Aspect | Simplified | Production |
|--------|-----------|------------|
| **Input** | Hardcoded `FHE.asEuint32(1)` | `externalEuint32` + `inputProof` from client |
| **Conversion** | `FHE.asEuint32()` | `FHE.fromExternal()` validates client input |
| **Access** | `FHE.allowThis()` only | + `FHE.allow(_counter, msg.sender)` |
| **Events** | None | `CounterIncremented` emitted |
| **Visibility** | `public` | `external` (gas-efficient) |

---

# Key Patterns to Notice

1. **Named imports:** `{FHE, euint32, externalEuint32}` -- always use named imports
2. **Library name:** `FHE` (not TFHE)
3. **Config inheritance:** `is ZamaEthereumConfig`
4. **Client-encrypted input:** `externalEuint32` + `bytes calldata inputProof`
5. **Input validation:** `FHE.fromExternal(encValue, proof)`
6. **Grant access:** `FHE.allowThis()` for contract, `FHE.allow()` for users

---

# Compile & Test

```bash
# Compile
npx hardhat compile

# Run tests
npx hardhat test
```

If compilation succeeds, your environment is correctly set up.

---

# Project Structure

```
my-fhevm-project/
├── contracts/
│   └── HelloFHEVM.sol          # Your encrypted contracts
├── test/
│   └── HelloFHEVM.test.ts      # Your test files
├── hardhat.config.ts           # Network & compiler config
├── package.json
└── node_modules/
    └── @fhevm/
        ├── solidity/            # FHE library + config
        ├── hardhat-plugin/      # Test helpers
        └── mock-utils/          # Mock utilities
```

---

# Testing Encrypted Contracts

## The fhevm Test Pattern

```typescript
// 1. Create encrypted input
const encrypted = await fhevm.createEncryptedInput(
  contractAddress, signerAddress
);

// 2. Add value and encrypt
encrypted.add32(42);
const encryptedAmount = await encrypted.encrypt();

// 3. Call contract with handles + proof
await contract.increment(
  encryptedAmount.handles[0],
  encryptedAmount.inputProof
);
```

> The `fhevm` object is provided by `@fhevm/hardhat-plugin`

---

# Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| Wrong library name (`TFHE`) | Use `FHE` |
| Bare imports | Use named imports: `{FHE, euint32}` |
| Forgot `ZamaEthereumConfig` | Always inherit it |
| Missing `FHE.allowThis()` | Call after every state write |
| Missing `FHE.allow()` for users | Grant callers access to read ciphertext |
| Old Solidity version | Use `^0.8.24` or later |

---

# Summary

- **Initialize** with Hardhat + TypeScript
- **Install** `@fhevm/solidity`, `@fhevm/hardhat-plugin`, `@fhevm/mock-utils`
- **Import** with named imports: `{FHE, euint32}` and `{ZamaEthereumConfig}`
- **Inherit** `ZamaEthereumConfig`
- **Accept encrypted input** via `externalEuint32` + `bytes calldata inputProof`
- **Compile** with `npx hardhat compile`
- **Test** with `npx hardhat test` (use `fhevm.createEncryptedInput` for encrypted values)

---

# Next Up

**Module 03: Encrypted Types Deep Dive**

Explore `ebool`, `euint8` through `euint256`, `eaddress`, and how encrypted data is stored on-chain.
