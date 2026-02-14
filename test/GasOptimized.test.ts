import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("GasOptimized", function () {
  let contract: any;
  let contractAddress: string;
  let deployer: any;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("GasOptimized");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  // =====================================================================
  //  Pattern 1: Type Size — euint64 vs euint8
  // =====================================================================

  it("should produce the same result with euint64 (inefficient) and euint8 (optimized)", async function () {
    // Inefficient: uses euint64 for small values
    const tx1 = await contract.inefficient_typeSize(25, 30);
    const receipt1 = await tx1.wait();
    const handle64 = await contract.getResult64();
    const clear64 = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      handle64,
      contractAddress,
      deployer
    );
    expect(clear64).to.equal(55n);

    // Optimized: uses euint8
    const tx2 = await contract.optimized_typeSize(25, 30);
    const receipt2 = await tx2.wait();
    const handle8 = await contract.getResult8();
    const clear8 = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      handle8,
      contractAddress,
      deployer
    );
    expect(clear8).to.equal(55n);

    console.log(
      `  Type Size — euint64 gas: ${receipt1.gasUsed}, euint8 gas: ${receipt2.gasUsed}`
    );
  });

  // =====================================================================
  //  Pattern 2: Plaintext Operand
  // =====================================================================

  it("should produce the same result with encrypted constant (inefficient) and plaintext (optimized)", async function () {
    const tx1 = await contract.inefficient_plaintextOperand(42);
    const receipt1 = await tx1.wait();
    const handle1 = await contract.getResult32();
    const clear1 = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      handle1,
      contractAddress,
      deployer
    );
    expect(clear1).to.equal(52n); // 42 + 10

    const tx2 = await contract.optimized_plaintextOperand(42);
    const receipt2 = await tx2.wait();
    const handle2 = await contract.getResult32();
    const clear2 = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      handle2,
      contractAddress,
      deployer
    );
    expect(clear2).to.equal(52n);

    console.log(
      `  Plaintext Operand — encrypted const gas: ${receipt1.gasUsed}, plaintext gas: ${receipt2.gasUsed}`
    );
  });

  // =====================================================================
  //  Pattern 3: Batch Processing
  // =====================================================================

  it("should produce the same result with individual calls (inefficient) and batch (optimized)", async function () {
    // Inefficient: three separate transactions
    const txA = await contract.inefficient_batchA(10);
    const receiptA = await txA.wait();
    const txB = await contract.inefficient_batchB(20);
    const receiptB = await txB.wait();
    const txC = await contract.inefficient_batchC(30);
    const receiptC = await txC.wait();

    const hA1 = await contract.getValueA();
    const hB1 = await contract.getValueB();
    const hC1 = await contract.getValueC();

    const clearA1 = await fhevm.userDecryptEuint(FhevmType.euint32, hA1, contractAddress, deployer);
    const clearB1 = await fhevm.userDecryptEuint(FhevmType.euint32, hB1, contractAddress, deployer);
    const clearC1 = await fhevm.userDecryptEuint(FhevmType.euint32, hC1, contractAddress, deployer);

    expect(clearA1).to.equal(11n);
    expect(clearB1).to.equal(21n);
    expect(clearC1).to.equal(31n);

    // Optimized: one batched transaction
    const txBatch = await contract.optimized_batchAll(10, 20, 30);
    const receiptBatch = await txBatch.wait();

    const hA2 = await contract.getValueA();
    const hB2 = await contract.getValueB();
    const hC2 = await contract.getValueC();

    const clearA2 = await fhevm.userDecryptEuint(FhevmType.euint32, hA2, contractAddress, deployer);
    const clearB2 = await fhevm.userDecryptEuint(FhevmType.euint32, hB2, contractAddress, deployer);
    const clearC2 = await fhevm.userDecryptEuint(FhevmType.euint32, hC2, contractAddress, deployer);

    expect(clearA2).to.equal(11n);
    expect(clearB2).to.equal(21n);
    expect(clearC2).to.equal(31n);

    const totalIndividual = receiptA.gasUsed + receiptB.gasUsed + receiptC.gasUsed;
    console.log(
      `  Batch — 3 individual txs gas: ${totalIndividual}, 1 batch tx gas: ${receiptBatch.gasUsed}`
    );
  });

  // =====================================================================
  //  Pattern 4: Caching
  // =====================================================================

  it("should produce the same result with recomputation (inefficient) and cached (optimized)", async function () {
    // Inefficient: recomputes tax rate every call
    const tx1 = await contract.inefficient_caching(100);
    const receipt1 = await tx1.wait();
    const h1 = await contract.getResult32();
    const clear1 = await fhevm.userDecryptEuint(FhevmType.euint32, h1, contractAddress, deployer);
    expect(clear1).to.equal(1500n); // 100 * 15

    // Optimized: setup + cached call
    await (await contract.optimized_caching_setup()).wait();
    const tx2 = await contract.optimized_caching(100);
    const receipt2 = await tx2.wait();
    const h2 = await contract.getResult32();
    const clear2 = await fhevm.userDecryptEuint(FhevmType.euint32, h2, contractAddress, deployer);
    expect(clear2).to.equal(1500n);

    console.log(
      `  Caching — recompute gas: ${receipt1.gasUsed}, cached gas: ${receipt2.gasUsed}`
    );
  });

  // =====================================================================
  //  Pattern 5: Minimize Operations (clamp)
  // =====================================================================

  it("should clamp value to [10, 100] with both approaches — value below range", async function () {
    const tx1 = await contract.inefficient_minimize(5);
    const receipt1 = await tx1.wait();
    const h1 = await contract.getResult32();
    const clear1 = await fhevm.userDecryptEuint(FhevmType.euint32, h1, contractAddress, deployer);
    expect(clear1).to.equal(10n);

    const tx2 = await contract.optimized_minimize(5);
    const receipt2 = await tx2.wait();
    const h2 = await contract.getResult32();
    const clear2 = await fhevm.userDecryptEuint(FhevmType.euint32, h2, contractAddress, deployer);
    expect(clear2).to.equal(10n);

    console.log(
      `  Minimize (below) — select-based gas: ${receipt1.gasUsed}, min/max gas: ${receipt2.gasUsed}`
    );
  });

  it("should clamp value to [10, 100] — value above range", async function () {
    const tx1 = await contract.inefficient_minimize(200);
    await tx1.wait();
    const h1 = await contract.getResult32();
    const clear1 = await fhevm.userDecryptEuint(FhevmType.euint32, h1, contractAddress, deployer);
    expect(clear1).to.equal(100n);

    const tx2 = await contract.optimized_minimize(200);
    await tx2.wait();
    const h2 = await contract.getResult32();
    const clear2 = await fhevm.userDecryptEuint(FhevmType.euint32, h2, contractAddress, deployer);
    expect(clear2).to.equal(100n);
  });

  // =====================================================================
  //  Pattern 6: Lazy Evaluation
  // =====================================================================

  it("should produce the same result with immediate (inefficient) and lazy (optimized)", async function () {
    // Inefficient: computes immediately
    const tx1 = await contract.inefficient_lazy(7);
    const receipt1 = await tx1.wait();
    const h1 = await contract.getResult32();
    const clear1 = await fhevm.userDecryptEuint(FhevmType.euint32, h1, contractAddress, deployer);
    expect(clear1).to.equal(50n); // 7*7 + 1 = 50

    // Optimized: store, then flush
    const txStore = await contract.optimized_lazy_store(7);
    const receiptStore = await txStore.wait();
    const txFlush = await contract.optimized_lazy_flush();
    const receiptFlush = await txFlush.wait();
    const h2 = await contract.getResult32();
    const clear2 = await fhevm.userDecryptEuint(FhevmType.euint32, h2, contractAddress, deployer);
    expect(clear2).to.equal(50n);

    console.log(
      `  Lazy Eval — immediate gas: ${receipt1.gasUsed}, store gas: ${receiptStore.gasUsed}, flush gas: ${receiptFlush.gasUsed}`
    );
  });

  // =====================================================================
  //  Pattern 7: Redundant Select
  // =====================================================================

  it("should produce max(max(a, b), 50) with both approaches", async function () {
    // Both should return max(max(70, 30), 50) = 70
    const tx1 = await contract.inefficient_select(70, 30);
    const receipt1 = await tx1.wait();
    const h1 = await contract.getResult32();
    const clear1 = await fhevm.userDecryptEuint(FhevmType.euint32, h1, contractAddress, deployer);
    expect(clear1).to.equal(70n);

    const tx2 = await contract.optimized_select(70, 30);
    const receipt2 = await tx2.wait();
    const h2 = await contract.getResult32();
    const clear2 = await fhevm.userDecryptEuint(FhevmType.euint32, h2, contractAddress, deployer);
    expect(clear2).to.equal(70n);

    console.log(
      `  Select — gt+select gas: ${receipt1.gasUsed}, max gas: ${receipt2.gasUsed}`
    );
  });

  it("should floor at 50 when both inputs are below 50", async function () {
    const tx1 = await contract.inefficient_select(20, 10);
    await tx1.wait();
    const h1 = await contract.getResult32();
    const clear1 = await fhevm.userDecryptEuint(FhevmType.euint32, h1, contractAddress, deployer);
    expect(clear1).to.equal(50n);

    const tx2 = await contract.optimized_select(20, 10);
    await tx2.wait();
    const h2 = await contract.getResult32();
    const clear2 = await fhevm.userDecryptEuint(FhevmType.euint32, h2, contractAddress, deployer);
    expect(clear2).to.equal(50n);
  });

  // =====================================================================
  //  Pattern 8: Unnecessary Conversion
  // =====================================================================

  it("should produce 2*a + b with both approaches", async function () {
    // 2*5 + 3 = 13
    const tx1 = await contract.inefficient_convert(5, 3);
    const receipt1 = await tx1.wait();
    const h1 = await contract.getResult32();
    const clear1 = await fhevm.userDecryptEuint(FhevmType.euint32, h1, contractAddress, deployer);
    expect(clear1).to.equal(13n);

    const tx2 = await contract.optimized_convert(5, 3);
    const receipt2 = await tx2.wait();
    const h2 = await contract.getResult32();
    const clear2 = await fhevm.userDecryptEuint(FhevmType.euint32, h2, contractAddress, deployer);
    expect(clear2).to.equal(13n);

    console.log(
      `  Convert — asEuint32(2) gas: ${receipt1.gasUsed}, plaintext 2 gas: ${receipt2.gasUsed}`
    );
  });
});
