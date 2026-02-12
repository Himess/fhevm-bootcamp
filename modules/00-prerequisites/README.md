# Module 00: Prerequisites

## Overview

This module provides a comprehensive refresher on Solidity fundamentals required before diving into Fully Homomorphic Encryption on the EVM. You will revisit core data types, contract patterns, the ERC-20 standard, and Hardhat testing workflows. By the end of this module you should feel confident reading and writing standard Solidity smart contracts.

---

## Module Details

| Field         | Value                     |
|---------------|---------------------------|
| **Level**     | Beginner                  |
| **Duration**  | 2 hours                   |
| **Prerequisites** | Basic programming knowledge (any language) |

---

## Learning Objectives

By completing this module you will be able to:

1. Declare and use Solidity value types (`uint`, `address`, `bool`) and reference types (`string`, `bytes`).
2. Define and interact with mappings and structs.
3. Emit events and understand their role in off-chain indexing.
4. Write custom modifiers for access control (`onlyOwner`).
5. Use `msg.sender`, `require`, and `revert` for input validation.
6. Describe the ERC-20 token standard interface and its core functions.
7. Write and run basic Hardhat tests using ethers.js and Chai.

---

## Contents

| Resource | Description |
|----------|-------------|
| [Lesson](lesson.md) | Full written lesson with code examples |
| [Slides](slides/slides.md) | Presentation slides (Marp format) |
| [Exercise](exercise.md) | Hands-on: Build a SimpleVault contract |
| [Quiz](quiz.md) | 10 multiple-choice review questions |
| [SimpleStorage.sol](../../contracts/SimpleStorage.sol) | Example contract: SimpleStorage |
| [BasicToken.sol](../../contracts/BasicToken.sol) | Example contract: BasicToken |
| [SimpleStorage.test.ts](../../test/SimpleStorage.test.ts) | Test: SimpleStorage |
| [BasicToken.test.ts](../../test/BasicToken.test.ts) | Test: BasicToken |

---

## Next Module

Once you are comfortable with the material here, proceed to:

> **[Module 01: Introduction to FHE](../01-intro-to-fhe/README.md)**
