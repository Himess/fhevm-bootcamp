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

<!--
Speaker notes: Start with the philosophical question: decryption is the "exit ramp" from the encrypted world. The design decision is always about audience -- public vs. private reveal. Every use case falls into one of these two categories.
-->

---

# Two Decryption Approaches

| Approach | Who Sees It | How |
|----------|-------------|-----|
| **Public decryption** | Everyone | `FHE.makePubliclyDecryptable(handle)` |
| **User reencryption** | Only the user | `FHE.allow(handle, user)` + client decrypt |

<!--
Speaker notes: These are the only two approaches. Public decryption makes the value visible to everyone forever. User reencryption lets only the authorized user see the value. Most applications use a mix: public for outcomes and aggregates, user-specific for individual data.
-->

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

<!--
Speaker notes: Walk through the VoteRevealer example. The revealResults function is guarded by isRevealed to prevent double-calling. Once makePubliclyDecryptable is called, the FHE network processes the decryption and the values become readable by anyone. There is no undo.
-->

---

# When to Use Public Decryption

- Vote tallying results
- Auction/game outcomes
- Aggregated statistics
- Any value that should become public after a certain event

Works for **all types**: euint8, euint32, euint64, euint128, euint256, ebool, eaddress

<!--
Speaker notes: Public decryption is the simplest approach -- just one function call. Use it for any data that should become public after a specific event (vote deadline, auction end, game over). The key design question is always: "Should this be public or per-user?"
-->

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

<!--
Speaker notes: The contract side of user-specific decryption has two parts: granting ACL access with FHE.allow during state updates, and guarding the getter with isSenderAllowed. The getter returns an encrypted handle, not the plaintext -- the actual decryption happens client-side.
-->

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

**Browser (Relayer SDK):**
```javascript
const plaintext = await instance.reencrypt(
    handle, privateKey, publicKey,
    signature, contractAddr, userAddr
);
```

<!--
Speaker notes: Show both the Hardhat test approach and the browser approach. In tests, fhevm.userDecryptEuint is the primary way to read encrypted values. In production, the Relayer SDK handles reencryption through the gateway. The flow is: get handle, generate keys, sign, reencrypt, decrypt locally.
-->

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

<!--
Speaker notes: The Hardhat test helpers simplify decryption for testing. userDecryptEuint takes the FhevmType enum, the handle, contract address, and signer. This works for both publicly decryptable values and user-specific ACL values. Use these in every test to verify encrypted state.
-->

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

<!--
Speaker notes: Walk through this decision table with students. Ask them to categorize different scenarios: "What about a user's NFT attributes? What about a DAO treasury balance?" The general rule: individual data = ACL + reencryption, aggregate results = public decryption.
-->

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

<!--
Speaker notes: This is a core security principle: every decryption leaks information. The example shows comparing while encrypted and only decrypting the boolean result, not the balance itself. This pattern reveals whether a condition is met without revealing the actual value.
-->

---

# Common Mistakes

| Mistake | Fix |
|---------|-----|
| Forgetting `FHE.allow()` before decrypt | Always grant ACL to the user |
| Making sensitive data public | Only use `makePubliclyDecryptable` for truly public values |
| No `isSenderAllowed` check in getters | Always guard view functions |
| Forgetting ACL after FHE operations | New handle = new ACL needed |

<!--
Speaker notes: These mistakes lead to frustrated users who cannot see their own data. The most common complaint in FHEVM dApps is "I can't see my balance" -- almost always caused by a missing FHE.allow() call in the contract.
-->

---

# Advanced: Legacy Gateway Pattern (Pre-v0.9)

> ⚠️ **WARNING:** The Gateway callback pattern shown below was used in fhEVM v0.8 and earlier.
> In the current version (v0.9+), use `FHE.makePubliclyDecryptable()` as shown in Section 5.
> This section is included for historical reference only — do NOT use this pattern in new contracts.

In production networks, a **Gateway** service handles async decryption:

```solidity
// LEGACY — v0.8 only
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

<!--
Speaker notes: Mention the Gateway pattern briefly for completeness but emphasize that it is legacy (v0.8). In the current version, students should use makePubliclyDecryptable for public reveals and ACL + reencryption for user-specific data. Skip deep-diving into this unless students ask.
-->

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

<!--
Speaker notes: Wrap up by reinforcing the golden rule: decrypt as little as possible, as late as possible. Every decryption is an information leak. With inputs (Module 06) and decryption (this module) covered, students now have the complete data lifecycle.
-->

---

# Next Up

**Module 08: Conditional Logic**

Master `FHE.select()`, branch-free programming, and encrypted min/max/clamp patterns.

<!--
Speaker notes: Transition by previewing the challenge: "We can compare encrypted values, but we cannot use if statements with them. Module 08 teaches the fundamental technique for conditional logic in FHE."
-->
