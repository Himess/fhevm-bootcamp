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

<!--
Speaker notes: Make sure everyone has Node.js 20+ installed before proceeding. If anyone is stuck on installation, pair them with a neighbor. The rest of the module depends on a working environment.
-->

---

# Step 1: Create a Hardhat Project

```bash
mkdir my-fhevm-project && cd my-fhevm-project
npm init -y
npm install --save-dev hardhat
npx hardhat init
# Select: "Create a TypeScript project"
```

<!--
Speaker notes: Have students follow along in real time. Select TypeScript when prompted -- all bootcamp examples use TypeScript for tests. If Hardhat init asks about .gitignore or other options, accept defaults.
-->

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

<!--
Speaker notes: These three packages are the core of every FHEVM project. Emphasize that @fhevm/solidity gives you the Solidity library, while the other two are for testing only. Students should see these as the "FHEVM SDK."
-->

---

# The Two Essential Imports

```solidity
// The FHE operations library (named import)
import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";

// The network configuration (named import)
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
```

Every FHEVM contract needs **both**. Always use **named imports**.

<!--
Speaker notes: Stress the named import pattern -- this is a common source of compilation errors. Students should never use bare imports like "import FHE.sol". The library name is FHE, not TFHE -- this changed in recent versions.
-->

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

<!--
Speaker notes: Explain that ZamaEthereumConfig handles all the infrastructure addresses automatically. Without it, you would need to manually configure the coprocessor, ACL, KMS, and Gateway addresses. This is a convenience that prevents many configuration errors.
-->

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

<!--
Speaker notes: Walk through this line by line. Point out that FHE.asEuint32(0) creates a new encrypted zero, and FHE.allowThis() is mandatory even after initialization. This simplified version has a deliberate limitation -- the increment value is hardcoded and visible on-chain.
-->

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

<!--
Speaker notes: Compare this with Stage 1 on the previous slide. The key upgrade is externalEuint32 + inputProof -- the value is now encrypted client-side before it ever hits the blockchain. Point out that FHE.allow gives the caller access to decrypt later.
-->

---

# What Changed? Stage 1 vs Stage 2

| Aspect | Simplified | Production |
|--------|-----------|------------|
| **Input** | Hardcoded `FHE.asEuint32(1)` | `externalEuint32` + `inputProof` from client |
| **Conversion** | `FHE.asEuint32()` | `FHE.fromExternal()` validates client input |
| **Access** | `FHE.allowThis()` only | + `FHE.allow(_counter, msg.sender)` |
| **Events** | None | `CounterIncremented` emitted |
| **Visibility** | `public` | `external` (gas-efficient) |

<!--
Speaker notes: Use this table as a checklist for what production FHEVM code looks like. The progression from Stage 1 to Stage 2 is the same progression students will follow for every contract they build in this bootcamp.
-->

---

# Key Patterns to Notice

1. **Named imports:** `{FHE, euint32, externalEuint32}` -- always use named imports
2. **Library name:** `FHE` (not TFHE)
3. **Config inheritance:** `is ZamaEthereumConfig`
4. **Client-encrypted input:** `externalEuint32` + `bytes calldata inputProof`
5. **Input validation:** `FHE.fromExternal(encValue, proof)`
6. **Grant access:** `FHE.allowThis()` for contract, `FHE.allow()` for users

<!--
Speaker notes: These six patterns are the foundation of every FHEVM contract. Have students repeat them back: named imports, FHE library, config inheritance, external types, fromExternal, and ACL grants. They will use all six in every module going forward.
-->

---

# Compile & Test

```bash
# Compile
npx hardhat compile

# Run tests
npx hardhat test
```

If compilation succeeds, your environment is correctly set up.

<!--
Speaker notes: Have everyone run these commands now and confirm successful compilation. If anyone gets errors, the most common issues are wrong Node.js version or missing the @fhevm packages. Debug together before moving on.
-->

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

<!--
Speaker notes: Point out that contracts go in contracts/, tests in test/, and the FHEVM library lives in node_modules. Students should keep this structure for all exercises. Mention that we never modify files inside node_modules/@fhevm.
-->

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

<!--
Speaker notes: Walk through the three-step pattern: create encrypted input, add the value, encrypt, then call the contract. The handles array and inputProof are what get sent on-chain. This pattern is identical in every test file.
-->

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

<!--
Speaker notes: Go through each pitfall and ask if anyone has already hit one of these. The most common mistake is forgetting FHE.allowThis() after writing to state -- this will be a recurring theme. Bookmark this slide for reference.
-->

---

# Summary

- **Initialize** with Hardhat + TypeScript
- **Install** `@fhevm/solidity`, `@fhevm/hardhat-plugin`, `@fhevm/mock-utils`
- **Import** with named imports: `{FHE, euint32}` and `{ZamaEthereumConfig}`
- **Inherit** `ZamaEthereumConfig`
- **Accept encrypted input** via `externalEuint32` + `bytes calldata inputProof`
- **Compile** with `npx hardhat compile`
- **Test** with `npx hardhat test` (use `fhevm.createEncryptedInput` for encrypted values)

<!--
Speaker notes: Recap the setup process as a checklist. If students successfully compiled and tested HelloFHEVM, they are ready for the rest of the bootcamp. Celebrate this milestone -- they just wrote their first encrypted smart contract.
-->

---

# Next Up

**Module 03: Encrypted Types Deep Dive**

Explore `ebool`, `euint8` through `euint256`, `eaddress`, and how encrypted data is stored on-chain.

<!--
Speaker notes: Transition by saying that now the environment works, we need to understand what data types are available. Module 03 is where we learn to think in encrypted types.
-->
