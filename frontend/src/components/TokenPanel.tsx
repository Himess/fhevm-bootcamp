import React, { useState, useEffect } from "react";
import { Contract, BrowserProvider } from "ethers";
import { CONTRACTS } from "../config";
import { createEncryptedInput } from "../fhevm";

interface Props {
  account: string;
}

export default function TokenPanel({ account }: Props) {
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [totalSupply, setTotalSupply] = useState<string>("0");
  const [balanceHandle, setBalanceHandle] = useState<string | null>(null);
  const [recipient, setRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("100");
  const [mintAmount, setMintAmount] = useState("1000");
  const [isOwner, setIsOwner] = useState(false);
  const [status, setStatus] = useState<{ type: string; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { address, abi } = CONTRACTS.ConfidentialERC20;

  useEffect(() => {
    loadTokenInfo();
  }, [account]);

  async function loadTokenInfo() {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(address, abi, provider);
      const [name, symbol, supply, owner] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.totalSupply(),
        contract.owner(),
      ]);
      setTokenName(name);
      setTokenSymbol(symbol);
      setTotalSupply(supply.toString());
      setIsOwner(owner.toLowerCase() === account.toLowerCase());
    } catch {
      // Contract may not be deployed or accessible
    }
  }

  async function handleReadBalance() {
    setLoading(true);
    setStatus({ type: "loading", msg: "Reading encrypted balance..." });

    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(address, abi, provider);
      const handle = await contract.balanceOf(account);

      if (handle === 0n || handle === "0x" + "0".repeat(64)) {
        setBalanceHandle("0");
        setStatus({ type: "success", msg: "Balance is zero" });
      } else {
        setBalanceHandle(handle.toString().slice(0, 16) + "...");
        setStatus({ type: "success", msg: "Encrypted balance handle retrieved" });
      }
    } catch (err: any) {
      setStatus({ type: "error", msg: err.reason || err.message || "Read failed" });
    } finally {
      setLoading(false);
    }
  }

  async function handleMint() {
    setLoading(true);
    setStatus({ type: "loading", msg: "Minting tokens..." });
    setTxHash(null);

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(address, abi, signer);

      const tx = await contract.mint(account, parseInt(mintAmount) || 1000);
      setStatus({ type: "loading", msg: "Waiting for confirmation..." });
      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      setStatus({ type: "success", msg: `Minted ${mintAmount} ${tokenSymbol}!` });
      loadTokenInfo();
    } catch (err: any) {
      setStatus({ type: "error", msg: err.reason || err.message || "Mint failed" });
    } finally {
      setLoading(false);
    }
  }

  async function handleTransfer() {
    if (!recipient) {
      setStatus({ type: "error", msg: "Enter a recipient address" });
      return;
    }

    setLoading(true);
    setStatus({ type: "loading", msg: "Encrypting transfer amount with FHE..." });
    setTxHash(null);

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(address, abi, signer);

      // Encrypt the transfer amount
      const input = await createEncryptedInput(address, account);
      input.add64(parseInt(transferAmount) || 100);
      const encrypted = await input.encrypt();

      setStatus({ type: "loading", msg: "Sending encrypted transfer..." });
      const tx = await contract.transfer(encrypted.handles[0], encrypted.inputProof, recipient);

      setStatus({ type: "loading", msg: "Waiting for confirmation..." });
      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      setStatus({ type: "success", msg: "Transfer sent! Amount is hidden on-chain." });
    } catch (err: any) {
      setStatus({ type: "error", msg: err.reason || err.message || "Transfer failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-icon" style={{ background: "var(--yellow-100)" }}>$</div>
          <div>
            <div className="card-title">
              Confidential Token {tokenName && `— ${tokenName}`}
            </div>
            <div className="card-desc">ConfidentialERC20.sol — Module 11</div>
          </div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={handleReadBalance} disabled={loading}>
          Balance
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-item">
          <div className="stat-label">Your Balance</div>
          <div className={`stat-value ${balanceHandle ? "encrypted" : ""}`} style={{ fontSize: balanceHandle && balanceHandle.length > 8 ? "0.875rem" : "1.5rem" }}>
            {balanceHandle || "—"}
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Total Supply</div>
          <div className="stat-value" style={{ fontSize: "1.25rem" }}>
            {totalSupply}
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Symbol</div>
          <div className="stat-value" style={{ fontSize: "1.25rem", color: "var(--yellow-600)" }}>
            {tokenSymbol || "—"}
          </div>
        </div>
      </div>

      <div className="card-body">
        {/* Mint Section (owner only) */}
        {isOwner && (
          <div style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--border-light)" }}>
            <div className="input-label" style={{ marginBottom: "6px" }}>Mint Tokens (Owner)</div>
            <div className="input-group">
              <input
                className="input"
                type="number"
                min="1"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                placeholder="Amount to mint"
                disabled={loading}
              />
              <button className="btn btn-secondary" onClick={handleMint} disabled={loading}>
                {loading && <span className="spinner" />}
                Mint
              </button>
            </div>
          </div>
        )}

        {/* Transfer Section */}
        <div className="input-label" style={{ marginBottom: "6px" }}>Encrypted Transfer</div>
        <div className="input-group">
          <div className="input-with-label" style={{ flex: 2 }}>
            <label className="input-label">Recipient</label>
            <input
              className="input"
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              disabled={loading}
            />
          </div>
          <div className="input-with-label">
            <label className="input-label">Amount</label>
            <input
              className="input"
              type="number"
              min="1"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={handleTransfer} disabled={loading}>
            {loading && <span className="spinner" />}
            Encrypt & Transfer
          </button>
        </div>

        {status && (
          <div className={`status status-${status.type}`}>
            {status.type === "loading" && <span className="spinner" />}
            {status.msg}
          </div>
        )}

        {txHash && (
          <div style={{ marginTop: "8px", fontSize: "0.8125rem" }}>
            Tx:{" "}
            <a
              className="tx-link"
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {txHash.slice(0, 10)}...{txHash.slice(-6)}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
