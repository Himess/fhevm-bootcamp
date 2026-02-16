# FHEVM Quick Reference Card

> New API: Library is `FHE`, imported from `@fhevm/solidity/lib/FHE.sol`

---

## Setup

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, euint64, ebool, eaddress } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract MyContract is ZamaEthereumConfig {
    // Your encrypted contract logic here
}
```

---

## Encrypted Types

### Boolean

| Type | Description | Plaintext Equivalent |
|---|---|---|
| `ebool` | Encrypted boolean | `bool` |

### Unsigned Integers

| Type | Bits | Range | Plaintext Equivalent |
|---|---|---|---|
| `euint8` | 8 | 0 -- 255 | `uint8` |
| `euint16` | 16 | 0 -- 65,535 | `uint16` |
| `euint32` | 32 | 0 -- 4,294,967,295 | `uint32` |
| `euint64` | 64 | 0 -- 18.4 * 10^18 | `uint64` |
| `euint128` | 128 | 0 -- 3.4 * 10^38 | `uint128` |
| `euint256` | 256 | 0 -- 1.15 * 10^77 | `uint256` |

### Address

| Type | Description | Plaintext Equivalent |
|---|---|---|
| `eaddress` | Encrypted Ethereum address | `address` |

### External Input Types (for function parameters)

| External Type | Converts To |
|---|---|
| `externalEbool` | `ebool` |
| `externalEuint8` | `euint8` |
| `externalEuint16` | `euint16` |
| `externalEuint32` | `euint32` |
| `externalEuint64` | `euint64` |
| `externalEuint128` | `euint128` |
| `externalEuint256` | `euint256` |
| `externalEaddress` | `eaddress` |

---

## Input Conversion

Convert external encrypted inputs to internal encrypted types:

```solidity
function receiveInput(externalEuint32 encInput, bytes calldata inputProof) external {
    euint32 value = FHE.fromExternal(encInput, inputProof);
    // Now 'value' can be used in FHE operations
    FHE.allowThis(value);
}
```

| Function | Input | Output |
|---|---|---|
| `FHE.fromExternal(externalEbool, inputProof)` | `externalEbool, bytes calldata inputProof` | `ebool` |
| `FHE.fromExternal(externalEuint8, inputProof)` | `externalEuint8, bytes calldata inputProof` | `euint8` |
| `FHE.fromExternal(externalEuint16, inputProof)` | `externalEuint16, bytes calldata inputProof` | `euint16` |
| `FHE.fromExternal(externalEuint32, inputProof)` | `externalEuint32, bytes calldata inputProof` | `euint32` |
| `FHE.fromExternal(externalEuint64, inputProof)` | `externalEuint64, bytes calldata inputProof` | `euint64` |
| `FHE.fromExternal(externalEuint128, inputProof)` | `externalEuint128, bytes calldata inputProof` | `euint128` |
| `FHE.fromExternal(externalEuint256, inputProof)` | `externalEuint256, bytes calldata inputProof` | `euint256` |
| `FHE.fromExternal(externalEaddress, inputProof)` | `externalEaddress, bytes calldata inputProof` | `eaddress` |

---

## Plaintext to Encrypted Conversion

Encrypt a plaintext constant within the contract:

```solidity
euint32 encryptedFive = FHE.asEuint32(5);
ebool encryptedTrue = FHE.asEbool(true);
eaddress encAddr = FHE.asEaddress(msg.sender);
```

| Function | Input | Output |
|---|---|---|
| `FHE.asEbool(bool)` | `bool` | `ebool` |
| `FHE.asEuint8(uint8)` | Plaintext value | `euint8` |
| `FHE.asEuint16(uint16)` | Plaintext value | `euint16` |
| `FHE.asEuint32(uint32)` | Plaintext value | `euint32` |
| `FHE.asEuint64(uint64)` | Plaintext value | `euint64` |
| `FHE.asEuint128(uint128)` | Plaintext value | `euint128` |
| `FHE.asEuint256(uint256)` | Plaintext value | `euint256` |
| `FHE.asEaddress(address)` | `address` | `eaddress` |

---

## Type Casting (Between Encrypted Types)

```solidity
euint8 small = FHE.asEuint8(42);
euint32 bigger = FHE.asEuint32(small);   // Upcast: euint8 -> euint32
euint8 back = FHE.asEuint8(bigger);      // Downcast: euint32 -> euint8 (may truncate)
```

---

## Arithmetic Operations

All operations return encrypted results. Both operands must be the same encrypted type, OR the second operand can be a plaintext value.

| Operation | Function | Example |
|---|---|---|
| Addition | `FHE.add(a, b)` | `euint32 sum = FHE.add(x, y);` |
| Subtraction | `FHE.sub(a, b)` | `euint32 diff = FHE.sub(x, y);` |
| Multiplication | `FHE.mul(a, b)` | `euint32 prod = FHE.mul(x, y);` |
| Division | `FHE.div(a, plaintext)` | `euint32 quot = FHE.div(x, 2);` |
| Remainder | `FHE.rem(a, plaintext)` | `euint32 mod = FHE.rem(x, 3);` |
| Negation | `FHE.neg(a)` | `euint32 neg = FHE.neg(x);` |
| Minimum | `FHE.min(a, b)` | `euint32 m = FHE.min(x, y);` |
| Maximum | `FHE.max(a, b)` | `euint32 m = FHE.max(x, y);` |

> **Note:** `div` and `rem` only accept a plaintext (scalar) second operand. You cannot divide or take the remainder by an encrypted value.

**Mixed encrypted/plaintext:**

```solidity
euint32 result = FHE.add(encryptedVal, 10);    // encrypted + plaintext
euint32 result = FHE.mul(encryptedVal, 2);     // encrypted * plaintext
```

**Overflow behavior:** Operations wrap silently. `FHE.add` on `euint8` with values 200 + 100 = 44 (wraps at 256). No revert.

---

## Comparison Operations

All comparisons return `ebool` (encrypted boolean).

| Operation | Function | Example |
|---|---|---|
| Equal | `FHE.eq(a, b)` | `ebool isEq = FHE.eq(x, y);` |
| Not equal | `FHE.ne(a, b)` | `ebool isNe = FHE.ne(x, y);` |
| Greater than | `FHE.gt(a, b)` | `ebool isGt = FHE.gt(x, y);` |
| Greater or equal | `FHE.ge(a, b)` | `ebool isGe = FHE.ge(x, y);` |
| Less than | `FHE.lt(a, b)` | `ebool isLt = FHE.lt(x, y);` |
| Less or equal | `FHE.le(a, b)` | `ebool isLe = FHE.le(x, y);` |

**Mixed encrypted/plaintext:**

```solidity
ebool isAboveThreshold = FHE.gt(encryptedVal, 100);  // encrypted > plaintext
```

---

## Bitwise Operations

| Operation | Function | Example |
|---|---|---|
| AND | `FHE.and(a, b)` | `euint8 r = FHE.and(x, y);` |
| OR | `FHE.or(a, b)` | `euint8 r = FHE.or(x, y);` |
| XOR | `FHE.xor(a, b)` | `euint8 r = FHE.xor(x, y);` |
| NOT | `FHE.not(a)` | `euint8 r = FHE.not(x);` |

**Also works on `ebool`:**

```solidity
ebool result = FHE.and(cond1, cond2);   // logical AND of two encrypted booleans
ebool result = FHE.or(cond1, cond2);    // logical OR
ebool result = FHE.not(cond1);          // logical NOT
```

---

## Shift and Rotate Operations

| Operation | Function | Example |
|---|---|---|
| Shift left | `FHE.shl(a, b)` | `euint32 r = FHE.shl(x, 2);` |
| Shift right | `FHE.shr(a, b)` | `euint32 r = FHE.shr(x, 2);` |
| Rotate left | `FHE.rotl(a, b)` | `euint32 r = FHE.rotl(x, 4);` |
| Rotate right | `FHE.rotr(a, b)` | `euint32 r = FHE.rotr(x, 4);` |

---

## Conditional Selection (Encrypted Ternary)

The fundamental branching primitive in FHE. Replaces `if/else` for encrypted conditions.

```solidity
// FHE.select(condition, valueIfTrue, valueIfFalse)
euint32 result = FHE.select(isGreater, largeValue, smallValue);
```

| Function | Signature | Description |
|---|---|---|
| `FHE.select` | `FHE.select(ebool, euintXX, euintXX) -> euintXX` | Returns first value if true, second if false |

**Works with all encrypted types:**

```solidity
ebool cond = FHE.gt(a, b);

euint32 val = FHE.select(cond, x, y);           // select euint32
ebool flag = FHE.select(cond, trueFlag, falseFlag); // select ebool
eaddress addr = FHE.select(cond, addr1, addr2);  // select eaddress
```

**Nested selects (multi-way):**

```solidity
// Encrypted equivalent of: if (a) x; else if (b) y; else z;
euint32 result = FHE.select(condA, x, FHE.select(condB, y, z));
```

---

## Random Number Generation

Generate encrypted random values on-chain:

| Function | Output Type |
|---|---|
| `FHE.randEbool()` | `ebool` |
| `FHE.randEuint8()` | `euint8` |
| `FHE.randEuint16()` | `euint16` |
| `FHE.randEuint32()` | `euint32` |
| `FHE.randEuint64()` | `euint64` |
| `FHE.randEuint128()` | `euint128` |
| `FHE.randEuint256()` | `euint256` |

**Bounded random (upper bound, exclusive):**

| Function | Output Type |
|---|---|
| `FHE.randEuint8(uint8 upperBound)` | `euint8` in range [0, upperBound) |
| `FHE.randEuint16(uint16 upperBound)` | `euint16` in range [0, upperBound) |
| `FHE.randEuint32(uint32 upperBound)` | `euint32` in range [0, upperBound) |
| `FHE.randEuint64(uint64 upperBound)` | `euint64` in range [0, upperBound) |
| `FHE.randEuint128(uint128 upperBound)` | `euint128` in range [0, upperBound) |
| `FHE.randEuint256(uint256 upperBound)` | `euint256` in range [0, upperBound) |

```solidity
euint32 randomNumber = FHE.randEuint32();
FHE.allowThis(randomNumber);

// Bounded: random number from 0 to 99
euint32 dice = FHE.randEuint32(100);
FHE.allowThis(dice);
```

---

## Access Control (ACL)

Every encrypted value has an access control list. You MUST grant permissions for any address (including the contract itself) to use an encrypted value.

### Persistent Permissions (stored permanently)

| Function | Description |
|---|---|
| `FHE.allow(ciphertext, address)` | Allow `address` to use `ciphertext` |
| `FHE.allowThis(ciphertext)` | Allow this contract to use `ciphertext` (shortcut for `FHE.allow(ciphertext, address(this))`) |

### Transient Permissions (single transaction only)

| Function | Description |
|---|---|
| `FHE.allowTransient(ciphertext, address)` | Temporarily allow `address` for current transaction |

### Permission Checks

| Function | Description |
|---|---|
| `FHE.isSenderAllowed(ciphertext)` | Returns `bool` --- is `msg.sender` allowed to use this ciphertext? |
| `FHE.isAllowed(ciphertext, address)` | Returns `bool` --- is `address` allowed to use this ciphertext? |

### Initialization Checks

| Function | Description |
|---|---|
| `FHE.isInitialized(ciphertext)` | Returns `bool` --- is the encrypted value non-zero (has been assigned)? |

```solidity
// Guard against uninitialized encrypted values
require(FHE.isInitialized(balances[user]), "No balance set");
```

### Common ACL Pattern

```solidity
// After ANY operation that produces a new ciphertext:
euint32 newBalance = FHE.add(balance, amount);
FHE.allowThis(newBalance);           // Contract can use it in future txs
FHE.allow(newBalance, owner);        // Owner can view/decrypt it
```

---

## Decryption

### Re-encryption (User-Specific, Off-Chain)

Re-encryption is handled **client-side** using the Relayer SDK (`@zama-fhe/relayer-sdk`), not on-chain. The contract simply returns the encrypted handle after verifying ACL permissions. The client then calls `instance.userDecrypt()` to re-encrypt the ciphertext under the user's key via the KMS.

```solidity
// Return the encrypted handle -- client decrypts via instance.userDecrypt()
function viewMyBalance() external view returns (euint64) {
    return balances[msg.sender]; // ACL must have been set via FHE.allow(balance, msg.sender)
}
```

> **Note:** `FHE.sealoutput()` does **not** exist in fhEVM v0.10.0. The correct pattern is to return the ciphertext handle and let the client-side Relayer SDK (`instance.userDecrypt()`) handle re-encryption through the KMS.

### Public Decryption (On-Chain Reveal)

```solidity
// Step 1: Make a value publicly decryptable
FHE.makePubliclyDecryptable(encryptedValue);

// Step 2: Check if a value has been marked for public decryption
bool canDecrypt = FHE.isPubliclyDecryptable(encryptedValue);
```

| Function | Description |
|---|---|
| `FHE.makePubliclyDecryptable(ciphertext)` | Mark an encrypted value for public decryption |
| `FHE.isPubliclyDecryptable(ciphertext)` | Check if a value has been marked publicly decryptable |
| `FHE.checkSignatures(bytes)` | Verify KMS decryption signatures on-chain |

> **Note:** In earlier fhEVM versions (pre-v0.9), `Gateway.requestDecryption()` was used for asynchronous decryption. In the current version, use `FHE.makePubliclyDecryptable()` instead.

---

## Complete Example: Encrypted Transfer

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint64, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract ConfidentialToken is ZamaEthereumConfig {
    mapping(address => euint64) private balances;

    function transfer(address to, externalEuint64 encAmount, bytes calldata inputProof) external {
        euint64 amount = FHE.fromExternal(encAmount, inputProof);

        // Encrypted balance check
        ebool hasEnough = FHE.ge(balances[msg.sender], amount);

        // Conditional update (silent fail if insufficient)
        euint64 newSenderBal = FHE.select(
            hasEnough,
            FHE.sub(balances[msg.sender], amount),
            balances[msg.sender]
        );
        euint64 newReceiverBal = FHE.select(
            hasEnough,
            FHE.add(balances[to], amount),
            balances[to]
        );

        // Update storage
        balances[msg.sender] = newSenderBal;
        balances[to] = newReceiverBal;

        // ACL: allow contract + owners
        FHE.allowThis(newSenderBal);
        FHE.allow(newSenderBal, msg.sender);
        FHE.allowThis(newReceiverBal);
        FHE.allow(newReceiverBal, to);
    }
}
```

---

## Quick Rules

1. **Always call `FHE.allowThis()` after storing an encrypted value.** The contract needs permission to read its own storage.
2. **Never use `if` on encrypted values.** Use `FHE.select()` instead.
3. **Use `externalEuintXX` and `bytes calldata inputProof` for function parameters**, then convert with `FHE.fromExternal(value, inputProof)`.
4. **Both operands must match types** (or second operand is plaintext).
5. **Overflow wraps silently.** There is no revert on overflow.
6. **Use the smallest type that fits your data.** Gas cost scales with bit width.
7. **Use `FHE.makePubliclyDecryptable()` for on-chain reveal** or client-side re-encryption via `instance.userDecrypt()` for user-specific off-chain decryption.
8. **Inherit `ZamaEthereumConfig`** in your contract for proper fhEVM configuration.
