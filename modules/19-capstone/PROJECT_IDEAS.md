# Capstone Project Ideas

Choose one of the following ideas or propose your own. Each project should demonstrate mastery of FHEVM concepts learned throughout the bootcamp.

---

## 1. Confidential DAO (Example Implementation Provided)

**Difficulty:** ★★★☆

**Description:** A decentralized autonomous organization where governance token balances, vote counts, and treasury operations are all encrypted. Members vote on proposals without revealing their choices or voting power.

**FHEVM Concepts Used:**
- Encrypted ERC-20 governance tokens (Module 11)
- Confidential voting with tallies (Module 12)
- ACL for member management (Module 05)
- Decryption for result reveal (Module 07)
- Conditional logic for quorum checks (Module 08)

**Suggested Structure:**
- `ConfidentialDAO.sol` - Main DAO contract with proposal management
- Governance token minting and encrypted balance tracking
- Proposal creation, encrypted voting, result reveal
- Treasury funding and withdrawal with governance approval

---

## 2. Encrypted Card Game

**Difficulty:** ★★★★

**Description:** A two-player card game (e.g., simplified poker or war) where each player's hand is encrypted. The game state is maintained on-chain, but no player can see the other's cards until reveal.

**FHEVM Concepts Used:**
- Encrypted randomness for card dealing (Module 09)
- Per-user ACL for hand privacy (Module 05)
- Encrypted comparison for determining winner (Module 04, 08)
- Decryption for game resolution (Module 07)
- Encrypted inputs for player actions (Module 06)

**Suggested Structure:**
- `EncryptedCardGame.sol` - Game logic
- `dealCards()` - Use `FHE.randEuint8()` to assign random cards
- `playCard(externalEuint8 card, bytes proof)` - Play a card face-down
- `revealRound()` - Compare encrypted cards, determine round winner
- `endGame()` - Decrypt and reveal final scores

---

## 3. Private Identity Verification

**Difficulty:** ★★☆☆

**Description:** An on-chain identity system where users store encrypted personal data (age, nationality, credit score). Verifiers can check conditions (e.g., "is user over 18?") without seeing the actual data.

**FHEVM Concepts Used:**
- Encrypted types for personal data (Module 03)
- ACL for selective disclosure (Module 05)
- Encrypted inputs for data submission (Module 06)
- Comparison operations for threshold checks (Module 04)
- Conditional logic for eligibility (Module 08)

**Suggested Structure:**
- `PrivateIdentity.sol` - Store encrypted user data
- `setAge(externalEuint8 encAge, bytes proof)` - User submits encrypted age
- `isOver18(address user) returns (ebool)` - Check without revealing age
- `grantVerifier(address verifier)` - ACL management
- `verifyEligibility(address user, uint8 minAge) returns (ebool)`

---

## 4. Confidential Payroll System

**Difficulty:** ★★☆☆

**Description:** A payroll system where employee salaries are encrypted. The employer can process batch payments, and each employee can only see their own salary. Total payroll cost remains private.

**FHEVM Concepts Used:**
- Encrypted balances (Module 03, 11)
- ACL for employer/employee access (Module 05)
- Encrypted arithmetic for salary calculations (Module 04)
- Encrypted inputs for salary setting (Module 06)
- Select for conditional bonuses (Module 08)

**Suggested Structure:**
- `ConfidentialPayroll.sol` - Main payroll contract
- `addEmployee(address employee, externalEuint64 salary, bytes proof)` - Add with encrypted salary
- `processPay(address employee)` - Transfer encrypted amount
- `adjustSalary(address employee, externalEuint64 newSalary, bytes proof)` - Update salary
- `getMySalary() returns (euint64)` - Employee views own salary

---

## 5. Encrypted Order Book (DEX)

**Difficulty:** ★★★★★

**Description:** A decentralized exchange with an encrypted order book. Buy and sell orders are submitted with encrypted prices and quantities. Matching happens on-chain without revealing unmatched orders.

**FHEVM Concepts Used:**
- Encrypted inputs for order submission (Module 06)
- Encrypted comparison for price matching (Module 04)
- Conditional logic for partial fills (Module 08)
- ACL for order privacy (Module 05)
- Decryption for executed trades (Module 07)
- Encrypted randomness for tie-breaking (Module 09)

**Suggested Structure:**
- `EncryptedOrderBook.sol` - Order book with encrypted orders
- `placeBuyOrder(externalEuint64 price, externalEuint64 quantity, bytes proof)`
- `placeSellOrder(externalEuint64 price, externalEuint64 quantity, bytes proof)`
- `matchOrders()` - Match buy/sell using encrypted comparisons
- `cancelOrder(uint256 orderId)` - Cancel and refund

---

## 6. Private Health Records

**Difficulty:** ★★☆☆

**Description:** A health records system where patient data is stored encrypted on-chain. Doctors and hospitals can be granted access to specific records. Insurance companies can verify conditions without seeing raw data.

**FHEVM Concepts Used:**
- Encrypted types for health metrics (Module 03)
- Multi-level ACL (patient, doctor, hospital, insurer) (Module 05)
- Encrypted inputs for data entry (Module 06)
- Comparison for threshold checks (Module 04)
- Conditional logic for eligibility (Module 08)

**Suggested Structure:**
- `PrivateHealthRecords.sol` - Patient data management
- `addRecord(externalEuint32 bloodPressure, externalEuint8 cholesterol, bytes proof)`
- `grantAccess(address doctor)` - Patient grants ACL
- `checkBloodPressureNormal(address patient) returns (ebool)` - Doctor checks threshold
- `revokeAccess(address doctor)` - Patient revokes ACL

---

## Assessment Rubric

| Criteria | Weight | Description |
|----------|--------|-------------|
| **Functionality** | 30% | Does the contract compile, deploy, and work correctly? |
| **FHEVM Usage** | 25% | Uses at least 3 encrypted types, 5+ FHE operations, proper ACL |
| **Test Coverage** | 20% | Comprehensive test suite covering normal and edge cases |
| **Code Quality** | 15% | Clean code, proper comments, follows Solidity best practices |
| **Documentation** | 10% | Clear README explaining design decisions and how to run |

**Minimum Requirements:**
- At least 3 different encrypted types used
- At least 5 FHE operations (add, sub, select, comparison, etc.)
- ACL implementation (allow, allowThis)
- At least 1 decryption pattern
- Comprehensive test suite (minimum 6 tests)
- README with explanation
