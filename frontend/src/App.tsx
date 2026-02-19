import React from "react";
import LessonViewer from "./LessonViewer";

const GITHUB_REPO = "https://github.com/Himess/fhevm-bootcamp";

const STATS = [
  { label: "Modules", value: "20" },
  { label: "Contracts", value: "35" },
  { label: "Tests", value: "328" },
  { label: "Slides", value: "20" },
  { label: "Quiz Questions", value: "215" },
  { label: "Hours", value: "~63h" },
];

const PHASES = [
  {
    title: "Week 1 — Foundation & Operations",
    modules: [
      { id: "00", name: "Prerequisites", desc: "Solidity, Hardhat, cryptography basics" },
      { id: "01", name: "Intro to FHE", desc: "What is FHE, Zama ecosystem, use cases" },
      { id: "02", name: "Development Setup", desc: "fhEVM toolchain, project structure" },
      { id: "03", name: "Encrypted Types", desc: "euint8–256, ebool, eaddress, ebytes" },
      { id: "04", name: "FHE Operations", desc: "Arithmetic, bitwise, comparison, shifts" },
    ],
  },
  {
    title: "Week 2 — Core Patterns",
    modules: [
      { id: "05", name: "Access Control (ACL)", desc: "FHE.allow, FHE.allowTransient, permissions" },
      { id: "06", name: "Encrypted Inputs", desc: "createEncryptedInput, inputProof, fromExternal" },
      { id: "07", name: "Decryption Patterns", desc: "makePubliclyDecryptable, userDecrypt, sealOutput" },
      { id: "08", name: "Conditional Logic", desc: "FHE.select, uniform execution, no branching" },
      { id: "09", name: "On-Chain Randomness", desc: "FHE.randEuintXX, commit-reveal, fair RNG" },
    ],
  },
  {
    title: "Week 3 — Applications & Testing",
    modules: [
      { id: "10", name: "Frontend Integration", desc: "React + Relayer SDK + encrypted transactions" },
      { id: "11", name: "Confidential ERC-20", desc: "Private balances, encrypted transfers, ERC-7984" },
      { id: "12", name: "Private Voting", desc: "Encrypted ballots, tallying, result reveal" },
      { id: "13", name: "Sealed-Bid Auction", desc: "Hidden bids, encrypted comparison, winner reveal" },
      { id: "14", name: "Testing & Debugging", desc: "fhEVM mock, createEncryptedInput in tests" },
    ],
  },
  {
    title: "Week 4 — Mastery & Capstone",
    modules: [
      { id: "15", name: "Gas Optimization", desc: "Type selection, batching, scalar ops, benchmarks" },
      { id: "16", name: "Security Best Practices", desc: "Silent-fail, timing attacks, ACL patterns" },
      { id: "17", name: "Advanced FHE Patterns", desc: "State machines, registries, cross-contract FHE" },
      { id: "18", name: "Confidential DeFi", desc: "Lending, order books, Zaiffer, cUSDT mainnet" },
      { id: "19", name: "ConfidentialDAO", desc: "Encrypted governance, proposals, voting, treasury" },
    ],
  },
];

// Flat list of all modules for navigation
const ALL_MODULES = PHASES.flatMap((p) => p.modules);

const CONTRACTS = [
  { name: "SimpleStorage", address: "0x8B7D25a45890d214db56790ae59afaE72273c1D3" },
  { name: "BasicToken", address: "0x790f57EA01ec1f903645723D6990Eeaa2a36a814" },
  { name: "HelloFHEVM", address: "0xbFd008661B7222Dd974074f986D1eb18dD4dF1F1" },
  { name: "EncryptedTypes", address: "0x56c52A3b621346DC47B7B2A4bE0230721EE48c12" },
  { name: "TypeConversions", address: "0x11c8ebc9A95B2A1DA4155b167dadA9B5925dde8f" },
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
  { name: "SimpleCounter", address: "0x17B6209385c2e36E6095b89572273175902547f9" },
  { name: "ConfidentialERC20", address: "0x623b1653AB004661BC7832AC2930Eb42607C4013" },
  { name: "ConfidentialVoting", address: "0xd80537D04652E1B4B591319d83812BbA6a9c1B14" },
  { name: "PrivateVoting", address: "0x70Aa742C113218a12A6582f60155c2B299551A43" },
  { name: "SealedBidAuction", address: "0xC53c8E05661450919951f51E4da829a3AABD76A2" },
  { name: "RevealableAuction", address: "0x8F1ae8209156C22dFD972352A415880040fB0b0c" },
  { name: "EncryptedMarketplace", address: "0x1E44074dF559E4f46De367ddbA0793fC710DB3a7" },
  { name: "EncryptedLottery", address: "0x32D3012EEE7e14175CA24Fc8e8dAb5b1Cebf929e" },
  { name: "TestableVault", address: "0xfa2a63616aDe3E5BE4abFEdAF8E58780eaF0feE9" },
  { name: "GasOptimized", address: "0x86daECb1Cc9Ce4862A8baFaF1f01aBe979a9b582" },
  { name: "GasBenchmark", address: "0x76da41a5bD46F428E32E79a081065697C5151693" },
  { name: "SecurityPatterns", address: "0x59f51Da1Df210745bf64aABA55D1b874B26001f2" },
  { name: "VulnerableDemo", address: "0x5AC6485D93CD0b90A7cF94eC706ef6e70DAEB778" },
  { name: "EncryptedStateMachine", address: "0x17259782D5dB2C13a8A385211f8BE6b1001d0378" },
  { name: "LastErrorPattern", address: "0x7f12c6D6b13C1E985D0efD1d79873c3e7F9c6c41" },
  { name: "EncryptedRegistry", address: "0xBF472B66b331303d9d7dF83195F7C355E332E137" },
  { name: "ConfidentialLending", address: "0x8B5526092F6a230E23651f0Eb559fd758C42967A" },
  { name: "EncryptedOrderBook", address: "0xB0fcA1f21d598006c5Bd327c44140a3471787E82" },
  { name: "ConfidentialDAO", address: "0x6C41b7E9b4e8fe2366Ba842f04E975ed7a4e9d72" },
];

const FEATURES = [
  { icon: "📖", title: "20 Lessons", desc: "Progressive curriculum from basics to DeFi" },
  { icon: "🎯", title: "20 Slide Decks", desc: "Marp presentation slides for each module" },
  { icon: "📝", title: "215 Quiz Questions", desc: "Interactive browser-based assessment" },
  { icon: "💻", title: "35 Contracts", desc: "All deployed on Ethereum Sepolia testnet" },
  { icon: "🧪", title: "328 Tests", desc: "Full Hardhat test suite, all passing" },
  { icon: "🏗️", title: "18 Exercises", desc: "Hands-on coding with solution files" },
  { icon: "📚", title: "Instructor Guide", desc: "943-line teaching companion" },
  { icon: "🐳", title: "Docker Support", desc: "One-command reproducible environment" },
];

const QUICK_LINKS = [
  { label: "GitHub Repository", url: GITHUB_REPO, icon: "📦" },
  { label: "Interactive Quiz", url: "/quiz/index.html", icon: "📝" },
  { label: "Homework & Grading", url: `${GITHUB_REPO}/blob/main/curriculum/HOMEWORK.md`, icon: "📄" },
  { label: "Syllabus", url: `${GITHUB_REPO}/blob/main/curriculum/SYLLABUS.md`, icon: "📋" },
  { label: "Instructor Guide", url: `${GITHUB_REPO}/blob/main/curriculum/INSTRUCTOR_GUIDE.md`, icon: "👨‍🏫" },
  { label: "Cheatsheet", url: `${GITHUB_REPO}/blob/main/resources/CHEATSHEET.md`, icon: "⚡" },
];

// Map module IDs to their folder names for slide links
const MODULE_FOLDERS: Record<string, string> = {
  "00": "00-prerequisites", "01": "01-intro-to-fhe", "02": "02-development-setup",
  "03": "03-encrypted-types", "04": "04-operations", "05": "05-access-control",
  "06": "06-encrypted-inputs", "07": "07-decryption", "08": "08-conditional-logic",
  "09": "09-random", "10": "10-frontend-integration", "11": "11-project-erc20",
  "12": "12-project-voting", "13": "13-project-auction", "14": "14-testing-debugging",
  "15": "15-gas-optimization", "16": "16-security", "17": "17-advanced-patterns",
  "18": "18-confidential-defi", "19": "19-capstone",
};

export default function App() {
  const [showAllContracts, setShowAllContracts] = React.useState(false);
  const [selectedModule, setSelectedModule] = React.useState<string | null>(null);
  const displayedContracts = showAllContracts ? CONTRACTS : CONTRACTS.slice(0, 10);

  const selectedIdx = selectedModule ? ALL_MODULES.findIndex((m) => m.id === selectedModule) : -1;
  const selectedMod = selectedIdx >= 0 ? ALL_MODULES[selectedIdx] : null;

  const openLesson = (moduleId: string) => {
    setSelectedModule(moduleId);
    document.body.style.overflow = "hidden";
  };

  const closeLesson = () => {
    setSelectedModule(null);
    document.body.style.overflow = "";
  };

  const navigateLesson = (direction: "prev" | "next") => {
    const newIdx = direction === "prev" ? selectedIdx - 1 : selectedIdx + 1;
    if (newIdx >= 0 && newIdx < ALL_MODULES.length) {
      setSelectedModule(ALL_MODULES[newIdx].id);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="header-logo">Z</div>
            <div>
              <div className="header-title">FHEVM Bootcamp</div>
              <div className="header-subtitle">Zama Developer Program</div>
            </div>
          </div>
          <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
            View on GitHub
          </a>
        </div>
      </header>

      <main className="main">
        {/* Hero */}
        <div className="hero">
          <div className="hero-badge">Ethereum Sepolia Testnet</div>
          <h1>The Complete FHEVM Bootcamp</h1>
          <p>
            A comprehensive 20-module curriculum for building confidential smart contracts
            with Zama's Fully Homomorphic Encryption Virtual Machine.
          </p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {STATS.map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-card-value">{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <section className="section">
          <h2 className="section-title">Quick Links</h2>
          <div className="links-grid">
            {QUICK_LINKS.map((l) => (
              <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" className="link-card">
                <span className="link-icon">{l.icon}</span>
                <span className="link-label">{l.label}</span>
              </a>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="section">
          <h2 className="section-title">What's Included</h2>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-card-icon">{f.icon}</div>
                <div className="feature-card-title">{f.title}</div>
                <div className="feature-card-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Curriculum */}
        <section className="section">
          <h2 className="section-title">4-Week Curriculum — 20 Modules</h2>
          {PHASES.map((phase) => (
            <div key={phase.title} className="phase">
              <h3 className="phase-title">{phase.title}</h3>
              <div className="modules-list">
                {phase.modules.map((m) => (
                  <div key={m.id} className="module-card">
                    <div className="module-id">{m.id}</div>
                    <div className="module-info">
                      <div className="module-name">{m.name}</div>
                      <div className="module-desc">{m.desc}</div>
                    </div>
                    <div className="module-actions">
                      <button
                        className="module-btn module-btn-lesson"
                        onClick={() => openLesson(m.id)}
                        title="Open lesson"
                      >
                        Lesson
                      </button>
                      <button
                        className="module-btn module-btn-exercise"
                        onClick={() => { setSelectedModule(m.id); document.body.style.overflow = "hidden"; }}
                        title="Open exercise"
                      >
                        Exercise
                      </button>
                      <a
                        href={`/slides/${MODULE_FOLDERS[m.id]}.html`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="module-btn module-btn-slide"
                        title="View slides"
                      >
                        Slides
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Deployed Contracts */}
        <section className="section">
          <h2 className="section-title">35 Deployed Contracts — Ethereum Sepolia</h2>
          <div className="contracts-table">
            <div className="contracts-header">
              <span>Contract</span>
              <span>Address</span>
            </div>
            {displayedContracts.map((c) => (
              <div key={c.name} className="contract-row">
                <span className="contract-name">{c.name}</span>
                <a
                  href={`https://sepolia.etherscan.io/address/${c.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contract-address"
                >
                  {c.address.slice(0, 6)}...{c.address.slice(-4)}
                </a>
              </div>
            ))}
            {!showAllContracts && (
              <button className="btn btn-secondary btn-sm show-more" onClick={() => setShowAllContracts(true)}>
                Show all 35 contracts
              </button>
            )}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="section">
          <h2 className="section-title">Tech Stack</h2>
          <div className="tech-grid">
            {[
              "@fhevm/solidity v0.10",
              "@fhevm/hardhat-plugin v0.4",
              "@zama-fhe/relayer-sdk v0.4",
              "Solidity 0.8.27",
              "Hardhat + TypeScript",
              "React + Vite",
              "Marp Slides",
              "Docker",
            ].map((t) => (
              <div key={t} className="tech-tag">{t}</div>
            ))}
          </div>
        </section>

        <footer className="footer">
          Built for the{" "}
          <a href="https://www.zama.org/developer-hub" target="_blank" rel="noopener noreferrer">
            Zama Developer Program
          </a>{" "}
          — Bounty Track
        </footer>
      </main>

      {/* Lesson Viewer Modal */}
      {selectedMod && (
        <LessonViewer
          moduleId={selectedMod.id}
          moduleName={selectedMod.name}
          moduleFolder={MODULE_FOLDERS[selectedMod.id]}
          onClose={closeLesson}
          onNavigate={navigateLesson}
          hasPrev={selectedIdx > 0}
          hasNext={selectedIdx < ALL_MODULES.length - 1}
        />
      )}
    </div>
  );
}
