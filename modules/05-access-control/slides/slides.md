---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 05: Access Control (ACL)"
footer: "Zama Developer Program"
---

# Module 05: Access Control (ACL)

Who can use encrypted data — and how to manage permissions.

---

# The ACL Problem

On a public blockchain, encrypted data needs **permission management**.

- Who can **operate** on a ciphertext?
- Who can **decrypt** a ciphertext?
- How do **contracts** pass ciphertexts between each other?

The ACL system answers all these questions.

---

# ACL Overview

Every ciphertext (handle) has an **Access Control List**:

```
Handle 0xAABB...
├── Allowed: Contract 0x1234...  (allowThis)
├── Allowed: User 0x5678...      (allow)
└── Allowed: Helper 0x9ABC...    (allowTransient, this tx only)
```

---

# The Four ACL Functions

| Function | Purpose | Duration |
|----------|---------|----------|
| `FHE.allowThis(h)` | Contract self-access | Persistent |
| `FHE.allow(h, addr)` | Grant to address | Persistent |
| `FHE.allowTransient(h, addr)` | Temporary grant | Transaction only |
| `FHE.isSenderAllowed(h)` | Check permission | N/A (view) |

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

---

# Five ACL Rules

1. Every new ciphertext starts with an **empty ACL**
2. The creator gets **no automatic access**
3. ACL is **per-handle**, not per-variable
4. There is **no revoke** — rotate data instead
5. `allowTransient` is cheaper but **transaction-scoped**

---

# Common Mistakes

| Mistake | Consequence |
|---------|-------------|
| Forgetting `FHE.allowThis()` after update | Contract cannot use its own data |
| Not calling `FHE.allow(h, user)` | User cannot decrypt their data |
| Using `allow` for temp needs | Wasted gas on persistent ACL |
| Assuming old ACL carries over | Operations fail silently |

---

# Summary

- **`FHE.allowThis()`** — Call after EVERY encrypted state update
- **`FHE.allow()`** — Grant users access to their own data
- **`FHE.allowTransient()`** — Efficient inter-contract sharing
- **`FHE.isSenderAllowed()`** — Guard access to encrypted returns
- Every new handle = empty ACL (no inheritance)

---

# Next Up

**Module 06: Encrypted Inputs & ZK Proofs**

Learn how users send truly private data using `externalEuintXX` and `FHE.fromExternal()`.
