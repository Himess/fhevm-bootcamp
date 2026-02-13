# Module 07: Decryption Patterns — Lesson

## Introduction

Encrypted data is only useful if you can eventually act on the plaintext. FHEVM provides two primary decryption approaches:

1. **Public decryption** — Make the encrypted value decryptable by everyone using `FHE.makePubliclyDecryptable()`
2. **User-specific decryption (Reencryption)** — Grant individual users access via ACL, they decrypt client-side

---

## 1. Why Decrypt?

Encrypted values are useful for computation, but eventually results need to be revealed:
- **Vote outcomes** — After tallying, the results should be public
- **Auction winners** — The winning bid needs to be announced
- **Private balances** — Users need to see their own balance
- **Game results** — The outcome must eventually be known

The key question is: **Who should see the decrypted value?**

---

## 2. Approach 1: Public Decryption — FHE.makePubliclyDecryptable()

When a result should be visible to **everyone**, use `FHE.makePubliclyDecryptable()`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {FHE, euint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract VoteRevealer is ZamaEthereumConfig {
    euint32 private _yesVotes;
    euint32 private _noVotes;
    bool public isRevealed;

    function revealResults() external {
        require(!isRevealed, "Already revealed");
        FHE.makePubliclyDecryptable(_yesVotes);
        FHE.makePubliclyDecryptable(_noVotes);
        isRevealed = true;
    }
}
```

### When to Use
- Vote results that should become public
- Auction outcomes (winning bid, winner)
- Game results and scores
- Any value that should be visible to ALL users

### Important Notes
- **Irreversible** — Once made publicly decryptable, anyone can see the plaintext. You cannot undo this.
- **Works for all types** — euint8, euint32, euint64, euint128, euint256, ebool, eaddress
- **Synchronous** — The value is immediately marked for public decryption (no callback needed)

---

## 3. Approach 2: User-Specific Decryption (Reencryption)

When only a **specific user** should see their data, use the ACL + reencryption pattern:

### Step 1: Grant ACL Access (Contract Side)

```solidity
function storeBalance(address user, euint64 balance) internal {
    _balances[user] = balance;
    FHE.allowThis(_balances[user]);    // Contract can use it
    FHE.allow(_balances[user], user);  // User can decrypt it
}

function getMyBalance() public view returns (euint64) {
    require(FHE.isSenderAllowed(_balances[msg.sender]), "No access");
    return _balances[msg.sender];
}
```

### Step 2: Decrypt (Client Side)

**In Hardhat Tests:**
```typescript
import { fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

const handle = await contract.getMyBalance();
const plaintext = await fhevm.userDecryptEuint(
    FhevmType.euint64,
    handle,
    contractAddress,
    signer
);
expect(plaintext).to.equal(1000n);

// For ebool:
const boolHandle = await contract.getFlag();
const boolValue = await fhevm.userDecryptEbool(
    boolHandle,
    contractAddress,
    signer
);
expect(boolValue).to.equal(true);
```

**In Browser (fhevmjs):**
```javascript
const { publicKey, privateKey } = instance.generateKeypair();
const eip712 = instance.createEIP712(publicKey, contractAddress);
const signature = await signer.signTypedData(
    eip712.domain,
    { Reencrypt: eip712.types.Reencrypt },
    eip712.message
);

const handle = await contract.getMyBalance();
const plaintext = await instance.reencrypt(
    handle, privateKey, publicKey, signature,
    contractAddress, await signer.getAddress()
);
```

### When to Use
- Private balances — only the owner should see
- Personal data — medical records, scores
- Individual secrets — bids before reveal
- Any value that should be visible to ONLY ONE user

---

## 4. Comparing the Two Approaches

| Feature | makePubliclyDecryptable | User Reencryption |
|---------|------------------------|-------------------|
| Who sees plaintext? | Everyone | Only the authorized user |
| On-chain call | `FHE.makePubliclyDecryptable(handle)` | `FHE.allow(handle, user)` |
| Client-side | Anyone can read | User calls reencrypt |
| Reversible? | No | ACL can be revoked (new handle) |
| Use case | Vote results, auction outcomes | Private balances, secrets |
| Async? | No (immediate) | No (immediate ACL grant) |
| Hardhat test | `fhevm.userDecryptEuint()` | `fhevm.userDecryptEuint()` |

---

## 5. Practical Example: PublicDecrypt.sol Walkthrough

The bootcamp includes `contracts/PublicDecrypt.sol` which demonstrates both patterns:

```solidity
contract PublicDecrypt is ZamaEthereumConfig {
    euint32 private _encryptedValue;
    bool public hasValue;
    bool public isPubliclyDecryptable;

    // Store a value — grant ACL to sender (user-specific decrypt)
    function setValue(uint32 value) external {
        _encryptedValue = FHE.asEuint32(value);
        FHE.allowThis(_encryptedValue);
        FHE.allow(_encryptedValue, msg.sender);  // User can decrypt
        hasValue = true;
    }

    // Make it public — anyone can decrypt
    function makePublic() external {
        require(hasValue, "No value set");
        FHE.makePubliclyDecryptable(_encryptedValue);
        isPubliclyDecryptable = true;
    }

    // Return handle for off-chain decryption
    function getEncryptedValue() external view returns (euint32) {
        return _encryptedValue;
    }
}
```

### Flow:
1. User calls `setValue(42)` → value is encrypted, only they can decrypt
2. User calls `makePublic()` → now ANYONE can decrypt the value
3. Any user calls `getEncryptedValue()` → gets the handle → decrypts off-chain

---

## 6. Practical Example: UserDecrypt.sol Walkthrough

The `contracts/UserDecrypt.sol` demonstrates per-user secrets with sharing:

```solidity
contract UserDecrypt is ZamaEthereumConfig {
    mapping(address => euint32) private _userSecrets;

    // Store own encrypted secret
    function storeSecret(externalEuint32 encValue, bytes calldata inputProof) external {
        _userSecrets[msg.sender] = FHE.fromExternal(encValue, inputProof);
        FHE.allowThis(_userSecrets[msg.sender]);
        FHE.allow(_userSecrets[msg.sender], msg.sender);
    }

    // Get own secret handle (for decryption)
    function getMySecret() external view returns (euint32) {
        return _userSecrets[msg.sender];
    }

    // Share secret with another address
    function shareSecret(address to) external {
        FHE.allow(_userSecrets[msg.sender], to);
    }
}
```

### Key Pattern: Secret Sharing
- Alice stores a secret → only Alice can decrypt
- Alice calls `shareSecret(bob)` → now Bob can also decrypt Alice's secret
- Bob uses `fhevm.userDecryptEuint()` to see the value

---

## 7. Hardhat Test Patterns

### Testing Public Decryption
```typescript
it("should make value publicly decryptable", async function () {
    await contract.setValue(42);
    await contract.makePublic();

    // After makePubliclyDecryptable, the value can be decrypted
    const handle = await contract.getEncryptedValue();
    const value = await fhevm.userDecryptEuint(
        FhevmType.euint32, handle, contractAddress, deployer
    );
    expect(value).to.equal(42n);
});
```

### Testing User-Specific Decryption
```typescript
it("should decrypt own secret", async function () {
    const enc = await fhevm
        .createEncryptedInput(contractAddress, alice.address)
        .add32(999)
        .encrypt();
    await contract.connect(alice).storeSecret(enc.handles[0], enc.inputProof);

    const handle = await contract.connect(alice).getMySecret();
    const value = await fhevm.userDecryptEuint(
        FhevmType.euint32, handle, contractAddress, alice
    );
    expect(value).to.equal(999n);
});
```

### Testing ACL-Protected Access
```typescript
it("should deny unauthorized access", async function () {
    // Bob tries to decrypt Alice's secret without ACL
    const handle = await contract.connect(bob).getMySecret();
    // Bob has no secret stored, so handle is zero/empty
});
```

---

## 8. Security Considerations

### Do Not Decrypt Unnecessarily

Every decryption reveals information. Minimize decryptions to preserve privacy:

```solidity
// BAD: Making value public just to compare
function isRichBad() public {
    FHE.makePubliclyDecryptable(_balance);  // Reveals exact balance!
}

// GOOD: Keep the comparison encrypted
function isRich() public view returns (ebool) {
    return FHE.gt(_balance, FHE.asEuint64(1000));  // No value revealed
}
```

### Information Leakage

- `makePubliclyDecryptable` reveals the EXACT value — use only when necessary
- Even partial information (e.g., "balance > 1000") reveals something
- Consider whether you really need to decrypt, or can keep working with encrypted values

### Timing Considerations

- Design your contract so all game-changing state updates happen BEFORE decryption
- A random value should be committed (stored, used in logic) before any party can request its decryption

---

## 9. Advanced: Legacy Gateway Pattern (Pre-v0.9)

> ⚠️ **WARNING:** The Gateway callback pattern shown below was used in fhEVM v0.8 and earlier.
> In the current version (v0.9+), use `FHE.makePubliclyDecryptable()` as shown in Section 5.
> This section is included for historical reference only — do NOT use this pattern in new contracts.

In production fhEVM networks, a **Gateway** service coordinates decryption between the blockchain and the KMS (Key Management Service). This uses an **asynchronous callback pattern**:

```solidity
// LEGACY — v0.8 only
// PRODUCTION ONLY — Gateway not available in Hardhat development environment
import {GatewayConfig} from "@fhevm/solidity/gateway/GatewayConfig.sol";

contract ProductionDecrypt is ZamaEthereumConfig, GatewayConfig {
    uint64 public revealedValue;

    function requestReveal() public {
        // In production, the Gateway handles converting encrypted handles
        // to uint256[] and coordinating decryption with the KMS.
        // FHE.toUint256() does not exist — the Gateway manages handle conversion.
        uint256[] memory cts = new uint256[](1);
        cts[0] = Gateway.toUint256(_encryptedValue);

        Gateway.requestDecryption(
            cts,
            this.revealCallback.selector,
            0,
            block.timestamp + 100,
            false
        );
    }

    function revealCallback(uint256 requestId, uint64 value) public onlyGateway {
        revealedValue = value;
    }
}
```

### Key Points About the Gateway Pattern:
- **Asynchronous** — Request in one tx, result arrives in a callback tx
- **KMS** holds shares of the FHE secret key for threshold decryption
- **onlyGateway** modifier ensures only the Gateway can call the callback
- The local Hardhat environment simulates decryption synchronously via `userDecryptEuint()`, so you don't need the Gateway for development and testing
- Use `makePubliclyDecryptable()` + `userDecryptEuint()` for development; switch to Gateway for production if needed

---

## 10. Common Mistakes

### Mistake 1: Forgetting ACL Before Decryption
```solidity
// BUG: User can't decrypt — no ACL granted
function storeValue(uint32 val) external {
    _value = FHE.asEuint32(val);
    FHE.allowThis(_value);
    // MISSING: FHE.allow(_value, msg.sender);
}
```

### Mistake 2: Making Sensitive Data Public
```solidity
// DANGEROUS: Reveals everyone's balance!
function revealAllBalances() external {
    for (...) {
        FHE.makePubliclyDecryptable(_balances[user]); // Privacy violation!
    }
}
```

### Mistake 3: Not Checking isSenderAllowed in Getters
```solidity
// BAD: Returns handle without access check
function getBalance() view returns (euint64) {
    return _balances[msg.sender]; // No ACL check!
}

// GOOD: Check access first
function getBalance() view returns (euint64) {
    require(FHE.isSenderAllowed(_balances[msg.sender]), "No access");
    return _balances[msg.sender];
}
```

### Mistake 4: Forgetting ACL Reset After Operations
```solidity
// BUG: After FHE.add, a NEW handle is created — old ACL doesn't apply
_balance = FHE.add(_balance, amount);
// MISSING: FHE.allowThis(_balance); FHE.allow(_balance, user);
```

---

## Summary

| Pattern | When to Use | How |
|---------|-------------|-----|
| **Public decryption** | Result should be visible to all | `FHE.makePubliclyDecryptable(handle)` |
| **User reencryption** | Only the user should see | `FHE.allow(handle, user)` + client-side decrypt |

**Key principles:**
1. Use `FHE.makePubliclyDecryptable()` for values everyone should see (vote results, auction winners)
2. Use `FHE.allow()` + reencryption for private values (balances, secrets)
3. Always check `FHE.isSenderAllowed()` in view functions that return encrypted handles
4. Minimize decryptions — keep data encrypted as long as possible
5. Remember: ACL must be reset after every FHE operation (new handle = empty ACL)
6. In Hardhat tests: `fhevm.userDecryptEuint()` and `fhevm.userDecryptEbool()` for testing both patterns
