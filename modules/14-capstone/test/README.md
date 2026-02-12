# Module 14: Capstone Tests

The reference test suite is located at the project root:

- [`test/ConfidentialDAO.test.ts`](../../../test/ConfidentialDAO.test.ts)

Run with:
```bash
npx hardhat test test/ConfidentialDAO.test.ts
```

The test suite covers:
- DAO creation and naming
- Proposal creation with description, recipient, and amount
- Encrypted voting with FHE input
- Duplicate vote prevention
- Treasury funding
- Yes/no vote handle tracking
