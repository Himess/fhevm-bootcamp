# Module 03: Exercise — Encrypted User Profile

## Objective

Build an `EncryptedProfile` contract that stores multiple encrypted fields of different types, demonstrating mastery of the FHEVM type system.

---

## Task: Encrypted User Profile

Create a contract that stores a user profile with the following encrypted fields:

| Field | Type | Description |
|-------|------|-------------|
| `_isVerified` | `ebool` | Whether the user has been verified |
| `_age` | `euint8` | User's age (0-255) |
| `_reputation` | `euint16` | Reputation score (0-65535) |
| `_balance` | `euint64` | Token balance |
| `_walletAddress` | `eaddress` | A linked wallet address |

The contract should:
1. Initialize all fields in the constructor
2. Provide setter functions for each field
3. Provide getter functions that return encrypted handles
4. Only allow the contract owner to set fields

---

## Starter Code

### `contracts/EncryptedProfile.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ebool, euint8, euint16, euint64, eaddress} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedProfile is ZamaEthereumConfig {
    address public owner;

    // TODO: Declare encrypted state variables
    // _isVerified (ebool)
    // _age (euint8)
    // _reputation (euint16)
    // _balance (euint64)
    // _walletAddress (eaddress)

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        // TODO: Initialize all encrypted fields to default values
        // TODO: Call FHE.allowThis() for each field
    }

    function setVerified(bool verified) public onlyOwner {
        // TODO: Set _isVerified to encrypted value of `verified`
        // TODO: FHE.allowThis()
    }

    function setAge(uint8 age) public onlyOwner {
        // TODO: Set _age to encrypted value of `age`
        // TODO: FHE.allowThis()
    }

    function setReputation(uint16 rep) public onlyOwner {
        // TODO: Set _reputation to encrypted value of `rep`
        // TODO: FHE.allowThis()
    }

    function setBalance(uint64 bal) public onlyOwner {
        // TODO: Set _balance to encrypted value of `bal`
        // TODO: FHE.allowThis()
    }

    function setWalletAddress(address wallet) public onlyOwner {
        // TODO: Set _walletAddress to encrypted value of `wallet`
        // TODO: FHE.allowThis()
    }

    function addToBalance(uint64 amount) public onlyOwner {
        // TODO: Add `amount` to _balance using FHE.add
        // TODO: FHE.allowThis()
    }

    function incrementReputation() public onlyOwner {
        // TODO: Add 1 to _reputation using FHE.add
        // TODO: FHE.allowThis()
    }

    // Getters (return encrypted handles)
    function getIsVerified() public view returns (ebool) {
        return _isVerified;
    }

    function getAge() public view returns (euint8) {
        return _age;
    }

    function getReputation() public view returns (euint16) {
        return _reputation;
    }

    function getBalance() public view returns (euint64) {
        return _balance;
    }

    function getWalletAddress() public view returns (eaddress) {
        return _walletAddress;
    }
}
```

---

## Step-by-Step Instructions

1. **Declare the state variables** using the correct encrypted types
2. **Initialize all variables** in the constructor using `FHE.asXXX()` functions
3. **Call `FHE.allowThis()`** for every variable after initialization and after every update
4. **Implement all setter functions** using the appropriate `FHE.asXXX()` conversion
5. **Implement `addToBalance`** using `FHE.add()` for homomorphic addition
6. **Implement `incrementReputation`** using `FHE.add()` with `FHE.asEuint16(1)`

---

## Hints

<details>
<summary>Hint 1: Variable declarations</summary>

```solidity
ebool private _isVerified;
euint8 private _age;
euint16 private _reputation;
euint64 private _balance;
eaddress private _walletAddress;
```
</details>

<details>
<summary>Hint 2: Constructor initialization</summary>

```solidity
_isVerified = FHE.asEbool(false);
_age = FHE.asEuint8(0);
_reputation = FHE.asEuint16(0);
_balance = FHE.asEuint64(0);
_walletAddress = FHE.asEaddress(address(0));
FHE.allowThis(_isVerified);
FHE.allowThis(_age);
FHE.allowThis(_reputation);
FHE.allowThis(_balance);
FHE.allowThis(_walletAddress);
```
</details>

<details>
<summary>Hint 3: addToBalance</summary>

```solidity
function addToBalance(uint64 amount) public onlyOwner {
    _balance = FHE.add(_balance, FHE.asEuint64(amount));
    FHE.allowThis(_balance);
}
```
</details>

---

## Bonus Challenges

1. **Add a `checkAge` function** that returns an `ebool` indicating whether the stored age is greater than or equal to 18 (use `FHE.ge()`).

2. **Add a `hasHighReputation` function** that returns an `ebool` for whether reputation exceeds 1000.

3. **Add an `isMyWallet` function** that takes an `address` parameter and returns an `ebool` indicating whether it matches the stored wallet address.

---

## Success Criteria

- [ ] Contract compiles without errors
- [ ] All five encrypted types are correctly used
- [ ] All variables are initialized in the constructor
- [ ] `FHE.allowThis()` is called after every encrypted state update
- [ ] `addToBalance` performs homomorphic addition
- [ ] `incrementReputation` performs homomorphic addition
- [ ] Only the owner can modify fields
