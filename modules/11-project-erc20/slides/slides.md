---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 11: Confidential ERC-20"
footer: "Zama Developer Program"
---

# Module 11: Confidential ERC-20

Building a privacy-preserving token with encrypted balances.

---

# The Problem with Standard ERC-20

```
balanceOf(0xAlice) -> 1,000,000  // Everyone sees this
Transfer(Alice, Bob, 500)        // Everyone sees this
```

- All balances are public
- All transfer amounts are in events
- Failed transfers reveal balance info (revert = insufficient funds)

---

# Confidential ERC-20 Design

```
balanceOf(address) -> euint64    // Only owner decrypts
Transfer(Alice, Bob)             // No amount in event
Failed transfer -> sends 0      // No revert = no info leak
```

---

# Core: Encrypted Balance Mapping

```solidity
mapping(address => euint64) private _balances;
```

- Each balance is a ciphertext
- Only the owner + contract have ACL access
- Nobody else can read or query balances

---

# The No-Revert Pattern

**Why not revert on insufficient balance?**

An attacker can binary-search:
1. Transfer 1000 -- reverts (balance < 1000)
2. Transfer 500 -- succeeds (balance >= 500)
3. Transfer 750 -- reverts (< 750)
4. ... narrow down exact balance

**Solution:** Always succeed, transfer 0 on failure.

---

# Transfer Implementation

```solidity
function _transfer(
    address from, address to, euint64 amount
) internal {
    ebool hasEnough = FHE.ge(_balances[from], amount);

    // Transfer amount if enough, else 0
    euint64 transferAmount = FHE.select(
        hasEnough, amount, FHE.asEuint64(0)
    );

    _balances[from] = FHE.sub(
        _balances[from], transferAmount
    );
    _balances[to] = FHE.add(
        _balances[to], transferAmount
    );
}
```

---

# What an Observer Sees

| Standard ERC-20 | Confidential ERC-20 |
|-----------------|---------------------|
| From: Alice | From: Alice |
| To: Bob | To: Bob |
| Amount: 500 USDC | Amount: ??? |
| Status: Success | Status: Success |
| Revert if broke | **Always succeeds** |

---

# Events: No Amounts

```solidity
// Standard ERC-20
event Transfer(
    address indexed from, address indexed to,
    uint256 value  // LEAKED!
);

// Confidential ERC-20
event Transfer(
    address indexed from, address indexed to
    // No value field
);
```

---

# balanceOf: Encrypted Handle

```solidity
// Standard: anyone can query and READ any balance
function balanceOf(address a) returns (uint256)

// Confidential: returns encrypted handle
function balanceOf(address account) returns (euint64)
```

Takes an `address` parameter like standard ERC-20, but returns an encrypted handle. Only the account owner (with ACL access) can decrypt it via fhevmjs + gateway.

---

# Encrypted Allowances

```solidity
mapping(address =>
    mapping(address => euint64)
) private _allowances;

function approve(
    externalEuint64 encAmount,
    bytes calldata inputProof, address spender
) external {
    euint64 amount = FHE.fromExternal(encAmount, inputProof);
    _allowances[msg.sender][spender] = amount;
    FHE.allowThis(_allowances[msg.sender][spender]);
    FHE.allow(_allowances[msg.sender][spender],
              msg.sender);
    FHE.allow(_allowances[msg.sender][spender],
              spender);
}
```

---

# transferFrom: Double Check

```solidity
function transferFrom(
    address from, externalEuint64 encAmount,
    bytes calldata inputProof, address to
) external {
    euint64 amount = FHE.fromExternal(encAmount, inputProof);

    ebool hasAllowance = FHE.ge(
        _allowances[from][msg.sender], amount);
    ebool hasBalance = FHE.ge(
        _balances[from], amount);

    // BOTH must pass
    ebool canTransfer = FHE.and(
        hasAllowance, hasBalance);

    euint64 transferAmt = FHE.select(
        canTransfer, amount, FHE.asEuint64(0));

    // Update allowance and balances...
}
```

---

# ACL Pattern for Balances

After every balance update:

```solidity
FHE.allowThis(_balances[from]);   // Contract access
FHE.allow(_balances[from], from); // Owner access

FHE.allowThis(_balances[to]);     // Contract access
FHE.allow(_balances[to], to);     // Owner access
```

Both the contract and the balance owner need access.

---

# Constructor

```solidity
constructor(
    string memory _name,
    string memory _symbol
) {
    name = _name;
    symbol = _symbol;
}
```

No initial supply in constructor. Use a separate `mint` function for distribution.

---

# Design Choices

| Decision | Rationale |
|----------|-----------|
| `euint64` not `euint256` | Gas efficiency; 64 bits is enough |
| No amount in events | Prevents information leakage |
| No revert on failure | Prevents balance binary search |
| `totalSupply` is public | Verifiable supply; design choice |
| `decimals = 6` | Common for tokens (like USDC) |

---

# Frontend: Encrypted Transfer

```typescript
async function transfer(to: string, amount: number) {
  const instance = await initFhevm();
  const input = instance.createEncryptedInput(
    tokenAddress, userAddress
  );
  input.add64(amount);
  const encrypted = await input.encrypt();

  const tx = await contract.transfer(encrypted.handles[0], encrypted.inputProof, to);
  await tx.wait();
}
```

---

# Summary

- Store balances as `euint64` in encrypted mappings
- **Never revert** on insufficient balance -- use `FHE.select()` to send 0
- Omit amounts from events
- `balanceOf(address)` returns an encrypted handle -- only the owner can decrypt
- Allowances are encrypted too; `transferFrom` checks both with `FHE.and()`
- ACL grants for contract + owner after every update

---

# Next Up

**Module 12: Confidential Voting**

Build a private voting system with encrypted tallies!
