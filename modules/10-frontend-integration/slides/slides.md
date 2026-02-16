---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 10: Frontend Integration"
footer: "Zama Developer Program"
---

<style>
section { font-size: 18px; overflow: hidden; }
h1 { font-size: 28px; margin-bottom: 8px; }
h2 { font-size: 22px; margin-bottom: 6px; }
h3 { font-size: 19px; }
code { font-size: 15px; }
pre { font-size: 13px; line-height: 1.25; margin: 6px 0; }
li { margin-bottom: 1px; line-height: 1.4; }
table { font-size: 15px; }
p { margin-bottom: 4px; }
ul, ol { margin-top: 4px; margin-bottom: 4px; }
</style>

# Module 10: Frontend Integration

Connecting your dApp to FHEVM with the Relayer SDK.

---

# Architecture Overview

```
Browser (React + Relayer SDK)
  --> Encrypt inputs client-side
  --> Send encrypted bytes in transactions
  --> Request decryption via relayer

FHEVM Contract
  --> FHE.fromExternal(val, inputProof) to convert inputs
  --> FHE operations on encrypted data
  --> ACL grants for user access

Gateway
  --> Re-encrypts for user's keypair
  --> User decrypts locally
```

<!--
Speaker notes: Walk through the three layers of the architecture. The browser handles encryption and decryption. The contract handles FHE operations. The relayer bridges the two for decryption. Emphasize that the user's plaintext never leaves the browser.
-->

---

# Key Library: Relayer SDK (`@zama-fhe/relayer-sdk`)

```bash
npm install @zama-fhe/relayer-sdk ethers
```

Provides:
- `createInstance()` -- Initialize FHE with network's public key
- `createEncryptedInput()` -- Encrypt values for a contract
- `generateKeypair()` -- Create temporary keys for decryption
- `reencrypt()` -- Request decryption from relayer

<!--
Speaker notes: The Relayer SDK is the client-side counterpart to @fhevm/solidity. These four functions cover the complete frontend workflow: initialize, encrypt inputs, generate keys, and decrypt results. Install alongside ethers.js for a complete dApp setup.
-->

---

# Initializing the FHE Instance

```typescript
import { createInstance } from "@zama-fhe/relayer-sdk/web";
import { BrowserProvider } from "ethers";

const provider = new BrowserProvider(window.ethereum);

const instance = await createInstance({
  network: await provider.send("eth_chainId", []),
  relayerUrl: "https://gateway.zama.ai",
});
```

Initialize **once** per page load, then reuse.

<!--
Speaker notes: The instance creation fetches the FHE public key from the network. This is a one-time operation per page load -- store the instance in a React context or module-level variable. Creating multiple instances wastes resources and can cause bugs. Note: `network` replaces the old `networkUrl` parameter, and `relayerUrl` replaces `gatewayUrl`.
-->

---

# External Types

Frontend sends encrypted bytes. Contract receives external types.

| Frontend | Contract Parameter | Internal |
|----------|-------------------|----------|
| `input.add32(42)` | `externalEuint32` | `euint32` |
| `input.add64(100)` | `externalEuint64` | `euint64` |
| `input.addBool(true)` | `externalEbool` | `ebool` |

**Conversion:** `FHE.fromExternal(externalValue, inputProof)`

<!--
Speaker notes: This table maps the client-side add methods to the contract-side external types. The naming is consistent: add32 produces externalEuint32, add64 produces externalEuint64. Always make sure the add method matches the contract's expected type.
-->

---

# Contract Example: SimpleCounter

```solidity
contract SimpleCounter is ZamaEthereumConfig {
    mapping(address => euint32) private _counts;

    event CountIncremented(address indexed user);

    function increment(externalEuint32 encValue, bytes calldata inputProof) external {
        euint32 value = FHE.fromExternal(encValue, inputProof);
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

<!--
Speaker notes: This is the reference contract for the frontend integration. Point out the per-user mapping, the event emission, and the ACL grants. The getMyCount getter returns an encrypted handle -- the frontend must decrypt it using the reencryption flow.
-->

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

<!--
Speaker notes: Walk through the encryption flow step by step. createEncryptedInput binds to contract + user to prevent replay attacks. add32(42) specifies the value and type. encrypt() returns the handles array and proof. This is the same pattern from Module 06, now in the frontend context.
-->

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

<!--
Speaker notes: Show how the encrypted object maps to the contract parameters: handles[0] maps to the externalEuint32 parameter, and inputProof maps to bytes calldata inputProof. The ABI encoding handles the rest. This is standard ethers.js contract interaction.
-->

---

# Decryption Flow

1. Get encrypted handle from contract
2. Generate temporary keypair
3. Sign EIP-712 message (proves ACL access)
4. Gateway re-encrypts for user's public key
5. Frontend decrypts with private key

<!--
Speaker notes: The decryption flow has five steps. The EIP-712 signature proves to the gateway that the user has ACL access. The gateway re-encrypts the value for the user's temporary public key. The user decrypts locally with their temporary private key. This ensures the plaintext only exists in the user's browser.
-->

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

<!--
Speaker notes: This code block is the full decryption implementation. Point out the temporary keypair generation, the EIP-712 typed data signing (which the user sees in MetaMask), and the final reencrypt call. The handle comes from the contract, and the value comes back as a plaintext BigInt.
-->

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

<!--
Speaker notes: This React component shows the typical UX pattern: loading state during the FHE operation, then display the decrypted result. FHE transactions are slower than regular transactions, so loading indicators are essential. The pattern is: encrypt, transact, wait, decrypt, display.
-->

---

# Best Practices

1. **Initialize once** -- Cache the FHE instance
2. **Bind inputs** -- Always bind to contract + user address
3. **Cache decryption** -- Avoid redundant gateway calls
4. **Invalidate on writes** -- Clear cache after transactions
5. **Handle errors** -- Wallet connection, network, gateway failures
6. **Loading states** -- FHE operations are slower than plain txs

<!--
Speaker notes: These best practices come from real production experience. The most impactful ones are caching the FHE instance (avoids repeated public key fetches) and invalidating cache on writes (prevents stale data display). Loading states are critical because users are not used to the FHE latency.
-->

---

# Trust Model

| Component | Trusts | Role |
|-----------|--------|------|
| User | Their own browser | Encrypts inputs locally |
| Contract | FHE coprocessor | Computes on ciphertexts |
| Gateway | ACL + signatures | Re-encrypts for authorized users |
| Nobody | Sees plaintext | Unless granted ACL access |

The user's plaintext never leaves their browser unencrypted.

<!--
Speaker notes: The trust model is the security argument for FHEVM dApps. Walk through each row: the user trusts their browser, the contract trusts the coprocessor, the gateway trusts ACL signatures, and nobody sees plaintext unless authorized. This is a powerful privacy guarantee.
-->

---

# Summary

- The **Relayer SDK (`@zama-fhe/relayer-sdk`)** bridges frontend and FHEVM contracts
- Encrypt with `createEncryptedInput()` + `input.add32()`
- Contract receives `externalEuint32` + `bytes calldata inputProof`, converts with `FHE.fromExternal(val, inputProof)`
- Decrypt via EIP-712 signature + relayer re-encryption
- Cache FHE instance and decrypted values for performance

<!--
Speaker notes: Recap the full frontend flow: initialize the Relayer SDK, encrypt inputs with createEncryptedInput, send transactions with handles and proof, decrypt results via EIP-712 + relayer reencryption. Students now have everything they need to build full-stack FHEVM dApps.
-->

---

# Next Up

**Module 11: Confidential ERC-20**

Build a full ERC-20 token with encrypted balances!

<!--
Speaker notes: Transition to the first project module. Module 11 applies everything learned so far to build a real confidential ERC-20 token. This is where theory meets practice.
-->
