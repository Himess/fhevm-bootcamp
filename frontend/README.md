# FHEVM Bootcamp — Frontend Demo

Interactive React dApp that connects to FHEVM contracts on Ethereum Sepolia.

## Features

- **Encrypted Counter** — Encrypt a number client-side, send it to `SimpleCounter.sol`, read back the encrypted handle
- **Confidential Token** — Mint, transfer, and check balances on `ConfidentialERC20.sol` with encrypted amounts
- **Wallet Integration** — MetaMask connection with automatic Sepolia network switching
- **FHE Encryption** — Client-side encryption using `@zama-fhe/relayer-sdk` before sending transactions

## Setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Requirements

- Node.js 18+
- MetaMask browser extension
- Sepolia ETH for gas fees (get from [Sepolia Faucet](https://sepoliafaucet.com))

## Deployed Contracts (Sepolia)

| Contract | Address |
|----------|---------|
| SimpleCounter | `0xB0370cEE99171735bE92b8Ec66506B443Ff6416C` |
| ConfidentialERC20 | `0x5127acf277ac514b275f0824d8cc5aDe39dC1f33` |

## How It Works

1. **Connect** your MetaMask wallet (auto-switches to Sepolia)
2. **Encrypt** input values using the Relayer SDK (`createEncryptedInput`)
3. **Send** encrypted data as a transaction to the FHEVM contract
4. **Read** encrypted handles back from the contract
5. **Decrypt** via re-encryption (`instance.userDecrypt()`) on Sepolia testnet

## Tech Stack

- React 18 + TypeScript
- Vite
- ethers.js v6
- @zama-fhe/relayer-sdk
