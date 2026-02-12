---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 06: Encrypted Inputs & ZK Proofs"
footer: "Zama Developer Program"
---

# Module 06: Encrypted Inputs & ZK Proofs

How users send truly private data to smart contracts.

---

# The Problem

```solidity
function setBid(uint32 amount) public {
    _bid = FHE.asEuint32(amount);
}
```

Transaction calldata:
```
0x12345678 00000000...000003e8
           ↑ plaintext 1000 — visible to everyone!
```

Encrypting on-chain does NOT hide the input value.

---

# The Solution: Client-Side Encryption

```
┌────────────┐   encrypted blob + ZK proof   ┌──────────────┐
│   Browser  │ ─────────────────────────────► │   Contract   │
│            │                                │              │
│ plaintext  │                                │ externalEuint│
│ → encrypt  │                                │ fromExternal │
│ → zkProof  │                                │ → euint32    │
└────────────┘                                └──────────────┘
```

The plaintext **never** appears on-chain.

---

# External Encrypted Types

| Function Parameter | Converts To |
|-------------------|-------------|
| `externalEbool` | `ebool` |
| `externalEuint8` | `euint8` |
| `externalEuint16` | `euint16` |
| `externalEuint32` | `euint32` |
| `externalEuint64` | `euint64` |
| `externalEuint128` | `euint128` |
| `externalEuint256` | `euint256` |
| `externalEaddress` | `eaddress` |

---

# `FHE.fromExternal(input, proof)`

Converts external encrypted input to on-chain encrypted type:

```solidity
function setSecret(
    externalEuint32 encInput,
    bytes calldata proof
) external {
    euint32 value = FHE.fromExternal(encInput, proof);

    _secret = value;
    FHE.allowThis(_secret);
    FHE.allow(_secret, msg.sender);
}
```

Takes the encrypted input and its ZK proof. Internally: validates ZK proof, registers ciphertext, returns handle.

---

# Client-Side: Encryption Flow

```javascript
import { createFhevmInstance } from "fhevmjs";

// 1. Create FHEVM instance
const instance = await createFhevmInstance({ networkUrl });

// 2. Create encrypted input
const input = await instance.input.createEncryptedInput(
    contractAddress, userAddress
);
input.add32(1000); // plaintext to encrypt

// 3. Encrypt (generates ciphertext + ZK proof)
const encrypted = await input.encrypt();

// 4. Send transaction
await contract.setSecret(
    encrypted.handles[0],
    encrypted.inputProof
);
```

---

# What the ZK Proof Guarantees

1. **Well-formed** — Valid ciphertext under the FHE public key
2. **Range proof** — Value fits within the declared type
3. **Knowledge proof** — Submitter knows the plaintext

All verified automatically inside `FHE.fromExternal(input, proof)`.

---

# Example: Sealed-Bid Auction

```solidity
contract SealedBidAuction is ZamaEthereumConfig {
    mapping(address => euint64) private _bids;
    euint64 private _highestBid;

    function submitBid(
        externalEuint64 encBid,
        bytes calldata proof
    ) external {
        euint64 bid = FHE.fromExternal(encBid, proof);

        _bids[msg.sender] = bid;
        _highestBid = FHE.max(_highestBid, bid);

        FHE.allowThis(_bids[msg.sender]);
        FHE.allow(_bids[msg.sender], msg.sender);
        FHE.allowThis(_highestBid);
    }
}
```

No bidder can see anyone else's bid amount!

---

# Multiple Encrypted Inputs

```solidity
function createOrder(
    externalEuint64 encPrice,
    externalEuint32 encQty,
    bytes calldata proof
) external {
    euint64 price = FHE.fromExternal(encPrice, proof);
    euint32 qty   = FHE.fromExternal(encQty, proof);
    // ... store and use
}
```

Client-side:
```javascript
const input = await instance.input.createEncryptedInput(addr, user);
input.add64(priceVal);
input.add32(qtyVal);
const enc = await input.encrypt();
await contract.createOrder(enc.handles[0], enc.handles[1], enc.inputProof);
```

---

# Key Rule: `bytes calldata proof` Required

```solidity
// WRONG — missing proof parameter
function bad(externalEuint32 encValue) public { }

// CORRECT
function good(externalEuint32 encValue, bytes calldata proof) external { }
```

Functions accepting encrypted inputs must always include the `bytes calldata proof` parameter.

---

# When to Use What

| Scenario | Use |
|----------|-----|
| User-provided private data | `externalEuintXX` + `bytes calldata proof` + `FHE.fromExternal(input, proof)` |
| Contract-internal constants | `FHE.asEuintXX(plaintext)` |
| Initializing state to zero | `FHE.asEuintXX(0)` |
| Non-sensitive public params | `FHE.asEuintXX(value)` |

---

# Common Mistakes

| Mistake | Fix |
|---------|-----|
| Missing `bytes calldata proof` param | Add `bytes calldata proof` to function signature |
| Using external type directly in ops | Call `FHE.fromExternal(input, proof)` first |
| Using `FHE.asEuintXX()` for secrets | Use `externalEuintXX` + `proof` |
| Forgetting ACL after `fromExternal` | Call `allowThis` + `allow` |

---

# Summary

1. `FHE.asEuintXX(plaintext)` exposes the value in calldata
2. `externalEuintXX` + `bytes calldata proof` + `FHE.fromExternal(input, proof)` = truly private inputs
3. Client encrypts with `fhevmjs`, sends ciphertext + ZK proof
4. ZK proof is auto-verified inside `FHE.fromExternal(input, proof)`
5. Always include `bytes calldata proof` parameter alongside encrypted inputs
6. Always manage ACL after conversion

---

# Next Up

**Module 07: Decryption Patterns**

Learn how to get plaintext values back — public decryption, user-specific reencryption, and the Gateway.
