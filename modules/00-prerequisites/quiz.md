# Module 00 - Quiz: Solidity Prerequisites

Test your understanding of the Solidity fundamentals covered in this module. Each question has one correct answer.

---

### Question 1

What is the default size of a `uint` in Solidity?

- A) 8 bits
- B) 32 bits
- C) 128 bits
- D) 256 bits

<details>
<summary>Answer</summary>

**D) 256 bits**

`uint` is an alias for `uint256`. The EVM operates on 256-bit words natively.
</details>

---

### Question 2

What value does a mapping return for a key that has never been set?

- A) It throws an error
- B) It returns `null`
- C) It returns the default value for the value type (e.g., `0` for `uint256`)
- D) It returns `undefined`

<details>
<summary>Answer</summary>

**C) It returns the default value for the value type (e.g., `0` for `uint256`)**

In Solidity, all possible keys exist in a mapping. Accessing an unset key returns the default value: `0` for integers, `false` for bools, `address(0)` for addresses.
</details>

---

### Question 3

What does the `indexed` keyword do when used in an event parameter?

- A) It stores the parameter in contract storage
- B) It allows the parameter to be used for filtering logs off-chain
- C) It makes the parameter immutable
- D) It reduces the gas cost of emitting the event

<details>
<summary>Answer</summary>

**B) It allows the parameter to be used for filtering logs off-chain**

Indexed parameters are stored as log topics, making them searchable and filterable by off-chain services. Up to 3 parameters per event can be indexed.
</details>

---

### Question 4

What does the `_` (underscore) represent inside a modifier?

- A) A wildcard that matches any value
- B) The return value of the function
- C) A placeholder where the modified function's body will execute
- D) A reference to the previous modifier in the chain

<details>
<summary>Answer</summary>

**C) A placeholder where the modified function's body will execute**

The `_;` in a modifier marks where the function body (or next modifier) is inserted. Code before `_;` runs first, then the function body, then any code after `_;`.
</details>

---

### Question 5

What happens when a `require` statement evaluates to `false`?

- A) The function returns `false`
- B) The function continues execution but logs a warning
- C) The transaction reverts and all state changes in the current call are undone
- D) Only the current function reverts; the calling function continues

<details>
<summary>Answer</summary>

**C) The transaction reverts and all state changes in the current call are undone**

`require(false, "message")` causes the entire transaction to revert, undoing all state changes and refunding remaining gas (minus what was consumed).
</details>

---

### Question 6

Which ERC-20 function must be called before `transferFrom` can succeed?

- A) `transfer`
- B) `approve`
- C) `mint`
- D) `allowance`

<details>
<summary>Answer</summary>

**B) `approve`**

The token owner must first call `approve(spender, amount)` to grant the spender an allowance. Only then can the spender call `transferFrom(owner, recipient, amount)`.
</details>

---

### Question 7

What is `msg.sender` in the context of a smart contract function call?

- A) The address of the contract itself
- B) The address that originally initiated the transaction (EOA)
- C) The address of the account that directly called the current function
- D) The address of the block miner/validator

<details>
<summary>Answer</summary>

**C) The address of the account that directly called the current function**

`msg.sender` is the immediate caller. If User calls Contract A, which calls Contract B, then inside Contract B `msg.sender` is Contract A's address, not the User's address.
</details>

---

### Question 8

In a Hardhat test, which function is used to get test accounts?

- A) `ethers.getAccounts()`
- B) `ethers.getSigners()`
- C) `ethers.getWallets()`
- D) `hardhat.accounts()`

<details>
<summary>Answer</summary>

**B) `ethers.getSigners()`**

`await ethers.getSigners()` returns an array of `Signer` objects representing the pre-funded test accounts provided by the Hardhat local network.
</details>

---

### Question 9

Why is it important to update state variables BEFORE making external calls in the `withdraw` function?

- A) To save gas
- B) To prevent reentrancy attacks
- C) Because the compiler requires it
- D) To make events emit in the correct order

<details>
<summary>Answer</summary>

**B) To prevent reentrancy attacks**

This is the Checks-Effects-Interactions (CEI) pattern. By updating the balance before sending ETH, a malicious contract cannot re-enter the `withdraw` function and drain more than its balance.
</details>

---

### Question 10

Which of the following is NOT a valid Solidity data type?

- A) `bytes32`
- B) `address payable`
- C) `float`
- D) `uint8`

<details>
<summary>Answer</summary>

**C) `float`**

Solidity does not support floating-point numbers. All arithmetic is done with integers. To represent decimal values, protocols use a fixed number of decimal places (e.g., 18 decimals for most ERC-20 tokens).
</details>

---

## Scoring

| Score   | Assessment                                    |
|---------|-----------------------------------------------|
| 9-10    | Excellent -- you are ready for Module 01      |
| 7-8     | Good -- review the topics you missed          |
| 5-6     | Fair -- re-read the lesson before proceeding  |
| Below 5 | Review the lesson thoroughly and try again    |
