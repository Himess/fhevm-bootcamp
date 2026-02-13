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

# Why Decrypt?

Encrypted values power computation, but results eventually need to be seen:

- Vote outcomes → public announcement
- Auction winners → public reveal
- Private balances → only the owner sees
- Game results → revealed after play

**Key question:** Who should see the decrypted value?

---

# Two Decryption Approaches

| Approach | Who Sees It | How |
|----------|-------------|-----|
| **Public decryption** | Everyone | `FHE.makePubliclyDecryptable(handle)` |
| **User reencryption** | Only the user | `FHE.allow(handle, user)` + client decrypt |

---

# Public Decryption: makePubliclyDecryptable()

```solidity
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

> Irreversible — once public, anyone can see the plaintext

---

# When to Use Public Decryption

- Vote tallying results
- Auction/game outcomes
- Aggregated statistics
- Any value that should become public after a certain event

Works for **all types**: euint8, euint32, euint64, euint128, euint256, ebool, eaddress

---

# User-Specific Decryption: ACL + Reencryption

**Contract side:** Grant user access via ACL

```solidity
// During deposit/mint:
FHE.allow(_balances[user], user);  // Grant user access

// Getter with ACL guard:
function getMyBalance() public view returns (euint64) {
    require(
        FHE.isSenderAllowed(_balances[msg.sender]),
        "No access"
    );
    return _balances[msg.sender];
}
```

---

# User-Specific: Client-Side Decryption

**Hardhat Tests:**
```typescript
const handle = await contract.getMyBalance();
const value = await fhevm.userDecryptEuint(
    FhevmType.euint64, handle,
    contractAddress, signer
);
expect(value).to.equal(1000n);
```

**Browser (fhevmjs):**
```javascript
const plaintext = await instance.reencrypt(
    handle, privateKey, publicKey,
    signature, contractAddr, userAddr
);
```

---

# Hardhat Test API

| Function | Use For |
|----------|---------|
| `fhevm.userDecryptEuint(FhevmType.euint8, handle, addr, signer)` | Decrypt euint8/16/32/64/128/256 |
| `fhevm.userDecryptEbool(handle, addr, signer)` | Decrypt ebool |

> Both work for publicly decryptable AND user-specific ACL values

```typescript
// Example
const val = await fhevm.userDecryptEuint(
    FhevmType.euint32, handle, contractAddress, deployer
);
```

---

# When to Use Which?

| Scenario | Use |
|----------|-----|
| Auction winner announcement | `makePubliclyDecryptable` |
| Game outcome reveal | `makePubliclyDecryptable` |
| User checking own balance | ACL + reencryption |
| User viewing own vote | ACL + reencryption |
| Aggregated public stats | `makePubliclyDecryptable` |
| Privacy-preserving data view | ACL + reencryption |

---

# Security: Minimize Decryption

```solidity
// BAD: Reveals exact balance to everyone!
FHE.makePubliclyDecryptable(_balance);

// GOOD: Compare while encrypted (reveals nothing)
ebool isAbove = FHE.gt(
    _balance, FHE.asEuint64(1000)
);
// Only decrypt the boolean if needed
```

Keep data encrypted as long as possible.

---

# Common Mistakes

| Mistake | Fix |
|---------|-----|
| Forgetting `FHE.allow()` before decrypt | Always grant ACL to the user |
| Making sensitive data public | Only use `makePubliclyDecryptable` for truly public values |
| No `isSenderAllowed` check in getters | Always guard view functions |
| Forgetting ACL after FHE operations | New handle = new ACL needed |

---

# Advanced: Gateway (Production)

In production networks, a **Gateway** service handles async decryption:

```solidity
// PRODUCTION ONLY — not available in Hardhat
import {GatewayConfig} from "@fhevm/solidity/gateway/GatewayConfig.sol";

contract Prod is ZamaEthereumConfig, GatewayConfig {
    function requestReveal() public {
        // Gateway handles handle-to-uint256 conversion in production
        // FHE.toUint256() does not exist
        uint256[] memory cts = new uint256[](1);
        cts[0] = Gateway.toUint256(_value);
        Gateway.requestDecryption(
            cts, this.cb.selector, 0,
            block.timestamp + 100, false
        );
    }
    function cb(uint256 reqId, uint32 val)
        public onlyGateway { _result = val; }
}
```

> For development: use `makePubliclyDecryptable` + `userDecryptEuint`

---

# Summary

| Concept | Details |
|---------|---------|
| **Public decrypt** | `FHE.makePubliclyDecryptable(handle)` — anyone can see |
| **User decrypt** | `FHE.allow(handle, user)` + client-side decrypt |
| **Hardhat test** | `fhevm.userDecryptEuint()` / `fhevm.userDecryptEbool()` |
| **ACL guard** | `FHE.isSenderAllowed()` in view functions |
| **Gateway** | Production async pattern (not for Hardhat dev) |
| **Best practice** | Decrypt as little as possible |

---

# Next Up

**Module 08: Conditional Logic**

Master `FHE.select()`, branch-free programming, and encrypted min/max/clamp patterns.
