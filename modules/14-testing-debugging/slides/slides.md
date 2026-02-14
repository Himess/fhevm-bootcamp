---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 14: Testing & Debugging FHE Contracts"
footer: "Zama Developer Program"
---

# Module 14: Testing & Debugging FHE Contracts

Writing tests for contracts where values are invisible.

---

<!-- _class: lead -->
# The Unique Challenge

**You cannot see the values you are testing.**

- `console.log(balance)` prints a handle, not a number
- `require(balance >= amount)` does not compile -- `ebool` is not `bool`
- `revertedWith("Insufficient balance")` never triggers -- FHE does not revert

<!--
Speaker notes: Open with the core tension. Testing means verifying behavior, but FHE hides the behavior behind encryption. Every tool developers rely on for debugging (console.log, require, revert messages) is either broken or meaningless in the FHE context. This module teaches the alternative approaches.
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
Speaker notes: Explain that @fhevm/hardhat-plugin provides the fhevm object automatically. The mock is critical -- real FHE would make tests unbearably slow. Emphasize that tests run locally on Hardhat Network, not on a real FHE chain.
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
  .add64(value)       // euint64
  .encrypt();
```

**Type-specific methods:**
| Method | Type |
|--------|------|
| `.addBool(true)` | `ebool` |
| `.add8(255)` | `euint8` |
| `.add16(65535)` | `euint16` |
| `.add32(1000000)` | `euint32` |
| `.add64(1000000)` | `euint64` |

**Critical:** The signer in `createEncryptedInput` **must match** `contract.connect(signer)`.

<!--
Speaker notes: Emphasize the address matching rule. This is the number one cause of confusing test failures. The proof is cryptographically bound to a specific signer. If you encrypt for Alice but send as Bob, the proof validation will fail with an opaque error.
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
expect(clear).to.equal(1000n);  // BigInt!

// Booleans
const boolHandle = await contract.connect(alice).getIsActive();
const clearBool = await fhevm.userDecryptEbool(
  boolHandle, contractAddress, alice
);
expect(clearBool).to.equal(true);
```

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

You **cannot** use `revertedWith` to test this.

<!--
Speaker notes: This is the most important concept in the module. Spend extra time here. FHE contracts cannot branch on encrypted conditions, so they use FHE.select to choose between success and failure paths. Both paths execute without reverting. This means "failed" operations produce successful transactions. The only way to detect failure is to check that state did not change.
-->

---

# Testing Silent Failures

```typescript
it("should withdraw 0 on overdraft (balance unchanged)", async () => {
  // Setup: Alice has 100
  // ...

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

// Each user's balance is independent
// Alice: 1000n, Bob: 2000n
```

<!--
Speaker notes: Multi-user tests require different signers for each user. Each signer creates their own encrypted input and calls the contract separately. After both deposits, verify each user's balance independently. This tests both the FHE logic and the ACL isolation.
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
Speaker notes: Clarify the distinction: plaintext require statements still work as expected and produce reverts. It is only encrypted conditions that cannot revert. Owner checks, reentrancy guards, and parameter validation all use standard require and can be tested with try/catch.
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

<!--
Speaker notes: Go through each mistake. The .wait() mistake is subtle because the test may sometimes pass without it due to timing, but fail intermittently. The BigInt mistake produces confusing Chai errors like "expected 42n to equal 42". The signer mismatch produces opaque proof errors. These are the most common issues students will face.
-->

---

# Best Practices Checklist

- [ ] Deploy fresh contract in `beforeEach`
- [ ] Use multiple signers for multi-user tests
- [ ] Follow encrypt-act-decrypt-assert consistently
- [ ] Match `createEncryptedInput` signer with `connect` signer
- [ ] Use `42n` (BigInt) for all numeric assertions
- [ ] Test success paths AND silent failure paths
- [ ] Verify events for every state-changing function
- [ ] Test ACL boundaries (unauthorized decryption fails)
- [ ] Add plaintext counters for quick state checks
- [ ] Test edge cases: zero, max value, empty balances

<!--
Speaker notes: This is the summary slide students should reference when writing their own tests. Each item addresses a specific testing challenge covered in the lesson. Encourage students to literally check off each item for their exercise submission.
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
8. Edge cases

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
4. **Events** are your primary debugging tool
5. Always use **BigInt** (`42n`) for assertions
6. Match signers in `createEncryptedInput` and `connect`
7. Test **both** success and failure paths
8. Test **ACL boundaries** with unauthorized decryption attempts

<!--
Speaker notes: Wrap up by reinforcing the key takeaways. The paradigm shift from "check for reverts" to "check that state is unchanged" is the most important lesson. If students remember one thing, it should be: in FHE, failure is silent, so test by verifying state.
-->
