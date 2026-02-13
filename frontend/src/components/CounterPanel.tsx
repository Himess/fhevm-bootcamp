import React, { useState } from "react";
import { Contract, BrowserProvider } from "ethers";
import { CONTRACTS } from "../config";
import { createEncryptedInput } from "../fhevm";

interface Props {
  account: string;
}

export default function CounterPanel({ account }: Props) {
  const [amount, setAmount] = useState("1");
  const [count, setCount] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: string; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { address, abi } = CONTRACTS.SimpleCounter;

  async function handleIncrement() {
    setLoading(true);
    setStatus({ type: "loading", msg: "Encrypting input with FHE..." });
    setTxHash(null);

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(address, abi, signer);

      // Encrypt the input value using Relayer SDK
      const input = await createEncryptedInput(address, account);
      input.add32(parseInt(amount) || 1);
      const encrypted = await input.encrypt();

      setStatus({ type: "loading", msg: "Sending encrypted transaction..." });
      const tx = await contract.increment(encrypted.handles[0], encrypted.inputProof);

      setStatus({ type: "loading", msg: "Waiting for confirmation..." });
      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      setStatus({ type: "success", msg: "Counter incremented successfully!" });
    } catch (err: any) {
      setStatus({ type: "error", msg: err.reason || err.message || "Transaction failed" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDecrypt() {
    setLoading(true);
    setStatus({ type: "loading", msg: "Reading encrypted counter..." });

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(address, abi, signer);

      const handle = await contract.getMyCount();

      if (handle === 0n || handle === "0x" + "0".repeat(64)) {
        setCount("0");
        setStatus({ type: "success", msg: "Counter is zero (no increments yet)" });
      } else {
        // In a real FHEVM network, we would use re-encryption here:
        // const instance = await initFhevm();
        // const clearValue = await instance.userDecrypt(handles, contractAddress, signer);
        setCount(handle.toString());
        setStatus({ type: "success", msg: "Encrypted handle retrieved. Use re-encryption to decrypt." });
      }
    } catch (err: any) {
      setStatus({ type: "error", msg: err.reason || err.message || "Read failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-icon">#</div>
          <div>
            <div className="card-title">Encrypted Counter</div>
            <div className="card-desc">SimpleCounter.sol — Module 10</div>
          </div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={handleDecrypt} disabled={loading}>
          Read
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-item">
          <div className="stat-label">Your Count</div>
          <div className={`stat-value ${count !== null ? "encrypted" : ""}`}>
            {count !== null ? count : "—"}
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Encryption</div>
          <div className="stat-value" style={{ fontSize: "1rem", color: "var(--success)" }}>
            euint32
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Contract</div>
          <div className="stat-value" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        </div>
      </div>

      <div className="card-body">
        <div className="input-group">
          <div className="input-with-label">
            <label className="input-label">Increment Amount</label>
            <input
              className="input"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              disabled={loading}
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button className="btn btn-primary" onClick={handleIncrement} disabled={loading}>
              {loading && <span className="spinner" />}
              Encrypt & Send
            </button>
          </div>
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
