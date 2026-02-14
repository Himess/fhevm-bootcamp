# Module 14: Exercise -- Write a Test Suite for ConfidentialERC20

## Objective

Write a comprehensive test suite for the `ConfidentialERC20` contract from Module 11. The contract is already deployed and working -- your job is to verify every aspect of its behavior using the testing patterns from this module.

This exercise reinforces:
- The encrypt-act-decrypt-assert pattern
- Multi-user testing with multiple signers
- Silent failure verification (no reverts on encrypted conditions)
- Event verification
- ACL boundary testing
- Edge case coverage

---

## The Contract Under Test

You are testing the existing `ConfidentialERC20.sol` contract, which has:

| Function | Description |
|----------|-------------|
| `constructor(name, symbol)` | Sets token name, symbol, decimals (6), and owner |
| `mint(address to, uint64 amount)` | Owner mints plaintext amount to address (updates encrypted balance) |
| `transfer(encAmount, inputProof, to)` | Transfer encrypted amount (silent failure on insufficient balance) |
| `approve(encAmount, inputProof, spender)` | Approve spender for encrypted allowance |
| `transferFrom(from, encAmount, inputProof, to)` | Transfer with allowance check (silent failure on insufficient allowance) |
| `balanceOf(address)` | Returns encrypted balance handle |
| `allowance(owner, spender)` | Returns encrypted allowance handle |
| `name()`, `symbol()`, `decimals()`, `totalSupply()`, `owner()` | Public metadata |

---

## Task

Complete the test file skeleton at `exercises/14-testing-exercise.ts`. Each `TODO` block describes a specific test you need to implement.

### Required Tests (12 tests minimum)

**Deployment (2 tests)**
1. Should deploy with correct name, symbol, and decimals
2. Should set the deployer as owner with totalSupply 0

**Minting (2 tests)**
3. Should mint tokens and verify encrypted balance
4. Should reject mint from non-owner

**Transfers (3 tests)**
5. Should transfer tokens between users (sender balance decreases, receiver balance increases)
6. Should silently transfer 0 on insufficient balance (sender balance unchanged)
7. Should handle transfer to self (balance unchanged)

**Allowances (3 tests)**
8. Should approve and verify encrypted allowance
9. Should transferFrom within allowance
10. Should silently transfer 0 on insufficient allowance

**Edge Cases (2 tests)**
11. Should handle multiple sequential transfers correctly
12. Should maintain correct totalSupply after multiple mints

---

## Step-by-Step Instructions

### Step 1: Setup

The `beforeEach` block is already provided. It:
1. Gets three signers: `owner`, `alice`, `bob`
2. Deploys a fresh `ConfidentialERC20` with name "TestToken" and symbol "TT"
3. Waits for deployment and stores the contract address

### Step 2: Deployment Tests

Test that the constructor set the correct values. These are plaintext reads -- no encryption needed:

```typescript
expect(await token.name()).to.equal("TestToken");
expect(await token.decimals()).to.equal(6n);
```

### Step 3: Mint Tests

The `mint()` function takes a plaintext amount and an address. After minting, verify:
- The `totalSupply` increased
- The recipient's encrypted balance matches the minted amount (requires decrypt)

For the non-owner test, use try/catch and check for "Not the owner" in the error.

### Step 4: Transfer Tests

For each transfer test:
1. Mint tokens to the sender first
2. Create an encrypted input for the transfer amount
3. Call `transfer(enc.handles[0], enc.inputProof, recipientAddress)`
4. Decrypt both sender and receiver balances
5. Verify the expected values

For the silent failure test: transfer more than the balance, then verify the sender's balance is unchanged.

### Step 5: Allowance Tests

1. Mint tokens to Alice
2. Alice calls `approve(enc.handles[0], enc.inputProof, bob.address)`
3. Verify allowance by decrypting `token.allowance(alice.address, bob.address)`
4. Bob calls `transferFrom(alice.address, enc.handles[0], enc.inputProof, bob.address)`
5. Verify balances after transfer

### Step 6: Edge Cases

- **Transfer to self:** Alice transfers to Alice -- balance should stay the same
- **Sequential transfers:** Alice -> Bob, Bob -> Alice, verify final balances
- **Multiple mints:** Mint to Alice twice, verify totalSupply is the sum

---

## Hints

<details>
<summary>Hint 1: Encrypting a transfer amount</summary>

```typescript
const enc = await fhevm
  .createEncryptedInput(tokenAddress, alice.address)
  .add64(300)
  .encrypt();
await (await token.connect(alice).transfer(
  enc.handles[0], enc.inputProof, bob.address
)).wait();
```

Remember: the signer in `createEncryptedInput` must match `.connect()`.
</details>

<details>
<summary>Hint 2: Decrypting a balance</summary>

```typescript
const handle = await token.balanceOf(alice.address);
const clear = await fhevm.userDecryptEuint(
  FhevmType.euint64, handle, tokenAddress, alice
);
expect(clear).to.equal(700n);
```

Note: use `tokenAddress` (not `contractAddress`) -- the variable name from the test setup.
</details>

<details>
<summary>Hint 3: Testing silent failure on transfer</summary>

```typescript
// Alice has 100, tries to send 200
const enc = await fhevm
  .createEncryptedInput(tokenAddress, alice.address)
  .add64(200)
  .encrypt();
await (await token.connect(alice).transfer(
  enc.handles[0], enc.inputProof, bob.address
)).wait();

// Balance should be UNCHANGED (100, not -100, not 0)
const handle = await token.balanceOf(alice.address);
const clear = await fhevm.userDecryptEuint(
  FhevmType.euint64, handle, tokenAddress, alice
);
expect(clear).to.equal(100n);
```
</details>

<details>
<summary>Hint 4: Testing approve + transferFrom</summary>

```typescript
// 1. Mint to Alice
await (await token.mint(alice.address, 1000)).wait();

// 2. Alice approves Bob for 500
const encApproval = await fhevm
  .createEncryptedInput(tokenAddress, alice.address)
  .add64(500)
  .encrypt();
await (await token.connect(alice).approve(
  encApproval.handles[0], encApproval.inputProof, bob.address
)).wait();

// 3. Bob transfers 300 from Alice
const encTransfer = await fhevm
  .createEncryptedInput(tokenAddress, bob.address)
  .add64(300)
  .encrypt();
await (await token.connect(bob).transferFrom(
  alice.address, encTransfer.handles[0], encTransfer.inputProof, bob.address
)).wait();

// 4. Verify balances
// Alice: 1000 - 300 = 700
// Bob: 0 + 300 = 300
```
</details>

---

## Starter File

The exercise template is at: `exercises/14-testing-exercise.ts`

The complete solution is at: `solutions/14-testing-solution.ts`

---

## Success Criteria

- [ ] All 12+ tests pass when run with `npx hardhat test exercises/14-testing-exercise.ts`
- [ ] Deployment tests verify name, symbol, decimals, owner, and totalSupply
- [ ] Mint test uses decrypt to verify encrypted balance (not just totalSupply)
- [ ] Transfer test verifies both sender and receiver balances after transfer
- [ ] Silent failure test verifies balance is unchanged after overdraft transfer
- [ ] Allowance test includes both approve and transferFrom steps
- [ ] Non-owner mint test uses try/catch (not revertedWith)
- [ ] All BigInt assertions use the `n` suffix (`1000n`, not `1000`)
- [ ] All encrypted inputs match the signer in `.connect()`

---

## Bonus Challenges

1. **Event coverage:** Add a test that verifies the `Transfer`, `Approval`, and `Mint` events are emitted with correct indexed parameters.

2. **Allowance exhaustion:** Approve Bob for 500, have Bob transfer 300, then verify the remaining allowance is 200 by decrypting the allowance handle.

3. **Multi-user stress test:** Create a scenario with 3+ users performing interleaved mints, transfers, and approvals, then verify all final balances.

4. **ACL boundary test:** After Alice mints tokens, verify that Bob cannot decrypt Alice's balance by attempting `userDecryptEuint` as Bob and catching the error.
