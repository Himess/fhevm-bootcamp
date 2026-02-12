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
| `euint4` | 4 | 0 -- 15 | `uint8` (conceptually 4-bit) |
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

### Byte Arrays

| Type | Size | Plaintext Equivalent |
|---|---|---|
| `ebytes64` | 64 bytes | `bytes` |
| `ebytes128` | 128 bytes | `bytes` |
| `ebytes256` | 256 bytes | `bytes` |

### External Input Types (for function parameters)

| External Type | Converts To |
|---|---|
| `externalEbool` | `ebool` |
| `externalEuint4` | `euint4` |
| `externalEuint8` | `euint8` |
| `externalEuint16` | `euint16` |
| `externalEuint32` | `euint32` |
| `externalEuint64` | `euint64` |
| `externalEuint128` | `euint128` |
| `externalEuint256` | `euint256` |
| `externalEaddress` | `eaddress` |
| `externalEbytes64` | `ebytes64` |
| `externalEbytes128` | `ebytes128` |
| `externalEbytes256` | `ebytes256` |

---

## Input Conversion

Convert external encrypted inputs to internal encrypted types:

```solidity
function receiveInput(externalEuint32 encInput, bytes calldata proof) external {
    euint32 value = FHE.fromExternal(encInput, proof);
    // Now 'value' can be used in FHE operations
    FHE.allowThis(value);
}
```

| Function | Input | Output |
|---|---|---|
| `FHE.fromExternal(externalEbool, proof)` | `externalEbool, bytes calldata proof` | `ebool` |
| `FHE.fromExternal(externalEuint4, proof)` | `externalEuint4, bytes calldata proof` | `euint4` |
| `FHE.fromExternal(externalEuint8, proof)` | `externalEuint8, bytes calldata proof` | `euint8` |
| `FHE.fromExternal(externalEuint16, proof)` | `externalEuint16, bytes calldata proof` | `euint16` |
| `FHE.fromExternal(externalEuint32, proof)` | `externalEuint32, bytes calldata proof` | `euint32` |
| `FHE.fromExternal(externalEuint64, proof)` | `externalEuint64, bytes calldata proof` | `euint64` |
| `FHE.fromExternal(externalEuint128, proof)` | `externalEuint128, bytes calldata proof` | `euint128` |
| `FHE.fromExternal(externalEuint256, proof)` | `externalEuint256, bytes calldata proof` | `euint256` |
| `FHE.fromExternal(externalEaddress, proof)` | `externalEaddress, bytes calldata proof` | `eaddress` |
| `FHE.fromExternal(externalEbytes64, proof)` | `externalEbytes64, bytes calldata proof` | `ebytes64` |
| `FHE.fromExternal(externalEbytes128, proof)` | `externalEbytes128, bytes calldata proof` | `ebytes128` |
| `FHE.fromExternal(externalEbytes256, proof)` | `externalEbytes256, bytes calldata proof` | `ebytes256` |

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
| `FHE.asEuint4(uint8)` | Plaintext value | `euint4` |
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
| Division | `FHE.div(a, b)` | `euint32 quot = FHE.div(x, y);` |
| Remainder | `FHE.rem(a, b)` | `euint32 mod = FHE.rem(x, y);` |
| Negation | `FHE.neg(a)` | `euint32 neg = FHE.neg(x);` |
| Minimum | `FHE.min(a, b)` | `euint32 m = FHE.min(x, y);` |
| Maximum | `FHE.max(a, b)` | `euint32 m = FHE.max(x, y);` |

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
| `FHE.randEuint4()` | `euint4` |
| `FHE.randEuint8()` | `euint8` |
| `FHE.randEuint16()` | `euint16` |
| `FHE.randEuint32()` | `euint32` |
| `FHE.randEuint64()` | `euint64` |
| `FHE.randEuint128()` | `euint128` |
| `FHE.randEuint256()` | `euint256` |

```solidity
euint32 randomNumber = FHE.randEuint32();
FHE.allowThis(randomNumber);
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

```solidity
// Seal output for a specific user to decrypt client-side
function viewMyBalance() external view returns (bytes memory) {
    return FHE.sealoutput(balances[msg.sender], msg.sender);
}
```

### Gateway Decryption (On-Chain Reveal)

```solidity
// Request async decryption via the Gateway
// The Gateway calls back with the plaintext result
uint256[] memory cts = new uint256[](1);
cts[0] = Gateway.toUint256(encryptedValue);
Gateway.requestDecryption(cts, this.myCallback.selector, 0, block.timestamp + 100, false);

function myCallback(uint256 requestID, uint32 decryptedValue) external onlyGateway {
    // Use the decrypted value
    revealedResult = decryptedValue;
}
```

---

## Complete Example: Encrypted Transfer

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint64, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract ConfidentialToken is ZamaEthereumConfig {
    mapping(address => euint64) private balances;

    function transfer(address to, externalEuint64 encAmount, bytes calldata proof) external {
        euint64 amount = FHE.fromExternal(encAmount, proof);

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
3. **Use `externalEuintXX` and `bytes calldata proof` for function parameters**, then convert with `FHE.fromExternal(value, proof)`.
4. **Both operands must match types** (or second operand is plaintext).
5. **Overflow wraps silently.** There is no revert on overflow.
6. **Use the smallest type that fits your data.** Gas cost scales with bit width.
7. **Decryption is asynchronous.** Use the Gateway callback pattern.
8. **Inherit `ZamaEthereumConfig`** in your contract for proper fhEVM configuration.
