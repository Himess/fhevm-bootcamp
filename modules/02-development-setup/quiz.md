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

---

### Question 11

What is the correct function signature for accepting encrypted input in production?

- A) `function doSomething(euint32 encValue) external`
- B) `function doSomething(externalEuint32 encValue, bytes calldata inputProof) external`
- C) `function doSomething(bytes calldata encryptedData) external`
- D) `function doSomething(uint32 encValue, bytes calldata proof) external`

<details>
<summary>Answer</summary>

**B) `function doSomething(externalEuint32 encValue, bytes calldata inputProof) external`**

In production fhEVM contracts, encrypted inputs use the `externalEuintXX` type paired with `bytes calldata inputProof`. Inside the function, `FHE.fromExternal(encValue, inputProof)` converts and verifies the input.
</details>

---

### Question 12

What is the correct test pattern for sending encrypted data in Hardhat tests?

- A) `contract.increment(42)`
- B) `contract.increment(ethers.encryptedValue(42))`
- C) Create encrypted input with `fhevm.createEncryptedInput()`, then pass `encrypted.handles[0]` and `encrypted.inputProof`
- D) `contract.increment(FHE.encrypt(42))`

<details>
<summary>Answer</summary>

**C) Create encrypted input with `fhevm.createEncryptedInput()`, then pass `encrypted.handles[0]` and `encrypted.inputProof`**

In tests using @fhevm/hardhat-plugin, you create encrypted inputs via `fhevm.createEncryptedInput(contractAddress, signerAddress)`, chain `.add32(value)`, call `.encrypt()`, then pass `encrypted.handles[0]` and `encrypted.inputProof` to the contract function.
</details>

---

### Question 13

What is the difference between FHE.allowThis() and FHE.allow()?

- A) allowThis() is for testing, allow() is for production
- B) allowThis() grants the contract access to the handle, allow() grants a specific address access
- C) allowThis() is deprecated, only allow() should be used
- D) They are identical functions with different names

<details>
<summary>Answer</summary>

**B) allowThis() grants the contract access to the handle, allow() grants a specific address access**

`FHE.allowThis(handle)` grants the current contract permission to use the encrypted handle in future transactions. `FHE.allow(handle, address)` grants a specific external address (like msg.sender) permission to access the handle. Both are typically needed after updating an encrypted state variable.
</details>

---

## Scoring

| Score | Rating |
|-------|--------|
| 12-13/13 | Excellent -- You are ready for Module 03! |
| 9-11/13 | Good -- Review the items you missed. |
| 5-8/13 | Fair -- Re-read the lesson before proceeding. |
| 0-4/13 | Needs work -- Go through the lesson and exercise again. |
