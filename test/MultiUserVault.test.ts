import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("MultiUserVault", function () {
  let contract: any;
  let contractAddress: string;
  let alice: any;
  let bob: any;

  beforeEach(async function () {
    [alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("MultiUserVault");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  it("should deposit encrypted amount", async function () {
    const enc = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(1000)
      .encrypt();
    const tx = await contract.connect(alice).deposit(enc.handles[0], enc.inputProof);
    const receipt = await tx.wait();
    const event = receipt.logs.find((log: any) => log.fragment?.name === "Deposited");
    expect(event).to.not.be.undefined;
  });

  it("should read deposited balance", async function () {
    const enc = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(500)
      .encrypt();
    await (await contract.connect(alice).deposit(enc.handles[0], enc.inputProof)).wait();

    const handle = await contract.connect(alice).getMyDeposit();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint64, handle, contractAddress, alice);
    expect(clear).to.equal(500n);
  });

  it("should accumulate multiple deposits", async function () {
    const enc1 = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(300)
      .encrypt();
    await (await contract.connect(alice).deposit(enc1.handles[0], enc1.inputProof)).wait();

    const enc2 = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(200)
      .encrypt();
    await (await contract.connect(alice).deposit(enc2.handles[0], enc2.inputProof)).wait();

    const handle = await contract.connect(alice).getMyDeposit();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint64, handle, contractAddress, alice);
    expect(clear).to.equal(500n);
  });

  it("should withdraw within balance", async function () {
    const encDeposit = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(1000)
      .encrypt();
    await (
      await contract.connect(alice).deposit(encDeposit.handles[0], encDeposit.inputProof)
    ).wait();

    const encWithdraw = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(400)
      .encrypt();
    await (
      await contract.connect(alice).withdraw(encWithdraw.handles[0], encWithdraw.inputProof)
    ).wait();

    const handle = await contract.connect(alice).getMyDeposit();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint64, handle, contractAddress, alice);
    expect(clear).to.equal(600n);
  });

  it("should safely handle overdraft (withdraw 0)", async function () {
    const encDeposit = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(100)
      .encrypt();
    await (
      await contract.connect(alice).deposit(encDeposit.handles[0], encDeposit.inputProof)
    ).wait();

    const encWithdraw = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(9999)
      .encrypt();
    await (
      await contract.connect(alice).withdraw(encWithdraw.handles[0], encWithdraw.inputProof)
    ).wait();

    const handle = await contract.connect(alice).getMyDeposit();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint64, handle, contractAddress, alice);
    expect(clear).to.equal(100n);
  });

  it("should isolate users deposits", async function () {
    const encAlice = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(1000)
      .encrypt();
    await (await contract.connect(alice).deposit(encAlice.handles[0], encAlice.inputProof)).wait();

    const encBob = await fhevm
      .createEncryptedInput(contractAddress, bob.address)
      .add64(2000)
      .encrypt();
    await (await contract.connect(bob).deposit(encBob.handles[0], encBob.inputProof)).wait();

    const handleAlice = await contract.connect(alice).getMyDeposit();
    const clearAlice = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      handleAlice,
      contractAddress,
      alice,
    );
    expect(clearAlice).to.equal(1000n);

    const handleBob = await contract.connect(bob).getMyDeposit();
    const clearBob = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      handleBob,
      contractAddress,
      bob,
    );
    expect(clearBob).to.equal(2000n);
  });
});
