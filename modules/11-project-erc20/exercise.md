# Module 11: Exercise -- Build a Confidential ERC-20 Token

## Objective

Implement a complete confidential ERC-20 token contract with encrypted balances, privacy-preserving transfers, and encrypted allowances.

---

## Task: ConfidentialERC20

Build the contract step by step, filling in the TODO sections.

### Starter Code

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
        // TODO: Call _transfer(msg.sender, to, amount)
        // TODO: Emit Transfer event (no amount!)
    }

    function _transfer(address from, address to, euint64 amount) internal {
        _initBalance(from);
        _initBalance(to);

        // TODO: Check if from has enough balance using FHE.ge()
        // TODO: Use FHE.select() to get transferAmount (amount if enough, 0 if not)
        // TODO: Subtract transferAmount from from's balance
        // TODO: Add transferAmount to to's balance
        // TODO: FHE.allowThis() and FHE.allow() for both from and to
    }

    function approve(externalEuint64 encryptedAmount, bytes calldata inputProof, address spender) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

        // TODO: Set _allowances[msg.sender][spender] = amount
        // TODO: FHE.allowThis() the allowance
        // TODO: FHE.allow() for both msg.sender and spender
        // TODO: Emit Approval event
    }

    function allowance(address owner) public view returns (euint64) {
        return _allowances[owner][msg.sender];
    }

    function transferFrom(
        address from,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof,
        address to
    ) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

        // TODO: Check allowance >= amount using FHE.ge()
        // TODO: Check balance >= amount using FHE.ge()
        // TODO: Combine both checks with FHE.and()
        // TODO: Use FHE.select() to determine transferAmount
        // TODO: Update allowance (subtract transferAmount)
        // TODO: Call _transfer(from, to, transferAmount)
        // TODO: Update ACL on the allowance
        // TODO: Emit Transfer event
    }
}
```

---

## Step-by-Step Instructions

### Step 1: Constructor

Set the token name and symbol. The constructor does not take an initial supply -- use a separate `mint` function for distribution.

### Step 2: _transfer (The Core)

This is the most important function. Implement the no-revert pattern:
1. `FHE.ge(_balances[from], amount)` to check balance
2. `FHE.select(hasEnough, amount, FHE.asEuint64(0))` to get actual transfer amount
3. Subtract from sender, add to receiver
4. Update ACL for both

### Step 3: transfer

Simple wrapper that calls `_transfer` and emits an event.

### Step 4: approve

Set the allowance and grant ACL to both owner and spender.

### Step 5: transferFrom

Double-check pattern:
1. Check allowance with `FHE.ge()`
2. Check balance with `FHE.ge()`
3. Combine with `FHE.and()`
4. `FHE.select()` for the transfer amount
5. Update allowance and call `_transfer`

---

## Hints

<details>
<summary>Hint 1: Constructor</summary>

```solidity
constructor(string memory _name, string memory _symbol) {
    name = _name;
    symbol = _symbol;
}
```
</details>

<details>
<summary>Hint 2: _transfer (no-revert pattern)</summary>

```solidity
function _transfer(address from, address to, euint64 amount) internal {
    _initBalance(from);
    _initBalance(to);

    ebool hasEnough = FHE.ge(_balances[from], amount);
    euint64 transferAmount = FHE.select(hasEnough, amount, FHE.asEuint64(0));

    _balances[from] = FHE.sub(_balances[from], transferAmount);
    _balances[to] = FHE.add(_balances[to], transferAmount);

    FHE.allowThis(_balances[from]);
    FHE.allow(_balances[from], from);
    FHE.allowThis(_balances[to]);
    FHE.allow(_balances[to], to);
}
```
</details>

<details>
<summary>Hint 3: transferFrom (double check)</summary>

```solidity
function transferFrom(address from, externalEuint64 encryptedAmount, bytes calldata inputProof, address to) external {
    euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

    euint64 currentAllowance = _allowances[from][msg.sender];
    ebool hasAllowance = FHE.ge(currentAllowance, amount);
    ebool hasBalance = FHE.ge(_balances[from], amount);
    ebool canTransfer = FHE.and(hasAllowance, hasBalance);

    euint64 transferAmount = FHE.select(canTransfer, amount, FHE.asEuint64(0));

    _allowances[from][msg.sender] = FHE.sub(currentAllowance, transferAmount);
    FHE.allowThis(_allowances[from][msg.sender]);
    FHE.allow(_allowances[from][msg.sender], from);
    FHE.allow(_allowances[from][msg.sender], msg.sender);

    _transfer(from, to, transferAmount);
    emit Transfer(from, to);
}
```
</details>

---

## Bonus Challenges

1. **Add a `mint` function** that only the contract owner can call, accepting a plaintext amount.
2. **Add a `burn` function** where users can burn their own tokens (encrypted amount, no-revert pattern).
3. **Add a `transferPlaintext` function** that accepts a regular `uint64` amount instead of encrypted -- useful for testing. Convert internally with `FHE.asEuint64()`.
4. **Write a Hardhat test** that deploys the contract, mints tokens, and verifies encrypted transfers.

---

## Success Criteria

- [ ] Contract compiles without errors
- [ ] Constructor sets name and symbol
- [ ] `transfer` uses the no-revert pattern (FHE.select with 0)
- [ ] `approve` sets encrypted allowances with proper ACL
- [ ] `transferFrom` checks both allowance and balance
- [ ] Events do not contain amounts
- [ ] `balanceOf(address)` returns the account's encrypted balance handle
- [ ] All encrypted values have proper `FHE.allowThis()` and `FHE.allow()` calls
