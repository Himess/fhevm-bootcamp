# Module 12: Confidential Voting

> Build a private voting system where votes are encrypted and tallies remain hidden until the election ends.

| | |
|---|---|
| **Level** | Intermediate |
| **Duration** | 3h |
| **Prerequisites** | Modules 01-11 |

## Learning Objectives

By the end of this module, you will be able to:

1. Design a confidential voting contract with encrypted tallies
2. Prevent duplicate voting using on-chain mappings
3. Use `FHE.select()` for privacy-preserving vote counting
4. Implement time-bounded voting with start/end phases
5. Decrypt final results only after the voting period ends
6. Understand the privacy guarantees and limitations of encrypted voting

## Contents

- [Lesson](./lesson.md)
- [Slides](./slides/slides.md)
- Contracts: [ConfidentialVoting.sol](../../contracts/ConfidentialVoting.sol)
- Tests: [ConfidentialVoting.test.ts](../../test/ConfidentialVoting.test.ts)
- [Exercise](./exercise.md)
- [Quiz](./quiz.md)

## Key Concepts

- **Encrypted Tallies** -- Vote counts stored as `euint64`, invisible during voting
- **Duplicate Prevention** -- `mapping(address => bool)` tracks who has voted
- **`FHE.select()` for Vote Counting** -- Add 1 to the chosen option, 0 to others
- **Time-Bounded Voting** -- Start and end timestamps control the voting window
- **Post-Election Decryption** -- Tallies are only decryptable after voting closes

## Next Module

> [Module 13: Sealed-Bid Auction](../13-project-auction/)
