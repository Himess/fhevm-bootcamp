# Module 14: Testing & Debugging FHE Contracts -- Lesson

## Introduction: The Testing Challenge

Testing smart contracts that use Fully Homomorphic Encryption (FHE) is fundamentally different from testing standard Solidity contracts. In a normal contract, you can:

- Call a view function and immediately read a balance as a number
- Use `require()` to enforce conditions and test that they revert on failure
- Use `console.log()` in Hardhat to print intermediate values during execution
- Assert exact values returned from functions

With FHE contracts, **none of these work in the obvious way**:

- View functions return **encrypted handles**, not numbers
- `require()` cannot evaluate encrypted booleans -- `ebool` is not a `bool`
- `console.log()` will print a meaningless handle identifier, not the underlying value
- Function return values are opaque ciphertexts until decrypted

This creates a paradigm shift in how you write tests. Instead of "call and compare," you follow a cycle of **encrypt, act, decrypt, and assert**. Instead of relying on revert messages for error paths, you verify that **state did not change** after a failed encrypted operation (the "silent failure" pattern).

This module teaches you how to navigate these challenges systematically.

---

## 1. Setting Up the Test Environment

### The @fhevm/hardhat-plugin

The fhEVM testing stack centers on the `@fhevm/hardhat-plugin`. This plugin:

1. Provides a **mock FHE environment** that runs locally on Hardhat Network
2. Exposes a global `fhevm` object in your test files
3. Handles encrypted input creation and decryption for test assertions
4. Simulates the FHE computation pipeline using plaintext under the hood

The mock environment is **not** running real FHE. It stores plaintext values behind encrypted handles, which makes tests fast and deterministic. This is essential -- real FHE operations take significant time and compute.

### hardhat.config.ts Setup

Your Hardhat config must import the plugin:

```typescript
import "@fhevm/hardhat-plugin";
```

A typical config looks like:

```typescript
import "@nomicfoundation/hardhat-ethers";
import "@fhevm/hardhat-plugin";
import type { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
      },
      chainId: 31337,
    },
  },
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: { enabled: true, runs: 800 },
      evmVersion: "cancun",
    },
  },
};

export default config;
```

Key points:
- The `chainId: 31337` is the standard Hardhat Network chain ID
- The mnemonic provides deterministic test accounts
- The `@fhevm/hardhat-plugin` import auto-registers the mock environment

### The fhevm Object

In every test file, you import `fhevm` from `"hardhat"`:

```typescript
import { ethers, fhevm } from "hardhat";
```

The `fhevm` object provides three critical methods:

| Method | Purpose |
|--------|---------|
| `fhevm.createEncryptedInput(contractAddress, signerAddress)` | Create encrypted inputs for contract calls |
| `fhevm.userDecryptEuint(FhevmType, handle, contractAddress, signer)` | Decrypt a numeric encrypted value |
| `fhevm.userDecryptEbool(handle, contractAddress, signer)` | Decrypt an encrypted boolean |

You also need the `FhevmType` enum:

```typescript
import { FhevmType } from "@fhevm/hardhat-plugin";
```

This enum maps to encrypted types:
- `FhevmType.euint8`
- `FhevmType.euint16`
- `FhevmType.euint32`
- `FhevmType.euint64`

---

## 2. Creating Encrypted Inputs in Tests

Every FHE contract function that accepts encrypted input requires two parameters: the encrypted handle and a proof. In the test environment, you create these using `fhevm.createEncryptedInput()`.

### Step-by-Step

```typescript
// 1. Create the input builder
const encryptedInput = await fhevm.createEncryptedInput(
  contractAddress,  // The contract receiving the input
  signer.address    // The user sending the transaction
);

// 2. Add values (type-specific methods)
encryptedInput.add64(1000);  // Add a uint64 value

// 3. Encrypt and get the result
const enc = await encryptedInput.encrypt();

// 4. Use in a contract call
await contract.someFunction(enc.handles[0], enc.inputProof);
```

### Adding Different Types

The input builder supports all FHE numeric types:

```typescript
encryptedInput.addBool(true);   // ebool
encryptedInput.add8(255);       // euint8  (max: 255)
encryptedInput.add16(65535);    // euint16 (max: 65535)
encryptedInput.add32(1000000);  // euint32
encryptedInput.add64(1000000);  // euint64
```

### Multiple Values in One Input

You can add multiple values in a single encrypted input:

```typescript
const enc = await fhevm
  .createEncryptedInput(contractAddress, signer.address)
  .add64(amount)
  .add64(limit)
  .encrypt();

// First value: enc.handles[0]
// Second value: enc.handles[1]
// Shared proof: enc.inputProof
```

All values share the same `inputProof`, but each gets its own `handle` at a different index.

### Common Mistake: Wrong Address Parameters

A frequent bug is passing the wrong addresses to `createEncryptedInput`:

```typescript
// WRONG: Using alice's address when bob is calling the contract
const enc = await fhevm
  .createEncryptedInput(contractAddress, alice.address)  // alice
  .add64(100)
  .encrypt();
await contract.connect(bob).deposit(enc.handles[0], enc.inputProof);  // bob calls!
// This will fail -- the proof is bound to alice, not bob.

// CORRECT: Match the signer
const enc = await fhevm
  .createEncryptedInput(contractAddress, bob.address)  // bob
  .add64(100)
  .encrypt();
await contract.connect(bob).deposit(enc.handles[0], enc.inputProof);  // bob calls
```

The encrypted input is **bound to a specific contract address and signer**. If you mismatch, the proof verification will fail.

---

## 3. Decrypting Values in Tests

After a contract operation, you need to read the encrypted result and verify it. This is the "decrypt" step in the encrypt-act-decrypt-assert cycle.

### Decrypting Numeric Types

```typescript
import { FhevmType } from "@fhevm/hardhat-plugin";

// Get the encrypted handle from the contract
const handle = await contract.connect(alice).getBalance();

// Decrypt it in the test
const clearValue = await fhevm.userDecryptEuint(
  FhevmType.euint64,  // The type of the encrypted value
  handle,              // The handle returned by the contract
  contractAddress,     // The contract that owns the value
  alice                // The signer who has ACL permission
);

// Assert
expect(clearValue).to.equal(1000n);  // Always use BigInt (n suffix)
```

### Decrypting Booleans

```typescript
const handle = await contract.connect(alice).getIsActive();
const clearBool = await fhevm.userDecryptEbool(
  handle,
  contractAddress,
  alice
);
expect(clearBool).to.equal(true);
```

### The FhevmType Enum

You must pass the correct type to `userDecryptEuint`:

| Contract return type | FhevmType parameter |
|---------------------|---------------------|
| `euint8` | `FhevmType.euint8` |
| `euint16` | `FhevmType.euint16` |
| `euint32` | `FhevmType.euint32` |
| `euint64` | `FhevmType.euint64` |
| `ebool` | Use `userDecryptEbool()` instead |

### When Decryption Fails

Decryption fails when the signer does not have ACL permission for the encrypted value. In a real FHE network, this means the signer was never granted `FHE.allow()`. In tests, you will see an error or get an unexpected result.

This is actually a useful testing mechanism: you can verify that ACL boundaries are working correctly by attempting to decrypt as an unauthorized user and expecting failure.

```typescript
// Alice deposits, Bob tries to read Alice's balance
const handle = await contract.connect(alice).getBalance();

// Bob does NOT have ACL permission on Alice's balance
try {
  await fhevm.userDecryptEuint(FhevmType.euint64, handle, contractAddress, bob);
  expect.fail("Should have failed -- Bob lacks ACL permission");
} catch (error) {
  // Expected: Bob cannot decrypt Alice's balance
}
```

---

## 4. Testing Patterns

### Pattern 1: Encrypt -- Act -- Decrypt -- Assert

This is the fundamental FHE testing pattern. Every test that involves encrypted values follows this structure:

```typescript
it("should deposit and verify balance", async function () {
  // ENCRYPT: Create encrypted input
  const enc = await fhevm
    .createEncryptedInput(contractAddress, alice.address)
    .add64(1000)
    .encrypt();

  // ACT: Call the contract
  await (await contract.connect(alice).deposit(
    enc.handles[0], enc.inputProof
  )).wait();

  // DECRYPT: Read the encrypted result
  const handle = await contract.connect(alice).getBalance();
  const clear = await fhevm.userDecryptEuint(
    FhevmType.euint64, handle, contractAddress, alice
  );

  // ASSERT: Verify the decrypted value
  expect(clear).to.equal(1000n);
});
```

### Pattern 2: Multi-User Scenarios

FHE contracts often involve multiple users whose data must be isolated. Test this by using different signers:

```typescript
it("should isolate user balances", async function () {
  const [_, alice, bob] = await ethers.getSigners();

  // Alice deposits 1000
  const encAlice = await fhevm
    .createEncryptedInput(contractAddress, alice.address)
    .add64(1000)
    .encrypt();
  await (await contract.connect(alice).deposit(
    encAlice.handles[0], encAlice.inputProof
  )).wait();

  // Bob deposits 2000
  const encBob = await fhevm
    .createEncryptedInput(contractAddress, bob.address)
    .add64(2000)
    .encrypt();
  await (await contract.connect(bob).deposit(
    encBob.handles[0], encBob.inputProof
  )).wait();

  // Verify each user's balance independently
  const handleA = await contract.connect(alice).getBalance();
  const clearA = await fhevm.userDecryptEuint(
    FhevmType.euint64, handleA, contractAddress, alice
  );
  expect(clearA).to.equal(1000n);

  const handleB = await contract.connect(bob).getBalance();
  const clearB = await fhevm.userDecryptEuint(
    FhevmType.euint64, handleB, contractAddress, bob
  );
  expect(clearB).to.equal(2000n);
});
```

### Pattern 3: Event Verification

Events are your primary debugging tool. Since you cannot inspect encrypted state mid-execution, events provide proof that certain code paths were reached:

```typescript
it("should emit Deposited event", async function () {
  const enc = await fhevm
    .createEncryptedInput(contractAddress, alice.address)
    .add64(500)
    .encrypt();

  const tx = await contract.connect(alice).deposit(
    enc.handles[0], enc.inputProof
  );
  const receipt = await tx.wait();

  // Find the event in the receipt logs
  const event = receipt.logs.find(
    (log: any) => log.fragment?.name === "Deposited"
  );
  expect(event).to.not.be.undefined;
  expect(event.args[0]).to.equal(alice.address); // indexed user
});
```

Events are especially useful for tracking:
- Which code path was taken (e.g., "did the transfer succeed or fall through to the silent failure path?")
- Operation counters and indices
- Addresses and plaintext metadata associated with the operation

### Pattern 4: Error Handling with try/catch

Custom errors and `require()` reverts work for **plaintext** conditions (like `onlyOwner` checks). Test them with try/catch:

```typescript
it("should revert for non-owner", async function () {
  const enc = await fhevm
    .createEncryptedInput(contractAddress, alice.address)
    .add64(500)
    .encrypt();

  try {
    await contract.connect(alice).setWithdrawalLimit(
      enc.handles[0], enc.inputProof
    );
    expect.fail("Should have reverted");
  } catch (error: any) {
    expect(error.message).to.include("NotOwner");
  }
});
```

**Important:** You cannot test revert conditions on encrypted values. If a withdraw fails because the encrypted balance is too low, the contract does **not** revert -- it withdraws 0 instead. You must verify this by checking that the balance is unchanged.

### Pattern 5: Sequential State Verification

Complex flows require verifying state at multiple checkpoints:

```typescript
it("should handle deposit + deposit + withdraw", async function () {
  // Step 1: Deposit 500
  const enc1 = await fhevm
    .createEncryptedInput(contractAddress, alice.address)
    .add64(500)
    .encrypt();
  await (await contract.connect(alice).deposit(
    enc1.handles[0], enc1.inputProof
  )).wait();

  // Checkpoint 1: balance = 500
  let handle = await contract.connect(alice).getBalance();
  let clear = await fhevm.userDecryptEuint(
    FhevmType.euint64, handle, contractAddress, alice
  );
  expect(clear).to.equal(500n);

  // Step 2: Deposit 300
  const enc2 = await fhevm
    .createEncryptedInput(contractAddress, alice.address)
    .add64(300)
    .encrypt();
  await (await contract.connect(alice).deposit(
    enc2.handles[0], enc2.inputProof
  )).wait();

  // Checkpoint 2: balance = 800
  handle = await contract.connect(alice).getBalance();
  clear = await fhevm.userDecryptEuint(
    FhevmType.euint64, handle, contractAddress, alice
  );
  expect(clear).to.equal(800n);

  // Step 3: Withdraw 200
  const encW = await fhevm
    .createEncryptedInput(contractAddress, alice.address)
    .add64(200)
    .encrypt();
  await (await contract.connect(alice).withdraw(
    encW.handles[0], encW.inputProof
  )).wait();

  // Checkpoint 3: balance = 600
  handle = await contract.connect(alice).getBalance();
  clear = await fhevm.userDecryptEuint(
    FhevmType.euint64, handle, contractAddress, alice
  );
  expect(clear).to.equal(600n);
});
```

### Pattern 6: ACL Boundary Testing

FHE contracts use `FHE.allow()` and `FHE.allowThis()` to control who can access encrypted data. Test these boundaries:

```typescript
it("should prevent user B from decrypting user A's balance", async function () {
  // Alice deposits
  const enc = await fhevm
    .createEncryptedInput(contractAddress, alice.address)
    .add64(1000)
    .encrypt();
  await (await contract.connect(alice).deposit(
    enc.handles[0], enc.inputProof
  )).wait();

  // Alice can decrypt her own balance
  const handle = await contract.connect(alice).getBalance();
  const clear = await fhevm.userDecryptEuint(
    FhevmType.euint64, handle, contractAddress, alice
  );
  expect(clear).to.equal(1000n);

  // Bob CANNOT decrypt Alice's balance handle
  try {
    await fhevm.userDecryptEuint(
      FhevmType.euint64, handle, contractAddress, bob
    );
    expect.fail("Bob should not be able to decrypt Alice's balance");
  } catch (error) {
    // Expected failure: Bob lacks ACL permission
  }
});
```

---

## 5. Debugging Techniques

### Events as Debug Output

Since you cannot `console.log()` encrypted values, events serve as your primary debugging mechanism. Design your contracts with generous event emissions:

```solidity
// BAD: No visibility into what happened
function deposit(externalEuint64 encAmount, bytes calldata inputProof) external {
    euint64 amount = FHE.fromExternal(encAmount, inputProof);
    _balances[msg.sender] = FHE.add(_balances[msg.sender], amount);
    FHE.allowThis(_balances[msg.sender]);
    FHE.allow(_balances[msg.sender], msg.sender);
}

// GOOD: Events provide debugging signals
function deposit(externalEuint64 encAmount, bytes calldata inputProof) external {
    euint64 amount = FHE.fromExternal(encAmount, inputProof);
    _balances[msg.sender] = FHE.add(_balances[msg.sender], amount);
    FHE.allowThis(_balances[msg.sender]);
    FHE.allow(_balances[msg.sender], msg.sender);
    depositCount++;
    emit Deposited(msg.sender, depositCount);
}
```

In your tests, verify the events:

```typescript
const receipt = await tx.wait();
const event = receipt.logs.find(
  (log: any) => log.fragment?.name === "Deposited"
);
expect(event).to.not.be.undefined;
```

### Public State Variables as Checkpoints

Add plaintext counters and status flags that you can read without decryption:

```solidity
uint256 public depositCount;
uint256 public withdrawalCount;
bool public isPaused;
```

These are instantly readable in tests without the encrypt/decrypt cycle:

```typescript
expect(await vault.depositCount()).to.equal(3n);
```

### Step-by-Step Operation Verification

When a test fails, break the operation into the smallest possible steps and verify state after each one:

```typescript
// Instead of one big test, verify each step
it("debug: step 1 - deposit", async function () {
  const enc = await fhevm
    .createEncryptedInput(contractAddress, alice.address)
    .add64(1000)
    .encrypt();
  await (await contract.connect(alice).deposit(
    enc.handles[0], enc.inputProof
  )).wait();

  const handle = await contract.connect(alice).getBalance();
  const clear = await fhevm.userDecryptEuint(
    FhevmType.euint64, handle, contractAddress, alice
  );
  console.log("After deposit:", clear.toString());
  // If this prints "0" instead of "1000", the deposit logic is broken
});
```

### Isolating Failing Operations

If a complex test fails, isolate the failing operation by writing a minimal reproduction:

```typescript
it("debug: minimal reproduction of withdrawal bug", async function () {
  // Setup: deposit exactly 100
  const enc = await fhevm
    .createEncryptedInput(contractAddress, alice.address)
    .add64(100)
    .encrypt();
  await (await contract.connect(alice).deposit(
    enc.handles[0], enc.inputProof
  )).wait();

  // The suspected failing operation: withdraw 100
  const encW = await fhevm
    .createEncryptedInput(contractAddress, alice.address)
    .add64(100)
    .encrypt();
  await (await contract.connect(alice).withdraw(
    encW.handles[0], encW.inputProof
  )).wait();

  // Check
  const handle = await contract.connect(alice).getBalance();
  const clear = await fhevm.userDecryptEuint(
    FhevmType.euint64, handle, contractAddress, alice
  );
  console.log("After withdraw:", clear.toString());
});
```

### Temporary Debug: FHE.makePubliclyDecryptable()

During development, you can temporarily mark encrypted values as publicly decryptable to inspect them:

```solidity
function debugBalance(address user) external {
    // TEMPORARY -- remove before production!
    FHE.makePubliclyDecryptable(_balances[user]);
}
```

This lets anyone read the value, bypassing ACL. **Always remove this before deploying to a real network.**

---

## 6. The Silent Failure Problem

This is the single most important concept in FHE testing.

### The Problem

In a standard ERC-20, if you try to transfer more tokens than you have:

```solidity
// Standard ERC-20
require(balanceOf[msg.sender] >= amount, "Insufficient balance");
```

The transaction **reverts**. Your test can check for the revert:

```typescript
await expect(token.transfer(bob, 1000)).to.be.revertedWith("Insufficient balance");
```

In an FHE contract, you **cannot** use `require` on encrypted values because `ebool` is not a native `bool`. Instead, the contract uses the select pattern:

```solidity
// FHE contract
ebool hasEnough = FHE.ge(_balances[msg.sender], amount);
euint64 actualAmount = FHE.select(hasEnough, amount, FHE.asEuint64(0));
_balances[msg.sender] = FHE.sub(_balances[msg.sender], actualAmount);
```

If the user does not have enough balance, `actualAmount` becomes 0, and the subtraction is `balance - 0 = balance`. The transaction **succeeds** but transfers nothing. There is no revert. There is no error. This is by design -- reverting would leak information about the encrypted balance.

### Testing Silent Failures

You cannot test for reverts. Instead, verify that state did not change:

```typescript
it("should silently fail on overdraft (balance unchanged)", async function () {
  // Setup: Alice has 100
  // ...

  // Try to withdraw 9999
  const encW = await fhevm
    .createEncryptedInput(contractAddress, alice.address)
    .add64(9999)
    .encrypt();
  await (await contract.connect(alice).withdraw(
    encW.handles[0], encW.inputProof
  )).wait();

  // Verify: balance is STILL 100 (the withdrawal silently withdrew 0)
  const handle = await contract.connect(alice).getBalance();
  const clear = await fhevm.userDecryptEuint(
    FhevmType.euint64, handle, contractAddress, alice
  );
  expect(clear).to.equal(100n); // unchanged!
});
```

### Implications for Test Design

1. **Always verify state after "failed" operations.** The tx will succeed (no revert), but the state should be unchanged.
2. **Use events to confirm the operation ran.** The event will fire even on silent failures (the tx still executes).
3. **Test both paths:** a withdrawal that succeeds (balance decreases) AND a withdrawal that silently fails (balance unchanged).
4. **Never use `revertedWith` for encrypted condition failures.** It will always pass because the tx does not revert.

---

## 7. Common Testing Mistakes

### Mistake 1: Forgetting .wait()

```typescript
// WRONG: Not waiting for the transaction
await contract.connect(alice).deposit(enc.handles[0], enc.inputProof);
// Immediately tries to read balance before tx is mined

// CORRECT: Wait for transaction receipt
await (await contract.connect(alice).deposit(
  enc.handles[0], enc.inputProof
)).wait();
```

The double-await pattern (`await (await ...).wait()`) is essential. The first `await` sends the transaction, the second `await` waits for it to be mined and included in a block.

### Mistake 2: Using equal(42) Instead of equal(42n)

```typescript
// WRONG: JavaScript number comparison
expect(clear).to.equal(42);
// This may fail because clear is a BigInt

// CORRECT: BigInt comparison
expect(clear).to.equal(42n);
```

All values decrypted from FHE are BigInts. Always use the `n` suffix for expected values.

### Mistake 3: Not Granting ACL Permissions Before Reading

If you forget `FHE.allow()` in the contract, the test decryption will fail:

```solidity
// Contract -- WRONG: No ACL
function deposit(externalEuint64 encAmount, bytes calldata inputProof) external {
    euint64 amount = FHE.fromExternal(encAmount, inputProof);
    _balances[msg.sender] = FHE.add(_balances[msg.sender], amount);
    // Missing: FHE.allowThis() and FHE.allow()
}

// Contract -- CORRECT: With ACL
function deposit(externalEuint64 encAmount, bytes calldata inputProof) external {
    euint64 amount = FHE.fromExternal(encAmount, inputProof);
    _balances[msg.sender] = FHE.add(_balances[msg.sender], amount);
    FHE.allowThis(_balances[msg.sender]);           // Contract can operate on it
    FHE.allow(_balances[msg.sender], msg.sender);   // User can decrypt it
}
```

### Mistake 4: Testing Encrypted Conditions with require

```solidity
// WRONG: This will not compile or will not work as intended
function withdraw(externalEuint64 encAmount, bytes calldata inputProof) external {
    euint64 amount = FHE.fromExternal(encAmount, inputProof);
    require(FHE.ge(_balances[msg.sender], amount), "Insufficient"); // WRONG! ebool != bool
    _balances[msg.sender] = FHE.sub(_balances[msg.sender], amount);
}

// CORRECT: Use select pattern
function withdraw(externalEuint64 encAmount, bytes calldata inputProof) external {
    euint64 amount = FHE.fromExternal(encAmount, inputProof);
    ebool hasEnough = FHE.ge(_balances[msg.sender], amount);
    euint64 actualAmount = FHE.select(hasEnough, amount, FHE.asEuint64(0));
    _balances[msg.sender] = FHE.sub(_balances[msg.sender], actualAmount);
}
```

### Mistake 5: Using Chai's revertedWith for Encrypted Failures

```typescript
// WRONG: This will PASS (the tx does not revert!)
await expect(
  contract.connect(alice).withdraw(enc.handles[0], enc.inputProof)
).to.not.be.reverted;
// This proves nothing -- it always passes for select-pattern contracts

// CORRECT: Verify that state is unchanged
await (await contract.connect(alice).withdraw(
  enc.handles[0], enc.inputProof
)).wait();
const handle = await contract.connect(alice).getBalance();
const clear = await fhevm.userDecryptEuint(
  FhevmType.euint64, handle, contractAddress, alice
);
expect(clear).to.equal(originalBalance);  // Balance unchanged = withdrawal failed
```

### Mistake 6: Mismatched Signer in createEncryptedInput

```typescript
// WRONG: Encrypted for alice, sent by bob
const enc = await fhevm
  .createEncryptedInput(contractAddress, alice.address)
  .add64(100)
  .encrypt();
await contract.connect(bob).deposit(enc.handles[0], enc.inputProof);
// Proof validation fails!

// CORRECT: Match signer
const enc = await fhevm
  .createEncryptedInput(contractAddress, bob.address)
  .add64(100)
  .encrypt();
await contract.connect(bob).deposit(enc.handles[0], enc.inputProof);
```

---

## 8. Best Practices Checklist

Use this checklist when writing tests for any FHE contract:

### Test Structure
- [ ] Use `beforeEach` to deploy a fresh contract for each test (isolation)
- [ ] Get multiple signers (`owner`, `alice`, `bob`, etc.) for multi-user tests
- [ ] Follow the encrypt-act-decrypt-assert pattern consistently
- [ ] Name tests descriptively: "should withdraw 0 when amount exceeds balance"

### Encrypted Inputs
- [ ] Always match `createEncryptedInput` signer with `contract.connect()` signer
- [ ] Use the correct `add` method for the type (`add64` for `euint64`, etc.)
- [ ] Access `enc.handles[0]` and `enc.inputProof` from the encrypted result

### Decryption
- [ ] Use the correct `FhevmType` enum value matching the contract's return type
- [ ] Always use BigInt comparisons (`42n`, not `42`)
- [ ] Handle decryption errors gracefully in ACL boundary tests

### Coverage
- [ ] Test deployment/initial state
- [ ] Test every public function's success path
- [ ] Test "failure" paths by verifying state is unchanged
- [ ] Test with multiple users (balance isolation, permission isolation)
- [ ] Test owner-only functions from both owner and non-owner accounts
- [ ] Test sequential operations (deposit + deposit + withdraw)
- [ ] Test edge cases: zero amounts, max values, empty balances
- [ ] Verify events for every state-changing function

### Debugging
- [ ] Add plaintext counters for operations you want to track
- [ ] Emit events with plaintext metadata (addresses, indices)
- [ ] When a test fails, isolate the failing step with checkpoints
- [ ] Temporarily use `FHE.makePubliclyDecryptable()` for deep debugging (remove before production)

---

## 9. Full Example: TestableVault Contract

The companion contract for this module, `TestableVault.sol`, demonstrates all these patterns in a single contract:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract TestableVault is ZamaEthereumConfig {
    address public owner;
    euint64 internal _withdrawalLimit;
    mapping(address => euint64) internal _balances;
    uint256 public depositCount;
    uint256 public withdrawalCount;

    event Deposited(address indexed user, uint256 depositIndex);
    event Withdrawn(address indexed user, uint256 withdrawalIndex);
    event WithdrawalLimitSet(address indexed setter);

    error NotOwner(address caller);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner(msg.sender);
        _;
    }

    constructor() {
        owner = msg.sender;
        _withdrawalLimit = FHE.asEuint64(type(uint64).max);
        FHE.allowThis(_withdrawalLimit);
        FHE.allow(_withdrawalLimit, msg.sender);
    }

    function deposit(externalEuint64 encAmount, bytes calldata inputProof) external {
        euint64 amount = FHE.fromExternal(encAmount, inputProof);
        _balances[msg.sender] = FHE.add(_balances[msg.sender], amount);
        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);
        depositCount++;
        emit Deposited(msg.sender, depositCount);
    }

    function withdraw(externalEuint64 encAmount, bytes calldata inputProof) external {
        euint64 amount = FHE.fromExternal(encAmount, inputProof);
        ebool hasEnough = FHE.ge(_balances[msg.sender], amount);
        ebool withinLimit = FHE.le(amount, _withdrawalLimit);
        ebool canWithdraw = FHE.and(hasEnough, withinLimit);
        euint64 withdrawAmount = FHE.select(canWithdraw, amount, FHE.asEuint64(0));
        _balances[msg.sender] = FHE.sub(_balances[msg.sender], withdrawAmount);
        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);
        withdrawalCount++;
        emit Withdrawn(msg.sender, withdrawalCount);
    }

    function setWithdrawalLimit(externalEuint64 encLimit, bytes calldata inputProof) external onlyOwner {
        _withdrawalLimit = FHE.fromExternal(encLimit, inputProof);
        FHE.allowThis(_withdrawalLimit);
        FHE.allow(_withdrawalLimit, msg.sender);
        emit WithdrawalLimitSet(msg.sender);
    }

    function getBalance() external view returns (euint64) {
        return _balances[msg.sender];
    }

    function getWithdrawalLimit() external view returns (euint64) {
        return _withdrawalLimit;
    }
}
```

Key design decisions for testability:
1. **`depositCount` and `withdrawalCount`** -- plaintext counters that tests can read without decryption
2. **Events with indices** -- every operation emits an event with a sequential index
3. **Custom errors** -- `NotOwner(address)` is testable with `error.message.includes("NotOwner")`
4. **Dual-condition withdrawal** -- tests both balance check and withdrawal limit in a single operation, demonstrating `FHE.and()`
5. **`getBalance()` uses `msg.sender`** -- enforces that only the balance owner can retrieve the handle

---

## 10. Test File Walkthrough

The companion test file `TestableVault.test.ts` contains 20+ tests organized into sections:

| Section | What it tests | Pattern demonstrated |
|---------|--------------|---------------------|
| Deployment | Initial state (owner, counters, limit) | Reading plaintext + decrypting initial values |
| Deposits | Single deposit, multiple deposits, zero deposit | Encrypt-Act-Decrypt-Assert |
| Multi-User Isolation | Independent balances for different users | Multi-signer pattern |
| Withdrawals | Partial, full, overdraft | Silent failure verification |
| Withdrawal Limit | Owner sets limit, limit enforcement | Owner-only + encrypted condition |
| Owner Functions | Transfer ownership, revert on non-owner | Error handling with try/catch |
| Sequential Operations | Complex multi-step flows | Sequential state verification |

Refer to `test/TestableVault.test.ts` for the complete implementation.

---

## Summary

- FHE testing follows the **encrypt -- act -- decrypt -- assert** cycle
- Use `fhevm.createEncryptedInput()` to create encrypted inputs; match the signer address carefully
- Use `fhevm.userDecryptEuint(FhevmType.euintXX, handle, contractAddress, signer)` to decrypt results
- Always use **BigInt comparisons** (`42n`, not `42`) with Chai expectations
- FHE operations on invalid conditions **do not revert** -- they silently select the fallback value (usually 0)
- Test "failure" paths by verifying **state is unchanged**, not by expecting reverts
- Use **events** and **plaintext counters** as your primary debugging tools
- Test **ACL boundaries** by attempting decryption from unauthorized signers
- Always test with **multiple signers** to verify user isolation
- Use `FHE.makePubliclyDecryptable()` temporarily for deep debugging, then remove it
