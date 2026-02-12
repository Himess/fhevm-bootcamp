# Module 09: Exercise — On-Chain Encrypted Randomness

## Objective

Build a series of contracts that use FHEVM's encrypted random number generation. You will implement a dice roller, a random pair generator, a coin flip mechanism, and an encrypted lottery system. All random values must remain encrypted and use proper ACL permissions.

---

## Task 1: Encrypted Dice Roller

Create a contract that simulates rolling a fair six-sided die. The result (1 through 6) must remain encrypted until the roller chooses to decrypt it.

### Requirements

1. Generate a random `euint8` using `FHE.randEuint8()`
2. Use `FHE.rem()` with `6` to get a value in `[0, 5]`
3. Use `FHE.add()` with plaintext `1` to shift the range to `[1, 6]`
4. Store the result per player and grant ACL to both the contract and the caller

### Starter Code

#### `contracts/EncryptedDiceRoller.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedDiceRoller is ZamaEthereumConfig {
    mapping(address => euint8) private _lastRoll;
    mapping(address => uint256) private _rollCount;

    event DiceRolled(address indexed player, uint256 rollNumber);

    /// @notice Roll a fair six-sided die. Result is encrypted.
    function roll() public {
        // TODO Step 1: Generate a random euint8
        // euint8 random = FHE.randEuint8();

        // TODO Step 2: Constrain to range [0, 5] using FHE.rem()
        // euint8 zeroToFive = FHE.rem(random, ...);

        // TODO Step 3: Shift to range [1, 6] using FHE.add() with plaintext 1
        // euint8 diceResult = FHE.add(zeroToFive, ...);

        // TODO Step 4: Store the result
        // _lastRoll[msg.sender] = diceResult;

        // TODO Step 5: Set ACL permissions
        // FHE.allowThis(diceResult);
        // FHE.allow(diceResult, msg.sender);

        // TODO Step 6: Update roll count and emit event
        // _rollCount[msg.sender]++;
        // emit DiceRolled(msg.sender, _rollCount[msg.sender]);
    }

    /// @notice Get your last dice roll (encrypted). Only callable by the roller.
    function getLastRoll() public view returns (euint8) {
        require(FHE.isSenderAllowed(_lastRoll[msg.sender]), "No access");
        return _lastRoll[msg.sender];
    }

    /// @notice Get total number of rolls for a player (plaintext).
    function getRollCount(address player) public view returns (uint256) {
        return _rollCount[player];
    }
}
```

<details>
<summary>Hint 1: Generating and constraining the random value</summary>

```solidity
euint8 random = FHE.randEuint8();
euint8 zeroToFive = FHE.rem(random, 6);
euint8 diceResult = FHE.add(zeroToFive, 1);
```

`FHE.rem(value, 6)` returns a value in `[0, 5]`. Adding `1` shifts it to `[1, 6]`, which maps to a standard die face.
</details>

<details>
<summary>Hint 2: Complete roll() implementation</summary>

```solidity
function roll() public {
    euint8 random = FHE.randEuint8();
    euint8 zeroToFive = FHE.rem(random, 6);
    euint8 diceResult = FHE.add(zeroToFive, 1);

    _lastRoll[msg.sender] = diceResult;

    FHE.allowThis(diceResult);
    FHE.allow(diceResult, msg.sender);

    _rollCount[msg.sender]++;
    emit DiceRolled(msg.sender, _rollCount[msg.sender]);
}
```
</details>

---

## Task 2: Random Pair Generator

Create a contract that generates two independent encrypted random `euint32` values as a pair. This simulates scenarios like rolling two dice, generating coordinate pairs, or creating paired random attributes.

### Requirements

1. Generate two independent `euint32` random values using separate `FHE.randEuint32()` calls
2. Store both values per user
3. Grant ACL permissions for both values to the contract and the caller
4. Provide a way for the user to retrieve each value independently

### Starter Code

#### `contracts/RandomPairGenerator.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract RandomPairGenerator is ZamaEthereumConfig {
    struct RandomPair {
        euint32 first;
        euint32 second;
        bool exists;
    }

    mapping(address => RandomPair) private _pairs;

    event PairGenerated(address indexed user);

    /// @notice Generate a new random pair of euint32 values.
    function generatePair() public {
        // TODO Step 1: Generate first random euint32
        // euint32 val1 = FHE.randEuint32();

        // TODO Step 2: Generate second random euint32 (independent)
        // euint32 val2 = FHE.randEuint32();

        // TODO Step 3: Store the pair
        // _pairs[msg.sender] = RandomPair(val1, val2, true);

        // TODO Step 4: Set ACL for both values
        // FHE.allowThis(val1);
        // FHE.allow(val1, msg.sender);
        // FHE.allowThis(val2);
        // FHE.allow(val2, msg.sender);

        // TODO Step 5: Emit event
        // emit PairGenerated(msg.sender);
    }

    /// @notice Retrieve the first value of your random pair.
    function getFirst() public view returns (euint32) {
        require(_pairs[msg.sender].exists, "No pair generated");
        require(FHE.isSenderAllowed(_pairs[msg.sender].first), "No access");
        return _pairs[msg.sender].first;
    }

    /// @notice Retrieve the second value of your random pair.
    function getSecond() public view returns (euint32) {
        require(_pairs[msg.sender].exists, "No pair generated");
        require(FHE.isSenderAllowed(_pairs[msg.sender].second), "No access");
        return _pairs[msg.sender].second;
    }

    /// @notice Check if a user has a generated pair.
    function hasPair(address user) public view returns (bool) {
        return _pairs[user].exists;
    }
}
```

<details>
<summary>Hint 1: Why two separate calls?</summary>

Each call to `FHE.randEuint32()` generates an independent encrypted random value. Calling it twice in the same function produces two unrelated values, similar to rolling two separate dice. There is no correlation between the two outputs.
</details>

<details>
<summary>Hint 2: Complete generatePair() implementation</summary>

```solidity
function generatePair() public {
    euint32 val1 = FHE.randEuint32();
    euint32 val2 = FHE.randEuint32();

    _pairs[msg.sender] = RandomPair(val1, val2, true);

    FHE.allowThis(val1);
    FHE.allow(val1, msg.sender);
    FHE.allowThis(val2);
    FHE.allow(val2, msg.sender);

    emit PairGenerated(msg.sender);
}
```

Note: You must set ACL for each encrypted value individually. There is no batch ACL function.
</details>

---

## Task 3: Encrypted Coin Flip

Implement a coin flip contract that returns an encrypted boolean result. The contract should support two approaches: using `FHE.randEbool()` directly, and using `FHE.randEuint8()` with modulo 2 as an alternative.

### Requirements

1. Primary method: use `FHE.randEbool()` to generate a random encrypted boolean
2. Alternative method: use `FHE.randEuint8()`, apply `FHE.rem()` with `2`, then convert to `ebool` using `FHE.ne()` with `0`
3. Store the result per player with proper ACL
4. Track flip history count per player

### Starter Code

#### `contracts/EncryptedCoinFlip.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedCoinFlip is ZamaEthereumConfig {
    mapping(address => ebool) private _lastFlip;
    mapping(address => uint256) private _flipCount;
    mapping(address => bool) private _hasFlipped;

    event CoinFlipped(address indexed player, uint256 flipNumber);

    /// @notice Flip a coin using FHE.randEbool(). Result is encrypted.
    function flipDirect() public {
        // TODO Step 1: Generate random ebool directly
        // ebool result = FHE.randEbool();

        // TODO Step 2: Store result
        // _lastFlip[msg.sender] = result;
        // _hasFlipped[msg.sender] = true;

        // TODO Step 3: Set ACL
        // FHE.allowThis(result);
        // FHE.allow(result, msg.sender);

        // TODO Step 4: Update count and emit
        // _flipCount[msg.sender]++;
        // emit CoinFlipped(msg.sender, _flipCount[msg.sender]);
    }

    /// @notice Flip a coin using FHE.randEuint8() + FHE.rem() + FHE.ne().
    function flipViaModulo() public {
        // TODO Step 1: Generate random euint8
        // euint8 random = FHE.randEuint8();

        // TODO Step 2: Get 0 or 1 via modulo
        // euint8 zeroOrOne = FHE.rem(random, 2);

        // TODO Step 3: Convert to ebool (0 -> false, 1 -> true)
        // ebool result = FHE.ne(zeroOrOne, 0);

        // TODO Step 4: Store result
        // _lastFlip[msg.sender] = result;
        // _hasFlipped[msg.sender] = true;

        // TODO Step 5: Set ACL
        // FHE.allowThis(result);
        // FHE.allow(result, msg.sender);

        // TODO Step 6: Update count and emit
        // _flipCount[msg.sender]++;
        // emit CoinFlipped(msg.sender, _flipCount[msg.sender]);
    }

    /// @notice Get your last coin flip result (encrypted boolean).
    function getLastFlip() public view returns (ebool) {
        require(_hasFlipped[msg.sender], "No flip yet");
        require(FHE.isSenderAllowed(_lastFlip[msg.sender]), "No access");
        return _lastFlip[msg.sender];
    }

    /// @notice Get total number of flips for a player.
    function getFlipCount(address player) public view returns (uint256) {
        return _flipCount[player];
    }
}
```

<details>
<summary>Hint 1: FHE.randEbool() vs modulo approach</summary>

`FHE.randEbool()` is the simplest approach and directly returns an `ebool`. The modulo approach (`FHE.randEuint8()` + `FHE.rem(..., 2)` + `FHE.ne(..., 0)`) is more verbose but demonstrates how to convert between encrypted types. The direct approach is preferred for production use.
</details>

<details>
<summary>Hint 2: Complete flipDirect() implementation</summary>

```solidity
function flipDirect() public {
    ebool result = FHE.randEbool();

    _lastFlip[msg.sender] = result;
    _hasFlipped[msg.sender] = true;

    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    _flipCount[msg.sender]++;
    emit CoinFlipped(msg.sender, _flipCount[msg.sender]);
}
```
</details>

<details>
<summary>Hint 3: Complete flipViaModulo() implementation</summary>

```solidity
function flipViaModulo() public {
    euint8 random = FHE.randEuint8();
    euint8 zeroOrOne = FHE.rem(random, 2);
    ebool result = FHE.ne(zeroOrOne, 0);

    _lastFlip[msg.sender] = result;
    _hasFlipped[msg.sender] = true;

    FHE.allowThis(result);
    FHE.allow(result, msg.sender);

    _flipCount[msg.sender]++;
    emit CoinFlipped(msg.sender, _flipCount[msg.sender]);
}
```

The key insight: `FHE.ne(zeroOrOne, 0)` returns an `ebool` that is encrypted `true` when `zeroOrOne` is 1, and encrypted `false` when it is 0.
</details>

---

## Task 4: Encrypted Lottery

Build a full encrypted lottery contract. Players enter the lottery and receive encrypted ticket numbers. When the lottery closes, a random encrypted winner index is generated. The winner can only be revealed through a controlled decryption process.

### Requirements

1. Players enter the lottery; each receives an encrypted `euint32` ticket number via `FHE.randEuint32()`
2. The contract owner can close entry and trigger winner selection
3. Winner selection uses `FHE.randEuint32()` with `FHE.rem()` based on the number of participants
4. The encrypted winner index is stored and can only be revealed by the owner
5. Proper ACL on all encrypted values

### Starter Code

#### `contracts/EncryptedLottery.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedLottery is ZamaEthereumConfig {
    address public owner;
    bool public isOpen;
    bool public winnerSelected;

    address[] public players;
    mapping(address => euint32) private _tickets;
    mapping(address => bool) private _hasEntered;

    euint32 private _winnerIndex;

    event LotteryOpened();
    event PlayerEntered(address indexed player, uint256 playerCount);
    event LotteryClosed(uint256 totalPlayers);
    event WinnerSelected();

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        isOpen = false;
        winnerSelected = false;
    }

    /// @notice Owner opens the lottery for entries.
    function openLottery() public onlyOwner {
        require(!isOpen, "Already open");
        require(!winnerSelected, "Lottery already completed");

        // Reset state for a new round
        for (uint256 i = 0; i < players.length; i++) {
            _hasEntered[players[i]] = false;
        }
        delete players;

        isOpen = true;
        winnerSelected = false;
        emit LotteryOpened();
    }

    /// @notice Enter the lottery. Each player gets an encrypted random ticket number.
    function enter() public {
        require(isOpen, "Lottery not open");
        require(!_hasEntered[msg.sender], "Already entered");

        // TODO Step 1: Generate a random encrypted ticket number for the player
        // euint32 ticket = FHE.randEuint32();

        // TODO Step 2: Store the ticket
        // _tickets[msg.sender] = ticket;

        // TODO Step 3: Set ACL so the contract and the player can access the ticket
        // FHE.allowThis(ticket);
        // FHE.allow(ticket, msg.sender);

        // TODO Step 4: Register the player
        // _hasEntered[msg.sender] = true;
        // players.push(msg.sender);

        // emit PlayerEntered(msg.sender, players.length);
    }

    /// @notice Owner closes the lottery and selects a winner.
    function closeLotteryAndPickWinner() public onlyOwner {
        require(isOpen, "Lottery not open");
        require(players.length >= 2, "Need at least 2 players");

        isOpen = false;
        emit LotteryClosed(players.length);

        // TODO Step 5: Generate a random value for winner selection
        // euint32 randomValue = FHE.randEuint32();

        // TODO Step 6: Use FHE.rem() to get an index in [0, players.length)
        // _winnerIndex = FHE.rem(randomValue, uint32(players.length));

        // TODO Step 7: Set ACL for the winner index
        // FHE.allowThis(_winnerIndex);
        // FHE.allow(_winnerIndex, owner);

        // winnerSelected = true;
        // emit WinnerSelected();
    }

    /// @notice Get your encrypted ticket number.
    function getMyTicket() public view returns (euint32) {
        require(_hasEntered[msg.sender], "Not entered");
        require(FHE.isSenderAllowed(_tickets[msg.sender]), "No access");
        return _tickets[msg.sender];
    }

    /// @notice Get the encrypted winner index (owner only, for decryption via gateway).
    function getWinnerIndex() public view returns (euint32) {
        require(winnerSelected, "Winner not selected");
        require(FHE.isSenderAllowed(_winnerIndex), "No access");
        return _winnerIndex;
    }

    /// @notice Get the total number of players.
    function getPlayerCount() public view returns (uint256) {
        return players.length;
    }

    /// @notice Get a player address by index (for resolving winner after decryption).
    function getPlayer(uint256 index) public view returns (address) {
        require(index < players.length, "Index out of bounds");
        return players[index];
    }
}
```

<details>
<summary>Hint 1: Ticket generation in enter()</summary>

```solidity
function enter() public {
    require(isOpen, "Lottery not open");
    require(!_hasEntered[msg.sender], "Already entered");

    euint32 ticket = FHE.randEuint32();
    _tickets[msg.sender] = ticket;

    FHE.allowThis(ticket);
    FHE.allow(ticket, msg.sender);

    _hasEntered[msg.sender] = true;
    players.push(msg.sender);

    emit PlayerEntered(msg.sender, players.length);
}
```

Each player receives a unique encrypted random ticket number. The ticket is stored in a mapping and ACL is granted so the player can later request decryption.
</details>

<details>
<summary>Hint 2: Winner selection in closeLotteryAndPickWinner()</summary>

```solidity
function closeLotteryAndPickWinner() public onlyOwner {
    require(isOpen, "Lottery not open");
    require(players.length >= 2, "Need at least 2 players");

    isOpen = false;
    emit LotteryClosed(players.length);

    euint32 randomValue = FHE.randEuint32();
    _winnerIndex = FHE.rem(randomValue, uint32(players.length));

    FHE.allowThis(_winnerIndex);
    FHE.allow(_winnerIndex, owner);

    winnerSelected = true;
    emit WinnerSelected();
}
```

The winner index is an encrypted `euint32` in the range `[0, players.length)`. Nobody, including the owner, knows the winner until the encrypted index is decrypted through the FHEVM gateway. The owner is granted ACL so they can initiate the decryption request.
</details>

<details>
<summary>Hint 3: Resolving the winner after decryption</summary>

After the owner decrypts `_winnerIndex` through the gateway and obtains the plaintext index value, they can call `getPlayer(index)` to find the winner's address. The full flow is:

1. Owner calls `closeLotteryAndPickWinner()` -- generates encrypted winner index
2. Owner requests decryption of `_winnerIndex` via the FHEVM gateway
3. Gateway callback returns the plaintext index (e.g., `3`)
4. Owner calls `getPlayer(3)` to get the winner's address

This two-phase approach ensures the winner cannot be known until the explicit reveal step.
</details>

---

## Bonus Challenges

1. **Bounded Dice Roller** -- Modify the dice roller to accept a custom number of sides (e.g., D4, D8, D12, D20) as a parameter to `roll(uint8 sides)`.

2. **Multi-Round Lottery** -- Extend the lottery to support multiple rounds, storing the winner of each round in an array and allowing the owner to start new rounds after each draw.

3. **Random Team Assignment** -- Create a contract that randomly assigns `N` players into two encrypted teams. Use `FHE.randEbool()` for each player to decide their team (true = Team A, false = Team B).

---

## Success Criteria

- [ ] **Task 1:** `EncryptedDiceRoller` compiles and `roll()` generates values in the range `[1, 6]`
- [ ] **Task 1:** ACL is correctly set for both the contract (`FHE.allowThis`) and the caller (`FHE.allow`)
- [ ] **Task 2:** `RandomPairGenerator` generates two independent `euint32` values per call
- [ ] **Task 2:** Both values have individual ACL permissions set
- [ ] **Task 3:** `EncryptedCoinFlip` implements both `flipDirect()` and `flipViaModulo()`
- [ ] **Task 3:** `flipViaModulo()` correctly converts from `euint8` to `ebool` using `FHE.ne()`
- [ ] **Task 4:** `EncryptedLottery` assigns encrypted tickets to players on entry
- [ ] **Task 4:** Winner selection uses `FHE.randEuint32()` with `FHE.rem()` based on player count
- [ ] **Task 4:** Winner index ACL is granted to the owner for decryption
- [ ] **All Tasks:** No use of `TFHE` library (use `FHE` only)
- [ ] **All Tasks:** Correct function names (`FHE.randEuint32()`, NOT `FHE.randomEuint32()`)
- [ ] **All Tasks:** All contracts inherit `ZamaEthereumConfig`
- [ ] **All Tasks:** All encrypted values have proper ACL permissions before storage
