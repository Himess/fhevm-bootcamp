# Module 09: On-Chain Encrypted Randomness — Lesson

## Introduction

Randomness is a fundamental building block for many blockchain applications: lotteries, games, NFT minting, random selection, shuffling, and more. However, generating truly unpredictable and manipulation-resistant randomness on a public, deterministic blockchain is one of the hardest unsolved problems in smart contract development.

FHEVM introduces a powerful solution: **encrypted on-chain randomness**. Using FHE (Fully Homomorphic Encryption), the blockchain can generate random values that are encrypted at creation time — nobody can see the random value, not even the block producer, the sequencer, or the contract itself. This makes front-running and manipulation mathematically impossible.

---

## 1. The Problem with On-Chain Randomness

### Why Is Randomness Hard on Blockchain?

Blockchains are **deterministic state machines**. Every node must compute the same result for the same input. This fundamental property conflicts with randomness — if everyone can compute the same "random" value, it is not random at all.

### Common (Broken) Approaches

#### `block.timestamp`

```solidity
// INSECURE: Miners/validators can manipulate the timestamp
uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp)));
```

- Block producers can adjust `block.timestamp` within allowed bounds (typically ~15 seconds)
- The value is known before the transaction is mined
- Anyone watching the mempool can predict the outcome

#### `block.prevrandao` (formerly `block.difficulty`)

```solidity
// INSECURE: Known before block execution
uint256 random = uint256(keccak256(abi.encodePacked(block.prevrandao)));
```

- Validators know `prevrandao` before they propose the block
- They can choose to include or exclude transactions based on the outcome
- Searchers and MEV bots can front-run transactions that depend on it

#### Blockhash-Based Randomness

```solidity
// INSECURE: Predictable within the same block
uint256 random = uint256(blockhash(block.number - 1));
```

- The blockhash is known to all participants before the next block
- Block producers can withhold blocks if the hash produces an unfavorable result

### Chainlink VRF: Better But Not Perfect

Chainlink VRF (Verifiable Random Function) provides cryptographically provable randomness:

| Feature | Chainlink VRF | FHE Randomness |
|---------|--------------|----------------|
| **Randomness quality** | Cryptographically secure | Cryptographically secure |
| **Latency** | 2+ blocks (async callback) | Same transaction (synchronous) |
| **Cost** | LINK token + gas | Gas only |
| **Privacy** | Random value is public once delivered | Random value is **encrypted** |
| **Front-running** | Value visible in callback tx | Value never visible |
| **External dependency** | Requires Chainlink oracle network | Built into the chain |

The critical difference: Chainlink VRF generates a random value that becomes **public** when delivered. FHE randomness generates a random value that remains **encrypted** — it can be used in computations without ever being revealed.

---

## 2. FHE-Based Randomness

### How It Works

FHEVM generates randomness through the TFHE (Torus Fully Homomorphic Encryption) cryptosystem built into the blockchain's execution environment. When you call a random function:

1. The FHE coprocessor generates a cryptographically secure random value
2. The value is immediately encrypted under the network's FHE public key
3. The encrypted ciphertext is returned to your contract
4. Nobody — not the validator, not the contract, not any observer — can see the plaintext value

```
┌──────────────┐     randEuint32()     ┌──────────────────┐
│   Contract    │ ────────────────────► │  FHE Coprocessor  │
│               │                       │                    │
│               │  ◄── encrypted ────── │  1. Generate random│
│   euint32     │      ciphertext       │  2. Encrypt it     │
│   (opaque)    │                       │  3. Return handle  │
└──────────────┘                       └──────────────────┘
```

### Why It Is Manipulation-Proof

- **Block producers** cannot see the random value because it is encrypted
- **Validators** cannot choose to include/exclude transactions based on the random outcome — the outcome is hidden
- **MEV bots** cannot front-run because the value is never exposed in the mempool or on-chain
- **The contract itself** cannot read the value — it can only perform encrypted operations on it
- **Observers** see only an opaque ciphertext handle, not the actual number

This is the strongest form of on-chain randomness available: the random value exists, can be used in computations, but is never visible to any party until explicitly decrypted.

---

## 3. Available Random Functions

FHEVM provides random generation functions for all major encrypted types:

### Function Reference

| Function | Return Type | Range | Description |
|----------|-------------|-------|-------------|
| `FHE.randEbool()` | `ebool` | true/false | Encrypted random boolean |
| `FHE.randEuint8()` | `euint8` | 0 – 255 | Encrypted random 8-bit integer |
| `FHE.randEuint16()` | `euint16` | 0 – 65,535 | Encrypted random 16-bit integer |
| `FHE.randEuint32()` | `euint32` | 0 – 4,294,967,295 | Encrypted random 32-bit integer |
| `FHE.randEuint64()` | `euint64` | 0 – 18,446,744,073,709,551,615 | Encrypted random 64-bit integer |
| `FHE.randEuint128()` | `euint128` | 0 – 2^128 - 1 | Encrypted random 128-bit integer |
| `FHE.randEuint256()` | `euint256` | 0 – 2^256 - 1 | Encrypted random 256-bit integer |

### Basic Usage

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint16, euint32, euint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract RandomDemo is ZamaEthereumConfig {
    euint8 private _rand8;
    euint16 private _rand16;
    euint32 private _rand32;
    euint64 private _rand64;
    ebool private _randBool;

    /// @notice Generate an encrypted random 8-bit value
    function generateRandom8() public {
        _rand8 = FHE.randEuint8();
        FHE.allowThis(_rand8);
        FHE.allow(_rand8, msg.sender);
    }

    /// @notice Generate an encrypted random 16-bit value
    function generateRandom16() public {
        _rand16 = FHE.randEuint16();
        FHE.allowThis(_rand16);
        FHE.allow(_rand16, msg.sender);
    }

    /// @notice Generate an encrypted random 32-bit value
    function generateRandom32() public {
        _rand32 = FHE.randEuint32();
        FHE.allowThis(_rand32);
        FHE.allow(_rand32, msg.sender);
    }

    /// @notice Generate an encrypted random 64-bit value
    function generateRandom64() public {
        _rand64 = FHE.randEuint64();
        FHE.allowThis(_rand64);
        FHE.allow(_rand64, msg.sender);
    }

    /// @notice Generate an encrypted random boolean
    function generateRandomBool() public {
        _randBool = FHE.randEbool();
        FHE.allowThis(_randBool);
        FHE.allow(_randBool, msg.sender);
    }
}
```

### Important Notes

- Each call to a `rand` function produces a **new independent random value**
- The returned value is an encrypted ciphertext handle — the contract cannot read it
- You **must** set ACL permissions after generation (covered in Section 5)
- Random generation is **synchronous** — the value is available in the same transaction

---

## 4. Random in Range

Raw random values span the full range of their type. In most applications, you need a value within a specific range (e.g., 1–6 for a die, 0–51 for a card deck, 0–N for an array index).

### Using `FHE.rem()` to Bound Values

The `FHE.rem()` function computes the encrypted modulo (remainder), bounding the random value:

```solidity
// Random value in range [0, max)
euint32 bounded = FHE.rem(FHE.randEuint32(), max);
```

### Common Patterns

#### Dice Roll (1–6)

```solidity
function rollDice() public returns (euint8) {
    euint8 raw = FHE.randEuint8();          // 0-255
    euint8 zeroToFive = FHE.rem(raw, 6);    // 0-5
    euint8 oneToSix = FHE.add(zeroToFive, FHE.asEuint8(1));  // 1-6
    FHE.allowThis(oneToSix);
    return oneToSix;
}
```

#### Card Draw (0–51)

```solidity
function drawCard() public returns (euint8) {
    euint8 raw = FHE.randEuint8();         // 0-255
    euint8 card = FHE.rem(raw, 52);        // 0-51
    FHE.allowThis(card);
    return card;
}
```

#### Random Index into an Array

```solidity
function pickRandomPlayer(uint32 playerCount) public returns (euint32) {
    euint32 raw = FHE.randEuint32();
    euint32 index = FHE.rem(raw, playerCount);  // 0 to playerCount-1
    FHE.allowThis(index);
    return index;
}
```

#### Random Percentage (0–99)

```solidity
function randomPercentage() public returns (euint8) {
    euint8 raw = FHE.randEuint8();
    euint8 percent = FHE.rem(raw, 100);  // 0-99
    FHE.allowThis(percent);
    return percent;
}
```

### Bounded Random Generation (Power-of-2 Ranges)

For ranges that are powers of 2, fhEVM provides more efficient overloaded functions:

```solidity
// Generate random uint32 in [0, 16) — upperBound must be power of 2!
euint32 rand = FHE.randEuint32(16);

// Generate random uint8 in [0, 4)
euint8 direction = FHE.randEuint8(4);  // 0=North, 1=East, 2=South, 3=West
```

**Available overloads:**

| Function | Range | Constraint |
|----------|-------|-----------|
| `FHE.randEuint8(uint8 upperBound)` | [0, upperBound) | upperBound must be power of 2 |
| `FHE.randEuint16(uint16 upperBound)` | [0, upperBound) | upperBound must be power of 2 |
| `FHE.randEuint32(uint32 upperBound)` | [0, upperBound) | upperBound must be power of 2 |
| `FHE.randEuint64(uint64 upperBound)` | [0, upperBound) | upperBound must be power of 2 |
| `FHE.randEuint128(uint128 upperBound)` | [0, upperBound) | upperBound must be power of 2 |
| `FHE.randEuint256(uint256 upperBound)` | [0, upperBound) | upperBound must be power of 2 |

> 💡 **When to use which?**
> - Power-of-2 range (2, 4, 8, 16, 32...) → Use `randEuintXX(upperBound)` (more efficient)
> - Arbitrary range (e.g., 1-6 for dice) → Use `FHE.rem(FHE.randEuintXX(), max)` then add offset

### Uniformity Considerations (Modulo Bias)

When the range does not evenly divide the source range, `FHE.rem()` introduces a slight **modulo bias**. For example:

- `FHE.randEuint8()` produces values 0–255 (256 possible values)
- `FHE.rem(value, 6)` maps 256 values to 6 buckets
- 256 / 6 = 42 remainder 4, so values 0–3 are slightly more likely than 4–5

| Practical impact | Details |
|-----------------|---------|
| **Small ranges (2–16)** | Bias is negligible for most applications |
| **Large ranges** | Use a larger source type (e.g., `euint32` for ranges up to ~1000) |
| **Critical fairness** | Use `euint64` as the source to minimize bias to near-zero |

**Rule of thumb:** Use a random type that is significantly larger than your target range. For a 6-sided die, `euint8` (256 values) is acceptable. For ranges above 100, prefer `euint32` or `euint64`.

---

## 5. ACL for Random Values

Like all encrypted values in FHEVM, randomly generated ciphertexts start with an **empty ACL**. You must explicitly grant permissions after generation.

### Mandatory Pattern

```solidity
euint32 random = FHE.randEuint32();
FHE.allowThis(random);           // Contract can use it in future transactions
FHE.allow(random, msg.sender);   // Caller can request decryption
```

### Why This Matters

Without `FHE.allowThis()`, the contract cannot use the random value in a subsequent transaction — any attempt to operate on it will revert. Without `FHE.allow(random, user)`, the user cannot request reencryption or decryption of the value.

### Common ACL Pattern for Random Values

```solidity
function generateAndStore() public {
    euint32 value = FHE.randEuint32();

    // Store it
    _storedValues[msg.sender] = value;

    // Grant permissions
    FHE.allowThis(value);               // Contract can use it
    FHE.allow(value, msg.sender);       // User can decrypt it
}
```

### After Operations on Random Values

If you perform operations on a random value (e.g., `FHE.rem()`, `FHE.add()`), the result is a **new ciphertext** that needs its own ACL:

```solidity
euint8 raw = FHE.randEuint8();
euint8 bounded = FHE.rem(raw, 6);
euint8 result = FHE.add(bounded, FHE.asEuint8(1));

// Only the final result needs ACL (intermediate values are transient)
FHE.allowThis(result);
FHE.allow(result, msg.sender);
```

You do not need to set ACL on intermediate values (`raw`, `bounded`) unless you store them or need them later.

---

## 6. Practical Example: Encrypted Dice Roller

A complete contract implementing a fair, manipulation-proof dice roller:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title EncryptedDiceRoller - Fair, front-running-proof dice
/// @notice Each player rolls an encrypted die. The result is hidden until decrypted.
contract EncryptedDiceRoller is ZamaEthereumConfig {

    /// @notice Stores the last dice roll for each player
    mapping(address => euint8) private _lastRoll;

    /// @notice Tracks total rolls per player
    mapping(address => uint256) public rollCount;

    /// @notice Emitted when a player rolls the dice
    event DiceRolled(address indexed player, uint256 rollNumber);

    /// @notice Roll a 6-sided die (result: 1-6, encrypted)
    function roll() external {
        // Step 1: Generate encrypted random value (0-255)
        euint8 raw = FHE.randEuint8();

        // Step 2: Bound to 0-5 using modulo
        euint8 zeroToFive = FHE.rem(raw, 6);

        // Step 3: Shift to 1-6 by adding 1
        euint8 diceResult = FHE.add(zeroToFive, FHE.asEuint8(1));

        // Step 4: Store the result
        _lastRoll[msg.sender] = diceResult;

        // Step 5: Set ACL permissions
        FHE.allowThis(diceResult);
        FHE.allow(diceResult, msg.sender);

        // Step 6: Track the roll
        rollCount[msg.sender]++;
        emit DiceRolled(msg.sender, rollCount[msg.sender]);
    }

    /// @notice Get the encrypted dice result handle (for reencryption)
    /// @dev Caller must have ACL permission (only the roller)
    function getLastRoll() external view returns (euint8) {
        require(FHE.isSenderAllowed(_lastRoll[msg.sender]), "No roll found");
        return _lastRoll[msg.sender];
    }
}
```

### How It Works

1. **`FHE.randEuint8()`** generates a random encrypted 8-bit value (0–255)
2. **`FHE.rem(raw, 6)`** reduces it to the range 0–5 (encrypted modulo)
3. **`FHE.add(..., 1)`** shifts the range to 1–6
4. The result is stored and ACL permissions are set
5. The player can later decrypt their roll via reencryption (client-side) or the contract can call `FHE.makePubliclyDecryptable()` for public reveal

Nobody — not the contract, not the validator, not other players — can see the dice result until it is explicitly decrypted.

---

## 7. Practical Example: Encrypted Lottery

The bootcamp includes a complete `EncryptedLottery.sol` contract at `contracts/EncryptedLottery.sol`. Here is how it uses encrypted randomness:

### Key Design

```solidity
/// @notice Draw a winner using encrypted randomness
function drawWinner() external onlyOwner {
    require(block.timestamp > deadline, "Lottery still open");
    require(!drawn, "Already drawn");
    require(players.length > 0, "No players");

    // Generate encrypted random index
    _winnerIndex = FHE.rem(FHE.randEuint32(), uint32(players.length));
    FHE.allowThis(_winnerIndex);
    FHE.allow(_winnerIndex, owner);

    drawn = true;
}
```

### Lottery Flow

```
1. Players buy tickets          → buyTicket() (payable)
2. Deadline passes              → No more ticket sales
3. Owner draws winner           → drawWinner() generates encrypted random index
4. Owner decrypts index         → makePubliclyDecryptable() reveals winner index
5. Owner reveals winner         → revealWinner(index) stores winner address
6. Winner claims prize          → claimPrize() sends ETH balance
```

### Why This Is Secure

| Attack Vector | Protection |
|---------------|-----------|
| Owner sees random before committing | Random is encrypted — owner cannot see it |
| Owner redraws until favorable | `drawn` flag prevents redrawing |
| Player front-runs the draw | Random is generated in the draw tx, not predictable |
| Miner/validator manipulation | Encrypted value is hidden from block producers |

The owner must commit to the draw before knowing the outcome. The encrypted random index is only revealed through `makePubliclyDecryptable()` after the draw is finalized.

---

## 8. Use Cases

### Lottery and Raffle

Select winners fairly without any party knowing the outcome until the reveal:

```solidity
euint32 winnerIndex = FHE.rem(FHE.randEuint32(), uint32(participantCount));
```

### Gaming: Dice and Cards

Generate game outcomes that cannot be predicted or manipulated:

```solidity
// Dice roll (1-6)
euint8 die = FHE.add(FHE.rem(FHE.randEuint8(), 6), FHE.asEuint8(1));

// Card draw (0-51)
euint8 card = FHE.rem(FHE.randEuint8(), 52);

// Coin flip
ebool heads = FHE.randEbool();
```

### NFT Trait Randomization

Assign random traits at mint time without revealing them until the owner chooses:

```solidity
function mint(address to) external {
    uint256 tokenId = _nextTokenId++;

    // Random traits, encrypted
    _strength[tokenId] = FHE.rem(FHE.randEuint8(), 100);    // 0-99
    _agility[tokenId] = FHE.rem(FHE.randEuint8(), 100);     // 0-99
    _rarity[tokenId] = FHE.rem(FHE.randEuint8(), 5);        // 0-4 (tiers)

    FHE.allowThis(_strength[tokenId]);
    FHE.allowThis(_agility[tokenId]);
    FHE.allowThis(_rarity[tokenId]);
    FHE.allow(_strength[tokenId], to);
    FHE.allow(_agility[tokenId], to);
    FHE.allow(_rarity[tokenId], to);
}
```

### Encrypted Random Selection

Pick a random participant from a group without revealing who is selected until needed:

```solidity
function selectRandomCommitteeMember(uint32 memberCount) external returns (euint32) {
    euint32 selected = FHE.rem(FHE.randEuint32(), memberCount);
    FHE.allowThis(selected);
    return selected;
}
```

### Shuffling (Fisher-Yates Style)

While a full encrypted shuffle is expensive, you can generate random swap indices:

```solidity
// Generate N random indices for a Fisher-Yates shuffle
function generateShuffleIndices(uint32 n) external {
    for (uint32 i = 0; i < n; i++) {
        _shuffleIndices[i] = FHE.rem(FHE.randEuint32(), n - i);
        FHE.allowThis(_shuffleIndices[i]);
    }
}
```

---

## 9. Gas Considerations

FHE operations are significantly more expensive than standard Solidity operations. Random generation is no exception.

### Relative Gas Costs by Type

| Function | Relative Cost | Recommendation |
|----------|--------------|----------------|
| `FHE.randEbool()` | Lowest | Use for binary outcomes (coin flip) |
| `FHE.randEuint8()` | Low | Use for small ranges (dice, cards, percentages) |
| `FHE.randEuint16()` | Medium | Use for medium ranges (0–65535) |
| `FHE.randEuint32()` | Higher | Use for large ranges or array indexing |
| `FHE.randEuint64()` | Highest | Use only when you need the full 64-bit range |

### Optimization Tips

**Tip 1: Use the smallest type that fits your range**

```solidity
// WASTEFUL: 64-bit random for a dice roll
euint64 die = FHE.rem(FHE.randEuint64(), 6);  // Expensive

// EFFICIENT: 8-bit random for a dice roll
euint8 die = FHE.rem(FHE.randEuint8(), 6);    // Much cheaper
```

**Tip 2: Generate once, use multiple times**

If you need multiple bounded values from the same source type, consider whether a single random generation can be split (though this must be done carefully to maintain independence).

```solidity
// Two independent rolls — two generations required
euint8 die1 = FHE.rem(FHE.randEuint8(), 6);
euint8 die2 = FHE.rem(FHE.randEuint8(), 6);
```

**Tip 3: Minimize chained operations on random values**

Each FHE operation adds gas cost. Keep the chain short:

```solidity
// Acceptable: 2 operations (rem + add)
euint8 result = FHE.add(FHE.rem(FHE.randEuint8(), 6), FHE.asEuint8(1));

// Avoid: unnecessary intermediate steps
euint8 raw = FHE.randEuint8();
euint8 temp1 = FHE.rem(raw, 12);
euint8 temp2 = FHE.div(temp1, 2);  // Extra operations (div is scalar-only)
```

**Tip 4: Use `FHE.randEbool()` for binary decisions**

```solidity
// WASTEFUL: Generating a number just to check even/odd
euint8 rand = FHE.randEuint8();
ebool isHeads = FHE.eq(FHE.rem(rand, 2), FHE.asEuint8(0));

// EFFICIENT: Direct boolean generation
ebool isHeads = FHE.randEbool();
```

---

## 10. Security Considerations

### Front-Running Prevention

In traditional randomness schemes, the random value becomes public at some point during the transaction lifecycle. MEV bots and front-runners exploit this window. With FHE randomness:

- The random value is **never in the mempool** in plaintext
- The random value is **never in calldata** (it is generated on-chain)
- The random value is **never visible in the block** until explicitly decrypted
- There is **no window of opportunity** for front-running

### Manipulation Resistance

| Actor | Traditional Randomness | FHE Randomness |
|-------|----------------------|----------------|
| Block producer | Can see value, reorder/censor txs | Cannot see value |
| Validator | Knows prevrandao, can manipulate | Cannot see value |
| MEV bot | Can front-run based on visible outcome | Nothing to front-run |
| Contract owner | Can see value in callback | Value is encrypted until decrypted |
| Other users | Can read from chain/mempool | Cannot read encrypted value |

### Commit-Reveal No Longer Needed

Traditional fair randomness often requires a **commit-reveal** pattern:

1. Players commit hashed choices
2. Wait for all commits
3. Players reveal their choices
4. Combine reveals to produce randomness

This is complex, requires multiple rounds of interaction, and fails if any player refuses to reveal. FHE randomness eliminates the need for commit-reveal entirely — the randomness is fair in a single transaction.

### Decryption Timing

The random value remains encrypted until you explicitly make it publicly decryptable or grant ACL access. Design your contract so that:

- All game-changing state updates happen **before** decryption
- The random value cannot be used to gain an advantage between generation and reveal
- Decryption results are handled carefully after reveal

---

## 11. Common Pitfalls

### Pitfall 1: Forgetting ACL After Generation

```solidity
// BUG: No ACL set — value is unusable
function broken() public {
    euint32 rand = FHE.randEuint32();
    _stored = rand;
    // Missing: FHE.allowThis(rand);
    // Next transaction using _stored will REVERT
}

// CORRECT: Always set ACL
function correct() public {
    euint32 rand = FHE.randEuint32();
    _stored = rand;
    FHE.allowThis(rand);
    FHE.allow(rand, msg.sender);
}
```

### Pitfall 2: Using a Type Larger Than Needed

```solidity
// WASTEFUL: euint64 for a coin flip
euint64 big = FHE.randEuint64();
ebool coin = FHE.ne(FHE.rem(big, 2), FHE.asEuint64(0));

// EFFICIENT: Use randEbool directly
ebool coin = FHE.randEbool();
```

### Pitfall 3: Forgetting ACL After Operations on Random Values

Operations on random values produce **new ciphertexts** that need their own ACL:

```solidity
// BUG: ACL is set on raw, not on result
euint8 raw = FHE.randEuint8();
FHE.allowThis(raw);  // ACL on the raw value

euint8 result = FHE.rem(raw, 6);
// result has a DIFFERENT handle — no ACL!
// Missing: FHE.allowThis(result);
```

### Pitfall 4: Assuming the Contract Can Read Random Values

```solidity
// IMPOSSIBLE: Contract cannot read encrypted values
function broken() public {
    euint32 rand = FHE.randEuint32();
    // You CANNOT do this:
    // uint32 value = decrypt(rand);  // No synchronous decrypt
    // if (value > 100) { ... }       // Cannot branch on encrypted values
}

// CORRECT: Use encrypted operations or makePubliclyDecryptable for reveal
function correct() public {
    euint32 rand = FHE.randEuint32();
    ebool isLarge = FHE.gt(rand, FHE.asEuint32(100));
    euint32 result = FHE.select(isLarge, rand, FHE.asEuint32(0));
    FHE.allowThis(result);
}
```

### Pitfall 5: Modulo Bias with Small Source Types

```solidity
// BIASED: 256 values mapped to 100 buckets (256 % 100 = 56)
// Values 0-55 are ~2.4% more likely than 56-99
euint8 percent = FHE.rem(FHE.randEuint8(), 100);

// BETTER: Use a larger source type for better uniformity
euint32 percent = FHE.rem(FHE.randEuint32(), 100);
// 4,294,967,296 values mapped to 100 buckets — bias is negligible
```

### Pitfall 6: Using `randomEuint32` Instead of `randEuint32`

```solidity
// WRONG: This function name does not exist
euint32 rand = FHE.randomEuint32();  // COMPILATION ERROR

// CORRECT: Use the 'rand' prefix
euint32 rand = FHE.randEuint32();
```

---

## 12. Combining Randomness with Other FHE Patterns

### Random + Conditional Logic (Module 08)

Use `FHE.select()` with random values:

```solidity
function randomReward() public {
    euint32 roll = FHE.rem(FHE.randEuint32(), 100);
    euint32 threshold = FHE.asEuint32(10);  // 10% chance

    ebool isRare = FHE.lt(roll, threshold);
    euint32 reward = FHE.select(isRare, FHE.asEuint32(1000), FHE.asEuint32(100));

    _rewards[msg.sender] = FHE.add(_rewards[msg.sender], reward);
    FHE.allowThis(_rewards[msg.sender]);
    FHE.allow(_rewards[msg.sender], msg.sender);
}
```

### Random + Encrypted Input (Module 06)

Combine user input with randomness:

```solidity
function playGame(externalEuint8 encryptedGuess, bytes calldata inputProof) external {
    euint8 guess = FHE.fromExternal(encryptedGuess, inputProof);
    euint8 target = FHE.rem(FHE.randEuint8(), 10);  // 0-9

    ebool correct = FHE.eq(guess, target);
    _results[msg.sender] = correct;
    FHE.allowThis(correct);
    FHE.allow(correct, msg.sender);
}
```

### Random + Decryption (Module 07)

Make a random result publicly decryptable or share via ACL:

```solidity
contract RevealableRandom is ZamaEthereumConfig {
    euint32 private _encryptedResult;
    bool public revealed;

    function generate() public {
        _encryptedResult = FHE.rem(FHE.randEuint32(), 100);
        FHE.allowThis(_encryptedResult);
        FHE.allow(_encryptedResult, msg.sender);
    }

    function revealPublicly() public {
        FHE.makePubliclyDecryptable(_encryptedResult);
        revealed = true;
    }
}
```

After `makePubliclyDecryptable()`, any user can decrypt the result client-side via reencryption.

---

## Summary

| Concept | Details |
|---------|---------|
| **`FHE.randEbool()`** | Encrypted random boolean (true/false) |
| **`FHE.randEuint8()`** | Encrypted random 8-bit integer (0–255) |
| **`FHE.randEuint16()`** | Encrypted random 16-bit integer (0–65,535) |
| **`FHE.randEuint32()`** | Encrypted random 32-bit integer (0–4.29B) |
| **`FHE.randEuint64()`** | Encrypted random 64-bit integer (0–18.4Q) |
| **`FHE.randEuint128()`** | Encrypted random 128-bit integer (0–2^128-1) |
| **`FHE.randEuint256()`** | Encrypted random 256-bit integer (0–2^256-1) |
| **`FHE.rem(value, max)`** | Bound random to range [0, max) |
| **ACL required** | Always call `FHE.allowThis()` and `FHE.allow()` after generation |
| **Synchronous** | Random values available in the same transaction |
| **Encrypted** | Nobody can see the value until explicitly decrypted |
| **Manipulation-proof** | Block producers, validators, MEV bots cannot exploit the value |
| **Use smallest type** | `euint8` for small ranges, `euint64` only when needed |
| **Modulo bias** | Negligible when source type is much larger than the range |

**Key principles:**
1. FHE randomness is the strongest on-chain randomness — values are encrypted at creation
2. Use `FHE.rem()` to bound values to a specific range
3. Always set ACL permissions on generated random values
4. Choose the smallest type that fits your use case for gas efficiency
5. Operations on random values produce new ciphertexts — set ACL on the final result
6. Combine with `FHE.select()` for conditional logic and Gateway for decryption
