# Module 11: Quiz -- Confidential ERC-20

Test your knowledge of building privacy-preserving tokens with FHEVM.

---

### Question 1

Why must a confidential ERC-20 transfer NOT revert on insufficient balance?

- A) Because FHE does not support reverts
- B) Because reverting leaks information -- an attacker can binary-search the balance ✅
- C) Because Solidity does not allow reverts in FHE functions
- D) Because gas is wasted on reverts

> If transfers revert on failure, an observer can determine balance ranges by testing different amounts and seeing which ones succeed vs. revert.

---

### Question 2

What does a failed transfer do in the no-revert pattern?

- A) Reverts with "Insufficient balance"
- B) Returns false
- C) Silently transfers 0 instead of the requested amount ✅
- D) Transfers the entire balance instead

> `FHE.select(hasEnough, amount, FHE.asEuint64(0))` picks 0 when the balance is insufficient, making the transaction succeed but transfer nothing.

---

### Question 3

Why does `balanceOf()` return `euint64` instead of `uint256` in a confidential ERC-20?

- A) To save gas
- B) Because the balance is stored as an encrypted value, and only users with ACL access can decrypt it ✅
- C) Because Solidity does not support uint256 with encryption
- D) Because uint256 is too large for FHE operations

> Encrypted balances are stored as `euint64`. The `balanceOf()` function returns this encrypted handle, which can only be decrypted by addresses that have been granted ACL access (typically the balance owner).

---

### Question 4

What type is used for encrypted balances?

- A) `uint256`
- B) `euint256`
- C) `euint64` ✅
- D) `bytes32`

> `euint64` provides sufficient range (up to ~18.4 quintillion) while being gas-efficient. FHE operations on larger types are significantly more expensive.

---

### Question 5

Why are amounts omitted from Transfer events?

- A) Solidity events cannot contain encrypted types
- B) To reduce gas costs
- C) Because including the amount would leak the transfer value to anyone watching events ✅
- D) Because the ERC-20 standard does not require amounts in events

> Events are publicly visible on-chain. Including the transfer amount would defeat the purpose of encrypting it in the first place.

---

### Question 6

In `transferFrom`, how are the allowance check and balance check combined?

- A) `FHE.or(hasAllowance, hasBalance)`
- B) `FHE.and(hasAllowance, hasBalance)` ✅
- C) `FHE.select(hasAllowance, hasBalance, FHE.asEbool(false))`
- D) `hasAllowance && hasBalance`

> Both conditions must be true for the transfer to proceed. `FHE.and()` combines two `ebool` values with an encrypted AND operation.

---

### Question 7

After updating a balance, which ACL calls are required?

- A) Only `FHE.allowThis()`
- B) Only `FHE.allow(balance, owner)`
- C) Both `FHE.allowThis()` and `FHE.allow(balance, owner)` ✅
- D) No ACL calls are needed

> The contract needs access for future operations (`allowThis`), and the owner needs access to decrypt their balance (`allow`).

---

### Question 8

How does the frontend send an encrypted transfer amount?

- A) `contract.transfer(to, amount)` with plaintext
- B) Encrypt with `input.add64(amount)`, then pass the encrypted bytes to `contract.transfer(to, encrypted)` ✅
- C) `contract.transfer(to, FHE.encrypt(amount))`
- D) The contract encrypts it automatically

> The frontend uses fhevmjs to encrypt the amount client-side, then passes the encrypted bytes as the `externalEuint64` parameter.

---

### Question 9

What happens inside the contract when it receives an `externalEuint64`?

- A) It is automatically converted to `euint64`
- B) It must be converted using `FHE.fromExternal()` before use ✅
- C) It must be decrypted first
- D) It can be used directly with FHE operations

> External types must be explicitly converted to internal types using `FHE.fromExternal()` before they can be used with FHE operations.

---

### Question 10

What is the purpose of `_initBalance()` being called in `_transfer`?

- A) To check if the user exists
- B) To initialize a zero-encrypted balance for addresses that have never interacted with the contract ✅
- C) To reset the balance to zero
- D) To revoke previous ACL permissions

> Addresses that have never received tokens do not have an encrypted balance entry. `_initBalance()` creates a zero-encrypted balance with proper ACL so FHE operations can be performed on it.

---

## Scoring

| Score | Rating |
|-------|--------|
| 10/10 | Excellent -- You are ready for Module 12! |
| 7-9/10 | Good -- Review the items you missed. |
| 4-6/10 | Fair -- Re-read the lesson before proceeding. |
| 0-3/10 | Needs work -- Go through the lesson and exercise again. |
