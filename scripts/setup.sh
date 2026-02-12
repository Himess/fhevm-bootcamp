#!/bin/bash
# FHEVM Bootcamp - Automated Setup Script
# Usage: bash scripts/setup.sh

set -e

echo "========================================="
echo " FHEVM Bootcamp - Environment Setup"
echo "========================================="
echo ""

# Check Node.js
echo "[1/5] Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "ERROR: Node.js 18+ required. Current version: $(node -v)"
    exit 1
fi
echo "  Node.js $(node -v) - OK"

# Check npm
echo "[2/5] Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed."
    exit 1
fi
echo "  npm $(npm -v) - OK"

# Check Git
echo "[3/5] Checking Git..."
if ! command -v git &> /dev/null; then
    echo "WARNING: Git is not installed. You won't be able to version control."
else
    echo "  Git $(git --version | cut -d' ' -f3) - OK"
fi

# Install dependencies
echo "[4/5] Installing dependencies..."
npm install
echo "  Dependencies installed - OK"

# Setup .env
echo "[5/5] Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "  Created .env from .env.example"
    echo "  IMPORTANT: Edit .env with your private key before deploying to devnet"
else
    echo "  .env already exists - skipping"
fi

# Verify compilation
echo ""
echo "========================================="
echo " Verifying Setup"
echo "========================================="
echo ""
echo "Compiling contracts..."
npx hardhat compile

echo ""
echo "Running tests..."
npx hardhat test

echo ""
echo "========================================="
echo " Setup Complete!"
echo "========================================="
echo ""
echo "You're ready to start the FHEVM Bootcamp!"
echo ""
echo "Quick commands:"
echo "  npm test          - Run all tests"
echo "  npm run compile   - Compile contracts"
echo "  npm run build     - Clean and recompile"
echo ""
echo "Start with Module 00: modules/00-prerequisites/README.md"
echo ""
