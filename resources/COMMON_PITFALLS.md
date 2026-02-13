# FHEVM Common Pitfalls

A guide to the most frequent mistakes when developing with fhEVM, along with explanations and correct solutions. All examples use the **new FHEVM API** (`FHE` library).

---

## Pitfall 1: Using the Old API (TFHE instead of FHE)

### Wrong

```solidity
import "fhevm/lib/TFHE.sol";

contract OldAPI {
    euint32 private value;

    function setValue(einput encryptedInput, bytes calldata proof) external {
        value = TFHE.asEuint32(encryptedInput, proof);
        TFHE.allow(value, address(this));
    }
}
```

### Why It Is Wrong

The `TFHE` library, `einput` type, and `TFHE.asEuint32(einput, proof)` pattern are from the old API. The new API uses the `FHE` library, `externalEuint32` type, and `FHE.fromExternal()`.

### Correct

```solidity
import { FHE, euint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract NewAPI is ZamaEthereumConfig {
    euint32 private value;

    function setValue(externalEuint32 encryptedInput, bytes calldata proof) external {
        value = FHE.fromExternal(encryptedInput, proof);
        FHE.allowThis(value);
    }
}
```

---

## Pitfall 2: Forgetting FHE.allowThis() After Storing a Value

### Wrong

```solidity
function deposit(externalEuint64 encAmount, bytes calldata proof) external {
    euint64 amount = FHE.fromExternal(encAmount, proof);
    balances[msg.sender] = FHE.add(balances[msg.sender], amount);
    // Missing: FHE.allowThis(balances[msg.sender]);
}
```

### Why It Is Wrong

Every FHE operation produces a **new** ciphertext. The new ciphertext has an empty ACL. If the contract does not call `FHE.allowThis()`, it cannot read its own stored value in the next transaction. The next call to `balances[msg.sender]` will fail with "Unauthorized access to ciphertext."

### Correct

```solidity
function deposit(externalEuint64 encAmount, bytes calldata proof) external {
    euint64 amount = FHE.fromExternal(encAmount, proof);
    balances[msg.sender] = FHE.add(balances[msg.sender], amount);
    FHE.allowThis(balances[msg.sender]);
    FHE.allow(balances[msg.sender], msg.sender);
}
```

---

## Pitfall 3: Branching on Encrypted Values with if/else

### Wrong

```solidity
function transfer(address to, externalEuint64 encAmount, bytes calldata proof) external {
    euint64 amount = FHE.fromExternal(encAmount, proof);

    // WRONG: Cannot use encrypted value in an if statement
    if (FHE.ge(balances[msg.sender], amount)) {
        balances[msg.sender] = FHE.sub(balances[msg.sender], amount);
        balances[to] = FHE.add(balances[to], amount);
    }
}
```

### Why It Is Wrong

`FHE.ge()` returns an `ebool` (encrypted boolean), not a Solidity `bool`. You cannot use an encrypted boolean in an `if` statement because its value is not known at execution time --- it is a ciphertext. This will cause a compilation error.

### Correct

```solidity
function transfer(address to, externalEuint64 encAmount, bytes calldata proof) external {
    euint64 amount = FHE.fromExternal(encAmount, proof);
    ebool hasEnough = FHE.ge(balances[msg.sender], amount);

    // Compute both outcomes, select the right one
    balances[msg.sender] = FHE.select(
        hasEnough,
        FHE.sub(balances[msg.sender], amount),
        balances[msg.sender]
    );
    balances[to] = FHE.select(
        hasEnough,
        FHE.add(balances[to], amount),
        balances[to]
    );

    FHE.allowThis(balances[msg.sender]);
    FHE.allow(balances[msg.sender], msg.sender);
    FHE.allowThis(balances[to]);
    FHE.allow(balances[to], to);
}
```

---

## Pitfall 4: Using require() on Encrypted Conditions

### Wrong

```solidity
function withdraw(externalEuint64 encAmount, bytes calldata proof) external {
    euint64 amount = FHE.fromExternal(encAmount, proof);

    // WRONG: Cannot require() on encrypted comparison
    require(FHE.ge(balances[msg.sender], amount), "Insufficient balance");

    balances[msg.sender] = FHE.sub(balances[msg.sender], amount);
}
```

### Why It Is Wrong

Two problems: (1) `FHE.ge()` returns `ebool`, not `bool`, so `require()` will not compile. (2) Even if it could work, reverting on a balance check **leaks information** --- an attacker could binary-search the victim's balance by observing which amounts cause reverts.

### Correct

```solidity
function withdraw(externalEuint64 encAmount, bytes calldata proof) external {
    euint64 amount = FHE.fromExternal(encAmount, proof);
    ebool hasEnough = FHE.ge(balances[msg.sender], amount);

    // Silent fail: if insufficient, balance stays the same
    balances[msg.sender] = FHE.select(
        hasEnough,
        FHE.sub(balances[msg.sender], amount),
        balances[msg.sender]
    );

    FHE.allowThis(balances[msg.sender]);
    FHE.allow(balances[msg.sender], msg.sender);
}
```

---

## Pitfall 5: Using euint32 as a Function Parameter (Instead of externalEuint32)

### Wrong

```solidity
// WRONG: euint32 cannot be used as an external function parameter for user input
function setSecret(euint32 encryptedValue) external {
    secretNumber = encryptedValue;
    FHE.allowThis(secretNumber);
}
```

### Why It Is Wrong

External functions that accept encrypted data from users must use the `externalEuintXX` type. The `euint32` type is an internal ciphertext handle and cannot be directly passed by external callers. The client-side `fhevmjs` library produces encrypted data in the `external` format.

### Correct

```solidity
function setSecret(externalEuint32 encryptedValue, bytes calldata proof) external {
    secretNumber = FHE.fromExternal(encryptedValue, proof);
    FHE.allowThis(secretNumber);
}
```

---

## Pitfall 6: Forgetting to Allow the User to View Their Own Data

### Wrong

```solidity
function deposit(externalEuint64 encAmount, bytes calldata proof) external {
    euint64 amount = FHE.fromExternal(encAmount, proof);
    balances[msg.sender] = FHE.add(balances[msg.sender], amount);
    FHE.allowThis(balances[msg.sender]);
    // Missing: FHE.allow(balances[msg.sender], msg.sender);
}
```

### Why It Is Wrong

The contract can use the balance (because of `allowThis`), but the user cannot decrypt or re-encrypt their own balance. When the user calls a view function to see their balance, the re-encryption will fail because `msg.sender` is not in the ACL.

### Correct

```solidity
function deposit(externalEuint64 encAmount, bytes calldata proof) external {
    euint64 amount = FHE.fromExternal(encAmount, proof);
    balances[msg.sender] = FHE.add(balances[msg.sender], amount);
    FHE.allowThis(balances[msg.sender]);
    FHE.allow(balances[msg.sender], msg.sender);  // User can view their balance
}
```

---

## Pitfall 7: Mixing Encrypted Types Without Casting

### Wrong

```solidity
euint8 small = FHE.asEuint8(10);
euint32 big = FHE.asEuint32(1000);

// WRONG: Cannot operate on mismatched types
euint32 result = FHE.add(small, big);  // Compilation error
```

### Why It Is Wrong

All FHE operations require operands of the same encrypted type. You cannot add an `euint8` to a `euint32` directly.

### Correct

```solidity
euint8 small = FHE.asEuint8(10);
euint32 big = FHE.asEuint32(1000);

// Cast to matching type first
euint32 smallAsUint32 = FHE.asEuint32(small);
euint32 result = FHE.add(smallAsUint32, big);
FHE.allowThis(result);
```

---

## Pitfall 8: Storing Decrypted Values in Public Storage

### Wrong

```solidity
uint256 public revealedBalance;  // PUBLIC storage!

function revealBalance(euint64 encBalance) external {
    FHE.makePubliclyDecryptable(encBalance);
    revealedBalance = FHE.decrypt(encBalance);  // Now anyone can read it forever
}
```

### Why It Is Wrong

Storing a decrypted value in public storage permanently exposes it. Anyone can read public storage variables. If the goal was temporary access, this defeats the purpose of encryption. Additionally, calling `FHE.makePubliclyDecryptable()` on sensitive values exposes them to all on-chain observers.

### Correct

```solidity
// Option A: Use re-encryption so the value never appears in plaintext on-chain
function getBalance(address user) external view returns (bytes memory) {
    require(FHE.isSenderAllowed(balances[user]), "Not authorized");
    return FHE.sealoutput(balances[user], msg.sender);
}

// Option B: If on-chain decryption is truly needed, restrict access and use private storage
mapping(address => uint64) private revealedValues;

function revealMyBalance() external {
    require(FHE.isSenderAllowed(balances[msg.sender]), "Not authorized");
    FHE.makePubliclyDecryptable(balances[msg.sender]);
    // Value is now decryptable but stored privately
}
```

**Best practice:** Use re-encryption (`FHE.sealoutput`) so the value never appears in plaintext on-chain. Only use `FHE.makePubliclyDecryptable()` for values that genuinely need to be public (e.g., final auction results, game outcomes).

---

## Pitfall 9: Emitting Events with Encrypted Values

### Wrong

```solidity
event Transfer(address indexed from, address indexed to, uint256 amount);

function transfer(address to, externalEuint64 encAmount, bytes calldata proof) external {
    euint64 amount = FHE.fromExternal(encAmount, proof);
    // ... transfer logic ...

    // WRONG: Cannot emit encrypted type in a standard event
    emit Transfer(msg.sender, to, amount);  // Compilation error (euint64 != uint256)
}
```

### Why It Is Wrong

Events expect plaintext types. You cannot pass an `euint64` where a `uint256` is expected. Even if you could cast it, emitting the plaintext amount in an event would leak the transfer amount to everyone.

### Correct

```solidity
// Option A: Emit event without the amount
event Transfer(address indexed from, address indexed to);

function transfer(address to, externalEuint64 encAmount, bytes calldata proof) external {
    euint64 amount = FHE.fromExternal(encAmount, proof);
    // ... transfer logic ...
    emit Transfer(msg.sender, to);  // Amount is confidential
}

// Option B: Emit a placeholder or hash
event TransferOccurred(address indexed from, address indexed to, uint256 indexed txNonce);

function transfer(address to, externalEuint64 encAmount, bytes calldata proof) external {
    euint64 amount = FHE.fromExternal(encAmount, proof);
    // ... transfer logic ...
    transferNonce++;
    emit TransferOccurred(msg.sender, to, transferNonce);
}
```

---

## Pitfall 10: Not Handling Zero/Uninitialized Encrypted Values

### Wrong

```solidity
mapping(address => euint64) private balances;

function transfer(address to, externalEuint64 encAmount, bytes calldata proof) external {
    euint64 amount = FHE.fromExternal(encAmount, proof);

    // If balances[to] has never been set, it is an uninitialized ciphertext handle (zero value)
    // Some operations may fail or produce unexpected results
    balances[to] = FHE.add(balances[to], amount);
    FHE.allowThis(balances[to]);
}
```

### Why It Is Wrong

Uninitialized `euint64` values in mappings may behave as zero ciphertexts, but depending on the implementation, operations on uninitialized handles can fail or produce unexpected behavior. It is safer to initialize explicitly.

### Correct

```solidity
mapping(address => euint64) private balances;
mapping(address => bool) private initialized;

function _ensureInitialized(address account) internal {
    if (!initialized[account]) {
        balances[account] = FHE.asEuint64(0);
        FHE.allowThis(balances[account]);
        initialized[account] = true;
    }
}

function transfer(address to, externalEuint64 encAmount, bytes calldata proof) external {
    _ensureInitialized(msg.sender);
    _ensureInitialized(to);

    euint64 amount = FHE.fromExternal(encAmount, proof);
    // Now safe to operate on initialized values
    // ... transfer logic with FHE.select ...
}
```

---

## Pitfall 11: Using euint256 for Everything

### Wrong

```solidity
// Using euint256 for a value that will never exceed 100
euint256 private score;

function setScore(externalEuint256 encScore, bytes calldata proof) external {
    score = FHE.fromExternal(encScore, proof);
    FHE.allowThis(score);
}

function addToScore(externalEuint256 encBonus, bytes calldata proof) external {
    euint256 bonus = FHE.fromExternal(encBonus, proof);
    score = FHE.add(score, bonus);
    FHE.allowThis(score);
}
```

### Why It Is Wrong

FHE gas costs scale with bit width. Operations on `euint256` are significantly more expensive than operations on `euint8` or `euint32`. Using a 256-bit encrypted integer for a value that fits in 8 bits wastes gas on every operation.

### Correct

```solidity
// Use the smallest type that fits the data range
euint8 private score;  // Scores 0-255 are plenty for a score up to 100

function setScore(externalEuint8 encScore, bytes calldata proof) external {
    score = FHE.fromExternal(encScore, proof);
    FHE.allowThis(score);
}

function addToScore(externalEuint8 encBonus, bytes calldata proof) external {
    euint8 bonus = FHE.fromExternal(encBonus, proof);
    score = FHE.add(score, bonus);
    FHE.allowThis(score);
}
```

---

## Pitfall 12: Leaking Information Through Gas Differences

### Wrong

```solidity
function processPayment(externalEuint64 encAmount, bytes calldata proof) external {
    euint64 amount = FHE.fromExternal(encAmount, proof);
    ebool isLargePayment = FHE.gt(amount, FHE.asEuint64(10000));

    // WRONG: different code paths = different gas = information leakage
    // Even though we cannot branch, doing extra work conditionally leaks info
    balances[msg.sender] = FHE.sub(balances[msg.sender], amount);

    // This plaintext check on the ebool would not compile,
    // but even calling different numbers of FHE ops in different branches leaks info
}
```

### Why It Is Wrong

If different logical paths consume different amounts of gas, an observer can infer information about the encrypted values by watching gas usage. All execution paths should perform the same operations regardless of the encrypted values.

### Correct

```solidity
function processPayment(externalEuint64 encAmount, bytes calldata proof) external {
    euint64 amount = FHE.fromExternal(encAmount, proof);

    // Always perform the same operations regardless of amount
    ebool hasEnough = FHE.ge(balances[msg.sender], amount);

    // Both branches of select are always computed
    balances[msg.sender] = FHE.select(
        hasEnough,
        FHE.sub(balances[msg.sender], amount),
        balances[msg.sender]
    );

    // If fee logic is needed, always compute it, always apply via select
    euint64 fee = FHE.div(amount, FHE.asEuint64(100));
    euint64 feeApplied = FHE.select(hasEnough, fee, FHE.asEuint64(0));

    FHE.allowThis(balances[msg.sender]);
    FHE.allow(balances[msg.sender], msg.sender);
}
```

---

## Pitfall 13: Forgetting ACL in Multi-Contract Interactions

### Wrong

```solidity
contract TokenA {
    mapping(address => euint64) private balances;

    function getBalance(address user) external view returns (euint64) {
        return balances[user];
        // The calling contract (TokenB) has no ACL permission for this ciphertext!
    }
}

contract TokenB {
    TokenA public tokenA;

    function doSomething(address user) external {
        euint64 bal = tokenA.getBalance(user);
        // FAILS: TokenB is not in the ACL for the returned ciphertext
        euint64 doubled = FHE.mul(bal, FHE.asEuint64(2));
    }
}
```

### Why It Is Wrong

When one contract returns an encrypted value to another, the calling contract is not automatically in the ACL. The returning contract must explicitly grant permission to the caller before returning the value.

### Correct

```solidity
contract TokenA {
    mapping(address => euint64) private balances;

    function getBalanceFor(address user, address caller) external returns (euint64) {
        euint64 bal = balances[user];
        FHE.allowTransient(bal, caller);  // Grant temporary access to the caller
        return bal;
    }
}

contract TokenB {
    TokenA public tokenA;

    function doSomething(address user) external {
        euint64 bal = tokenA.getBalanceFor(user, address(this));
        // Now TokenB has transient permission
        euint64 doubled = FHE.mul(bal, FHE.asEuint64(2));
        FHE.allowThis(doubled);
    }
}
```

---

## Pitfall 14: Incorrect Decryption Pattern

### Wrong

```solidity
function revealAndUse() external {
    // WRONG: Trying to use an encrypted value as if it were plaintext
    uint256 value = uint256(encryptedValue);  // This does NOT decrypt!
    doSomethingWith(value);  // Using a ciphertext handle, not the actual value
}
```

### Why It Is Wrong

Encrypted values cannot be directly cast to plaintext types. A ciphertext handle is not the actual value --- casting it gives you the internal handle ID, not the decrypted data. Decryption must be done explicitly using the proper FHE API.

### Correct

```solidity
// Option A: Make the value publicly decryptable (use only when the value should be public)
function revealResult(euint64 encResult) external {
    require(msg.sender == owner, "Only owner can reveal");
    FHE.makePubliclyDecryptable(encResult);
    // The value is now marked for public decryption
    // It can be read by anyone once decrypted
}

// Option B: Use sealoutput for user-specific private reads (preferred)
function getMyBalance() external view returns (bytes memory) {
    require(FHE.isSenderAllowed(balances[msg.sender]), "Not authorized");
    return FHE.sealoutput(balances[msg.sender], msg.sender);
    // Only the caller can decrypt this sealed output client-side
}
```

---

## Summary Table

| # | Pitfall | Impact | Fix |
|---|---|---|---|
| 1 | Old API (TFHE) | Does not compile | Use `FHE` library + `externalEuintXX` + `FHE.fromExternal()` |
| 2 | Missing `allowThis` | Contract loses access | Always `FHE.allowThis()` after storing |
| 3 | if/else on encrypted | Does not compile | Use `FHE.select()` |
| 4 | require() on encrypted | Does not compile + leaks info | Use `FHE.select()` (silent fail) |
| 5 | `euint32` as parameter | Does not compile | Use `externalEuint32` + `FHE.fromExternal()` |
| 6 | Missing user ACL | User cannot view | Add `FHE.allow(value, user)` |
| 7 | Type mismatch | Does not compile | Cast with `FHE.asEuintXX()` |
| 8 | Public decrypted storage | Permanent leak | Use private storage or re-encryption |
| 9 | Encrypted in events | Does not compile / leaks | Omit amount or emit placeholder |
| 10 | Uninitialized values | Potential failures | Initialize with `FHE.asEuintXX(0)` |
| 11 | Oversized types | Wasted gas | Use smallest sufficient type |
| 12 | Gas leakage | Side-channel attack | Uniform execution paths |
| 13 | Missing cross-contract ACL | Unauthorized access | `FHE.allowTransient()` before return |
| 14 | Incorrect decryption pattern | Wrong data / no decryption | Use `FHE.makePubliclyDecryptable()` or `FHE.sealoutput()` |
