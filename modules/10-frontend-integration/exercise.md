# Module 10: Exercise -- Build a Frontend for SimpleCounter

## Objective

Build a React frontend that connects to the `SimpleCounter` FHEVM contract, allowing users to encrypt inputs, send transactions, and decrypt their counter value.

---

## Prerequisites

- Node.js 18+
- MetaMask installed
- A deployed `SimpleCounter` contract on a FHEVM-enabled testnet

---

## Task 1: Project Setup

Create a new React + Vite project and install dependencies:

```bash
npm create vite@latest fhevm-counter-app -- --template react-ts
cd fhevm-counter-app
npm install @zama-fhe/relayer-sdk ethers
```

---

## Task 2: FHE Instance Helper

Create a file `src/fhevm.ts` that exports an `initFhevm()` function:

```typescript
// src/fhevm.ts
import { createInstance } from "@zama-fhe/relayer-sdk/web";
import { BrowserProvider } from "ethers";

// TODO: Create a singleton FHE instance
// 1. Check if instance already exists (avoid re-init)
// 2. Create a BrowserProvider from window.ethereum
// 3. Call createInstance() with network and relayerUrl
// 4. Return the instance
```

---

## Task 3: Encrypt and Send

Create a file `src/counter.ts` with functions to interact with the contract:

```typescript
// src/counter.ts
import { Contract, BrowserProvider } from "ethers";
import { initFhevm } from "./fhevm";

const COUNTER_ADDRESS = "YOUR_DEPLOYED_ADDRESS";
const COUNTER_ABI = [
  "function increment(bytes32 encValue, bytes calldata inputProof) external",
  "function getMyCount() external view returns (uint256)",
];

export async function incrementCounter(amount: number): Promise<void> {
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const userAddress = await signer.getAddress();
  const contract = new Contract(COUNTER_ADDRESS, COUNTER_ABI, signer);
  const instance = await initFhevm();

  // TODO: Create encrypted input using instance.createEncryptedInput()
  // TODO: Add a 32-bit value using input.add32(amount)
  // TODO: Encrypt the input
  // TODO: Send the transaction via contract.increment(encrypted.handles[0], encrypted.inputProof)
  // TODO: Wait for the transaction to be mined
}

export async function readCounter(): Promise<number> {
  // TODO: Get encrypted handle from contract.getMyCount()
  // TODO: Generate keypair with instance.generateKeypair()
  // TODO: Create EIP-712 message with instance.createEIP712()
  // TODO: Sign with signer.signTypedData()
  // TODO: Call instance.reencrypt() to get the decrypted value
  // TODO: Return the number
}
```

---

## Task 4: React Component

Create or update `src/App.tsx`:

```tsx
// src/App.tsx
import { useState, useEffect } from "react";
import { incrementCounter, readCounter } from "./counter";

function App() {
  const [counter, setCounter] = useState<number | null>(null);
  const [amount, setAmount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // TODO: useEffect to call refreshCounter on mount

  async function refreshCounter() {
    // TODO: Call readCounter() and update state
    // TODO: Handle errors with try/catch
  }

  async function handleIncrement() {
    // TODO: Set loading state
    // TODO: Call incrementCounter(amount)
    // TODO: Refresh the counter display
    // TODO: Handle errors and reset loading state
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Encrypted Counter dApp</h1>

      <div style={{ fontSize: "2rem", margin: "1rem 0" }}>
        {counter !== null ? counter : "---"}
      </div>

      <div>
        <label>Amount: </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          min={1}
          disabled={loading}
        />
      </div>

      <div style={{ marginTop: "1rem" }}>
        <button onClick={handleIncrement} disabled={loading}>
          + Increment
        </button>
        <button onClick={refreshCounter} disabled={loading}>
          Refresh
        </button>
      </div>

      {status && <p>{status}</p>}
    </div>
  );
}

export default App;
```

---

## Step-by-Step Instructions

1. **Task 2:** Initialize the FHE instance as a singleton. Use `createInstance()` from the Relayer SDK (`@zama-fhe/relayer-sdk`).
2. **Task 3 - Encrypt:** Use `instance.createEncryptedInput(contractAddress, userAddress)`, call `input.add32(amount)`, then `input.encrypt()`.
3. **Task 3 - Send:** Pass the encrypted handle and proof to `contract.increment(encrypted.handles[0], encrypted.inputProof)`.
4. **Task 3 - Decrypt:** Use `instance.generateKeypair()`, `instance.createEIP712()`, `signer.signTypedData()`, and `instance.reencrypt()`.
5. **Task 4:** Wire up the React component with `useState`, `useEffect`, and the counter functions.

---

## Hints

<details>
<summary>Hint 1: initFhevm singleton</summary>

```typescript
let fheInstance: any = null;

export async function initFhevm() {
  if (fheInstance) return fheInstance;
  const provider = new BrowserProvider(window.ethereum);
  fheInstance = await createInstance({
    network: await provider.send("eth_chainId", []),
    relayerUrl: "https://gateway.zama.ai",
  });
  return fheInstance;
}
```
</details>

<details>
<summary>Hint 2: Encrypting and sending</summary>

```typescript
const instance = await initFhevm();
const input = instance.createEncryptedInput(COUNTER_ADDRESS, userAddress);
input.add32(amount);
const encrypted = await input.encrypt();
const tx = await contract.increment(encrypted.handles[0], encrypted.inputProof);
await tx.wait();
```
</details>

<details>
<summary>Hint 3: Decryption flow</summary>

```typescript
const handle = await contract.getMyCount();
const instance = await initFhevm();
const { publicKey, privateKey } = instance.generateKeypair();
const eip712 = instance.createEIP712(publicKey, COUNTER_ADDRESS);
const signature = await signer.signTypedData(
  eip712.domain, eip712.types, eip712.message
);
const value = await instance.reencrypt(
  handle, privateKey, publicKey, signature,
  COUNTER_ADDRESS, userAddress
);
return Number(value);
```
</details>

---

## Bonus Challenges

1. **Add a "Connect Wallet" button** that shows the connected address and handles disconnection.
2. **Add a transaction history** panel that shows the last 5 increment operations with timestamps.
3. **Add loading spinners** during encryption, transaction sending, and decryption phases separately.
4. **Deploy to Vercel** and test with a friend using a different wallet.

---

## Success Criteria

- [ ] FHE instance initializes successfully on page load
- [ ] Increment encrypts a value and sends it as a transaction with `contract.increment(encrypted.handles[0], encrypted.inputProof)`
- [ ] Counter value is decrypted via `getMyCount()` and displayed correctly
- [ ] Loading states prevent double-clicking during operations
- [ ] Errors are caught and displayed to the user
