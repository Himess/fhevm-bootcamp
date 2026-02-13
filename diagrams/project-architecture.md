# FHEVM Bootcamp - Project & Curriculum Architecture

This diagram shows the overall structure of the 15-module bootcamp curriculum, organized by difficulty level with dependency arrows showing the recommended learning path.

## Curriculum Flow

```mermaid
graph TD
    subgraph "Foundation (Modules 1-3)"
        M1[Module 1<br/>Introduction to FHE<br/>Theory & Concepts]
        M2[Module 2<br/>fhEVM Setup<br/>Hardhat + Relayer SDK]
        M3[Module 3<br/>Encrypted Types<br/>euint8/16/32/64, ebool, eaddress]
    end

    subgraph "Core Operations (Modules 4-6)"
        M4[Module 4<br/>FHE Operations<br/>add, sub, mul, div, rem]
        M5[Module 5<br/>Comparison & Selection<br/>ge, gt, le, lt, eq, ne, select]
        M6[Module 6<br/>Access Control - ACL<br/>allow, allowThis, allowTransient]
    end

    subgraph "Data Flow (Modules 7-8)"
        M7[Module 7<br/>Encryption Input<br/>externalEuintXX, FHE.fromExternal]
        M8[Module 8<br/>Decryption Output<br/>Gateway, reencryption, callbacks]
    end

    subgraph "Applications (Modules 9-12)"
        M9[Module 9<br/>Confidential ERC20<br/>Private token transfers]
        M10[Module 10<br/>Confidential Voting<br/>Private ballots, public tally]
        M11[Module 11<br/>Blind Auction<br/>Sealed-bid auctions]
        M12[Module 12<br/>Private Identity<br/>Age verification, KYC]
    end

    subgraph "Advanced (Modules 13-15)"
        M13[Module 13<br/>Gas Optimization<br/>FHE cost patterns]
        M14[Module 14<br/>Security Patterns<br/>Common pitfalls, auditing]
        M15[Module 15<br/>Capstone Project<br/>Build full dApp]
    end

    M1 --> M2
    M2 --> M3
    M3 --> M4
    M3 --> M5
    M4 --> M6
    M5 --> M6
    M6 --> M7
    M6 --> M8
    M7 --> M9
    M8 --> M9
    M7 --> M10
    M8 --> M10
    M9 --> M11
    M10 --> M11
    M9 --> M12
    M11 --> M13
    M12 --> M13
    M13 --> M14
    M14 --> M15

    style M1 fill:#3498db,stroke:#333,color:#fff
    style M2 fill:#3498db,stroke:#333,color:#fff
    style M3 fill:#3498db,stroke:#333,color:#fff
    style M4 fill:#2ecc71,stroke:#333,color:#fff
    style M5 fill:#2ecc71,stroke:#333,color:#fff
    style M6 fill:#2ecc71,stroke:#333,color:#fff
    style M7 fill:#f39c12,stroke:#333,color:#fff
    style M8 fill:#f39c12,stroke:#333,color:#fff
    style M9 fill:#e74c3c,stroke:#333,color:#fff
    style M10 fill:#e74c3c,stroke:#333,color:#fff
    style M11 fill:#e74c3c,stroke:#333,color:#fff
    style M12 fill:#e74c3c,stroke:#333,color:#fff
    style M13 fill:#8e44ad,stroke:#333,color:#fff
    style M14 fill:#8e44ad,stroke:#333,color:#fff
    style M15 fill:#8e44ad,stroke:#333,color:#fff
```

## Project Directory Structure

```mermaid
graph TD
    ROOT[fhevm-bootcamp/] --> CONTRACTS[contracts/<br/>Solidity smart contracts]
    ROOT --> MODULES[modules/<br/>Learning material per module]
    ROOT --> EXERCISES[exercises/<br/>Hands-on coding tasks]
    ROOT --> SOLUTIONS[solutions/<br/>Reference implementations]
    ROOT --> TEST[test/<br/>Hardhat test suites]
    ROOT --> SCRIPTS[scripts/<br/>Deployment & interaction]
    ROOT --> CURRICULUM[curriculum/<br/>Curriculum planning docs]
    ROOT --> RESOURCES[resources/<br/>Reference materials]
    ROOT --> DIAGRAMS[diagrams/<br/>Architecture diagrams]
    ROOT --> CONFIG[Config Files<br/>hardhat.config.ts<br/>tsconfig.json<br/>package.json]

    CONTRACTS --> C_ERC20[ConfidentialERC20.sol]
    CONTRACTS --> C_VOTE[ConfidentialVoting.sol]
    CONTRACTS --> C_AUCTION[BlindAuction.sol]
    CONTRACTS --> C_ID[PrivateIdentity.sol]

    MODULES --> MOD1[module-01/ through<br/>module-15/]

    TEST --> T_ERC20[confidentialERC20.test.ts]
    TEST --> T_VOTE[voting.test.ts]
    TEST --> T_MORE[...]

    style ROOT fill:#2c3e50,stroke:#333,color:#fff
    style CONTRACTS fill:#e74c3c,stroke:#333,color:#fff
    style MODULES fill:#3498db,stroke:#333,color:#fff
    style TEST fill:#27ae60,stroke:#333,color:#fff
    style SCRIPTS fill:#f39c12,stroke:#333,color:#fff
```

## Technology Stack

```mermaid
graph LR
    subgraph "Frontend Layer"
        FE1[React / Next.js]
        FE2[Relayer SDK]
        FE3[ethers.js / viem]
    end

    subgraph "Smart Contract Layer"
        SC1[Solidity 0.8.x]
        SC2[fhevm Library<br/>FHE.sol]
        SC3[Gateway.sol<br/>Decryption requests]
        SC4[ACL.sol<br/>Permission management]
    end

    subgraph "Infrastructure Layer"
        IN1[Hardhat<br/>Development framework]
        IN2[fhEVM Node<br/>Local dev chain]
        IN3[Ethereum Sepolia<br/>Test network]
    end

    subgraph "Cryptographic Layer"
        CR1[TFHE Library<br/>FHE operations engine]
        CR2[Coprocessor<br/>Off-chain FHE compute]
        CR3[KMS<br/>Threshold key management]
    end

    FE1 --> FE2
    FE2 --> FE3
    FE3 --> SC1
    SC1 --> SC2
    SC2 --> SC3
    SC2 --> SC4
    SC1 --> IN1
    IN1 --> IN2
    IN1 --> IN3
    SC2 --> CR1
    CR1 --> CR2
    CR2 --> CR3

    style FE1 fill:#61dafb,stroke:#333,color:#333
    style SC1 fill:#363636,stroke:#333,color:#fff
    style SC2 fill:#363636,stroke:#333,color:#fff
    style IN1 fill:#f7df1e,stroke:#333,color:#333
    style CR1 fill:#8e44ad,stroke:#333,color:#fff
    style CR2 fill:#8e44ad,stroke:#333,color:#fff
    style CR3 fill:#8e44ad,stroke:#333,color:#fff
```

## Difficulty Progression

```mermaid
graph LR
    subgraph Beginner
        B1[Theory]
        B2[Setup]
        B3[Types]
    end

    subgraph Intermediate
        I1[Operations]
        I2[Comparisons]
        I3[ACL]
        I4[Input/Output]
    end

    subgraph Advanced
        A1[Confidential ERC20]
        A2[Voting]
        A3[Blind Auction]
        A4[Private Identity]
    end

    subgraph Expert
        E1[Gas Optimization]
        E2[Security]
        E3[Capstone]
    end

    B1 --> B2 --> B3
    B3 --> I1 --> I2 --> I3 --> I4
    I4 --> A1 --> A2 --> A3 --> A4
    A4 --> E1 --> E2 --> E3

    style B1 fill:#3498db,stroke:#333,color:#fff
    style B2 fill:#3498db,stroke:#333,color:#fff
    style B3 fill:#3498db,stroke:#333,color:#fff
    style I1 fill:#2ecc71,stroke:#333,color:#fff
    style I2 fill:#2ecc71,stroke:#333,color:#fff
    style I3 fill:#2ecc71,stroke:#333,color:#fff
    style I4 fill:#2ecc71,stroke:#333,color:#fff
    style A1 fill:#e74c3c,stroke:#333,color:#fff
    style A2 fill:#e74c3c,stroke:#333,color:#fff
    style A3 fill:#e74c3c,stroke:#333,color:#fff
    style A4 fill:#e74c3c,stroke:#333,color:#fff
    style E1 fill:#8e44ad,stroke:#333,color:#fff
    style E2 fill:#8e44ad,stroke:#333,color:#fff
    style E3 fill:#8e44ad,stroke:#333,color:#fff
```

## Explanation

The bootcamp is structured as a progressive learning path:

1. **Foundation (Blue):** Understand what FHE is, set up the development environment, and learn the encrypted type system.
2. **Core Operations (Green):** Master arithmetic operations, comparison/selection patterns, and the critical ACL permission system.
3. **Data Flow (Orange):** Learn how data enters (encryption + proofs) and exits (decryption + re-encryption) the FHE system.
4. **Applications (Red):** Build real-world use cases: private tokens, confidential voting, sealed-bid auctions, and privacy-preserving identity.
5. **Advanced (Purple):** Optimize gas costs (FHE operations are expensive), learn security best practices, and build a complete capstone project combining everything learned.

Each module builds on previous ones. The dependency graph shows that modules can sometimes be studied in parallel (e.g., Modules 4 and 5 can be done in either order after Module 3).
