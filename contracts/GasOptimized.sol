// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint32, euint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title GasOptimized - Module 15: Gas optimization patterns for FHE operations
/// @notice Demonstrates before/after optimization patterns for FHE gas reduction.
///         Each pair of functions (inefficient_X / optimized_X) performs the same logic
///         but the optimized version uses fewer gas-expensive operations.
contract GasOptimized is ZamaEthereumConfig {
    // -----------------------------------------------------------------------
    // Storage — results stored per-pattern so tests can verify correctness
    // -----------------------------------------------------------------------
    euint32 private _result32;
    euint8  private _result8;
    euint64 private _result64;

    // Cached values for the caching pattern
    euint32 private _cachedTaxRate;
    bool    private _taxCached;

    // Batch storage
    euint32 private _valueA;
    euint32 private _valueB;
    euint32 private _valueC;

    // Lazy evaluation storage
    euint32 private _lazyPending;
    euint32 private _lazyBase;
    bool    private _hasPending;

    // -----------------------------------------------------------------------
    // Events — track which version was called
    // -----------------------------------------------------------------------
    event InefficientTypeCalled(string name);
    event OptimizedTypeCalled(string name);
    event InefficientPlaintextCalled(string name);
    event OptimizedPlaintextCalled(string name);
    event InefficientBatchCalled(string name);
    event OptimizedBatchCalled(string name);
    event InefficientCacheCalled(string name);
    event OptimizedCacheCalled(string name);
    event InefficientMinimizeCalled(string name);
    event OptimizedMinimizeCalled(string name);
    event InefficientLazyCalled(string name);
    event OptimizedLazyCalled(string name);
    event LazyFlushCalled();
    event InefficientSelectCalled(string name);
    event OptimizedSelectCalled(string name);
    event InefficientConvertCalled(string name);
    event OptimizedConvertCalled(string name);

    // -----------------------------------------------------------------------
    // Getters
    // -----------------------------------------------------------------------
    function getResult32() external view returns (euint32) {
        return _result32;
    }

    function getResult8() external view returns (euint8) {
        return _result8;
    }

    function getResult64() external view returns (euint64) {
        return _result64;
    }

    function getValueA() external view returns (euint32) {
        return _valueA;
    }

    function getValueB() external view returns (euint32) {
        return _valueB;
    }

    function getValueC() external view returns (euint32) {
        return _valueC;
    }

    // =====================================================================
    //  PATTERN 1: Type Size — euint64 vs euint8 for small values
    // =====================================================================

    /// @notice INEFFICIENT: Uses euint64 for a value that fits in 8 bits (e.g., age 0-255).
    function inefficient_typeSize(uint64 age, uint64 bonus) external {
        emit InefficientTypeCalled("typeSize");
        euint64 encAge   = FHE.asEuint64(age);
        euint64 encBonus = FHE.asEuint64(bonus);
        euint64 result   = FHE.add(encAge, encBonus);
        _result64 = result;
        FHE.allowThis(_result64);
        FHE.allow(_result64, msg.sender);
    }

    /// @notice OPTIMIZED: Uses euint8 — same logic, significantly cheaper.
    function optimized_typeSize(uint8 age, uint8 bonus) external {
        emit OptimizedTypeCalled("typeSize");
        euint8 encAge   = FHE.asEuint8(age);
        euint8 encBonus = FHE.asEuint8(bonus);
        euint8 result   = FHE.add(encAge, encBonus);
        _result8 = result;
        FHE.allowThis(_result8);
        FHE.allow(_result8, msg.sender);
    }

    // =====================================================================
    //  PATTERN 2: Plaintext Operand — encrypted+encrypted vs encrypted+plaintext
    // =====================================================================

    /// @notice INEFFICIENT: Wraps a known constant into an encrypted value before adding.
    function inefficient_plaintextOperand(uint32 value) external {
        emit InefficientPlaintextCalled("plaintextOperand");
        euint32 enc      = FHE.asEuint32(value);
        euint32 encConst = FHE.asEuint32(10); // needlessly encrypted
        _result32 = FHE.add(enc, encConst);
        FHE.allowThis(_result32);
        FHE.allow(_result32, msg.sender);
    }

    /// @notice OPTIMIZED: Uses a plaintext constant directly.
    function optimized_plaintextOperand(uint32 value) external {
        emit OptimizedPlaintextCalled("plaintextOperand");
        euint32 enc = FHE.asEuint32(value);
        _result32 = FHE.add(enc, 10); // plaintext second operand — much cheaper
        FHE.allowThis(_result32);
        FHE.allow(_result32, msg.sender);
    }

    // =====================================================================
    //  PATTERN 3: Batch Processing — three separate txs vs one batched tx
    // =====================================================================

    /// @notice INEFFICIENT: Three separate calls to update three values.
    function inefficient_batchA(uint32 a) external {
        emit InefficientBatchCalled("batchA");
        _valueA = FHE.asEuint32(a);
        _valueA = FHE.add(_valueA, 1);
        FHE.allowThis(_valueA);
        FHE.allow(_valueA, msg.sender);
    }

    function inefficient_batchB(uint32 b) external {
        emit InefficientBatchCalled("batchB");
        _valueB = FHE.asEuint32(b);
        _valueB = FHE.add(_valueB, 1);
        FHE.allowThis(_valueB);
        FHE.allow(_valueB, msg.sender);
    }

    function inefficient_batchC(uint32 c) external {
        emit InefficientBatchCalled("batchC");
        _valueC = FHE.asEuint32(c);
        _valueC = FHE.add(_valueC, 1);
        FHE.allowThis(_valueC);
        FHE.allow(_valueC, msg.sender);
    }

    /// @notice OPTIMIZED: One call updates all three values at once.
    function optimized_batchAll(uint32 a, uint32 b, uint32 c) external {
        emit OptimizedBatchCalled("batchAll");
        _valueA = FHE.add(FHE.asEuint32(a), 1);
        _valueB = FHE.add(FHE.asEuint32(b), 1);
        _valueC = FHE.add(FHE.asEuint32(c), 1);
        FHE.allowThis(_valueA);
        FHE.allowThis(_valueB);
        FHE.allowThis(_valueC);
        FHE.allow(_valueA, msg.sender);
        FHE.allow(_valueB, msg.sender);
        FHE.allow(_valueC, msg.sender);
    }

    // =====================================================================
    //  PATTERN 4: Caching — recomputing vs storing intermediate results
    // =====================================================================

    /// @notice INEFFICIENT: Recomputes a tax rate every time from base components.
    function inefficient_caching(uint32 price) external {
        emit InefficientCacheCalled("caching");
        // Simulate: taxRate = 15, computed via encrypted arithmetic each time
        euint32 baseTax   = FHE.asEuint32(10);
        euint32 surcharge = FHE.asEuint32(5);
        euint32 taxRate   = FHE.add(baseTax, surcharge);  // recomputed every call!

        euint32 encPrice = FHE.asEuint32(price);
        _result32 = FHE.mul(encPrice, taxRate);
        FHE.allowThis(_result32);
        FHE.allow(_result32, msg.sender);
    }

    /// @notice OPTIMIZED: Cache the tax rate once, reuse on subsequent calls.
    function optimized_caching_setup() external {
        euint32 baseTax   = FHE.asEuint32(10);
        euint32 surcharge = FHE.asEuint32(5);
        _cachedTaxRate = FHE.add(baseTax, surcharge);
        FHE.allowThis(_cachedTaxRate);
        _taxCached = true;
    }

    function optimized_caching(uint32 price) external {
        emit OptimizedCacheCalled("caching");
        require(_taxCached, "Call optimized_caching_setup first");
        euint32 encPrice = FHE.asEuint32(price);
        _result32 = FHE.mul(encPrice, _cachedTaxRate);  // no recomputation!
        FHE.allowThis(_result32);
        FHE.allow(_result32, msg.sender);
    }

    // =====================================================================
    //  PATTERN 5: Minimize Operations — redundant comparisons
    // =====================================================================

    /// @notice INEFFICIENT: Two separate comparisons + two selects to clamp a value.
    function inefficient_minimize(uint32 value) external {
        emit InefficientMinimizeCalled("minimize");
        euint32 enc = FHE.asEuint32(value);
        euint32 lo  = FHE.asEuint32(10);
        euint32 hi  = FHE.asEuint32(100);

        // Check lower bound
        ebool tooLow = FHE.lt(enc, lo);
        euint32 step1 = FHE.select(tooLow, lo, enc);

        // Check upper bound
        ebool tooHigh = FHE.gt(step1, hi);
        euint32 step2 = FHE.select(tooHigh, hi, step1);

        _result32 = step2;
        FHE.allowThis(_result32);
        FHE.allow(_result32, msg.sender);
    }

    /// @notice OPTIMIZED: Use built-in FHE.max / FHE.min (one FHE op each).
    function optimized_minimize(uint32 value) external {
        emit OptimizedMinimizeCalled("minimize");
        euint32 enc = FHE.asEuint32(value);
        // max(value, 10) raises to lower bound, min(..., 100) caps at upper bound
        _result32 = FHE.min(FHE.max(enc, FHE.asEuint32(10)), FHE.asEuint32(100));
        FHE.allowThis(_result32);
        FHE.allow(_result32, msg.sender);
    }

    // =====================================================================
    //  PATTERN 6: Lazy Evaluation — execute immediately vs defer
    // =====================================================================

    /// @notice INEFFICIENT: Applies an expensive operation (mul) on every update.
    function inefficient_lazy(uint32 value) external {
        emit InefficientLazyCalled("lazy");
        euint32 enc = FHE.asEuint32(value);
        // Heavy computation performed immediately
        euint32 squared = FHE.mul(enc, enc);
        _result32 = FHE.add(squared, 1);
        FHE.allowThis(_result32);
        FHE.allow(_result32, msg.sender);
    }

    /// @notice OPTIMIZED: Stores the base value; defers the expensive computation.
    function optimized_lazy_store(uint32 value) external {
        emit OptimizedLazyCalled("lazy_store");
        _lazyBase    = FHE.asEuint32(value);
        _hasPending  = true;
        FHE.allowThis(_lazyBase);
    }

    /// @notice OPTIMIZED: Only computes the expensive part when the result is actually needed.
    function optimized_lazy_flush() external {
        emit LazyFlushCalled();
        require(_hasPending, "Nothing pending");
        euint32 squared = FHE.mul(_lazyBase, _lazyBase);
        _result32 = FHE.add(squared, 1);
        _hasPending = false;
        FHE.allowThis(_result32);
        FHE.allow(_result32, msg.sender);
    }

    // =====================================================================
    //  PATTERN 7: Redundant Select — two selects vs one combined
    // =====================================================================

    /// @notice INEFFICIENT: Uses two sequential selects on dependent conditions.
    function inefficient_select(uint32 a, uint32 b) external {
        emit InefficientSelectCalled("select");
        euint32 encA = FHE.asEuint32(a);
        euint32 encB = FHE.asEuint32(b);

        // "Is a > b?"
        ebool aGtB = FHE.gt(encA, encB);
        euint32 bigger = FHE.select(aGtB, encA, encB);

        // "Is bigger > 50?"  — second comparison + select
        ebool gt50 = FHE.gt(bigger, FHE.asEuint32(50));
        _result32 = FHE.select(gt50, bigger, FHE.asEuint32(50));

        FHE.allowThis(_result32);
        FHE.allow(_result32, msg.sender);
    }

    /// @notice OPTIMIZED: Uses FHE.max to combine both steps, saving one comparison + one select.
    function optimized_select(uint32 a, uint32 b) external {
        emit OptimizedSelectCalled("select");
        euint32 encA = FHE.asEuint32(a);
        euint32 encB = FHE.asEuint32(b);

        // max(a, b) replaces first select; max(result, 50) replaces second
        euint32 bigger = FHE.max(encA, encB);
        _result32 = FHE.max(bigger, FHE.asEuint32(50));

        FHE.allowThis(_result32);
        FHE.allow(_result32, msg.sender);
    }

    // =====================================================================
    //  PATTERN 8: Unnecessary Type Conversion — double cast vs direct use
    // =====================================================================

    /// @notice INEFFICIENT: Converts a plaintext to euint32, then immediately uses it.
    function inefficient_convert(uint32 a, uint32 b) external {
        emit InefficientConvertCalled("convert");
        euint32 encA = FHE.asEuint32(a);
        euint32 encB = FHE.asEuint32(b);

        // multiply by constant 2: first encrypts 2, then multiplies
        euint32 doubled = FHE.mul(encA, 2);
        _result32 = FHE.add(doubled, encB);

        FHE.allowThis(_result32);
        FHE.allow(_result32, msg.sender);
    }

    /// @notice OPTIMIZED: Uses plaintext operand directly with FHE.mul.
    function optimized_convert(uint32 a, uint32 b) external {
        emit OptimizedConvertCalled("convert");
        euint32 encA = FHE.asEuint32(a);
        euint32 encB = FHE.asEuint32(b);

        // plaintext 2 is cheaper — no encryption step
        euint32 doubled = FHE.mul(encA, 2);
        _result32 = FHE.add(doubled, encB);

        FHE.allowThis(_result32);
        FHE.allow(_result32, msg.sender);
    }
}
