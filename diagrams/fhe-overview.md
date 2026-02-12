# FHE on Blockchain - High-Level Architecture

This diagram shows how Fully Homomorphic Encryption (FHE) enables confidential computation on a public blockchain. Data remains encrypted throughout its lifecycle on-chain, with a coprocessor handling the heavy FHE operations off-chain.

```mermaid
graph TD
    subgraph User Side
        U1[User / dApp Frontend]
        U2[fhevmjs Client Library]
    end

    subgraph On-Chain
        SC[Smart Contract<br/>fhEVM Solidity]
        ACL[ACL Contract<br/>Permission Management]
        FHELib[FHE Library<br/>Precompile Gateway]
    end

    subgraph Coprocessor
        CP[FHE Coprocessor<br/>Off-chain Engine]
        KMS[Key Management Service<br/>Threshold Decryption]
    end

    subgraph Data Flow
        CT[Ciphertext<br/>Encrypted Values]
        PT_IN[Plaintext Input]
        PT_OUT[Plaintext Output]
    end

    PT_IN -->|1. Encrypt locally| U2
    U2 -->|2. Submit encrypted input| SC
    SC -->|3. Store as euintXX handle| CT
    SC -->|4. Request FHE operation<br/>add / sub / mul / ge / select| FHELib
    FHELib -->|5. Delegate computation| CP
    CP -->|6. Homomorphic computation<br/>on ciphertexts| CP
    CP -->|7. Return encrypted result| FHELib
    FHELib -->|8. Updated ciphertext handle| SC
    SC -->|9. Decryption request<br/>via Gateway| KMS
    KMS -->|10. Threshold decryption| PT_OUT
    PT_OUT -->|11. Callback with plaintext| SC
    SC -->|12. Re-encryption for user| U2
    U2 -->|13. Client-side decrypt| U1

    SC --- ACL

    style U1 fill:#4a90d9,stroke:#333,color:#fff
    style U2 fill:#4a90d9,stroke:#333,color:#fff
    style SC fill:#e67e22,stroke:#333,color:#fff
    style ACL fill:#e67e22,stroke:#333,color:#fff
    style FHELib fill:#e67e22,stroke:#333,color:#fff
    style CP fill:#27ae60,stroke:#333,color:#fff
    style KMS fill:#27ae60,stroke:#333,color:#fff
    style CT fill:#8e44ad,stroke:#333,color:#fff
    style PT_IN fill:#2c3e50,stroke:#333,color:#fff
    style PT_OUT fill:#2c3e50,stroke:#333,color:#fff
```

## Key Concepts

- **Ciphertext Handles:** On-chain, encrypted values are represented as 256-bit handles (`euint8`, `euint16`, `euint32`, `euint64`, etc.). The actual ciphertext lives in the coprocessor.
- **Coprocessor Architecture:** The blockchain node itself does not perform FHE math. A dedicated coprocessor receives operation requests via precompiles, executes them on the full ciphertexts, and returns new handles.
- **Key Management Service (KMS):** Decryption is a threshold process. No single party holds the full FHE secret key. Multiple KMS nodes must collaborate to decrypt, preventing any single point of trust.
- **ACL Gating:** Every ciphertext handle has an access control list. Only contracts and addresses explicitly granted permission can operate on or decrypt a given ciphertext.
