# Module 16: Quiz -- Security Best Practices for FHE

Test your understanding of FHE-specific security vulnerabilities and their mitigations.

---

### Question 1

Why is branching on an encrypted condition (if/else) dangerous in FHE contracts?

- A) It causes the transaction to revert
- B) It reveals the encrypted condition through gas consumption differences ✅
- C) FHE does not support boolean values
- D) It corrupts the ciphertext

**Answer: B** -- Different branches execute different numbers of FHE operations, consuming different amounts of gas. An observer can infer the encrypted condition by watching gas usage.

---

### Question 2

What is the correct way to handle a conditional transfer when the sender may have insufficient encrypted balance?

- A) `require(FHE.decrypt(hasBalance), "Insufficient balance");`
- B) `if (hasBalance) { transfer(); } else { revert(); }`
- C) `euint64 actual = FHE.select(hasBalance, amount, FHE.asEuint64(0));` followed by unconditional balance updates ✅
- D) Decrypt the balance first, check in plaintext, then transfer

**Answer: C** -- `FHE.select()` provides uniform gas execution. Both paths are computed and the result is selected based on the encrypted condition, with no observable difference.

---

### Question 3

After computing `newBalance = FHE.add(_balances[user], amount)` and assigning it to `_balances[user]`, what ACL calls are required?

- A) None -- ACL is inherited from the operands
- B) Only `FHE.allowThis(newBalance)`
- C) Only `FHE.allow(newBalance, user)`
- D) Both `FHE.allowThis(newBalance)` and `FHE.allow(newBalance, user)` ✅

**Answer: D** -- Every FHE operation creates a new handle with an empty ACL. The contract needs `allowThis` to use it in future transactions, and the user needs `allow` to decrypt it.

---

### Question 4

What does `FHE.isInitialized(handle)` check?

- A) Whether the ciphertext has been decrypted
- B) Whether the handle refers to a valid, initialized ciphertext ✅
- C) Whether the ACL for the handle has been set
- D) Whether the handle has been made publicly decryptable

**Answer: B** -- `FHE.isInitialized()` checks that the handle points to a valid ciphertext. It should be called after `FHE.fromExternal()` and before using stored encrypted values.

---

### Question 5

A function performs FHE operations inside a loop with no cap on the iteration count. What vulnerability does this create?

- A) Integer overflow
- B) Reentrancy attack
- C) Denial of Service (DoS) via block gas limit exhaustion ✅
- D) Front-running attack

**Answer: C** -- Each FHE operation costs 50k-600k gas. Without a cap on loop iterations, an attacker can pass a large input array that causes the transaction to exceed the block gas limit.

---

### Question 6

What is the "LastError" pattern in FHE contracts?

- A) A require statement that reverts with an encrypted error message
- B) An encrypted error code stored per user, decryptable only by that user, set via FHE.select() instead of reverting ✅
- C) A public mapping of error strings
- D) An event that emits the decrypted error reason

**Answer: B** -- The LastError pattern stores an encrypted error code (euint8) per user. The code is set using `FHE.select()` so the transaction always succeeds, and only the user can decrypt their error code.

---

### Question 7

Why is `require(encryptedCondition, "error")` dangerous in FHE contracts, even if you could decrypt the condition?

- A) It wastes gas
- B) The revert vs. success outcome reveals whether the encrypted condition was true or false ✅
- C) `require` does not work with FHE types
- D) It breaks the ACL system

**Answer: B** -- Transaction revert/success is publicly visible. If the revert depends on an encrypted condition, observers learn the condition's value. Use the select + LastError pattern instead.

---

### Question 8

When is it safe to use `FHE.makePubliclyDecryptable(handle)`?

- A) On any encrypted value the owner wants to see
- B) On individual user balances for transparency
- C) Only on aggregate or non-sensitive values meant to become public (e.g., vote tallies, auction results) ✅
- D) Whenever the user requests it

**Answer: C** -- `makePubliclyDecryptable` is irreversible and makes the value visible to everyone. It should only be used for aggregate results (total votes, auction winner) or values explicitly designed to be public. Never on individual user data.

---

### Question 9

Which of the following is a valid rate-limiting pattern for expensive FHE operations?

- A) `require(gasleft() > 1000000, "Not enough gas");`
- B) Track the last operation block per user and enforce a cooldown period before the next operation ✅
- C) Limit the contract to one transaction per block
- D) Use `FHE.select()` to skip expensive operations

**Answer: B** -- Tracking `_lastOpBlock[msg.sender]` and requiring `block.number >= _lastOpBlock[msg.sender] + cooldownBlocks` is the standard rate-limiting pattern for FHE contracts.

---

### Question 10

You are auditing an FHE contract and find this code:

```solidity
function getBalance(address user) public view returns (euint64) {
    return _balances[user];
}
```

What security issue does this have?

- A) No issue -- the value is encrypted so it is safe to return
- B) It should use `FHE.isSenderAllowed(_balances[user])` to verify the caller has ACL access before returning the handle ✅
- C) It should decrypt the balance before returning
- D) The function should be `external` instead of `public`

**Answer: B** -- Even though the value is encrypted, returning the handle to unauthorized callers is poor practice. The function should check `FHE.isSenderAllowed()` to ensure only authorized addresses can obtain the handle. While the handle alone does not reveal the plaintext, defense-in-depth requires ACL checks on handle access.

---

## Scoring

| Score | Rating |
|-------|--------|
| 10/10 | Excellent -- You have mastered FHE security patterns! |
| 8-9/10 | Good -- Review the items you missed. |
| 5-7/10 | Fair -- Re-read the lesson sections related to your missed questions. |
| 0-4/10 | Needs work -- Go through the full lesson and exercise before proceeding. |
