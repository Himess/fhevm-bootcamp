FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native modules (secp256k1)
RUN apk add --no-cache python3 make g++

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the project
COPY . .

# Compile contracts
RUN npx hardhat compile

# Default: run all tests
CMD ["npm", "test"]
