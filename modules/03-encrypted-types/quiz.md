# Module 03: Quiz — Encrypted Types Deep Dive

Test your understanding of FHEVM encrypted types and storage patterns.

---

### Question 1

Which of the following is NOT a valid FHEVM encrypted type?

- A) `euint32`
- B) `eaddress`
- C) `eint32` ✅
- D) `ebool`

> FHEVM only supports **unsigned** encrypted integers. There is no signed `eint` type.

---

### Question 2

What is the maximum value that can be stored in an `euint4`?

- A) 4
- B) 8
- C) 15 ✅
- D) 16

> `euint4` is a 4-bit unsigned integer, so its range is 0 to 2^4 - 1 = 15.

---

### Question 3

How is an encrypted value actually stored on the EVM?

- A) As the raw ciphertext bytes
- B) As a `uint256` handle referencing a ciphertext in the FHE co-processor ✅
- C) As an encrypted hash in a Merkle tree
- D) As a regular `uint256` with an encryption flag

---

### Question 4

What happens when you use an uninitialized `euint32` variable in an operation?

- A) It is treated as encrypted zero
- B) The operation reverts ✅
- C) It returns a random encrypted value
- D) The compiler prevents it

> Uninitialized encrypted variables have handle `0`, which is invalid.

---

### Question 5

Which function correctly encrypts the address `0xAbC...123` on-chain?

- A) `FHE.encrypt(0xAbC...123)`
- B) `FHE.asEuint160(0xAbC...123)`
- C) `FHE.asEaddress(0xAbC...123)` ✅
- D) `eaddress(0xAbC...123)`

---

### Question 6

What is the gas cost implication of choosing `euint256` over `euint32`?

- A) Same cost — all encrypted types use one storage slot
- B) `euint256` operations are significantly more expensive ✅
- C) `euint256` is cheaper due to batch processing
- D) Gas cost depends only on the number of operations, not the type

> While both use one storage slot, **operations** on larger types cost more gas.

---

### Question 7

Which code correctly stores an encrypted mapping of user balances?

- A) `mapping(address => encrypted(uint32)) balances;`
- B) `mapping(address => euint32) private _balances;` ✅
- C) `mapping(eaddress => euint32) private _balances;`
- D) `FHE.mapping(address => uint32) private _balances;`

> Mapping keys must be plaintext types. Only the values can be encrypted.

---

### Question 8

Why is `FHE.asEuint32(42)` in a public function NOT truly private?

- A) Because 32-bit encryption is weak
- B) Because the plaintext `42` is visible in the transaction calldata ✅
- C) Because the EVM stores it unencrypted
- D) Because `asEuint32` does not actually encrypt

> `FHE.asEuint32()` takes a plaintext input that is part of the transaction data. For private inputs, use `externalEuint32` with `FHE.fromExternal()`.

---

### Question 9

Which encrypted bytes type would you use to store an encrypted 32-byte hash?

- A) `ebytes64`
- B) `ebytes128`
- C) `ebytes256` ✅
- D) `euint256`

> `ebytes256` can hold up to 32 bytes (256 bits) of encrypted data.

---

### Question 10

After updating `_balance` with `FHE.add()`, what must you do next?

- A) Call `FHE.save(_balance)`
- B) Call `FHE.commit()`
- C) Call `FHE.allowThis(_balance)` ✅
- D) Nothing — updates are automatic

> Every time an encrypted state variable is updated, you must re-grant access with `FHE.allowThis()`.

---

## Scoring

| Score | Rating |
|-------|--------|
| 10/10 | Excellent — You are ready for Module 04! |
| 7-9/10 | Good — Review the items you missed. |
| 4-6/10 | Fair — Re-read the lesson before proceeding. |
| 0-3/10 | Needs work — Go through the lesson and exercise again. |
