import React from "react";

// This component demonstrates the fhevmjs encryption flow step-by-step
// without requiring a real wallet connection — it's an educational walkthrough
// showing how encrypted inputs are created and sent to fhEVM contracts.

interface Step {
  id: number;
  title: string;
  description: string;
  code: string;
  output: string;
}

const ENCRYPTION_STEPS: Step[] = [
  {
    id: 1,
    title: "1. Initialize fhevmjs",
    description:
      "The fhevmjs library loads a WASM module that performs client-side FHE encryption. " +
      "This happens in the browser — no server needed. The WASM binary contains the FHE public key.",
    code: `import { createInstance } from "fhevmjs/web";

// Initialize the FHE instance with the network's public key
const instance = await createInstance({
  networkUrl: "https://rpc.sepolia.org",
  gatewayUrl: "https://gateway.sepolia.zama.ai",
});`,
    output: "FHE instance created with WASM encryption engine loaded",
  },
  {
    id: 2,
    title: "2. Create Encrypted Input",
    description:
      "createEncryptedInput() prepares a builder that will encrypt values for a specific contract. " +
      "The contract address and user address are bound into the ciphertext for replay protection.",
    code: `// Create an encrypted input builder
// contractAddress: the target contract that will receive the ciphertext
// userAddress: the sender (prevents replay by another user)
const input = instance.createEncryptedInput(
  contractAddress,
  userAddress
);`,
    output: "EncryptedInput builder created (bound to contract + user)",
  },
  {
    id: 3,
    title: "3. Add Values to Encrypt",
    description:
      "Chain add methods to include values. Each method corresponds to an fhEVM type. " +
      "Multiple values can be batched into a single proof for gas efficiency.",
    code: `// Add a uint64 value to encrypt (e.g., transfer amount)
input.addUint64(1000);

// You can add multiple values in a single encrypted input:
// input.addBool(true);
// input.addUint8(42);
// input.addAddress("0x...");`,
    output: "Value 1000 queued for encryption as euint64",
  },
  {
    id: 4,
    title: "4. Encrypt & Get Handles + Proof",
    description:
      "encrypt() runs the FHE encryption in WASM, producing an inputProof (the encrypted data + ZK proof) " +
      "and handles (references to each encrypted value). The proof ensures the ciphertext is well-formed.",
    code: `// Perform the actual FHE encryption (WASM computation)
const encrypted = await input.encrypt();

// encrypted.handles[0] → bytes32 handle for the first value
// encrypted.inputProof → bytes proof for all values
console.log("Handle:", encrypted.handles[0]);
console.log("Proof length:", encrypted.inputProof.length);`,
    output:
      "Handle: 0x3a7f...c9e2 (32 bytes)\nProof length: 2048 bytes (FHE ciphertext + ZK proof)",
  },
  {
    id: 5,
    title: "5. Send to Contract",
    description:
      "The encrypted handle and proof are sent to the smart contract as function parameters. " +
      "The contract calls FHE.fromExternal() to convert the external handle into an on-chain euint64.",
    code: `// Send the encrypted value to the smart contract
const tx = await contract.transfer(
  recipientAddress,
  encrypted.handles[0],  // externalEuint64 handle
  encrypted.inputProof   // bytes proof
);
await tx.wait();

// On-chain, the contract does:
// euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);`,
    output: "Transaction sent! Contract received encrypted value and verified proof on-chain.",
  },
  {
    id: 6,
    title: "6. Decrypt Result (User)",
    description:
      "After the contract processes the encrypted value, the user can request decryption " +
      "of their own data using the Relayer SDK. Only ACL-authorized users can decrypt.",
    code: `// Get the encrypted result handle from the contract
const balanceHandle = await contract.balanceOf(userAddress);

// Request decryption via the Relayer SDK
// This contacts the KMS which performs threshold decryption
const balance = await instance.reencrypt(
  balanceHandle,
  userPrivateKey,    // User's secp256k1 key for re-encryption
  contractAddress,
  userAddress
);

console.log("Decrypted balance:", balance);`,
    output: "Decrypted balance: 1000 (only the authorized user can see this)",
  },
];

const CONTRACT_DEMOS = [
  {
    name: "Confidential ERC-20 Transfer",
    description: "Transfer tokens with encrypted amounts — observers see a transaction but not the value.",
    steps: [
      "Alice encrypts amount=500 using fhevmjs",
      "Alice calls token.transfer(bob, encryptedAmount, proof)",
      "Contract: FHE.fromExternal() converts to euint64",
      "Contract: FHE.select() transfers if balance sufficient, 0 otherwise",
      "Contract: FHE.allow() grants Bob access to his new balance",
      "Bob decrypts his balance to verify receipt",
    ],
    solidity: `function transfer(address to, externalEuint64 encAmount, bytes calldata proof) external {
    euint64 amount = FHE.fromExternal(encAmount, proof);
    ebool sufficient = FHE.ge(_balances[msg.sender], amount);
    euint64 transferAmount = FHE.select(sufficient, amount, FHE.asEuint64(0));
    _balances[msg.sender] = FHE.sub(_balances[msg.sender], transferAmount);
    _balances[to] = FHE.add(_balances[to], transferAmount);
    FHE.allowThis(_balances[to]);
    FHE.allow(_balances[to], to);
}`,
  },
  {
    name: "Sealed-Bid Auction",
    description: "Place encrypted bids — no one sees your bid until the auction ends.",
    steps: [
      "Bidder encrypts their bid amount using fhevmjs",
      "Bidder calls auction.placeBid(encryptedBid, proof) with ETH deposit",
      "Contract stores encrypted bid, compares with current highest (FHE.gt)",
      "Contract uses FHE.select to update highest bid without revealing values",
      "After deadline, owner calls reveal() with FHE.makePubliclyDecryptable()",
      "Winner is announced, losers can withdraw deposits",
    ],
    solidity: `function placeBid(externalEuint64 encBid, bytes calldata proof) external payable {
    require(msg.value >= MINIMUM_DEPOSIT, "Deposit required");
    euint64 bid = FHE.fromExternal(encBid, proof);
    ebool isHigher = FHE.gt(bid, highestBid);
    highestBid = FHE.select(isHigher, bid, highestBid);
    // Winner address updated via encrypted comparison
    FHE.allowThis(highestBid);
}`,
  },
  {
    name: "Private Voting",
    description: "Vote with encrypted ballots — votes are tallied without revealing individual choices.",
    steps: [
      "Voter encrypts their choice (0 or 1) using fhevmjs",
      "Voter calls voting.castVote(encryptedVote, proof)",
      "Contract: FHE.fromExternal() + FHE.add() accumulates encrypted tally",
      "No one can see individual votes — only encrypted sum exists",
      "After deadline, FHE.makePubliclyDecryptable() reveals final count",
      "KMS threshold decryption reveals the result",
    ],
    solidity: `function castVote(externalEuint64 encVote, bytes calldata proof) external {
    require(!hasVoted[msg.sender], "Already voted");
    euint64 vote = FHE.fromExternal(encVote, proof);
    // Encrypted accumulation — individual votes never revealed
    yesVotes = FHE.add(yesVotes, vote);
    hasVoted[msg.sender] = true;
    FHE.allowThis(yesVotes);
}`,
  },
];

interface Props {
  onClose: () => void;
}

export default function InteractiveDemo({ onClose }: Props) {
  const [activeStep, setActiveStep] = React.useState(0);
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(new Set());
  const [activeContract, setActiveContract] = React.useState(0);
  const [tab, setTab] = React.useState<"encryption" | "contracts">("encryption");
  const viewerRef = React.useRef<HTMLDivElement>(null);

  const handleStepClick = (idx: number) => {
    setActiveStep(idx);
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      // Mark all steps up to and including this one as completed
      for (let i = 0; i <= idx; i++) next.add(i);
      return next;
    });
  };

  // Keyboard: Escape to close
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const step = ENCRYPTION_STEPS[activeStep];
  const demo = CONTRACT_DEMOS[activeContract];

  return (
    <div className="lesson-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Interactive FHE Demo">
      <div className="demo-viewer" onClick={(e) => e.stopPropagation()} ref={viewerRef}>
        <div className="demo-header">
          <div className="demo-header-left">
            <span className="lesson-module-badge">DEMO</span>
            <span className="lesson-module-name">Interactive FHE Walkthrough</span>
          </div>
          <div className="lesson-tabs" role="tablist">
            <button
              className={`lesson-tab ${tab === "encryption" ? "lesson-tab-active" : ""}`}
              onClick={() => setTab("encryption")}
              role="tab"
              aria-selected={tab === "encryption"}
            >
              Encryption Flow
            </button>
            <button
              className={`lesson-tab ${tab === "contracts" ? "lesson-tab-active" : ""}`}
              onClick={() => setTab("contracts")}
              role="tab"
              aria-selected={tab === "contracts"}
            >
              Contract Demos
            </button>
          </div>
          <button className="lesson-close" onClick={onClose} aria-label="Close demo">
            &times;
          </button>
        </div>

        <div className="demo-body">
          {tab === "encryption" ? (
            <div className="demo-encryption">
              {/* Step sidebar */}
              <div className="demo-steps-sidebar">
                <div className="demo-steps-title">fhevmjs Encryption Pipeline</div>
                {ENCRYPTION_STEPS.map((s, idx) => (
                  <button
                    key={s.id}
                    className={`demo-step-btn ${idx === activeStep ? "demo-step-active" : ""} ${completedSteps.has(idx) ? "demo-step-done" : ""}`}
                    onClick={() => handleStepClick(idx)}
                  >
                    <span className="demo-step-num">
                      {completedSteps.has(idx) ? "\u2713" : s.id}
                    </span>
                    <span className="demo-step-label">{s.title.replace(/^\d+\.\s*/, "")}</span>
                  </button>
                ))}
                <div className="demo-progress-text">
                  {completedSteps.size}/{ENCRYPTION_STEPS.length} steps explored
                </div>
              </div>

              {/* Step content */}
              <div className="demo-step-content">
                <h3 className="demo-step-title">{step.title}</h3>
                <p className="demo-step-desc">{step.description}</p>
                <div className="demo-code-block">
                  <div className="demo-code-label">Code</div>
                  <pre className="demo-code">{step.code}</pre>
                </div>
                <div className="demo-output-block">
                  <div className="demo-output-label">Output</div>
                  <pre className="demo-output">{step.output}</pre>
                </div>
                <div className="demo-step-nav">
                  <button
                    className="lesson-nav-btn"
                    disabled={activeStep === 0}
                    onClick={() => handleStepClick(activeStep - 1)}
                  >
                    &larr; Previous
                  </button>
                  <button
                    className="lesson-nav-btn"
                    disabled={activeStep === ENCRYPTION_STEPS.length - 1}
                    onClick={() => handleStepClick(activeStep + 1)}
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="demo-contracts">
              {/* Contract selector */}
              <div className="demo-contract-tabs">
                {CONTRACT_DEMOS.map((d, idx) => (
                  <button
                    key={d.name}
                    className={`demo-contract-tab ${idx === activeContract ? "demo-contract-tab-active" : ""}`}
                    onClick={() => setActiveContract(idx)}
                  >
                    {d.name}
                  </button>
                ))}
              </div>

              {/* Contract content */}
              <div className="demo-contract-content">
                <h3 className="demo-step-title">{demo.name}</h3>
                <p className="demo-step-desc">{demo.description}</p>

                <div className="demo-flow-section">
                  <div className="demo-flow-label">Step-by-Step Flow</div>
                  <ol className="demo-flow-steps">
                    {demo.steps.map((s, idx) => (
                      <li key={idx} className="demo-flow-step">{s}</li>
                    ))}
                  </ol>
                </div>

                <div className="demo-code-block">
                  <div className="demo-code-label">Solidity (Key Function)</div>
                  <pre className="demo-code">{demo.solidity}</pre>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lesson-footer">
          <span className="lesson-footer-hint">ESC to close | Explore each step to learn the FHE flow</span>
        </div>
      </div>
    </div>
  );
}
