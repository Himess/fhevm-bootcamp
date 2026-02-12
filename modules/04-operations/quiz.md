# Module 04: Quiz — Operations on Encrypted Data

Test your knowledge of arithmetic, bitwise, and comparison operations on encrypted values.

---

### Question 1

What does `FHE.add(a, b)` return when both `a` and `b` are `euint32`?

- A) A `uint32` plaintext sum
- B) An `euint32` encrypted sum ✅
- C) An `euint64` to prevent overflow
- D) A `bool` indicating success

---

### Question 2

Which of the following is NOT a valid operation?

- A) `FHE.div(encryptedValue, 5)`
- B) `FHE.div(encryptedA, encryptedB)` ✅
- C) `FHE.mul(encryptedA, encryptedB)`
- D) `FHE.add(encryptedValue, 10)`

> Division and remainder only support a plaintext second operand.

---

### Question 3

What happens when you compute `FHE.sub(FHE.asEuint8(5), FHE.asEuint8(10))`?

- A) The transaction reverts with an underflow error
- B) The result is encrypted 0
- C) The result wraps to encrypted 251 (256 - 5) ✅
- D) The result is encrypted -5

> FHEVM uses wrapping arithmetic with no revert on underflow.

---

### Question 4

What type does `FHE.gt(euint32_a, euint32_b)` return?

- A) `bool`
- B) `ebool` ✅
- C) `euint32`
- D) `uint8`

> All comparison operations return `ebool` (encrypted boolean).

---

### Question 5

Which operation is the most gas-efficient?

- A) `FHE.mul(a, b)`
- B) `FHE.not(a)` ✅
- C) `FHE.div(a, 2)`
- D) `FHE.gt(a, b)`

> `FHE.not()` is the cheapest operation as it works on a single operand with simple bitwise logic.

---

### Question 6

How do you clamp an encrypted value between 10 and 100?

- A) `FHE.clamp(value, 10, 100)`
- B) `FHE.max(FHE.min(value, FHE.asEuint32(100)), FHE.asEuint32(10))` ✅
- C) `FHE.bound(value, 10, 100)`
- D) `FHE.select(value, 10, 100)`

> Use `FHE.min()` to cap the upper bound and `FHE.max()` to enforce the lower bound.

---

### Question 7

Can you add an `euint32` and an `euint64` directly?

- A) Yes, the result is `euint64` ✅
- B) Yes, the result is `euint32`
- C) No, both operands must be the same type
- D) Yes, but you must specify the result type

> fhEVM supports cross-type arithmetic. When operands have different types, the result is automatically upcast to the larger type. `FHE.add(euint32, euint64)` returns `euint64`.

---

### Question 8

What happens when you perform `FHE.sub(FHE.asEuint8(3), FHE.asEuint8(5))` (subtracting 5 from 3)?

- A) It reverts with an underflow error
- B) It returns encrypted 0
- C) It wraps around to encrypted 254 (modular arithmetic) ✅
- D) It returns a negative encrypted value

> FHE arithmetic uses modular (wrapping) behavior, similar to unchecked Solidity math. Since euint8 is unsigned 8-bit, 3 - 5 wraps to 256 - 2 = 254. There are no negative values in encrypted unsigned integers, and the operation never reverts.

---

### Question 9

Which pattern provides safe subtraction (no underflow)?

- A) `FHE.safeSub(a, b)`
- B) Check `FHE.ge(a, b)` then use `FHE.select()` to choose between `FHE.sub(a, b)` and zero ✅
- C) Wrap `FHE.sub(a, b)` in a try/catch
- D) Use `FHE.sub(FHE.max(a, b), b)`

> There is no built-in `safeSub`. You must use `FHE.ge()` + `FHE.select()` for the pattern.

---

### Question 10

What does `FHE.rem(FHE.asEuint32(17), 5)` compute?

- A) Encrypted 3
- B) Encrypted 2 ✅
- C) Encrypted 5
- D) It reverts because 17 is not divisible by 5

> 17 % 5 = 2. Remainder operation with a plaintext divisor.

---

## Scoring

| Score | Rating |
|-------|--------|
| 10/10 | Excellent — You are ready for Module 05! |
| 7-9/10 | Good — Review the items you missed. |
| 4-6/10 | Fair — Re-read the lesson before proceeding. |
| 0-3/10 | Needs work — Go through the lesson and exercise again. |
