# FHEVM Bootcamp -- Full Syllabus

**Version:** 2.0
**Total Modules:** 15 (Modules 00 through 14)
**Total Duration:** ~46 hours
**API Version:** New FHEVM API (`FHE` library, `externalEuintXX` inputs, `FHE.fromExternal(value, proof)`)

---

## Assessment System

| Component | Weight | Description |
|---|---|---|
| **Quizzes** | 20% | End-of-module knowledge checks. Mix of multiple choice, true/false, and short answer. |
| **Exercises** | 40% | Hands-on coding assignments graded on correctness (50%), code quality (25%), and security considerations (25%). |
| **Capstone Project** | 40% | Original FHE application with smart contracts, tests, documentation, and a presentation. |

**Passing Requirements:**
- Overall score of 70% or higher.
- Minimum 60% in each individual component.
- Capstone must compile, deploy, and pass all provided test cases.

**Grading Scale:**

| Grade | Range |
|---|---|
| Distinction | 90--100% |
| Merit | 80--89% |
| Pass | 70--79% |
| Fail | Below 70% |

---

## Module 00: Prerequisites & Solidity Review

**Level:** Beginner
**Duration:** 2 hours
**Prerequisites:** Basic programming experience, familiarity with blockchain concepts

### Description

This module ensures all students have the foundational knowledge needed for the bootcamp. It covers Solidity fundamentals (types, functions, modifiers, mappings, events), development tooling basics (Hardhat, Node.js, npm), and a conceptual introduction to encryption and privacy on public blockchains. Students who are already proficient in Solidity can use this as a quick refresher.

### Learning Objectives

By the end of this module, students will be able to:

1. Write basic Solidity contracts using mappings, structs, modifiers, and events.
2. Compile and deploy contracts using a Hardhat project.
3. Explain why public blockchains leak information and why privacy solutions are needed.
4. Describe the difference between symmetric, asymmetric, and homomorphic encryption at a high level.
5. Set up a working Node.js development environment with Hardhat.

### Topics Covered

- Solidity review: value types, reference types, mappings, structs, enums
- Functions, visibility, modifiers, and access control patterns
- Events and logging
- Hardhat project structure: `hardhat.config.ts`, `contracts/`, `test/`, `scripts/`
- Node.js and npm essentials
- Why blockchain privacy matters: front-running, MEV, data exposure
- Encryption primer: symmetric vs asymmetric vs homomorphic (conceptual)

### Hands-on Activities

- **Activity 1:** Set up a Hardhat project from scratch, compile and deploy a simple `Counter` contract.
- **Activity 2:** Write a Solidity contract with mappings, modifiers, and events; write a basic test.
- **Quiz:** 10 questions on Solidity basics and blockchain privacy motivation.

---

## Module 01: Introduction to FHE

**Level:** Beginner
**Duration:** 2 hours
**Prerequisites:** Module 00

### Description

This module introduces the cryptographic foundations behind Fully Homomorphic Encryption. Students explore the evolution from basic encryption to FHE, understand what makes homomorphic operations possible, and build intuition for why FHE is transformative for blockchain privacy. The focus is on conceptual understanding -- no FHE coding is required yet.

### Learning Objectives

By the end of this module, students will be able to:

1. Explain what "fully homomorphic" means and why it took decades to achieve.
2. Identify the core FHE schemes (BGV, BFV, CKKS, TFHE) and their trade-offs.
3. Articulate why FHE on blockchain solves problems that ZK proofs and TEEs cannot.
4. Describe the noise budget concept and its implications for computation depth.
5. Explain the fhEVM architecture at a high level: EVM + TFHE coprocessor.

### Topics Covered

- History of encryption: from classical ciphers to FHE
- Partially homomorphic encryption (PHE) vs Somewhat (SHE) vs Fully (FHE)
- The breakthrough: Gentry's 2009 lattice-based construction
- TFHE scheme deep dive: lookup tables, bootstrapping, programmable bootstrapping
- Noise growth and management
- FHE vs ZK proofs vs TEEs vs MPC: comparison matrix
- Real-world FHE applications: healthcare, finance, voting, machine learning
- Introduction to Zama's fhEVM: how FHE is brought to the EVM

### Hands-on Activities

- **Activity 1:** Paper exercise -- manually trace a simple homomorphic addition on small numbers.
- **Activity 2:** Group discussion -- map 5 real-world use cases to the appropriate privacy technology (FHE, ZK, TEE, MPC).
- **Quiz:** 10 multiple-choice questions on cryptographic concepts and FHE fundamentals.

---

## Module 02: Development Setup

**Level:** Beginner
**Duration:** 2 hours
**Prerequisites:** Module 01

### Description

This module covers the complete fhEVM development environment setup. Students install and configure Hardhat with the fhEVM plugin, understand the coprocessor architecture, the key management system, and the on-chain/off-chain split. By the end, every student will have deployed and interacted with their first encrypted contract.

### Learning Objectives

By the end of this module, students will be able to:

1. Set up a complete Hardhat development environment with the fhEVM plugin.
2. Diagram the fhEVM architecture including the coprocessor, gateway, and on-chain components.
3. Explain the role of the global FHE key and per-ciphertext ACL system.
4. Deploy and interact with a minimal encrypted contract on a local devnet.
5. Describe the lifecycle of an encrypted transaction from client to chain to coprocessor and back.

### Topics Covered

- fhEVM architecture overview: EVM + TFHE coprocessor
- The coprocessor model: why FHE operations are offloaded
- Key management: global FHE public key, network key, user keys
- The Gateway: decryption oracle and callback mechanism
- `ZamaEthereumConfig` base contract and configuration
- Development environment setup: Hardhat, fhEVM plugin, fhevmjs
- Local devnet vs Zama devnet vs mainnet considerations
- First contract: compile, deploy, interact

### Hands-on Activities

- **Activity 1:** Install and configure the full development stack (Hardhat + fhEVM plugin).
- **Activity 2:** Deploy the "HelloFHEVM" contract and interact with it via scripts.
- **Activity 3:** Trace a transaction through the architecture using devnet explorer/logs.
- **Quiz:** 8 questions on architecture components and their roles.

---

## Module 03: Encrypted Types

**Level:** Beginner
**Duration:** 3 hours
**Prerequisites:** Module 02

### Description

Students learn every encrypted type available in fhEVM, from `ebool` to `euint256` and `eaddress`. They practice declaring, storing, and manipulating encrypted state variables. This module focuses on type fundamentals -- understanding what each type is, its size, its plaintext equivalent, and how to cast between types. Operations are covered in the next module.

### Learning Objectives

By the end of this module, students will be able to:

1. List all encrypted types (`ebool`, `euint4` through `euint256`, `eaddress`, `ebytes64/128/256`) and their plaintext equivalents.
2. Declare and initialize encrypted state variables in Solidity contracts.
3. Cast between encrypted types using `FHE.asEuintXX()` functions.
4. Explain overflow/wrapping behavior and range limitations for each type.
5. Choose the appropriate encrypted type for a given use case.

### Topics Covered

- Encrypted boolean: `ebool`
- Encrypted unsigned integers: `euint4`, `euint8`, `euint16`, `euint32`, `euint64`, `euint128`, `euint256`
- Encrypted address: `eaddress`
- Encrypted byte arrays: `ebytes64`, `ebytes128`, `ebytes256`
- Type casting: `FHE.asEuint8()`, `FHE.asEuint32()`, etc.
- Wrapping behavior on overflow/underflow
- Plaintext-to-encrypted conversion: `FHE.asEuint32(plaintextValue)`
- Storage patterns: `mapping(address => euint64)`, encrypted struct fields
- Choosing the right type: gas implications of larger types

### Hands-on Activities

- **Exercise 1:** Build a contract that declares and stores each encrypted type, then retrieves them.
- **Exercise 2:** Write a contract that safely converts between `euint8`, `euint32`, and `euint64`.
- **Exercise 3:** Implement an "Encrypted Registry" with different encrypted types for different fields.
- **Quiz:** 10 questions on type properties, casting rules, and type selection.

---

## Module 04: Operations: Arithmetic, Bitwise, Comparison

**Level:** Intermediate
**Duration:** 3 hours
**Prerequisites:** Module 03

### Description

This module covers the full set of operations available on encrypted types: arithmetic (add, sub, mul, div, rem), bitwise (and, or, xor, not), shift (shl, shr, rotl, rotr), comparison (eq, ne, gt, ge, lt, le), and min/max. Students practice combining operations to build encrypted computation pipelines.

### Learning Objectives

By the end of this module, students will be able to:

1. Perform arithmetic operations (`FHE.add`, `FHE.sub`, `FHE.mul`, `FHE.div`, `FHE.rem`) on encrypted integers.
2. Apply bitwise operations (`FHE.and`, `FHE.or`, `FHE.xor`, `FHE.not`) and shift operations (`FHE.shl`, `FHE.shr`, `FHE.rotl`, `FHE.rotr`) to encrypted values.
3. Use all comparison operators (`FHE.eq`, `FHE.ne`, `FHE.gt`, `FHE.ge`, `FHE.lt`, `FHE.le`) and understand they return `ebool`.
4. Use `FHE.min`, `FHE.max`, and `FHE.neg` on encrypted values.
5. Mix encrypted and plaintext operands in operations.

### Topics Covered

- Arithmetic operations: `FHE.add`, `FHE.sub`, `FHE.mul`, `FHE.div`, `FHE.rem`
- Minimum and maximum: `FHE.min`, `FHE.max`
- Negation: `FHE.neg`
- Bitwise operations: `FHE.and`, `FHE.or`, `FHE.xor`, `FHE.not`
- Shift operations: `FHE.shl`, `FHE.shr`, `FHE.rotl`, `FHE.rotr`
- Comparison operations: `FHE.eq`, `FHE.ne`, `FHE.gt`, `FHE.ge`, `FHE.lt`, `FHE.le`
- Operations with plaintext second operands (mixed encrypted/plaintext)
- Operation type compatibility rules
- Gas cost differences between operation types and bit widths
- Chaining operations: building computation pipelines

### Hands-on Activities

- **Exercise 1:** Build an "Encrypted Calculator" contract supporting add, sub, mul, div on `euint32` values.
- **Exercise 2:** Implement an encrypted bitwise flag register using `euint8` with set, clear, toggle, and check operations.
- **Exercise 3:** Write a contract that computes encrypted statistics: min, max, and sum of a set of encrypted values.
- **Quiz:** 12 questions on operation rules, type compatibility, and comparison behavior.

---

## Module 05: Access Control / ACL

**Level:** Intermediate
**Duration:** 3 hours
**Prerequisites:** Module 04

### Description

The ACL (Access Control List) system is fundamental to fhEVM security. Every encrypted value has an associated set of addresses permitted to use it. This module covers the full ACL API, transient vs persistent permissions, common permission patterns, and the pitfalls of incorrect ACL management.

### Learning Objectives

By the end of this module, students will be able to:

1. Explain why ACLs are necessary for encrypted values in a public blockchain.
2. Use `FHE.allow()` and `FHE.allowThis()` to grant persistent permissions.
3. Use `FHE.allowTransient()` for gas-efficient temporary access within a transaction.
4. Design correct permission flows for multi-party encrypted interactions.
5. Debug common ACL errors ("Unauthorized access to ciphertext").

### Topics Covered

- Why ACLs exist: the problem of ciphertext reuse and unauthorized computation
- Persistent ACL: `FHE.allow(ciphertext, address)`, `FHE.allowThis(ciphertext)`
- Transient ACL: `FHE.allowTransient(ciphertext, address)` for single-transaction access
- Sender permissions: `FHE.isSenderAllowed(ciphertext)`
- The "allow dance": granting permissions after every state change
- Multi-contract ACL flows: contract A calls contract B with encrypted values
- Common ACL patterns: owner-only, multi-party, delegated access
- Debugging: reading ACL state, understanding error messages

### Hands-on Activities

- **Exercise 1:** Build a "Secret Vault" where only the depositor can view their encrypted balance.
- **Exercise 2:** Implement a two-party escrow where both parties can view the escrowed amount.
- **Exercise 3:** Debug a provided contract with 5 intentional ACL bugs.
- **Quiz:** 10 questions on ACL mechanics and permission patterns.

---

## Module 06: Encrypted Inputs & Proofs

**Level:** Intermediate
**Duration:** 3 hours
**Prerequisites:** Module 05

### Description

Encrypted inputs arrive at smart contracts as `externalEuintXX` types from the client side. This module covers the full input pipeline: client-side encryption with `fhevmjs`, the `externalEuintXX` type system, conversion with `FHE.fromExternal(value, proof)`, and input validation strategies for encrypted data.

### Learning Objectives

By the end of this module, students will be able to:

1. Encrypt values on the client side using `fhevmjs` and submit them as contract inputs.
2. Receive and convert encrypted inputs using `externalEuintXX` types and `FHE.fromExternal(value, proof)`.
3. Implement input validation patterns for encrypted values (range checks, non-zero checks).
4. Handle multiple encrypted inputs in a single transaction.
5. Explain the security properties of the input encryption scheme and the role of ZKP proofs.

### Topics Covered

- Client-side encryption with `fhevmjs`: `createInstance()`, `encrypt()`, contract integration
- The `externalEuintXX` type family: `externalEbool`, `externalEuint4` through `externalEuint256`, `externalEaddress`, `externalEbytes64` through `externalEbytes256`
- Converting inputs: `FHE.fromExternal(externalEuint32, proof)` returns `euint32`
- ZKP proofs: ensuring input validity without revealing values
- Input validation on encrypted data: range bounds, non-zero assertions
- Handling multiple encrypted parameters in a single function
- Gas implications of input processing
- Error handling for malformed inputs

### Hands-on Activities

- **Exercise 1:** Write a client script that encrypts a value with `fhevmjs` and sends it to a contract.
- **Exercise 2:** Build a contract function that accepts three encrypted inputs using `externalEuintXX` and converts them with `FHE.fromExternal(value, proof)`.
- **Exercise 3:** Implement a "Sealed Envelope" contract where users submit encrypted messages via `externalEbytes256`.
- **Quiz:** 8 questions on the input pipeline, `externalEuintXX` types, and client-side encryption.

---

## Module 07: Decryption Patterns

**Level:** Intermediate
**Duration:** 3 hours
**Prerequisites:** Module 06

### Description

Eventually, encrypted results must be revealed. This module covers the asynchronous decryption mechanism via the Gateway, the callback pattern, re-encryption for user-specific decryption via `FHE.sealoutput()`, and the security implications of when and what to decrypt. Students learn that decryption is a design decision with privacy trade-offs.

### Learning Objectives

By the end of this module, students will be able to:

1. Request asynchronous decryption through the Gateway and handle the callback.
2. Implement the callback pattern with proper validation and state management.
3. Use re-encryption (`FHE.sealoutput()`) to allow specific users to decrypt values client-side.
4. Evaluate the privacy implications of different decryption strategies.
5. Design contracts that minimize unnecessary decryption.

### Topics Covered

- The Gateway: decryption oracle architecture
- Requesting decryption: `Gateway.requestDecryption()`
- Callback functions: receiving decrypted values asynchronously
- Callback validation: ensuring only the Gateway can call back
- Re-encryption: `FHE.sealoutput()` for user-specific encrypted returns
- Client-side re-encryption with `fhevmjs`
- Privacy analysis: what information leaks when you decrypt?
- Design patterns: lazy decryption, batched decryption, event-driven reveals
- Common mistakes: decrypting too early, decrypting to storage, race conditions

### Hands-on Activities

- **Exercise 1:** Implement a contract that stores an encrypted counter and reveals it on-demand via Gateway callback.
- **Exercise 2:** Build a "Private Balance Viewer" using `FHE.sealoutput()` so only the balance owner can see their value.
- **Exercise 3:** Design and implement a "Timed Reveal" mechanism that decrypts a sealed value after a block deadline.
- **Quiz:** 10 questions on decryption mechanisms, callbacks, and privacy implications.

---

## Module 08: Conditional Logic / FHE.select

**Level:** Intermediate
**Duration:** 3 hours
**Prerequisites:** Module 07

### Description

Since encrypted values cannot be directly inspected, traditional `if/else` branching is impossible. This module teaches the fundamental pattern of FHE programming: using `ebool` results from comparisons with the `FHE.select()` function as an encrypted ternary operator. Students learn to restructure imperative logic into branchless, ciphertext-compatible forms.

### Learning Objectives

By the end of this module, students will be able to:

1. Use `FHE.select(ebool, valueIfTrue, valueIfFalse)` for conditional assignments.
2. Combine encrypted booleans using `FHE.and`, `FHE.or`, `FHE.xor`, `FHE.not` to build complex conditions.
3. Refactor branching logic (if/else) into branchless select-based patterns.
4. Implement multi-condition encrypted logic chains using nested selects.
5. Apply the "compute both paths, select the result" pattern consistently.

### Topics Covered

- Why `if (encryptedBool)` is impossible and what to do instead
- The `FHE.select` pattern: encrypted ternary without branching
- Boolean logic on `ebool`: `FHE.and(ebool, ebool)`, `FHE.or`, `FHE.xor`, `FHE.not`
- Nested selects for multi-way branching
- The "compute both paths, select the result" paradigm
- Pattern: conditional balance updates (the "silent fail" transfer)
- Pattern: encrypted clamp (constrain value between min and max)
- Pattern: encrypted eligibility checking with multiple criteria
- Performance: cost of selects and comparisons
- Refactoring guide: converting if/else to FHE.select

### Hands-on Activities

- **Exercise 1:** Implement an encrypted "Clamp" function that constrains a value between encrypted min and max using `FHE.select`.
- **Exercise 2:** Build an encrypted eligibility checker with 3+ criteria combined using boolean logic and `FHE.select`.
- **Exercise 3:** Refactor a provided plaintext contract with 5 `if/else` blocks into fully encrypted branchless logic.
- **Quiz:** 10 questions on select patterns, branchless thinking, and conditional logic design.

---

## Module 09: On-Chain Randomness

**Level:** Intermediate
**Duration:** 2 hours
**Prerequisites:** Module 08

### Description

fhEVM provides built-in encrypted random number generation that is both unpredictable and private. This module covers the `FHE.randEuintXX()` family of functions, their security properties, use cases (gaming, lotteries, shuffling), and best practices for using on-chain randomness in FHE contracts.

### Learning Objectives

By the end of this module, students will be able to:

1. Generate encrypted random numbers using `FHE.randEuint8()`, `FHE.randEuint16()`, `FHE.randEuint32()`, `FHE.randEuint64()`, and `FHE.randEbool()`.
2. Explain the security properties of fhEVM's encrypted randomness (unpredictability, privacy).
3. Use encrypted randomness in practical applications: gaming, lotteries, random selection.
4. Apply range reduction techniques to constrain random values to specific ranges.
5. Identify and avoid common pitfalls with on-chain randomness.

### Topics Covered

- Encrypted random number generation: `FHE.randEuint8()`, `FHE.randEuint16()`, `FHE.randEuint32()`, `FHE.randEuint64()`
- Encrypted random boolean: `FHE.randEbool()`
- Security model: why FHE randomness is different from `block.prevrandao`
- Range reduction: using `FHE.rem` to constrain to a range
- Use cases: lotteries, random assignment, shuffling, gaming mechanics
- Combining randomness with `FHE.select` for probabilistic outcomes
- Best practices: when to generate, how to store, ACL for random values
- Common pitfalls: bias in range reduction, predictability concerns

### Hands-on Activities

- **Exercise 1:** Build a "Coin Flip" contract using `FHE.randEbool()` with encrypted outcome and timed reveal.
- **Exercise 2:** Implement an encrypted lottery where a random winner is selected from participants.
- **Exercise 3:** Create a contract that randomly assigns encrypted roles to participants using `FHE.randEuint8()` and `FHE.rem`.
- **Quiz:** 8 questions on encrypted randomness, security properties, and best practices.

---

## Module 10: Frontend Integration

**Level:** Intermediate
**Duration:** 3 hours
**Prerequisites:** Module 09

### Description

This module bridges the gap between smart contracts and user-facing applications. Students learn to build frontends that interact with fhEVM contracts using `fhevmjs`, ethers.js/viem, and React. Topics include client-side encryption of inputs, re-decryption of sealed outputs, and building a complete dApp workflow.

### Learning Objectives

By the end of this module, students will be able to:

1. Initialize the `fhevmjs` client library and connect it to an fhEVM network.
2. Encrypt user inputs on the frontend and submit them as `externalEuintXX` parameters.
3. Request and process re-encrypted (sealed) outputs for display to the user.
4. Build a complete React frontend for an fhEVM contract.
5. Handle wallet connection, transaction signing, and encrypted state display.

### Topics Covered

- `fhevmjs` SDK: installation, initialization, `createInstance()`
- Client-side encryption: `instance.encrypt()` for different types
- Submitting encrypted inputs: encoding for contract calls
- Re-decryption on the frontend: requesting sealed output, decrypting with user key
- React integration patterns: hooks, state management for encrypted data
- ethers.js and viem integration with fhEVM
- Wallet connection: MetaMask, WalletConnect with fhEVM
- UX patterns: loading states for async decryption, encrypted value display
- Error handling: network errors, encryption failures, decryption timeouts

### Hands-on Activities

- **Exercise 1:** Build a React frontend that connects to a deployed encrypted counter contract, encrypts increments, and displays the decrypted count.
- **Exercise 2:** Implement a "Private Note" dApp where users write encrypted notes and only they can read them back.
- **Exercise 3:** Create a full dApp interface for the Secret Vault contract from Module 05 with deposit, view balance, and withdraw.
- **Quiz:** 8 questions on frontend integration, `fhevmjs` API, and client-side encryption.

---

## Module 11: Confidential ERC-20

**Level:** Advanced
**Duration:** 4 hours
**Prerequisites:** Module 10

### Description

This flagship project module guides students through building a complete ERC-20-like token where all balances and transfer amounts are encrypted. It ties together every concept from previous modules: encrypted types, ACL management, input handling via `externalEuintXX` and `FHE.fromExternal(value, proof)`, conditional transfers using `FHE.select`, and selective decryption. This is the most referenced pattern in real fhEVM applications.

### Learning Objectives

By the end of this module, students will be able to:

1. Implement an encrypted ERC-20 token with confidential balances and transfer amounts.
2. Handle the "sufficient balance" check using `FHE.ge()` and `FHE.select`.
3. Manage ACL permissions correctly across transfers, approvals, and allowances.
4. Implement encrypted `approve` and `transferFrom` with proper allowance management.
5. Add selective balance viewing via `FHE.sealoutput()` for the token holder.

### Topics Covered

- Encrypted ERC-20 design: what changes from standard ERC-20
- Encrypted storage: `mapping(address => euint64) private balances`
- Receiving transfer amounts: `externalEuint64` + `FHE.fromExternal(value, proof)`
- Encrypted minting: initializing encrypted balances
- Encrypted transfers: `FHE.ge()` for balance check, `FHE.select` for conditional balance updates
- The "silent fail" pattern: transfers that do nothing when balance is insufficient (no revert, no leak)
- Encrypted approvals and allowances: `approve`, `transferFrom`
- ACL management: `FHE.allow()` and `FHE.allowThis()` for every balance update
- Balance viewing: `FHE.sealoutput()` for the token holder
- Total supply considerations: public vs encrypted
- Events: what can and cannot be emitted without leaking information

### Hands-on Activities

- **Exercise 1:** Implement the core `ConfidentialERC20`: constructor inheriting `ZamaEthereumConfig`, `mint`, `transfer` (using `externalEuint64`, `FHE.fromExternal(value, proof)`, `FHE.ge()`, `FHE.select`), and `balanceOf` (re-encrypted via `FHE.sealoutput()`).
- **Exercise 2:** Add `approve`, `allowance`, and `transferFrom` with encrypted allowances.
- **Exercise 3:** Write a comprehensive test suite covering transfers, insufficient balances, approvals, and edge cases.
- **Quiz:** 12 questions on encrypted token design, ACL management, and implementation patterns.

---

## Module 12: Confidential Voting

**Level:** Advanced
**Duration:** 4 hours
**Prerequisites:** Module 11

### Description

Students build a complete confidential voting system where votes are encrypted, tallied homomorphically, and only the final result is decrypted. This application showcases FHE's unique value proposition: computing aggregate results without revealing individual inputs. The module covers design, implementation, testing, and security review.

### Learning Objectives

By the end of this module, students will be able to:

1. Design a confidential voting protocol using FHE: encrypted ballots, homomorphic tallying, threshold reveal.
2. Implement encrypted vote submission using `externalEuintXX` and `FHE.fromExternal(value, proof)`, with duplicate vote prevention.
3. Perform homomorphic aggregation using `FHE.add` to tally votes without decryption.
4. Handle the tally reveal using Gateway decryption with proper access controls.
5. Prevent common voting attacks: double voting, vote buying (partial), ballot stuffing.

### Topics Covered

- Voting system requirements: privacy, verifiability, correctness, resistance to manipulation
- Design: proposal creation, voting period, encrypted ballot submission, tally, reveal
- Encrypted vote storage: `euint32` counters for each option
- Vote submission: `externalEuint32` + `FHE.fromExternal(value, proof)` for encrypted ballots
- Homomorphic tallying: `FHE.add` to aggregate votes without decryption
- Voter eligibility: whitelists, token-gated voting, one-person-one-vote
- Preventing double votes without revealing who voted for what
- Tally reveal: Gateway decryption triggered by admin or time condition
- Partial results: why they should remain hidden until reveal
- Security analysis: what the voting contract can and cannot guarantee

### Hands-on Activities

- **Exercise 1:** Implement the core `ConfidentialVoting` contract: create proposal, submit encrypted vote via `externalEuint32`, tally via `FHE.add`.
- **Exercise 2:** Add voter eligibility (whitelist) and double-vote prevention.
- **Exercise 3:** Implement tally reveal via Gateway callback and write end-to-end tests.
- **Quiz:** 10 questions on confidential voting design and security.

---

## Module 13: Sealed-Bid Auction

**Level:** Advanced
**Duration:** 4 hours
**Prerequisites:** Module 12

### Description

A sealed-bid auction is a classic FHE application where bidders submit encrypted bids, the contract determines the winner homomorphically, and only the winning bid (and possibly the winner) is revealed. Students implement first-price and second-price (Vickrey) auction variants, learning advanced comparison and selection patterns using `FHE.gt`, `FHE.ge`, and `FHE.select`.

### Learning Objectives

By the end of this module, students will be able to:

1. Design a sealed-bid auction protocol with encrypted bids, homomorphic winner determination, and selective reveal.
2. Implement encrypted bid submission using `externalEuint64` and `FHE.fromExternal(value, proof)`.
3. Perform encrypted bid comparison using `FHE.gt` / `FHE.ge` and `FHE.select` to track the running maximum.
4. Implement both first-price and second-price (Vickrey) auction variants.
5. Analyze the security properties and limitations of on-chain sealed-bid auctions.

### Topics Covered

- Auction types: first-price, second-price (Vickrey), English, Dutch
- Design: bid submission (encrypted via `externalEuint64`), bid period, winner determination, reveal, settlement
- Encrypted bid storage and comparison: `FHE.gt` / `FHE.ge` and `FHE.select` to track the running maximum
- Vickrey auction: tracking both highest and second-highest bids homomorphically
- Bid deposits: linking plaintext deposits to encrypted bid validity
- Winner determination without revealing losing bids
- Selective reveal: only the winning bid/price is decrypted via Gateway
- Refund mechanism: returning deposits to losing bidders
- Time management: bid period, reveal period, settlement period
- Security: front-running protection, bid validity, collusion resistance

### Hands-on Activities

- **Exercise 1:** Implement a first-price sealed-bid auction with encrypted bids via `externalEuint64` and homomorphic winner selection using `FHE.gt` and `FHE.select`.
- **Exercise 2:** Extend to a Vickrey (second-price) auction where the winner pays the second-highest bid.
- **Exercise 3:** Add deposit management, refunds, and a complete test suite.
- **Quiz:** 10 questions on auction design, encrypted comparison patterns, and security.

---

## Module 14: Capstone: Confidential DAO

**Level:** Advanced
**Duration:** 5 hours
**Prerequisites:** All previous modules (00--13)

### Description

The capstone project is the culminating assessment of the bootcamp. Students design and implement a Confidential DAO that combines encrypted governance (voting with hidden vote weights), private treasury management (encrypted balances), and confidential proposal execution. This project demonstrates mastery of encrypted types, ACL management, conditional logic with `FHE.select`, decryption patterns, encrypted inputs via `externalEuintXX`, on-chain randomness, and frontend integration.

### Learning Objectives

By the end of this module, students will be able to:

1. Independently design an FHE application architecture from requirements to implementation.
2. Implement a complete Confidential DAO with encrypted governance, private treasury, and confidential proposals.
3. Integrate multiple FHE patterns: encrypted inputs (`externalEuintXX` + `FHE.fromExternal(value, proof)`), ACL management, `FHE.select`, Gateway decryption, `FHE.sealoutput()`, and `FHE.randEuintXX()`.
4. Write comprehensive tests that validate all encrypted logic paths.
5. Document the security model, trust assumptions, and known limitations.

### Topics Covered

- Project scoping and architecture design for a Confidential DAO
- Encrypted governance: hidden voting power, private delegation, shielded proposals
- Private treasury: encrypted balances, confidential fund allocation
- Combining all FHE patterns: types, operations, ACL, inputs, decryption, conditionals, randomness
- Testing strategies for complex multi-contract FHE systems
- Security analysis and threat modeling for DAO governance
- Documentation standards: README, architecture diagram, security model

### Suggested Confidential DAO Features

1. **Membership & Token-Weighted Voting** -- Encrypted governance token balances, private vote weights.
2. **Confidential Proposals** -- Encrypted proposal details revealed only after voting period.
3. **Private Treasury** -- DAO treasury with encrypted allocation amounts and confidential spending.
4. **Random Committee Selection** -- Using `FHE.randEuintXX()` to randomly select proposal reviewers.
5. **Delegation** -- Private delegation of voting power without revealing delegator-delegatee relationships.
6. **Threshold Execution** -- Proposals execute only when encrypted vote tally exceeds threshold (via Gateway decryption).

### Deliverables

| Deliverable | Weight |
|---|---|
| Smart contracts (compiles, deploys, works) | 30% |
| Test suite (comprehensive, all passing) | 20% |
| Documentation (README, security model, architecture) | 20% |
| Security analysis (threat model, mitigations) | 15% |
| Presentation (5--10 minute demo + Q&A) | 15% |

### Timeline

| Phase | Duration | Activity |
|---|---|---|
| Design | 1 hour | Architecture, data model, encrypted state design |
| Core Implementation | 2 hours | Smart contract development (governance + treasury) |
| Testing | 1 hour | Test suite development |
| Documentation & Presentation | 1 hour | Write docs, prepare demo |

### Hands-on Activities

- **Milestone 1:** Submit DAO design with architecture diagram, encrypted data model, and ACL permission map.
- **Milestone 2:** Core smart contracts (governance token, voting, treasury) compiled and deployed to local devnet.
- **Milestone 3:** Complete test suite with all tests passing.
- **Milestone 4:** Final submission with documentation and 5--10 minute presentation.

---

## Module Dependency Graph

```
Module 00 (Prerequisites & Solidity Review)
    |
Module 01 (Introduction to FHE)
    |
Module 02 (Development Setup)
    |
Module 03 (Encrypted Types)
    |
Module 04 (Operations: Arithmetic, Bitwise, Comparison)
    |
Module 05 (Access Control / ACL)
    |
Module 06 (Encrypted Inputs & Proofs)
    |
Module 07 (Decryption Patterns)
    |
Module 08 (Conditional Logic / FHE.select)
    |
Module 09 (On-Chain Randomness)
    |
Module 10 (Frontend Integration)
    |
Module 11 (Confidential ERC-20)
   / \
  /   \
Module 12       Module 13
(Voting)        (Auction)
  \   /
   \ /
Module 14 (Capstone: Confidential DAO)
```

---

## Appendix: Module Summary Table

| Module | Title | Level | Hours | Key Outcome |
|---|---|---|---|---|
| 00 | Prerequisites & Solidity Review | Beginner | 2 | Solidity fluency + dev environment ready |
| 01 | Introduction to FHE | Beginner | 2 | Understand FHE theory and motivation |
| 02 | Development Setup | Beginner | 2 | Working fhEVM dev environment + first deployment |
| 03 | Encrypted Types | Beginner | 3 | Fluency with all encrypted types and casting |
| 04 | Operations | Intermediate | 3 | Master arithmetic, bitwise, and comparison operations |
| 05 | Access Control / ACL | Intermediate | 3 | Master ACL permission system |
| 06 | Encrypted Inputs & Proofs | Intermediate | 3 | Client-to-contract encrypted input pipeline |
| 07 | Decryption Patterns | Intermediate | 3 | Gateway decryption and re-encryption |
| 08 | Conditional Logic / FHE.select | Intermediate | 3 | Branchless conditional logic with FHE.select |
| 09 | On-Chain Randomness | Intermediate | 2 | Encrypted random number generation |
| 10 | Frontend Integration | Intermediate | 3 | Complete dApp with fhevmjs frontend |
| 11 | Confidential ERC-20 | Advanced | 4 | Complete encrypted ERC-20 implementation |
| 12 | Confidential Voting | Advanced | 4 | Working confidential voting system |
| 13 | Sealed-Bid Auction | Advanced | 4 | Working sealed-bid auction |
| 14 | Capstone: Confidential DAO | Advanced | 5 | Original Confidential DAO project |
| | **Total** | | **46** | |

---

## Appendix: API Quick Reference

| Old/Incorrect API | Correct API |
|---|---|
| `TFHE` library | `FHE` library |
| `einput` | `externalEuintXX` (e.g., `externalEuint32`) |
| `FHE.asEuint32(einput, proof)` | `FHE.fromExternal(externalEuint32, proof)` |
| `FHE.randomEuint32()` | `FHE.randEuint32()` |
| `FHE.gte()` | `FHE.ge()` |
| (no base config) | Inherit `ZamaEthereumConfig` |
