---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 14: Testing & Debugging FHE Contracts"
footer: "Zama Developer Program"
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

# Module 14: Testing & Debugging FHE Contracts

Writing tests for contracts where values are invisible.

---

# Learning Objectives

By the end of this module, you will be able to:

1. Set up the fhEVM test environment with `@fhevm/hardhat-plugin`
2. Create encrypted inputs with `createEncryptedInput`
3. Decrypt values with `userDecryptEuint` and `userDecryptEbool`
4. Apply the **encrypt -- act -- decrypt -- assert** pattern
5. Test **silent failures** (no reverts on encrypted conditions)
6. Debug FHE contracts using events and plaintext counters
7. Test ACL boundaries and multi-user isolation

<!--
Speaker notes: Open with the core tension. Testing means verifying behavior, but FHE hides the behavior behind encryption. Every tool developers rely on for debugging (console.log, require, revert messages) is either broken or meaningless in the FHE context. This module teaches the alternative approaches.
-->

---

# The Unique Challenge

**You cannot see the values you are testing.**

- `console.log(balance)` prints a handle, not a number
- `require(balance >= amount)` does not compile -- `ebool` is not `bool`
- `revertedWith("Insufficient balance")` never triggers -- FHE does not revert
- View functions return **encrypted handles**, not numbers
- Function return values are opaque ciphertexts until decrypted

The paradigm shift: **encrypt, act, decrypt, assert**.

<!--
Speaker notes: Walk through each bullet and explain why it breaks. console.log prints a bytes32 handle identifier. require cannot evaluate an ebool. revertedWith never fires because FHE contracts use FHE.select instead of branching. This forces a completely new testing methodology.
-->

---

# The Test Environment

```typescript
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
```

| Object | Purpose |
|--------|---------|
| `ethers` | Deploy contracts, get signers |
| `fhevm` | Encrypt inputs, decrypt outputs |
| `FhevmType` | Enum for `euint8`, `euint16`, `euint32`, `euint64` |

The mock environment runs **plaintext behind the scenes** -- tests are fast and deterministic.

<!--
Speaker notes: Explain that @fhevm/hardhat-plugin provides the fhevm object automatically. The mock is critical -- real FHE would make tests unbearably slow. Emphasize that tests run locally on Hardhat Network, not on a real FHE chain. The mock stores plaintext behind encrypted handles.
-->

---

# Hardhat Configuration

```typescript
import "@nomicfoundation/hardhat-ethers";
import "@fhevm/hardhat-plugin";

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
    settings: { optimizer: { enabled: true, runs: 800 }, evmVersion: "cancun" },
  },
};
```

The `@fhevm/hardhat-plugin` import auto-registers the mock FHE environment.

<!--
Speaker notes: Key points: chainId 31337 is standard Hardhat Network. The mnemonic provides deterministic test accounts. The plugin import is all you need -- no additional configuration. Students should verify their hardhat.config.ts matches this structure.
-->

---

# The fhevm API

Three critical methods on the `fhevm` object:

| Method | Purpose |
|--------|---------|
| `fhevm.createEncryptedInput(contractAddr, signerAddr)` | Create encrypted inputs for contract calls |
| `fhevm.userDecryptEuint(FhevmType, handle, contractAddr, signer)` | Decrypt a numeric encrypted value |
| `fhevm.userDecryptEbool(handle, contractAddr, signer)` | Decrypt an encrypted boolean |

The `FhevmType` enum: `euint8`, `euint16`, `euint32`, `euint64`

<!--
Speaker notes: These three methods are the entire testing API for FHE. createEncryptedInput builds the encrypted input + proof. userDecryptEuint decrypts numeric types. userDecryptEbool decrypts booleans. The signer must have ACL permission for decryption to succeed.
-->

---

# The Core Pattern: Encrypt -- Act -- Decrypt -- Assert

```typescript
// 1. ENCRYPT
const enc = await fhevm
  .createEncryptedInput(contractAddress, alice.address)
  .add64(1000)
  .encrypt();

// 2. ACT
await (await contract.connect(alice).deposit(
  enc.handles[0], enc.inputProof
)).wait();

// 3. DECRYPT
const handle = await contract.connect(alice).getBalance();
const clear = await fhevm.userDecryptEuint(
  FhevmType.euint64, handle, contractAddress, alice
);

// 4. ASSERT
expect(clear).to.equal(1000n);
```

<!--
Speaker notes: This is the fundamental pattern. Every FHE test follows these four steps. Walk through each step: encrypt creates the input with proof, act sends the transaction, decrypt reads the encrypted result, assert verifies the plaintext value. Emphasize the double-await pattern on the act step.
-->

---

# Creating Encrypted Inputs

```typescript
const enc = await fhevm
  .createEncryptedInput(contractAddress, signerAddress)
  .add64(value)
  .encrypt();

// Use in contract call:
await contract.connect(signer).fn(enc.handles[0], enc.inputProof);
```

**Type-specific methods:**
| Method | Type | Max Value |
|--------|------|-----------|
| `.addBool(true)` | `ebool` | true/false |
| `.add8(255)` | `euint8` | 255 |
| `.add16(65535)` | `euint16` | 65,535 |
| `.add32(1000000)` | `euint32` | ~4.29 billion |
| `.add64(1000000)` | `euint64` | ~1.8 x 10^19 |

**Critical:** The signer in `createEncryptedInput` **must match** `contract.connect(signer)`.

<!--
Speaker notes: Emphasize the address matching rule. This is the number one cause of confusing test failures. The proof is cryptographically bound to a specific contract address and signer. If you encrypt for Alice but send as Bob, the proof validation will fail with an opaque error.
-->

---

# Multiple Values in One Input

```typescript
const enc = await fhevm
  .createEncryptedInput(contractAddress, signer.address)
  .add64(amount)
  .add64(limit)
  .encrypt();

// First value:  enc.handles[0]
// Second value: enc.handles[1]
// Shared proof:  enc.inputProof
```

All values share the same `inputProof`, but each gets its own `handle` at a different index.

```typescript
await contract.connect(signer).doSomething(
  enc.handles[0], enc.handles[1], enc.inputProof
);
```

<!--
Speaker notes: This is useful when a contract function accepts multiple encrypted parameters. You create one encrypted input, add all values, and encrypt once. Each handle is at a different index. The proof covers all values together.
-->

---

# Decrypting in Tests

```typescript
// Numeric types
const handle = await contract.connect(alice).getBalance();
const clear = await fhevm.userDecryptEuint(
  FhevmType.euint64,   // Must match the contract's return type
  handle,               // Handle from the view function
  contractAddress,      // Contract that owns the value
  alice                 // Signer with ACL permission
);
expect(clear).to.equal(1000n);  // Always BigInt!

// Booleans
const boolHandle = await contract.connect(alice).getIsActive();
const clearBool = await fhevm.userDecryptEbool(
  boolHandle, contractAddress, alice
);
expect(clearBool).to.equal(true);
```

**Decryption fails if the signer lacks ACL permission.**

<!--
Speaker notes: Two different methods: userDecryptEuint for numbers (requires the FhevmType enum), userDecryptEbool for booleans. The signer must have ACL permission -- if the contract never called FHE.allow for that user, decryption fails. Always use BigInt (42n) for numeric assertions.
-->

---

# The Silent Failure Problem

**Standard Solidity:**
```solidity
require(balance >= amount, "Insufficient");  // REVERTS
```

**FHE Solidity:**
```solidity
ebool hasEnough = FHE.ge(balance, amount);
euint64 actual = FHE.select(hasEnough, amount, FHE.asEuint64(0));
// If hasEnough is false: actual = 0, balance unchanged, NO REVERT
```

The transaction **succeeds**. The balance does **not change**.
You **cannot** use `revertedWith` to test encrypted condition failures.

<!--
Speaker notes: This is the most important concept in the module. Spend extra time here. FHE contracts cannot branch on encrypted conditions, so they use FHE.select to choose between success and failure paths. Both paths execute without reverting. This means "failed" operations produce successful transactions. The only way to detect failure is to check that state did not change.
-->

---

# Testing Silent Failures

```typescript
it("should withdraw 0 on overdraft (balance unchanged)", async () => {
  // Setup: Alice has 100
  // ... (deposit 100 first)

  // Try to withdraw 9999
  const enc = await fhevm
    .createEncryptedInput(contractAddress, alice.address)
    .add64(9999)
    .encrypt();
  await (await contract.connect(alice).withdraw(
    enc.handles[0], enc.inputProof
  )).wait();  // Does NOT revert!

  // Verify: balance is STILL 100
  const handle = await contract.connect(alice).getBalance();
  const clear = await fhevm.userDecryptEuint(
    FhevmType.euint64, handle, contractAddress, alice
  );
  expect(clear).to.equal(100n);  // Unchanged!
});
```

<!--
Speaker notes: Walk through the test step by step. The withdrawal of 9999 does not revert even though Alice only has 100. The select pattern chose 0 as the withdrawal amount, so the balance remained 100. We verify this by decrypting and asserting the original value. This is the correct way to test "failure" in FHE.
-->

---

# Multi-User Testing

```typescript
const [owner, alice, bob] = await ethers.getSigners();

// Alice deposits 1000
const encA = await fhevm
  .createEncryptedInput(addr, alice.address)
  .add64(1000).encrypt();
await (await vault.connect(alice).deposit(
  encA.handles[0], encA.inputProof)).wait();

// Bob deposits 2000
const encB = await fhevm
  .createEncryptedInput(addr, bob.address)
  .add64(2000).encrypt();
await (await vault.connect(bob).deposit(
  encB.handles[0], encB.inputProof)).wait();

// Verify each independently: Alice: 1000n, Bob: 2000n
```

Each signer creates their own encrypted input and calls the contract separately.

<!--
Speaker notes: Multi-user tests require different signers for each user. Each signer creates their own encrypted input and calls the contract separately. After both deposits, verify each user's balance independently. This tests both the FHE logic and the ACL isolation.
-->

---

# ACL Boundary Testing

```typescript
it("should prevent Bob from decrypting Alice's balance", async () => {
  // Alice deposits 1000
  const enc = await fhevm
    .createEncryptedInput(contractAddress, alice.address)
    .add64(1000).encrypt();
  await (await contract.connect(alice).deposit(
    enc.handles[0], enc.inputProof)).wait();

  // Alice CAN decrypt her balance
  const handle = await contract.connect(alice).getBalance();
  const clear = await fhevm.userDecryptEuint(
    FhevmType.euint64, handle, contractAddress, alice);
  expect(clear).to.equal(1000n);

  // Bob CANNOT decrypt Alice's balance
  try {
    await fhevm.userDecryptEuint(
      FhevmType.euint64, handle, contractAddress, bob);
    expect.fail("Bob should not decrypt Alice's balance");
  } catch (error) {
    // Expected: Bob lacks ACL permission
  }
});
```

<!--
Speaker notes: ACL boundary tests are essential to verify data isolation. Attempting decryption from an unauthorized signer should fail. This validates that the contract correctly sets FHE.allow only for the intended user and not for everyone.
-->

---

# Event-Driven Debugging

**In the contract:**
```solidity
event Deposited(address indexed user, uint256 depositIndex);
uint256 public depositCount;

function deposit(...) external {
    // ... FHE operations ...
    depositCount++;
    emit Deposited(msg.sender, depositCount);
}
```

**In the test:**
```typescript
const receipt = await tx.wait();
const event = receipt.logs.find(
  (log: any) => log.fragment?.name === "Deposited"
);
expect(event).to.not.be.undefined;
expect(event.args[0]).to.equal(alice.address);
```

<!--
Speaker notes: Events are the replacement for console.log in FHE development. You cannot log encrypted values, but you can log plaintext metadata: who called the function, what the operation index was, which code path was reached. Plaintext counters like depositCount give you instant verification without decryption.
-->

---

# Debugging Strategies

| Technique | When to Use |
|-----------|-------------|
| **Plaintext counters** | Quick state checks without decryption |
| **Events with metadata** | Track execution paths and operation indices |
| **Step-by-step verification** | Isolate which step of a complex flow fails |
| **Minimal reproduction** | When a complex test fails, simplify to one operation |
| **FHE.makePubliclyDecryptable()** | Temporary deep debugging (remove before deploy!) |

```typescript
// Debug: print intermediate state
console.log("depositCount:", await vault.depositCount());
console.log("After deposit:", clear.toString());
```

<!--
Speaker notes: Go through each strategy. Plaintext counters are the fastest debugging tool. Events provide execution traces. Step-by-step isolation finds the exact failing operation. Minimal reproduction strips away irrelevant complexity. makePubliclyDecryptable is the nuclear option -- use only in development, never in production.
-->

---

# Testing Owner-Only Functions

```typescript
it("should revert for non-owner", async function () {
  const enc = await fhevm
    .createEncryptedInput(contractAddress, alice.address)
    .add64(500).encrypt();

  try {
    await contract.connect(alice)
      .setWithdrawalLimit(enc.handles[0], enc.inputProof);
    expect.fail("Should have reverted");
  } catch (error: any) {
    expect(error.message).to.include("NotOwner");
  }
});
```

**Plaintext conditions** (`require`, `if/revert`) still revert normally.
Only **encrypted conditions** (`FHE.ge`, `FHE.gt`) use the silent failure pattern.

<!--
Speaker notes: Clarify the distinction: plaintext require statements still work as expected and produce reverts. It is only encrypted conditions that cannot revert. Owner checks, reentrancy guards, and parameter validation all use standard require and can be tested with try/catch or Chai's revertedWith.
-->

---

# Common Mistakes

| Mistake | Fix |
|---------|-----|
| Forgetting `.wait()` | Always: `await (await tx).wait()` |
| `equal(42)` instead of `equal(42n)` | All FHE values are BigInt |
| Mismatched signer in `createEncryptedInput` | Match with `.connect(signer)` |
| Using `revertedWith` for FHE failures | Verify state is unchanged instead |
| Missing `FHE.allow()` in contract | Decryption fails without ACL |
| `console.log` on encrypted handle | Only shows handle ID, not value |
| Wrong `FhevmType` in decrypt | Must match contract's return type |

<!--
Speaker notes: Go through each mistake. The .wait() mistake is subtle because the test may sometimes pass without it due to timing, but fail intermittently. The BigInt mistake produces confusing Chai errors like "expected 42n to equal 42". The signer mismatch produces opaque proof errors. These are the most common issues students will face.
-->

---

# Sequential State Verification

```typescript
it("deposit + deposit + withdraw flow", async function () {
  // Step 1: Deposit 500 -> verify balance = 500
  // ... encrypt, act, decrypt, assert ...
  expect(clear).to.equal(500n);

  // Step 2: Deposit 300 -> verify balance = 800
  // ... encrypt, act, decrypt, assert ...
  expect(clear).to.equal(800n);

  // Step 3: Withdraw 200 -> verify balance = 600
  // ... encrypt, act, decrypt, assert ...
  expect(clear).to.equal(600n);
});
```

For complex flows, verify state at **every checkpoint**, not just the final result.

<!--
Speaker notes: When tests fail, the first question is: "Which step went wrong?" By checking at every checkpoint, you pinpoint the exact operation that produced the wrong result. Without checkpoints, a failure at step 3 could actually be caused by a bug in step 1.
-->

---

# TestableVault: Design for Testability

```solidity
contract TestableVault is ZamaEthereumConfig {
    uint256 public depositCount;       // Plaintext counter
    uint256 public withdrawalCount;    // Plaintext counter

    event Deposited(address indexed user, uint256 depositIndex);
    event Withdrawn(address indexed user, uint256 withdrawalIndex);

    error NotOwner(address caller);    // Custom error

    function withdraw(...) external {
        ebool hasEnough = FHE.ge(_balances[msg.sender], amount);
        ebool withinLimit = FHE.le(amount, _withdrawalLimit);
        ebool canWithdraw = FHE.and(hasEnough, withinLimit);
        euint64 withdrawAmount = FHE.select(
            canWithdraw, amount, FHE.asEuint64(0));
        // ...
    }
}
```

<!--
Speaker notes: Walk through the design decisions in TestableVault. Plaintext counters make state verification fast. Events provide execution traces. Custom errors enable precise assertions. The dual-condition withdrawal (balance check AND limit check combined with FHE.and) demonstrates complex encrypted logic that needs careful testing.
-->

---

# Best Practices Checklist

**Test Structure:**
- [ ] Deploy fresh contract in `beforeEach` (isolation)
- [ ] Use multiple signers for multi-user tests
- [ ] Follow encrypt-act-decrypt-assert consistently

**Encrypted Inputs:**
- [ ] Match `createEncryptedInput` signer with `connect` signer
- [ ] Use correct `add` method for type (`add64` for `euint64`, etc.)

**Assertions:**
- [ ] Use `42n` (BigInt) for all numeric assertions
- [ ] Test success AND silent failure paths
- [ ] Verify events for every state-changing function
- [ ] Test ACL boundaries (unauthorized decryption fails)
- [ ] Test edge cases: zero, max value, empty balances

<!--
Speaker notes: This is the summary slide students should reference when writing their own tests. Each item addresses a specific testing challenge covered in the lesson. Encourage students to literally check off each item for their exercise submission.
-->

---

# Exercise Preview

**Task:** Write a test suite for `ConfidentialERC20`

Tests to implement:
1. Deployment (name, symbol, decimals, owner)
2. Minting (verify encrypted balance after mint)
3. Transfer (sender decreases, receiver increases)
4. Silent failure (overdraft transfer leaves balance unchanged)
5. Approve + transferFrom flow
6. Non-owner mint rejection
7. Sequential transfers
8. Edge cases (zero amount, max value)

Template: `exercises/14-testing-exercise.ts`
Solution: `solutions/14-testing-solution.ts`

<!--
Speaker notes: Preview the exercise to set expectations. Students will apply every pattern from this module to a contract they already know. The ConfidentialERC20 has transfers, allowances, and owner-only minting -- all of which require different testing techniques. Emphasize that the template has TODO blocks to guide them.
-->

---

# Summary

1. FHE tests follow **encrypt -- act -- decrypt -- assert**
2. Use `fhevm.createEncryptedInput()` and `fhevm.userDecryptEuint()`
3. **Silent failures:** FHE operations do not revert -- verify state is unchanged
4. **Events** and plaintext counters are your primary debugging tools
5. Always use **BigInt** (`42n`) for numeric assertions
6. Match signers in `createEncryptedInput` and `connect`
7. Test **both** success and failure paths
8. Test **ACL boundaries** with unauthorized decryption attempts
9. Design contracts for testability: counters, events, custom errors

<!--
Speaker notes: Wrap up by reinforcing the key takeaways. The paradigm shift from "check for reverts" to "check that state is unchanged" is the most important lesson. If students remember one thing, it should be: in FHE, failure is silent, so test by verifying state.
-->
