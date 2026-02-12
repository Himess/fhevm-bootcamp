# Module 04: Exercise — Encrypted Vault with Operations

## Objective

Build an `EncryptedVault` contract that demonstrates arithmetic, comparison, and min/max operations on encrypted data.

---

## Task: Encrypted Vault

Create a contract where users can deposit and withdraw encrypted amounts with the following rules:

1. Each user has an encrypted balance (`euint64`)
2. Deposits add to the balance (arithmetic)
3. Withdrawals subtract from the balance with **underflow protection** (comparison + select)
4. A maximum balance cap of `1,000,000` is enforced (min/max)
5. Users can check if their balance exceeds a threshold (comparison returning `ebool`)

---

## Starter Code

### `contracts/EncryptedVault.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedVault is ZamaEthereumConfig {
    mapping(address => euint64) private _balances;
    mapping(address => bool) private _initialized;

    uint64 public constant MAX_BALANCE = 1_000_000;

    function _initBalance(address user) internal {
        if (!_initialized[user]) {
            _balances[user] = FHE.asEuint64(0);
            FHE.allowThis(_balances[user]);
            FHE.allow(_balances[user], user);
            _initialized[user] = true;
        }
    }

    function deposit(uint64 amount) public {
        _initBalance(msg.sender);
        // TODO: Add `amount` to the sender's balance using FHE.add()
        // TODO: Clamp to MAX_BALANCE using FHE.min()
        // TODO: FHE.allowThis() and FHE.allow() for the user
    }

    function withdraw(uint64 amount) public {
        _initBalance(msg.sender);
        // TODO: Check if balance >= amount using FHE.ge()
        // TODO: Calculate balance - amount using FHE.sub()
        // TODO: Use FHE.select() to pick (balance - amount) if valid, else keep balance
        // TODO: FHE.allowThis() and FHE.allow() for the user
    }

    function isAboveThreshold(uint64 threshold) public returns (ebool) {
        _initBalance(msg.sender);
        // TODO: Compare balance > threshold using FHE.gt()
        // TODO: FHE.allowThis() and FHE.allow() the result
        // TODO: Return the ebool
    }

    function doubleBalance() public {
        _initBalance(msg.sender);
        // TODO: Multiply balance by 2 using FHE.mul()
        // TODO: Clamp to MAX_BALANCE using FHE.min()
        // TODO: FHE.allowThis() and FHE.allow()
    }

    function halveDividend() public {
        _initBalance(msg.sender);
        // TODO: Divide balance by 2 using FHE.div() (plaintext divisor)
        // TODO: FHE.allowThis() and FHE.allow()
    }

    function getBalance() public view returns (euint64) {
        return _balances[msg.sender];
    }
}
```

---

## Step-by-Step Instructions

1. **`deposit`**: Use `FHE.add()` to add the amount, then `FHE.min()` to cap at `MAX_BALANCE`
2. **`withdraw`**: Use `FHE.ge()` to check funds, `FHE.sub()` to compute difference, `FHE.select()` for safe result
3. **`isAboveThreshold`**: Use `FHE.gt()` to compare balance against the threshold
4. **`doubleBalance`**: Use `FHE.mul()` with 2, then `FHE.min()` to cap
5. **`halveDividend`**: Use `FHE.div()` with plaintext 2

---

## Hints

<details>
<summary>Hint 1: deposit function</summary>

```solidity
function deposit(uint64 amount) public {
    _initBalance(msg.sender);
    euint64 newBalance = FHE.add(_balances[msg.sender], FHE.asEuint64(amount));
    _balances[msg.sender] = FHE.min(newBalance, FHE.asEuint64(MAX_BALANCE));
    FHE.allowThis(_balances[msg.sender]);
    FHE.allow(_balances[msg.sender], msg.sender);
}
```
</details>

<details>
<summary>Hint 2: withdraw function</summary>

```solidity
function withdraw(uint64 amount) public {
    _initBalance(msg.sender);
    euint64 amt = FHE.asEuint64(amount);
    ebool canWithdraw = FHE.ge(_balances[msg.sender], amt);
    euint64 newBalance = FHE.sub(_balances[msg.sender], amt);
    _balances[msg.sender] = FHE.select(canWithdraw, newBalance, _balances[msg.sender]);
    FHE.allowThis(_balances[msg.sender]);
    FHE.allow(_balances[msg.sender], msg.sender);
}
```
</details>

<details>
<summary>Hint 3: isAboveThreshold function</summary>

```solidity
function isAboveThreshold(uint64 threshold) public returns (ebool) {
    _initBalance(msg.sender);
    ebool result = FHE.gt(_balances[msg.sender], FHE.asEuint64(threshold));
    FHE.allowThis(result);
    FHE.allow(result, msg.sender);
    return result;
}
```
</details>

---

## Bonus Challenges

1. **Add a `transferEncrypted` function** that takes an `address to` and `uint64 amount`, performing a safe transfer between two encrypted balances.

2. **Add a `getBalanceRange` function** that returns an `euint8` representing which range the balance falls in: 0 = low (< 1000), 1 = medium (< 100000), 2 = high (>= 100000). Use `FHE.select()` and comparisons.

---

## Success Criteria

- [ ] Contract compiles without errors
- [ ] `deposit` performs addition and caps at MAX_BALANCE
- [ ] `withdraw` has underflow protection using `FHE.ge()` + `FHE.select()`
- [ ] `isAboveThreshold` returns a properly ACL-granted `ebool`
- [ ] `doubleBalance` uses `FHE.mul()` with clamping
- [ ] `halveDividend` uses `FHE.div()` with a plaintext divisor
- [ ] All encrypted results have proper `FHE.allowThis()` and `FHE.allow()` calls
