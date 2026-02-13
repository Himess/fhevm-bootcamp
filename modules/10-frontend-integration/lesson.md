# Module 10: Frontend Integration -- Lesson

## Introduction

So far we have written and tested FHEVM contracts using Hardhat. In a real application, users interact through a web frontend. This module covers everything needed to connect a React + ethers.js dApp to FHEVM contracts using the **fhevmjs** library.

The key challenges are:
1. The frontend must **encrypt** values before sending them as transaction parameters
2. The frontend must **request decryption** to display encrypted on-chain data to the user
3. External encrypted types (`externalEuint32`, etc.) bridge the gap between off-chain and on-chain

---

## 1. Architecture Overview

```
Browser (React + fhevmjs)
    |
    |-- 1. Initialize FHE instance (fetches public key from chain)
    |-- 2. Encrypt plaintext inputs client-side
    |-- 3. Send encrypted inputs as tx params (externalEuintXX)
    |
    v
FHEVM Contract
    |
    |-- 4. FHE.fromExternal(input, proof) converts to euintXX
    |-- 5. Perform FHE operations
    |-- 6. Store encrypted results with ACL
    |
    v
Gateway (for decryption)
    |
    |-- 7. User requests decryption via fhevmjs
    |-- 8. Gateway re-encrypts for user's keypair
    |-- 9. Frontend decrypts and displays
```

---

## 2. Installing fhevmjs

```bash
npm install fhevmjs ethers
```

For a React project (Vite):

```bash
npm create vite@latest my-fhevm-app -- --template react-ts
cd my-fhevm-app
npm install fhevmjs ethers
```

---

## 3. Initializing the FHE Instance

The FHE instance must be created once and reused. It fetches the network's FHE public key.

```typescript
import { createInstance } from "fhevmjs";
import { BrowserProvider } from "ethers";

let fheInstance: Awaited<ReturnType<typeof createInstance>> | null = null;

async function initFhevm(): Promise<typeof fheInstance> {
  if (fheInstance) return fheInstance;

  const provider = new BrowserProvider(window.ethereum);

  fheInstance = await createInstance({
    networkUrl: await provider.send("eth_chainId", []),
    gatewayUrl: "https://gateway.zama.ai",
  });

  return fheInstance;
}
```

> **Important:** The instance caches the FHE public key. You only need to initialize once per page load.

---

## 4. The SimpleCounter Contract

Here is the contract we will connect to from the frontend:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract SimpleCounter is ZamaEthereumConfig {
    mapping(address => euint32) private _counts;

    event CountIncremented(address indexed user);

    function increment(externalEuint32 encValue, bytes calldata proof) external {
        euint32 value = FHE.fromExternal(encValue, proof);
        _counts[msg.sender] = FHE.add(_counts[msg.sender], value);
        FHE.allowThis(_counts[msg.sender]);
        FHE.allow(_counts[msg.sender], msg.sender);
        emit CountIncremented(msg.sender);
    }

    function getMyCount() external view returns (euint32) {
        return _counts[msg.sender];
    }
}
```

Key points:
- The contract uses a per-user `mapping(address => euint32)` so each user has their own private counter
- The `increment` function accepts `externalEuint32` and `bytes calldata proof` -- these are the encrypted handle and input proof that come from the frontend
- `FHE.fromExternal(encValue, proof)` converts the external type to a usable `euint32`
- `getMyCount()` returns the caller's encrypted count handle (for re-encryption/decryption)
- ACL is set for both the contract (`allowThis`) and the user (`allow`)

---

## 5. Creating Encrypted Inputs

On the frontend, use fhevmjs to encrypt a plaintext value before sending it in a transaction:

```typescript
async function encryptAmount(
  amount: number,
  contractAddress: string,
  userAddress: string
) {
  const instance = await initFhevm();

  // Create an encrypted input bound to this contract and user
  const input = instance.createEncryptedInput(contractAddress, userAddress);
  input.add32(amount); // add a 32-bit encrypted value

  const encrypted = await input.encrypt();
  // encrypted.handles[0] = the encrypted handle (bytes32)
  // encrypted.inputProof = the ZK proof (bytes)
  return encrypted;
}
```

The `createEncryptedInput` method binds the encrypted value to a specific contract address and user address. This prevents replay attacks.

Available input methods:
- `input.addBool(value)` -- encrypt a boolean
- `input.add8(value)` -- encrypt a uint8
- `input.add16(value)` -- encrypt a uint16
- `input.add32(value)` -- encrypt a uint32
- `input.add64(value)` -- encrypt a uint64
- `input.add128(value)` -- encrypt a uint128
- `input.add256(value)` -- encrypt a uint256
- `input.addAddress(value)` -- encrypt an address

---

## 6. Sending Encrypted Transactions

```typescript
import { Contract, BrowserProvider } from "ethers";

const COUNTER_ABI = [
  "function increment(bytes32 encValue, bytes calldata proof) external",
  "function getMyCount() external view returns (uint256)",
];

async function incrementCounter(amount: number) {
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const userAddress = await signer.getAddress();

  const contract = new Contract(COUNTER_ADDRESS, COUNTER_ABI, signer);

  // Encrypt the amount
  const encrypted = await encryptAmount(amount, COUNTER_ADDRESS, userAddress);

  // Send the transaction with the encrypted handle and input proof
  const tx = await contract.increment(encrypted.handles[0], encrypted.inputProof);
  await tx.wait();

  console.log("Counter incremented!");
}
```

> **Note:** On the ABI level, `externalEuint32` appears as `bytes32` (the handle), and the proof is `bytes`. The contract only has `increment()` -- there is no `decrement()` function. Each user has their own counter via a per-user mapping.

---

## 7. Requesting Decryption

To read an encrypted value, the user must request decryption through the gateway:

```typescript
async function readCounter(): Promise<number> {
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const userAddress = await signer.getAddress();

  const contract = new Contract(COUNTER_ADDRESS, COUNTER_ABI, signer);
  const instance = await initFhevm();

  // Get the encrypted handle from the contract
  const encryptedHandle = await contract.getMyCount();

  // Request re-encryption for this user
  // The user must sign a message to prove they have ACL access
  const { publicKey, privateKey } = instance.generateKeypair();
  const eip712 = instance.createEIP712(publicKey, COUNTER_ADDRESS);
  const signature = await signer.signTypedData(
    eip712.domain,
    eip712.types,
    eip712.message
  );

  const decryptedValue = await instance.reencrypt(
    encryptedHandle,
    privateKey,
    publicKey,
    signature,
    COUNTER_ADDRESS,
    userAddress
  );

  return Number(decryptedValue);
}
```

The decryption flow:
1. The contract returns an encrypted handle (a `uint256` reference to the ciphertext)
2. The user generates a temporary keypair
3. The user signs an EIP-712 message to prove ACL access
4. The gateway re-encrypts the ciphertext with the user's temporary public key
5. The frontend decrypts with the temporary private key

---

## 8. React Component Pattern

Here is a complete React component that ties everything together:

```tsx
import { useState, useEffect } from "react";

function CounterApp() {
  const [counter, setCounter] = useState<number | null>(null);
  const [amount, setAmount] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshCounter();
  }, []);

  async function refreshCounter() {
    try {
      const value = await readCounter();
      setCounter(value);
    } catch (err) {
      console.error("Failed to read counter:", err);
    }
  }

  async function handleIncrement() {
    setLoading(true);
    try {
      await incrementCounter(amount);
      await refreshCounter();
    } catch (err) {
      console.error("Increment failed:", err);
    }
    setLoading(false);
  }

  return (
    <div>
      <h1>Encrypted Counter</h1>
      <p>Your counter value: {counter !== null ? counter : "Loading..."}</p>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        min={1}
      />
      <button onClick={handleIncrement} disabled={loading}>
        + Increment
      </button>
      <button onClick={refreshCounter} disabled={loading}>
        Refresh
      </button>
    </div>
  );
}
```

---

## 9. External Types: The Bridge

When encrypted data crosses the contract boundary (from frontend to contract), it uses **external types**:

| External Type | Internal Type | Conversion |
|--------------|---------------|------------|
| `externalEbool` | `ebool` | `FHE.fromExternal(val, proof)` |
| `externalEuint8` | `euint8` | `FHE.fromExternal(val, proof)` |
| `externalEuint16` | `euint16` | `FHE.fromExternal(val, proof)` |
| `externalEuint32` | `euint32` | `FHE.fromExternal(val, proof)` |
| `externalEuint64` | `euint64` | `FHE.fromExternal(val, proof)` |
| `externalEuint128` | `euint128` | `FHE.fromExternal(val, proof)` |
| `externalEuint256` | `euint256` | `FHE.fromExternal(val, proof)` |
| `externalEaddress` | `eaddress` | `FHE.fromExternal(val, proof)` |

The pattern is always:
1. Contract function parameters: `externalEuintXX` and `bytes calldata proof`
2. First line inside function: `euintXX val = FHE.fromExternal(externalVal, proof);`
3. Then use `val` normally with FHE operations

---

## 10. Error Handling and Best Practices

### Always Initialize Before Encrypting

```typescript
// BAD: might fail if instance not ready
const encrypted = instance.createEncryptedInput(...);

// GOOD: ensure initialization
const instance = await initFhevm();
const encrypted = instance.createEncryptedInput(...);
```

### Handle Wallet Connection

```typescript
async function connectWallet(): Promise<string> {
  if (!window.ethereum) {
    throw new Error("MetaMask not detected");
  }
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  return accounts[0];
}
```

### Cache Decrypted Values

Decryption requests go through the gateway and require a signature. Cache results when appropriate:

```typescript
const decryptionCache = new Map<string, number>();

async function cachedDecrypt(handle: bigint): Promise<number> {
  const key = handle.toString();
  if (decryptionCache.has(key)) {
    return decryptionCache.get(key)!;
  }
  const value = await readCounter();
  decryptionCache.set(key, value);
  return value;
}
```

### Clear Cache on State Changes

After any write transaction, invalidate cached values:

```typescript
async function handleIncrement() {
  await incrementCounter(amount);
  decryptionCache.clear(); // Invalidate cache
  await refreshCounter();
}
```

---

## Frontend vs. Hardhat Test: Decryption Differences

The encryption flow is the same in both environments, but **decryption differs**:

| Environment | SDK | Decrypt Method |
|-------------|-----|----------------|
| **Browser (Frontend)** | `fhevmjs` | `instance.reencrypt()` with keypair + EIP-712 signature |
| **Hardhat Tests** | `@fhevm/hardhat-plugin` | `fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddr, signer)` |

In Hardhat tests, the `fhevm` object is available via `import { ethers, fhevm } from "hardhat"` and provides a simpler API for testing purposes:

```typescript
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

// Decrypt in tests
const clear = await fhevm.userDecryptEuint(
  FhevmType.euint32,
  encryptedHandle,
  contractAddress,
  signer
);
```

The `FhevmType` enum maps to the encrypted types: `FhevmType.ebool`, `FhevmType.euint8`, `FhevmType.euint16`, `FhevmType.euint32`, `FhevmType.euint64`, `FhevmType.euint128`, `FhevmType.euint256`, `FhevmType.eaddress`.

---

### Alternative: Public Decryption

For values that should be readable by **everyone** (e.g., auction results, vote tallies), use `FHE.makePubliclyDecryptable()` instead of the re-encryption flow:

```solidity
// In the contract
FHE.makePubliclyDecryptable(encryptedResult);
```

After calling `makePubliclyDecryptable()`, any user can decrypt the value without needing ACL access or the re-encryption protocol. This is simpler but removes privacy — use it only for values that should become public.

---

## Summary

- **fhevmjs** provides the client-side tools for encrypting inputs and decrypting outputs
- Use `createEncryptedInput()` to encrypt values bound to a specific contract and user
- Contract parameters use `externalEuintXX` and `bytes calldata proof` types; convert with `FHE.fromExternal(val, proof)`
- Decryption requires EIP-712 signatures to prove ACL access
- The gateway re-encrypts ciphertexts for the user's temporary keypair
- Always initialize the FHE instance before performing any operations
- Cache decryption results and invalidate on state changes
