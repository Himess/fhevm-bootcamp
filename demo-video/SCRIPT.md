# FHEVM Bootcamp - Demo Video Script

## Target Duration: ~5 minutes

### Scene 1: Introduction (30s)
- Show project title and description
- "A comprehensive 15-module bootcamp for building confidential smart contracts with Zama's fhEVM"
- Key stats: 22 contracts, 146+ tests, 15 modules

### Scene 2: Repository Structure (1 min)
- Walk through the directory structure
- Show modules/, contracts/, test/, resources/
- Highlight the curriculum design: Foundation → Core → Applications → Advanced

### Scene 3: Build & Test (30s)
- Terminal: `npm install`
- Terminal: `npx hardhat compile` → "22 contracts compiled"
- Terminal: `npx hardhat test` → "146 passing"

### Scene 4: Module Walkthrough (2 min)
- Pick Module 06 (Encrypted Inputs) as example
- Show lesson.md → key concepts
- Show slides/ → presentation-ready
- Show exercise.md → hands-on practice
- Show quiz.md → assessment
- Show the actual SecureInput.sol contract
- Show the test file running

### Scene 5: ConfidentialERC20 Deep Dive (1 min)
- Show ConfidentialERC20.sol
- Explain the FHE.select pattern (no-revert transfer)
- Show the test proving transfers work with encrypted balances
- Highlight: "All balances encrypted, transfers never revert"

### Scene 6: Key Features Recap (30s)
- 15 progressive modules (prerequisites → capstone)
- Real working contracts with 146+ passing tests
- Complete curriculum: lessons, slides, exercises, quizzes
- On-chain tested on Ethereum Sepolia
- Covers: encrypted types, operations, ACL, inputs, decryption, ERC20, voting, auctions
