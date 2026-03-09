# FHEVM Bootcamp - Demo Video Script

## Target Duration: ~5 minutes

### Scene 1: Introduction (30s)
- Show project title on Vercel site: https://fhevm-bootcamp-demo.vercel.app
- "A comprehensive 20-module bootcamp for building confidential smart contracts with Zama's fhEVM"
- Key stats: 38 contracts, 360 tests, 20 modules, 215 quiz questions, ~63 hours
- Click "Try Interactive Demo" button in hero section

### Scene 2: Interactive Demo (45s)
- Show the "Encryption Flow" tab — walk through the 6-step fhevmjs pipeline
  - Step 1: Initialize fhevmjs (WASM loading)
  - Step 4: Encrypt & Get Handles (show code + output)
  - Step 5: Send to Contract (fromExternal pattern)
- Switch to "Contract Demos" tab
  - Show "Confidential ERC-20 Transfer" step-by-step flow
  - Show Solidity code for FHE.select-based transfer
  - Click "Sealed-Bid Auction" — show bidding flow

### Scene 3: Curriculum Structure (45s)
- Walk through the 4-week structure on the website
  - Week 1: Foundation (Modules 00-04) — types, operations
  - Week 2: Core Patterns (Modules 05-09) — ACL, inputs, decryption, conditional, random
  - Week 3: Applications (Modules 10-14) — ERC-20, voting, auction, testing
  - Week 4: Mastery (Modules 15-19) — gas, security, DeFi, DAO capstone
- Show progress bar and module checkmarks
- Mention: 4 learning paths (4-week, intensive, part-time, self-paced)

### Scene 4: Sample Lesson Walkthrough (1.5 min)
- Pick Module 08 (Conditional Logic) as example
- Click "Lesson" button on website -> show LessonViewer
  - The FHE.select pattern explained
  - Code examples
  - Key concept: "no branching on encrypted data"
- Switch to "Exercise" tab -> show hands-on practice
- Switch to "Slides" tab -> show embedded Marp slides with animations
  - Use arrow keys to navigate slides within LessonViewer
  - Click "Open in full screen" for presentation mode
- Navigate to next module with arrow key (Module 09)
- Open quiz (/quiz/index.html) -> show Module 08 questions
  - Show quiz persistence (best score display, progress bar)
- Show the actual contract: EncryptedMarketplace.sol (tiered discounts with FHE.select)

### Scene 5: New Contracts (30s)
- Show CrossContractDemo.sol in editor
  - Explain: Token grants ACL access to Vault → cross-contract encrypted balance reading
  - "This is the KEY pattern for FHE composability"
- Show CheckSignaturesDemo.sol briefly
  - "Demonstrates production-style KMS decryption verification"
- Terminal: `npx hardhat test test/CrossContractDemo.test.ts` -> 13 tests passing

### Scene 6: Homework & Build (30s)
- Open curriculum/HOMEWORK.md in editor
- Explain: 4 progressively harder assignments (Calculator → Vault → Token+Voting → DAO Capstone)
- Terminal: `npx hardhat compile` -> "38 contracts compiled"
- Terminal: `npx hardhat test` -> "360 passing (18s)"
- Quick recap:
  - 20 lesson plans with time estimates
  - 20 Marp slide decks with animations and speaker notes
  - 215 interactive quiz questions with persistence
  - Embedded slides viewer in LessonViewer
  - Interactive fhevmjs encryption demo
  - 3 contract interaction walkthroughs
  - Instructor Guide (48K bytes of teaching notes)
  - Docker support (one-command environment)
  - 38 contracts deployed on Ethereum Sepolia
  - Cross-contract FHE composability demo
  - KMS checkSignatures verification demo
  - All resources: Cheatsheet, Gas Guide, Security Checklist, Glossary, Decision Tree, Common Pitfalls
