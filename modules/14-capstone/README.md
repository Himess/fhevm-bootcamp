# Module 14: Capstone -- Confidential DAO

> Combine everything you have learned into a comprehensive Confidential DAO with encrypted governance tokens, private voting, and treasury management.

| | |
|---|---|
| **Level** | Advanced |
| **Duration** | 5h |
| **Prerequisites** | Modules 00-13 |

## Learning Objectives

By the end of this module, you will be able to:

1. Architect a multi-contract confidential DAO system
2. Integrate a confidential ERC-20 governance token with private voting
3. Implement weighted voting based on encrypted token balances
4. Build a treasury management system with encrypted proposals
5. Handle cross-contract ACL permissions for encrypted data
6. Deploy and interact with the complete DAO from a frontend

## Contents

- [Lesson](./lesson.md)
- [Slides](./slides/slides.md)
- Contracts: [ConfidentialDAO.sol](../../contracts/ConfidentialDAO.sol)
- Tests: [ConfidentialDAO.test.ts](../../test/ConfidentialDAO.test.ts)
- [Exercise](./exercise.md)
- [Quiz](./quiz.md)

## Key Concepts

- **Governance Token** -- Confidential ERC-20 that determines voting power
- **Private Voting** -- Weighted votes based on encrypted token balances
- **Treasury Management** -- Proposals to spend DAO funds, approved by private vote
- **Cross-Contract ACL** -- Allowing the DAO contract to read token balances
- **Proposal Lifecycle** -- Create, vote, finalize, execute
- **Snapshot Balances** -- Locking voting power at proposal creation time

## Next Steps

After completing this capstone, you have mastered FHEVM development. Consider:
- Contributing to Zama's open-source repositories
- Building your own confidential dApp
- Exploring advanced FHE patterns and optimizations
