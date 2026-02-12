# Confidential ERC20 Token Transfer Flow

This diagram illustrates how a confidential ERC20 token transfer works under FHE. The critical design insight: the transaction **never reverts** on insufficient balance. Instead, it silently transfers zero, preserving the sender's balance privacy.

## Transfer Flow

```mermaid
graph TD
    START[Sender calls transfer<br/>to, externalEuint64 encAmount] --> DECRYPT_INPUT[FHE.fromExternal<br/>encAmount<br/>→ euint64 amount]

    DECRYPT_INPUT --> LOAD_BAL[Load encrypted balances<br/>senderBal = balances msg.sender<br/>recipientBal = balances to]

    LOAD_BAL --> CHECK[FHE.ge<br/>senderBal, amount<br/>→ ebool hasFunds]

    CHECK --> SELECT_AMT[FHE.select<br/>hasFunds, amount, 0<br/>→ euint64 transferAmount]

    SELECT_AMT --> NOTE1["If hasFunds = true → transferAmount = amount<br/>If hasFunds = false → transferAmount = 0<br/><br/>NO REVERT either way!<br/>Observer cannot tell which path was taken"]

    SELECT_AMT --> CALC_SENDER[FHE.sub<br/>senderBal, transferAmount<br/>→ euint64 newSenderBal]

    SELECT_AMT --> CALC_RECIPIENT[FHE.add<br/>recipientBal, transferAmount<br/>→ euint64 newRecipientBal]

    CALC_SENDER --> STORE_SENDER[balances msg.sender<br/>= newSenderBal]
    CALC_RECIPIENT --> STORE_RECIPIENT[balances to<br/>= newRecipientBal]

    STORE_SENDER --> ACL_SENDER[FHE.allow<br/>newSenderBal, msg.sender<br/>→ sender can view balance]

    STORE_RECIPIENT --> ACL_RECIPIENT[FHE.allow<br/>newRecipientBal, to<br/>→ recipient can view balance]

    ACL_SENDER --> EMIT[Emit Transfer event<br/>sender, recipient<br/>amount is NOT included]
    ACL_RECIPIENT --> EMIT

    EMIT --> DONE[Transaction succeeds<br/>regardless of balance]

    style START fill:#4a90d9,stroke:#333,color:#fff
    style CHECK fill:#e67e22,stroke:#333,color:#fff
    style SELECT_AMT fill:#e74c3c,stroke:#333,color:#fff
    style NOTE1 fill:#2c3e50,stroke:#333,color:#fff
    style DONE fill:#27ae60,stroke:#333,color:#fff
```

## Privacy Comparison: Standard vs Confidential ERC20

```mermaid
graph LR
    subgraph "Standard ERC20 (Public)"
        S1[Balances visible<br/>to everyone] --> S2[Transfer amount<br/>visible on-chain]
        S2 --> S3[Reverts on<br/>insufficient balance]
        S3 --> S4[Anyone can track<br/>wealth and flows]
    end

    subgraph "Confidential ERC20 (FHE)"
        C1[Balances encrypted<br/>only owner can view] --> C2[Transfer amount<br/>encrypted on-chain]
        C2 --> C3[Never reverts<br/>transfers 0 if insufficient]
        C3 --> C4[Only participants know<br/>actual amounts]
    end

    style S1 fill:#e74c3c,stroke:#333,color:#fff
    style S2 fill:#e74c3c,stroke:#333,color:#fff
    style S3 fill:#e74c3c,stroke:#333,color:#fff
    style S4 fill:#e74c3c,stroke:#333,color:#fff
    style C1 fill:#27ae60,stroke:#333,color:#fff
    style C2 fill:#27ae60,stroke:#333,color:#fff
    style C3 fill:#27ae60,stroke:#333,color:#fff
    style C4 fill:#27ae60,stroke:#333,color:#fff
```

## Mint Flow (Owner Only)

```mermaid
sequenceDiagram
    participant Owner as Contract Owner
    participant Token as ConfidentialERC20
    participant FHE as FHE Library

    Owner->>Token: mint(to, amount)
    Note over Token: require(msg.sender == owner)

    Token->>FHE: FHE.asEuint64(amount)
    FHE-->>Token: euint64 mintAmount

    Token->>FHE: FHE.add(balances[to], mintAmount)
    FHE-->>Token: euint64 newBalance

    Token->>Token: balances[to] = newBalance
    Token->>FHE: FHE.allowThis(newBalance)
    Token->>FHE: FHE.allow(newBalance, to)

    Note over Token: totalSupply updated<br/>(public counter, amount hidden)
```

## Explanation

The `FHE.select` pattern is the core privacy technique:

```
ebool hasFunds = FHE.ge(senderBalance, amount);
euint64 transferAmount = FHE.select(hasFunds, amount, FHE.asEuint64(0));
```

This is equivalent to a ternary: `transferAmount = hasFunds ? amount : 0`

**Why not just revert?** Because a revert leaks information. If an observer sees a failed transaction, they learn the sender's balance is less than the attempted transfer amount. By always succeeding (transferring either the real amount or zero), no balance information leaks from transaction success/failure.

**What the public can see:**
- That a transfer transaction occurred
- The sender and recipient addresses
- Gas used

**What remains private:**
- The transfer amount
- Whether the transfer actually moved any tokens
- The sender's and recipient's balances
