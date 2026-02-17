---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 04: Operations on Encrypted Data"
---

<style>
section { font-size: 18px; overflow: hidden; color: #1E293B; }
h1 { font-size: 28px; margin-bottom: 8px; color: #1E40AF; border-bottom: 2px solid #DBEAFE; padding-bottom: 6px; }
h2 { font-size: 22px; margin-bottom: 6px; color: #155E75; }
h3 { font-size: 19px; color: #92400E; }
code { font-size: 15px; background: #F1F5F9; color: #3730A3; padding: 1px 4px; border-radius: 3px; }
pre { font-size: 13px; line-height: 1.25; margin: 6px 0; background: #1E293B; color: #E2E8F0; border-radius: 6px; padding: 10px; border-left: 3px solid #6366F1; }
pre code { background: transparent; color: #E2E8F0; padding: 0; }
li { margin-bottom: 1px; line-height: 1.4; }
table { font-size: 15px; border-collapse: collapse; width: 100%; }
th { background: #1E40AF; color: white; padding: 6px 10px; text-align: left; }
td { padding: 5px 10px; border-bottom: 1px solid #E2E8F0; }
tr:nth-child(even) { background: #F8FAFC; }
p { margin-bottom: 4px; }
ul, ol { margin-top: 4px; margin-bottom: 4px; }
header { color: #3B82F6 !important; }
footer { color: #94A3B8 !important; }
section.small { font-size: 15px; }
section.small h1 { font-size: 24px; margin-bottom: 6px; }
section.small ol li { margin-bottom: 0; line-height: 1.3; }
</style>

# Module 04: Operations on Encrypted Data

Arithmetic, bitwise, and comparison operations on encrypted values.

---

# Three Operation Categories

| Category | Examples | Returns |
|----------|----------|---------|
| **Arithmetic** | add, sub, mul, div, rem | `euintXX` |
| **Bitwise** | and, or, xor, not | `euintXX` |
| **Comparison** | eq, ne, gt, ge, lt, le | `ebool` |

Plus: `min`, `max`, `neg`

<!--
Speaker notes: Give students a high-level map before diving in. The three categories cover different needs: arithmetic for math, bitwise for flags and masks, comparison for branching logic. Comparisons return ebool, which is the bridge to conditional logic in Module 08.
-->

---

# Arithmetic Operations

```solidity
euint32 a = FHE.asEuint32(10);
euint32 b = FHE.asEuint32(3);

FHE.add(a, b);   // 13
FHE.sub(a, b);   // 7
FHE.mul(a, b);   // 30
FHE.div(a, 3);   // 3  (plaintext divisor only!)
FHE.rem(a, 3);   // 1  (plaintext divisor only!)
FHE.neg(a);      // 2^32 - 10
```

<!--
Speaker notes: Walk through each operation with the concrete values. Highlight that div and rem require a plaintext second operand -- this is a fundamental limitation we will explain on the next slide. neg computes the two's complement, not negative in the traditional sense.
-->

---

# Key Rule: Division and Remainder

`FHE.div()` and `FHE.rem()` require a **plaintext** second operand.

```solidity
// VALID
FHE.div(encryptedValue, 5);

// INVALID — will not compile
FHE.div(encryptedA, encryptedB);
```

Dividing two encrypted values is not supported in the current FHE scheme.

<!--
Speaker notes: This is a common question: "Why can't I divide two encrypted numbers?" The answer is that encrypted division requires knowing the divisor to set up the computation. This is a TFHE limitation. If students need encrypted division, guide them toward alternative approaches like multiplication by inverse.
-->

---

# Bitwise Operations

```solidity
euint8 a = FHE.asEuint8(0b11001100);
euint8 b = FHE.asEuint8(0b10101010);

FHE.and(a, b);  // 0b10001000
FHE.or(a, b);   // 0b11101110
FHE.xor(a, b);  // 0b01100110
FHE.not(a);     // 0b00110011
```

<!--
Speaker notes: Bitwise operations are useful for flag manipulation and efficient storage patterns. They are also the cheapest FHE operations after NOT. Ask students when they might use XOR in a smart contract context -- hint: toggling flags.
-->

---

# Shift and Rotate Operations

| Operation | Function | Description |
|-----------|----------|-------------|
| Shift Left | `FHE.shl(a, b)` | Multiply by 2^b |
| Shift Right | `FHE.shr(a, b)` | Divide by 2^b |
| Rotate Left | `FHE.rotl(a, b)` | Circular left shift |
| Rotate Right | `FHE.rotr(a, b)` | Circular right shift |

> ⚠️ The shift amount (b) is ALWAYS `euint8` or `uint8`

```solidity
euint32 x = FHE.asEuint32(1);
euint32 result = FHE.shl(x, 3);  // 1 << 3 = 8
```

<!--
Speaker notes: Note the important constraint that shift amount is always euint8 or uint8, regardless of the operand type. Shift left is equivalent to multiplication by powers of 2 and can be more gas-efficient than FHE.mul() for those cases.
-->

---

# Comparison Operations

All return `ebool`:

```solidity
euint32 a = FHE.asEuint32(10);
euint32 b = FHE.asEuint32(20);

ebool r1 = FHE.eq(a, b);   // encrypted false
ebool r2 = FHE.ne(a, b);   // encrypted true
ebool r3 = FHE.gt(a, b);   // encrypted false
ebool r4 = FHE.ge(a, b);   // encrypted false
ebool r5 = FHE.lt(a, b);   // encrypted true
ebool r6 = FHE.le(a, b);   // encrypted true
```

<!--
Speaker notes: Comparisons are the gateway to conditional logic. Every comparison returns an ebool, which you cannot use in an if statement. Instead, you pass ebool to FHE.select() -- we will cover this in depth in Module 08. Memorize these six operators.
-->

---

# Min and Max

```solidity
euint32 a = FHE.asEuint32(10);
euint32 b = FHE.asEuint32(20);

euint32 smaller = FHE.min(a, b); // 10
euint32 larger  = FHE.max(a, b); // 20
```

**Great for clamping:**
```solidity
// value between 10 and 100
value = FHE.max(value, FHE.asEuint32(10));
value = FHE.min(value, FHE.asEuint32(100));
```

<!--
Speaker notes: min and max are extremely useful for clamping values to a range. They use FHE.select() internally, so they are slightly more expensive than a simple comparison. The clamping pattern shown here is common in token contracts and game logic.
-->

---

# Cross-Type Operations

fhEVM supports operations between **different** encrypted types:

```solidity
euint8 small = FHE.asEuint8(10);
euint32 big = FHE.asEuint32(1000);

// Result is euint32 (larger type)
euint32 sum = FHE.add(small, big);  // ✅ 1010
```

**Rule:** Result type = the LARGER operand type.

Also accepts one plaintext operand:
```solidity
FHE.add(encryptedVal, 5);  // OK
FHE.eq(encryptedVal, 42);  // OK
```

<!--
Speaker notes: Cross-type operations are a convenience feature -- the smaller type is automatically upcast. The plaintext operand support means you do not need to wrap every constant in FHE.asEuintXX(). This saves gas and makes code cleaner.
-->

---

# Overflow Behavior

FHEVM uses **wrapping arithmetic** — no reverts on overflow!

```solidity
euint8 a = FHE.asEuint8(250);
euint8 sum = FHE.add(a, FHE.asEuint8(10));
// 250 + 10 = 260 → wraps to 4

euint8 b = FHE.asEuint8(5);
euint8 diff = FHE.sub(b, FHE.asEuint8(10));
// 5 - 10 = -5 → wraps to 251
```

**You must check bounds manually!**

<!--
Speaker notes: This is a critical safety concern. Unlike standard Solidity (which reverts on overflow since 0.8), FHEVM wraps silently. Since the values are encrypted, you cannot even see the overflow happen. Always use comparisons before arithmetic to prevent unexpected wrapping.
-->

---

# Safe Subtraction Pattern

```solidity
function safeSub(
    euint32 a, euint32 b
) internal returns (euint32) {
    ebool isValid = FHE.ge(a, b);
    euint32 diff = FHE.sub(a, b);
    euint32 zero = FHE.asEuint32(0);
    return FHE.select(isValid, diff, zero);
}
```

Uses `FHE.select()` (covered in detail in Module 08).

<!--
Speaker notes: This safe subtraction pattern is one of the most important reusable building blocks. Walk through it step by step: check if a >= b, compute the difference, then select either the difference or zero. This exact pattern appears in the ERC-20 transfer function.
-->

---

# Gas Cost Ranking

```
NOT         █░░░░░░░░░  Cheapest
AND/OR/XOR  ██░░░░░░░░
ADD/SUB     ████░░░░░░
SHL/SHR     ████░░░░░░  Medium
EQ/NE       █████░░░░░
GT/GE/LT/LE███████░░░
MIN/MAX     ████████░░
MUL         █████████░
DIV/REM     ██████████  Most Expensive
```

<!--
Speaker notes: Use this chart when students ask "why not just use mul for everything?" The gas cost difference between NOT and MUL is enormous. When optimizing FHEVM contracts, replace multiplication with shifts where possible, and minimize comparisons and divisions.
-->

---

# Practical Example: Encrypted Counter with Bounds

```solidity
euint32 private _counter;
uint32 constant MAX = 1000;

function increment(uint32 amount) public {
    euint32 newVal = FHE.add(_counter, FHE.asEuint32(amount));
    // Clamp to MAX
    _counter = FHE.min(newVal, FHE.asEuint32(MAX));
    FHE.allowThis(_counter);
}
```

<!--
Speaker notes: This practical example combines add, min, and allowThis in a real pattern. The clamp to MAX prevents overflow. Ask students: "What would happen without the FHE.min() call if someone incremented past MAX?" Answer: wrapping behavior.
-->

---

# Summary

| Category | Operations | Key Notes |
|----------|-----------|-----------|
| Arithmetic | add, sub, mul, div, rem, neg | div/rem: plaintext only |
| Bitwise | and, or, xor, not | Efficient gas |
| Shift/Rotate | shl, shr, rotl, rotr | Shift amount: always euint8/uint8 |
| Comparison | eq, ne, gt, ge, lt, le | Return `ebool` |
| Min/Max | min, max | Great for clamping |

- Cross-type ops supported (auto-upcast to larger type)
- Wrapping arithmetic (no reverts)
- Handle bounds with comparisons + `FHE.select()`

<!--
Speaker notes: This summary table is a reference card for students. Encourage them to bookmark or print this slide. The key takeaway is that FHEVM gives you a complete arithmetic and logic toolkit, but overflow handling is your responsibility.
-->

---

# Next Up

**Module 05: Access Control (ACL)**

Learn `FHE.allow()`, `FHE.allowThis()`, `FHE.allowTransient()`, `FHE.isSenderAllowed()`, and `FHE.makePubliclyDecryptable()`.

<!--
Speaker notes: Transition to the next module by saying: "We now know the types and operations, but who gets to USE the results?" ACL is the permission layer that controls access to encrypted data.
-->
