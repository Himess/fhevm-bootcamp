# Exercise: Introduction to FHE Concepts

## Part 1: Conceptual Questions
Answer in your own words:

1. What is the key difference between FHE and traditional encryption (AES, RSA)?
2. Why is FHE useful for blockchain applications?
3. What does "homomorphic" mean in the context of encryption?

## Part 2: Identify the Pattern
For each scenario, identify whether FHE is needed or if traditional encryption suffices:

1. A token contract where balances should be private
2. Storing a user's encrypted password hash
3. A voting system where individual votes must be private but tallied
4. Encrypting data at rest in a database
5. A sealed-bid auction where bids are compared without revealing values

## Part 3: FHEVM Types Matching
Match each encrypted type to its best use case:

| Type | Use Cases |
|------|-----------|
| `ebool` | a) Token balances |
| `euint8` | b) Access flags, vote values |
| `euint32` | c) Small counters, percentages |
| `euint64` | d) Timestamps, medium values |
| `eaddress` | e) Private recipient addresses |

## Part 4: Think About It
Design (on paper) a simple "encrypted age verification" contract:
- User submits their encrypted age
- Contract checks if age >= 18 without revealing the actual age
- Returns an encrypted boolean result
- What FHE operations would you need?
