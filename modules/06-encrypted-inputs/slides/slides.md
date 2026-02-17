---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 06: Encrypted Inputs & ZK Proofs"
footer: "Zama Developer Program"
---

<style>
section { font-size: 18px; overflow: hidden; background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%); color: #1E293B; }
h1 { font-size: 28px; margin-bottom: 8px; color: #4F46E5; border-bottom: 3px solid #C7D2FE; padding-bottom: 6px; }
h2 { font-size: 22px; margin-bottom: 6px; color: #0F766E; }
h3 { font-size: 19px; color: #B45309; }
code { font-size: 15px; background: #EEF2FF; color: #4338CA; padding: 1px 4px; border-radius: 3px; }
pre { font-size: 13px; line-height: 1.25; margin: 6px 0; background: #1E293B; color: #E2E8F0; border-radius: 8px; padding: 12px; border-left: 4px solid #6366F1; }
pre code { background: transparent; color: #E2E8F0; padding: 0; }
li { margin-bottom: 1px; line-height: 1.4; }
table { font-size: 15px; border-collapse: collapse; width: 100%; }
th { background: #4F46E5; color: white; padding: 6px 10px; text-align: left; }
td { padding: 5px 10px; border-bottom: 1px solid #E2E8F0; }
tr:nth-child(even) { background: #F1F5F9; }
strong { color: #7C3AED; }
p { margin-bottom: 4px; }
ul, ol { margin-top: 4px; margin-bottom: 4px; }
header { color: #6366F1 !important; font-weight: 600; }
footer { color: #94A3B8 !important; }
section.small { font-size: 15px; }
section.small h1 { font-size: 24px; margin-bottom: 6px; }
section.small ol li { margin-bottom: 0; line-height: 1.3; }
</style>

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

<!--
Speaker notes: Show the hex calldata and point to where the plaintext 1000 (0x3e8) appears. This is the fundamental motivation for encrypted inputs. Even though the value gets encrypted after it reaches the contract, the original plaintext is permanently recorded in the transaction.
-->

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

<!--
Speaker notes: Walk through this diagram left to right. The browser encrypts the value locally, generates a ZK proof, and sends both to the contract. The contract calls FHE.fromExternal() which validates the proof and registers the ciphertext. At no point does the plaintext appear in transaction data.
-->

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

<!--
Speaker notes: Each encrypted type has a corresponding external type. The external type is what appears in the function signature -- it represents the encrypted blob sent by the client. You always pair it with FHE.fromExternal() inside the function body to convert it.
-->

---

# `FHE.fromExternal(input, proof)`

Converts external encrypted input to on-chain encrypted type:

```solidity
function setSecret(
    externalEuint32 encInput,
    bytes calldata inputProof
) external {
    euint32 value = FHE.fromExternal(encInput, inputProof);

    _secret = value;
    FHE.allowThis(_secret);
    FHE.allow(_secret, msg.sender);
}
```

Takes the encrypted input and its ZK proof. Internally: validates ZK proof, registers ciphertext, returns handle.

<!--
Speaker notes: Point out the three-step pattern inside the function: (1) FHE.fromExternal to convert, (2) use the value in FHE operations, (3) set up ACL with allowThis and allow. This is the production pattern for every function that accepts user input.
-->

---

# Client-Side: Encryption Flow

```javascript
import { createInstance } from "@zama-fhe/relayer-sdk/web";

// 1. Create FHEVM instance
const instance = await createInstance({ network });

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

<!--
Speaker notes: Walk through the JavaScript code step by step. The createEncryptedInput binds the encryption to a specific contract and user, preventing replay attacks. The add32() method specifies the type, and encrypt() produces the handles array and proof. This is the client-side counterpart to the Solidity code.
-->

---

# What the ZK Proof Guarantees

1. **Well-formed** — Valid ciphertext under the FHE public key
2. **Range proof** — Value fits within the declared type
3. **Knowledge proof** — Submitter knows the plaintext

All verified automatically inside `FHE.fromExternal(input, proof)`.

<!--
Speaker notes: The ZK proof guarantees three things that prevent attacks. Without well-formedness, someone could submit garbage. Without range proofs, someone could claim a euint8 value of 1000. Without knowledge proofs, someone could replay another user's ciphertext. All checks happen automatically.
-->

---

# Example: Sealed-Bid Auction

```solidity
contract SealedBidAuction is ZamaEthereumConfig {
    mapping(address => euint64) private _bids;
    euint64 private _highestBid;

    function submitBid(
        externalEuint64 encBid,
        bytes calldata inputProof
    ) external {
        euint64 bid = FHE.fromExternal(encBid, inputProof);

        _bids[msg.sender] = bid;
        _highestBid = FHE.max(_highestBid, bid);

        FHE.allowThis(_bids[msg.sender]);
        FHE.allow(_bids[msg.sender], msg.sender);
        FHE.allowThis(_highestBid);
    }
}
```

No bidder can see anyone else's bid amount!

<!--
Speaker notes: This auction example ties encrypted inputs to a real use case. Point out that FHE.max keeps track of the highest bid without revealing any individual bid. This is a preview of Module 13 where students will build the full auction contract.
-->

---

# Multiple Encrypted Inputs

```solidity
function createOrder(
    externalEuint64 encPrice,
    externalEuint32 encQty,
    bytes calldata inputProof
) external {
    euint64 price = FHE.fromExternal(encPrice, inputProof);
    euint32 qty   = FHE.fromExternal(encQty, inputProof);
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

<!--
Speaker notes: Multiple encrypted inputs share a single inputProof. On the client side, you call add64 and add32 on the same input object, then encrypt once. The handles array contains one handle per input in order. The proof covers all inputs together.
-->

---

# Key Rule: `bytes calldata inputProof` Required

```solidity
// WRONG — missing proof parameter
function bad(externalEuint32 encValue) public { }

// CORRECT
function good(externalEuint32 encValue, bytes calldata inputProof) external { }
```

Functions accepting encrypted inputs must always include the `bytes calldata inputProof` parameter.

<!--
Speaker notes: This is a compilation error students will hit frequently. If you see externalEuintXX in a function signature, you MUST have bytes calldata inputProof as well. It is always calldata, never memory, for gas efficiency.
-->

---

# When to Use What

| Scenario | Use |
|----------|-----|
| User-provided private data | `externalEuintXX` + `bytes calldata inputProof` + `FHE.fromExternal(input, inputProof)` |
| Contract-internal constants | `FHE.asEuintXX(plaintext)` |
| Initializing state to zero | `FHE.asEuintXX(0)` |
| Non-sensitive public params | `FHE.asEuintXX(value)` |

<!--
Speaker notes: Use this decision table when designing function signatures. The rule of thumb: if the value comes from a user and should be private, use externalEuintXX. If it is a constant known to everyone (like zero for initialization), use FHE.asEuintXX.
-->

---

# Common Mistakes

| Mistake | Fix |
|---------|-----|
| Missing `bytes calldata inputProof` param | Add `bytes calldata inputProof` to function signature |
| Using external type directly in ops | Call `FHE.fromExternal(input, inputProof)` first |
| Using `FHE.asEuintXX()` for secrets | Use `externalEuintXX` + `inputProof` |
| Forgetting ACL after `fromExternal` | Call `allowThis` + `allow` |

<!--
Speaker notes: Review the common mistakes table. The most frequent error is using FHE.asEuintXX() when the value should be private -- this is a security bug, not a compilation error, so it is easy to miss during development.
-->

---

# Summary

1. `FHE.asEuintXX(plaintext)` exposes the value in calldata
2. `externalEuintXX` + `bytes calldata inputProof` + `FHE.fromExternal(input, inputProof)` = truly private inputs
3. Client encrypts with the Relayer SDK (`@zama-fhe/relayer-sdk`), sends ciphertext + ZK proof
4. ZK proof is auto-verified inside `FHE.fromExternal(input, proof)`
5. Always include `bytes calldata inputProof` parameter alongside encrypted inputs
6. Always manage ACL after conversion

<!--
Speaker notes: Recap the module by emphasizing the full pipeline: client encrypts, sends ciphertext + ZK proof, contract validates with fromExternal, then manages ACL. This is the complete input path for every production FHEVM application.
-->

---

# Next Up

**Module 07: Decryption Patterns**

Learn how to get plaintext values back — public decryption, user-specific reencryption, and the Gateway.

<!--
Speaker notes: Transition by saying: "We now know how to get data IN encrypted. But eventually, someone needs to see results. Module 07 covers how to get data OUT."
-->
