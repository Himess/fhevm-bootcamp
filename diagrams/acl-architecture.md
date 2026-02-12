# Access Control List (ACL) Architecture

The ACL system is the permission layer that governs who can operate on, view, or decrypt encrypted values. Without explicit permission, no contract or user can access a ciphertext handle.

## ACL Permission Model

```mermaid
graph TD
    subgraph Contract Execution
        C1[Contract A<br/>Owner of handle]
        C2[Contract B<br/>Wants access]
        USER[User Address<br/>Wants to view]
    end

    subgraph Permission Granting
        ALLOW[FHE.allow<br/>handle, address]
        ALLOW_THIS[FHE.allowThis<br/>handle]
        ALLOW_TRANSIENT[FHE.allowTransient<br/>handle, address]
    end

    subgraph ACL Contract
        ACL_STORE[(ACL Storage<br/>handle → Set of addresses)]
        ACL_CHECK{isSenderAllowed<br/>handle, msg.sender}
        ACL_PERSIST[Persistent Permissions<br/>Stored permanently]
        ACL_TEMP[Transient Permissions<br/>Current tx only]
    end

    subgraph Operations
        FHE_OP[FHE Operation<br/>add / sub / mul / etc.]
        DECRYPT[Gateway.requestDecryption]
        REENCRYPT[Re-encryption Request]
    end

    C1 -->|Grant to self| ALLOW_THIS
    C1 -->|Grant to other contract| ALLOW
    C1 -->|Grant for this tx only| ALLOW_TRANSIENT

    ALLOW_THIS --> ACL_PERSIST
    ALLOW --> ACL_PERSIST
    ALLOW_TRANSIENT --> ACL_TEMP

    ACL_PERSIST --> ACL_STORE
    ACL_TEMP --> ACL_STORE

    C2 -->|Attempt operation| ACL_CHECK
    USER -->|Attempt view| ACL_CHECK
    ACL_CHECK -->|Check| ACL_STORE
    ACL_CHECK -->|Allowed| FHE_OP
    ACL_CHECK -->|Allowed| DECRYPT
    ACL_CHECK -->|Allowed| REENCRYPT
    ACL_CHECK -->|Denied| REVERT[Transaction Reverts]

    style C1 fill:#4a90d9,stroke:#333,color:#fff
    style C2 fill:#4a90d9,stroke:#333,color:#fff
    style USER fill:#4a90d9,stroke:#333,color:#fff
    style ACL_STORE fill:#e74c3c,stroke:#333,color:#fff
    style ACL_CHECK fill:#e67e22,stroke:#333,color:#fff
    style REVERT fill:#c0392b,stroke:#333,color:#fff
    style ACL_PERSIST fill:#27ae60,stroke:#333,color:#fff
    style ACL_TEMP fill:#f39c12,stroke:#333,color:#fff
```

## Permission Flow for Token Transfer

```mermaid
sequenceDiagram
    participant Sender as Sender
    participant Token as ConfidentialERC20
    participant ACL as ACL Contract
    participant Copro as Coprocessor

    Note over Sender,Copro: Transfer encrypted tokens

    Sender->>Token: transfer(to, encryptedAmount, proof)

    Token->>Token: amount = FHE.asEuint64(encryptedAmount, proof)
    Token->>ACL: FHE.allowThis(amount)<br/>→ Token contract can use amount

    Token->>Token: senderBal = balances[msg.sender]
    Note over Token: senderBal already allowed for Token<br/>(set during mint or previous transfer)

    Token->>Copro: FHE.ge(senderBal, amount) → hasFunds
    Token->>ACL: FHE.allowThis(hasFunds)

    Token->>Copro: FHE.select(hasFunds, amount, 0) → transferAmt
    Token->>ACL: FHE.allowThis(transferAmt)

    Token->>Copro: FHE.sub(senderBal, transferAmt) → newSenderBal
    Token->>ACL: FHE.allowThis(newSenderBal)
    Token->>ACL: FHE.allow(newSenderBal, msg.sender)<br/>→ Sender can view own balance

    Token->>Copro: FHE.add(recipientBal, transferAmt) → newRecipientBal
    Token->>ACL: FHE.allowThis(newRecipientBal)
    Token->>ACL: FHE.allow(newRecipientBal, to)<br/>→ Recipient can view own balance

    Token->>Token: balances[msg.sender] = newSenderBal
    Token->>Token: balances[to] = newRecipientBal
```

## Three Types of Permission

```mermaid
graph LR
    subgraph "FHE.allowThis(handle)"
        A1[Grants permission to<br/>the calling contract itself]
        A2[Most common pattern]
        A3[Required before any<br/>FHE operation on handle]
    end

    subgraph "FHE.allow(handle, address)"
        B1[Grants permission to<br/>a specific address]
        B2[Used for cross-contract calls<br/>and user re-encryption]
        B3[Persists permanently]
    end

    subgraph "FHE.allowTransient(handle, address)"
        C1[Grants permission to<br/>a specific address]
        C2[Valid only for the<br/>current transaction]
        C3[Gas efficient for<br/>intermediate values]
    end

    style A1 fill:#27ae60,stroke:#333,color:#fff
    style A2 fill:#27ae60,stroke:#333,color:#fff
    style A3 fill:#27ae60,stroke:#333,color:#fff
    style B1 fill:#4a90d9,stroke:#333,color:#fff
    style B2 fill:#4a90d9,stroke:#333,color:#fff
    style B3 fill:#4a90d9,stroke:#333,color:#fff
    style C1 fill:#f39c12,stroke:#333,color:#fff
    style C2 fill:#f39c12,stroke:#333,color:#fff
    style C3 fill:#f39c12,stroke:#333,color:#fff
```

## Explanation

The ACL is the security backbone of fhEVM. Key rules:

1. **Every new ciphertext handle starts with no permissions.** The contract that creates it must explicitly call `FHE.allowThis()` to grant itself access.
2. **Permissions are per-handle, per-address.** Granting access to one handle does not grant access to others.
3. **Users need explicit permission to view their own data.** The contract must call `FHE.allow(handle, userAddress)` so the user can later request re-encryption.
4. **Cross-contract calls require explicit delegation.** If Contract A passes a handle to Contract B, Contract A must first call `FHE.allow(handle, addressOfB)`.
5. **Transient permissions save gas** when a handle is only needed within a single transaction (e.g., intermediate computation results).
