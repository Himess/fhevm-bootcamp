# Module 09: Quiz — On-Chain Encrypted Randomness

Test your understanding of FHE-based random number generation in FHEVM.

---

### Question 1

What is the key advantage of FHE-based randomness over traditional on-chain randomness (e.g., `block.prevrandao`)?

- A) It is faster to compute
- B) It costs less gas
- C) The random values are encrypted, so nobody can see or manipulate them ✅
- D) It uses less storage on-chain

> Traditional on-chain randomness like `block.prevrandao` is visible to all participants including block producers and MEV bots. FHE randomness generates values that are encrypted from the moment of creation, preventing any party from seeing or front-running the result.

---

### Question 2

Which function correctly generates an encrypted random `uint32` in FHEVM?

- A) `FHE.random(32)`
- B) `FHE.randEuint32()` ✅
- C) `FHE.randomEuint32()`
- D) `FHE.rand(uint32)`

> The correct naming convention is `FHE.randEuintX()` where X is the bit width. Common mistake: `FHE.randomEuint32()` does NOT exist. The function name uses `rand`, not `random`.

---

### Question 3

How do you generate an encrypted random number in the range `[0, 100)`?

- A) `FHE.randEuint32(100)`
- B) `FHE.rem(FHE.randEuint32(), 100)` ✅
- C) `FHE.randRange(0, 100)`
- D) `FHE.randEuint32() % 100`

> FHEVM does not have a built-in range function. You generate a full-range random value and then use `FHE.rem()` (encrypted modulo) to constrain it. The Solidity `%` operator cannot be used because the value is encrypted and not accessible as a plaintext integer. Note: `FHE.randEuint32()` also has an overload `FHE.randEuint32(upperBound)` that supports power-of-2 upper bounds, but for arbitrary bounds like 100, `FHE.rem()` is the standard approach.

---

### Question 4

After generating a random encrypted value, what must you do before storing or using it?

- A) Nothing, it is automatically available to everyone
- B) Set ACL permissions with `FHE.allowThis()` and/or `FHE.allow()` ✅
- C) Call a decrypt function to validate it
- D) Send a separate transaction to finalize the randomness

> Like all encrypted values in FHEVM, freshly generated random values need ACL permissions. Use `FHE.allowThis(value)` so the contract itself can operate on the value in future transactions, and `FHE.allow(value, address)` to grant a specific user decryption rights.

---

### Question 5

Can the contract owner see the generated random value?

- A) Yes, the owner always has access to all encrypted values
- B) No, the value is encrypted and requires explicit ACL permission like any other user ✅
- C) Yes, through a special admin override function in the FHE library
- D) Only if the contract is deployed as an upgradeable proxy

> FHEVM does not grant any special privileges to contract owners or deployers. The random value is encrypted from the moment it is created, and only addresses that have been explicitly granted ACL access via `FHE.allow()` can request decryption. This is a fundamental privacy guarantee of the system.

---

### Question 6

How does the gas cost of encrypted random generation compare to other FHE operations?

- A) It is free because randomness is provided by the network layer
- B) It costs the same as a simple `FHE.add()` operation
- C) It is relatively expensive because it involves FHE computation on the coprocessor ✅
- D) It costs less gas than any arithmetic FHE operation

> All FHE operations, including random number generation, involve computation on the FHE coprocessor and are significantly more expensive than standard EVM operations. Random generation plus any subsequent operations (like `FHE.rem()` for range bounding) each add to the total gas cost. Developers should avoid generating random values unnecessarily.

---

### Question 7

What does `FHE.randEbool()` return?

- A) A plaintext Solidity `bool` that is either `true` or `false`
- B) An encrypted boolean (`ebool`) with an encrypted random true/false value ✅
- C) A `uint8` value of 0 or 1
- D) An encrypted `euint8` value of 0 or 1

> `FHE.randEbool()` directly returns an `ebool` type containing an encrypted random boolean. This is useful for coin flips and binary decisions. An alternative approach is to use `FHE.randEuint8()` with `FHE.rem(..., 2)` and then convert to `ebool`, but `FHE.randEbool()` is more direct and efficient.

---

### Question 8

Why is `block.prevrandao` NOT secure for high-stakes applications like lotteries?

- A) It only produces 8-bit values which are too small
- B) Block proposers can influence or predict the value, and it is publicly visible before use ✅
- C) It is deprecated and no longer available after the Ethereum merge
- D) It requires an external oracle to function properly

> `block.prevrandao` (formerly `block.difficulty`) is determined by the beacon chain and the block proposer has some degree of influence over it. More critically, the value is publicly visible in the block, so any on-chain logic that uses it can be front-run by MEV bots. FHE randomness solves both problems: the value is encrypted so it cannot be seen, and it is generated by the FHE coprocessor so block proposers cannot influence it.

---

### Question 9

When using `FHE.rem(FHE.randEuint32(), max)` for range-bounded randomness, what is "modulo bias"?

- A) The FHE operation always returns zero
- B) Values near the lower end of the range are slightly more probable when `max` does not evenly divide the type's full range ✅
- C) The random number generator produces negative numbers
- D) The modulo operation leaks the plaintext value

> For a `euint32` (range 0 to 2^32-1), if `max` does not evenly divide 2^32, some remainders will be slightly more likely than others. For example, with `max = 3`, values 0 and 1 each have one extra possible mapping compared to value 2. In practice, for a 32-bit source with a small `max` value, this bias is negligible (less than 1 in a billion), but developers should be aware of it for applications requiring perfect uniformity.

---

### Question 10

What is the best practice for selecting a random winner in an encrypted lottery contract with `N` participants?

- A) Use `block.prevrandao % N` to pick a winner index
- B) Generate a `FHE.randEuint32()`, use `FHE.rem()` with `N` to get an encrypted index, and keep the winner encrypted until the reveal phase ✅
- C) Have each participant submit a random number and XOR them together
- D) Use an off-chain random oracle and submit the result on-chain

> This approach ensures that (1) the random value cannot be predicted or manipulated since it is generated encrypted by the FHE coprocessor, (2) the winner remains hidden until explicitly revealed via the decryption gateway, preventing any front-running, and (3) the selection is verifiably on-chain. The encrypted index can later be decrypted through the FHEVM gateway when the contract logic decides it is time to reveal the winner.

---

## Scoring

| Score | Rating |
|-------|--------|
| 10/10 | Excellent -- You have mastered encrypted randomness! |
| 7-9/10 | Good -- Review the items you missed before moving on. |
| 4-6/10 | Fair -- Re-read the lesson and try the exercises again. |
| 0-3/10 | Needs work -- Go through the lesson carefully before retaking. |
