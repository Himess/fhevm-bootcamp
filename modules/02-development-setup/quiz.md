# Module 02: Quiz — FHEVM Development Setup

Test your understanding of the FHEVM development environment setup.

---

### Question 1

What is the correct npm package to install for FHEVM Solidity development?

- A) `@zama/fhevm`
- B) `@fhevm/solidity` ✅
- C) `@tfhe/solidity`
- D) `fhevm-contracts`

---

### Question 2

Which import statement provides the core FHE operations library?

- A) `import "@fhevm/solidity/lib/TFHE.sol";`
- B) `import "@fhevm/solidity/FHE.sol";`
- C) `import "@fhevm/solidity/lib/FHE.sol";` ✅
- D) `import "@openzeppelin/fhe/FHE.sol";`

---

### Question 3

What must every FHEVM contract inherit to be properly configured?

- A) `FHEConfig`
- B) `ZamaEthereumConfig` ✅
- C) `FHEVMSetup`
- D) `EncryptedBase`

---

### Question 4

Where is `ZamaEthereumConfig` imported from?

- A) `@fhevm/solidity/lib/FHE.sol`
- B) `@fhevm/solidity/lib/ZamaConfig.sol`
- C) `@fhevm/solidity/config/ZamaConfig.sol` ✅
- D) `@fhevm/solidity/config/EthereumConfig.sol`

---

### Question 5

What does `ZamaEthereumConfig` configure automatically?

- A) Only the FHE co-processor address
- B) Only the ACL and KMS addresses
- C) The FHE co-processor, ACL, KMS verifier, and Gateway addresses ✅
- D) The Hardhat network settings

---

### Question 6

How do you encrypt a plaintext integer `42` as a 32-bit encrypted value on-chain?

- A) `TFHE.asEuint32(42)`
- B) `FHE.encrypt(42)`
- C) `FHE.asEuint32(42)` ✅
- D) `euint32(42)`

---

### Question 7

After updating an encrypted state variable, what must you call?

- A) `FHE.save(variable)`
- B) `FHE.allowThis(variable)` ✅
- C) `FHE.commit(variable)`
- D) `FHE.persist(variable)`

---

### Question 8

What is the recommended minimum Solidity version for FHEVM development?

- A) `^0.8.0`
- B) `^0.8.17`
- C) `^0.8.24` ✅
- D) `^0.9.0`

---

### Question 9

Which command compiles your FHEVM contracts?

- A) `npx hardhat build`
- B) `npx hardhat compile` ✅
- C) `npx fhevm compile`
- D) `npm run build:fhe`

---

### Question 10

What is the core library object used for all FHE operations in the new FHEVM API?

- A) `TFHE`
- B) `Encrypted`
- C) `FHE` ✅
- D) `Zama`

---

## Scoring

| Score | Rating |
|-------|--------|
| 10/10 | Excellent — You are ready for Module 03! |
| 7-9/10 | Good — Review the items you missed. |
| 4-6/10 | Fair — Re-read the lesson before proceeding. |
| 0-3/10 | Needs work — Go through the lesson and exercise again. |
