const quizData = {
  "00": {
    title: "Module 00: Solidity Prerequisites",
    questions: [
      {
        question: "What is the default size of a `uint` in Solidity?",
        options: ["A) 8 bits", "B) 32 bits", "C) 128 bits", "D) 256 bits"],
        correct: 3,
        explanation: "`uint` is an alias for `uint256`. The EVM operates on 256-bit words natively."
      },
      {
        question: "What value does a mapping return for a key that has never been set?",
        options: ["A) It throws an error", "B) It returns `null`", "C) It returns the default value for the value type (e.g., `0` for `uint256`)", "D) It returns `undefined`"],
        correct: 2,
        explanation: "In Solidity, all possible keys exist in a mapping. Accessing an unset key returns the default value: `0` for integers, `false` for bools, `address(0)` for addresses."
      },
      {
        question: "What does the `indexed` keyword do when used in an event parameter?",
        options: ["A) It stores the parameter in contract storage", "B) It allows the parameter to be used for filtering logs off-chain", "C) It makes the parameter immutable", "D) It reduces the gas cost of emitting the event"],
        correct: 1,
        explanation: "Indexed parameters are stored as log topics, making them searchable and filterable by off-chain services. Up to 3 parameters per event can be indexed."
      },
      {
        question: "What does the `_` (underscore) represent inside a modifier?",
        options: ["A) A wildcard that matches any value", "B) The return value of the function", "C) A placeholder where the modified function's body will execute", "D) A reference to the previous modifier in the chain"],
        correct: 2,
        explanation: "The `_;` in a modifier marks where the function body (or next modifier) is inserted. Code before `_;` runs first, then the function body, then any code after `_;`."
      },
      {
        question: "What happens when a `require` statement evaluates to `false`?",
        options: ["A) The function returns `false`", "B) The function continues execution but logs a warning", "C) The transaction reverts and all state changes in the current call are undone", "D) Only the current function reverts; the calling function continues"],
        correct: 2,
        explanation: "`require(false, \"message\")` causes the entire transaction to revert, undoing all state changes and refunding remaining gas (minus what was consumed)."
      },
      {
        question: "Which ERC-20 function must be called before `transferFrom` can succeed?",
        options: ["A) `transfer`", "B) `approve`", "C) `mint`", "D) `allowance`"],
        correct: 1,
        explanation: "The token owner must first call `approve(spender, amount)` to grant the spender an allowance. Only then can the spender call `transferFrom(owner, recipient, amount)`."
      },
      {
        question: "What is `msg.sender` in the context of a smart contract function call?",
        options: ["A) The address of the contract itself", "B) The address that originally initiated the transaction (EOA)", "C) The address of the account that directly called the current function", "D) The address of the block miner/validator"],
        correct: 2,
        explanation: "`msg.sender` is the immediate caller. If User calls Contract A, which calls Contract B, then inside Contract B `msg.sender` is Contract A's address, not the User's address."
      },
      {
        question: "In a Hardhat test, which function is used to get test accounts?",
        options: ["A) `ethers.getAccounts()`", "B) `ethers.getSigners()`", "C) `ethers.getWallets()`", "D) `hardhat.accounts()`"],
        correct: 1,
        explanation: "`await ethers.getSigners()` returns an array of `Signer` objects representing the pre-funded test accounts provided by the Hardhat local network."
      },
      {
        question: "Why is it important to update state variables BEFORE making external calls in the `withdraw` function?",
        options: ["A) To save gas", "B) To prevent reentrancy attacks", "C) Because the compiler requires it", "D) To make events emit in the correct order"],
        correct: 1,
        explanation: "This is the Checks-Effects-Interactions (CEI) pattern. By updating the balance before sending ETH, a malicious contract cannot re-enter the `withdraw` function and drain more than its balance."
      },
      {
        question: "Which of the following is NOT a valid Solidity data type?",
        options: ["A) `bytes32`", "B) `address payable`", "C) `float`", "D) `uint8`"],
        correct: 2,
        explanation: "Solidity does not support floating-point numbers. All arithmetic is done with integers. To represent decimal values, protocols use a fixed number of decimal places (e.g., 18 decimals for most ERC-20 tokens)."
      }
    ]
  },
  "01": {
    title: "Module 01: Introduction to FHE",
    questions: [
      {
        question: "What is the key property of Homomorphic Encryption that distinguishes it from traditional encryption?",
        options: ["A) It uses larger key sizes for stronger security", "B) It allows computation directly on encrypted data without decrypting it", "C) It is faster than AES encryption", "D) It eliminates the need for encryption keys entirely"],
        correct: 1,
        explanation: "Homomorphic encryption is unique because you can perform arithmetic operations on ciphertexts, and the decrypted result matches what you would get from computing on the original plaintexts."
      },
      {
        question: "What is the main difference between Partially Homomorphic Encryption (PHE) and Fully Homomorphic Encryption (FHE)?",
        options: ["A) PHE is more secure than FHE", "B) PHE supports only one type of operation (add OR multiply), while FHE supports both with unlimited operations", "C) FHE can only work with boolean values", "D) PHE is newer and more efficient than FHE"],
        correct: 1,
        explanation: "PHE schemes like RSA (multiplication) or Paillier (addition) support only one operation type. FHE supports both addition and multiplication for an unlimited number of operations, enabling arbitrary computations."
      },
      {
        question: "What technique does FHE use to prevent noise from accumulating and corrupting ciphertexts after many operations?",
        options: ["A) Key rotation", "B) Bootstrapping", "C) Hash chaining", "D) Zero-knowledge proofs"],
        correct: 1,
        explanation: "Bootstrapping is a procedure that \"refreshes\" a ciphertext by reducing its noise level. This is the breakthrough technique (first described by Craig Gentry in 2009) that makes unlimited homomorphic operations possible."
      },
      {
        question: "Why is the Solidity `private` keyword insufficient for data privacy on Ethereum?",
        options: ["A) The compiler ignores the `private` keyword", "B) Private variables can still be read directly from blockchain storage by anyone", "C) Private variables are automatically published in transaction logs", "D) The `private` keyword only works on testnets"],
        correct: 1,
        explanation: "The `private` keyword only prevents other contracts from reading the variable via Solidity. Anyone can read any storage slot on-chain using `eth_getStorageAt` or similar tools. There is no true data privacy on a public blockchain by default."
      },
      {
        question: "Which privacy solution requires trust in hardware manufacturers?",
        options: ["A) Zero-Knowledge Proofs", "B) Multi-Party Computation", "C) Trusted Execution Environments (TEE)", "D) Fully Homomorphic Encryption"],
        correct: 2,
        explanation: "TEEs like Intel SGX and ARM TrustZone rely on special hardware to create secure enclaves. You must trust that the hardware manufacturer has not introduced backdoors and that the hardware is resistant to side-channel attacks."
      },
      {
        question: "In the fhEVM architecture, which component performs the actual FHE computations (addition, multiplication, comparison on ciphertexts)?",
        options: ["A) The Gateway", "B) The KMS", "C) The Coprocessor", "D) The user's browser"],
        correct: 2,
        explanation: "The Coprocessor is the computational engine that executes FHE operations. When a smart contract calls functions like `FHE.add()` or `FHE.le()`, the heavy cryptographic computation is delegated to the Coprocessor."
      },
      {
        question: "What is the role of the Gateway in the fhEVM architecture?",
        options: ["A) It compiles Solidity contracts to FHE circuits", "B) It stores all encrypted data on IPFS", "C) It enforces access control for decryption requests", "D) It generates the global FHE key pair"],
        correct: 2,
        explanation: "The Gateway mediates decryption requests. It checks on-chain ACL (Access Control List) permissions to verify that the requesting address is authorized to decrypt a given value, then coordinates with the KMS for threshold decryption."
      },
      {
        question: "Which of the following is an encrypted data type available in fhEVM?",
        options: ["A) `efloat`", "B) `euint64`", "C) `estring`", "D) `emap`"],
        correct: 1,
        explanation: "fhEVM provides encrypted versions of integer types (`euint8` through `euint256`), `ebool`, and `eaddress`. There is no `efloat`, `estring`, or `emap` type."
      },
      {
        question: "How does FHE-based private voting improve upon standard on-chain governance?",
        options: ["A) It makes voting faster", "B) It reduces gas costs for voting transactions", "C) Individual votes are encrypted, preventing coercion and vote buying, with only the final tally decrypted", "D) It allows votes to be changed after submission"],
        correct: 2,
        explanation: "With FHE voting, each vote is encrypted. The smart contract tallies encrypted votes homomorphically. Individual votes are never visible during or after the voting period -- only the final aggregated result is decrypted."
      },
      {
        question: "What is the primary trade-off of using FHE compared to other privacy solutions?",
        options: ["A) FHE requires hardware trust assumptions", "B) FHE can only perform addition, not multiplication", "C) FHE has significant computational overhead (operations are much slower than plaintext)", "D) FHE data cannot be stored on-chain"],
        correct: 2,
        explanation: "FHE provides the strongest privacy guarantee (data is never decrypted during computation, no hardware trust needed), but at the cost of performance. Operations on ciphertexts are 10x to 1000x slower than on plaintext."
      },
      {
        question: "What does TFHE stand for and what makes it special?",
        options: ["A) Trusted Fully Homomorphic Encryption -- uses trusted hardware", "B) Torus Fully Homomorphic Encryption -- supports fast bootstrapping for unlimited operations", "C) Total Fully Homomorphic Encryption -- encrypts all data types", "D) Threshold Fully Homomorphic Encryption -- requires multiple parties"],
        correct: 1,
        explanation: "TFHE stands for Torus Fully Homomorphic Encryption. Its key innovation is fast bootstrapping, which resets noise after each operation, enabling unlimited sequential computations on encrypted data."
      },
      {
        question: "Which component of fhEVM handles the heavy FHE computations?",
        options: ["A) The Gateway", "B) The KMS (Key Management Service)", "C) The Coprocessor", "D) The ACL contract"],
        correct: 2,
        explanation: "The Coprocessor executes the computationally expensive FHE operations off-chain, while the on-chain contract only stores encrypted handles (bytes32 references)."
      },
      {
        question: "Which of the following is NOT a product/library created by Zama?",
        options: ["A) TFHE-rs", "B) Concrete ML", "C) fhEVM", "D) Circom"],
        correct: 3,
        explanation: "Circom is a ZK-SNARK circuit language, not a Zama product. Zama's products include TFHE-rs (Rust FHE library), Concrete (FHE compiler), Concrete ML (encrypted machine learning), and fhEVM (encrypted smart contracts)."
      }
    ]
  },
  "02": {
    title: "Module 02: Development Setup",
    questions: [
      {
        question: "What is the correct npm package to install for FHEVM Solidity development?",
        options: ["A) `@zama/fhevm`", "B) `@fhevm/solidity`", "C) `@tfhe/solidity`", "D) `fhevm-contracts`"],
        correct: 1,
        explanation: "The correct package is `@fhevm/solidity`."
      },
      {
        question: "Which import statement provides the core FHE operations library?",
        options: ["A) `import \"@fhevm/solidity/lib/TFHE.sol\";`", "B) `import \"@fhevm/solidity/FHE.sol\";`", "C) `import \"@fhevm/solidity/lib/FHE.sol\";`", "D) `import \"@openzeppelin/fhe/FHE.sol\";`"],
        correct: 2,
        explanation: "The correct import path is `@fhevm/solidity/lib/FHE.sol`."
      },
      {
        question: "What must every FHEVM contract inherit to be properly configured?",
        options: ["A) `FHEConfig`", "B) `ZamaEthereumConfig`", "C) `FHEVMSetup`", "D) `EncryptedBase`"],
        correct: 1,
        explanation: "Every FHEVM contract must inherit `ZamaEthereumConfig`."
      },
      {
        question: "Where is `ZamaEthereumConfig` imported from?",
        options: ["A) `@fhevm/solidity/lib/FHE.sol`", "B) `@fhevm/solidity/lib/ZamaConfig.sol`", "C) `@fhevm/solidity/config/ZamaConfig.sol`", "D) `@fhevm/solidity/config/EthereumConfig.sol`"],
        correct: 2,
        explanation: "The import path is `@fhevm/solidity/config/ZamaConfig.sol`."
      },
      {
        question: "What does `ZamaEthereumConfig` configure automatically?",
        options: ["A) Only the FHE co-processor address", "B) Only the ACL and KMS addresses", "C) The FHE co-processor, ACL, KMS verifier, and Gateway addresses", "D) The Hardhat network settings"],
        correct: 2,
        explanation: "ZamaEthereumConfig configures all necessary addresses: FHE co-processor, ACL, KMS verifier, and Gateway."
      },
      {
        question: "How do you encrypt a plaintext integer `42` as a 32-bit encrypted value on-chain?",
        options: ["A) `TFHE.asEuint32(42)`", "B) `FHE.encrypt(42)`", "C) `FHE.asEuint32(42)`", "D) `euint32(42)`"],
        correct: 2,
        explanation: "The correct function is `FHE.asEuint32(42)`."
      },
      {
        question: "After updating an encrypted state variable, what must you call?",
        options: ["A) `FHE.save(variable)`", "B) `FHE.allowThis(variable)`", "C) `FHE.commit(variable)`", "D) `FHE.persist(variable)`"],
        correct: 1,
        explanation: "You must call `FHE.allowThis(variable)` to grant the contract permission to use the updated value in future transactions."
      },
      {
        question: "What is the recommended minimum Solidity version for FHEVM development?",
        options: ["A) `^0.8.0`", "B) `^0.8.17`", "C) `^0.8.24`", "D) `^0.9.0`"],
        correct: 2,
        explanation: "The recommended minimum Solidity version is `^0.8.24`."
      },
      {
        question: "Which command compiles your FHEVM contracts?",
        options: ["A) `npx hardhat build`", "B) `npx hardhat compile`", "C) `npx fhevm compile`", "D) `npm run build:fhe`"],
        correct: 1,
        explanation: "Standard Hardhat compilation command: `npx hardhat compile`."
      },
      {
        question: "What is the core library object used for all FHE operations in the new FHEVM API?",
        options: ["A) `TFHE`", "B) `Encrypted`", "C) `FHE`", "D) `Zama`"],
        correct: 2,
        explanation: "The core library object is `FHE`."
      },
      {
        question: "What is the correct function signature for accepting encrypted input in production?",
        options: ["A) `function doSomething(euint32 encValue) external`", "B) `function doSomething(externalEuint32 encValue, bytes calldata inputProof) external`", "C) `function doSomething(bytes calldata encryptedData) external`", "D) `function doSomething(uint32 encValue, bytes calldata proof) external`"],
        correct: 1,
        explanation: "In production fhEVM contracts, encrypted inputs use the `externalEuintXX` type paired with `bytes calldata inputProof`. Inside the function, `FHE.fromExternal(encValue, inputProof)` converts and verifies the input."
      },
      {
        question: "What is the correct test pattern for sending encrypted data in Hardhat tests?",
        options: ["A) `contract.increment(42)`", "B) `contract.increment(ethers.encryptedValue(42))`", "C) Create encrypted input with `fhevm.createEncryptedInput()`, then pass `encrypted.handles[0]` and `encrypted.inputProof`", "D) `contract.increment(FHE.encrypt(42))`"],
        correct: 2,
        explanation: "In tests using @fhevm/hardhat-plugin, you create encrypted inputs via `fhevm.createEncryptedInput(contractAddress, signerAddress)`, chain `.add32(value)`, call `.encrypt()`, then pass `encrypted.handles[0]` and `encrypted.inputProof` to the contract function."
      },
      {
        question: "What is the difference between FHE.allowThis() and FHE.allow()?",
        options: ["A) allowThis() is for testing, allow() is for production", "B) allowThis() grants the contract access to the handle, allow() grants a specific address access", "C) allowThis() is deprecated, only allow() should be used", "D) They are identical functions with different names"],
        correct: 1,
        explanation: "`FHE.allowThis(handle)` grants the current contract permission to use the encrypted handle in future transactions. `FHE.allow(handle, address)` grants a specific external address (like msg.sender) permission to access the handle."
      }
    ]
  },
  "03": {
    title: "Module 03: Encrypted Types Deep Dive",
    questions: [
      {
        question: "Which of the following is NOT a valid FHEVM encrypted type?",
        options: ["A) `euint32`", "B) `eaddress`", "C) `eint32`", "D) `ebool`"],
        correct: 2,
        explanation: "FHEVM only supports unsigned encrypted integers. There is no signed `eint` type."
      },
      {
        question: "What is the maximum value that can be stored in an `euint8`?",
        options: ["A) 128", "B) 200", "C) 255", "D) 256"],
        correct: 2,
        explanation: "`euint8` is an 8-bit unsigned integer, so its range is 0 to 2^8 - 1 = 255."
      },
      {
        question: "How is an encrypted value actually stored on the EVM?",
        options: ["A) As the raw ciphertext bytes", "B) As a `uint256` handle referencing a ciphertext in the FHE co-processor", "C) As an encrypted hash in a Merkle tree", "D) As a regular `uint256` with an encryption flag"],
        correct: 1,
        explanation: "Encrypted values are stored as uint256 handles that reference ciphertexts managed by the FHE co-processor."
      },
      {
        question: "What happens when you use an uninitialized `euint32` variable in an operation?",
        options: ["A) It is treated as encrypted zero", "B) The operation reverts", "C) It returns a random encrypted value", "D) The compiler prevents it"],
        correct: 1,
        explanation: "Uninitialized encrypted variables have handle `0`, which is invalid. Using them in operations will revert."
      },
      {
        question: "Which function correctly encrypts the address `0xAbC...123` on-chain?",
        options: ["A) `FHE.encrypt(0xAbC...123)`", "B) `FHE.asEuint160(0xAbC...123)`", "C) `FHE.asEaddress(0xAbC...123)`", "D) `eaddress(0xAbC...123)`"],
        correct: 2,
        explanation: "The correct function is `FHE.asEaddress()` for encrypting addresses."
      },
      {
        question: "What is the gas cost implication of choosing `euint256` over `euint32`?",
        options: ["A) Same cost -- all encrypted types use one storage slot", "B) `euint256` operations are significantly more expensive", "C) `euint256` is cheaper due to batch processing", "D) Gas cost depends only on the number of operations, not the type"],
        correct: 1,
        explanation: "While both use one storage slot, operations on larger types cost more gas."
      },
      {
        question: "Which code correctly stores an encrypted mapping of user balances?",
        options: ["A) `mapping(address => encrypted(uint32)) balances;`", "B) `mapping(address => euint32) private _balances;`", "C) `mapping(eaddress => euint32) private _balances;`", "D) `FHE.mapping(address => uint32) private _balances;`"],
        correct: 1,
        explanation: "Mapping keys must be plaintext types. Only the values can be encrypted."
      },
      {
        question: "Why is `FHE.asEuint32(42)` in a public function NOT truly private?",
        options: ["A) Because 32-bit encryption is weak", "B) Because the plaintext `42` is visible in the transaction calldata", "C) Because the EVM stores it unencrypted", "D) Because `asEuint32` does not actually encrypt"],
        correct: 1,
        explanation: "`FHE.asEuint32()` takes a plaintext input that is part of the transaction data. For private inputs, use `externalEuint32` with `FHE.fromExternal()`."
      },
      {
        question: "Which operations are NOT supported on `euint256`?",
        options: ["A) `FHE.eq()` and `FHE.ne()`", "B) `FHE.and()`, `FHE.or()`, `FHE.xor()`", "C) `FHE.add()`, `FHE.sub()`, `FHE.mul()`", "D) All operations are supported"],
        correct: 2,
        explanation: "`euint256` only supports bitwise operations (and, or, xor) and equality checks (eq, ne). Arithmetic operations like add, sub, mul, and ordering comparisons are NOT available."
      },
      {
        question: "After updating `_balance` with `FHE.add()`, what must you do next?",
        options: ["A) Call `FHE.save(_balance)`", "B) Call `FHE.commit()`", "C) Call `FHE.allowThis(_balance)`", "D) Nothing -- updates are automatic"],
        correct: 2,
        explanation: "Every time an encrypted state variable is updated, you must re-grant access with `FHE.allowThis()`."
      }
    ]
  },
  "04": {
    title: "Module 04: Operations on Encrypted Data",
    questions: [
      {
        question: "What does `FHE.add(a, b)` return when both `a` and `b` are `euint32`?",
        options: ["A) A `uint32` plaintext sum", "B) An `euint32` encrypted sum", "C) An `euint64` to prevent overflow", "D) A `bool` indicating success"],
        correct: 1,
        explanation: "FHE.add() returns an encrypted value of the same type as the operands."
      },
      {
        question: "Which of the following is NOT a valid operation?",
        options: ["A) `FHE.div(encryptedValue, 5)`", "B) `FHE.div(encryptedA, encryptedB)`", "C) `FHE.mul(encryptedA, encryptedB)`", "D) `FHE.add(encryptedValue, 10)`"],
        correct: 1,
        explanation: "Division and remainder only support a plaintext second operand."
      },
      {
        question: "What happens when you compute `FHE.sub(FHE.asEuint8(5), FHE.asEuint8(10))`?",
        options: ["A) The transaction reverts with an underflow error", "B) The result is encrypted 0", "C) The result wraps to encrypted 251 (256 - 5)", "D) The result is encrypted -5"],
        correct: 2,
        explanation: "FHEVM uses wrapping arithmetic with no revert on underflow."
      },
      {
        question: "What type does `FHE.gt(euint32_a, euint32_b)` return?",
        options: ["A) `bool`", "B) `ebool`", "C) `euint32`", "D) `uint8`"],
        correct: 1,
        explanation: "All comparison operations return `ebool` (encrypted boolean)."
      },
      {
        question: "Which operation is the most gas-efficient?",
        options: ["A) `FHE.mul(a, b)`", "B) `FHE.not(a)`", "C) `FHE.div(a, 2)`", "D) `FHE.gt(a, b)`"],
        correct: 1,
        explanation: "`FHE.not()` is the cheapest operation as it works on a single operand with simple bitwise logic."
      },
      {
        question: "How do you clamp an encrypted value between 10 and 100?",
        options: ["A) `FHE.clamp(value, 10, 100)`", "B) `FHE.max(FHE.min(value, FHE.asEuint32(100)), FHE.asEuint32(10))`", "C) `FHE.bound(value, 10, 100)`", "D) `FHE.select(value, 10, 100)`"],
        correct: 1,
        explanation: "Use `FHE.min()` to cap the upper bound and `FHE.max()` to enforce the lower bound."
      },
      {
        question: "Can you add an `euint32` and an `euint64` directly?",
        options: ["A) Yes, the result is `euint64`", "B) Yes, the result is `euint32`", "C) No, both operands must be the same type", "D) Yes, but you must specify the result type"],
        correct: 0,
        explanation: "fhEVM supports cross-type arithmetic. When operands have different types, the result is automatically upcast to the larger type."
      },
      {
        question: "What does `FHE.xor(FHE.asEuint8(0xFF), FHE.asEuint8(0xFF))` decrypt to?",
        options: ["A) 255", "B) 0", "C) 1", "D) Compilation error"],
        correct: 1,
        explanation: "XOR of a value with itself always produces 0. 0xFF XOR 0xFF = 0x00."
      },
      {
        question: "Which pattern provides safe subtraction (no underflow)?",
        options: ["A) `FHE.safeSub(a, b)`", "B) Check `FHE.ge(a, b)` then use `FHE.select()` to choose between `FHE.sub(a, b)` and zero", "C) Wrap `FHE.sub(a, b)` in a try/catch", "D) Use `FHE.sub(FHE.max(a, b), b)`"],
        correct: 1,
        explanation: "There is no built-in `safeSub`. You must use `FHE.ge()` + `FHE.select()` for the pattern."
      },
      {
        question: "What does `FHE.rem(FHE.asEuint32(17), 5)` compute?",
        options: ["A) Encrypted 3", "B) Encrypted 2", "C) Encrypted 5", "D) It reverts because 17 is not divisible by 5"],
        correct: 1,
        explanation: "17 % 5 = 2. Remainder operation with a plaintext divisor."
      },
      {
        question: "In `FHE.shl(value, amount)`, what type must `amount` be?",
        options: ["A) Same type as `value`", "B) Always `uint256`", "C) Always `euint8` or `uint8`", "D) Any unsigned integer type"],
        correct: 2,
        explanation: "Shift and rotate operations in fhEVM require the shift amount to be `euint8` or `uint8`, regardless of the value being shifted."
      }
    ]
  },
  "05": {
    title: "Module 05: Access Control (ACL)",
    questions: [
      {
        question: "What does `FHE.allowThis(handle)` do?",
        options: ["A) Allows all addresses to access the ciphertext", "B) Grants the current contract permission to use the ciphertext", "C) Makes the ciphertext publicly decryptable", "D) Transfers ownership of the ciphertext to the contract"],
        correct: 1,
        explanation: "FHE.allowThis(handle) grants the current contract permission to use the ciphertext in future transactions."
      },
      {
        question: "When must you call `FHE.allowThis()` on a state variable?",
        options: ["A) Only when the variable is first initialized", "B) Only when transferring to another contract", "C) After every operation that produces a new ciphertext (new handle)", "D) Once per transaction, at the end"],
        correct: 2,
        explanation: "Every FHE operation produces a new handle. You must call allowThis() after every operation that updates a state variable."
      },
      {
        question: "What is the difference between `FHE.allow()` and `FHE.allowTransient()`?",
        options: ["A) `allow` is for contracts, `allowTransient` is for EOAs", "B) `allow` persists permanently, `allowTransient` expires after the transaction", "C) `allow` is free, `allowTransient` costs extra gas", "D) There is no difference -- they are aliases"],
        correct: 1,
        explanation: "`allow` persists permanently on-chain, while `allowTransient` expires at the end of the transaction."
      },
      {
        question: "What happens if you forget to call `FHE.allowThis()` after updating an encrypted state variable?",
        options: ["A) Nothing -- access is inherited from the previous handle", "B) The contract cannot use the variable in future transactions", "C) The variable is automatically deleted", "D) The transaction reverts"],
        correct: 1,
        explanation: "Without allowThis(), the contract loses permission to use the updated handle in future transactions."
      },
      {
        question: "How do you check if `msg.sender` has access to a ciphertext?",
        options: ["A) `FHE.hasAccess(handle, msg.sender)`", "B) `FHE.isSenderAllowed(handle)`", "C) `FHE.checkACL(handle)`", "D) `ACL.isAllowed(handle, msg.sender)`"],
        correct: 1,
        explanation: "`FHE.isSenderAllowed(handle)` checks if msg.sender has ACL access to the ciphertext."
      },
      {
        question: "In an encrypted token transfer, who should receive ACL access to the receiver's updated balance?",
        options: ["A) Only the receiver", "B) Only the contract", "C) Both the contract (`allowThis`) and the receiver (`allow`)", "D) The sender, receiver, and contract"],
        correct: 2,
        explanation: "The contract needs access for future operations (allowThis), and the receiver needs access to decrypt their balance (allow)."
      },
      {
        question: "When should you use `FHE.allowTransient()` instead of `FHE.allow()`?",
        options: ["A) When the access is needed only within the current transaction", "B) When the ciphertext is small", "C) When the address is an EOA", "D) When you want to save the ciphertext to storage"],
        correct: 0,
        explanation: "allowTransient is for temporary access needed only within the current transaction, such as inter-contract calls."
      },
      {
        question: "Does the ACL from handle_A automatically transfer to handle_B when you compute `handle_B = FHE.add(handle_A, ...)`?",
        options: ["A) Yes, all ACL entries are inherited", "B) Only the contract's access is inherited", "C) No, handle_B starts with an empty ACL", "D) Only transient entries are inherited"],
        correct: 2,
        explanation: "Every FHE operation creates a new handle with an empty ACL. No permissions are inherited."
      },
      {
        question: "How do you revoke access to a ciphertext from a previously authorized address?",
        options: ["A) Call `FHE.revoke(handle, address)`", "B) Call `FHE.deny(handle, address)`", "C) Create a new ciphertext (new handle) and only grant access to still-authorized addresses", "D) Set the handle to zero"],
        correct: 2,
        explanation: "There is no direct revocation mechanism. You must rotate the data by creating a new handle."
      },
      {
        question: "In a multi-contract architecture, Contract A wants to pass an encrypted value to Contract B within a single transaction. What is the most gas-efficient approach?",
        options: ["A) `FHE.allow(handle, contractB)` -- persistent access", "B) `FHE.allowTransient(handle, contractB)` -- transaction-scoped access", "C) `FHE.allowThis(handle)` from Contract A, then Contract B reads it", "D) Decrypt the value and send the plaintext"],
        correct: 1,
        explanation: "allowTransient is the most gas-efficient for single-transaction inter-contract communication."
      },
      {
        question: "What does `FHE.makePubliclyDecryptable(handle)` do?",
        options: ["A) Decrypts the value on-chain and stores it as plaintext", "B) Makes the ciphertext decryptable by any address", "C) Removes all existing ACL permissions", "D) Transfers ownership of the handle"],
        correct: 1,
        explanation: "`FHE.makePubliclyDecryptable(handle)` adds universal read access to the ciphertext. Any address can then decrypt it."
      },
      {
        question: "After computing `c = FHE.add(a, b)`, who has ACL access to `c`?",
        options: ["A) Everyone who had access to `a` and `b`", "B) Only the contract (automatically)", "C) Nobody -- ACL must be explicitly set for the new handle", "D) The transaction sender automatically gets access"],
        correct: 2,
        explanation: "Every FHE operation creates a NEW ciphertext handle. The new handle has NO ACL permissions by default."
      },
      {
        question: "What is the purpose of `FHE.allowTransient(handle, address)`?",
        options: ["A) Grants permanent access that expires after 24 hours", "B) Grants access only within the current transaction", "C) Grants read-only access (cannot use in computations)", "D) Grants access to all handles owned by the contract"],
        correct: 1,
        explanation: "`FHE.allowTransient` grants temporary access valid only within the current transaction. Essential for inter-contract calls."
      }
    ]
  },
  "06": {
    title: "Module 06: Encrypted Inputs & ZK Proofs",
    questions: [
      {
        question: "Why is `FHE.asEuint32(plaintext)` not sufficient for private user inputs?",
        options: ["A) It uses weak encryption", "B) The plaintext value is visible in the transaction calldata", "C) It cannot encrypt values larger than 255", "D) It requires a gas subsidy"],
        correct: 1,
        explanation: "The plaintext value passed to FHE.asEuint32() is part of the transaction data and visible to everyone."
      },
      {
        question: "What is the correct Solidity type for receiving a client-encrypted 64-bit unsigned integer?",
        options: ["A) `einput`", "B) `bytes calldata`", "C) `externalEuint64`", "D) `euint64`"],
        correct: 2,
        explanation: "The correct type is `externalEuint64` for receiving client-encrypted data."
      },
      {
        question: "What function converts an external encrypted input to an on-chain encrypted type?",
        options: ["A) `TFHE.asEuint64(input, proof)`", "B) `FHE.decrypt(input)`", "C) `FHE.fromExternal(input, proof)`", "D) `FHE.convert(input)`"],
        correct: 2,
        explanation: "`FHE.fromExternal(input, proof)` converts and verifies external encrypted inputs."
      },
      {
        question: "What additional parameter must accompany `externalEuintXX` in a function signature?",
        options: ["A) `bytes memory data`", "B) `uint256 nonce`", "C) `bytes calldata proof`", "D) No additional parameter is needed"],
        correct: 2,
        explanation: "A `bytes calldata proof` must accompany the external encrypted input for verification."
      },
      {
        question: "What does the ZK proof bundled with an encrypted input guarantee?",
        options: ["A) That the plaintext is less than 1000", "B) That the ciphertext is well-formed, the value is in range, and the submitter knows the plaintext", "C) That the transaction was signed correctly", "D) That the gas cost is covered"],
        correct: 1,
        explanation: "The ZK proof guarantees the ciphertext is well-formed, the value is in range, and the submitter knows the plaintext."
      },
      {
        question: "Who performs the ZK proof verification when `FHE.fromExternal(input, proof)` is called?",
        options: ["A) The client browser", "B) The Gateway service", "C) The FHE co-processor / `FHE.fromExternal(input, proof)` automatically", "D) The contract developer must verify it manually"],
        correct: 2,
        explanation: "The verification happens automatically within `FHE.fromExternal()`."
      },
      {
        question: "Which client library is used for encrypting values before sending to FHEVM contracts?",
        options: ["A) `ethers.js`", "B) Relayer SDK (`@zama-fhe/relayer-sdk`)", "C) `openzeppelin.js`", "D) `web3.js`"],
        correct: 1,
        explanation: "The Relayer SDK (`@zama-fhe/relayer-sdk`) is the official client library for FHEVM."
      },
      {
        question: "How do you encrypt multiple values in a single transaction (e.g., price and quantity)?",
        options: ["A) Make separate transactions for each value", "B) Use `createEncryptedInput()`, call `.add64()` and `.add32()` on it, then `.encrypt()`", "C) Concatenate the values into a single `uint256`", "D) Use `FHE.batchEncrypt()`"],
        correct: 1,
        explanation: "Chain multiple add calls on a single createEncryptedInput() instance, then call encrypt() once."
      },
      {
        question: "Can you use an `externalEuint32` directly in `FHE.add()`?",
        options: ["A) Yes, it is automatically converted", "B) No, you must first call `FHE.fromExternal(input, proof)` to get a `euint32`", "C) Yes, but only for addition operations", "D) No, external types cannot be used in contracts at all"],
        correct: 1,
        explanation: "External types must be converted with FHE.fromExternal() before use in FHE operations."
      },
      {
        question: "When should you use `FHE.asEuintXX(value)` instead of `externalEuintXX`?",
        options: ["A) When the value is a user's secret data", "B) When initializing state to zero or using non-sensitive contract-internal constants", "C) When the value is very large", "D) Never -- always use external inputs"],
        correct: 1,
        explanation: "Use FHE.asEuintXX() for non-sensitive values like initializing to zero or using public constants."
      },
      {
        question: "When encrypting multiple values with `.add32().add64().encrypt()`, how many `inputProof` values are produced?",
        options: ["A) One per encrypted value", "B) One shared proof for all values in that `encrypt()` call", "C) None -- proofs are generated on-chain", "D) Two -- one for each type"],
        correct: 1,
        explanation: "A single encrypt() call produces one shared inputProof that covers all handles created in that batch."
      },
      {
        question: "After calling `FHE.fromExternal(input, proof)`, what must you do before storing the result?",
        options: ["A) Nothing -- it's ready to use", "B) Call `FHE.verify()` to validate the proof", "C) Call `FHE.allowThis()` and `FHE.allow()` to set ACL permissions", "D) Convert it with `FHE.asEuint32()`"],
        correct: 2,
        explanation: "FHE.fromExternal() returns a new handle with no ACL permissions. You must set ACL with allowThis() and allow()."
      }
    ]
  },
  "07": {
    title: "Module 07: Decryption Patterns",
    questions: [
      {
        question: "What is the main difference between public decryption and user-specific reencryption?",
        options: ["A) Public decryption is faster", "B) Public decryption reveals the plaintext to everyone; reencryption reveals it only to the authorized user", "C) Reencryption is only for contracts, public decryption is only for users", "D) There is no difference -- they are the same mechanism"],
        correct: 1,
        explanation: "Public decryption makes the value visible to everyone, while reencryption reveals it only to the authorized user."
      },
      {
        question: "What function makes an encrypted value decryptable by anyone?",
        options: ["A) `FHE.decrypt(handle)`", "B) `FHE.makePubliclyDecryptable(handle)`", "C) `FHE.allow(handle, address(0))`", "D) `Gateway.requestDecryption(handle)`"],
        correct: 1,
        explanation: "`FHE.makePubliclyDecryptable(handle)` marks the value for public decryption."
      },
      {
        question: "Is `FHE.makePubliclyDecryptable()` reversible?",
        options: ["A) Yes, you can call `FHE.revokePublicAccess()`", "B) Yes, by creating a new handle and copying the value", "C) No, once made publicly decryptable it cannot be undone", "D) Yes, but only the contract owner can reverse it"],
        correct: 2,
        explanation: "Once made publicly decryptable, it cannot be undone. This is an irreversible operation."
      },
      {
        question: "What must a contract do before a user can decrypt their own encrypted balance?",
        options: ["A) Call `FHE.makePubliclyDecryptable()` on the balance", "B) Call `FHE.allow(balance, userAddress)` to grant ACL access", "C) Send the user the FHE private key", "D) Nothing -- users can always decrypt any value"],
        correct: 1,
        explanation: "The contract must grant the user ACL access via FHE.allow() before they can decrypt."
      },
      {
        question: "In Hardhat tests, which function decrypts an encrypted uint32?",
        options: ["A) `fhevm.decrypt(handle)`", "B) `fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, signer)`", "C) `contract.decrypt(handle)`", "D) `FHE.decrypt(handle)`"],
        correct: 1,
        explanation: "In Hardhat tests, use `fhevm.userDecryptEuint()` with the type, handle, contract address, and signer."
      },
      {
        question: "What is the correct way to guard a view function that returns an encrypted handle?",
        options: ["A) Use `onlyOwner` modifier", "B) Check `require(FHE.isSenderAllowed(handle), \"No access\")`", "C) Check `require(msg.sender != address(0))`", "D) No guard needed -- encrypted handles are safe to return"],
        correct: 1,
        explanation: "Use `FHE.isSenderAllowed(handle)` to verify the caller has ACL access before returning the handle."
      },
      {
        question: "After performing `result = FHE.add(a, b)`, who has ACL access to `result`?",
        options: ["A) Everyone who had access to `a` and `b`", "B) Only the contract (automatically)", "C) Nobody -- ACL must be explicitly set for the new handle", "D) The transaction sender automatically gets access"],
        correct: 2,
        explanation: "New handles from FHE operations have no ACL permissions. They must be explicitly set."
      },
      {
        question: "When should you use `FHE.makePubliclyDecryptable()` vs `FHE.allow()`?",
        options: ["A) `makePubliclyDecryptable` for any decryption, `allow` is deprecated", "B) `makePubliclyDecryptable` when everyone should see the value; `allow` when only specific users should see it", "C) They are interchangeable", "D) `allow` for public values, `makePubliclyDecryptable` for private values"],
        correct: 1,
        explanation: "Use makePubliclyDecryptable for values everyone should see, and allow for user-specific access."
      },
      {
        question: "Why should you minimize the number of decryption operations?",
        options: ["A) Each decryption costs exactly 1 ETH", "B) Every decryption reveals information, reducing the overall privacy of the system", "C) The system can only handle 10 decryptions per day", "D) Decryption is not supported on mainnet"],
        correct: 1,
        explanation: "Every decryption reveals information, reducing the overall privacy of the system."
      },
      {
        question: "What is the better pattern for checking if a balance exceeds 1000?",
        options: ["A) Make the balance public, read it, then compare off-chain", "B) Use `FHE.gt(_balance, FHE.asEuint64(1000))` to compare while encrypted", "C) Request Gateway decryption and compare in the callback", "D) Store the balance as plaintext and compare directly"],
        correct: 1,
        explanation: "Keeping the comparison encrypted reveals only a boolean result (is it greater?), not the exact balance."
      },
      {
        question: "In a browser application using the Relayer SDK, how does a user decrypt their own encrypted data?",
        options: ["A) They call a contract function that returns the plaintext", "B) They use `instance.reencrypt()` with their keypair and EIP-712 signature", "C) They request decryption from the Gateway directly", "D) They download the FHE secret key and decrypt locally"],
        correct: 1,
        explanation: "Users use `instance.reencrypt()` with their keypair and EIP-712 signature to decrypt their data."
      },
      {
        question: "What is the Gateway in the context of FHEVM production networks?",
        options: ["A) A smart contract that stores all plaintext values", "B) An off-chain service that coordinates async decryption with the KMS using a callback pattern", "C) A browser plugin for viewing encrypted values", "D) A Solidity library for encryption"],
        correct: 1,
        explanation: "The Gateway is an off-chain relayer that handles decryption requests and coordinates with the KMS."
      }
    ]
  },
  "08": {
    title: "Module 08: Conditional Logic",
    questions: [
      {
        question: "Why can you NOT use `if (ebool)` in FHEVM contracts?",
        options: ["A) `ebool` is too large for the EVM", "B) The EVM requires a plaintext `bool` for branching; `ebool` is encrypted and unreadable", "C) `if` statements are disabled in FHEVM", "D) You need to use `switch` instead"],
        correct: 1,
        explanation: "The EVM can only branch on plaintext booleans. An ebool is encrypted and its value is unknown to the EVM."
      },
      {
        question: "What does `FHE.select(cond, a, b)` return?",
        options: ["A) Always `a`", "B) Always `b`", "C) `a` if `cond` is encrypted true, `b` if `cond` is encrypted false", "D) The decrypted value of `cond`"],
        correct: 2,
        explanation: "FHE.select() is the encrypted ternary operator: returns a if condition is true, b if false."
      },
      {
        question: "When `FHE.select(cond, branchA, branchB)` executes, which branches are computed?",
        options: ["A) Only the branch matching the condition", "B) Both branches are always computed", "C) Neither -- the result is pre-computed", "D) It depends on the type of `cond`"],
        correct: 1,
        explanation: "Both branches are always computed. This is essential for privacy -- otherwise gas differences would leak information."
      },
      {
        question: "What is the gas cost implication of `FHE.select()`?",
        options: ["A) Gas cost equals the cheaper branch", "B) Gas cost equals the more expensive branch", "C) Gas cost is the sum of both branches plus the select operation", "D) Gas cost is fixed regardless of branches"],
        correct: 2,
        explanation: "Both branches are computed, so gas cost is the sum of both branches plus the select operation itself."
      },
      {
        question: "Which code correctly implements `max(a, b)` using `FHE.select()`?",
        options: ["A) `FHE.select(FHE.gt(a, b), b, a)`", "B) `FHE.select(FHE.gt(a, b), a, b)`", "C) `FHE.select(FHE.eq(a, b), a, b)`", "D) `FHE.select(a, FHE.gt(a, b), b)`"],
        correct: 1,
        explanation: "If a > b is true, select a (the larger); otherwise select b."
      },
      {
        question: "How do you combine two encrypted conditions (both must be true)?",
        options: ["A) `condA && condB`", "B) `FHE.and(condA, condB)`", "C) `FHE.select(condA, condB, condA)`", "D) `condA + condB`"],
        correct: 1,
        explanation: "FHE.and() performs an encrypted AND operation on two ebool values."
      },
      {
        question: "What happens if the two value parameters in `FHE.select()` have different types?",
        options: ["A) The larger type is used", "B) The smaller type is used", "C) It results in a compilation error", "D) Automatic type conversion occurs"],
        correct: 2,
        explanation: "FHE.select() requires both value parameters to be the same type. Mismatched types cause a compilation error."
      },
      {
        question: "Which pattern correctly clamps a value between 10 and 100?",
        options: ["A) `FHE.select(FHE.gt(val, 100), 100, FHE.select(FHE.lt(val, 10), 10, val))`", "B) `FHE.min(FHE.max(val, FHE.asEuint32(10)), FHE.asEuint32(100))`", "C) `FHE.clamp(val, 10, 100)`", "D) `FHE.bound(val, 10, 100)`"],
        correct: 1,
        explanation: "Use FHE.max() to enforce the lower bound and FHE.min() to cap the upper bound."
      },
      {
        question: "In a nested select chain for tiered pricing, which select should be evaluated LAST (outermost)?",
        options: ["A) The default (lowest tier) case", "B) The highest priority tier (e.g., the best discount)", "C) The middle tier", "D) The order does not matter"],
        correct: 1,
        explanation: "Higher-priority conditions should be checked last so they can override lower-priority selections."
      },
      {
        question: "What is the encrypted equivalent of `if (a >= b) { a -= b; } else { a = 0; }`?",
        options: ["A) `a = FHE.sub(a, b);`", "B) `a = FHE.select(FHE.ge(a, b), FHE.sub(a, b), FHE.asEuint32(0));`", "C) `a = FHE.min(a, b);`", "D) `a = FHE.select(FHE.lt(a, b), FHE.sub(a, b), FHE.asEuint32(0));`"],
        correct: 1,
        explanation: "FHE.ge(a, b) checks if a >= b, then FHE.select picks the subtraction result or zero accordingly."
      }
    ]
  },
  "09": {
    title: "Module 09: On-Chain Encrypted Randomness",
    questions: [
      {
        question: "What is the key advantage of FHE-based randomness over traditional on-chain randomness (e.g., `block.prevrandao`)?",
        options: ["A) It is faster to compute", "B) It costs less gas", "C) The random values are encrypted, so nobody can see or manipulate them", "D) It uses less storage on-chain"],
        correct: 2,
        explanation: "FHE randomness generates values that are encrypted from the moment of creation, preventing any party from seeing or front-running the result."
      },
      {
        question: "Which function correctly generates an encrypted random `uint32` in FHEVM?",
        options: ["A) `FHE.random(32)`", "B) `FHE.randEuint32()`", "C) `FHE.randomEuint32()`", "D) `FHE.rand(uint32)`"],
        correct: 1,
        explanation: "The correct function is `FHE.randEuintX()` where X is the bit width. The name uses `rand`, not `random`."
      },
      {
        question: "How do you generate an encrypted random number in the range `[0, 100)`?",
        options: ["A) `FHE.randEuint32(100)`", "B) `FHE.rem(FHE.randEuint32(), 100)`", "C) `FHE.randRange(0, 100)`", "D) `FHE.randEuint32() % 100`"],
        correct: 1,
        explanation: "Generate a full-range random value and then use `FHE.rem()` to constrain it. The Solidity `%` operator cannot be used because the value is encrypted."
      },
      {
        question: "After generating a random encrypted value, what must you do before storing or using it?",
        options: ["A) Nothing, it is automatically available to everyone", "B) Set ACL permissions with `FHE.allowThis()` and/or `FHE.allow()`", "C) Call a decrypt function to validate it", "D) Send a separate transaction to finalize the randomness"],
        correct: 1,
        explanation: "Like all encrypted values, freshly generated random values need ACL permissions."
      },
      {
        question: "Can the contract owner see the generated random value?",
        options: ["A) Yes, the owner always has access to all encrypted values", "B) No, the value is encrypted and requires explicit ACL permission like any other user", "C) Yes, through a special admin override function in the FHE library", "D) Only if the contract is deployed as an upgradeable proxy"],
        correct: 1,
        explanation: "FHEVM does not grant any special privileges to contract owners. Only addresses explicitly granted ACL access can decrypt."
      },
      {
        question: "How does the gas cost of encrypted random generation compare to other FHE operations?",
        options: ["A) It is free because randomness is provided by the network layer", "B) It costs the same as a simple `FHE.add()` operation", "C) It is relatively expensive because it involves FHE computation on the coprocessor", "D) It costs less gas than any arithmetic FHE operation"],
        correct: 2,
        explanation: "Random generation involves FHE computation on the coprocessor and is significantly more expensive than standard EVM operations."
      },
      {
        question: "What does `FHE.randEbool()` return?",
        options: ["A) A plaintext Solidity `bool` that is either `true` or `false`", "B) An encrypted boolean (`ebool`) with an encrypted random true/false value", "C) A `uint8` value of 0 or 1", "D) An encrypted `euint8` value of 0 or 1"],
        correct: 1,
        explanation: "`FHE.randEbool()` directly returns an `ebool` type containing an encrypted random boolean."
      },
      {
        question: "Why is `block.prevrandao` NOT secure for high-stakes applications like lotteries?",
        options: ["A) It only produces 8-bit values which are too small", "B) Block proposers can influence or predict the value, and it is publicly visible before use", "C) It is deprecated and no longer available after the Ethereum merge", "D) It requires an external oracle to function properly"],
        correct: 1,
        explanation: "Block proposers have some influence over prevrandao, and the value is publicly visible, allowing front-running."
      },
      {
        question: "When using `FHE.rem(FHE.randEuint32(), max)` for range-bounded randomness, what is \"modulo bias\"?",
        options: ["A) The FHE operation always returns zero", "B) Values near the lower end of the range are slightly more probable when `max` does not evenly divide the type's full range", "C) The random number generator produces negative numbers", "D) The modulo operation leaks the plaintext value"],
        correct: 1,
        explanation: "When max does not evenly divide the full range, some remainders are slightly more likely. For 32-bit sources with small max values, this bias is negligible."
      },
      {
        question: "What is the best practice for selecting a random winner in an encrypted lottery contract with `N` participants?",
        options: ["A) Use `block.prevrandao % N` to pick a winner index", "B) Generate a `FHE.randEuint32()`, use `FHE.rem()` with `N` to get an encrypted index, and keep the winner encrypted until the reveal phase", "C) Have each participant submit a random number and XOR them together", "D) Use an off-chain random oracle and submit the result on-chain"],
        correct: 1,
        explanation: "This approach ensures the random value cannot be predicted or manipulated, and the winner remains hidden until explicitly revealed."
      }
    ]
  },
  "10": {
    title: "Module 10: Frontend Integration",
    questions: [
      {
        question: "What library is used to encrypt inputs on the frontend for FHEVM?",
        options: ["A) `@fhevm/solidity`", "B) Relayer SDK (`@zama-fhe/relayer-sdk`)", "C) `ethers.js`", "D) `web3-fhe`"],
        correct: 1,
        explanation: "The Relayer SDK (`@zama-fhe/relayer-sdk`) is the official JavaScript/TypeScript library for interacting with FHEVM from the browser."
      },
      {
        question: "What type does a contract parameter use to receive encrypted data from the frontend?",
        options: ["A) `euint32`", "B) `bytes32`", "C) `externalEuint32`", "D) `uint256`"],
        correct: 2,
        explanation: "External types like `externalEuint32` represent encrypted data crossing the contract boundary from off-chain."
      },
      {
        question: "How do you convert an `externalEuint32` to a usable `euint32` inside a contract?",
        options: ["A) `FHE.decrypt(externalVal)`", "B) `FHE.asEuint32(externalVal)`", "C) `FHE.fromExternal(externalVal, proof)`", "D) `euint32(externalVal)`"],
        correct: 2,
        explanation: "`FHE.fromExternal(val, proof)` converts external encrypted types to internal encrypted types."
      },
      {
        question: "Why must `createEncryptedInput()` receive both the contract address and user address?",
        options: ["A) To determine the gas price", "B) To select the correct FHE scheme", "C) To prevent replay attacks by binding the input to a specific context", "D) To automatically set the ACL permissions"],
        correct: 2,
        explanation: "Binding the encrypted input to a specific contract and user prevents the encrypted bytes from being replayed in a different context."
      },
      {
        question: "What is the purpose of the EIP-712 signature during decryption?",
        options: ["A) To pay the gas fee for decryption", "B) To encrypt the data for the user", "C) To prove the user has ACL access to the ciphertext", "D) To register the user on the gateway"],
        correct: 2,
        explanation: "The EIP-712 signature proves to the gateway that the requesting user has been granted ACL access."
      },
      {
        question: "What does the gateway do during the decryption process?",
        options: ["A) Decrypts the ciphertext and returns the plaintext directly", "B) Re-encrypts the ciphertext with the user's temporary public key", "C) Sends the FHE private key to the user", "D) Stores the plaintext in a database"],
        correct: 1,
        explanation: "The gateway re-encrypts the value with the user's temporary public key, so only the user can decrypt it locally."
      },
      {
        question: "How should the FHE instance be managed in a React application?",
        options: ["A) Create a new instance for every transaction", "B) Create once per page load and reuse (singleton pattern)", "C) Create one per React component", "D) It does not need initialization"],
        correct: 1,
        explanation: "The FHE instance fetches the network's public key during creation. It should be initialized once and reused."
      },
      {
        question: "Which method encrypts a 32-bit unsigned integer on the frontend?",
        options: ["A) `input.encrypt32(value)`", "B) `input.addUint32(value)`", "C) `input.add32(value)`", "D) `FHE.encrypt(value, 32)`"],
        correct: 2,
        explanation: "The Relayer SDK input object provides `add8()`, `add16()`, `add32()`, `add64()`, etc."
      },
      {
        question: "On the ABI level, how does an `externalEuint32` parameter appear?",
        options: ["A) `uint32`", "B) `uint256`", "C) `bytes32`", "D) `address`"],
        correct: 2,
        explanation: "External encrypted types are serialized as `bytes32` handles when crossing the ABI boundary."
      },
      {
        question: "Why should you invalidate cached decrypted values after a write transaction?",
        options: ["A) The cache takes up too much memory", "B) The encrypted handle changes after state updates, so cached values are stale", "C) The gateway requires a fresh signature every time", "D) Ethers.js does not support caching"],
        correct: 1,
        explanation: "After a transaction modifies encrypted state, the on-chain ciphertext handle changes, making previously cached decrypted values incorrect."
      }
    ]
  },
  "11": {
    title: "Module 11: Confidential ERC-20",
    questions: [
      {
        question: "Why must a confidential ERC-20 transfer NOT revert on insufficient balance?",
        options: ["A) Because FHE does not support reverts", "B) Because reverting leaks information -- an attacker can binary-search the balance", "C) Because Solidity does not allow reverts in FHE functions", "D) Because gas is wasted on reverts"],
        correct: 1,
        explanation: "If transfers revert on failure, an observer can determine balance ranges by testing different amounts and seeing which ones succeed vs. revert."
      },
      {
        question: "What does a failed transfer do in the no-revert pattern?",
        options: ["A) Reverts with \"Insufficient balance\"", "B) Returns false", "C) Silently transfers 0 instead of the requested amount", "D) Transfers the entire balance instead"],
        correct: 2,
        explanation: "`FHE.select(hasEnough, amount, FHE.asEuint64(0))` picks 0 when the balance is insufficient."
      },
      {
        question: "Why does `balanceOf()` return `euint64` instead of `uint256` in a confidential ERC-20?",
        options: ["A) To save gas", "B) Because the balance is stored as an encrypted value, and only users with ACL access can decrypt it", "C) Because Solidity does not support uint256 with encryption", "D) Because uint256 is too large for FHE operations"],
        correct: 1,
        explanation: "Encrypted balances are stored as `euint64`. Only addresses with ACL access can decrypt the returned handle."
      },
      {
        question: "What type is used for encrypted balances?",
        options: ["A) `uint256`", "B) `euint256`", "C) `euint64`", "D) `bytes32`"],
        correct: 2,
        explanation: "`euint64` provides sufficient range while being gas-efficient."
      },
      {
        question: "Why are amounts omitted from Transfer events?",
        options: ["A) Solidity events cannot contain encrypted types", "B) To reduce gas costs", "C) Because including the amount would leak the transfer value to anyone watching events", "D) Because the ERC-20 standard does not require amounts in events"],
        correct: 2,
        explanation: "Events are publicly visible on-chain. Including the transfer amount would defeat the purpose of encrypting it."
      },
      {
        question: "In `transferFrom`, how are the allowance check and balance check combined?",
        options: ["A) `FHE.or(hasAllowance, hasBalance)`", "B) `FHE.and(hasAllowance, hasBalance)`", "C) `FHE.select(hasAllowance, hasBalance, FHE.asEbool(false))`", "D) `hasAllowance && hasBalance`"],
        correct: 1,
        explanation: "Both conditions must be true. `FHE.and()` combines two `ebool` values with an encrypted AND operation."
      },
      {
        question: "After updating a balance, which ACL calls are required?",
        options: ["A) Only `FHE.allowThis()`", "B) Only `FHE.allow(balance, owner)`", "C) Both `FHE.allowThis()` and `FHE.allow(balance, owner)`", "D) No ACL calls are needed"],
        correct: 2,
        explanation: "The contract needs access for future operations (allowThis), and the owner needs access to decrypt their balance (allow)."
      },
      {
        question: "How does the frontend send an encrypted transfer amount?",
        options: ["A) `contract.transfer(to, amount)` with plaintext", "B) Encrypt with `input.add64(amount)`, then pass the encrypted bytes to `contract.transfer(to, encrypted)`", "C) `contract.transfer(to, FHE.encrypt(amount))`", "D) The contract encrypts it automatically"],
        correct: 1,
        explanation: "The frontend encrypts the amount client-side using the Relayer SDK, then passes the encrypted bytes as the `externalEuint64` parameter."
      },
      {
        question: "What happens inside the contract when it receives an `externalEuint64`?",
        options: ["A) It is automatically converted to `euint64`", "B) It must be converted using `FHE.fromExternal()` before use", "C) It must be decrypted first", "D) It can be used directly with FHE operations"],
        correct: 1,
        explanation: "External types must be explicitly converted to internal types using `FHE.fromExternal()` before use."
      },
      {
        question: "What is the purpose of `_initBalance()` being called in `_transfer`?",
        options: ["A) To check if the user exists", "B) To initialize a zero-encrypted balance for addresses that have never interacted with the contract", "C) To reset the balance to zero", "D) To revoke previous ACL permissions"],
        correct: 1,
        explanation: "Addresses that have never received tokens need a zero-encrypted balance with proper ACL so FHE operations can be performed."
      }
    ]
  },
  "12": {
    title: "Module 12: Confidential Voting",
    questions: [
      {
        question: "Why is `FHE.select()` used instead of an if/else branch for counting votes?",
        options: ["A) If/else is not valid Solidity syntax", "B) If/else would require decrypting the vote, which leaks the voter's choice", "C) FHE.select() is faster than if/else", "D) If/else cannot work with euint32"],
        correct: 1,
        explanation: "Branching on encrypted data would require decryption. FHE.select() performs the conditional logic entirely on encrypted values."
      },
      {
        question: "What happens to both tallies on every vote?",
        options: ["A) Only the chosen tally is incremented", "B) Both tallies are always updated -- the chosen one by 1 and the other by 0", "C) The chosen tally is incremented and the other is decremented", "D) Both tallies are incremented by 1"],
        correct: 1,
        explanation: "Both FHE.add() calls execute on every vote. The encrypted increment is 1 for the chosen option and 0 for the other."
      },
      {
        question: "Why is voter participation tracked in a plaintext mapping?",
        options: ["A) FHE cannot store booleans", "B) The contract needs a definitive (non-encrypted) answer to prevent double voting", "C) To save gas", "D) Because the mapping is private, it is already hidden"],
        correct: 1,
        explanation: "A `require` statement needs a plaintext boolean. We accept that \"who voted\" is public while keeping \"how they voted\" private."
      },
      {
        question: "Why does the contract use `externalEuint8` for the vote input instead of `externalEbool`?",
        options: ["A) `externalEbool` does not exist in FHEVM", "B) `euint8` is more flexible -- it supports multi-option voting (0, 1, 2, ...) without changing the function signature", "C) `ebool` cannot be used with `FHE.select()`", "D) `euint8` uses less gas than `ebool`"],
        correct: 1,
        explanation: "Using `euint8` allows the same function signature to support yes/no and multi-option voting without modification."
      },
      {
        question: "What privacy guarantee does encrypted voting provide regarding partial results?",
        options: ["A) Partial results are visible to the owner", "B) Partial results are visible after 50% of votes are in", "C) Partial results are never visible -- tallies remain encrypted until reveal", "D) Partial results are visible but encrypted"],
        correct: 2,
        explanation: "Tallies are `euint32` with ACL granted only to the contract during voting. Nobody can decrypt the running totals."
      },
      {
        question: "How does the frontend encrypt a vote?",
        options: ["A) `input.add64(1)` for Yes, `input.add64(0)` for No", "B) `input.addBool(true)` for Yes, `input.addBool(false)` for No", "C) `input.add8(1)` for Yes, `input.add8(0)` for No", "D) The contract encrypts the vote automatically"],
        correct: 2,
        explanation: "The vote parameter is `externalEuint8`, so the frontend uses `input.add8()` with 1 for yes and 0 for no."
      },
      {
        question: "What information does the `VoteCast` event reveal?",
        options: ["A) The voter's address and their vote choice", "B) Only the proposal ID and the voter's address", "C) The voter's address, vote choice, and current tallies", "D) Nothing -- the event is encrypted"],
        correct: 1,
        explanation: "The event contains `proposalId` and `voter` address. The vote choice is encrypted and not included."
      },
      {
        question: "For a multi-option vote with 4 options, how many `FHE.add()` calls happen per vote?",
        options: ["A) 1", "B) 2", "C) 4", "D) 8"],
        correct: 2,
        explanation: "Each of the 4 option tallies is updated with FHE.add(). The increment is 1 for the chosen option and 0 for the other three."
      },
      {
        question: "What prevents anyone from decrypting tallies during the voting period?",
        options: ["A) A time-locked smart contract", "B) The tallies only have `FHE.allowThis()` -- no external address has ACL access", "C) The gateway refuses decryption requests during voting", "D) The tallies are stored in a different contract"],
        correct: 1,
        explanation: "Only FHE.allowThis() is called for tallies during voting. No external address has ACL access."
      },
      {
        question: "How does the contract determine if an encrypted vote is \"yes\"?",
        options: ["A) It decrypts the vote and checks the value", "B) It uses `FHE.eq(voteValue, FHE.asEuint8(1))` to produce an encrypted boolean", "C) It checks `voteValue == 1` in plaintext", "D) It uses `FHE.gt(voteValue, FHE.asEuint8(0))`"],
        correct: 1,
        explanation: "The contract compares the encrypted vote value against encrypted 1 using FHE.eq(), producing an ebool used with FHE.select()."
      }
    ]
  },
  "13": {
    title: "Module 13: Sealed-Bid Auction",
    questions: [
      {
        question: "What FHE operation is used to compare two encrypted bids?",
        options: ["A) `FHE.eq(bidA, bidB)`", "B) `FHE.gt(bidA, bidB)`", "C) `FHE.max(bidA, bidB)`", "D) `FHE.sub(bidA, bidB)`"],
        correct: 1,
        explanation: "`FHE.gt()` returns an `ebool` indicating whether bidA is greater than bidB."
      },
      {
        question: "Why does the auction use `FHE.select()` instead of directly assigning the new bid as highest?",
        options: ["A) Because `FHE.select()` is more gas efficient", "B) Because we do not know if the new bid is actually higher -- the selection is based on an encrypted comparison", "C) Because direct assignment is not supported for euint64", "D) Because `FHE.select()` automatically handles ACL"],
        correct: 1,
        explanation: "The comparison result is an ebool. We cannot branch on it, so FHE.select() picks the correct value."
      },
      {
        question: "What type is used to store the highest bidder's address in encrypted form?",
        options: ["A) `address`", "B) `bytes32`", "C) `eaddress`", "D) `euint160`"],
        correct: 2,
        explanation: "`eaddress` is the encrypted address type in FHEVM."
      },
      {
        question: "Why must bidders send an ETH deposit with their bid?",
        options: ["A) To pay for FHE computation gas", "B) To ensure the winner can actually pay for the item they bid on", "C) To fund the gateway decryption", "D) To prevent spam (gas alone is sufficient)"],
        correct: 1,
        explanation: "Without a deposit, a bidder could submit an astronomically high encrypted bid without having the funds to back it up."
      },
      {
        question: "What advantage does FHE sealed-bid have over commit-reveal auctions?",
        options: ["A) Lower gas costs", "B) No reveal phase needed -- bids are compared while still encrypted", "C) Better Solidity compatibility", "D) Faster finalization"],
        correct: 1,
        explanation: "FHE auctions compare bids on-chain without ever revealing them. No reveal phase and no griefing by non-revealing bidders."
      },
      {
        question: "What happens if two bids are exactly equal when using `FHE.gt()`?",
        options: ["A) The transaction reverts", "B) Both bidders become co-winners", "C) The earlier bidder keeps the lead because `FHE.gt()` returns false for equal values", "D) The later bidder takes the lead"],
        correct: 2,
        explanation: "`FHE.gt()` returns false when values are equal. Since the condition is false, FHE.select() keeps the existing highest bidder."
      },
      {
        question: "Why is each bidder limited to one bid per auction?",
        options: ["A) To simplify the contract", "B) Allowing updates would reveal through timing that a bidder changed their mind, leaking information", "C) Because FHE cannot overwrite encrypted values", "D) Because Ethereum limits transactions per address"],
        correct: 1,
        explanation: "If a bidder updates their bid, the transaction itself reveals that they changed their strategy."
      },
      {
        question: "What information is publicly visible during the bidding phase?",
        options: ["A) All bid amounts", "B) The current highest bid", "C) Only that an address bid and how much ETH they deposited", "D) Nothing at all"],
        correct: 2,
        explanation: "The transaction and ETH transfer are visible. The encrypted bid amount and the current highest bid remain private."
      },
      {
        question: "How does `endAuction()` reveal the winner in this contract?",
        options: ["A) The owner decrypts via the Gateway and submits the plaintext back on-chain", "B) The owner calls `FHE.allow()` and then re-encrypts the result", "C) `FHE.makePubliclyDecryptable()` is called on the highest bid and bidder, making them publicly readable", "D) The winner must call a `reveal()` function themselves"],
        correct: 2,
        explanation: "The contract calls FHE.makePubliclyDecryptable() on both _highestBid and _highestBidder."
      },
      {
        question: "How does the `bid()` function convert the encrypted input from the frontend?",
        options: ["A) `FHE.fromExternal(encBid, msg.sender, proof)` -- 3 parameters", "B) `FHE.fromExternal(encBid, proof)` -- 2 parameters", "C) `FHE.decrypt(encBid)` -- 1 parameter", "D) `FHE.asEuint64(encBid)` -- 1 parameter"],
        correct: 1,
        explanation: "`FHE.fromExternal()` takes exactly 2 parameters: the external encrypted value and the proof."
      }
    ]
  },
  "14": {
    title: "Module 14: Testing & Debugging",
    questions: [
      {
        question: "What is the correct way to create an encrypted input for a test transaction?",
        options: ["A) `fhevm.encrypt(contractAddress, value)`", "B) `fhevm.createEncryptedInput(contractAddress, signer.address).add64(value).encrypt()`", "C) `FHE.encrypt(value)` called from the test file", "D) `ethers.utils.encrypt(value, contractAddress)`"],
        correct: 1,
        explanation: "`fhevm.createEncryptedInput()` takes the contract address and signer address, then you chain add methods and encrypt()."
      },
      {
        question: "Why must you use `equal(42n)` instead of `equal(42)` when asserting decrypted values?",
        options: ["A) Because Solidity uses unsigned integers", "B) Because `fhevm.userDecryptEuint()` returns a BigInt, and BigInt comparisons require the `n` suffix", "C) Because the `n` suffix adds error tolerance", "D) Because Hardhat requires BigInt for all numeric comparisons"],
        correct: 1,
        explanation: "Values decrypted from FHE handles are JavaScript BigInts. Comparing a BigInt with a regular number using Chai's equal() will fail."
      },
      {
        question: "What happens when an FHE contract uses `FHE.select(hasEnough, amount, FHE.asEuint64(0))` and `hasEnough` is false?",
        options: ["A) The transaction reverts with \"Insufficient balance\"", "B) The function returns an error code", "C) The selected value is `FHE.asEuint64(0)`, so the operation proceeds with 0 -- no revert occurs", "D) The EVM throws an out-of-gas exception"],
        correct: 2,
        explanation: "When the condition is false, FHE.select() picks the third argument (0). The transaction succeeds but effectively does nothing. This is \"silent failure\" by design."
      },
      {
        question: "How do you verify that a \"failed\" encrypted operation was handled correctly in a test?",
        options: ["A) Use `expect(tx).to.be.revertedWith(\"Insufficient balance\")`", "B) Check that the transaction receipt contains an error event", "C) Decrypt the balance after the operation and verify it is unchanged", "D) Use `expect(tx).to.emit(contract, \"Error\")`"],
        correct: 2,
        explanation: "Since FHE contracts do not revert on encrypted condition failures, you must decrypt the state and verify it equals the state before the operation."
      },
      {
        question: "What is the primary debugging tool for FHE contracts?",
        options: ["A) Hardhat's built-in debugger", "B) Remix IDE's step-through debugger", "C) Events emitted by the contract with plaintext metadata", "D) The FHE.decrypt() function called inside the contract"],
        correct: 2,
        explanation: "Events can emit plaintext data like addresses, counters, and indices that help trace execution without revealing encrypted values."
      },
      {
        question: "What happens if you pass `alice.address` to `createEncryptedInput()` but call the contract with `bob` as the signer?",
        options: ["A) The input is automatically re-encrypted for Bob", "B) The proof verification fails because the encrypted input is bound to Alice's address", "C) The operation succeeds but the value is decrypted incorrectly", "D) Nothing -- the addresses are only used for logging"],
        correct: 1,
        explanation: "Encrypted inputs are cryptographically bound to a specific contract address and signer address. Mismatched addresses cause proof failure."
      },
      {
        question: "Which of the following is the correct way to decrypt an `euint64` value in a test?",
        options: ["A) `await fhevm.decrypt(handle)`", "B) `await fhevm.userDecryptEuint(FhevmType.euint64, handle, contractAddress, signer)`", "C) `await contract.decrypt(handle)`", "D) `await fhevm.userDecryptEuint(handle, contractAddress)`"],
        correct: 1,
        explanation: "`fhevm.userDecryptEuint()` requires four arguments: the FhevmType enum, the handle, the contract address, and the signer."
      },
      {
        question: "Why do FHE contracts use the select pattern instead of `require()` for encrypted conditions?",
        options: ["A) Because `FHE.select()` uses less gas", "B) Because `require()` cannot evaluate an `ebool` -- encrypted booleans are not native Solidity bools", "C) Because `FHE.select()` is more secure", "D) Because Hardhat does not support `require()` in FHE mode"],
        correct: 1,
        explanation: "`require()` expects a native Solidity `bool`. An `ebool` is an encrypted type that the EVM cannot read."
      },
      {
        question: "When testing ACL permissions, how do you verify that user B cannot access user A's encrypted balance?",
        options: ["A) Call `contract.hasPermission(bob, handle)` and check it returns false", "B) Attempt to decrypt the handle as Bob and expect the decryption to fail", "C) Check that `FHE.allow()` was not called for Bob by reading contract storage", "D) ACL cannot be tested in the mock environment"],
        correct: 1,
        explanation: "The most direct way is to attempt decryption as an unauthorized user and expect it to fail."
      },
      {
        question: "What is the purpose of adding plaintext counters (like `depositCount`) to an FHE contract?",
        options: ["A) They are required by the FHE runtime", "B) They allow gas estimation for encrypted operations", "C) They provide instantly readable state that tests can verify without the encrypt/decrypt cycle", "D) They replace events for debugging"],
        correct: 2,
        explanation: "Plaintext counters can be read with a simple view call, which is much faster than the full encrypt-act-decrypt-assert cycle."
      }
    ]
  },
  "15": {
    title: "Module 15: Gas Optimization for FHE",
    questions: [
      {
        question: "Which FHE arithmetic operation is the most gas-expensive for the same type size?",
        options: ["A) `FHE.add()`", "B) `FHE.sub()`", "C) `FHE.mul()`", "D) `FHE.div()` (plaintext divisor)"],
        correct: 2,
        explanation: "Multiplication is approximately 2x the cost of addition or division across all type sizes."
      },
      {
        question: "How much cheaper is `FHE.add(encryptedValue, 10)` compared to `FHE.add(encryptedValue, FHE.asEuint32(10))`?",
        options: ["A) They cost the same", "B) About 15-35% cheaper", "C) About 2x cheaper", "D) About 10x cheaper"],
        correct: 1,
        explanation: "Plaintext operands allow the FHE coprocessor to optimize the computation, saving roughly 25-35% plus the eliminated cast cost."
      },
      {
        question: "You need to store a user's age (0-150). Which encrypted type should you choose for gas efficiency?",
        options: ["A) `euint256`", "B) `euint64`", "C) `euint32`", "D) `euint8`"],
        correct: 3,
        explanation: "Age fits within 0-255 (8 bits). Using `euint8` gives the cheapest operations, roughly 40-60% cheaper than euint64."
      },
      {
        question: "You have a function that computes the same encrypted tax rate from two encrypted components every time it is called. The components change once per month. What should you do?",
        options: ["A) Nothing -- the recomputation cost is negligible", "B) Use lazy evaluation to defer the computation", "C) Cache the tax rate in a state variable and recompute only when components change", "D) Use a larger type to compute it faster"],
        correct: 2,
        explanation: "Since the components change rarely, caching the intermediate result avoids recomputing it on every call."
      },
      {
        question: "What is the primary benefit of batch processing in FHE contracts?",
        options: ["A) It makes individual FHE operations cheaper", "B) It amortizes transaction overhead (base 21k gas) across multiple operations", "C) It enables parallel execution of FHE operations", "D) It allows the use of smaller types"],
        correct: 1,
        explanation: "Each Ethereum transaction has a base cost of 21,000 gas. Combining operations into one transaction saves multiple sets of this overhead."
      },
      {
        question: "Which of these is an anti-pattern in FHE contracts?",
        options: ["A) Using `require(msg.sender == owner)` for access control", "B) Using `FHE.add(balance, amount)` with a plaintext `amount`", "C) Encrypting publicly known values like `msg.sender` and `owner` for access control checks", "D) Caching intermediate encrypted results in state variables"],
        correct: 2,
        explanation: "Encrypting publicly known values is wasteful. A simple `require(msg.sender == owner)` achieves the same result at negligible gas cost."
      },
      {
        question: "In a confidential ERC-20 transfer, which of these values genuinely needs to be encrypted?",
        options: ["A) The sender address", "B) The recipient address", "C) The token balance", "D) The block timestamp"],
        correct: 2,
        explanation: "Addresses and timestamps are public on-chain. Only the balance and transfer amount need encryption."
      },
      {
        question: "You have this code: `FHE.select(FHE.gt(a, b), a, b)`. What is a more gas-efficient replacement?",
        options: ["A) `FHE.min(a, b)`", "B) `FHE.max(a, b)`", "C) `FHE.eq(a, b)`", "D) There is no better alternative"],
        correct: 1,
        explanation: "`FHE.select(FHE.gt(a, b), a, b)` is exactly `max(a, b)`. The built-in `FHE.max` replaces a comparison + select with a single operation."
      },
      {
        question: "A function updates a value 10 times before anyone reads the result. Each update involves an `FHE.mul()`. How can lazy evaluation help?",
        options: ["A) It cannot help in this scenario", "B) It defers all 10 multiplications and executes them together", "C) It only performs the multiplication when the result is read, so only the final value's computation executes", "D) It replaces multiplication with addition"],
        correct: 2,
        explanation: "With lazy evaluation, each of the first 9 updates simply overwrites the stored base value (cheap). Only when the result is needed does the expensive multiplication execute."
      },
      {
        question: "You are profiling gas in Hardhat tests. Which approach correctly measures the gas used by a function call?",
        options: ["A) `const gas = await contract.estimateGas.myFunction(args)`", "B) Send the transaction, wait for the receipt, then read `receipt.gasUsed`", "C) `console.log(tx.gasLimit)`", "D) `const gas = ethers.utils.formatEther(tx.value)`"],
        correct: 1,
        explanation: "Send the transaction, wait for the receipt, then read `receipt.gasUsed`. This gives the actual gas consumed."
      }
    ]
  },
  "16": {
    title: "Module 16: Security Best Practices",
    questions: [
      {
        question: "Why is branching on an encrypted condition (if/else) dangerous in FHE contracts?",
        options: ["A) It causes the transaction to revert", "B) It reveals the encrypted condition through gas consumption differences", "C) FHE does not support boolean values", "D) It corrupts the ciphertext"],
        correct: 1,
        explanation: "Different branches execute different numbers of FHE operations, consuming different amounts of gas. An observer can infer the encrypted condition by watching gas usage."
      },
      {
        question: "What is the correct way to handle a conditional transfer when the sender may have insufficient encrypted balance?",
        options: ["A) `require(FHE.decrypt(hasBalance), \"Insufficient balance\");`", "B) `if (hasBalance) { transfer(); } else { revert(); }`", "C) `euint64 actual = FHE.select(hasBalance, amount, FHE.asEuint64(0));` followed by unconditional balance updates", "D) Decrypt the balance first, check in plaintext, then transfer"],
        correct: 2,
        explanation: "`FHE.select()` provides uniform gas execution. Both paths are computed and the result is selected based on the encrypted condition."
      },
      {
        question: "After computing `newBalance = FHE.add(_balances[user], amount)`, what ACL calls are required?",
        options: ["A) None -- ACL is inherited from the operands", "B) Only `FHE.allowThis(newBalance)`", "C) Only `FHE.allow(newBalance, user)`", "D) Both `FHE.allowThis(newBalance)` and `FHE.allow(newBalance, user)`"],
        correct: 3,
        explanation: "Every FHE operation creates a new handle with an empty ACL. The contract needs allowThis and the user needs allow."
      },
      {
        question: "What does `FHE.isInitialized(handle)` check?",
        options: ["A) Whether the ciphertext has been decrypted", "B) Whether the handle refers to a valid, initialized ciphertext", "C) Whether the ACL for the handle has been set", "D) Whether the handle has been made publicly decryptable"],
        correct: 1,
        explanation: "FHE.isInitialized() checks that the handle points to a valid ciphertext."
      },
      {
        question: "A function performs FHE operations inside a loop with no cap on the iteration count. What vulnerability does this create?",
        options: ["A) Integer overflow", "B) Reentrancy attack", "C) Denial of Service (DoS) via block gas limit exhaustion", "D) Front-running attack"],
        correct: 2,
        explanation: "Each FHE operation costs 50k-600k gas. Without a cap, an attacker can cause the transaction to exceed the block gas limit."
      },
      {
        question: "What is the \"LastError\" pattern in FHE contracts?",
        options: ["A) A require statement that reverts with an encrypted error message", "B) An encrypted error code stored per user, decryptable only by that user, set via FHE.select() instead of reverting", "C) A public mapping of error strings", "D) An event that emits the decrypted error reason"],
        correct: 1,
        explanation: "The LastError pattern stores an encrypted error code (euint8) per user, set using FHE.select() so the transaction always succeeds."
      },
      {
        question: "Why is `require(encryptedCondition, \"error\")` dangerous in FHE contracts?",
        options: ["A) It wastes gas", "B) The revert vs. success outcome reveals whether the encrypted condition was true or false", "C) `require` does not work with FHE types", "D) It breaks the ACL system"],
        correct: 1,
        explanation: "Transaction revert/success is publicly visible. If the revert depends on an encrypted condition, observers learn the condition's value."
      },
      {
        question: "When is it safe to use `FHE.makePubliclyDecryptable(handle)`?",
        options: ["A) On any encrypted value the owner wants to see", "B) On individual user balances for transparency", "C) Only on aggregate or non-sensitive values meant to become public (e.g., vote tallies, auction results)", "D) Whenever the user requests it"],
        correct: 2,
        explanation: "makePubliclyDecryptable is irreversible. It should only be used for aggregate results or values explicitly designed to be public."
      },
      {
        question: "Which of the following is a valid rate-limiting pattern for expensive FHE operations?",
        options: ["A) `require(gasleft() > 1000000, \"Not enough gas\");`", "B) Track the last operation block per user and enforce a cooldown period before the next operation", "C) Limit the contract to one transaction per block", "D) Use `FHE.select()` to skip expensive operations"],
        correct: 1,
        explanation: "Tracking `_lastOpBlock[msg.sender]` and requiring a cooldown period is the standard rate-limiting pattern."
      },
      {
        question: "You are auditing an FHE contract with a `getBalance()` function that returns `_balances[user]` without any ACL check. What security issue does this have?",
        options: ["A) No issue -- the value is encrypted so it is safe to return", "B) It should use `FHE.isSenderAllowed()` to verify the caller has ACL access before returning the handle", "C) It should decrypt the balance before returning", "D) The function should be `external` instead of `public`"],
        correct: 1,
        explanation: "Defense-in-depth requires ACL checks on handle access. The function should check FHE.isSenderAllowed() before returning."
      }
    ]
  },
  "17": {
    title: "Module 17: Advanced FHE Design Patterns",
    questions: [
      {
        question: "In the Encrypted State Machine pattern, why is the state enum stored in plaintext while the threshold is encrypted?",
        options: ["A) Because enums cannot be encrypted in FHE", "B) Because users need to know which state the machine is in to interact correctly, but the transition condition should stay private", "C) Because plaintext state is cheaper and there is no security benefit to encrypting it", "D) Because the compiler requires enum values to be plaintext"],
        correct: 1,
        explanation: "The state is public so users know what actions are available. The threshold that triggers the transition is private."
      },
      {
        question: "What is the main problem that the LastError pattern solves?",
        options: ["A) FHE operations are too slow and need caching", "B) Traditional Solidity `require()` statements leak information about encrypted conditions, but silently doing nothing gives users no feedback", "C) Error codes are needed for Solidity event logging", "D) FHE does not support try-catch blocks"],
        correct: 1,
        explanation: "We cannot revert based on encrypted conditions (that leaks info), but silently doing nothing gives no feedback. LastError stores encrypted error codes."
      },
      {
        question: "In the LastError pattern, what determines the priority of error codes when multiple errors apply?",
        options: ["A) The error with the lowest numeric code always wins", "B) Error codes are ORed together", "C) The order of `FHE.select()` calls determines priority -- later selects override earlier ones", "D) The first error detected always wins"],
        correct: 2,
        explanation: "Each FHE.select() conditionally overwrites the error code. The last select in the chain has the highest priority."
      },
      {
        question: "In the Encrypted Registry, why is the `_hasKey` mapping stored in plaintext?",
        options: ["A) Because mappings cannot hold encrypted booleans", "B) To enable cheap existence checks without FHE gas costs, accepting that key existence is public metadata", "C) Because `ebool` is not supported in mappings", "D) It is a bug -- it should be encrypted"],
        correct: 1,
        explanation: "Storing key existence in plaintext is a deliberate design choice for cheap existence checks. The trade-off is that key existence is public."
      },
      {
        question: "What happens to ACL permissions when a contract computes a new encrypted value from an existing handle?",
        options: ["A) The new value inherits all ACL permissions from the input handle", "B) The new value has NO permissions -- you must explicitly set them with `FHE.allow()` and `FHE.allowThis()`", "C) The new value is automatically allowed for all addresses", "D) Only the contract that created it has access"],
        correct: 1,
        explanation: "Every FHE operation produces a new handle with an empty ACL. Derived values should not automatically inherit permissions."
      },
      {
        question: "When implementing cross-contract composability, who must call `FHE.allow(handle, otherContract)`?",
        options: ["A) The other contract (Contract B)", "B) The contract owner", "C) An address that already has ACL access to the handle -- typically the user who owns the data", "D) The FHE gateway"],
        correct: 2,
        explanation: "ACL grants can only be issued by an address that already has permission on the handle."
      },
      {
        question: "Why should loops containing FHE operations always be bounded?",
        options: ["A) Because Solidity does not support infinite loops", "B) Because each FHE operation costs 200k-500k gas, so an unbounded loop can easily exceed the block gas limit", "C) Because FHE operations are asynchronous and cannot be batched", "D) Because the FHE library limits the number of operations per transaction"],
        correct: 1,
        explanation: "FHE operations are 10-100x more expensive than plaintext operations. A loop of 50 additions would cost 10M gas."
      },
      {
        question: "In the time-locked encryption pattern, what prevents early decryption of the secret value?",
        options: ["A) The FHE system enforces a time lock on the ciphertext", "B) A plaintext `require(block.timestamp >= revealTime)` guard on the `reveal()` function that calls `makePubliclyDecryptable()`", "C) The encryption key is time-dependent", "D) The value is re-encrypted each block until the unlock time"],
        correct: 1,
        explanation: "The time lock is enforced at the Solidity level with a require check before calling FHE.makePubliclyDecryptable()."
      },
      {
        question: "What is the correct approach when you need to transfer encrypted data between two contracts?",
        options: ["A) Serialize the ciphertext and pass it as bytes", "B) Use a shared storage contract that both can access", "C) The user grants Contract B ACL access to their data in Contract A, then Contract B reads it via Contract A's view function", "D) Re-encrypt the data using Contract B's key"],
        correct: 2,
        explanation: "Cross-contract encrypted data flow works through the ACL system. The user grants Contract B permission, then Contract B reads through Contract A's view function."
      },
      {
        question: "You are building a private auction with bids encrypted, highest bid tracked, and bids revealed after a deadline. Which combination of patterns would you use?",
        options: ["A) LastError + Encrypted Registry", "B) Encrypted State Machine + Time-Locked Values + Cross-Contract Composability", "C) Only the Encrypted State Machine pattern", "D) Encrypted Batch Processing + LastError"],
        correct: 1,
        explanation: "The auction uses a State Machine (BIDDING->REVEALING->SETTLED), Time-Locked Values (reveal after deadline), and Cross-Contract Composability (token balance verification)."
      }
    ]
  },
  "18": {
    title: "Module 18: Confidential DeFi",
    questions: [
      {
        question: "In the ConfidentialLending contract, how is the 50% LTV (Loan-to-Value) check implemented?",
        options: ["A) `require(borrowAmount <= collateral / 2, \"Over limit\")`", "B) `FHE.le(newBorrowBalance, FHE.div(collateral, 2))` with `FHE.select()` to conditionally update the balance", "C) `FHE.gt(collateral, FHE.mul(borrowAmount, 2))` with a revert on false", "D) The contract decrypts both values and compares them in plaintext"],
        correct: 1,
        explanation: "The comparison is done entirely on encrypted values using FHE.le(), which returns an ebool. FHE.select() picks between new or old balance."
      },
      {
        question: "Why does the lending contract use `FHE.select()` instead of `require()` for the borrow limit check?",
        options: ["A) Because `FHE.select()` is more gas efficient than `require()`", "B) Because `require()` cannot be used inside FHE functions", "C) Because reverting would leak information -- it reveals that the borrow exceeded the limit", "D) Because `FHE.select()` is the only way to update encrypted state"],
        correct: 2,
        explanation: "A revert reveals to observers that the borrow condition failed, which leaks information about the user's collateral level."
      },
      {
        question: "In the EncryptedOrderBook, what information is visible to a public observer when two orders are matched?",
        options: ["A) The fill price, fill amount, and whether the match succeeded", "B) Only that a match was attempted between two order IDs (prices and amounts remain encrypted)", "C) The exact prices of both orders but not the amounts", "D) Nothing at all -- the entire transaction is hidden"],
        correct: 1,
        explanation: "The function call and order IDs are public. However, the fill amount and whether the match actually filled remain encrypted."
      },
      {
        question: "How does `matchOrders()` handle incompatible prices (buy price < sell price)?",
        options: ["A) The transaction reverts with \"Prices incompatible\"", "B) The `actualFill` becomes `FHE.asEuint64(0)` via `FHE.select()`, and both order amounts remain unchanged", "C) The orders are automatically cancelled", "D) The sell price is adjusted to match the buy price"],
        correct: 1,
        explanation: "FHE.select() sets the actual fill to encrypted 0 when prices are incompatible. Subtracting 0 from both amounts leaves them unchanged."
      },
      {
        question: "Why does the ConfidentialLending contract use `FHE.min(repayAmount, borrowBalance)` in the repay function?",
        options: ["A) To find the minimum gas cost", "B) To cap the repayment to the actual borrow balance, preventing FHE subtraction underflow", "C) To calculate the interest rate", "D) To determine the collateral ratio"],
        correct: 1,
        explanation: "FHE.min() ensures the actual repayment never exceeds the borrow balance, preventing subtraction underflow."
      },
      {
        question: "How is interest accrued in the ConfidentialLending contract?",
        options: ["A) `interest = FHE.mul(borrowBalance, FHE.asEuint64(110)) / 100`", "B) `interest = FHE.div(borrowBalance, 10)` then `FHE.add(borrowBalance, interest)`", "C) The contract decrypts the balance, adds 10%, and re-encrypts", "D) Interest is tracked in a separate plaintext mapping"],
        correct: 1,
        explanation: "Interest is 10% of the borrow balance, calculated as borrowBalance / 10, then added to the borrow balance. All operations are on encrypted values."
      },
      {
        question: "What is the purpose of `MAX_ACTIVE_ORDERS = 50` in the EncryptedOrderBook?",
        options: ["A) To limit gas costs per transaction", "B) To prevent Denial-of-Service attacks from creating unbounded orders that bloat storage", "C) To ensure fair access for all traders", "D) To comply with regulatory requirements"],
        correct: 1,
        explanation: "Without a limit, an attacker could submit thousands of orders, filling up storage and making the contract expensive to interact with."
      },
      {
        question: "In the withdrawal function, why are two separate checks combined with `FHE.and()`?",
        options: ["A) To save gas by avoiding two `FHE.select()` calls", "B) To check both that the remaining collateral covers the borrow AND that the user has enough collateral to withdraw", "C) To verify the user's identity and balance simultaneously", "D) Because `FHE.select()` only accepts `ebool` from `FHE.and()`"],
        correct: 1,
        explanation: "Two conditions must both be true: remaining >= 2 * borrowBalance (LTV safety) and collateral >= withdrawAmount (no underflow)."
      },
      {
        question: "Which of the following CANNOT be kept private in an FHE-based DeFi protocol?",
        options: ["A) Borrow amounts", "B) Order prices", "C) The address of the user interacting with the protocol", "D) Collateral balances"],
        correct: 2,
        explanation: "`msg.sender` is always publicly visible on-chain. Amounts, prices, and balances can be encrypted, but addresses cannot."
      },
      {
        question: "What is the main challenge with implementing liquidation in a confidential lending protocol?",
        options: ["A) FHE does not support comparison operations", "B) Nobody can see collateral or borrow amounts, so traditional off-chain health monitoring is impossible", "C) Liquidation requires decrypting all user balances", "D) Interest cannot be calculated on encrypted values"],
        correct: 1,
        explanation: "With encrypted balances, off-chain monitoring is impossible. Solutions include keeper-based on-chain health checks or threshold-based decryption."
      }
    ]
  },
  "19": {
    title: "Module 19: Capstone -- Confidential DAO",
    questions: [
      {
        question: "What is the purpose of `grantDAOAccess()` in the GovernanceToken?",
        options: ["A) To transfer tokens to the DAO", "B) To allow the DAO contract to read the caller's encrypted token balance for vote weighting", "C) To register the user as a DAO member", "D) To approve token spending by the DAO"],
        correct: 1,
        explanation: "The DAO needs ACL access to read the voter's encrypted balance. grantDAOAccess() calls FHE.allow(_balances[msg.sender], daoAddress)."
      },
      {
        question: "How does weighted voting differ from the simple voting in Module 12?",
        options: ["A) It uses `euint128` instead of `euint64`", "B) Each vote adds the voter's token balance instead of 1", "C) It requires multiple transactions per vote", "D) The weight is always fixed at 100"],
        correct: 1,
        explanation: "In Module 12, each vote adds 1 to a tally. In the DAO, each vote adds the voter's encrypted token balance as the weight."
      },
      {
        question: "What is the correct `FHE.select()` pattern for weighted voting?",
        options: ["A) `FHE.select(voteYes, FHE.asEuint64(1), FHE.asEuint64(0))`", "B) `FHE.select(voteYes, weight, FHE.asEuint64(0))` for yes, `FHE.select(voteYes, FHE.asEuint64(0), weight)` for no", "C) `FHE.select(voteYes, weight, weight)`", "D) `FHE.mul(voteYes, weight)`"],
        correct: 1,
        explanation: "For Yes: yesWeight = select(true, weight, 0) = weight, noWeight = select(true, 0, weight) = 0. For No: the opposite."
      },
      {
        question: "Why must the user call `grantDAOAccess()` before voting?",
        options: ["A) To pay a registration fee", "B) Because `FHE.allow()` must be called by the balance owner to grant another contract ACL access to their encrypted balance", "C) To lock their tokens during voting", "D) Because the DAO cannot call functions on the token contract"],
        correct: 1,
        explanation: "ACL permissions on encrypted values can only be granted by an address that already has access. The user owns their balance."
      },
      {
        question: "What prevents the same tokens from being used to vote twice on the same proposal?",
        options: ["A) Token transfers are disabled during voting", "B) The `_hasVoted` mapping prevents the same address from voting twice, but token transfers between addresses are not prevented", "C) Tokens are burned when voting", "D) The governance token tracks voting history"],
        correct: 1,
        explanation: "The basic implementation only prevents the same address from voting twice. Production systems use balance snapshots."
      },
      {
        question: "What happens if the admin submits incorrect decrypted values in `executeProposal()`?",
        options: ["A) The contract verifies against the encrypted values and reverts", "B) The incorrect values are accepted -- this is a trust assumption on the admin", "C) The gateway prevents incorrect values", "D) The decrypted values are ignored"],
        correct: 1,
        explanation: "In this design, the admin is trusted to submit correct decrypted values. Production systems would use on-chain decryption callbacks."
      },
      {
        question: "How does the DAO treasury receive ETH?",
        options: ["A) Through a dedicated `deposit()` function", "B) Through the `receive()` function, which accepts any ETH transfer", "C) Through the governance token contract", "D) The admin manually sets the balance"],
        correct: 1,
        explanation: "The `receive() external payable` function allows anyone to send ETH directly to the DAO contract address."
      },
      {
        question: "What condition must be met for `executeProposal()` to succeed?",
        options: ["A) At least 50% of all tokens must have voted", "B) The proposal must be finalized AND `decryptedYes > decryptedNo` AND treasury has enough ETH", "C) The admin must approve it", "D) All token holders must have voted"],
        correct: 1,
        explanation: "Three conditions: the proposal is finalized, yes votes exceed no votes, and the treasury has sufficient ETH."
      },
      {
        question: "Which modules' concepts are directly used in the Confidential DAO?",
        options: ["A) Only Modules 11 and 12", "B) Only Modules 10-13", "C) Modules 03 (types), 04 (operations), 05 (ACL), 06 (inputs), 08 (select), 10 (frontend), 11 (ERC-20), 12 (voting)", "D) All modules equally"],
        correct: 2,
        explanation: "The DAO directly uses encrypted types, arithmetic, ACL, encrypted inputs, conditional logic, frontend integration, token patterns, and voting patterns."
      },
      {
        question: "What is a balance snapshot and why would you need one?",
        options: ["A) A backup of the token contract", "B) A record of all balances at a specific block number, preventing double-voting with transferred tokens", "C) A compressed version of the balance mapping", "D) A frontend cache of decrypted values"],
        correct: 1,
        explanation: "Without snapshots, a user could vote, transfer tokens, and vote again from a new address with the same tokens."
      },
      {
        question: "In a production confidential DAO, how would you eliminate the admin trust assumption for decryption?",
        options: ["A) Use a multisig admin", "B) Use an on-chain decryption callback where the gateway submits decrypted values directly to the contract", "C) Let any user decrypt", "D) Store results in plaintext"],
        correct: 1,
        explanation: "An on-chain callback from the gateway would submit decrypted tallies directly to the contract, removing the need to trust the admin."
      }
    ]
  }
};
