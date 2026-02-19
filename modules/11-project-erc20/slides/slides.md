---
marp: true
theme: default
paginate: true
header: "FHEVM Bootcamp - Module 11: Confidential ERC-20"
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

# Module 11: Confidential ERC-20

Building a privacy-preserving token with encrypted balances.

---

# The Problem with Standard ERC-20

```
balanceOf(0xAlice) -> 1,000,000  // Everyone sees this
Transfer(Alice, Bob, 500)        // Everyone sees this
```

- All balances are public
- All transfer amounts are in events
- Failed transfers reveal balance info (revert = insufficient funds)

<!--
Speaker notes: Start by establishing what is wrong with standard ERC-20 from a privacy perspective. Everyone can see every balance and every transfer amount. Even failed transfers leak information because the revert message tells you the balance was insufficient.
-->

---

# Confidential ERC-20 Design

```
balanceOf(address) -> euint64    // Only owner decrypts
Transfer(Alice, Bob)             // No amount in event
Failed transfer -> sends 0      // No revert = no info leak
```

<!--
Speaker notes: Show the three key design changes side by side. Encrypted balances, no amounts in events, and no-revert on failure. The no-revert pattern is the most counterintuitive for Solidity developers -- it feels wrong to not revert, but it is essential for privacy.
-->

---

# Core: Encrypted Balance Mapping

```solidity
mapping(address => euint64) private _balances;
```

- Each balance is a ciphertext
- Only the owner + contract have ACL access
- Nobody else can read or query balances

<!--
Speaker notes: The core data structure is a mapping from address to euint64. Each balance is a ciphertext with ACL entries for the contract and the balance owner. This is the same mapping pattern from Module 03, but now in a real token context.
-->

---

# The No-Revert Pattern

**Why not revert on insufficient balance?**

An attacker can binary-search:
1. Transfer 1000 -- reverts (balance < 1000)
2. Transfer 500 -- succeeds (balance >= 500)
3. Transfer 750 -- reverts (< 750)
4. ... narrow down exact balance

**Solution:** Always succeed, transfer 0 on failure.

<!--
Speaker notes: Walk through the binary search attack step by step. An attacker can narrow down a balance to the exact value in just log2(max) attempts. The solution is elegant: always succeed, but transfer 0 if the balance is insufficient. The attacker cannot tell if 0 or the real amount was transferred.
-->

---

# Transfer Implementation

```solidity
function _transfer(
    address from, address to, euint64 amount
) internal {
    ebool hasEnough = FHE.ge(_balances[from], amount);

    // Transfer amount if enough, else 0
    euint64 transferAmount = FHE.select(
        hasEnough, amount, FHE.asEuint64(0)
    );

    _balances[from] = FHE.sub(
        _balances[from], transferAmount
    );
    _balances[to] = FHE.add(
        _balances[to], transferAmount
    );
}
```

<!--
Speaker notes: This is the heart of the confidential ERC-20. Walk through each line: FHE.ge checks if sender has enough, FHE.select picks either the real amount or 0, then both balances are updated with the selected amount. Both branches always execute, so gas cost is constant regardless of success or failure.
-->

---

# What an Observer Sees

| Standard ERC-20 | Confidential ERC-20 |
|-----------------|---------------------|
| From: Alice | From: Alice |
| To: Bob | To: Bob |
| Amount: 500 USDC | Amount: ??? |
| Status: Success | Status: Success |
| Revert if broke | **Always succeeds** |

<!--
Speaker notes: This comparison table is great for explaining the value proposition to non-technical stakeholders. The observer sees the same information in both cases (who transacts with whom) but the amount and success/failure are hidden in the confidential version.
-->

---

# Events: No Amounts

```solidity
// Standard ERC-20
event Transfer(
    address indexed from, address indexed to,
    uint256 value  // LEAKED!
);

// Confidential ERC-20
event Transfer(
    address indexed from, address indexed to
    // No value field
);
```

<!--
Speaker notes: The event design is a subtle but important change. Standard ERC-20 events include the transfer amount, which leaks privacy. Confidential ERC-20 events only include the addresses. If you need to track transfers off-chain, use the event for timing and the ACL for amounts.
-->

---

# balanceOf: Encrypted Handle

```solidity
// Standard: anyone can query and READ any balance
function balanceOf(address a) returns (uint256)

// Confidential: returns encrypted handle
function balanceOf(address account) returns (euint64)
```

Takes an `address` parameter like standard ERC-20, but returns an encrypted handle. Only the account owner (with ACL access) can decrypt it via the Relayer SDK + gateway.

<!--
Speaker notes: The balanceOf function signature looks similar to standard ERC-20 but returns euint64 instead of uint256. Anyone can call it and get the handle, but only the account owner (with ACL access) can decrypt the actual value. This maintains API compatibility while adding privacy.
-->

---

# Encrypted Allowances

```solidity
mapping(address =>
    mapping(address => euint64)
) private _allowances;

function approve(
    externalEuint64 encAmount,
    bytes calldata inputProof, address spender
) external {
    euint64 amount = FHE.fromExternal(encAmount, inputProof);
    _allowances[msg.sender][spender] = amount;
    FHE.allowThis(_allowances[msg.sender][spender]);
    FHE.allow(_allowances[msg.sender][spender],
              msg.sender);
    FHE.allow(_allowances[msg.sender][spender],
              spender);
}
```

<!--
Speaker notes: Encrypted allowances follow the same pattern as encrypted balances. Note the triple ACL grant: allowThis for the contract, allow for the owner, and allow for the spender. Both parties need access -- the owner to check their allowance, and the spender to use it in transferFrom.
-->

---

# transferFrom: Double Check

```solidity
function transferFrom(
    address from, externalEuint64 encAmount,
    bytes calldata inputProof, address to
) external {
    euint64 amount = FHE.fromExternal(encAmount, inputProof);

    ebool hasAllowance = FHE.ge(
        _allowances[from][msg.sender], amount);
    ebool hasBalance = FHE.ge(
        _balances[from], amount);

    // BOTH must pass
    ebool canTransfer = FHE.and(
        hasAllowance, hasBalance);

    euint64 transferAmt = FHE.select(
        canTransfer, amount, FHE.asEuint64(0));

    // Update allowance and balances...
}
```

<!--
Speaker notes: transferFrom has a double check: both allowance AND balance must be sufficient. FHE.and combines the two conditions into one ebool, then FHE.select picks the transfer amount or zero. This is more complex than standard ERC-20 because both checks happen on encrypted data simultaneously.
-->

---

# ACL Pattern for Balances

After every balance update:

```solidity
FHE.allowThis(_balances[from]);   // Contract access
FHE.allow(_balances[from], from); // Owner access

FHE.allowThis(_balances[to]);     // Contract access
FHE.allow(_balances[to], to);     // Owner access
```

Both the contract and the balance owner need access.

<!--
Speaker notes: This is the ACL boilerplate that must follow every balance update. Count four calls total: allowThis and allow for sender, allowThis and allow for receiver. Forgetting any one of these breaks functionality for that user. Consider extracting this into a helper function.
-->

---

# Constructor

```solidity
constructor(
    string memory _name,
    string memory _symbol
) {
    name = _name;
    symbol = _symbol;
}
```

No initial supply in constructor. Use a separate `mint` function for distribution.

<!--
Speaker notes: The constructor is deliberately simple -- no initial minting. A separate mint function allows the owner to distribute tokens after deployment. This is a design choice that simplifies testing and deployment.
-->

---

# Design Choices

| Decision | Rationale |
|----------|-----------|
| `euint64` not `euint256` | Gas efficiency; 64 bits is enough |
| No amount in events | Prevents information leakage |
| No revert on failure | Prevents balance binary search |
| `totalSupply` is public | Verifiable supply; design choice |
| `decimals = 6` | Common for tokens (like USDC) |

<!--
Speaker notes: These design decisions are important for students to understand. euint64 instead of euint256 saves significant gas. No revert on failure prevents information leakage. Public totalSupply is a trade-off -- hiding it would prevent supply verification. Discuss these trade-offs with the class.
-->

---

# Frontend: Encrypted Transfer

```typescript
async function transfer(to: string, amount: number) {
  const instance = await initFhevm();
  const input = instance.createEncryptedInput(
    tokenAddress, userAddress
  );
  input.add64(amount);
  const encrypted = await input.encrypt();

  const tx = await contract.transfer(encrypted.handles[0], encrypted.inputProof, to);
  await tx.wait();
}
```

<!--
Speaker notes: The frontend transfer code shows the complete flow: create Relayer SDK instance, encrypt the amount with add64, and call the contract with handles and proof. Note that add64 matches externalEuint64 in the contract. This is the same pattern from Module 10 applied to the token.
-->

---

# Industry Standard: ERC-7984

The confidential ERC-20 pattern you just learned is formalized as **ERC-7984**.

| | |
|---|---|
| **Standard** | ERC-7984 — Confidential Fungible Token |
| **Authors** | Zama + OpenZeppelin |
| **Audit** | OpenZeppelin security audit completed (November 2025) |
| **Core idea** | Replace `uint256` balances with `euint64` ciphertext handles |

## In Production

**Zaiffer Protocol** (Zama + PyratzLabs, €2M backing) uses ERC-7984 to convert standard ERC-20 tokens into **confidential cTokens**:

- **cUSDT** — First confidential USDT transfer on Ethereum mainnet (January 2026)
- **cUSDC, cETH** — Confidential wrapped tokens with encrypted balances
- **$121M+** in encrypted volume processed on mainnet

The `_transfer()` function you wrote in this module is the **same pattern** powering cUSDT on Ethereum.

<!--
Speaker notes: This is the industry validation slide. ERC-7984 is not a toy standard -- it was developed by Zama with OpenZeppelin and audited. Zaiffer is already using it in production for confidential USDT. The patterns students just learned (encrypted mappings, no-revert transfers, FHE.select) are the exact same patterns running on mainnet. This should be a motivating moment -- students are learning production-grade techniques.
-->

---

# Summary

- Store balances as `euint64` in encrypted mappings
- **Never revert** on insufficient balance -- use `FHE.select()` to send 0
- Omit amounts from events
- `balanceOf(address)` returns an encrypted handle -- only the owner can decrypt
- Allowances are encrypted too; `transferFrom` checks both with `FHE.and()`
- ACL grants for contract + owner after every update
- **ERC-7984**: the industry standard formalizing this pattern (Zama + OpenZeppelin)

<!--
Speaker notes: Summarize the key design patterns: encrypted mappings, no-revert transfers with FHE.select, no amounts in events, encrypted allowances with double checks. Mention that ERC-7984 formalizes these patterns as an industry standard. These patterns form the template for any privacy-preserving token implementation on FHEVM.
-->

---

# Next Up

**Module 12: Confidential Voting**

Build a private voting system with encrypted tallies!

<!--
Speaker notes: Transition to Module 12 by connecting to the ballot box analogy from Module 01. Now students will actually build the encrypted voting system that was used as a conceptual example earlier.
-->
