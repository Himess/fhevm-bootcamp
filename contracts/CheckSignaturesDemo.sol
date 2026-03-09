// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint64 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title CheckSignaturesDemo
/// @notice Demonstrates the FHE.checkSignatures() pattern for verifying KMS decryption proofs
/// @dev Module 07 companion — shows production-style decryption verification flow:
///      1. Store encrypted values on-chain
///      2. Mark them as publicly decryptable via FHE.makePubliclyDecryptable()
///      3. Off-chain relayer obtains plaintext from KMS
///      4. Relayer submits plaintext + KMS proof to contract
///      5. Contract verifies proof via FHE.checkSignatures() before using values
///
///      In development (Hardhat), use fhevm.userDecryptEuint() for testing.
///      In production, KMS provides real decryption proofs that this pattern verifies.
contract CheckSignaturesDemo is ZamaEthereumConfig {
    address public owner;

    // Encrypted balance per user
    mapping(address => euint64) private _balances;

    // Track which users have requested a reveal
    mapping(address => bool) public revealRequested;

    // Verified plaintext results (only set after checkSignatures succeeds)
    mapping(address => uint64) public verifiedBalances;
    mapping(address => bool) public hasVerifiedBalance;

    // Track handles for verification
    mapping(address => bytes32) public pendingHandles;

    event Deposited(address indexed user, uint64 amount);
    event RevealRequested(address indexed user, bytes32 handle);
    event BalanceVerified(address indexed user, uint64 verifiedAmount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Deposit a plaintext amount (encrypted on-chain)
    function deposit(uint64 amount) external {
        _balances[msg.sender] = FHE.add(_balances[msg.sender], amount);
        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);
        emit Deposited(msg.sender, amount);
    }

    /// @notice Get encrypted balance handle (requires ACL access)
    function getBalance(address user) external view returns (euint64) {
        return _balances[user];
    }

    /// @notice Step 1: Request reveal — marks the encrypted balance for public decryption
    /// @dev In production, this signals the KMS to begin threshold decryption
    function requestReveal() external {
        require(FHE.isInitialized(_balances[msg.sender]), "No balance to reveal");
        require(!revealRequested[msg.sender], "Already requested");

        // Mark for public decryption — KMS can now decrypt this value
        FHE.makePubliclyDecryptable(_balances[msg.sender]);

        // Store the handle for later verification
        pendingHandles[msg.sender] = FHE.toBytes32(_balances[msg.sender]);
        revealRequested[msg.sender] = true;

        emit RevealRequested(msg.sender, pendingHandles[msg.sender]);
    }

    /// @notice Step 2: Submit verified decryption result with KMS proof
    /// @dev In production, a relayer calls this with the KMS decryption proof.
    ///      FHE.checkSignatures() verifies that the KMS actually decrypted these handles
    ///      to the claimed values. If verification fails, the transaction reverts.
    ///
    ///      Parameters:
    ///        handlesList       — Array of bytes32 ciphertext handles that were decrypted
    ///        abiEncodedCleartexts — ABI-encoded plaintext values (order matches handlesList)
    ///        decryptionProof   — Cryptographic proof from the KMS (signatures + metadata)
    ///
    ///      The proof structure: numSigners (1 byte) + signatures (65 * numSigners bytes) + extraData
    function submitVerifiedResult(
        address user,
        bytes32[] memory handlesList,
        bytes memory abiEncodedCleartexts,
        bytes memory decryptionProof
    ) external onlyOwner {
        require(revealRequested[user], "No reveal requested");
        require(!hasVerifiedBalance[user], "Already verified");

        // Verify handle matches what we stored
        require(handlesList.length == 1, "Expected single handle");
        require(handlesList[0] == pendingHandles[user], "Handle mismatch");

        // CRITICAL: Verify KMS signatures — this is the core security check
        // If the proof is invalid, this will revert with InvalidKMSSignatures()
        FHE.checkSignatures(handlesList, abiEncodedCleartexts, decryptionProof);

        // Proof verified! Safe to decode and use the plaintext value
        uint64 revealedBalance = abi.decode(abiEncodedCleartexts, (uint64));

        verifiedBalances[user] = revealedBalance;
        hasVerifiedBalance[user] = true;

        emit BalanceVerified(user, revealedBalance);
    }

    /// @notice Check if a balance is publicly decryptable
    function isRevealable(address user) external view returns (bool) {
        if (!FHE.isInitialized(_balances[user])) return false;
        return FHE.isPubliclyDecryptable(_balances[user]);
    }

    /// @notice Reset reveal state (for demo purposes)
    function resetReveal() external {
        revealRequested[msg.sender] = false;
        hasVerifiedBalance[msg.sender] = false;
        verifiedBalances[msg.sender] = 0;
        pendingHandles[msg.sender] = bytes32(0);
    }
}
