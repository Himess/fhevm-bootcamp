---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 05: Access Control (ACL)"
---

<style>
section { font-size: 18px; overflow: hidden; color: #1E293B; }
h1 { font-size: 28px; margin-bottom: 8px; color: #1E40AF; border-bottom: 2px solid #DBEAFE; padding-bottom: 6px; }
h2 { font-size: 22px; margin-bottom: 6px; color: #155E75; }
h3 { font-size: 19px; color: #92400E; }
code { font-size: 15px; background: #F1F5F9; color: #3730A3; padding: 1px 4px; border-radius: 3px; }
pre { font-size: 13px; line-height: 1.25; margin: 6px 0; background: #1E293B; color: #E2E8F0; border-radius: 6px; padding: 10px; border-left: 3px solid #6366F1; }
pre code { background: transparent; color: #E2E8F0; padding: 0; }
li { margin-bottom: 1px; line-height: 1.4; }
table { font-size: 15px; border-collapse: collapse; width: 100%; }
th { background: #1E40AF; color: white; padding: 6px 10px; text-align: left; }
td { padding: 5px 10px; border-bottom: 1px solid #E2E8F0; }
tr:nth-child(even) { background: #F8FAFC; }
p { margin-bottom: 4px; }
ul, ol { margin-top: 4px; margin-bottom: 4px; }
header { color: #3B82F6 !important; }
footer { color: #94A3B8 !important; }
section.small { font-size: 15px; }
section.small h1 { font-size: 24px; margin-bottom: 6px; }
section.small ol li { margin-bottom: 0; line-height: 1.3; }
</style>

# Module 05: Access Control (ACL)

Who can use encrypted data — and how to manage permissions.

---

# The ACL Problem

On a public blockchain, encrypted data needs **permission management**.

- Who can **operate** on a ciphertext?
- Who can **decrypt** a ciphertext?
- How do **contracts** pass ciphertexts between each other?

The ACL system answers all these questions.

<!--
Speaker notes: Frame ACL as the "permission system for encrypted data." In standard Solidity, anyone can read anything. In FHEVM, you must explicitly grant access. This is both the security model and the most common source of bugs.
-->

---

# ACL Overview

Every ciphertext (handle) has an **Access Control List**:

```
Handle 0xAABB...
├── Allowed: Contract 0x1234...  (allowThis)
├── Allowed: User 0x5678...      (allow)
└── Allowed: Helper 0x9ABC...    (allowTransient, this tx only)
```

<!--
Speaker notes: Visualize the ACL as a list attached to each ciphertext handle. Every handle starts empty -- no one has access. This is different from file permissions where the creator has automatic access. In FHEVM, even the creator must explicitly grant themselves access.
-->

---

# The Five ACL Functions

| Function | Purpose | Duration |
|----------|---------|----------|
| `FHE.allowThis(h)` | Contract self-access | Persistent |
| `FHE.allow(h, addr)` | Grant to address | Persistent |
| `FHE.allowTransient(h, addr)` | Temporary grant | Transaction only |
| `FHE.makePubliclyDecryptable(h)` | Reveal to everyone | Persistent |
| `FHE.isSenderAllowed(h)` | Check permission | N/A (view) |

<!--
Speaker notes: This is the complete ACL API -- five functions. Have students memorize these. The most used are allowThis and allow. allowTransient is for optimization, makePubliclyDecryptable is for reveals, and isSenderAllowed is for guarding view functions.
-->

---

# `FHE.allowThis(handle)`

The most common call. Grants **this contract** permission.

```solidity
euint32 private _value;

constructor() {
    _value = FHE.asEuint32(0);
    FHE.allowThis(_value);  // REQUIRED
}

function update() public {
    _value = FHE.add(_value, FHE.asEuint32(1));
    FHE.allowThis(_value);  // REQUIRED again (new handle!)
}
```

<!--
Speaker notes: Point out both allowThis calls and explain why both are necessary. The constructor creates handle A, the update creates handle B. Without allowThis on handle B, the next call to update() will fail because the contract cannot read its own state.
-->

---

# Why Every Time?

Every FHE operation creates a **new ciphertext** with a **new handle**.

```
Before:  _value → handle 0xAAA  ACL: [this]
                  ↓ FHE.add()
After:   _value → handle 0xBBB  ACL: [empty!]
                                 ↑ Need FHE.allowThis()
```

The old handle's ACL does NOT transfer to the new handle.

<!--
Speaker notes: This diagram is the key insight of the entire ACL system. Draw it on a whiteboard if possible. The old handle 0xAAA still exists with its ACL, but _value now points to 0xBBB which has an empty ACL. This is why forgetting allowThis breaks contracts.
-->

---

# `FHE.allow(handle, address)`

Grant a **specific address** persistent access.

```solidity
function deposit(uint64 amount) public {
    euint64 newBal = FHE.add(
        _balances[msg.sender],
        FHE.asEuint64(amount)
    );
    _balances[msg.sender] = newBal;

    FHE.allowThis(newBal);           // Contract
    FHE.allow(newBal, msg.sender);   // User
}
```

Users need `allow` to decrypt their own data.

<!--
Speaker notes: Walk through the deposit function. After the FHE.add creates a new balance, both allowThis and allow are needed. Without allow(newBal, msg.sender), the user could never decrypt their own balance -- they would have no way to see how many tokens they hold.
-->

---

# `FHE.allowTransient(handle, address)`

Temporary access — expires at end of transaction.

```solidity
function forwardToProcessor(address proc) public {
    euint32 result = FHE.add(_value, FHE.asEuint32(1));

    // processor can use result only in THIS tx
    FHE.allowTransient(result, proc);

    IProcessor(proc).handle(result);
    // After tx: processor loses access
}
```

Saves gas by not persisting ACL entries.

<!--
Speaker notes: allowTransient is an optimization for inter-contract calls within a single transaction. It saves gas because the ACL entry is not written to storage. Use it when Contract A needs to pass a ciphertext to Contract B during the same tx but B does not need access later.
-->

---

# `FHE.isSenderAllowed(handle)`

Check if `msg.sender` has permission.

```solidity
function getMyBalance() public view returns (euint64) {
    require(
        FHE.isSenderAllowed(_balances[msg.sender]),
        "Not authorized"
    );
    return _balances[msg.sender];
}
```

<!--
Speaker notes: isSenderAllowed is a guard function for view methods that return encrypted handles. Without this check, anyone could call getMyBalance for any address and get a handle, even if they cannot decrypt it. The check ensures only authorized callers get the handle.
-->

---

# FHE.makePubliclyDecryptable()

## Reveal encrypted values to everyone

```solidity
// Reveal auction winner publicly
function revealWinner() external onlyOwner {
    FHE.makePubliclyDecryptable(_winningBid);
    FHE.makePubliclyDecryptable(_winnerAddress);
}
```

### Use Cases:
- Vote tallying results
- Auction/game outcomes
- Aggregated statistics
- Any value that should become public after a certain event

> Irreversible — once public, anyone can decrypt

<!--
Speaker notes: Stress the irreversibility -- once makePubliclyDecryptable is called, you cannot take it back. This is appropriate for auction results, vote tallies, and game outcomes, but never for individual user data. Ask: "When would you NOT want to use this?"
-->

---

# Pattern: Encrypted Token Transfer

```solidity
function transfer(address to, uint64 amount) public {
    euint64 amt = FHE.asEuint64(amount);
    ebool ok = FHE.ge(_balances[msg.sender], amt);

    euint64 newFrom = FHE.sub(_balances[msg.sender], amt);
    euint64 newTo = FHE.add(_balances[to], amt);

    _balances[msg.sender] = FHE.select(ok, newFrom, _balances[msg.sender]);
    _balances[to] = FHE.select(ok, newTo, _balances[to]);

    // ACL for sender
    FHE.allowThis(_balances[msg.sender]);
    FHE.allow(_balances[msg.sender], msg.sender);

    // ACL for receiver
    FHE.allowThis(_balances[to]);
    FHE.allow(_balances[to], to);
}
```

<!--
Speaker notes: This is the complete ACL pattern for a token transfer. Count the ACL calls: four in total -- allowThis and allow for both sender and receiver. This is verbose but necessary. Missing any one of these will break functionality for that user.
-->

---

# Pattern: Multi-Contract Composability

```solidity
// Vault gives Auditor temporary access
contract Vault is ZamaEthereumConfig {
    euint64 private _total;

    function auditAccess(address auditor) public {
        FHE.allowTransient(_total, auditor);
    }
}

// Auditor uses it within the same transaction
contract Auditor is ZamaEthereumConfig {
    function audit(Vault vault) public {
        vault.auditAccess(address(this));
        // Can now use vault's ciphertext
    }
}
```

<!--
Speaker notes: This pattern shows how two contracts can share encrypted data within one transaction using allowTransient. The Auditor calls auditAccess which grants temporary access, then immediately uses the ciphertext. After the transaction ends, the Auditor loses access. This is the foundation for composable FHEVM protocols.
-->

---

# Five ACL Rules

1. Every new ciphertext starts with an **empty ACL**
2. The creator gets **no automatic access**
3. ACL is **per-handle**, not per-variable
4. There is **no revoke** — rotate data instead
5. `allowTransient` is cheaper but **transaction-scoped**

<!--
Speaker notes: These five rules are the ACL "constitution." Rule 4 is especially important: there is no way to revoke access once granted. If you need to revoke, you must create a new encrypted value with a new ACL and stop using the old one. This is called "data rotation."
-->

---

# Common Mistakes

| Mistake | Consequence |
|---------|-------------|
| Forgetting `FHE.allowThis()` after update | Contract cannot use its own data |
| Not calling `FHE.allow(h, user)` | User cannot decrypt their data |
| Using `allow` for temp needs | Wasted gas on persistent ACL |
| Assuming old ACL carries over | Operations fail silently |

<!--
Speaker notes: Review each mistake and ask if students can explain why it causes problems. The silent failure is particularly dangerous -- operations on handles without ACL access do not revert, they just produce incorrect results. Testing is essential.
-->

---

# Summary

- **`FHE.allowThis()`** — Call after EVERY encrypted state update
- **`FHE.allow()`** — Grant users access to their own data
- **`FHE.allowTransient()`** — Efficient inter-contract sharing
- **`FHE.makePubliclyDecryptable()`** — Reveal values to everyone (irreversible)
- **`FHE.isSenderAllowed()`** — Guard access to encrypted returns
- Every new handle = empty ACL (no inheritance)

<!--
Speaker notes: Summarize ACL as "explicit permission for everything." This module is dense but critical. Suggest students create a checklist: after every FHE operation that writes to state, add allowThis. After every user-facing value, add allow.
-->

---

# Next Up

**Module 06: Encrypted Inputs & ZK Proofs**

Learn how users send truly private data using `externalEuintXX` and `FHE.fromExternal()`.

<!--
Speaker notes: Transition by asking: "We covered ACL for data already on-chain, but how does private data GET on-chain in the first place?" Module 06 answers this with client-side encryption.
-->
