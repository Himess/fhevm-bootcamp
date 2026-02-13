# Confidential Voting System Flow

This diagram shows how FHE enables a voting system where individual votes remain private, yet the final tally can be revealed. No one -- not even the contract owner -- can see how any individual voted.

## Voting Lifecycle

```mermaid
graph TD
    subgraph "Phase 1: Setup"
        DEPLOY[Owner deploys contract<br/>with candidate list] --> INIT[Initialize encrypted tallies<br/>each candidate starts at euint64 of 0]
        INIT --> OPEN[Voting period begins]
    end

    subgraph "Phase 2: Casting Votes"
        OPEN --> VOTER[Voter encrypts choice<br/>client-side via fhevmjs]
        VOTER --> SUBMIT[Submit encrypted vote<br/>externalEbool encVote]
        SUBMIT --> VALIDATE[Contract validates:<br/>- voter has not voted<br/>- vote is valid]
        VALIDATE --> PROCESS[Process vote with FHE<br/>see detail below]
        PROCESS --> MARK[Mark voter as voted<br/>hasVoted mapping = true]
        MARK --> VOTER
    end

    subgraph "Phase 3: Reveal"
        CLOSE[Owner closes voting period] --> REQUEST[FHE.makePubliclyDecryptable<br/>for each candidate tally]
        REQUEST --> KMS[KMS threshold decryption<br/>reveals final counts]
        KMS --> CALLBACK[Callback stores<br/>plaintext results]
        CALLBACK --> PUBLIC[Results are now public<br/>individual votes remain private]
    end

    MARK -.->|After voting period ends| CLOSE

    style DEPLOY fill:#4a90d9,stroke:#333,color:#fff
    style PROCESS fill:#e67e22,stroke:#333,color:#fff
    style CLOSE fill:#e74c3c,stroke:#333,color:#fff
    style PUBLIC fill:#27ae60,stroke:#333,color:#fff
```

## Vote Processing Detail (Yes/No Example)

```mermaid
sequenceDiagram
    participant Voter as Voter
    participant Contract as Voting Contract
    participant FHE as FHE Library

    Note over Voter,FHE: Voter encrypts: 1 = Yes, 0 = No

    Voter->>Contract: castVote(externalEbool encVote, bytes proof)
    Contract->>Contract: require(!hasVoted[msg.sender])

    Contract->>FHE: voteChoice = FHE.fromExternal(encVote, proof)
    Note over FHE: voteChoice is encrypted<br/>nobody knows if 1 or 0

    Contract->>FHE: FHE.select(voteChoice,<br/>  FHE.asEuint64(1),<br/>  FHE.asEuint64(0))<br/>→ euint64 yesIncrement
    Note over FHE: If vote=true: yesIncrement=1<br/>If vote=false: yesIncrement=0

    Contract->>FHE: FHE.add(yesCount, yesIncrement)<br/>→ euint64 newYesCount
    Contract->>Contract: yesCount = newYesCount

    Contract->>FHE: FHE.select(voteChoice,<br/>  FHE.asEuint64(0),<br/>  FHE.asEuint64(1))<br/>→ euint64 noIncrement
    Note over FHE: Opposite of yesIncrement

    Contract->>FHE: FHE.add(noCount, noIncrement)<br/>→ euint64 newNoCount
    Contract->>Contract: noCount = newNoCount

    Contract->>FHE: FHE.allowThis(newYesCount)
    Contract->>FHE: FHE.allowThis(newNoCount)

    Contract->>Contract: hasVoted[msg.sender] = true
    Contract->>Voter: Transaction succeeds<br/>vote content is hidden
```

## Multi-Candidate Vote Processing

```mermaid
graph LR
    subgraph "Encrypted Input"
        VOTE[euint8 vote<br/>0, 1, or 2]
    end

    subgraph "Candidate Match Checks"
        EQ0[FHE.eq vote, 0<br/>→ ebool isCandidate0]
        EQ1[FHE.eq vote, 1<br/>→ ebool isCandidate1]
        EQ2[FHE.eq vote, 2<br/>→ ebool isCandidate2]
    end

    subgraph "Conditional Increments"
        SEL0[FHE.select isCandidate0, 1, 0<br/>→ euint64 inc0]
        SEL1[FHE.select isCandidate1, 1, 0<br/>→ euint64 inc1]
        SEL2[FHE.select isCandidate2, 1, 0<br/>→ euint64 inc2]
    end

    subgraph "Update Tallies"
        ADD0[FHE.add tally0, inc0<br/>→ new tally0]
        ADD1[FHE.add tally1, inc1<br/>→ new tally1]
        ADD2[FHE.add tally2, inc2<br/>→ new tally2]
    end

    VOTE --> EQ0
    VOTE --> EQ1
    VOTE --> EQ2

    EQ0 --> SEL0
    EQ1 --> SEL1
    EQ2 --> SEL2

    SEL0 --> ADD0
    SEL1 --> ADD1
    SEL2 --> ADD2

    style VOTE fill:#8e44ad,stroke:#333,color:#fff
    style ADD0 fill:#27ae60,stroke:#333,color:#fff
    style ADD1 fill:#27ae60,stroke:#333,color:#fff
    style ADD2 fill:#27ae60,stroke:#333,color:#fff
```

## Reveal Phase

```mermaid
sequenceDiagram
    participant Owner as Contract Owner
    participant Contract as Voting Contract
    participant KMS as KMS

    Owner->>Contract: revealResults()
    Contract->>Contract: require(votingEnded)

    Contract->>Contract: FHE.makePubliclyDecryptable(<br/>yesCount, noCount)

    Contract->>KMS: Decrypt yesCount handle
    KMS-->>Contract: plaintext yes value
    Contract->>KMS: Decrypt noCount handle
    KMS-->>Contract: plaintext no value

    Contract->>Contract: decryptionCallback(requestId,<br/>yesPlaintext, noPlaintext)
    Contract->>Contract: Store results publicly
    Contract->>Contract: Emit ResultsRevealed event

    Note over Contract: Individual votes are<br/>NEVER decrypted,<br/>only the aggregate totals
```

## Explanation

**Privacy guarantees:**
- No one can see any individual vote, not even the contract owner or validators
- During voting, even the running tally is encrypted
- Only the final aggregate is revealed after voting ends
- The act of voting is public (addresses are visible), but the vote content is private

**The FHE.select pattern** is used again here, similar to the confidential ERC20. Instead of branching (which would leak information via gas differences), we compute both paths and select the result, keeping the execution path uniform regardless of the vote value.

**Multi-candidate extension:** For N candidates, the contract checks `FHE.eq(vote, i)` for each candidate i, then conditionally increments each tally. Only the matching tally gets +1, but all operations execute regardless, hiding which candidate received the vote.
