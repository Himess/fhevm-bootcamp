# Module 02: Exercise — Build & Deploy Your First FHEVM Contract

## Objective

Set up a complete FHEVM development environment from scratch, write an encrypted storage contract, compile it, and write a passing test.

---

## Task: Encrypted Greeting Contract

Build a contract called `EncryptedGreeting` that:

1. Stores an encrypted boolean (`ebool`) indicating whether a greeting has been set
2. Stores an encrypted number (`euint8`) representing a greeting code (0-255)
3. Has a function `setGreeting(uint8 code)` that sets both values
4. Has a function `isGreetingSet()` that returns the `ebool`

---

## Starter Code

### `contracts/EncryptedGreeting.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ebool, euint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedGreeting is ZamaEthereumConfig {
    ebool private _isSet;
    euint8 private _greetingCode;

    constructor() {
        // TODO: Initialize _isSet to encrypted false
        // TODO: Initialize _greetingCode to encrypted 0
        // TODO: Grant this contract access to both values
    }

    function setGreeting(uint8 code) public {
        // TODO: Set _greetingCode to the encrypted version of `code`
        // TODO: Set _isSet to encrypted true
        // TODO: Grant this contract access to both updated values
    }

    function isGreetingSet() public view returns (ebool) {
        // TODO: Return the encrypted boolean
    }

    function getGreetingCode() public view returns (euint8) {
        // TODO: Return the encrypted greeting code
    }
}
```

### `test/EncryptedGreeting.test.ts`

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("EncryptedGreeting", function () {
  it("should deploy successfully", async function () {
    // TODO: Deploy the contract and assert it has a valid address
  });

  it("should allow setting a greeting", async function () {
    // TODO: Deploy the contract
    // TODO: Call setGreeting with a code value
    // TODO: Assert the transaction succeeded (no revert)
  });
});
```

---

## Step-by-Step Instructions

1. **Create the project:**
   ```bash
   mkdir encrypted-greeting && cd encrypted-greeting
   npm init -y
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   npm install @fhevm/solidity
   npx hardhat init  # Choose TypeScript
   ```

2. **Create the contract** in `contracts/EncryptedGreeting.sol`

3. **Fill in the TODOs** using:
   - `FHE.asEbool(false)` / `FHE.asEbool(true)`
   - `FHE.asEuint8(value)`
   - `FHE.allowThis(handle)`

4. **Write the test** in `test/EncryptedGreeting.test.ts`

5. **Compile and test:**
   ```bash
   npx hardhat compile
   npx hardhat test
   ```

---

## Hints

<details>
<summary>Hint 1: Constructor initialization</summary>

```solidity
_isSet = FHE.asEbool(false);
_greetingCode = FHE.asEuint8(0);
FHE.allowThis(_isSet);
FHE.allowThis(_greetingCode);
```
</details>

<details>
<summary>Hint 2: setGreeting function</summary>

```solidity
_greetingCode = FHE.asEuint8(code);
_isSet = FHE.asEbool(true);
FHE.allowThis(_greetingCode);
FHE.allowThis(_isSet);
```
</details>

<details>
<summary>Hint 3: Test deployment</summary>

```typescript
const factory = await ethers.getContractFactory("EncryptedGreeting");
const contract = await factory.deploy();
await contract.waitForDeployment();
expect(await contract.getAddress()).to.be.properAddress;
```
</details>

---

## Bonus Challenge

Add an `owner` variable and an `onlyOwner` modifier so that only the deployer can call `setGreeting`. This combines traditional Solidity patterns with FHEVM.

---

## Success Criteria

- [ ] Project compiles without errors
- [ ] All tests pass
- [ ] Contract uses `FHE` library (not `TFHE`)
- [ ] Contract inherits `ZamaEthereumConfig`
- [ ] `FHE.allowThis()` is called after every encrypted state update
