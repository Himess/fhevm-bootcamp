# Module 15: Exercise -- Optimize the Inefficient Token

## Objective

You are given a deliberately inefficient confidential token contract (`exercises/15-gas-exercise.sol`). Your task is to apply the gas optimization patterns from this module to reduce gas consumption by **at least 30%**.

---

## The Problem

The contract `InefficientToken` is a working confidential ERC-20-like token with the following features:

- Minting (owner only)
- Transferring tokens between accounts
- Checking if a balance exceeds a threshold

It works correctly, but it wastes enormous amounts of gas through poor FHE patterns:

1. It uses `euint64` for balances that never exceed 1,000,000
2. It encrypts plaintext constants before every operation
3. It recomputes a fee rate from components on every transfer
4. It uses redundant comparisons where `FHE.max` / `FHE.min` would suffice
5. It performs the same comparison twice in one function

---

## Your Task

1. Copy `exercises/15-gas-exercise.sol` to `contracts/OptimizedToken.sol`
2. Rename the contract to `OptimizedToken`
3. Apply optimization patterns to reduce gas usage by at least 30%
4. Write tests that:
   - Verify the optimized contract produces the same results as the original
   - Measure and log gas usage for `mint`, `transfer`, and `checkThreshold`
   - Assert that total gas for a standard workflow (mint + transfer + check) is at least 30% less

---

## Optimization Targets

| Function | Inefficient Patterns | Optimization Hints |
|----------|---------------------|-------------------|
| `mint()` | Uses euint64 for small values; encrypts constant 0 | Downsize to euint32; use plaintext 0 |
| `transfer()` | Encrypts amount; encrypts fee components each call; double comparison | Use plaintext operands; cache fee rate; eliminate redundant check |
| `checkThreshold()` | Uses gt + select instead of max | Replace with FHE.max or simplify |

---

## Starter Test

```typescript
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("OptimizedToken", function () {
  let contract: any;
  let contractAddress: string;
  let deployer: any;
  let recipient: any;

  beforeEach(async function () {
    [deployer, recipient] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("OptimizedToken");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  it("should mint tokens with less gas than the inefficient version", async function () {
    const tx = await contract.mint(deployer.address, 1000);
    const receipt = await tx.wait();
    console.log(`  OptimizedToken.mint gas: ${receipt.gasUsed}`);
    // TODO: Compare with InefficientToken gas and assert 30%+ savings
  });

  it("should transfer tokens correctly", async function () {
    await (await contract.mint(deployer.address, 1000)).wait();
    const tx = await contract.transfer(recipient.address, 100);
    const receipt = await tx.wait();
    console.log(`  OptimizedToken.transfer gas: ${receipt.gasUsed}`);

    // Verify balances
    // TODO: decrypt and check sender has 900, recipient has 100
  });

  it("should check threshold correctly", async function () {
    await (await contract.mint(deployer.address, 1000)).wait();
    const tx = await contract.checkThreshold(500);
    const receipt = await tx.wait();
    console.log(`  OptimizedToken.checkThreshold gas: ${receipt.gasUsed}`);
  });
});
```

---

## Success Criteria

- [ ] The optimized contract compiles and passes all functional tests
- [ ] `mint()` gas is at least 30% lower than the inefficient version
- [ ] `transfer()` gas is at least 30% lower than the inefficient version
- [ ] `checkThreshold()` gas is at least 20% lower than the inefficient version
- [ ] All three functions produce the same logical results as the original

---

## Hints

1. Read the lesson section on **plaintext operands** -- the transfer function encrypts the amount before every operation.
2. Read the lesson section on **caching** -- the fee rate is constant but recomputed every call.
3. Read the lesson section on **type sizing** -- the balance cap is 1,000,000 which fits in `euint32`.
4. Read the lesson section on **minimizing operations** -- `checkThreshold` uses a comparison + select where a single built-in would suffice.

---

## Reference Solution

See `solutions/15-gas-solution.sol` after you have completed your attempt.
