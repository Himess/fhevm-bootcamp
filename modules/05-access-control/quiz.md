# Module 05: Quiz — Access Control (ACL)

Test your understanding of the FHEVM Access Control List system.

---

### Question 1

What does `FHE.allowThis(handle)` do?

- A) Allows all addresses to access the ciphertext
- B) Grants the current contract permission to use the ciphertext ✅
- C) Makes the ciphertext publicly decryptable
- D) Transfers ownership of the ciphertext to the contract

---

### Question 2

When must you call `FHE.allowThis()` on a state variable?

- A) Only when the variable is first initialized
- B) Only when transferring to another contract
- C) After every operation that produces a new ciphertext (new handle) ✅
- D) Once per transaction, at the end

---

### Question 3

What is the difference between `FHE.allow()` and `FHE.allowTransient()`?

- A) `allow` is for contracts, `allowTransient` is for EOAs
- B) `allow` persists permanently, `allowTransient` expires after the transaction ✅
- C) `allow` is free, `allowTransient` costs extra gas
- D) There is no difference — they are aliases

---

### Question 4

What happens if you forget to call `FHE.allowThis()` after updating an encrypted state variable?

- A) Nothing — access is inherited from the previous handle
- B) The contract cannot use the variable in future transactions ✅
- C) The variable is automatically deleted
- D) The transaction reverts

---

### Question 5

How do you check if `msg.sender` has access to a ciphertext?

- A) `FHE.hasAccess(handle, msg.sender)`
- B) `FHE.isSenderAllowed(handle)` ✅
- C) `FHE.checkACL(handle)`
- D) `ACL.isAllowed(handle, msg.sender)`

---

### Question 6

In an encrypted token transfer, who should receive ACL access to the receiver's updated balance?

- A) Only the receiver
- B) Only the contract
- C) Both the contract (`allowThis`) and the receiver (`allow`) ✅
- D) The sender, receiver, and contract

---

### Question 7

When should you use `FHE.allowTransient()` instead of `FHE.allow()`?

- A) When the access is needed only within the current transaction ✅
- B) When the ciphertext is small
- C) When the address is an EOA
- D) When you want to save the ciphertext to storage

---

### Question 8

Does the ACL from handle_A automatically transfer to handle_B when you compute `handle_B = FHE.add(handle_A, ...)`?

- A) Yes, all ACL entries are inherited
- B) Only the contract's access is inherited
- C) No, handle_B starts with an empty ACL ✅
- D) Only transient entries are inherited

---

### Question 9

How do you revoke access to a ciphertext from a previously authorized address?

- A) Call `FHE.revoke(handle, address)`
- B) Call `FHE.deny(handle, address)`
- C) Create a new ciphertext (new handle) and only grant access to still-authorized addresses ✅
- D) Set the handle to zero

> There is no direct revocation mechanism. You must rotate the data.

---

### Question 10

In a multi-contract architecture, Contract A wants to pass an encrypted value to Contract B within a single transaction. What is the most gas-efficient approach?

- A) `FHE.allow(handle, contractB)` — persistent access
- B) `FHE.allowTransient(handle, contractB)` — transaction-scoped access ✅
- C) `FHE.allowThis(handle)` from Contract A, then Contract B reads it
- D) Decrypt the value and send the plaintext

---

### Question 11

What does `FHE.makePubliclyDecryptable(handle)` do?

- A) Decrypts the value on-chain and stores it as plaintext
- B) Makes the ciphertext decryptable by any address ✅
- C) Removes all existing ACL permissions
- D) Transfers ownership of the handle

> `FHE.makePubliclyDecryptable(handle)` adds universal read access to the ciphertext. Any address can then decrypt it. The encrypted handle still exists — the value is not stored as plaintext on-chain.

---

### Question 12

After computing `c = FHE.add(a, b)`, who has ACL access to `c`?

- A) Everyone who had access to `a` and `b`
- B) Only the contract (automatically)
- C) Nobody — ACL must be explicitly set for the new handle ✅
- D) The transaction sender automatically gets access

> Every FHE operation creates a NEW ciphertext handle. The new handle has NO ACL permissions by default. You must explicitly call `FHE.allowThis(c)` and `FHE.allow(c, address)` after every operation.

---

### Question 13

What is the purpose of `FHE.allowTransient(handle, address)`?

- A) Grants permanent access that expires after 24 hours
- B) Grants access only within the current transaction ✅
- C) Grants read-only access (cannot use in computations)
- D) Grants access to all handles owned by the contract

> `FHE.allowTransient` grants temporary access valid only within the current transaction. This is essential for inter-contract calls where Contract A passes an encrypted handle to Contract B for processing within a single transaction.

---

## Scoring

| Score | Rating |
|-------|--------|
| 13/13 | Excellent — You are ready for Module 06! |
| 10-12/13 | Good — Review the items you missed. |
| 6-9/13 | Fair — Re-read the lesson before proceeding. |
| 0-5/13 | Needs work — Go through the lesson and exercise again. |
