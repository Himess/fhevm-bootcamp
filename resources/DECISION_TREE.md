# FHE Pattern Decision Tree

> "Which FHE pattern should I use?" — A quick-reference guide for choosing the right approach.

## Flowchart

```mermaid
flowchart TD
    START([What are you building?]) --> Q1{Does your contract<br/>store private data?}

    Q1 -->|No| PLAIN[Use standard Solidity<br/>No FHE needed]
    Q1 -->|Yes| Q2{What type of<br/>private data?}

    Q2 -->|Balances / Tokens| ERC20[Confidential ERC-20<br/>Module 11]
    Q2 -->|Votes / Ballots| VOTE[Private Voting<br/>Module 12]
    Q2 -->|Bids / Prices| AUCTION[Sealed-Bid Auction<br/>Module 13]
    Q2 -->|Collateral / Loans| DEFI[Confidential DeFi<br/>Module 18]
    Q2 -->|General state| Q3{Do operations need<br/>to branch on results?}

    Q3 -->|Yes, need branching| SELECT[FHE.select Pattern<br/>Module 08]
    Q3 -->|No, just compute| Q4{Can the result<br/>be public?}

    Q4 -->|Yes, eventually| DECRYPT[Decryption Pattern<br/>Module 07]
    Q4 -->|No, stays private| ACL[ACL + allowThis<br/>Module 05]

    ERC20 --> PATTERN1{Need error<br/>reporting?}
    VOTE --> PATTERN2{Need result<br/>reveal?}
    AUCTION --> PATTERN2
    DEFI --> PATTERN1

    PATTERN1 -->|Yes| SILENT[Silent Failure + LastError<br/>Module 08 + 16]
    PATTERN1 -->|No| SELECT

    PATTERN2 -->|Yes| PUBDEC[makePubliclyDecryptable<br/>Module 07]
    PATTERN2 -->|No| ACL

    SELECT --> OPT{Worried about<br/>gas costs?}
    SILENT --> OPT
    PUBDEC --> OPT
    ACL --> OPT

    OPT -->|Yes| GAS[Gas Optimization<br/>Module 15]
    OPT -->|No| SEC{Security<br/>concerns?}

    GAS --> SEC

    SEC -->|Yes| SECURITY[Security Patterns<br/>Module 16]
    SEC -->|No| DONE([Ready to build!])
    SECURITY --> DONE
```

## Quick Reference Table

| Scenario | Pattern | Key Module | Key Functions |
|----------|---------|------------|---------------|
| Private token balances | Confidential ERC-20 | 11 | `FHE.add`, `FHE.sub`, `FHE.select` |
| Secret voting | Private Voting | 12 | `FHE.select`, `makePubliclyDecryptable` |
| Hidden bids | Sealed-Bid Auction | 13 | `FHE.gt`, `FHE.select`, `userDecrypt` |
| Error without reverting | Silent Failure | 08, 16 | `FHE.select` + LastError enum |
| Conditional state update | FHE.select | 08 | `FHE.select(condition, ifTrue, ifFalse)` |
| Let user see their data | User Decryption | 07 | `FHE.allow`, `userDecrypt` |
| Make data fully public | Public Decryption | 07 | `makePubliclyDecryptable` |
| Cross-contract FHE | Advanced Patterns | 17 | `FHE.allowTransient`, `FHE.allow` |
| On-chain randomness | FHE Randomness | 09 | `FHE.randEuintXX()` |
| Small value optimization | Gas Optimization | 15 | Use `euint8` instead of `euint64` |
| Known constant in math | Plaintext Operand | 15 | `FHE.add(enc, 10)` not `FHE.add(enc, FHE.asEuint32(10))` |

## Common Anti-Patterns

1. **Branching on encrypted data** — `if (FHE.gt(a, b))` does NOT work. Use `FHE.select()` instead.
2. **Using `require()` with FHE comparison** — `ebool` cannot be used in `require()`. Use the Silent Failure pattern.
3. **Over-sized encrypted types** — Don't use `euint64` for values that fit in `euint8`. Smaller types = cheaper gas.
4. **Encrypting constants** — `FHE.add(enc, FHE.asEuint32(10))` wastes gas. Use `FHE.add(enc, 10)` with a plaintext operand.
5. **Missing ACL grants** — After every state update, call `FHE.allowThis()` and `FHE.allow(value, user)`.
6. **Forgetting `FHE.isInitialized()`** — Always validate `FHE.fromExternal()` results before using them.
7. **Marking FHE functions as `view`** — FHE operations modify internal state. They cannot be `view` or `pure`.
