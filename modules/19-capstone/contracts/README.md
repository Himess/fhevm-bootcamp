# Module 19: Capstone Reference Contracts

The reference implementation for the Confidential DAO capstone project is located in the project root:

- **Contract:** [`contracts/ConfidentialDAO.sol`](../../../contracts/ConfidentialDAO.sol)
- **Test:** [`test/ConfidentialDAO.test.ts`](../../../test/ConfidentialDAO.test.ts)

## How to Use

The root contract provides a simplified but complete implementation that demonstrates:

1. **Encrypted governance tokens** -- Mint and track token balances using `euint64`
2. **Proposal creation** -- Treasury spending proposals with deadlines
3. **Private voting** -- Encrypted votes using `externalEuint8` with `FHE.fromExternal()`
4. **Vote tallying** -- Encrypted yes/no counters using `FHE.select()` and `FHE.add()`
5. **Treasury management** -- ETH funding via `receive()` and balance tracking

Run the tests:
```bash
npx hardhat test test/ConfidentialDAO.test.ts
```

## Exercise

See [../exercise.md](../exercise.md) for the full capstone exercise with starter code, hints, and bonus challenges.
