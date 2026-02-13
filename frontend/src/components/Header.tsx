import React from "react";

interface HeaderProps {
  account: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  connecting: boolean;
}

export default function Header({ account, onConnect, onDisconnect, connecting }: HeaderProps) {
  const shortAddress = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : "";

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <div className="header-logo">FHE</div>
          <div>
            <div className="header-title">FHEVM Bootcamp</div>
            <div className="header-subtitle">Interactive Demo</div>
          </div>
        </div>

        {account ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="network-tag">
              <span className="network-dot" />
              Sepolia
            </span>
            <span className="address-tag">{shortAddress}</span>
            <button className="btn btn-outline btn-sm" onClick={onDisconnect}>
              Disconnect
            </button>
          </div>
        ) : (
          <button
            className="btn btn-primary"
            onClick={onConnect}
            disabled={connecting}
          >
            {connecting && <span className="spinner" />}
            {connecting ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>
    </header>
  );
}
