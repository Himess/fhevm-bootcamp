import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("GasBenchmark", function () {
  let contract: any;
  let contractAddress: string;
  let deployer: any;

  // Collect gas results for a summary table at the end
  const gasResults: { operation: string; gas: bigint }[] = [];

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("GasBenchmark");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  afterEach(function () {
    // Print each result as it completes
    if (gasResults.length > 0) {
      const latest = gasResults[gasResults.length - 1];
      console.log(`    ${latest.operation}: ${latest.gas} gas`);
    }
  });

  // =====================================================================
  //  Arithmetic Benchmarks
  // =====================================================================

  it("benchmarkAdd32: encrypted + encrypted addition", async function () {
    const tx = await contract.benchmarkAdd32(100, 200);
    const receipt = await tx.wait();
    gasResults.push({ operation: "add32 (enc+enc)", gas: receipt.gasUsed });

    const handle = await contract.getResultAdd32();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(300n);
  });

  it("benchmarkAddPlaintext: encrypted + plaintext addition", async function () {
    const tx = await contract.benchmarkAddPlaintext(100, 200);
    const receipt = await tx.wait();
    gasResults.push({ operation: "add32 (enc+plain)", gas: receipt.gasUsed });

    const handle = await contract.getResultAddPlaintext();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(300n);
  });

  it("benchmarkSub32: encrypted - encrypted subtraction", async function () {
    const tx = await contract.benchmarkSub32(500, 200);
    const receipt = await tx.wait();
    gasResults.push({ operation: "sub32 (enc-enc)", gas: receipt.gasUsed });

    const handle = await contract.getResultSub32();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(300n);
  });

  it("benchmarkMul32: encrypted * encrypted multiplication", async function () {
    const tx = await contract.benchmarkMul32(12, 7);
    const receipt = await tx.wait();
    gasResults.push({ operation: "mul32 (enc*enc)", gas: receipt.gasUsed });

    const handle = await contract.getResultMul32();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(84n);
  });

  it("benchmarkMulPlaintext: encrypted * plaintext multiplication", async function () {
    const tx = await contract.benchmarkMulPlaintext(12, 7);
    const receipt = await tx.wait();
    gasResults.push({ operation: "mul32 (enc*plain)", gas: receipt.gasUsed });

    const handle = await contract.getResultMulPlaintext();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(84n);
  });

  it("benchmarkDiv32: encrypted / plaintext division", async function () {
    const tx = await contract.benchmarkDiv32(100, 4);
    const receipt = await tx.wait();
    gasResults.push({ operation: "div32 (enc/plain)", gas: receipt.gasUsed });

    const handle = await contract.getResultDiv32();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(25n);
  });

  // =====================================================================
  //  Comparison Benchmarks
  // =====================================================================

  it("benchmarkEq: encrypted equality comparison", async function () {
    const tx = await contract.benchmarkEq(42, 42);
    const receipt = await tx.wait();
    gasResults.push({ operation: "eq32", gas: receipt.gasUsed });

    const handle = await contract.getResultEq();
    const clear = await fhevm.userDecryptEbool(handle, contractAddress, deployer);
    expect(clear).to.equal(true);
  });

  it("benchmarkGt: encrypted greater-than comparison", async function () {
    const tx = await contract.benchmarkGt(100, 50);
    const receipt = await tx.wait();
    gasResults.push({ operation: "gt32", gas: receipt.gasUsed });

    const handle = await contract.getResultGt();
    const clear = await fhevm.userDecryptEbool(handle, contractAddress, deployer);
    expect(clear).to.equal(true);
  });

  // =====================================================================
  //  Conditional & Random Benchmarks
  // =====================================================================

  it("benchmarkSelect: encrypted conditional select", async function () {
    const tx = await contract.benchmarkSelect(10, 20, true);
    const receipt = await tx.wait();
    gasResults.push({ operation: "select32", gas: receipt.gasUsed });

    const handle = await contract.getResultSelect();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(10n); // condition=true selects first
  });

  it("benchmarkRand32: random encrypted uint32 generation", async function () {
    const tx = await contract.benchmarkRand32();
    const receipt = await tx.wait();
    gasResults.push({ operation: "rand32", gas: receipt.gasUsed });

    // Random value — just verify it exists (handle is non-zero)
    const handle = await contract.getResultRand32();
    expect(handle).to.not.equal(0n);
  });

  // =====================================================================
  //  Min / Max Benchmarks
  // =====================================================================

  it("benchmarkMin: encrypted minimum", async function () {
    const tx = await contract.benchmarkMin(30, 70);
    const receipt = await tx.wait();
    gasResults.push({ operation: "min32", gas: receipt.gasUsed });

    const handle = await contract.getResultMin();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(30n);
  });

  it("benchmarkMax: encrypted maximum", async function () {
    const tx = await contract.benchmarkMax(30, 70);
    const receipt = await tx.wait();
    gasResults.push({ operation: "max32", gas: receipt.gasUsed });

    const handle = await contract.getResultMax();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, deployer);
    expect(clear).to.equal(70n);
  });
});
