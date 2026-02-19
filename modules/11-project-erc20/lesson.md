# Module 11: Confidential ERC-20 -- Lesson

**Duration:** 4 hours
**Prerequisites:** Modules 00-10
**Learning Objectives:**
- Build a confidential ERC-20 token with encrypted balances
- Implement no-revert transfer pattern
- Understand ERC-7984 standard

## Introduction

A standard ERC-20 token exposes all balances and transfer amounts publicly on-chain. Anyone can see how much every address holds and every transfer that occurs. With FHEVM, we can build an ERC-20 where **balances are encrypted** and **transfer amounts are hidden**, while still preserving the core ERC-20 functionality.

---

## 1. The Privacy Problem with Standard ERC-20

In a standard ERC-20:
- `balanceOf(address)` returns a plaintext `uint256` -- anyone can query any address
- `Transfer` events log the exact amount -- block explorers show everything
- Failed transfers revert with an error -- an attacker can binary-search balances

With a confidential ERC-20:
- Balances are stored as `euint64` -- only the owner can decrypt
- Transfer amounts are encrypted -- observers see nothing
- Failed transfers **do not revert** -- they silently transfer 0

---

## 2. Core Design: Encrypted Mapping

```solidity
mapping(address => euint64) private _balances;
```

Each balance is an encrypted 64-bit unsigned integer. Only the balance owner (and the contract itself) have ACL access.

---

## 3. The No-Revert Pattern

This is the most critical privacy pattern in FHEVM token design.

**Why can we not revert on insufficient balance?**

If `transfer(to, amount)` reverts when `balance < amount`, an attacker can:
1. Try transferring 1000 -- reverts (balance < 1000)
2. Try transferring 500 -- succeeds (balance >= 500)
3. Try transferring 750 -- reverts (balance < 750)
4. Binary search to find the exact balance

**Solution: Always succeed, but transfer 0 on failure.**

```solidity
function _transfer(address from, address to, euint64 amount) internal {
    // Check if sender has enough
    ebool hasEnough = FHE.ge(_balances[from], amount);

    // If has enough, transfer `amount`. If not, transfer 0.
    euint64 transferAmount = FHE.select(hasEnough, amount, FHE.asEuint64(0));

    // Update balances
    _balances[from] = FHE.sub(_balances[from], transferAmount);
    _balances[to] = FHE.add(_balances[to], transferAmount);

    // Update ACL
    FHE.allowThis(_balances[from]);
    FHE.allow(_balances[from], from);
    FHE.allowThis(_balances[to]);
    FHE.allow(_balances[to], to);
}
```

From the outside, the transaction always succeeds. Nobody can tell if the actual transfer was the requested amount or 0.

---

## 4. Complete ConfidentialERC20 Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, ebool, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract ConfidentialERC20 is ZamaEthereumConfig {
    string public name;
    string public symbol;
    uint8 public constant decimals = 6;
    uint64 public totalSupply;

    mapping(address => euint64) private _balances;
    mapping(address => mapping(address => euint64)) private _allowances;
    mapping(address => bool) private _initialized;

    event Transfer(address indexed from, address indexed to);
    event Approval(address indexed owner, address indexed spender);

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    function _initBalance(address account) internal {
        if (!_initialized[account]) {
            _balances[account] = FHE.asEuint64(0);
            FHE.allowThis(_balances[account]);
            FHE.allow(_balances[account], account);
            _initialized[account] = true;
        }
    }

    function balanceOf(address account) public view returns (euint64) {
        return _balances[account];
    }

    function transfer(externalEuint64 encryptedAmount, bytes calldata inputProof, address to) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        _transfer(msg.sender, to, amount);
        emit Transfer(msg.sender, to);
    }

    function _transfer(address from, address to, euint64 amount) internal {
        _initBalance(from);
        _initBalance(to);

        // Privacy-preserving: transfer amount or 0 (no revert)
        ebool hasEnough = FHE.ge(_balances[from], amount);
        euint64 transferAmount = FHE.select(hasEnough, amount, FHE.asEuint64(0));

        _balances[from] = FHE.sub(_balances[from], transferAmount);
        _balances[to] = FHE.add(_balances[to], transferAmount);

        FHE.allowThis(_balances[from]);
        FHE.allow(_balances[from], from);
        FHE.allowThis(_balances[to]);
        FHE.allow(_balances[to], to);
    }

    function approve(externalEuint64 encryptedAmount, bytes calldata inputProof, address spender) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        _allowances[msg.sender][spender] = amount;
        FHE.allowThis(_allowances[msg.sender][spender]);
        FHE.allow(_allowances[msg.sender][spender], msg.sender);
        FHE.allow(_allowances[msg.sender][spender], spender);
        emit Approval(msg.sender, spender);
    }

    function allowance(address owner) public view returns (euint64) {
        return _allowances[owner][msg.sender];
    }

    function transferFrom(address from, externalEuint64 encryptedAmount, bytes calldata inputProof, address to) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

        // Check allowance
        euint64 currentAllowance = _allowances[from][msg.sender];
        ebool hasAllowance = FHE.ge(currentAllowance, amount);

        // Check balance
        ebool hasBalance = FHE.ge(_balances[from], amount);

        // Both conditions must be true
        ebool canTransfer = FHE.and(hasAllowance, hasBalance);
        euint64 transferAmount = FHE.select(canTransfer, amount, FHE.asEuint64(0));

        // Update allowance
        _allowances[from][msg.sender] = FHE.sub(currentAllowance, transferAmount);
        FHE.allowThis(_allowances[from][msg.sender]);
        FHE.allow(_allowances[from][msg.sender], from);
        FHE.allow(_allowances[from][msg.sender], msg.sender);

        // Perform transfer
        _transfer(from, to, transferAmount);
        emit Transfer(from, to);
    }
}
```

---

## 5. Key Design Decisions Explained

### `balanceOf(address)` Returns an Encrypted Handle

Unlike a standard ERC-20 where `balanceOf(address)` returns a plaintext `uint256` anyone can read, the confidential version returns an `euint64` encrypted handle. The function takes an `address account` parameter, but only the account owner (who has ACL access) can decrypt the returned value. Anyone can call the function, but the returned ciphertext is useless without the decryption permission granted via `FHE.allow()`.

### Events Without Amounts

```solidity
event Transfer(address indexed from, address indexed to);
// Note: no amount field!
```

Standard ERC-20 events include the amount. We omit it because the amount is encrypted and should not be leaked.

### `totalSupply` is Public

The total supply is plaintext. This is a design choice -- you could encrypt it too, but most tokens benefit from a publicly verifiable supply.

### Why `uint64` Instead of `uint256`?

FHE operations on larger types are more expensive. `euint64` supports up to ~18.4 quintillion, which is sufficient for most token designs (especially with 6 decimals).

---

## 6. The Transfer Flow Step by Step

```
1. User calls transfer(encryptedAmount, proof, to)
2. FHE.fromExternal() converts to euint64
3. FHE.ge(balance, amount) -> ebool hasEnough
4. FHE.select(hasEnough, amount, 0) -> transferAmount
5. balance[from] = balance[from] - transferAmount
6. balance[to] = balance[to] + transferAmount
7. ACL updated for both from and to
8. Transaction succeeds regardless of outcome
```

An observer sees:
- That a transaction occurred between `from` and `to`
- That it succeeded
- Nothing about the amount or whether it was a "real" transfer or a 0-transfer

---

## 7. Allowance Pattern

The allowance system works similarly to standard ERC-20 but with encrypted amounts:

```solidity
// Owner approves spender for encrypted amount
approve(encryptedAmount, proof, spender)

// Spender can check their allowance (only they can decrypt)
allowance(owner) -> euint64

// Spender transfers from owner's balance
transferFrom(from, encryptedAmount, proof, to)
```

The `transferFrom` checks both:
1. `allowance >= amount` (encrypted comparison)
2. `balance >= amount` (encrypted comparison)

Both must pass (using `FHE.and()`), or the transfer sends 0.

> **Design Note:** Our simplified `allowance(address owner)` uses `msg.sender` as the implicit spender. An alternative design accepts both parameters: `allowance(address owner, address spender)`, which is closer to the ERC-20 standard but requires additional ACL considerations.

---

## 8. Minting Pattern

For initial distribution or minting:

```solidity
function mint(address to, uint64 amount) public onlyOwner {
    _initBalance(to);
    _balances[to] = FHE.add(_balances[to], FHE.asEuint64(amount));
    FHE.allowThis(_balances[to]);
    FHE.allow(_balances[to], to);
    totalSupply += amount;
}
```

Note that `amount` is plaintext here (the owner knows how much they are minting). If you want private minting, accept an `externalEuint64` instead.

---

## 9. Frontend Integration

On the frontend, transfers look like:

```typescript
async function transfer(to: string, amount: number) {
  const instance = await initFhevm();
  const input = instance.createEncryptedInput(tokenAddress, userAddress);
  input.add64(amount);
  const encrypted = await input.encrypt();

  const tx = await contract.transfer(encrypted.handles[0], encrypted.inputProof, to);
  await tx.wait();
}
```

Reading balance:

```typescript
async function getBalance(account: string): Promise<number> {
  const handle = await contract.balanceOf(account);
  // ... EIP-712 signature + reencrypt flow
  return Number(decryptedValue);
}
```

---

## ERC-20 Compatibility Tradeoffs

Our Confidential ERC-20 intentionally breaks standard ERC-20 compatibility:

| Feature | Standard ERC-20 | Confidential ERC-20 |
|---------|----------------|---------------------|
| `balanceOf` return | `uint256` | `euint64` |
| `transfer` amount param | `uint256` | `externalEuint64 + proof` |
| Transfer events | Include amount | No amount (would leak data) |
| Failed transfer | Reverts | Returns silently (0 transfer) |
| `totalSupply` | Public | Can be public or encrypted |

These changes are necessary for privacy but mean the contract cannot be used with existing ERC-20 tooling (DEX routers, block explorers, etc.) without adaptation.

> **Industry Standard:** The confidential ERC-20 pattern taught in this module is formalized as **ERC-7984** — a standard co-developed by Zama and OpenZeppelin for confidential fungible tokens. Zaiffer Protocol (a Zama + PyratzLabs joint venture, €2M backing) uses this exact pattern in production to convert standard ERC-20 tokens into confidential cTokens with encrypted balances. The OpenZeppelin audit was completed in November 2025.

---

## Summary

- Confidential ERC-20 stores balances as `euint64` in encrypted mappings
- The **no-revert pattern** is essential: failed transfers send 0 instead of reverting
- `FHE.select()` is the core primitive for conditional transfer logic
- Events omit amounts to prevent information leakage
- `balanceOf(address)` returns an encrypted handle -- only the account owner with ACL access can decrypt it
- Allowances are also encrypted, with ACL granted to both owner and spender
- `FHE.and()` combines multiple conditions (balance check + allowance check)
