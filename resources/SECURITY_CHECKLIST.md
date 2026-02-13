# FHEVM Security Checklist

A structured security review checklist for FHE smart contracts. Use this during development, code review, and security audits to ensure your encrypted contracts do not leak information or contain vulnerabilities.

---

## How to Use This Checklist

1. Go through each section during development (shift-left security).
2. Run through the complete checklist before deployment.
3. During audits, check every item and document findings.
4. Mark each item: PASS / FAIL / N/A with notes.

---

## 1. Access Control (ACL)

### 1.1 Contract Self-Permission

- [ ] **Every stored encrypted value has `FHE.allowThis()` called after assignment.**
  Every FHE operation produces a new ciphertext with an empty ACL. If the contract stores it without `FHE.allowThis()`, the contract cannot read its own value in subsequent transactions.

- [ ] **`FHE.allowThis()` is called after every operation that modifies a stored encrypted value (add, sub, select, etc.).**
  It is not enough to call `allowThis` only on initial assignment. Every reassignment creates a new ciphertext.

### 1.2 User Permissions

- [ ] **Users are granted `FHE.allow()` for encrypted values they should be able to view (re-encrypt).**
  Without explicit permission, users cannot decrypt or re-encrypt their own data (e.g., their token balance).

- [ ] **Permissions are not granted to addresses that should not have access.**
  Audit every `FHE.allow()` call. Ask: "Should this address be able to see this value?"

- [ ] **Permissions are updated after every state change, not just initial assignment.**
  After a transfer, both the sender and recipient need fresh permissions on their updated balances.

### 1.3 Cross-Contract Permissions

- [ ] **When returning encrypted values to another contract, `FHE.allowTransient()` is used for the caller.**
  Without this, the calling contract will fail to use the returned ciphertext.

- [ ] **`FHE.allowTransient()` is preferred over `FHE.allow()` for cross-contract calls.**
  Transient permissions expire at the end of the transaction, limiting the exposure window.

### 1.4 Permission Minimization

- [ ] **No unnecessary permissions are granted.**
  Each `FHE.allow()` call should have a clear justification.

- [ ] **Admin/owner addresses do not have blanket access to all encrypted values unless explicitly required.**

---

## 2. Information Leakage

### 2.1 Revert Leakage

- [ ] **The contract does NOT revert based on encrypted conditions.**
  Example: `require(balance >= amount)` on encrypted values leaks whether the condition is true. Use `FHE.select()` for conditional logic instead.

- [ ] **All business logic involving encrypted data uses the "silent fail" pattern (compute both branches, select the result).**

- [ ] **`require()` and `revert()` are only used for non-encrypted conditions (e.g., `msg.sender == owner`, deadline checks).**

### 2.2 Event Leakage

- [ ] **Events do not emit encrypted values in plaintext.**
  Emitting `uint256 amount` in a Transfer event defeats the purpose of encrypting balances.

- [ ] **Events are carefully designed to not leak metadata that could be correlated with encrypted values.**
  Example: If you emit `Transfer(from, to)` every time, the transfer graph is still visible even without amounts.

- [ ] **Consider whether even the existence of an event leaks information.**
  In some protocols, knowing that a transfer happened (regardless of amount) is itself sensitive.

### 2.3 Storage Pattern Leakage

- [ ] **Storage access patterns do not reveal information about encrypted values.**
  If different encrypted values cause different storage slots to be written, an observer can infer information.

- [ ] **All execution paths write to the same storage slots regardless of encrypted values.**
  The `FHE.select()` pattern ensures this: both branches write to the same variable.

### 2.4 Gas Leakage

- [ ] **All code paths consume approximately the same gas regardless of encrypted input values.**
  Different gas consumption reveals information about the encrypted values (side-channel attack).

- [ ] **There are no early returns or short-circuit evaluations based on encrypted conditions.**

- [ ] **Loop iterations do not depend on encrypted values.**
  If a loop runs a variable number of times based on an encrypted value, the gas usage reveals the value.

### 2.5 Timing Leakage

- [ ] **Transaction timing patterns do not reveal encrypted information.**
  Consider: do users submit transactions only when certain encrypted conditions are met? This timing pattern may leak information.

### 2.6 Return Value Leakage

- [ ] **Functions do not return different plaintext values based on encrypted conditions.**
  Example: returning `true` for success and `false` for failure on an encrypted transfer leaks whether the sender had sufficient balance.

- [ ] **View functions that return encrypted values return the handle after ACL check; the client uses `instance.userDecrypt()` for user-specific re-encryption.**

---

## 3. Input Handling

### 3.1 Input Conversion

- [ ] **All external encrypted inputs use `externalEuintXX` types (not `euintXX`).**
  External functions cannot accept `euint32` directly from user transactions.

- [ ] **All external inputs are converted with `FHE.fromExternal()` before use.**

- [ ] **Converted inputs have `FHE.allowThis()` called if they will be stored.**

### 3.2 Input Validation

- [ ] **Encrypted inputs are validated where possible using encrypted comparisons.**
  Example: Use `FHE.le(amount, maxAllowed)` to ensure an encrypted amount is within range, then use `FHE.select` to enforce it.

- [ ] **The contract handles the case where a user submits a maliciously large encrypted value.**
  Without range validation, a user could submit an encrypted `euint64` with value close to `2^64`, causing unexpected behavior.

### 3.3 Input Replay

- [ ] **The contract is not vulnerable to input replay attacks (submitting the same encrypted input multiple times).**
  Consider nonces or other mechanisms to prevent replay.

---

## 4. Decryption Safety

### 4.1 Decryption Pattern

- [ ] **Decryption uses `FHE.makePubliclyDecryptable()` only for values that should be public.**
  Only call `makePubliclyDecryptable` when the value genuinely needs to be revealed on-chain. For user-specific reads, return the encrypted handle after ACL check and let the client use `instance.userDecrypt()` instead.

- [ ] **Decrypted values are not stored in public storage variables.**
  Storing `uint256 public revealedValue` permanently exposes the decrypted data.

- [ ] **The contract enforces access control before calling `FHE.makePubliclyDecryptable()`.**
  Without proper checks, unauthorized callers could trigger decryption of sensitive values.

### 4.2 Decryption Timing

- [ ] **Decryption does not happen prematurely (e.g., revealing vote tallies before voting ends).**

- [ ] **The contract enforces timing constraints on when decryption can be requested.**

### 4.3 Decryption Scope

- [ ] **Only the minimum necessary data is decrypted.**
  Ask for each decryption: "Does this NEED to be revealed? Can we keep it encrypted?"

- [ ] **Partial information is preferred over full information when possible.**
  Example: Reveal "auction winner" but not "winning bid amount" if the amount is not needed.

### 4.4 Re-encryption

- [ ] **User-facing reads return the encrypted handle after ACL check; the client uses `instance.userDecrypt()` for re-encryption instead of on-chain decryption.**
  Re-encryption keeps the value encrypted on-chain and only reveals it to the specific user via the client-side SDK.

- [ ] **Permission checks (ACL) are performed before returning encrypted handles to ensure the caller is authorized.**

---

## 5. Arithmetic Safety

### 5.1 Overflow/Underflow

- [ ] **The contract accounts for silent wrapping on overflow.**
  `FHE.add` on `euint8` with values 200 + 100 silently wraps to 44. There is no revert.

- [ ] **Subtraction underflow is handled with the `FHE.select` pattern.**
  Always check `FHE.ge(a, b)` before `FHE.sub(a, b)` if underflow is not desired.

- [ ] **Multiplication overflow is considered, especially for large type widths.**
  `FHE.mul` on two `euint32` values can exceed `euint32` range.

### 5.2 Division

- [ ] **Division by zero is handled.**
  The behavior of `FHE.div(a, 0)` on encrypted zero may vary. Validate or use `FHE.select` to handle.

- [ ] **Integer division truncation is understood and acceptable for the use case.**
  `FHE.div(7, 2)` returns 3, not 3.5. Ensure this precision loss is acceptable.

### 5.3 Type Ranges

- [ ] **Encrypted values do not exceed the range of their type.**
  A `euint8` balance will wrap at 256. If balances can legitimately reach 256+, use a larger type.

- [ ] **Type downcasts do not silently truncate important data.**
  Casting `euint32` to `euint8` truncates the upper bits without warning.

---

## 6. State Management

### 6.1 Initialization

- [ ] **Encrypted state variables are properly initialized before use.**
  Using an uninitialized `euint64` in operations may cause failures. Initialize with `FHE.asEuint64(0)`.

- [ ] **There is a mechanism to initialize new user balances/entries.**
  The first time a user interacts with the contract, their encrypted state must be initialized.

### 6.2 Consistency

- [ ] **State updates are atomic: either all related encrypted values update or none do.**
  In a transfer, both sender and recipient balances must update together within the `FHE.select` pattern.

- [ ] **The "compute both branches, select one" pattern ensures state consistency.**

### 6.3 Reentrancy

- [ ] **Standard reentrancy protections are in place.**
  FHE does not change reentrancy risks. Use the checks-effects-interactions pattern or reentrancy guards.

- [ ] **Encrypted state is updated before external calls.**

---

## 7. Protocol-Level Security

### 7.1 Trust Assumptions

- [ ] **Trust assumptions about the decryption mechanism are documented.**
  Understand who can trigger `FHE.makePubliclyDecryptable()` and under what conditions. What happens if decryption is triggered prematurely?

- [ ] **Trust assumptions about the coprocessor are documented.**
  The coprocessor processes encrypted data but should not be able to decrypt it. Verify this assumption.

- [ ] **The threat model is documented: what does the contract protect against, and what is out of scope?**

### 7.2 Upgradeability

- [ ] **If the contract is upgradeable, encrypted state migration is handled correctly.**
  Upgrading a contract that stores encrypted values requires careful ACL management for the new implementation.

- [ ] **Admin keys cannot be used to bypass encryption or access encrypted values.**

### 7.3 Denial of Service

- [ ] **The contract cannot be griefed by submitting expensive FHE operations.**
  If a function performs many FHE operations based on user input count, an attacker could submit transactions that exceed the block gas limit.

- [ ] **Gas limits are reasonable for all functions.**

### 7.4 Front-Running

- [ ] **The contract considers front-running risks on encrypted transactions.**
  Even with encrypted values, the transaction metadata (sender, function selector, timing) is visible. Consider commit-reveal patterns where needed.

- [ ] **Critical operations (auctions, voting) have appropriate timing controls (commit periods, deadlines).**

---

## 8. Code Quality

### 8.1 API Usage

- [ ] **The contract uses the new FHEVM API (`FHE` library, `externalEuintXX`, `FHE.fromExternal()`).**

- [ ] **The contract inherits `ZamaEthereumConfig` for proper configuration.**

- [ ] **All imports are from `@fhevm/solidity/lib/FHE.sol` and `@fhevm/solidity/config/ZamaConfig.sol`.**

### 8.2 Testing

- [ ] **A comprehensive test suite exists covering happy paths, edge cases, failure modes, and ACL scenarios.**

- [ ] **Tests verify that failed encrypted operations (e.g., transfer with insufficient balance) produce the correct "unchanged" state.**

- [ ] **Tests verify ACL permissions: authorized users can access, unauthorized users cannot.**

- [ ] **Gas consumption is measured and within acceptable bounds.**

### 8.3 Documentation

- [ ] **NatSpec comments describe all public/external functions.**

- [ ] **The encrypted data model is documented: what is encrypted, what is plaintext, and why.**

- [ ] **The security model is documented: threat model, trust assumptions, known limitations.**

---

## Audit Report Template

When completing a security review, document findings using this structure:

```markdown
## Finding [ID]: [Title]

**Severity:** Critical / High / Medium / Low / Informational
**Category:** [ACL | Leakage | Arithmetic | Input | Decryption | State | Protocol]
**Location:** [contract.sol:line]

### Description
[What is the issue?]

### Impact
[What can go wrong? Who is affected?]

### Proof of Concept
[Steps to reproduce or exploit]

### Recommendation
[How to fix it]

### Status
[Open | Acknowledged | Fixed | Won't Fix]
```

---

## Summary: Top 10 Security Rules

1. **Call `FHE.allowThis()` after every encrypted state update.** Missing ACL is the #1 bug.
2. **Never revert based on encrypted conditions.** Use `FHE.select()` for the silent fail pattern.
3. **Never emit encrypted data in plaintext events.** Design events carefully.
4. **Ensure all code paths consume the same gas.** Gas differences are a side channel.
5. **Use `externalEuintXX` for inputs, `FHE.fromExternal()` for conversion.** Do not accept `euintXX` directly.
6. **ACL access is verified with `FHE.isSenderAllowed()` before returning encrypted values.** Only decrypt with `FHE.makePubliclyDecryptable()` when truly necessary.
7. **Use the smallest encrypted type that fits.** Save gas, reduce attack surface.
8. **Handle overflow/underflow explicitly.** FHE wraps silently.
9. **Document your threat model.** What is protected? What is not? What are the trust assumptions?
10. **Test extensively.** Happy path, edge cases, ACL, failure modes, gas measurement.
