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

The single biggest conceptual hurdle is the shift from imperative programming (if/else branching on values) to the encrypted paradigm (compute all paths, select the result). Emphasize this transition repeatedly in Modules 04-07.

**Key phrase to repeat:** "You cannot look at encrypted data. You cannot branch on encrypted data. You compute all possibilities and select the right one."

### 3. Build on the ERC-20

The Encrypted ERC-20 (Module 07) is the central artifact of the bootcamp. Reference it constantly in later modules:
- Module 08: "Let's write tests for our ERC-20."
- Module 09: "Let's optimize our ERC-20."
- Module 10: "Let's audit our ERC-20."

### 4. Encourage Mistakes

FHE contracts fail in interesting ways. When students make mistakes (ACL errors, type mismatches, gas overflows), treat them as learning opportunities, not setbacks. Ask: "What does this error tell us about how fhEVM works?"

### 5. Pair Programming

For exercises, pair weaker students with stronger ones. Both benefit: the stronger student consolidates by teaching; the weaker student gets unblocked faster.

---

## Module-by-Module Teaching Notes

### Module 00: Cryptography & FHE Foundations

**Duration:** 3 hours
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
| Encryption history and motivation | 45 min |
| PHE/SHE/FHE progression | 30 min |
| TFHE scheme overview | 30 min |
| Noise budget and bootstrapping | 20 min |
| FHE vs ZK vs TEE vs MPC comparison | 25 min |
| Group discussion + paper exercise | 20 min |
| Quiz | 10 min |

---

### Module 01: FHEVM Architecture & Setup

**Duration:** 3 hours
**Teaching Style:** Lecture (architecture) + live coding (setup)

**Key Teaching Points:**
- Draw the full architecture diagram on a whiteboard. Label every component: EVM, coprocessor, Gateway, client.
- Explain the coprocessor as "a specialized computer that does the FHE math while the EVM handles the logic."
- The `ZamaEthereumConfig` base contract is where all the FHE configuration lives --- show its source code briefly.
- Do the environment setup as a live walkthrough. Have TAs circulate to help students with issues.

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
| Architecture overview (lecture + whiteboard) | 45 min |
| Key management deep dive | 20 min |
| Gateway and decryption lifecycle | 20 min |
| Environment setup (live) | 45 min |
| First contract deployment | 30 min |
| Transaction tracing exercise | 20 min |
| Quiz | 10 min |

---

### Module 02: Encrypted Types & Basic Operations

**Duration:** 4 hours
**Teaching Style:** Live coding + exercises

**Key Teaching Points:**
- Create a "type reference wall" (physical or digital) that stays visible throughout the bootcamp.
- Demonstrate each operation category with live code: arithmetic, bitwise, shift.
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
| Type overview and reference card | 30 min |
| Arithmetic operations (live coding) | 40 min |
| Bitwise and shift operations | 30 min |
| Type casting | 20 min |
| Exercise 1: Encrypted Calculator | 45 min |
| Exercise 2: Bitwise Flag Register | 35 min |
| Exercise 3: Type Conversion | 20 min |
| Quiz | 20 min |

---

### Module 03: Access Control & Permissions (ACL)

**Duration:** 3 hours
**Teaching Style:** Lecture + debugging exercise

**Key Teaching Points:**
- ACL is the #1 source of bugs in fhEVM contracts. Emphasize this throughout.
- Use a visual diagram: draw a table of (ciphertext, allowed_address) pairs.
- The "allow dance" pattern: after every operation that produces a new ciphertext, you must re-establish permissions.
- Demonstrate what happens when you forget `FHE.allowThis()`: the contract itself cannot use the value in the next transaction.

**Discussion Questions:**
1. "Why does every new ciphertext need fresh ACL permissions, even if it was derived from an already-permitted ciphertext?"
2. "What is the difference between `FHE.allow` and `FHE.allowTransient`? When would you use each?"
3. "If a contract stores an encrypted value but forgets to call `FHE.allowThis`, what happens in the next transaction that reads it?"

**Common Pitfalls:**
- Forgetting `FHE.allowThis()` --- the contract cannot use its own stored encrypted values.
- Forgetting to allow the user --- the user cannot decrypt/view their own data.
- Students assume permissions are inherited when ciphertexts are combined (they are not).

**Time Allocation:**
| Segment | Duration |
|---|---|
| Why ACLs exist (lecture + diagram) | 25 min |
| Persistent vs transient permissions | 25 min |
| The "allow dance" pattern | 20 min |
| Live coding: multi-party ACL | 20 min |
| Exercise 1: Secret Vault | 30 min |
| Exercise 2: Two-Party Escrow | 25 min |
| Exercise 3: Debug ACL Bugs | 20 min |
| Quiz | 15 min |

---

### Module 04: Input Handling & Validation

**Duration:** 3 hours
**Teaching Style:** Full-stack live coding (client + contract)

**Key Teaching Points:**
- This is the first module where students touch the client side. Walk through fhevmjs setup carefully.
- Show the full flow: `fhevmjs.encrypt()` on client -> `externalEuint32` parameter -> `FHE.fromExternal()` in contract.
- Emphasize: `externalEuint32` is NOT the same as `euint32`. It is a raw encrypted input that must be converted.
- Input validation on encrypted data is tricky --- you cannot check a range with `require()` because the value is encrypted.

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
| externalEuintXX types and FHE.fromExternal() | 25 min |
| Input validation patterns | 20 min |
| Exercise 1: Client Script | 30 min |
| Exercise 2: Multi-Input Contract | 25 min |
| Exercise 3: Sealed Envelope | 15 min |
| Quiz | 15 min |

---

### Module 05: Access Control (ACL)

**Duration:** 4 hours
**Teaching Style:** Live coding + refactoring exercise

**Key Teaching Points:**
- ACL (Access Control List) is how you manage WHO can see encrypted data. Every encrypted value has an access list.
- The 5 core ACL functions: `FHE.allow()`, `FHE.allowThis()`, `FHE.allowTransient()`, `FHE.makePubliclyDecryptable()`, `FHE.isSenderAllowed()`.
- After every state update (e.g., `_balance = FHE.add(_balance, value)`), you MUST re-set ACL because the handle changes.
- `FHE.allowThis()` grants the contract itself access. `FHE.allow(handle, address)` grants a specific user access.
- Show the "ACL reset after update" pattern — this is the #1 source of bugs for beginners.

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
| The 5 ACL functions deep dive | 30 min |
| ACL reset after update pattern | 25 min |
| Live coding: ACLDemo contract | 30 min |
| Cross-contract ACL patterns | 20 min |
| Exercise 1: Multi-User Vault | 30 min |
| Exercise 2: Confidential Token ACL | 25 min |
| Quiz | 15 min |

---

### Module 06: Decryption Patterns & Callbacks

**Duration:** 4 hours
**Teaching Style:** Lecture + live coding with devnet

**Key Teaching Points:**
- Decryption is asynchronous. This surprises students used to synchronous Solidity calls.
- Draw the decryption timeline: request -> Gateway processes -> callback arrives (separate transaction).
- Emphasize the security of the callback: validate that only the Gateway can call it.
- Re-encryption (sealoutput) is different from Gateway decryption --- it produces a user-specific encrypted blob, not plaintext on-chain.

**Discussion Questions:**
1. "Why is decryption asynchronous? Why can't the contract just decrypt immediately?"
2. "If the decrypted value ends up on-chain (in the callback), is it still private?"
3. "When should you use re-encryption vs Gateway decryption? What are the trade-offs?"
4. "What happens if the Gateway goes down? Can your contract still function?"

**Common Pitfalls:**
- Students expect decryption to be synchronous --- they write code that uses the decrypted result on the next line.
- Callback functions that are not properly guarded can be called by anyone with a fake result.
- Students store decrypted values in public storage, defeating the purpose of encryption.

**Time Allocation:**
| Segment | Duration |
|---|---|
| Gateway architecture and trust model | 25 min |
| Decryption request and callback pattern | 30 min |
| Live coding: counter with reveal | 25 min |
| Re-encryption (sealoutput) | 25 min |
| Privacy analysis discussion | 15 min |
| Exercise 1: Counter with Reveal | 25 min |
| Exercise 2: Private Balance Viewer | 25 min |
| Exercise 3: Timed Reveal | 20 min |
| Quiz | 10 min |

---

### Module 07: Encrypted ERC-20 Token

**Duration:** 5 hours
**Teaching Style:** Guided project build

**Key Teaching Points:**
- Build the contract incrementally: storage -> mint -> transfer -> approve -> transferFrom -> balanceOf.
- The "silent fail" pattern is critical: `FHE.select(hasEnough, newBalance, oldBalance)` --- if balance is insufficient, nothing changes and nothing reverts.
- ACL management in ERC-20 is complex: after every balance update, re-allow both the contract and the token holder.
- This is the most comprehensive module. Do not rush it.

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
| Design walkthrough | 20 min |
| Storage and minting | 25 min |
| Transfer implementation (live coding) | 35 min |
| ACL management deep dive | 20 min |
| Exercise 1: Core ERC-20 | 50 min |
| Approve and transferFrom | 30 min |
| Exercise 2: Approvals | 40 min |
| Balance viewing via re-encryption | 15 min |
| Exercise 3: Test Suite | 35 min |
| Quiz | 10 min |

---

### Module 08: Testing & Debugging FHE Contracts

**Duration:** 4 hours
**Teaching Style:** Test-driven live coding

**Key Teaching Points:**
- The mock environment replaces actual FHE with simulated encryption. Operations still work logically, but there is no real cryptography.
- Test structure: setup accounts -> encrypt inputs -> call contract -> request decryption (mock) -> assert results.
- Show how to read and interpret common error messages (ACL failures, type mismatches).
- Encourage comprehensive test suites: happy path + edge cases + failure cases + ACL tests.

**Discussion Questions:**
1. "If the mock environment does not use real encryption, how do we know our contract will work with real FHE?"
2. "How do you test that an encrypted transfer with insufficient balance correctly does nothing (silent fail)?"
3. "What test cases would you write for the ACL system of an encrypted ERC-20?"

**Common Pitfalls:**
- Students write tests that only cover the happy path. Push for edge case coverage.
- Mock decryption helpers have different APIs than production --- ensure students understand the difference.
- Test setup is verbose (encrypt values, get instances). Encourage helper functions.

**Time Allocation:**
| Segment | Duration |
|---|---|
| Mock environment overview | 20 min |
| Hardhat plugin configuration | 15 min |
| Test structure walkthrough | 25 min |
| Live coding: writing tests for a simple contract | 30 min |
| Debugging techniques | 25 min |
| Exercise 1: ERC-20 Test Suite | 50 min |
| Exercise 2: Bug Hunting | 30 min |
| Exercise 3: Test Helper Library | 15 min |
| Quiz | 10 min |

---

### Module 09: Gas Optimization & Performance

**Duration:** 3 hours
**Teaching Style:** Benchmarking workshop

**Key Teaching Points:**
- Show the gas cost table early and let it sink in. FHE operations are orders of magnitude more expensive than plaintext.
- The biggest optimization is choosing the right type: euint8 is much cheaper than euint256.
- The second biggest optimization is reducing the number of FHE operations per transaction.
- Show before/after optimizations with gas profiler output.

**Discussion Questions:**
1. "Given the gas costs, what types of applications are economically viable with FHE today?"
2. "When would you choose to store a value in plaintext vs encrypted, in a hybrid contract?"
3. "How do you expect FHE gas costs to change over the next 2-5 years?"

**Common Pitfalls:**
- Students over-optimize readability for gas savings. Emphasize: correctness and security first, then optimize.
- Using larger types than necessary "just in case" --- this is the most common waste.
- Students forget that comparisons are expensive too, not just arithmetic.

**Time Allocation:**
| Segment | Duration |
|---|---|
| Gas cost table walkthrough | 25 min |
| Type selection strategies | 20 min |
| Operation minimization patterns | 20 min |
| Gas profiling demo | 15 min |
| Exercise 1: ERC-20 Optimization | 30 min |
| Exercise 2: Rewrite Inefficient Contract | 25 min |
| Exercise 3: Benchmark Matrix | 20 min |
| Quiz | 10 min |

---

### Module 10: Security Patterns & Auditing

**Duration:** 4 hours
**Teaching Style:** Case study + audit workshop

**Key Teaching Points:**
- The core insight: even with encrypted data, a public blockchain reveals metadata (who transacts, when, gas used, storage changes).
- The "revert vs select" principle: encrypted contracts should never revert on business logic conditions, because reverts leak information.
- Walk through the security checklist (`resources/SECURITY_CHECKLIST.md`) item by item.
- The audit exercise is the most engaging part --- let students find bugs independently before revealing answers.

**Discussion Questions:**
1. "If a contract reverts when a transfer has insufficient balance, what information does the attacker learn?"
2. "Can an attacker learn the encrypted balance of a user by observing gas usage across multiple transactions?"
3. "What information does event emission leak in an encrypted contract?"
4. "How does the trust model change when the Gateway is operated by a centralized party?"

**Common Pitfalls:**
- Students assume encryption = security. Emphasize the metadata leakage vectors.
- "Security theater" --- adding encryption without analyzing what is actually protected.
- Over-focusing on smart contract vulnerabilities (reentrancy, overflow) while ignoring FHE-specific issues (ACL, decryption leakage).

**Time Allocation:**
| Segment | Duration |
|---|---|
| FHE threat model | 30 min |
| Information leakage vectors | 25 min |
| Secure design patterns | 25 min |
| Security checklist walkthrough | 20 min |
| Exercise 1: Audit the Lottery | 40 min |
| Exercise 2: Fix the Voting Contract | 30 min |
| Exercise 3: ERC-20 Security Report | 25 min |
| Quiz | 15 min |

---

### Module 11: Confidential Voting System

**Duration:** 5 hours
**Teaching Style:** Guided project build

**Key Teaching Points:**
- Voting is the "killer demo" for FHE --- it is immediately intuitive why encrypted computation matters here.
- Homomorphic tallying with `FHE.add` is elegant: each encrypted vote is added to an encrypted running total.
- The hardest part is preventing double votes without revealing who voted for what. Discuss trade-offs.
- The reveal mechanism (Gateway callback) should only trigger after the voting period ends.

**Discussion Questions:**
1. "How can you prevent double voting if you cannot see who has already voted?"
2. "Should the voter be able to verify their own vote was counted? How would you implement that with FHE?"
3. "What information leaks when the final tally is revealed? Can partial information be inferred?"

**Time Allocation:**
| Segment | Duration |
|---|---|
| Voting system design | 30 min |
| Encrypted ballot and tally architecture | 25 min |
| Exercise 1: Core Voting Contract | 60 min |
| Voter eligibility and double-vote prevention | 25 min |
| Exercise 2: Eligibility and Anti-Double-Vote | 45 min |
| Tally reveal via Gateway | 20 min |
| Exercise 3: Reveal + E2E Tests | 35 min |
| Quiz | 10 min |

---

### Module 12: Sealed-Bid Auction

**Duration:** 5 hours
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

**Time Allocation:**
| Segment | Duration |
|---|---|
| Auction type overview | 20 min |
| Sealed-bid design with FHE | 25 min |
| Running maximum pattern | 20 min |
| Exercise 1: First-Price Auction | 60 min |
| Vickrey extension (second-price) | 25 min |
| Exercise 2: Vickrey Auction | 50 min |
| Deposit management and refunds | 20 min |
| Exercise 3: Full Auction with Tests | 35 min |
| Quiz | 10 min |

---

### Module 13: Confidential DeFi Primitives

**Duration:** 5 hours
**Teaching Style:** Design workshop + selective implementation

**Key Teaching Points:**
- Not everything in DeFi can or should be encrypted. The design discussion is as valuable as the code.
- Confidential order books are the most implementable primitive with current fhEVM capabilities.
- The AMM design exercise (whitepaper-level) teaches architectural thinking without requiring full implementation.
- Compliance is the elephant in the room --- address it directly.

**Discussion Questions:**
1. "If order book prices are encrypted, how does a user know the current market price?"
2. "Can you build a private AMM? What fundamental challenges arise?"
3. "How do encrypted DeFi protocols handle compliance and regulatory reporting?"
4. "What is the MEV protection value of encrypted transactions? Is it sufficient justification for the gas overhead?"

**Time Allocation:**
| Segment | Duration |
|---|---|
| DeFi privacy landscape | 25 min |
| Confidential order book design | 25 min |
| Exercise 1: Order Book Implementation | 60 min |
| Private lending design | 25 min |
| Exercise 2: Lending Position Tracker | 50 min |
| AMM analysis and design discussion | 25 min |
| Exercise 3: AMM Whitepaper | 20 min |
| Quiz | 10 min |

---

### Module 14: Capstone Project

**Duration:** 8 hours
**Teaching Style:** Mentored independent work

**Key Teaching Points:**
- The instructor's role shifts from teacher to mentor. Give guidance, not answers.
- Require a written proposal before implementation begins. This prevents scope creep.
- Check in with each student/team at least 3 times during implementation.
- Presentations should be 5-10 minutes: problem statement, architecture, demo, lessons learned.

**Discussion Questions (for proposal review):**
1. "What data in your application needs to be encrypted? What can remain in plaintext?"
2. "What is the minimum viable version of your project?"
3. "What are the security assumptions and trust boundaries?"

**Time Allocation:**
| Segment | Duration |
|---|---|
| Project scoping and proposal writing | 30 min |
| Proposal review (instructor feedback) | 30 min |
| Design and architecture | 60 min |
| Implementation (mentored) | 180 min |
| Testing | 60 min |
| Documentation | 45 min |
| Presentation prep | 15 min |
| Presentations + Q&A | 60 min |

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
5. **Condense Module 13:** DeFi Primitives can be reduced to a design discussion + one exercise if time is tight.

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
| Hardhat compile error: "pragma" | Wrong Solidity version | Ensure `hardhat.config.ts` specifies `0.8.24` |
| "Cannot find module fhevm" | Incomplete install | Delete `node_modules`, run `npm install` again |
| Gateway timeout during decryption | Network issue / Sepolia down | Check Ethereum Sepolia status; fall back to mock mode |
| "Out of gas" on FHE operations | Gas limit too low | Increase gas limit in hardhat config (30M+) |
| TypeScript errors in tests | Missing type declarations | Install `@types/mocha`, `@types/chai` |
| Node.js version error | Node < 20 | Upgrade Node.js using nvm: `nvm install 20` |

### Emergency Fallback

If the devnet is down or network issues prevent remote deployment, switch entirely to local mock mode. All exercises can be completed in mock mode. Adjust the teaching to note: "On a real network, this would involve actual FHE computation. In mock mode, the operations are simulated but the logic is identical."
