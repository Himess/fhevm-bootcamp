---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 01: Introduction to FHE"
footer: "Zama Developer Program"
---

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

---

# TFHE: Torus Fully Homomorphic Encryption

## Why Zama chose TFHE

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
| `bytes`     | `ebytes64/128/256` | Encrypted data blobs (limited support) |

---

# Use Cases

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

## Identity & Compliance
- "Is user over 18?" without revealing age
- Private KYC verification

## Confidential Gaming
- Hidden hands in card games
- Fog-of-war in strategy games

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

---

# Key Takeaways

1. **FHE** allows computation on encrypted data without ever decrypting it
2. **TFHE** is the specific scheme Zama uses -- fast bootstrapping, exact arithmetic
3. **Public blockchains have no privacy** -- even `private` variables are exposed
4. **FHE vs ZK vs MPC vs TEE** -- FHE offers the strongest privacy guarantee
5. **fhEVM** = FHE + EVM -- write confidential contracts in Solidity
6. **Architecture:** Smart Contract + Coprocessor + Gateway + KMS
7. **Encrypted types:** `euint64`, `ebool`, `eaddress` replace standard types
8. **Use cases:** DeFi privacy, voting, auctions, gaming, identity, healthcare

**Next: Module 02 -- fhEVM Development Setup**
