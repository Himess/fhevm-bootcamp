# Module 06: Encrypted Inputs & ZK Proofs — Lesson

**Duration:** 3 hours
**Prerequisites:** Module 05
**Learning Objectives:**
- Handle encrypted inputs from users with FHE.fromExternal()
- Understand ZK proof validation
- Implement client-side encryption flow

## Introduction

In previous modules, we used `FHE.asEuint32(plaintext)` to create encrypted values. While this encrypts the value on-chain, the **plaintext is visible in the transaction calldata**. Anyone monitoring the mempool or reading the blockchain can see the original value.

For truly private inputs, FHEVM provides a mechanism where users **encrypt their data client-side** before submitting it to the blockchain. The contract receives the pre-encrypted data as `externalEuintXX` types and converts them using `FHE.fromExternal(input, proof)`.

---

## 1. The Privacy Problem with On-Chain Encryption

### What Happens with `FHE.asEuint32()`

```solidity
// The user calls: contract.setBid(1000)
function setBid(uint32 amount) public {
    _bid = FHE.asEuint32(amount);  // Encrypted on-chain
}
```

The transaction calldata contains:
```
Function selector: 0x12345678
Argument:         0x00000000000000000000000000000000000000000000000000000000000003e8
                  ↑ This is plaintext 1000 — visible to everyone!
```

### The Solution: Client-Side Encryption

```
┌──────────────┐    encrypted blob     ┌──────────────────┐
│   User's     │ ─────────────────────►│   Smart Contract  │
│   Browser    │    (+ ZK proof)       │                   │
│              │                       │   externalEuint32 │
│  plaintext   │                       │   FHE.fromExternal│
│  → encrypt() │                       │   → euint32       │
└──────────────┘                       └──────────────────┘
```

The plaintext **never appears** on-chain.

---

## 2. External Encrypted Types

FHEVM provides special types for receiving client-encrypted data:

| External Type | On-Chain Type | Description |
|--------------|---------------|-------------|
| `externalEbool` | `ebool` | Encrypted boolean input |
| `externalEuint8` | `euint8` | Encrypted 8-bit input |
| `externalEuint16` | `euint16` | Encrypted 16-bit input |
| `externalEuint32` | `euint32` | Encrypted 32-bit input |
| `externalEuint64` | `euint64` | Encrypted 64-bit input |
| `externalEuint128` | `euint128` | Encrypted 128-bit input |
| `externalEuint256` | `euint256` | Encrypted 256-bit input |
| `externalEaddress` | `eaddress` | Encrypted address input |

These types represent **already encrypted** data coming from the client, bundled with a ZK proof of correctness.

---

## 3. `FHE.fromExternal(input, proof)` — Converting External Inputs

Once the contract receives an `externalEuintXX`, it must convert it to the corresponding on-chain encrypted type:

```solidity
function setSecret(externalEuint32 encValue, bytes calldata inputProof) external {
    euint32 value = FHE.fromExternal(encValue, inputProof);
    _secret = value;
    FHE.allowThis(_secret);
    FHE.allow(_secret, msg.sender);
}
```

### What `FHE.fromExternal(input, proof)` Does

1. **Validates the ZK proof** — Ensures the ciphertext is well-formed and encrypts a valid value within the type's range
2. **Registers the ciphertext** — Stores it in the FHE co-processor
3. **Returns a handle** — The on-chain `euintXX` handle for further operations

### Function Signature Pattern

```solidity
// Single encrypted input
function myFunction(externalEuint32 encValue, bytes calldata inputProof) external {
    euint32 value = FHE.fromExternal(encValue, inputProof);
    // ... use value
}

// Multiple encrypted inputs
function myFunction(
    externalEuint64 encAmount,
    externalEaddress encRecipient,
    bytes calldata inputProof
) external {
    euint64 amt = FHE.fromExternal(encAmount, inputProof);
    eaddress rec = FHE.fromExternal(encRecipient, inputProof);
    // ... use amt and rec
}
```

> **Important:** The `bytes calldata inputProof` parameter carries the ZK proof and must be passed to every `FHE.fromExternal(input, inputProof)` call. Prefer `external` visibility for functions that accept encrypted inputs.

---

## 4. Client-Side Encryption Flow

### Step 1: Get the FHE Public Key

The client first retrieves the network's FHE public key:

```javascript
import { createInstance } from "@zama-fhe/relayer-sdk/web";

const provider = new BrowserProvider(window.ethereum);
const instance = await createInstance({
  network: await provider.send("eth_chainId", []),
  relayerUrl: "https://gateway.zama.ai",
});
```

### Step 2: Encrypt the Value

```javascript
// Encrypt a uint32 value
const encryptedAmount = await instance.input.createEncryptedInput(
  contractAddress,
  userAddress
);
encryptedAmount.add32(1000); // The plaintext value to encrypt
const encrypted = await encryptedAmount.encrypt();

// encrypted contains:
// - encrypted.handles[0]: the ciphertext handle
// - encrypted.inputProof: the ZK proof
```

### Step 3: Send the Transaction

```javascript
const tx = await contract.setSecret(encrypted.handles[0], encrypted.inputProof);
await tx.wait();
```

### Step 4: Contract Receives and Converts

```solidity
function setSecret(externalEuint32 encValue, bytes calldata inputProof) external {
    euint32 value = FHE.fromExternal(encValue, inputProof);
    // Now `value` is a usable on-chain encrypted value
}
```

---

## 5. Complete Example: Sealed-Bid Auction

### Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, ebool, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract SealedBidAuction is ZamaEthereumConfig {
    address public owner;
    mapping(address => euint64) private _bids;
    mapping(address => bool) private _hasBid;
    euint64 private _highestBid;
    bool public auctionOpen;

    constructor() {
        owner = msg.sender;
        auctionOpen = true;
        _highestBid = FHE.asEuint64(0);
        FHE.allowThis(_highestBid);
    }

    /// @notice Submit a sealed bid using client-side encryption
    /// @param encryptedBid The encrypted bid amount from the client
    /// @param inputProof The ZK proof for the encrypted input
    function submitBid(externalEuint64 encryptedBid, bytes calldata inputProof) external {
        require(auctionOpen, "Auction closed");
        require(!_hasBid[msg.sender], "Already bid");

        // Convert external encrypted input to on-chain type
        euint64 bid = FHE.fromExternal(encryptedBid, inputProof);

        // Store the bid
        _bids[msg.sender] = bid;
        _hasBid[msg.sender] = true;

        // Update highest bid
        _highestBid = FHE.max(_highestBid, bid);

        // ACL
        FHE.allowThis(_bids[msg.sender]);
        FHE.allow(_bids[msg.sender], msg.sender);
        FHE.allowThis(_highestBid);
    }

    function closeAuction() public {
        require(msg.sender == owner, "Not owner");
        auctionOpen = false;
    }

    function getMyBid() public view returns (euint64) {
        require(_hasBid[msg.sender], "No bid");
        require(FHE.isSenderAllowed(_bids[msg.sender]), "Not authorized");
        return _bids[msg.sender];
    }
}
```

### Client Code

```javascript
import { createInstance } from "@zama-fhe/relayer-sdk/web";
import { ethers } from "ethers";

async function submitBid(contractAddress, bidAmount) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();

    // Create FHEVM instance
    const instance = await createInstance({
        network: provider,
    });

    // Encrypt the bid
    const input = await instance.input.createEncryptedInput(
        contractAddress,
        userAddress
    );
    input.add64(bidAmount);
    const encrypted = await input.encrypt();

    // Submit to contract
    const contract = new ethers.Contract(contractAddress, ABI, signer);
    const tx = await contract.submitBid(
        encrypted.handles[0],
        encrypted.inputProof
    );
    await tx.wait();
    console.log("Bid submitted successfully!");
}
```

---

## 6. The Role of ZK Proofs

### Why ZK Proofs Are Needed

Without ZK proofs, a malicious user could submit:
- Invalid ciphertexts that cause FHE operations to fail
- Ciphertexts encoding values outside the valid range (e.g., a value > 2^32 for `euint32`)
- Ciphertexts not encrypted under the correct FHE public key

### What the ZK Proof Guarantees

1. **Well-formedness** — The ciphertext is a valid encryption under the network's FHE public key
2. **Range proof** — The encrypted value fits within the declared type's range
3. **Knowledge proof** — The submitter actually knows the plaintext value

### How It Works

```
Client Side:
  plaintext value → FHE.encrypt(value, publicKey) → (ciphertext, zkProof)

On-Chain (FHE.fromExternal(input, proof)):
  1. Verify zkProof against ciphertext     ✓ Well-formed
  2. Check range constraints               ✓ Valid value
  3. Register ciphertext in co-processor   ✓ Ready to use
  4. Return handle                         → euintXX
```

The ZK proof verification happens automatically inside `FHE.fromExternal(input, proof)`. You do not need to verify it manually.

---

## 7. Multiple Encrypted Inputs

You can accept multiple encrypted inputs in a single function:

```solidity
function createOrder(
    externalEuint64 encryptedPrice,
    externalEuint32 encryptedQuantity,
    externalEaddress encryptedRecipient,
    bytes calldata inputProof
) external {
    euint64 price = FHE.fromExternal(encryptedPrice, inputProof);
    euint32 quantity = FHE.fromExternal(encryptedQuantity, inputProof);
    eaddress recipient = FHE.fromExternal(encryptedRecipient, inputProof);

    // Store order details
    _prices[msg.sender] = price;
    _quantities[msg.sender] = quantity;
    _recipients[msg.sender] = recipient;

    // ACL for all values
    FHE.allowThis(price);
    FHE.allow(price, msg.sender);
    FHE.allowThis(quantity);
    FHE.allow(quantity, msg.sender);
    FHE.allowThis(recipient);
    FHE.allow(recipient, msg.sender);
}
```

Client-side:

```javascript
const input = await instance.input.createEncryptedInput(contractAddress, userAddress);
input.add64(priceValue);
input.add32(quantityValue);
input.addAddress(recipientAddress);
const encrypted = await input.encrypt();

const tx = await contract.createOrder(
    encrypted.handles[0],  // price
    encrypted.handles[1],  // quantity
    encrypted.handles[2],  // recipient
    encrypted.inputProof
);
```

---

## 8. Common Mistakes

### Mistake 1: Forgetting the `bytes calldata inputProof` Parameter

```solidity
// WRONG — missing proof parameter
function bad(externalEuint32 encValue) public { }

// CORRECT
function good(externalEuint32 encValue, bytes calldata inputProof) external { }
```

### Mistake 2: Forgetting to Call `FHE.fromExternal(input, inputProof)`

```solidity
// WRONG — cannot use externalEuint32 directly in operations
function bad(externalEuint32 encValue, bytes calldata inputProof) external {
    _value = FHE.add(_value, encValue); // ERROR
}

// CORRECT
function good(externalEuint32 encValue, bytes calldata inputProof) external {
    euint32 val = FHE.fromExternal(encValue, inputProof);
    _value = FHE.add(_value, val);
    FHE.allowThis(_value);
}
```

### Mistake 3: Not Using Encrypted Inputs for Private Data

```solidity
// BAD — user's vote is visible in calldata
function vote(uint8 candidate) public {
    _votes[msg.sender] = FHE.asEuint8(candidate);
}

// GOOD — user's vote is encrypted before submission
function vote(externalEuint8 encryptedVote, bytes calldata inputProof) external {
    euint8 v = FHE.fromExternal(encryptedVote, inputProof);
    _votes[msg.sender] = v;
    FHE.allowThis(_votes[msg.sender]);
}
```

---

## 9. Hardhat Test Environment vs Browser

The API is functionally identical but differs slightly between environments:

| Environment | API |
|-------------|-----|
| Browser (Relayer SDK) | `instance.input.createEncryptedInput(contractAddr, userAddr)` |
| Hardhat Tests | `fhevm.createEncryptedInput(contractAddr, signerAddr)` |

The `fhevm` object in Hardhat is provided by `@fhevm/hardhat-plugin`. Both produce the same `{ handles, inputProof }` output.

```javascript
// Hardhat test
const encrypted = await fhevm
  .createEncryptedInput(contractAddress, deployer.address)
  .add32(42)
  .encrypt();
await contract.myFunction(encrypted.handles[0], encrypted.inputProof);

// Browser (Relayer SDK)
const input = await instance.input.createEncryptedInput(contractAddress, userAddress);
input.add32(42);
const encrypted = await input.encrypt();
await contract.myFunction(encrypted.handles[0], encrypted.inputProof);
```

> Both environments produce the same encrypted output format. The only difference is how the encryption instance is created.

---

## Summary

| Concept | Details |
|---------|---------|
| **Problem** | `FHE.asEuintXX(plaintext)` exposes the value in calldata |
| **Solution** | Client encrypts data before sending; contract receives `externalEuintXX` |
| **Conversion** | `FHE.fromExternal(input, inputProof)` validates ZK proof and returns `euintXX` |
| **Parameters** | Function must accept both `externalEuintXX` and `bytes calldata inputProof` |
| **ZK proof** | Automatically verified — ensures well-formedness and range validity |
| **Client library** | Relayer SDK (`@zama-fhe/relayer-sdk`) handles encryption and proof generation |

**Rule of thumb:** If the plaintext value should be private, always use `externalEuintXX` + `bytes calldata inputProof` + `FHE.fromExternal(input, inputProof)`. Reserve `FHE.asEuintXX()` for non-sensitive constants and contract-internal values.
