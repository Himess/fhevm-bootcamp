# Module 08: Quiz — Conditional Logic

Test your understanding of `FHE.select()` and branch-free programming.

---

### Question 1

Why can you NOT use `if (ebool)` in FHEVM contracts?

- A) `ebool` is too large for the EVM
- B) The EVM requires a plaintext `bool` for branching; `ebool` is encrypted and unreadable ✅
- C) `if` statements are disabled in FHEVM
- D) You need to use `switch` instead

---

### Question 2

What does `FHE.select(cond, a, b)` return?

- A) Always `a`
- B) Always `b`
- C) `a` if `cond` is encrypted true, `b` if `cond` is encrypted false ✅
- D) The decrypted value of `cond`

---

### Question 3

When `FHE.select(cond, branchA, branchB)` executes, which branches are computed?

- A) Only the branch matching the condition
- B) Both branches are always computed ✅
- C) Neither — the result is pre-computed
- D) It depends on the type of `cond`

---

### Question 4

What is the gas cost implication of `FHE.select()`?

- A) Gas cost equals the cheaper branch
- B) Gas cost equals the more expensive branch
- C) Gas cost is the sum of both branches plus the select operation ✅
- D) Gas cost is fixed regardless of branches

---

### Question 5

Which code correctly implements `max(a, b)` using `FHE.select()`?

- A) `FHE.select(FHE.gt(a, b), b, a)`
- B) `FHE.select(FHE.gt(a, b), a, b)` ✅
- C) `FHE.select(FHE.eq(a, b), a, b)`
- D) `FHE.select(a, FHE.gt(a, b), b)`

---

### Question 6

How do you combine two encrypted conditions (both must be true)?

- A) `condA && condB`
- B) `FHE.and(condA, condB)` ✅
- C) `FHE.select(condA, condB, condA)`
- D) `condA + condB`

---

### Question 7

What happens if the two value parameters in `FHE.select()` have different types?

- A) The larger type is used
- B) The smaller type is used
- C) It results in a compilation error ✅
- D) Automatic type conversion occurs

---

### Question 8

Which pattern correctly clamps a value between 10 and 100?

- A) `FHE.select(FHE.gt(val, 100), 100, FHE.select(FHE.lt(val, 10), 10, val))`
- B) `FHE.min(FHE.max(val, FHE.asEuint32(10)), FHE.asEuint32(100))` ✅
- C) `FHE.clamp(val, 10, 100)`
- D) `FHE.bound(val, 10, 100)`

---

### Question 9

In a nested select chain for tiered pricing, which select should be evaluated LAST (outermost)?

- A) The default (lowest tier) case
- B) The highest priority tier (e.g., the best discount) ✅
- C) The middle tier
- D) The order does not matter

> Higher-priority conditions should be checked last so they can override lower-priority selections.

---

### Question 10

What is the encrypted equivalent of `if (a >= b) { a -= b; } else { a = 0; }`?

- A) `a = FHE.sub(a, b);`
- B) `a = FHE.select(FHE.ge(a, b), FHE.sub(a, b), FHE.asEuint32(0));` ✅
- C) `a = FHE.min(a, b);`
- D) `a = FHE.select(FHE.lt(a, b), FHE.sub(a, b), FHE.asEuint32(0));`

---

## Scoring

| Score | Rating |
|-------|--------|
| 10/10 | Excellent — You are ready for Module 09! |
| 7-9/10 | Good — Review the items you missed. |
| 4-6/10 | Fair — Re-read the lesson before proceeding. |
| 0-3/10 | Needs work — Go through the lesson and exercise again. |
