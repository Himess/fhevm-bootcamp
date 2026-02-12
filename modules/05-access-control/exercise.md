# Module 05: Exercise — Encrypted Token with ACL

## Objective

Build a minimal encrypted ERC20-like token that properly manages ACL for balances across minting, transferring, and querying.

---

## Task: ConfidentialToken

Create a contract with the following features:

1. **Minting** — Owner can mint encrypted tokens to any address
2. **Transfer** — Users can transfer encrypted amounts to other users
3. **Balance query** — Users can retrieve their own encrypted balance (with ACL check)
4. **Approval** — Users can approve another address to access their balance

---

## Starter Code

### `contracts/ConfidentialToken.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract ConfidentialToken is ZamaEthereumConfig {
    address public owner;
    mapping(address => euint64) private _balances;
    mapping(address => bool) private _initialized;
    mapping(address => mapping(address => bool)) private _approvals;

    event Transfer(address indexed from, address indexed to);
    event Mint(address indexed to);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function _ensureInitialized(address user) internal {
        if (!_initialized[user]) {
            _balances[user] = FHE.asEuint64(0);
            FHE.allowThis(_balances[user]);
            FHE.allow(_balances[user], user);
            _initialized[user] = true;
        }
    }

    function mint(address to, uint64 amount) public onlyOwner {
        _ensureInitialized(to);
        // TODO: Add amount to the recipient's balance
        // TODO: Update ACL for both the contract and the recipient
        emit Mint(to);
    }

    function transfer(address to, uint64 amount) public {
        _ensureInitialized(msg.sender);
        _ensureInitialized(to);

        euint64 amt = FHE.asEuint64(amount);

        // TODO: Check if sender has enough balance using FHE.ge()
        // TODO: Compute new sender balance using FHE.sub()
        // TODO: Compute new receiver balance using FHE.add()
        // TODO: Use FHE.select() for conditional update
        // TODO: Update ACL for sender's balance (contract + sender)
        // TODO: Update ACL for receiver's balance (contract + receiver)

        emit Transfer(msg.sender, to);
    }

    function approve(address spender) public {
        _approvals[msg.sender][spender] = true;
        // TODO: If balance is initialized, grant spender access via FHE.allow()
    }

    function balanceOf(address account) public view returns (euint64) {
        // TODO: Check if msg.sender is the account owner OR an approved spender
        // TODO: Check FHE.isSenderAllowed() for the balance handle
        // TODO: Return the encrypted balance
    }

    function getMyBalance() public view returns (euint64) {
        // TODO: Verify msg.sender has access using FHE.isSenderAllowed()
        // TODO: Return own balance
    }
}
```

---

## Step-by-Step Instructions

1. **`mint`**: Use `FHE.add()` to increase balance, then `FHE.allowThis()` and `FHE.allow()` for the recipient
2. **`transfer`**: Implement the full safe-transfer pattern with `FHE.ge()`, `FHE.select()`, and proper ACL for both parties
3. **`approve`**: Store approval flag and grant ACL access with `FHE.allow()`
4. **`balanceOf`**: Check authorization before returning handle
5. **`getMyBalance`**: Shorthand for `balanceOf(msg.sender)`

---

## Hints

<details>
<summary>Hint 1: mint function</summary>

```solidity
function mint(address to, uint64 amount) public onlyOwner {
    _ensureInitialized(to);
    _balances[to] = FHE.add(_balances[to], FHE.asEuint64(amount));
    FHE.allowThis(_balances[to]);
    FHE.allow(_balances[to], to);
    emit Mint(to);
}
```
</details>

<details>
<summary>Hint 2: transfer function</summary>

```solidity
function transfer(address to, uint64 amount) public {
    _ensureInitialized(msg.sender);
    _ensureInitialized(to);

    euint64 amt = FHE.asEuint64(amount);
    ebool hasEnough = FHE.ge(_balances[msg.sender], amt);

    euint64 newSenderBal = FHE.sub(_balances[msg.sender], amt);
    euint64 newReceiverBal = FHE.add(_balances[to], amt);

    _balances[msg.sender] = FHE.select(hasEnough, newSenderBal, _balances[msg.sender]);
    _balances[to] = FHE.select(hasEnough, newReceiverBal, _balances[to]);

    FHE.allowThis(_balances[msg.sender]);
    FHE.allow(_balances[msg.sender], msg.sender);
    FHE.allowThis(_balances[to]);
    FHE.allow(_balances[to], to);

    emit Transfer(msg.sender, to);
}
```
</details>

<details>
<summary>Hint 3: balanceOf with ACL check</summary>

```solidity
function balanceOf(address account) public view returns (euint64) {
    require(
        msg.sender == account || _approvals[account][msg.sender],
        "Not authorized"
    );
    require(
        FHE.isSenderAllowed(_balances[account]),
        "No ACL access"
    );
    return _balances[account];
}
```
</details>

---

## Bonus Challenges

1. **Add `transferFrom`** that allows approved spenders to transfer on behalf of the balance owner.

2. **Add an `allowBatch` function** that grants ACL access to an array of addresses for a user's balance.

3. **Implement a `revokeApproval` function** — note that you cannot revoke ACL from the old handle; discuss the implications.

---

## Success Criteria

- [ ] Contract compiles without errors
- [ ] `mint` correctly adds to balance with proper ACL
- [ ] `transfer` has underflow protection and updates ACL for both parties
- [ ] `approve` grants both mapping approval and `FHE.allow()` access
- [ ] `balanceOf` checks authorization before returning
- [ ] `getMyBalance` uses `FHE.isSenderAllowed()` as a guard
- [ ] All encrypted state updates include `FHE.allowThis()` and `FHE.allow()`
