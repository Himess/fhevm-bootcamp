---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 07: Decryption Patterns"
footer: "Zama Developer Program"
---

# Module 07: Decryption Patterns

How to get plaintext back from encrypted data — safely.

---

# Two Decryption Approaches

| Approach | Who Sees It | Mechanism |
|----------|-------------|-----------|
| **Public decryption** | Everyone | Gateway callback to contract |
| **Reencryption** | Only the user | Gateway re-encrypts for user |

---

# The Architecture

```
Contract  ──request──►  Gateway  ──decrypt──►  KMS
                                               (threshold)
Contract  ◄─callback──  Gateway  ◄──result───  KMS
```

- Decryption is **asynchronous**
- KMS holds shares of the FHE secret key
- No single party can decrypt alone

---

# Public Decryption: Setup

```solidity
import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";
import "@fhevm/solidity/gateway/GatewayConfig.sol";

contract MyContract is ZamaEthereumConfig, GatewayConfig {
    // Now has access to Gateway.requestDecryption()
    // and the onlyGateway modifier
}
```

---

# Public Decryption: Request

```solidity
function requestReveal() public {
    uint256[] memory cts = new uint256[](1);
    cts[0] = FHE.toUint256(_encryptedValue);

    Gateway.requestDecryption(
        cts,                           // ciphertexts
        this.onReveal.selector,        // callback
        0,                             // msg.value
        block.timestamp + 100,         // deadline
        false                          // not bytes
    );
}
```

---

# Public Decryption: Callback

```solidity
function onReveal(
    uint256 requestId,
    uint32 decryptedValue
) public onlyGateway {
    // decryptedValue is the plaintext
    _result = decryptedValue;
    _isRevealed = true;
}
```

- `onlyGateway` — Only the Gateway can call this
- First param is always `uint256 requestId`
- Remaining params match the decrypted types

---

# Decrypting Multiple Values

```solidity
uint256[] memory cts = new uint256[](3);
cts[0] = FHE.toUint256(_val1);    // euint32
cts[1] = FHE.toUint256(_val2);    // euint64
cts[2] = FHE.toUint256(_flag);    // ebool

Gateway.requestDecryption(
    cts, this.multiCb.selector, 0,
    block.timestamp + 100, false
);

function multiCb(
    uint256 requestId,
    uint32 v1, uint64 v2, bool f
) public onlyGateway {
    // All three decrypted values available
}
```

---

# Reencryption: User-Specific View

Reencryption lets a user view **their own** data without revealing it publicly.

```
Contract          Gateway           User Browser
   |                |                    |
   |  user requests |                    |
   |  reencrypt     |                    |
   |<---------------|                    |
   |  re-encrypted  |                    |
   |  under user key|                    |
   |----------------|--encrypted blob--->|
   |                |                    | decrypt
   |                |                    | with
   |                |                    | private key
   |                |                    | -> plaintext!
```

---

# Reencryption: Client Code

```javascript
// 1. Generate keypair
const { publicKey, privateKey } = instance.generateKeypair();

// 2. Sign EIP-712 to prove ownership
const eip712 = instance.createEIP712(publicKey, contractAddr);
const signature = await signer.signTypedData(...);

// 3. Get handle from contract
const handle = await contract.getMyBalance();

// 4. Request reencryption
const plaintext = await instance.reencrypt(
    handle, privateKey, publicKey,
    signature, contractAddr, userAddr
);
```

---

# Reencryption: Contract Requirement

The user must have ACL access to the ciphertext:

```solidity
// During deposit/mint:
FHE.allow(_balances[user], user);  // Grant user access

// Getter for reencryption:
function getMyBalance() public view returns (euint64) {
    require(
        FHE.isSenderAllowed(_balances[msg.sender]),
        "No access"
    );
    return _balances[msg.sender];
}
```

---

# When to Use Which?

| Scenario | Use |
|----------|-----|
| Auction winner announcement | Public decryption |
| Game outcome reveal | Public decryption |
| User checking own balance | Reencryption |
| User viewing own vote | Reencryption |
| Contract needs plaintext for logic | Public decryption |
| Privacy-preserving data view | Reencryption |

---

# Security: Minimize Decryption

```solidity
// BAD: Decrypt to compare (reveals exact value)
Gateway.requestDecryption(_balance, ...);
// callback: if (value > 1000) { ... }

// GOOD: Compare while encrypted
ebool isAbove = FHE.gt(_balance, FHE.asEuint64(1000));
// Only decrypt the boolean if needed
```

Keep data encrypted as long as possible.

---

# Async Nature: Key Points

1. Callback happens in a **separate transaction**
2. Do NOT assume same-block execution
3. Guard against **double-requests**
4. Set **reasonable deadlines**
5. Handle the case where callback **never arrives**

---

# Summary

| Concept | Details |
|---------|---------|
| **Public decrypt** | `Gateway.requestDecryption()` + callback |
| **Reencryption** | Client-side via `instance.reencrypt()` |
| **Gateway** | Off-chain relayer for decrypt requests |
| **KMS** | Threshold key management for FHE secret |
| **Async** | Always callback-based, never instant |
| **Best practice** | Decrypt as little as possible |

---

# Next Up

**Module 08: Conditional Logic**

Master `FHE.select()`, branch-free programming, and encrypted min/max/clamp patterns.
