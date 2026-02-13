# Encryption and Decryption Data Flow

This diagram details the full lifecycle of encrypted data in fhEVM: from plaintext input through on-chain FHE operations, and back to plaintext output via two decryption paths.

## Encryption Flow (Input)

```mermaid
sequenceDiagram
    participant User as User / dApp
    participant SDK as Relayer SDK
    participant Chain as Blockchain
    participant Contract as Smart Contract
    participant Copro as FHE Coprocessor

    Note over User,Copro: === ENCRYPTION (Input Path) ===

    User->>SDK: 1. Provide plaintext value (e.g. 42)
    SDK->>SDK: 2. Fetch global FHE public key
    SDK->>SDK: 3. Encrypt with FHE public key<br/>→ produces externalEuintXX bytes
    SDK->>SDK: 4. Generate ZK proof of plaintext knowledge
    SDK->>Chain: 5. Submit tx with (ciphertext, proof) as bytes

    Chain->>Contract: 6. Contract receives externalEuintXX
    Contract->>Contract: 7. FHE.fromExternal(externalInput, proof)<br/>→ validates and converts<br/>→ registers ciphertext in coprocessor
    Contract->>Contract: 8. Returns euintXX handle<br/>(256-bit reference)
    Contract->>Contract: 9. FHE.allowThis(handle)<br/>→ grants contract permission

    Note over Contract,Copro: Handle is now usable for FHE ops
```

## FHE Operations (On-Chain)

```mermaid
graph LR
    subgraph Encrypted Inputs
        A[euint32 a]
        B[euint32 b]
    end

    subgraph FHE Operations
        ADD[FHE.add a, b]
        SUB[FHE.sub a, b]
        MUL[FHE.mul a, b]
        GE[FHE.ge a, b → ebool]
        SELECT[FHE.select cond, a, b]
        EQ[FHE.eq a, b → ebool]
        MIN[FHE.min a, b]
        MAX[FHE.max a, b]
    end

    subgraph Encrypted Output
        R[euint32 result]
    end

    A --> ADD
    B --> ADD
    A --> SUB
    B --> SUB
    A --> MUL
    B --> MUL
    A --> GE
    B --> GE
    A --> SELECT
    B --> SELECT
    A --> EQ
    B --> EQ
    A --> MIN
    B --> MIN
    A --> MAX
    B --> MAX

    ADD --> R
    SUB --> R
    MUL --> R
    GE --> R
    SELECT --> R
    EQ --> R
    MIN --> R
    MAX --> R

    style A fill:#8e44ad,stroke:#333,color:#fff
    style B fill:#8e44ad,stroke:#333,color:#fff
    style R fill:#27ae60,stroke:#333,color:#fff
```

## Decryption Flow (Output)

```mermaid
sequenceDiagram
    participant User as User / dApp
    participant SDK as Relayer SDK
    participant Contract as Smart Contract
    participant KMS as Key Management Service

    Note over User,KMS: === PATH A: Public Decryption (on-chain) ===

    Contract->>Contract: 1. FHE.makePubliclyDecryptable(handles)
    Contract->>KMS: 2. Emit decryption request event
    KMS->>KMS: 3. Threshold decryption<br/>(multiple key shares collaborate)
    KMS->>Contract: 4. Return plaintext value
    Contract->>Contract: 5. Process plaintext result

    Note over User,KMS: === PATH B: Re-encryption (client-side view) ===

    User->>SDK: 6. Generate keypair for re-encryption
    SDK->>SDK: 7. Create EIP-712 signature<br/>(proves address ownership)
    SDK->>KMS: 8. Request re-encryption<br/>(handle, publicKey, signature)
    KMS->>KMS: 9. ACL check:<br/>is msg.sender allowed?
    KMS->>KMS: 10. Re-encrypt under user's public key
    KMS->>SDK: 11. Return re-encrypted ciphertext
    SDK->>SDK: 12. Decrypt with local private key
    SDK->>User: 13. Display plaintext value
```

## Explanation

**Encryption** uses the network's global FHE public key. Anyone can encrypt, but only the coprocessor (via threshold KMS) can decrypt. A zero-knowledge proof accompanies each ciphertext to prove the encryptor knows the plaintext -- this prevents replay attacks.

**FHE Operations** are performed entirely on ciphertexts. The smart contract code reads like normal Solidity but operates on encrypted types. The coprocessor executes the actual homomorphic math.

**Decryption** has two paths:
- **Async Decryption** reveals values on-chain via a callback pattern. Used when the contract needs the plaintext (e.g., to emit an event or make a decision after voting ends).
- **Re-encryption** lets an authorized user view their own encrypted data without revealing it on-chain. The ciphertext is re-encrypted under the user's personal key and decrypted client-side.
