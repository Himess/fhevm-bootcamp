# Module 10: Frontend Integration

> Connect your dApp frontend to FHEVM contracts using the Relayer SDK (`@zama-fhe/relayer-sdk`), encrypted inputs, and user decryption.

| | |
|---|---|
| **Level** | Intermediate |
| **Duration** | 3h |
| **Prerequisites** | Modules 01-09 |

## Learning Objectives

By the end of this module, you will be able to:

1. Set up the Relayer SDK (`@zama-fhe/relayer-sdk`) in a React + ethers.js frontend
2. Create encrypted inputs from the browser and send them to FHEVM contracts
3. Request decryption of encrypted values for the connected user
4. Build a complete dApp with a per-user encrypted counter contract
5. Handle the FHE instance lifecycle (initialization, encryption, decryption)
6. Understand the trust model between frontend, gateway, and chain

## Contents

- [Lesson](./lesson.md)
- [Slides](./slides/slides.md)
- Contracts: [SimpleCounter.sol](../../contracts/SimpleCounter.sol)
- Tests: [SimpleCounter.test.ts](../../test/SimpleCounter.test.ts)
- [Exercise](./exercise.md)
- [Quiz](./quiz.md)

## Key Concepts

- **Relayer SDK (`@zama-fhe/relayer-sdk`)** -- JavaScript/TypeScript library for interacting with FHEVM from the browser
- **Encrypted Inputs** -- Client-side encryption of plaintext values before sending to contracts
- **User Decryption** -- Requesting the gateway to re-encrypt a ciphertext for the user's key
- **FHE Instance** -- The Relayer SDK object that holds the public key and provides encrypt/decrypt methods
- **`externalEuint32` / `FHE.fromExternal()`** -- External types received from frontend, converted on-chain

## Next Module

> [Module 11: Confidential ERC-20](../11-project-erc20/)
