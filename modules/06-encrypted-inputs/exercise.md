# Module 06: Exercise — Encrypted Voting System

## Objective

Build an encrypted voting contract where voters submit their choices using client-side encryption (`externalEuint8`), ensuring that individual votes remain completely private.

---

## Task: PrivateVoting

Create a voting contract with the following features:

1. An owner registers candidates (up to 4 candidates, IDs 0-3)
2. Voters submit encrypted votes using `externalEuint8`
3. Each voter can only vote once
4. The contract tallies votes per candidate using encrypted counters
5. The vote tallies can only be revealed after the voting period ends

---

## Starter Code

### `contracts/PrivateVoting.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint32, ebool, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract PrivateVoting is ZamaEthereumConfig {
    address public owner;
    bool public votingOpen;
    uint8 public candidateCount;

    mapping(address => bool) private _hasVoted;
    mapping(address => ebool) private _encryptedHasVoted;

    // Encrypted vote tallies per candidate
    euint32 private _tally0;
    euint32 private _tally1;
    euint32 private _tally2;
    euint32 private _tally3;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(uint8 _candidateCount) {
        require(_candidateCount >= 2 && _candidateCount <= 4, "2-4 candidates");
        owner = msg.sender;
        candidateCount = _candidateCount;
        votingOpen = true;

        // TODO: Initialize all tally counters to encrypted 0
        // TODO: FHE.allowThis() for each tally
    }

    /// @notice Cast an encrypted vote
    /// @param encryptedVote Client-encrypted candidate ID (0 to candidateCount-1)
    /// @param inputProof The ZK proof for the encrypted input
    function vote(externalEuint8 encryptedVote, bytes calldata inputProof) external {
        require(votingOpen, "Voting closed");
        require(!_hasVoted[msg.sender], "Already voted");

        // TODO: Convert external input using FHE.fromExternal(encryptedVote, inputProof)

        // TODO: For each candidate, check if vote == candidateId using FHE.eq()
        // TODO: If match, increment that candidate's tally by 1 using FHE.add() + FHE.select()

        // Mark as voted
        _hasVoted[msg.sender] = true;

        // TODO: FHE.allowThis() for all updated tallies
    }

    function closeVoting() public onlyOwner {
        votingOpen = false;
    }

    /// @notice Get encrypted tally for a candidate (only after voting closes)
    function getTally(uint8 candidateId) public view returns (euint32) {
        require(!votingOpen, "Voting still open");
        require(candidateId < candidateCount, "Invalid candidate");

        // TODO: Return the appropriate tally based on candidateId
    }
}
```

---

## Step-by-Step Instructions

1. **Constructor**: Initialize `_tally0` through `_tally3` with `FHE.asEuint32(0)` and call `FHE.allowThis()` for each.

2. **`vote` function**:
   - Convert the external input: `euint8 v = FHE.fromExternal(encryptedVote, inputProof);`
   - For each candidate `i`, check if the vote matches: `ebool isCandidate_i = FHE.eq(v, FHE.asEuint8(i));`
   - Create an encrypted 1 or 0 based on the match: `euint32 increment = FHE.select(isCandidate_i, FHE.asEuint32(1), FHE.asEuint32(0));`
   - Add to the tally: `_tally_i = FHE.add(_tally_i, increment);`
   - Call `FHE.allowThis()` for each updated tally

3. **`getTally`**: Use if/else on the candidateId to return the correct tally variable.

---

## Hints

<details>
<summary>Hint 1: Constructor initialization</summary>

```solidity
_tally0 = FHE.asEuint32(0);
_tally1 = FHE.asEuint32(0);
_tally2 = FHE.asEuint32(0);
_tally3 = FHE.asEuint32(0);
FHE.allowThis(_tally0);
FHE.allowThis(_tally1);
FHE.allowThis(_tally2);
FHE.allowThis(_tally3);
```
</details>

<details>
<summary>Hint 2: Vote tallying logic</summary>

```solidity
euint8 v = FHE.fromExternal(encryptedVote, inputProof);

euint32 one = FHE.asEuint32(1);
euint32 zero = FHE.asEuint32(0);

ebool is0 = FHE.eq(v, FHE.asEuint8(0));
_tally0 = FHE.add(_tally0, FHE.select(is0, one, zero));

ebool is1 = FHE.eq(v, FHE.asEuint8(1));
_tally1 = FHE.add(_tally1, FHE.select(is1, one, zero));

ebool is2 = FHE.eq(v, FHE.asEuint8(2));
_tally2 = FHE.add(_tally2, FHE.select(is2, one, zero));

ebool is3 = FHE.eq(v, FHE.asEuint8(3));
_tally3 = FHE.add(_tally3, FHE.select(is3, one, zero));

FHE.allowThis(_tally0);
FHE.allowThis(_tally1);
FHE.allowThis(_tally2);
FHE.allowThis(_tally3);
```
</details>

<details>
<summary>Hint 3: getTally function</summary>

```solidity
function getTally(uint8 candidateId) public view returns (euint32) {
    require(!votingOpen, "Voting still open");
    require(candidateId < candidateCount, "Invalid candidate");
    if (candidateId == 0) return _tally0;
    if (candidateId == 1) return _tally1;
    if (candidateId == 2) return _tally2;
    return _tally3;
}
```
</details>

---

## Client-Side Integration Code

```javascript
// Encrypting a vote for candidate 2
const input = await instance.input.createEncryptedInput(
    contractAddress,
    userAddress
);
input.add8(2); // Vote for candidate 2
const encrypted = await input.encrypt();

const tx = await contract.vote(
    encrypted.handles[0],
    encrypted.inputProof
);
await tx.wait();
```

---

## Bonus Challenges

1. **Add voter registration** — Only pre-registered addresses can vote. The owner calls `registerVoter(address)` before voting starts.

2. **Add encrypted voter tracking** — Instead of a plaintext `_hasVoted` mapping, store an `ebool` so that even the fact of whether someone voted is encrypted.

3. **Support up to 8 candidates** — Refactor the tallying to use a loop-friendly pattern or an array approach.

---

## Success Criteria

- [ ] Contract compiles without errors
- [ ] `vote` accepts `externalEuint8` and `bytes calldata inputProof` parameters
- [ ] `FHE.fromExternal(input, inputProof)` is used to convert the input
- [ ] Each candidate's tally is correctly incremented based on the encrypted vote
- [ ] `FHE.allowThis()` is called for all updated tallies
- [ ] Tallies are only accessible after voting closes
- [ ] Each voter can only vote once
