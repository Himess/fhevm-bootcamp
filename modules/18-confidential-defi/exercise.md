# Module 18: Exercise -- Build a Confidential Swap

## Objective

Implement a `ConfidentialSwap` contract that allows users to exchange encrypted amounts of two tokens (Token A and Token B) at a fixed exchange rate enforced via FHE. Users deposit encrypted balances and swap between tokens without revealing their amounts.

---

## Task: ConfidentialSwap

### Background

A swap contract is one of the most fundamental DeFi primitives. In a confidential swap:
- Users deposit Token A and Token B balances (encrypted)
- Users can swap Token A for Token B (or vice versa) at a fixed rate
- The exchange rate is public (e.g., 1 Token A = 2 Token B)
- The swap amounts are encrypted -- no one knows how much you swapped
- Insufficient balance handling uses the LastError pattern (no revert)

### Starter Code

The starter code is available at `exercises/18-defi-exercise.sol`.

---

## Step-by-Step Instructions

### Step 1: depositTokenA and depositTokenB

Accept encrypted deposits for each token:
- Use `FHE.fromExternal(encAmount, inputProof)` to convert the input
- Add the amount to the user's existing balance with `FHE.add()`
- Update ACL with `FHE.allowThis()` and `FHE.allow()`
- Emit a `Deposited` event

### Step 2: swapAtoB

Swap Token A for Token B at the fixed rate (1 A = 2 B):
- Convert the encrypted input amount
- Calculate the Token B output: `outputB = FHE.mul(amountA, FHE.asEuint64(RATE))`
- Check that the user has enough Token A: `FHE.ge(balanceA, amountA)`
- Use `FHE.select()` to conditionally update both balances:
  - If sufficient: `balanceA -= amountA`, `balanceB += outputB`
  - If insufficient: balances unchanged (LastError pattern)
- Update ACL for all new handles

### Step 3: swapBtoA

Swap Token B for Token A (reverse direction):
- Calculate the Token A output: `outputA = FHE.div(amountB, RATE)`
- Check sufficient Token B balance
- Conditionally update both balances with `FHE.select()`

### Step 4: View Functions

Implement `getBalanceA()` and `getBalanceB()` that return the encrypted balance handles for the caller.

---

## Hints

<details>
<summary>Hint 1: Initialization pattern</summary>

```solidity
function _initUser(address user) internal {
    if (!_initialized[user]) {
        _balanceA[user] = FHE.asEuint64(0);
        FHE.allowThis(_balanceA[user]);
        FHE.allow(_balanceA[user], user);

        _balanceB[user] = FHE.asEuint64(0);
        FHE.allowThis(_balanceB[user]);
        FHE.allow(_balanceB[user], user);

        _initialized[user] = true;
    }
}
```
</details>

<details>
<summary>Hint 2: swapAtoB implementation</summary>

```solidity
function swapAtoB(externalEuint64 encAmountA, bytes calldata inputProof) external {
    _initUser(msg.sender);

    euint64 amountA = FHE.fromExternal(encAmountA, inputProof);
    euint64 outputB = FHE.mul(amountA, FHE.asEuint64(RATE));

    ebool hasFunds = FHE.ge(_balanceA[msg.sender], amountA);

    _balanceA[msg.sender] = FHE.select(hasFunds,
        FHE.sub(_balanceA[msg.sender], amountA),
        _balanceA[msg.sender]);

    _balanceB[msg.sender] = FHE.select(hasFunds,
        FHE.add(_balanceB[msg.sender], outputB),
        _balanceB[msg.sender]);

    FHE.allowThis(_balanceA[msg.sender]);
    FHE.allow(_balanceA[msg.sender], msg.sender);
    FHE.allowThis(_balanceB[msg.sender]);
    FHE.allow(_balanceB[msg.sender], msg.sender);

    emit Swapped(msg.sender, true);
}
```
</details>

<details>
<summary>Hint 3: swapBtoA implementation</summary>

```solidity
function swapBtoA(externalEuint64 encAmountB, bytes calldata inputProof) external {
    _initUser(msg.sender);

    euint64 amountB = FHE.fromExternal(encAmountB, inputProof);
    euint64 outputA = FHE.div(amountB, RATE);

    ebool hasFunds = FHE.ge(_balanceB[msg.sender], amountB);

    _balanceB[msg.sender] = FHE.select(hasFunds,
        FHE.sub(_balanceB[msg.sender], amountB),
        _balanceB[msg.sender]);

    _balanceA[msg.sender] = FHE.select(hasFunds,
        FHE.add(_balanceA[msg.sender], outputA),
        _balanceA[msg.sender]);

    FHE.allowThis(_balanceA[msg.sender]);
    FHE.allow(_balanceA[msg.sender], msg.sender);
    FHE.allowThis(_balanceB[msg.sender]);
    FHE.allow(_balanceB[msg.sender], msg.sender);

    emit Swapped(msg.sender, false);
}
```
</details>

---

## Bonus Challenges

1. **Variable exchange rate:** Add an `updateRate()` function (owner only) that changes the exchange rate. All future swaps use the new rate.

2. **Swap fee:** Deduct a 1% fee from each swap. The fee stays in the contract and the owner can withdraw it. Use `FHE.div(amount, 100)` for the fee calculation.

3. **Swap limit:** Add a maximum swap amount per transaction. Use `FHE.min(requestedAmount, maxAmount)` to cap it.

4. **Two-party swap:** Instead of a pool, implement a direct peer-to-peer swap where Alice and Bob each deposit encrypted amounts, and the contract executes the exchange only if both sides are satisfied (both have sufficient balances).

---

## Success Criteria

- [ ] Contract compiles without errors
- [ ] `depositTokenA()` and `depositTokenB()` accept encrypted deposits via `FHE.fromExternal()`
- [ ] `swapAtoB()` correctly computes output using `FHE.mul(amountA, FHE.asEuint64(RATE))`
- [ ] `swapBtoA()` correctly computes output using `FHE.div(amountB, RATE)`
- [ ] Insufficient balance is handled with `FHE.select()` (no revert)
- [ ] Both balances are updated atomically in each swap
- [ ] ACL is correctly set with `FHE.allowThis()` and `FHE.allow()` after every FHE operation
- [ ] View functions return encrypted handles for the caller's balances
- [ ] All tests pass
