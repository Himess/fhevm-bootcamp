# FHEVM Bootcamp -- Instructor Guide

This guide provides teaching notes, discussion prompts, time management tips, common student questions, and assessment rubrics for instructors delivering the FHEVM Bootcamp Curriculum.

---

## Table of Contents

- [Bootcamp Organization](#bootcamp-organization)
- [General Teaching Principles](#general-teaching-principles)
- [Module-by-Module Teaching Notes](#module-by-module-teaching-notes)
- [Assessment Rubrics](#assessment-rubrics)
- [Common Student Questions (FAQ)](#common-student-questions-faq)
- [Time Management Guide](#time-management-guide)
- [Troubleshooting Environment Issues](#troubleshooting-environment-issues)

---

## Bootcamp Organization

### Curriculum Summary

The bootcamp consists of 15 modules (Modules 00-14) totaling approximately 46 hours of instruction. The curriculum includes 25 smart contracts and 210 tests across all exercises and projects.

| Module | Title | Duration |
|---|---|---|
| 00 | Prerequisites & Solidity Review | 2 hrs |
| 01 | Introduction to FHE | 2 hrs |
| 02 | Development Setup | 2 hrs |
| 03 | Encrypted Types | 3 hrs |
| 04 | Operations - Arithmetic, Bitwise, Comparison | 3 hrs |
| 05 | Access Control (ACL) | 3 hrs |
| 06 | Encrypted Inputs & ZK Proofs | 3 hrs |
| 07 | Decryption Patterns | 3 hrs |
| 08 | Conditional Logic | 3 hrs |
| 09 | On-Chain Randomness | 2 hrs |
| 10 | Frontend Integration | 3 hrs |
| 11 | Confidential ERC-20 | 4 hrs |
| 12 | Confidential Voting | 4 hrs |
| 13 | Sealed-Bid Auction | 4 hrs |
| 14 | Capstone - Confidential DAO | 5 hrs |

### Before the Bootcamp

**2 Weeks Before:**
- Send pre-bootcamp survey to assess student backgrounds (Solidity experience, crypto knowledge, math comfort).
- Distribute environment setup instructions. Ask students to complete setup BEFORE Day 1.
- Verify all example contracts compile against the current `@fhevm/solidity` version.
- Test all exercises and solutions on a fresh machine.
- Prepare a shared chat channel (Discord, Slack, or Telegram) for real-time Q&A.

**1 Week Before:**
- Send a "Welcome" email with schedule, prerequisites checklist, and reading material (optional: Module 00 lecture notes as pre-reading).
- Confirm TA availability and assign module responsibilities.
- Set up the shared repository with starter code for all exercises.
- Test network connectivity to Ethereum Sepolia from the venue (if in-person).

**Day Before:**
- Verify all student machines have the environment ready (send a quick "compile check" script).
- Prepare printed cheatsheets (or ensure digital access to `resources/CHEATSHEET.md`).
- Stage all slide decks and demo environments.

### Cohort Sizing

| Format | Recommended Size | TA Ratio |
|---|---|---|
| In-person, instructor-led | 12-20 students | 1 TA per 6-8 students |
| Virtual, instructor-led | 8-15 students | 1 TA per 5-6 students |
| Hybrid | 10-16 students | 1 TA per 6 students |

### Room/Environment Setup

- Each student needs their own machine with admin access (for npm installs).
- Large screen or projector for live coding demos.
- Whiteboard (physical or virtual) for architecture diagrams.
- Stable internet connection (required for devnet interaction and package downloads).

---

## General Teaching Principles

### 1. Code-First, Theory-Second (After Module 00)

After the theory-heavy Module 00, every subsequent module should start with a working code example before explaining the theory behind it. Students retain more when they see the code work first, then understand why.

**Pattern:**
1. Show a complete, working example (2-3 minutes).
2. Run it. Show the output.
3. Now explain each line and the underlying concept.
4. Let students modify and experiment.

### 2. The "Encrypted Mindset" Transition

The single biggest conceptual hurdle is the shift from imperative programming (if/else branching on values) to the encrypted paradigm (compute all paths, select the result). Emphasize this transition repeatedly in Modules 04-08.

**Key phrase to repeat:** "You cannot look at encrypted data. You cannot branch on encrypted data. You compute all possibilities and select the right one."

### 3. Build on the ERC-20

The Confidential ERC-20 (Module 11) is the central artifact of the bootcamp. Reference it constantly in later modules:
- Module 12: "Let's apply voting patterns we learned to our ERC-20 governance."
- Module 13: "Let's use our ERC-20 as the payment token in the auction."
- Module 14: "Let's integrate our ERC-20 into the DAO capstone."

### 4. Encourage Mistakes

FHE contracts fail in interesting ways. When students make mistakes (ACL errors, type mismatches, gas overflows), treat them as learning opportunities, not setbacks. Ask: "What does this error tell us about how fhEVM works?"

### 5. Pair Programming

For exercises, pair weaker students with stronger ones. Both benefit: the stronger student consolidates by teaching; the weaker student gets unblocked faster.

---

## Module-by-Module Teaching Notes

### Module 00: Prerequisites & Solidity Review

**Duration:** 2 hours
**Teaching Style:** Lecture + hands-on review (minimal new coding)

**Key Teaching Points:**
- Assess student backgrounds quickly: Solidity experience, crypto knowledge, math comfort.
- Review Solidity fundamentals that are critical for fhEVM: types, storage, visibility, modifiers, events.
- Ensure everyone has a working development environment before leaving this module.
- Set expectations for the bootcamp pace and the "encrypted mindset" shift coming in later modules.

**Discussion Questions:**
1. "What Solidity patterns do you use most frequently? Which do you think will change with FHE?"
2. "Why does Solidity have so many integer types (uint8 through uint256)? How might this matter for encrypted computation?"

**Common Pitfalls:**
- Students with varying Solidity experience levels. Pair stronger students with beginners during the review exercises.
- Environment setup issues. Have TAs ready to troubleshoot Node.js, npm, and Hardhat problems.

**Time Allocation:**
| Segment | Duration |
|---|---|
| Welcome and background assessment | 15 min |
| Solidity fundamentals review | 40 min |
| Development environment setup | 30 min |
| Hands-on: compile and deploy a basic contract | 25 min |
| Quiz | 10 min |

---

### Module 01: Introduction to FHE

**Duration:** 2 hours
**Teaching Style:** Lecture + group discussion (minimal coding)

**Key Teaching Points:**
- Start with a relatable analogy: "Imagine doing math while blindfolded. FHE is like that, but for computers."
- The history narrative (Caesar -> RSA -> Gentry) builds appreciation for the difficulty of FHE.
- Spend extra time on the TFHE scheme since that is what fhEVM uses.
- The comparison matrix (FHE vs ZK vs TEE vs MPC) is the most important slide --- students will reference it throughout the bootcamp.

**Discussion Questions:**
1. "If FHE has been possible since 2009, why is it only now being used in production? What changed?"
2. "Name a real-world system where data is processed without the processor seeing it. How does that compare to FHE?"
3. "What are the trade-offs of using FHE versus zero-knowledge proofs for blockchain privacy?"
4. "If FHE operations are 1000x slower than plaintext, when is the privacy worth the cost?"

**Common Pitfalls:**
- Students may confuse FHE with ZK proofs. Clarify: ZK proves something is true without revealing it; FHE computes on data without revealing it.
- Some students get lost in the math. Emphasize that they do not need to understand lattice cryptography to use fhEVM --- just the mental model.

**Time Allocation:**
| Segment | Duration |
|---|---|
| Encryption history and motivation | 30 min |
| PHE/SHE/FHE progression | 20 min |
| TFHE scheme overview | 20 min |
| Noise budget and bootstrapping | 15 min |
| FHE vs ZK vs TEE vs MPC comparison | 20 min |
| Group discussion | 10 min |
| Quiz | 5 min |

---

### Module 02: Development Setup

**Duration:** 2 hours
**Teaching Style:** Lecture (architecture) + live coding (setup)

**Key Teaching Points:**
- Draw the full architecture diagram on a whiteboard. Label every component: EVM, coprocessor, Gateway, client.
- Explain the coprocessor as "a specialized computer that does the FHE math while the EVM handles the logic."
- The `ZamaEthereumConfig` base contract is where all the FHE configuration lives --- show its source code briefly.
- Do the environment setup as a live walkthrough. Have TAs circulate to help students with issues.
- **Note:** In the local dev environment, the bootcamp uses the `FHE.makePubliclyDecryptable()` pattern rather than Gateway/GatewayConfig for decryption. The Gateway is relevant for production but not needed in the local Hardhat mock setup.

**Discussion Questions:**
1. "Why can't we just run FHE operations directly in the EVM? What would happen to gas costs?"
2. "The coprocessor sees the encrypted data but cannot decrypt it. Why not?"
3. "What trust assumptions does the Gateway introduce? Is this different from a typical oracle?"

**Common Pitfalls:**
- Environment setup is where students get stuck the most. Allocate extra time and have TAs ready.
- Node.js version mismatches cause subtle errors. Enforce Node.js 20+.
- Students often confuse the FHE public key (used for encryption) with the network key (used by the coprocessor).

**Time Allocation:**
| Segment | Duration |
|---|---|
| Architecture overview (lecture + whiteboard) | 30 min |
| Key management overview | 15 min |
| Environment setup (live) | 35 min |
| First contract deployment | 25 min |
| Transaction tracing exercise | 10 min |
| Quiz | 5 min |

---

### Module 03: Encrypted Types

**Duration:** 3 hours
**Teaching Style:** Live coding + exercises

**Key Teaching Points:**
- Create a "type reference wall" (physical or digital) that stays visible throughout the bootcamp.
- Introduce the encrypted types: `ebool`, `euint4`, `euint8`, `euint16`, `euint32`, `euint64`, `euint128`, `euint256`, `eaddress`, `ebytes64`, `ebytes128`, `ebytes256`.
- Emphasize that operations with plaintext second operands (e.g., `FHE.add(encryptedVal, 5)`) are cheaper than fully encrypted operations.
- Show overflow behavior: `FHE.add` on `euint8` wraps at 256 silently (no revert).

**Discussion Questions:**
1. "Why does fhEVM offer so many integer sizes (euint4 through euint256)? Why not just euint256 for everything?"
2. "What happens when you add two euint8 values that sum to more than 255?"
3. "Why is there no signed integer type (eint32)? What implications does this have?"

**Common Pitfalls:**
- Students try to use `euint256` for everything. Explain the gas cost implications early.
- Mixing encrypted types without casting (e.g., adding euint8 to euint32) causes compiler errors. Show the casting pattern.
- Students forget that `eaddress` is its own type, not an `euint160`.

**Time Allocation:**
| Segment | Duration |
|---|---|
| Type overview and reference card | 25 min |
| Encrypted type demos (live coding) | 30 min |
| Type casting | 20 min |
| Exercise 1: Encrypted Type Explorer | 40 min |
| Exercise 2: Type Conversion | 30 min |
| Exercise 3: Gas Cost Comparison | 25 min |
| Quiz | 10 min |

---

### Module 04: Operations - Arithmetic, Bitwise, Comparison

**Duration:** 3 hours
**Teaching Style:** Live coding + exercises

**Key Teaching Points:**
- Demonstrate each operation category with live code: arithmetic (`FHE.add`, `FHE.sub`, `FHE.mul`), bitwise (`FHE.and`, `FHE.or`, `FHE.xor`, `FHE.shl`, `FHE.shr`), and comparison (`FHE.eq`, `FHE.ne`, `FHE.gt`, `FHE.ge`, `FHE.lt`, `FHE.le`).
- Comparisons return `ebool`, not `bool`. You cannot use them in `if` statements or `require`.
- Emphasize that `FHE.min` and `FHE.max` are useful shorthands.

**Discussion Questions:**
1. "Why do comparison operations return `ebool` instead of `bool`? What does this mean for control flow?"
2. "When would you use bitwise operations on encrypted values in a real application?"
3. "How does `FHE.select` relate to comparison operations?"

**Common Pitfalls:**
- Students try to use `ebool` in `if` statements or `require()`. This will not compile.
- Students forget that `FHE.sub` wraps on underflow (no revert).
- Confusing `FHE.rem` behavior with plaintext modulo.

**Time Allocation:**
| Segment | Duration |
|---|---|
| Arithmetic operations (live coding) | 30 min |
| Bitwise and shift operations | 25 min |
| Comparison operations and ebool | 25 min |
| Exercise 1: Encrypted Calculator | 40 min |
| Exercise 2: Bitwise Flag Register | 30 min |
| Exercise 3: Comparison Patterns | 20 min |
| Quiz | 10 min |

---

### Module 05: Access Control (ACL)

**Duration:** 3 hours
**Teaching Style:** Lecture + live coding + debugging exercise

**Key Teaching Points:**
- ACL (Access Control List) is how you manage WHO can see encrypted data. Every encrypted value has an access list.
- The core ACL functions: `FHE.allow()`, `FHE.allowThis()`, `FHE.allowTransient()`, `FHE.makePubliclyDecryptable()`, `FHE.isSenderAllowed()`.
- After every state update (e.g., `_balance = FHE.add(_balance, value)`), you MUST re-set ACL because the handle changes.
- `FHE.allowThis()` grants the contract itself access. `FHE.allow(handle, address)` grants a specific user access.
- Show the "ACL reset after update" pattern --- this is the #1 source of bugs for beginners.
- **Note:** The bootcamp uses the `FHE.makePubliclyDecryptable()` pattern for decryption in the local dev environment rather than Gateway-based decryption.

**Discussion Questions:**
1. "Why do you need to call `FHE.allowThis()` after every operation that updates an encrypted state variable?"
2. "What is the difference between `FHE.allow()` and `FHE.allowTransient()`? When would you use each?"
3. "How does `FHE.makePubliclyDecryptable()` differ from `FHE.allow()`? What are the security implications?"

**Common Pitfalls:**
- Students forget to re-set ACL after updating an encrypted variable. The new ciphertext handle has NO permissions by default.
- Students use `FHE.allow()` when `FHE.allowTransient()` would be more appropriate for intermediate values.
- Students forget `FHE.allowThis()` on contract-owned state, causing subsequent operations on that variable to fail.

**Time Allocation:**
| Segment | Duration |
|---|---|
| What is ACL and why it matters | 20 min |
| The ACL functions deep dive | 25 min |
| ACL reset after update pattern | 20 min |
| Live coding: ACLDemo contract | 25 min |
| Exercise 1: Multi-User Vault | 25 min |
| Exercise 2: Debug ACL Bugs | 20 min |
| Quiz | 10 min |

---

### Module 06: Encrypted Inputs & ZK Proofs

**Duration:** 3 hours
**Teaching Style:** Full-stack live coding (client + contract)

**Key Teaching Points:**
- This is the first module where students touch the client side. Walk through fhevmjs setup carefully.
- Show the full flow: `fhevmjs.encrypt()` on client -> `externalEuint32` parameter -> `FHE.fromExternal()` in contract.
- Emphasize: `externalEuint32` is NOT the same as `euint32`. It is a raw encrypted input that must be converted.
- Input validation on encrypted data is tricky --- you cannot check a range with `require()` because the value is encrypted.
- Explain the role of ZK proofs in input verification: they ensure the encrypted input is well-formed without revealing the plaintext.

**Discussion Questions:**
1. "Can a malicious user submit an encrypted value that is out of the expected range? How do you prevent this?"
2. "What is the role of the proof in the input encryption process?"
3. "Why do we use a separate `external` type for inputs instead of accepting `euint32` directly?"

**Common Pitfalls:**
- Students try to use `euint32` as a function parameter (should be `externalEuint32`).
- Forgetting to call `FHE.fromExternal()` --- the raw external type cannot be used in operations.
- Client-side encryption requires the FHE public key --- students forget to fetch it.

**Time Allocation:**
| Segment | Duration |
|---|---|
| Client-side encryption overview | 20 min |
| fhevmjs setup and API | 20 min |
| externalEuintXX types and FHE.fromExternal() | 20 min |
| ZK proof role in input validation | 15 min |
| Exercise 1: Client Script | 30 min |
| Exercise 2: Multi-Input Contract | 25 min |
| Exercise 3: Sealed Envelope | 15 min |
| Quiz | 15 min |

---

### Module 07: Decryption Patterns

**Duration:** 3 hours
**Teaching Style:** Lecture + live coding with devnet

**Key Teaching Points:**
- Decryption is asynchronous in production. This surprises students used to synchronous Solidity calls.
- In the bootcamp dev environment, we use `FHE.makePubliclyDecryptable()` which simplifies the pattern (no Gateway callbacks needed in local mock mode).
- Re-encryption (sealoutput) is different from on-chain decryption --- it produces a user-specific encrypted blob, not plaintext on-chain.
- Discuss when to use each pattern: `makePubliclyDecryptable` for values that should become public, re-encryption for private viewing.

**Discussion Questions:**
1. "Why is decryption asynchronous on a real network? Why can't the contract just decrypt immediately?"
2. "If the decrypted value ends up on-chain (in the callback), is it still private?"
3. "When should you use re-encryption vs on-chain decryption? What are the trade-offs?"

**Common Pitfalls:**
- Students expect decryption to be synchronous --- they write code that uses the decrypted result on the next line.
- Students store decrypted values in public storage, defeating the purpose of encryption.
- Confusion between the `makePubliclyDecryptable` pattern used in dev and the Gateway callback pattern used in production.

**Time Allocation:**
| Segment | Duration |
|---|---|
| Decryption architecture overview | 20 min |
| makePubliclyDecryptable pattern | 25 min |
| Re-encryption (sealoutput) | 20 min |
| Live coding: counter with reveal | 25 min |
| Exercise 1: Counter with Reveal | 25 min |
| Exercise 2: Private Balance Viewer | 25 min |
| Quiz | 10 min |

---

### Module 08: Conditional Logic

**Duration:** 3 hours
**Teaching Style:** Live coding + refactoring exercise

**Key Teaching Points:**
- The core paradigm shift: you cannot branch on encrypted data. You must compute all paths and select the result.
- `FHE.select(condition, valueIfTrue, valueIfFalse)` is the fundamental pattern --- the encrypted `if/else`.
- Show refactoring from plaintext branching to encrypted select patterns step by step.
- Demonstrate chaining multiple `FHE.select` calls for multi-condition logic.

**Discussion Questions:**
1. "Why is `FHE.select` necessary? Why not just use `if (encryptedBool)` ?"
2. "How does computing all branches affect gas costs compared to plaintext branching?"
3. "When is it safe to use a plaintext `if` statement in an FHE contract?"

**Common Pitfalls:**
- Students instinctively write `if (encryptedCondition)` --- this will not compile because `ebool` is not `bool`.
- Forgetting that both branches of `FHE.select` are always evaluated (gas cost for both paths).
- Nested `FHE.select` chains become hard to read. Encourage helper functions.

**Time Allocation:**
| Segment | Duration |
|---|---|
| The encrypted branching problem | 20 min |
| FHE.select deep dive | 25 min |
| Refactoring patterns (live coding) | 25 min |
| Exercise 1: Branchless Logic | 30 min |
| Exercise 2: Multi-Condition Contract | 25 min |
| Exercise 3: Refactor a Plaintext Contract | 25 min |
| Quiz | 10 min |

---

### Module 09: On-Chain Randomness

**Duration:** 2 hours
**Teaching Style:** Lecture + live coding

**Key Teaching Points:**
- fhEVM provides encrypted randomness via `FHE.randomEuintXX()` functions.
- The randomness is generated by the coprocessor and is encrypted --- no one (including the contract) can see the value.
- Use cases: lotteries, gaming, random assignment, shuffling.
- Emphasize: the randomness is only as trustworthy as the coprocessor generating it.

**Discussion Questions:**
1. "How does encrypted randomness differ from Chainlink VRF or block hash-based randomness?"
2. "Can a miner/validator influence FHE random values? Why or why not?"
3. "What applications require random values that nobody can see, even the contract?"

**Common Pitfalls:**
- Students confuse FHE randomness with public on-chain randomness (block.timestamp, etc.).
- Forgetting ACL setup on random values --- the generated ciphertext needs `FHE.allowThis()`.
- Using randomness in a way that leaks information when the result is eventually decrypted.

**Time Allocation:**
| Segment | Duration |
|---|---|
| On-chain randomness overview | 15 min |
| FHE.randomEuintXX functions | 20 min |
| Live coding: encrypted lottery | 25 min |
| Exercise 1: Random Assignment | 25 min |
| Exercise 2: Encrypted Dice Game | 25 min |
| Quiz | 10 min |

---

### Module 10: Frontend Integration

**Duration:** 3 hours
**Teaching Style:** Full-stack live coding

**Key Teaching Points:**
- Connect fhevmjs to a React/frontend application.
- Show the full user flow: connect wallet -> fetch FHE public key -> encrypt inputs -> send transaction -> view decrypted results.
- Demonstrate re-encryption for private balance viewing in the UI.
- Handle async patterns: waiting for transactions, polling for decryption results.

**Discussion Questions:**
1. "What is the user experience difference between an FHE dApp and a standard dApp?"
2. "How do you handle the latency of FHE operations in the frontend?"
3. "What should the UI show while an encrypted transaction is being processed?"

**Common Pitfalls:**
- Students forget to initialize fhevmjs before attempting encryption.
- Handling the async nature of FHE operations in React state management.
- CORS issues when connecting to devnet from localhost.

**Time Allocation:**
| Segment | Duration |
|---|---|
| fhevmjs frontend setup | 20 min |
| Wallet connection and FHE key fetching | 15 min |
| Input encryption in the browser | 20 min |
| Live coding: React component for encrypted transfer | 30 min |
| Re-encryption for private viewing | 20 min |
| Exercise 1: Balance Viewer UI | 25 min |
| Exercise 2: Transfer Form with Encryption | 20 min |
| Quiz | 10 min |

---

### Module 11: Confidential ERC-20

**Duration:** 4 hours
**Teaching Style:** Guided project build

**Key Teaching Points:**
- Build the contract incrementally: storage -> mint -> transfer -> approve -> transferFrom -> balanceOf.
- The "silent fail" pattern is critical: `FHE.select(hasEnough, newBalance, oldBalance)` --- if balance is insufficient, nothing changes and nothing reverts.
- ACL management in ERC-20 is complex: after every balance update, re-allow both the contract and the token holder.
- This is a comprehensive module that brings together types, operations, ACL, and conditional logic. Do not rush it.

**Discussion Questions:**
1. "Why does the transfer not revert when the sender has insufficient balance? What would a revert leak?"
2. "If all balances are encrypted, how does the contract prevent the total supply from being inflated?"
3. "What information can an observer still learn from watching encrypted ERC-20 transactions?"
4. "How would you add a `totalSupply()` function? Should it be encrypted or public?"

**Common Pitfalls:**
- Forgetting ACL updates after balance changes --- leads to "unauthorized access" in the next transaction.
- Using `FHE.sub` without checking balance first --- results in underflow (wrapping to a huge number).
- Not allowing the contract itself (allowThis) for stored balances.

**Time Allocation:**
| Segment | Duration |
|---|---|
| Design walkthrough | 15 min |
| Storage and minting | 20 min |
| Transfer implementation (live coding) | 30 min |
| ACL management deep dive | 20 min |
| Exercise 1: Core ERC-20 | 40 min |
| Approve and transferFrom | 25 min |
| Exercise 2: Approvals | 35 min |
| Balance viewing via re-encryption | 15 min |
| Exercise 3: Test Suite | 25 min |
| Quiz | 10 min |

---

### Module 12: Confidential Voting

**Duration:** 4 hours
**Teaching Style:** Guided project build

**Key Teaching Points:**
- Voting is the "killer demo" for FHE --- it is immediately intuitive why encrypted computation matters here.
- Homomorphic tallying with `FHE.add` is elegant: each encrypted vote is added to an encrypted running total.
- The hardest part is preventing double votes without revealing who voted for what. Discuss trade-offs.
- The reveal mechanism should only trigger after the voting period ends. In dev, use `FHE.makePubliclyDecryptable()`.

**Discussion Questions:**
1. "How can you prevent double voting if you cannot see who has already voted?"
2. "Should the voter be able to verify their own vote was counted? How would you implement that with FHE?"
3. "What information leaks when the final tally is revealed? Can partial information be inferred?"

**Common Pitfalls:**
- Students forget to track voters with a plaintext mapping to prevent double voting.
- Revealing tallies too early (before voting ends) leaks partial results.
- ACL issues with the running tally variable.

**Time Allocation:**
| Segment | Duration |
|---|---|
| Voting system design | 25 min |
| Encrypted ballot and tally architecture | 20 min |
| Exercise 1: Core Voting Contract | 50 min |
| Voter eligibility and double-vote prevention | 20 min |
| Exercise 2: Eligibility and Anti-Double-Vote | 40 min |
| Tally reveal mechanism | 15 min |
| Exercise 3: Reveal + E2E Tests | 30 min |
| Quiz | 10 min |

---

### Module 13: Sealed-Bid Auction

**Duration:** 4 hours
**Teaching Style:** Guided project build

**Key Teaching Points:**
- The running maximum pattern: `currentMax = FHE.select(FHE.gt(newBid, currentMax), newBid, currentMax)`.
- Vickrey auctions require tracking both the first and second highest bids --- show the two-variable pattern.
- Deposits link the plaintext economic commitment to the encrypted bid.
- Emphasize: the losing bids are NEVER revealed. Only the winning price.

**Discussion Questions:**
1. "In a first-price auction, only the winning bid is revealed. Can losing bidders verify the auction was fair?"
2. "How do deposits work when the bid amount is encrypted?"
3. "Can the auctioneer front-run the auction if they can request decryption of all bids?"

**Common Pitfalls:**
- Students forget to handle the case where no bids are placed.
- The two-variable tracking pattern for Vickrey auctions is error-prone --- walk through it carefully.
- Deposit refund logic must handle the encrypted/plaintext boundary correctly.

**Time Allocation:**
| Segment | Duration |
|---|---|
| Auction type overview | 15 min |
| Sealed-bid design with FHE | 20 min |
| Running maximum pattern | 20 min |
| Exercise 1: First-Price Auction | 50 min |
| Vickrey extension (second-price) | 20 min |
| Exercise 2: Vickrey Auction | 40 min |
| Deposit management and refunds | 15 min |
| Exercise 3: Full Auction with Tests | 30 min |
| Quiz | 10 min |

---

### Module 14: Capstone - Confidential DAO

**Duration:** 5 hours
**Prerequisites:** Modules 00-13
**Teaching Style:** Mentored independent work

**Key Teaching Points:**
- The capstone integrates concepts from all prior modules: encrypted types, ACL, conditional logic, decryption, ERC-20, and voting.
- Students build a Confidential DAO that combines governance token (confidential ERC-20) with encrypted voting and proposal execution.
- The instructor's role shifts from teacher to mentor. Give guidance, not answers.
- Require a written proposal before implementation begins. This prevents scope creep.
- Check in with each student/team at least 3 times during implementation.
- Presentations should be 5-10 minutes: problem statement, architecture, demo, lessons learned.

**Discussion Questions (for proposal review):**
1. "What data in your DAO needs to be encrypted? What can remain in plaintext?"
2. "How does your DAO prevent vote buying if balances and votes are both encrypted?"
3. "What are the security assumptions and trust boundaries?"

**Time Allocation:**
| Segment | Duration |
|---|---|
| Project scoping and proposal writing | 20 min |
| Proposal review (instructor feedback) | 20 min |
| Design and architecture | 40 min |
| Implementation (mentored) | 120 min |
| Testing | 45 min |
| Documentation | 20 min |
| Presentation prep | 10 min |
| Presentations + Q&A | 45 min |

---

## Assessment Rubrics

### Quiz Grading

Quizzes are auto-graded. Each question is worth equal points within its quiz. The quiz component is 20% of the final grade.

### Exercise Rubric

Each exercise is graded on a 100-point scale:

| Criterion | Weight | 90-100 (Excellent) | 70-89 (Good) | 50-69 (Adequate) | Below 50 (Insufficient) |
|---|---|---|---|---|---|
| **Correctness** | 50% | All logic correct, handles all cases | Core logic correct, minor edge case issues | Core logic mostly correct, some cases wrong | Fundamental logic errors |
| **Code Quality** | 25% | Clean, well-structured, properly commented, follows conventions | Readable, minor style issues | Functional but messy, inconsistent style | Hard to read, no structure |
| **Security** | 25% | Proper ACL, no leakage, follows all security patterns | Minor ACL issues, no critical leakage | Some ACL gaps, minor information leakage risks | Missing ACL, potential security issues |

### Capstone Rubric

| Criterion | Weight | 90-100 (Excellent) | 70-89 (Good) | 50-69 (Adequate) | Below 50 (Insufficient) |
|---|---|---|---|---|---|
| **Smart Contracts** | 30% | Compiles, deploys, works fully. Clean architecture. Proper FHE usage. | Works with minor issues. Reasonable architecture. | Compiles but some features broken. | Does not compile or has critical bugs. |
| **Test Suite** | 20% | 90%+ coverage. Tests happy path, edge cases, ACL, failures. | Good coverage. Tests main paths and some edges. | Basic tests that cover the happy path. | Few or no tests. |
| **Documentation** | 20% | Clear README, architecture diagram, API docs, usage guide. | Good README and basic documentation. | Minimal README. | No documentation. |
| **Security Analysis** | 15% | Thorough threat model. Identifies and mitigates FHE-specific risks. | Identifies main security concerns. | Brief security mention. | No security analysis. |
| **Presentation** | 15% | Clear, well-structured demo. Answers questions confidently. | Good demo with minor stumbles. | Basic demo, struggles with questions. | Cannot demo or explain. |

---

## Common Student Questions (FAQ)

### Conceptual Questions

**Q: "Why can't I just use zero-knowledge proofs instead of FHE?"**
A: ZK proofs prove something is true without revealing the data, but they do not allow computation on the hidden data. FHE allows the smart contract to operate on encrypted data --- add balances, compare values, make decisions --- all without decryption. Use ZK when you need to prove a statement; use FHE when you need to compute on private data.

**Q: "If the coprocessor does the FHE computation, isn't that centralized?"**
A: The coprocessor processes encrypted data using the network's FHE keys. It cannot decrypt the data because decryption requires the network key, which is distributed. The coprocessor is a computation engine, not a trusted party with access to plaintext data. Think of it like a GPU: it processes data but does not own it.

**Q: "Is FHE quantum-resistant?"**
A: FHE schemes based on lattice problems (like TFHE used in fhEVM) are believed to be quantum-resistant. This is an active area of research, but lattice-based cryptography is one of the leading candidates for post-quantum security.

**Q: "Why are there no signed integers (eint32)?"**
A: The current fhEVM implementation focuses on unsigned integers. Signed operations can be simulated using unsigned types with appropriate encoding (e.g., bias encoding), but native signed types are not yet available. This may change in future versions.

### Technical Questions

**Q: "Why do I get 'Unauthorized access to ciphertext' even though I set permissions?"**
A: This usually means you forgot to call `FHE.allowThis(ciphertext)` after creating or modifying the ciphertext. Every new ciphertext (including results of operations) starts with an empty permission set. The contract itself needs permission to use its own stored values.

**Q: "Can I use `euint32` as a function parameter?"**
A: No. External function parameters that receive encrypted data from users must use the `externalEuint32` type (or the corresponding external type). Inside the function, convert it with `FHE.fromExternal()`. Internal functions between contracts can pass `euint32` directly if ACL permissions are set.

**Q: "Why does my contract not revert when I expect it to?"**
A: By design, encrypted contracts should use `FHE.select` instead of `require()` for conditions on encrypted data. The "silent fail" pattern means the operation proceeds but produces the "unchanged" result when conditions are not met. If you are testing, check the state after the transaction rather than expecting a revert.

**Q: "How do I see the value of an encrypted variable during debugging?"**
A: In the mock testing environment, you can use the decryption helpers provided by the Hardhat plugin. On a real network, you would use re-encryption (`FHE.sealoutput`) to get a user-specific view, or Gateway decryption to reveal the value on-chain.

**Q: "Can I use Foundry instead of Hardhat?"**
A: Foundry has limited fhEVM support compared to Hardhat. The Hardhat fhEVM plugin provides mock encryption, decryption helpers, and devnet integration out of the box. Foundry can be used for basic compilation and testing, but the developer experience is less mature. We recommend Hardhat for this bootcamp.

---

## Time Management Guide

### Signals You Are Running Behind

- Module exercises are taking 50%+ longer than allocated.
- Students are still debugging environment issues in Module 02.
- Q&A is consuming more than 15% of module time.
- More than 30% of students are stuck on the same exercise.

### Recovery Strategies

1. **Skip optional exercises:** Each module has a core exercise and optional extensions. Skip extensions when behind.
2. **Provide solutions:** If an exercise is taking too long, live-code the solution and let students follow along.
3. **Batch Q&A:** Instead of answering questions during exercises, collect them and address them in a dedicated Q&A block.
4. **Assign homework:** Move the final exercise of a module to homework (Part-Time path only).
5. **Condense Module 13:** Sealed-Bid Auction can be reduced to a design discussion + one exercise if time is tight.

### Signals You Are Running Ahead

- Exercises are completed in under 70% of allocated time.
- Few questions during Q&A blocks.
- Students are requesting more challenging content.

### Enrichment Strategies

1. **Bonus challenges:** Add constraints to exercises (e.g., "now do it with euint8 instead of euint32").
2. **Security deep dives:** Have students audit each other's solutions.
3. **Early capstone start:** Let students begin capstone planning during spare time.
4. **Guest speaker:** If available, invite a Zama engineer or FHE researcher for a Q&A session.

---

## Troubleshooting Environment Issues

### Common Setup Problems

| Problem | Cause | Solution |
|---|---|---|
| `npm install` fails with ERESOLVE | Dependency conflicts | Use `npm install --legacy-peer-deps` |
| Hardhat compile error: "pragma" | Wrong Solidity version | Ensure `hardhat.config.ts` specifies `0.8.27` |
| "Cannot find module fhevm" | Incomplete install | Delete `node_modules`, run `npm install` again |
| Gateway timeout during decryption | Network issue / Sepolia down | Check Ethereum Sepolia status; fall back to mock mode |
| "Out of gas" on FHE operations | Gas limit too low | Increase gas limit in hardhat config (30M+) |
| TypeScript errors in tests | Missing type declarations | Install `@types/mocha`, `@types/chai` |
| Node.js version error | Node < 20 | Upgrade Node.js using nvm: `nvm install 20` |

### Emergency Fallback

If the devnet is down or network issues prevent remote deployment, switch entirely to local mock mode. All exercises can be completed in mock mode. Adjust the teaching to note: "On a real network, this would involve actual FHE computation. In mock mode, the operations are simulated but the logic is identical."
