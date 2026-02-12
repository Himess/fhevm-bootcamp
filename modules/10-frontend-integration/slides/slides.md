---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 10: Frontend Integration"
footer: "Zama Developer Program"
---

# Module 10: Frontend Integration

Connecting your dApp to FHEVM with fhevmjs.

---

# Architecture Overview

```
Browser (React + fhevmjs)
  --> Encrypt inputs client-side
  --> Send encrypted bytes in transactions
  --> Request decryption via gateway

FHEVM Contract
  --> FHE.fromExternal(val, proof) to convert inputs
  --> FHE operations on encrypted data
  --> ACL grants for user access

Gateway
  --> Re-encrypts for user's keypair
  --> User decrypts locally
```

---

# Key Library: fhevmjs

```bash
npm install fhevmjs ethers
```

Provides:
- `createInstance()` -- Initialize FHE with network's public key
- `createEncryptedInput()` -- Encrypt values for a contract
- `generateKeypair()` -- Create temporary keys for decryption
- `reencrypt()` -- Request decryption from gateway

---

# Initializing the FHE Instance

```typescript
import { createInstance } from "fhevmjs";
import { BrowserProvider } from "ethers";

const provider = new BrowserProvider(window.ethereum);

const instance = await createInstance({
  networkUrl: await provider.send("eth_chainId", []),
  gatewayUrl: "https://gateway.zama.ai",
});
```

Initialize **once** per page load, then reuse.

---

# External Types

Frontend sends encrypted bytes. Contract receives external types.

| Frontend | Contract Parameter | Internal |
|----------|-------------------|----------|
| `input.add32(42)` | `externalEuint32` | `euint32` |
| `input.add64(100)` | `externalEuint64` | `euint64` |
| `input.addBool(true)` | `externalEbool` | `ebool` |

**Conversion:** `FHE.fromExternal(externalValue, proof)`

---

# Contract Example: SimpleCounter

```solidity
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

- Per-user mapping: each address has its own encrypted counter
- No `decrement()` -- only `increment()` and `getMyCount()`

---

# Encrypting Inputs (Frontend)

```typescript
const instance = await initFhevm();

// Bind to contract + user (prevents replay)
const input = instance.createEncryptedInput(
  contractAddress,
  userAddress
);

input.add32(42); // Encrypt a uint32 value

const encrypted = await input.encrypt();
```

Pass `encrypted` as the transaction parameter.

---

# Sending the Transaction

```typescript
const contract = new Contract(
  COUNTER_ADDRESS, COUNTER_ABI, signer
);

const encrypted = await encryptAmount(
  5, COUNTER_ADDRESS, userAddress
);

const tx = await contract.increment(encrypted.handles[0], encrypted.inputProof);
await tx.wait();
```

The encrypted handle and input proof are sent as separate parameters on the ABI level.

---

# Decryption Flow

1. Get encrypted handle from contract
2. Generate temporary keypair
3. Sign EIP-712 message (proves ACL access)
4. Gateway re-encrypts for user's public key
5. Frontend decrypts with private key

---

# Decryption Code

```typescript
const handle = await contract.getMyCount();

const { publicKey, privateKey } =
  instance.generateKeypair();
const eip712 = instance.createEIP712(
  publicKey, COUNTER_ADDRESS
);
const signature = await signer.signTypedData(
  eip712.domain, eip712.types, eip712.message
);

const value = await instance.reencrypt(
  handle, privateKey, publicKey,
  signature, COUNTER_ADDRESS, userAddress
);
```

---

# React Pattern

```tsx
function CounterApp() {
  const [counter, setCounter] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleIncrement() {
    setLoading(true);
    await incrementCounter(amount);
    const value = await readCounter();
    setCounter(value);
    setLoading(false);
  }

  return (
    <div>
      <p>Counter: {counter ?? "Loading..."}</p>
      <button onClick={handleIncrement}
              disabled={loading}>
        Increment
      </button>
    </div>
  );
}
```

---

# Best Practices

1. **Initialize once** -- Cache the FHE instance
2. **Bind inputs** -- Always bind to contract + user address
3. **Cache decryption** -- Avoid redundant gateway calls
4. **Invalidate on writes** -- Clear cache after transactions
5. **Handle errors** -- Wallet connection, network, gateway failures
6. **Loading states** -- FHE operations are slower than plain txs

---

# Trust Model

| Component | Trusts | Role |
|-----------|--------|------|
| User | Their own browser | Encrypts inputs locally |
| Contract | FHE coprocessor | Computes on ciphertexts |
| Gateway | ACL + signatures | Re-encrypts for authorized users |
| Nobody | Sees plaintext | Unless granted ACL access |

The user's plaintext never leaves their browser unencrypted.

---

# Summary

- **fhevmjs** bridges frontend and FHEVM contracts
- Encrypt with `createEncryptedInput()` + `input.add32()`
- Contract receives `externalEuint32` + `bytes calldata proof`, converts with `FHE.fromExternal(val, proof)`
- Decrypt via EIP-712 signature + gateway re-encryption
- Cache FHE instance and decrypted values for performance

---

# Next Up

**Module 11: Confidential ERC-20**

Build a full ERC-20 token with encrypted balances!
