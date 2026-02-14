# Module 16: Exercise -- Security Audit Challenge

## Objective

You are given a deliberately vulnerable FHE contract (`exercises/16-security-exercise.sol`). Your task is to identify **all** security vulnerabilities and produce a fixed version (`solutions/16-security-solution.sol`).

This exercise simulates a real-world security audit of an FHE smart contract.

---

## The Contract Under Audit

Open `exercises/16-security-exercise.sol`. This is a simplified "Encrypted Vault" contract that allows users to deposit, withdraw, and transfer encrypted token balances. It contains **7 distinct FHE-specific vulnerabilities**.

---

## Instructions

### Step 1: Read the Contract

Read through the entire contract carefully. For each function, ask yourself:

1. Is the ACL correctly set after every FHE state update?
2. Are encrypted inputs validated?
3. Is there any branching on encrypted conditions?
4. Could this function be used for DoS?
5. Does error handling leak information about encrypted state?
6. Is access control properly enforced?
7. Is `makePubliclyDecryptable` used appropriately?

### Step 2: Document Each Vulnerability

For each vulnerability you find, write down:

- **Location:** Function name and line
- **Category:** Which of the 7 vulnerability types (gas leak, missing ACL, unvalidated input, DoS, error leak, privacy violation, missing access control)
- **Impact:** What an attacker could learn or do
- **Fix:** The specific code change needed

### Step 3: Write the Fixed Contract

Create your fixed version as `solutions/16-security-solution.sol` (a reference solution is provided for comparison). Your fixed contract should:

1. Compile without errors
2. Fix every vulnerability you identified
3. Maintain the same external interface (function signatures)
4. Add any missing patterns (LastError, rate limiting, etc.)

---

## Vulnerability Checklist

Use this checklist to verify you have found all 7 vulnerabilities:

- [ ] **Vulnerability 1:** Missing ACL permissions after encrypted state update
- [ ] **Vulnerability 2:** Gas side channel from branching on encrypted condition
- [ ] **Vulnerability 3:** Missing input validation (no `FHE.isInitialized()` check)
- [ ] **Vulnerability 4:** Unbounded loop with FHE operations (DoS vector)
- [ ] **Vulnerability 5:** Information leak via revert on encrypted condition
- [ ] **Vulnerability 6:** Improper use of `makePubliclyDecryptable` on user data
- [ ] **Vulnerability 7:** Missing access control on sensitive function

---

## Hints

<details>
<summary>Hint 1: Where to look for missing ACL</summary>

Check the `deposit()` function. After `FHE.add()`, is `FHE.allowThis()` called? Is `FHE.allow()` called for the user?
</details>

<details>
<summary>Hint 2: Where is the gas leak?</summary>

Look for any `if/else` statement that depends on an encrypted comparison result. The `withdraw()` function is a good place to start.
</details>

<details>
<summary>Hint 3: Where is the DoS vector?</summary>

Look for loops that iterate over user-supplied arrays with FHE operations inside. Is there a maximum size?
</details>

<details>
<summary>Hint 4: Which function leaks info via reverts?</summary>

Any function that calls `require()` on a condition derived from encrypted values. Look for patterns like "check encrypted balance, then revert if insufficient."
</details>

<details>
<summary>Hint 5: Which function exposes private data?</summary>

Search for `FHE.makePubliclyDecryptable()`. Is it being called on individual user data or aggregate data?
</details>

---

## Evaluation Criteria

| Criterion | Points |
|-----------|--------|
| All 7 vulnerabilities identified | 35 (5 each) |
| Correct fix for each vulnerability | 35 (5 each) |
| Fixed contract compiles | 10 |
| Fixed contract maintains same interface | 10 |
| Added LastError pattern for encrypted errors | 5 |
| Added rate limiting for DoS prevention | 5 |
| **Total** | **100** |

---

## Bonus Challenges

1. **Write tests** for your fixed contract that verify each fix works correctly. For example, test that a failed transfer sets the LastError code to `ERR_INSUFFICIENT_BALANCE` instead of reverting.

2. **Add overflow protection** to the deposit function using the `FHE.select()` pattern (check if `newBalance < oldBalance`).

3. **Implement commit-reveal** for the transfer function to mitigate front-running on the recipient address.

---

## Reference Files

- **Vulnerable contract:** `exercises/16-security-exercise.sol`
- **Reference solution:** `solutions/16-security-solution.sol`
- **Patterns reference:** `contracts/SecurityPatterns.sol`
- **Vulnerability examples:** `contracts/VulnerableDemo.sol`

---

## Success Criteria

- [ ] Identified all 7 FHE-specific vulnerabilities
- [ ] Produced a fixed contract that compiles
- [ ] Each fix addresses the root cause (not just a workaround)
- [ ] Fixed contract uses `FHE.select()` instead of branching
- [ ] Fixed contract has proper ACL on all encrypted state updates
- [ ] Fixed contract validates all encrypted inputs
- [ ] Fixed contract has bounded FHE loops
- [ ] Fixed contract uses LastError pattern instead of reverting on encrypted conditions
