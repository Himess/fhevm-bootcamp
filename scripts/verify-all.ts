import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface Contract {
  name: string;
  address: string;
  args?: string[];
}

const contracts: Contract[] = [
  // Phase 1 — Foundation
  { name: "SimpleStorage", address: "0x8B7D25a45890d214db56790ae59afaE72273c1D3" },
  { name: "BasicToken", address: "0x790f57EA01ec1f903645723D6990Eeaa2a36a814", args: ["BootcampToken", "BCT", "18"] },
  { name: "HelloFHEVM", address: "0xbFd008661B7222Dd974074f986D1eb18dD4dF1F1" },
  { name: "EncryptedTypes", address: "0x56c52A3b621346DC47B7B2A4bE0230721EE48c12" },
  { name: "TypeConversions", address: "0x11c8ebc9A95B2A1DA4155b167dadA9B5925dde8f" },

  // Phase 2 — Core
  { name: "ArithmeticOps", address: "0xB6D81352EA3Cd0426838B655D15097E0FaE80177" },
  { name: "BitwiseOps", address: "0xb0bd1D30eDfaAbA1fc02F7A917820fD9edB24438" },
  { name: "ComparisonOps", address: "0xB1141F0b2588aAb0C1fe819b1B6AF1C0a7564490" },
  { name: "ACLDemo", address: "0xc4f08eB557DF912E3D1FdE79bf3465d5242ea53d" },
  { name: "MultiUserVault", address: "0xa988F5BFD7Fc19481Fdac5b55027b7Dc126a67e6" },
  { name: "SecureInput", address: "0x27d2b5247949606f913Db8c314EABB917fcffd96" },
  { name: "PublicDecrypt", address: "0x605002BbB689457101104e8Ee3C76a8d5D23e5c8" },
  { name: "UserDecrypt", address: "0x5E3ef9A91AD33270f84B32ACFF91068Eea44c5ee" },
  { name: "ConditionalDemo", address: "0x0A206f2BC275012703BA262B9577ABC49A4f6782" },
  { name: "EncryptedMinMax", address: "0xbA5c38093CefBbFA08577b08b0494D5c7738E4F6" },
  { name: "RandomDemo", address: "0xe473aF953d269601402DEBcB2cc899aB594Ad31e" },

  // Phase 3 — Applications
  { name: "SimpleCounter", address: "0x17B6209385c2e36E6095b89572273175902547f9" },
  { name: "ConfidentialERC20", address: "0x623b1653AB004661BC7832AC2930Eb42607C4013", args: ["ConfToken", "CFT"] },
  { name: "ConfidentialVoting", address: "0xd80537D04652E1B4B591319d83812BbA6a9c1B14" },
  { name: "PrivateVoting", address: "0x70Aa742C113218a12A6582f60155c2B299551A43", args: ["3"] },
  { name: "SealedBidAuction", address: "0xC53c8E05661450919951f51E4da829a3AABD76A2" },
  { name: "RevealableAuction", address: "0x8F1ae8209156C22dFD972352A415880040fB0b0c" },
  { name: "EncryptedMarketplace", address: "0x1E44074dF559E4f46De367ddbA0793fC710DB3a7" },
  { name: "EncryptedLottery", address: "0x32D3012EEE7e14175CA24Fc8e8dAb5b1Cebf929e", args: ["1000000000000000", "3600"] },

  // Phase 4 — Mastery
  { name: "TestableVault", address: "0xfa2a63616aDe3E5BE4abFEdAF8E58780eaF0feE9" },
  { name: "GasOptimized", address: "0x86daECb1Cc9Ce4862A8baFaF1f01aBe979a9b582" },
  { name: "GasBenchmark", address: "0x76da41a5bD46F428E32E79a081065697C5151693" },
  { name: "SecurityPatterns", address: "0x59f51Da1Df210745bf64aABA55D1b874B26001f2", args: ["5", "10"] },
  { name: "VulnerableDemo", address: "0x5AC6485D93CD0b90A7cF94eC706ef6e70DAEB778" },
  { name: "EncryptedStateMachine", address: "0x17259782D5dB2C13a8A385211f8BE6b1001d0378" },
  { name: "LastErrorPattern", address: "0x7f12c6D6b13C1E985D0efD1d79873c3e7F9c6c41", args: ["ErrorToken", "ERR"] },
  { name: "EncryptedRegistry", address: "0xBF472B66b331303d9d7dF83195F7C355E332E137" },
  { name: "ConfidentialLending", address: "0x8B5526092F6a230E23651f0Eb559fd758C42967A" },
  { name: "EncryptedOrderBook", address: "0xB0fcA1f21d598006c5Bd327c44140a3471787E82" },

  // Phase 5 — Capstone
  { name: "ConfidentialDAO", address: "0x6C41b7E9b4e8fe2366Ba842f04E975ed7a4e9d72", args: ["BootcampDAO"] },
];

async function main() {
  console.log("=".repeat(60));
  console.log("Etherscan Verification — 35 Contracts");
  console.log("=".repeat(60));

  let verified = 0;
  let failed = 0;
  let alreadyVerified = 0;

  for (const c of contracts) {
    const argsStr = c.args ? ` ${c.args.map(a => `"${a}"`).join(" ")}` : "";
    const cmd = `npx hardhat verify --network sepolia ${c.address}${argsStr}`;

    process.stdout.write(`[${verified + failed + alreadyVerified + 1}/35] ${c.name}...`);

    try {
      const { stdout, stderr } = await execAsync(cmd, { timeout: 60000 });
      const output = stdout + stderr;

      if (output.includes("Already Verified") || output.includes("already verified")) {
        console.log(" ALREADY VERIFIED");
        alreadyVerified++;
      } else if (output.includes("Successfully verified") || output.includes("successfully verified")) {
        console.log(" VERIFIED");
        verified++;
      } else {
        console.log(` OK (${output.slice(0, 80).trim()})`);
        verified++;
      }
    } catch (error: any) {
      const msg = (error.stdout || "") + (error.stderr || "") + (error.message || "");
      if (msg.includes("Already Verified") || msg.includes("already verified")) {
        console.log(" ALREADY VERIFIED");
        alreadyVerified++;
      } else {
        console.log(` FAILED: ${msg.slice(0, 120).trim()}`);
        failed++;
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`Verified: ${verified} | Already: ${alreadyVerified} | Failed: ${failed} | Total: ${contracts.length}`);
  console.log("=".repeat(60));
}

main();
