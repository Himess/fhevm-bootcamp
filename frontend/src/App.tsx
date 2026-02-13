import React, { useState, useCallback } from "react";
import Header from "./components/Header";
import CounterPanel from "./components/CounterPanel";
import TokenPanel from "./components/TokenPanel";
import { CHAIN_ID, CHAIN_ID_HEX, SEPOLIA_NETWORK } from "./config";
import { initFhevm } from "./fhevm";

export default function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask is not installed. Please install it to continue.");
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      // Request accounts
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      // Check network and switch if needed
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (parseInt(chainId, 16) !== CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: CHAIN_ID_HEX }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [SEPOLIA_NETWORK],
            });
          } else {
            throw switchError;
          }
        }
      }

      // Initialize Relayer SDK
      await initFhevm();

      setAccount(accounts[0]);
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setError(null);
  }, []);

  return (
    <div className="app">
      <Header
        account={account}
        onConnect={connect}
        onDisconnect={disconnect}
        connecting={connecting}
      />

      <main className="main">
        {!account ? (
          /* ===== Connect Screen ===== */
          <div className="connect-screen">
            <div className="connect-icon">🔐</div>
            <h2>Confidential Smart Contracts</h2>
            <p>
              Interact with encrypted on-chain data. Your inputs are encrypted
              client-side using FHE before being sent to the blockchain.
            </p>
            <button
              className="btn btn-primary btn-lg"
              onClick={connect}
              disabled={connecting}
            >
              {connecting && <span className="spinner" />}
              {connecting ? "Connecting..." : "Connect MetaMask"}
            </button>
            {error && (
              <div className="status status-error">{error}</div>
            )}
            <div className="features">
              <div className="feature-item">
                <div className="feature-icon">🔒</div>
                <div className="feature-label">Encrypted Inputs</div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">⚡</div>
                <div className="feature-label">On-Chain FHE</div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">👁️</div>
                <div className="feature-label">Private Decrypt</div>
              </div>
            </div>
          </div>
        ) : (
          /* ===== Connected — Panels ===== */
          <>
            <div className="hero">
              <div className="hero-badge">Ethereum Sepolia Testnet</div>
              <h1>FHEVM Interactive Demo</h1>
              <p>
                Encrypt values client-side, send transactions with encrypted data,
                and decrypt results — all powered by Fully Homomorphic Encryption.
              </p>
            </div>

            <div className="info-banner">
              <span className="info-banner-icon">💡</span>
              <span>
                All values are encrypted using the <strong>Relayer SDK</strong> before
                being sent on-chain. The blockchain never sees your plaintext data.
              </span>
            </div>

            <CounterPanel account={account} />
            <TokenPanel account={account} />

            <footer className="footer">
              Built with{" "}
              <a
                href="https://docs.zama.ai/fhevm"
                target="_blank"
                rel="noopener noreferrer"
              >
                Zama fhEVM
              </a>{" "}
              — FHEVM Bootcamp Curriculum
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
