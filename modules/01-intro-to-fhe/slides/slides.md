---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 01: Introduction to FHE"
---

<style>
section { font-size: 18px; overflow: hidden; color: #1E293B; }
h1 { font-size: 28px; margin-bottom: 8px; color: #1E40AF; border-bottom: 2px solid #DBEAFE; padding-bottom: 6px; }
h2 { font-size: 22px; margin-bottom: 6px; color: #155E75; }
h3 { font-size: 19px; color: #92400E; }
code { font-size: 15px; background: #F1F5F9; color: #3730A3; padding: 1px 4px; border-radius: 3px; }
pre { font-size: 13px; line-height: 1.25; margin: 6px 0; background: #1E293B; color: #E2E8F0; border-radius: 6px; padding: 10px; border-left: 3px solid #6366F1; }
pre code { background: transparent; color: #E2E8F0; padding: 0; }
li { margin-bottom: 1px; line-height: 1.4; }
table { font-size: 15px; border-collapse: collapse; width: 100%; }
th { background: #1E40AF; color: white; padding: 6px 10px; text-align: left; }
td { padding: 5px 10px; border-bottom: 1px solid #E2E8F0; }
tr:nth-child(even) { background: #F8FAFC; }
p { margin-bottom: 4px; }
ul, ol { margin-top: 4px; margin-bottom: 4px; }
header { color: #3B82F6 !important; }
footer { color: #94A3B8 !important; }
section.small { font-size: 15px; }
section.small h1 { font-size: 24px; margin-bottom: 6px; }
section.small ol li { margin-bottom: 0; line-height: 1.3; }
</style>

# Module 01: Introduction to Fully Homomorphic Encryption

**FHEVM Bootcamp**

Understanding the cryptography that makes confidential smart contracts possible

---

# Encryption Fundamentals

## Symmetric Encryption
```
Plaintext --[Shared Key]--> Ciphertext --[Shared Key]--> Plaintext
```
Same key encrypts and decrypts. Example: AES

## Asymmetric Encryption
```
Plaintext --[Public Key]--> Ciphertext --[Private Key]--> Plaintext
```
Different keys for encryption/decryption. Example: RSA, ECC

## The Limitation
To compute on encrypted data, you must **decrypt first**.
Whoever computes, **sees the data**.

<!--
Speaker notes: Start by grounding students in what they already know about encryption. The key insight to land here is: traditional encryption forces you to choose between security and usability. Pause on "whoever computes, sees the data" -- this is the exact problem FHE solves.
-->

---

# What is Homomorphic Encryption?

Encryption that allows **computation directly on ciphertext**.

## The Locked Ballot Box Analogy

```
  +----------+     +----------+     +----------+
  | Vote: A  |     | Vote: B  |     | Vote: A  |
  | (locked) |     | (locked) |     | (locked) |
  +----+-----+     +----+-----+     +----+-----+
       |                |                |
       +-------+--------+--------+-------+
               |                 |
               v                 v
        +--------------+  +-----------+
        | Tally Locked |  | Decrypt   |
        | Boxes        |  | Result    |
        +--------------+  +-----------+
                           Result: A=2, B=1
```

Nobody sees individual votes. The tally is mathematically correct.

<!--
Speaker notes: The ballot box analogy is the most intuitive way to explain FHE. Linger on this -- ask students to think about what other real-world processes work this way. This analogy maps directly to the voting contract in Module 12.
-->

---

# Types of Homomorphic Encryption

```
+--------+------------------+------------------+---------------------+
| Type   | Operations       | # of Operations  | Arbitrary Programs? |
+--------+------------------+------------------+---------------------+
| PHE    | One (add OR mul) | Unlimited        | No                  |
| SHE    | Both (add + mul) | Limited          | No                  |
| FHE    | Both (add + mul) | Unlimited        | Yes                 |
+--------+------------------+------------------+---------------------+
```

**PHE** (1977 - RSA, 1999 - Paillier): Only one operation type
**SHE**: Both operations but noise accumulates, eventually corrupts data
**FHE** (2009 - Gentry): **Bootstrapping** refreshes ciphertexts, enabling unlimited operations

<!--
Speaker notes: Emphasize the historical progression -- FHE was considered a "holy grail" of cryptography for decades. The breakthrough was Gentry's bootstrapping technique in 2009. Students do not need to understand the math, just the capability hierarchy.
-->

---

# TFHE: The FHE Scheme Behind Zama

## FHE = concept, TFHE = specific scheme Zama uses

| Property                    | Benefit                               |
|-----------------------------|---------------------------------------|
| Fast bootstrapping          | Milliseconds per gate                 |
| Exact arithmetic            | No approximation errors               |
| Boolean + integer support   | Natural fit for smart contract logic   |
| Programmable bootstrapping  | Evaluate lookup tables during refresh  |

## How it works (simplified)

```
  Plaintext --> Encode on torus --> Add noise --> Ciphertext
                                                      |
                                    Compute (add, mul, compare)
                                                      |
                              Noise too high? --> Bootstrap (refresh)
                                                      |
                                    Private key --> Decrypt --> Result
```

<!--
Speaker notes: Walk through the diagram step by step. The key differentiator of TFHE is fast bootstrapping -- this is what makes it practical for smart contracts. Mention that Zama's TFHE-rs library handles all of this under the hood.
-->

---

# The Blockchain Privacy Problem

## Everything is public on Ethereum

| What is exposed        | Consequence                           |
|------------------------|---------------------------------------|
| Token balances         | Anyone sees your wealth               |
| Transaction history    | Full financial surveillance           |
| DeFi positions         | Competitors see your strategy         |
| Swap transactions      | MEV bots front-run you                |
| Governance votes       | No secret ballot, coercion possible   |
| Smart contract state   | Even `private` vars are readable      |

## The `private` keyword is a lie

```solidity
uint256 private secretNumber = 42;
// Anyone can read this with eth_getStorageAt!
```

`private` only restricts **other contracts**, not external observers.

<!--
Speaker notes: This is often a shock to new blockchain developers. Demo eth_getStorageAt if possible to show how trivial it is to read "private" variables. This drives home why FHE is needed -- Solidity's privacy model is fundamentally broken.
-->

---

# Privacy Solutions Compared

```
+------------------+-----------+-----------+-----------+-----------+
|                  | ZK-Proofs |    MPC    |    TEE    |    FHE    |
+------------------+-----------+-----------+-----------+-----------+
| Data hidden      | From      | From each | From host | From      |
| from whom?       | verifier  | party     | OS        | everyone  |
+------------------+-----------+-----------+-----------+-----------+
| Compute on       |    No     |    Yes    |    Yes    |    Yes    |
| hidden data?     | (proves)  | (jointly) | (enclave) | (cipher)  |
+------------------+-----------+-----------+-----------+-----------+
| Hardware trust?  |    No     |    No     |    YES    |    No     |
+------------------+-----------+-----------+-----------+-----------+
| Performance      |   Fast    |  Medium   |   Fast    |   Slow    |
|                  | (verify)  |           |           | (growing) |
+------------------+-----------+-----------+-----------+-----------+
| On-chain?        |    Yes    |  Partial  |  Partial  |    Yes    |
+------------------+-----------+-----------+-----------+-----------+
```

**FHE provides the strongest privacy guarantee:**
Data is **never** decrypted during computation.

<!--
Speaker notes: Spend time on this comparison table -- students often confuse ZK proofs with FHE. ZK proves facts about hidden data but cannot compute on it. FHE computes on hidden data. TEEs require hardware trust. Ask: "Which solution would you want for a private voting system?"
-->

---

# About Zama

**Zama** -- A cryptography company making FHE accessible to developers.

| | |
|---|---|
| **Founded** | 2020, Paris, France |
| **Founders** | Rand Hindi (CEO), Pascal Paillier (CTO) |
| **Funding** | $70M+ (Multicoin Capital, Protocol Labs) |
| **Team** | 70+ researchers & engineers |
| **License** | Open-source (BSD) |

**Core Products:**
- **TFHE-rs** -- Pure Rust TFHE implementation (crypto engine)
- **Concrete** -- FHE compiler for Python/ML
- **fhEVM** -- FHE for Ethereum smart contracts
- **fhEVM Coprocessor** -- Off-chain FHE computation for blockchain

**Deployment:** Ethereum Sepolia (testnet) + Ethereum Mainnet

<!--
Speaker notes: Give a brief overview of Zama as a company to build credibility. Mention that TFHE-rs is the engine underneath everything we will use in this bootcamp. Pascal Paillier (CTO) is the creator of the Paillier cryptosystem from the previous slide.
-->

---

# What is fhEVM?

Zama's framework that brings FHE to the Ethereum Virtual Machine.

## Standard Solidity vs fhEVM

| Standard Solidity          | fhEVM Solidity                          |
|----------------------------|-----------------------------------------|
| `uint64 balance`           | `euint64 balance`                       |
| `balance >= amount`        | `FHE.le(amount, balance)`              |
| `balance -= amount`        | `FHE.sub(balance, amount)`             |
| `if (cond) { a } else { b }` | `FHE.select(cond, a, b)`           |
| Everyone reads `balance`   | Only authorized parties decrypt          |

## What stays the same?

- Still Solidity
- Still EVM-compatible
- Still Hardhat / Foundry
- Still ethers.js / wagmi

<!--
Speaker notes: This is the "aha" moment for Solidity developers. Show the side-by-side comparison and emphasize that fhEVM is not a new language -- it is a library on top of Solidity. The learning curve is about new patterns, not new syntax.
-->

---

# fhEVM Architecture

```
    +---------------------+
    |    User / dApp      |
    |   (encrypts input)  |
    +---------+-----------+
              |
              v
    +---------------------+       +---------------------+
    |   Smart Contract    | <---> |    Coprocessor      |
    |   Layer (EVM)       |       |   (FHE operations)  |
    +---------+-----------+       +---------------------+
              |
              v
    +---------------------+       +---------------------+
    |      Gateway        | <---> |        KMS          |
    |  (access control)   |       | (threshold decrypt) |
    +---------------------+       +---------------------+
```

| Component          | Role                                              |
|--------------------|---------------------------------------------------|
| **Smart Contract** | Solidity code with encrypted types and FHE calls   |
| **Coprocessor**    | Executes FHE operations (add, compare, bootstrap)  |
| **Gateway**        | Enforces ACL for decryption requests               |
| **KMS**            | Distributed key management, threshold decryption   |

<!--
Speaker notes: Walk through the architecture diagram top to bottom. Emphasize that FHE operations do NOT run inside the EVM itself -- they are offloaded to the coprocessor. The Gateway and KMS handle the sensitive task of decryption with threshold security.
-->

---

# Encrypted Data Types

fhEVM provides encrypted equivalents for common Solidity types:

| Plaintext   | Encrypted    | Use Case                      |
|-------------|-------------|-------------------------------|
| `bool`      | `ebool`     | Flags, conditions             |
| `uint8`     | `euint8`    | Small counters, enums         |
| `uint16`    | `euint16`   | Percentages, small values     |
| `uint32`    | `euint32`   | Timestamps, medium values     |
| `uint64`    | `euint64`   | Token balances, amounts       |
| `uint128`   | `euint128`  | Large balances                |
| `uint256`   | `euint256`  | Hashes, very large values     |
| `address`   | `eaddress`  | Hidden recipients             |

<!--
Speaker notes: Point out the naming convention: just add "e" prefix to the type. This table is a reference students will come back to repeatedly. Mention that euint64 is the most commonly used type for token balances.
-->

---

# Use Cases (1/2)

## Confidential DeFi
- Private transfers (hidden amounts)
- Dark pools (hidden order books)
- MEV protection (encrypted transactions)

## Private Governance
- Secret ballot voting
- Encrypted vote tallying
- Result revealed only after deadline

## Sealed-Bid Auctions
- Bids encrypted, compared on-chain
- Only winning bid revealed

<!--
Speaker notes: These three use cases are the ones we will actually build in the project modules (token, voting, auction). Emphasize that these are not theoretical -- they are buildable today with fhEVM.
-->

---

# Use Cases (2/2)

## Identity & Compliance
- "Is user over 18?" without revealing age
- Private KYC verification
- Credential checks without exposing personal data

## Confidential Gaming
- Hidden hands in card games
- Fog-of-war in strategy games
- Private inventories and loot

## Healthcare & Data Sharing
- Encrypted medical records on-chain
- Research on patient data without exposing identity

<!--
Speaker notes: Ask students which use cases excite them most. These categories are rapidly expanding -- any application where data privacy matters can benefit from FHE.
-->

---

# Data Flow: Encrypted Transfer

```
  1. User encrypts amount client-side
     Amount: 100 --> Encrypt(100) = 0xA3F...

  2. Submit transaction with encrypted input
     transfer(recipient, encryptedAmount)

  3. Contract performs FHE operations
     hasEnough = FHE.le(amount, senderBalance)  // on ciphertext!
     newSender = FHE.select(hasEnough, FHE.sub(senderBalance, amount), senderBalance)
     newRecip  = FHE.select(hasEnough, FHE.add(recipBalance, amount), recipBalance)

  4. Encrypted balances updated on-chain
     Nobody learns the amounts -- not even validators!

  5. User requests decryption of own balance via Gateway
     Gateway checks ACL --> KMS threshold-decrypts --> User sees balance
```

<!--
Speaker notes: Walk through each numbered step slowly. This end-to-end flow is the mental model students need for every FHEVM application. Emphasize step 3 -- the FHE operations happen on ciphertext, and even validators cannot see the amounts.
-->

---

# FHE: The Missing Piece

```
  BLOCKCHAIN gave us    -->  Trustless computation
  But everything was    -->  PUBLIC

  FHE gives us          -->  Confidential computation
  Without sacrificing   -->  Trustlessness

  fhEVM combines both   -->  Confidential smart contracts
  Using familiar        -->  Solidity
```

## The Promise

Build applications that were **previously impossible** on public blockchains:
private DeFi, secret voting, sealed auctions, confidential identity, and more.

<!--
Speaker notes: This is the motivational slide. Make the connection between blockchain's trustlessness and FHE's confidentiality -- together, they unlock applications that were impossible with either alone. Transition to the takeaways.
-->

---

<!-- _class: small -->

# Key Takeaways

1. **FHE** allows computation on encrypted data without ever decrypting it
2. **TFHE** is the specific scheme Zama uses -- fast bootstrapping, exact arithmetic
3. **Public blockchains have no privacy** -- even `private` variables are exposed
4. **FHE vs ZK vs MPC vs TEE** -- FHE offers the strongest privacy guarantee
5. **fhEVM** = FHE + EVM -- write confidential contracts in Solidity
6. **Architecture:** Smart Contract + Coprocessor + Gateway + KMS
7. **Encrypted types:** `euint64`, `ebool`, `eaddress` replace standard types
8. **Use cases:** DeFi privacy, voting, auctions, gaming, identity, healthcare

<!--
Speaker notes: Quickly review the 8 takeaways and ask if students have any questions about the concepts before we move to hands-on setup. This is the last theory-heavy module -- from Module 02 onward, we write code.
-->

**Next: Module 02 -- fhEVM Development Setup**
