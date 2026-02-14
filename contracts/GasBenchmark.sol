// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint16, euint32, euint64, ebool, externalEuint32, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title GasBenchmark - Module 15: Benchmark individual FHE operations
/// @notice Each function performs a single FHE operation and stores the result,
///         allowing accurate gas measurement from transaction receipts.
contract GasBenchmark is ZamaEthereumConfig {
    // -----------------------------------------------------------------------
    // Storage — one slot per benchmark so operations don't interfere
    // -----------------------------------------------------------------------
    euint32 private _resultAdd32;
    euint32 private _resultMul32;
    euint32 private _resultDiv32;
    euint32 private _resultSelect;
    ebool   private _resultEq;
    ebool   private _resultGt;
    euint32 private _resultRand32;
    euint32 private _resultMin;
    euint32 private _resultMax;
    euint32 private _resultSub32;
    euint32 private _resultAddPlaintext;
    euint32 private _resultMulPlaintext;

    // -----------------------------------------------------------------------
    // Getters
    // -----------------------------------------------------------------------
    function getResultAdd32() external view returns (euint32) {
        return _resultAdd32;
    }

    function getResultMul32() external view returns (euint32) {
        return _resultMul32;
    }

    function getResultDiv32() external view returns (euint32) {
        return _resultDiv32;
    }

    function getResultSelect() external view returns (euint32) {
        return _resultSelect;
    }

    function getResultEq() external view returns (ebool) {
        return _resultEq;
    }

    function getResultGt() external view returns (ebool) {
        return _resultGt;
    }

    function getResultRand32() external view returns (euint32) {
        return _resultRand32;
    }

    function getResultMin() external view returns (euint32) {
        return _resultMin;
    }

    function getResultMax() external view returns (euint32) {
        return _resultMax;
    }

    function getResultSub32() external view returns (euint32) {
        return _resultSub32;
    }

    function getResultAddPlaintext() external view returns (euint32) {
        return _resultAddPlaintext;
    }

    function getResultMulPlaintext() external view returns (euint32) {
        return _resultMulPlaintext;
    }

    // =====================================================================
    //  Benchmark Functions — euint32
    // =====================================================================

    /// @notice Benchmark: encrypted addition (euint32 + euint32)
    function benchmarkAdd32(uint32 a, uint32 b) external {
        euint32 encA = FHE.asEuint32(a);
        euint32 encB = FHE.asEuint32(b);
        _resultAdd32 = FHE.add(encA, encB);
        FHE.allowThis(_resultAdd32);
        FHE.allow(_resultAdd32, msg.sender);
    }

    /// @notice Benchmark: encrypted subtraction (euint32 - euint32)
    function benchmarkSub32(uint32 a, uint32 b) external {
        euint32 encA = FHE.asEuint32(a);
        euint32 encB = FHE.asEuint32(b);
        _resultSub32 = FHE.sub(encA, encB);
        FHE.allowThis(_resultSub32);
        FHE.allow(_resultSub32, msg.sender);
    }

    /// @notice Benchmark: encrypted multiplication (euint32 * euint32)
    function benchmarkMul32(uint32 a, uint32 b) external {
        euint32 encA = FHE.asEuint32(a);
        euint32 encB = FHE.asEuint32(b);
        _resultMul32 = FHE.mul(encA, encB);
        FHE.allowThis(_resultMul32);
        FHE.allow(_resultMul32, msg.sender);
    }

    /// @notice Benchmark: encrypted division by plaintext (euint32 / uint32)
    function benchmarkDiv32(uint32 a, uint32 plaintextDivisor) external {
        euint32 encA = FHE.asEuint32(a);
        _resultDiv32 = FHE.div(encA, plaintextDivisor);
        FHE.allowThis(_resultDiv32);
        FHE.allow(_resultDiv32, msg.sender);
    }

    /// @notice Benchmark: FHE.select (encrypted conditional)
    function benchmarkSelect(uint32 a, uint32 b, bool condition) external {
        euint32 encA = FHE.asEuint32(a);
        euint32 encB = FHE.asEuint32(b);
        ebool encCond = FHE.asEbool(condition);
        _resultSelect = FHE.select(encCond, encA, encB);
        FHE.allowThis(_resultSelect);
        FHE.allow(_resultSelect, msg.sender);
    }

    /// @notice Benchmark: encrypted equality (euint32 == euint32)
    function benchmarkEq(uint32 a, uint32 b) external {
        euint32 encA = FHE.asEuint32(a);
        euint32 encB = FHE.asEuint32(b);
        _resultEq = FHE.eq(encA, encB);
        FHE.allowThis(_resultEq);
        FHE.allow(_resultEq, msg.sender);
    }

    /// @notice Benchmark: encrypted greater-than (euint32 > euint32)
    function benchmarkGt(uint32 a, uint32 b) external {
        euint32 encA = FHE.asEuint32(a);
        euint32 encB = FHE.asEuint32(b);
        _resultGt = FHE.gt(encA, encB);
        FHE.allowThis(_resultGt);
        FHE.allow(_resultGt, msg.sender);
    }

    /// @notice Benchmark: encrypted random generation
    function benchmarkRand32() external {
        _resultRand32 = FHE.randEuint32();
        FHE.allowThis(_resultRand32);
        FHE.allow(_resultRand32, msg.sender);
    }

    /// @notice Benchmark: encrypted min (euint32)
    function benchmarkMin(uint32 a, uint32 b) external {
        euint32 encA = FHE.asEuint32(a);
        euint32 encB = FHE.asEuint32(b);
        _resultMin = FHE.min(encA, encB);
        FHE.allowThis(_resultMin);
        FHE.allow(_resultMin, msg.sender);
    }

    /// @notice Benchmark: encrypted max (euint32)
    function benchmarkMax(uint32 a, uint32 b) external {
        euint32 encA = FHE.asEuint32(a);
        euint32 encB = FHE.asEuint32(b);
        _resultMax = FHE.max(encA, encB);
        FHE.allowThis(_resultMax);
        FHE.allow(_resultMax, msg.sender);
    }

    // =====================================================================
    //  Plaintext Operand Benchmarks — compare with encrypted-encrypted
    // =====================================================================

    /// @notice Benchmark: encrypted + plaintext addition (cheaper than enc+enc)
    function benchmarkAddPlaintext(uint32 a, uint32 plaintextB) external {
        euint32 encA = FHE.asEuint32(a);
        _resultAddPlaintext = FHE.add(encA, plaintextB);
        FHE.allowThis(_resultAddPlaintext);
        FHE.allow(_resultAddPlaintext, msg.sender);
    }

    /// @notice Benchmark: encrypted * plaintext multiplication (cheaper than enc*enc)
    function benchmarkMulPlaintext(uint32 a, uint32 plaintextB) external {
        euint32 encA = FHE.asEuint32(a);
        _resultMulPlaintext = FHE.mul(encA, plaintextB);
        FHE.allowThis(_resultMulPlaintext);
        FHE.allow(_resultMulPlaintext, msg.sender);
    }
}
