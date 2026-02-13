# Module 13: Sealed-Bid Auction

> Build a sealed-bid auction where bids are encrypted, preventing front-running and enabling fair price discovery.

| | |
|---|---|
| **Level** | Advanced |
| **Duration** | 4h |
| **Prerequisites** | Modules 01-12 |

## Learning Objectives

By the end of this module, you will be able to:

1. Design a sealed-bid auction contract with encrypted bids
2. Track the highest bid using encrypted comparisons (`FHE.gt()`)
3. Update the winning bid atomically with `FHE.select()`
4. Implement time-bounded bidding with reveal/claim phases
5. Handle bid deposits and refunds securely
6. Understand the privacy advantages over traditional auction designs

## Contents

- [Lesson](./lesson.md)
- [Slides](./slides/slides.md)
- Contracts: [SealedBidAuction.sol](../../contracts/SealedBidAuction.sol)
- Tests: [SealedBidAuction.test.ts](../../test/SealedBidAuction.test.ts)
- [Exercise](./exercise.md)
- [Quiz](./quiz.md)

## Key Concepts

- **Sealed Bids** -- Bids are encrypted; no bidder knows what others bid
- **Encrypted Comparisons** -- `FHE.gt()` compares bids without revealing values
- **Highest Bid Tracking** -- `FHE.select()` updates the winner based on encrypted comparisons
- **No Front-Running** -- Bids are hidden, so MEV bots cannot exploit them
- **Claim Phase** -- After bidding ends, the winner is determined and can claim

## Next Module

> [Module 14: Capstone -- Confidential DAO](../14-capstone/)
