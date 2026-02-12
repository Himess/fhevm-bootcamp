# Module 07: Decryption Patterns — Lesson

## Introduction

Encrypted data is only useful if you can eventually act on the plaintext. FHEVM provides two primary decryption approaches:

1. **Public decryption** — The plaintext is revealed on-chain (visible to everyone)
2. **Reencryption** — The data is re-encrypted for a specific user (only they can see it)

Both approaches go through the **Gateway** and **KMS** (Key Management Service), which manages the FHE secret key in a distributed manner.

---

## 1. The Decryption Architecture

```
┌──────────────┐     decrypt request     ┌──────────────┐
│   Contract    │ ──────────────────────► │   Gateway    │
│   (on-chain)  │                         │  (off-chain)  │
│               │     callback with       │               │
│               │ ◄────plaintext───────── │               │
└──────────────┘                         └───────┬──────┘
                                                 │
                                                 │ threshold
                                                 │ decrypt
                                                 ▼
                                         ┌──────────────┐
                                         │     KMS      │
                                         │ (distributed) │
                                         └──────────────┘
```

### Key Points

- **Decryption is asynchronous** — You request it in one transaction, and the result comes back in a separate callback transaction.
- **The Gateway** is an off-chain relayer that receives decryption requests and forwards them to the KMS.
- **The KMS** holds shares of the FHE secret key and performs threshold decryption.
- The contract must implement a **callback function** to receive the decrypted result.

---

## 2. Public Decryption (Gateway Callback)

Public decryption reveals the plaintext to everyone on the blockchain. Use it when:
- The result should be publicly visible (e.g., auction winner, game outcome)
- You need to branch on a decrypted value in a subsequent transaction

### Step 1: Request Decryption

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {GatewayConfig} from "@fhevm/solidity/gateway/GatewayConfig.sol";

contract AuctionReveal is ZamaEthereumConfig, GatewayConfig {
    euint64 private _highestBid;
    uint64 public revealedHighestBid;
    bool public isRevealed;

    constructor() {
        _highestBid = FHE.asEuint64(0);
        FHE.allowThis(_highestBid);
    }

    function requestReveal() public {
        // Create an array of ciphertext handles to decrypt
        uint256[] memory cts = new uint256[](1);
        cts[0] = FHE.toUint256(_highestBid);

        // Request decryption from the Gateway
        Gateway.requestDecryption(
            cts,                           // ciphertexts to decrypt
            this.revealCallback.selector,  // callback function
            0,                             // msg value for callback
            block.timestamp + 100,         // deadline
            false                          // not expecting bytes
        );
    }

    /// @notice Callback called by the Gateway with the decrypted value
    function revealCallback(uint256 /*requestId*/, uint64 decryptedValue) public onlyGateway {
        revealedHighestBid = decryptedValue;
        isRevealed = true;
    }
}
```

### Key Elements

1. **`GatewayConfig`** — Import and inherit for Gateway functionality
2. **`Gateway.requestDecryption()`** — Initiates the decryption request
3. **`this.revealCallback.selector`** — The function that will receive the result
4. **`onlyGateway`** — Modifier ensuring only the Gateway can call the callback
5. **`FHE.toUint256()`** — Converts an encrypted handle to its uint256 representation

---

## 3. Decryption Request Parameters

```solidity
Gateway.requestDecryption(
    cts,              // uint256[] — array of ciphertext handles
    callbackSelector, // bytes4 — selector of the callback function
    msgValue,         // uint256 — ETH value sent with callback tx
    deadline,         // uint256 — timestamp deadline for the response
    isBytes           // bool — true if decrypting ebytesXX types
);
```

### The Callback Function Signature

The callback receives:
- A `uint256 requestId` as the first parameter
- One parameter per decrypted value, in the type matching the encrypted type

```solidity
// For a single euint32:
function callback(uint256 requestId, uint32 value) public onlyGateway { }

// For a single euint64:
function callback(uint256 requestId, uint64 value) public onlyGateway { }

// For multiple values (euint32 + ebool):
function callback(uint256 requestId, uint32 val, bool flag) public onlyGateway { }
```

---

## 4. Decrypting Multiple Values

```solidity
function requestMultipleDecryptions() public {
    uint256[] memory cts = new uint256[](3);
    cts[0] = FHE.toUint256(_value1);  // euint32
    cts[1] = FHE.toUint256(_value2);  // euint64
    cts[2] = FHE.toUint256(_flag);    // ebool

    Gateway.requestDecryption(
        cts,
        this.multiCallback.selector,
        0,
        block.timestamp + 100,
        false
    );
}

function multiCallback(
    uint256 requestId,
    uint32 val1,
    uint64 val2,
    bool flag
) public onlyGateway {
    _plainValue1 = val1;
    _plainValue2 = val2;
    _plainFlag = flag;
}
```

---

## 5. Reencryption (User-Specific Decryption)

Reencryption lets a specific user view their own encrypted data **without revealing it publicly**. The data is re-encrypted under the user's personal key so only they can decrypt it off-chain.

### How Reencryption Works

```
┌──────────────┐                    ┌──────────────┐
│   Contract    │   user requests    │   Gateway    │
│               │   reencryption     │              │
│   euint64     │ ──────────────────►│              │
│   balance     │                    │  re-encrypt  │
│               │                    │  under user  │
│               │   encrypted blob   │  public key  │
│               │ ◄──────────────────│              │
└──────────────┘                    └──────────────┘
        │
        ▼
┌──────────────┐
│   User's     │
│   Browser    │
│   decrypt    │
│   with       │
│   private key│
│   → plaintext│
└──────────────┘
```

### Client-Side Reencryption Request

```javascript
import { createFhevmInstance } from "fhevmjs";

async function viewMyBalance(contractAddress) {
    const instance = await createFhevmInstance({ networkUrl });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Generate a keypair for reencryption
    const { publicKey, privateKey } = instance.generateKeypair();

    // Create an EIP-712 signature to prove ownership
    const eip712 = instance.createEIP712(publicKey, contractAddress);
    const signature = await signer.signTypedData(
        eip712.domain,
        { Reencrypt: eip712.types.Reencrypt },
        eip712.message
    );

    // Get the encrypted balance handle from the contract
    const contract = new ethers.Contract(contractAddress, ABI, signer);
    const balanceHandle = await contract.getMyBalance();

    // Request reencryption
    const decryptedBalance = await instance.reencrypt(
        balanceHandle,
        privateKey,
        publicKey,
        signature,
        contractAddress,
        await signer.getAddress()
    );

    console.log("My balance:", decryptedBalance.toString());
}
```

### Contract-Side Requirements

For reencryption to work, the user must have ACL access to the ciphertext:

```solidity
function getMyBalance() public view returns (euint64) {
    require(FHE.isSenderAllowed(_balances[msg.sender]), "No access");
    return _balances[msg.sender];
}
```

---

## 6. Public Decryption vs Reencryption

| Feature | Public Decryption | Reencryption |
|---------|------------------|--------------|
| **Who sees it** | Everyone | Only the requesting user |
| **On-chain state** | Plaintext stored on-chain | No on-chain state change |
| **Use case** | Game results, auction winners | Private balances, personal data |
| **Mechanism** | Gateway callback to contract | Gateway returns to client |
| **Async?** | Yes (callback pattern) | Yes (client-side await) |
| **Gas cost** | Higher (on-chain callback) | Lower (off-chain only) |

---

## 7. The KMS (Key Management Service)

### What is the KMS?

The KMS is a distributed system that holds **shares** of the FHE secret key. No single entity can decrypt data alone. Decryption requires a threshold number of KMS nodes to cooperate.

### Threshold Decryption

```
KMS Node 1: share_1 ──┐
KMS Node 2: share_2 ──┼──► Combine shares → Decrypt ciphertext
KMS Node 3: share_3 ──┘
```

This ensures:
- No single point of failure
- No single party can access all encrypted data
- Decryption only happens when properly requested through the Gateway

---

## 8. Practical Example: Game with Reveal

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ebool, externalEbool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {GatewayConfig} from "@fhevm/solidity/gateway/GatewayConfig.sol";

contract CoinFlip is ZamaEthereumConfig, GatewayConfig {
    struct Game {
        address player;
        ebool playerChoice;
        ebool result;
        bool revealed;
        bool playerWon;
    }

    mapping(uint256 => Game) public games;
    uint256 public gameCount;

    function play(externalEbool encryptedChoice, bytes calldata proof) external {
        uint256 gameId = gameCount++;

        ebool choice = FHE.fromExternal(encryptedChoice, proof);
        ebool coinResult = FHE.randEbool();

        ebool won = FHE.eq(choice, coinResult);

        games[gameId] = Game({
            player: msg.sender,
            playerChoice: choice,
            result: coinResult,
            revealed: false,
            playerWon: false
        });

        FHE.allowThis(won);
        FHE.allowThis(choice);
        FHE.allowThis(coinResult);

        uint256[] memory cts = new uint256[](1);
        cts[0] = FHE.toUint256(won);

        Gateway.requestDecryption(
            cts,
            this.revealResult.selector,
            0,
            block.timestamp + 100,
            false
        );
    }

    function revealResult(uint256 requestId, bool won) public onlyGateway {
        uint256 gameId = gameCount - 1;
        games[gameId].revealed = true;
        games[gameId].playerWon = won;
    }
}
```

---

## 9. Security Considerations

### Do Not Decrypt Unnecessarily

Every decryption reveals information. Minimize decryptions to preserve privacy:

```solidity
// BAD: Decrypting just to compare — reveals the exact balance
function isRich() public {
    Gateway.requestDecryption(...);
}

// GOOD: Keep the comparison encrypted
function isRich() public view returns (ebool) {
    return FHE.gt(_balance, FHE.asEuint64(1000));
}
```

### Timing Considerations

Decryption is asynchronous. Your contract logic must account for the delay:
- Do not assume the callback will happen in the same block
- Guard against double-requests
- Set reasonable deadlines

---

## Summary

| Pattern | When to Use | How |
|---------|-------------|-----|
| **Public decryption** | Result should be visible to all | `Gateway.requestDecryption()` + callback |
| **Reencryption** | Only the user should see | Client calls `instance.reencrypt()` |

**Key principles:**
1. Decryption is **asynchronous** — callback pattern required
2. Inherit `GatewayConfig` for public decryption
3. Use `onlyGateway` modifier on callback functions
4. Use `FHE.toUint256()` to convert handles for decryption requests
5. For reencryption, the user must have ACL access (`FHE.allow`)
6. Minimize decryptions — keep data encrypted as long as possible
