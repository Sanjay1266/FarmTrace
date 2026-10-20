# FarmTrace — Blockchain Agricultural Product Traceability & Authenticity Verification

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)](https://soliditylang.org/)
[![Ethereum Sepolia](https://img.shields.io/badge/Network-Ethereum_Sepolia-blue)](https://sepolia.etherscan.io/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> **Decentralized, tamper-evident agricultural product traceability platform on Ethereum Sepolia for farmer groups, Farmer Producer Organizations (FPOs), cooperatives, and conscious consumers.**

---

## 1. Project Overview

**FarmTrace** is an open, publicly verifiable Web3 platform that establishes an immutable chronological record of agricultural batches from smallholder farm origin through processing, packaging, logistics, and retail shelves.

### The Integrity Principle: What Blockchain Proves vs. Does Not Prove
FarmTrace adheres to strict integrity principles regarding the real-world **Oracle Problem** in supply chains:
- **What is Guaranteed:** Data submitted by authorized wallets cannot be silently modified, backdated, or deleted. The exact block timestamp, wallet address, and sequence of supply-chain events are cryptographically sealed on Ethereum Sepolia. If a correction is made, an auditable trail of the previous value, new value, reason, and wallet is permanently preserved.
- **What is NOT Claimed:** Blockchain records do *not* independently prove physical soil conditions, organic authenticity, or whether a crop was genuinely cultivated by a specific human without physical certification or laboratory testing. FarmTrace records authorized declarations, not unverified physical truth.

---

## 2. Key Features

- **Decentralized Storage (Zero Traditional Database):** All farmer registrations, product batches, stage checkpoints, and transparent audit corrections are stored directly on the Ethereum Sepolia smart contract.
- **Public Read-Only Verification (No MetaMask Required):** Consumers can scan a QR code or enter a Batch ID on any device or mobile browser without installing MetaMask or paying gas fees.
- **Role-Based Access Control:** Granular smart contract permissions ensure that mills, packaging facilities, logistics carriers, and retailers can only update checkpoints within their authorized scope.
- **Supply-Chain Checkpoint Pipeline:**
  1. `Harvested` (origin registration)
  2. `Received for Processing` (inward receipt at processing mill)
  3. `Processing Completed` (sorting, grading, drying, quality checks)
  4. `Packaged` (tamper-evident sealing and label affixing)
  5. `Dispatched` (consignment released to transit)
  6. `Received by Distributor` (logistics hub inward receipt)
  7. `Received by Retailer` (retail store or point-of-sale receipt)
- **Dual Timestamp Verification:** The UI displays both the participant's self-declared event date and the tamper-evident block timestamp sealed in the Ethereum block.
- **Cryptographic QR Code Generation:** Instant high-resolution QR codes pointing to `/#/verify/<BatchId>` with high-res PNG download and printable physical label formats.
- **Transparent Audit Corrections:** Superseding correction mechanism that never erases historical records while updating effective metadata with mandatory audit reasons.
- **Honest Status Badges:** Uses accurate descriptors (`RECORD FOUND ON BLOCKCHAIN`, `CHRONOLOGICAL HISTORY AVAILABLE`, `TRANSPARENT CORRECTION RECORDED`, `INCOMPLETE SUPPLY-CHAIN HISTORY`, `RECORD NOT FOUND`) instead of misleading green authenticity badges.

---

## 3. Technology Stack

- **Smart Contract Language:** Solidity `0.8.24` (with `viaIR` optimizer)
- **Smart Contract Development:** Hardhat
- **Blockchain Network:** Ethereum Sepolia Testnet (Chain ID `11155111`)
- **Frontend Framework:** React 18 with TypeScript and Vite
- **Styling:** Tailwind CSS with custom agricultural (`farm` and `earth`) design tokens
- **Web3 Interaction:** ethers.js v6
- **QR Code Handling:** `qrcode.react` (generation) and `html5-qrcode` (camera stream scanning)
- **Icons:** `lucide-react`
- **Testing:** Mocha, Chai, and `@nomicfoundation/hardhat-toolbox`

---

## 4. Architecture

```text
       [ Consumer / Public Visitor ]             [ Farmer Org / Processing / Logistics ]
                    │                                             │
      (Read-Only Public Verification)                (MetaMask Signing / Gas Execution)
                    │                                             │
                    ▼                                             ▼
          Public Sepolia RPC Node                    Browser ethers.js Signer
                    │                                             │
                    └──────────────────────┬──────────────────────┘
                                           │
                                           ▼
                                [ Ethereum Sepolia ]
                                           │
                                           ▼
                        [ FarmTrace.sol Smart Contract ]
                                           │
         ┌─────────────────────────┬───────┴─────────────────┬────────────────────────┐
         │                         │                         │                        │
  Farmer Registry          Batch Registry          Supply Chain Timeline     Audit Corrections
  (_farmers mapping)      (_batches mapping)      (_batchEvents mapping)   (_batchCorrections)
```

---

## 5. Prerequisites

Before running the project locally or deploying to Sepolia, ensure you have:
1. **Node.js:** v18.x or v20.x installed (`node -v`)
2. **npm:** v9.x or later
3. **MetaMask:** Browser extension installed in Chrome, Brave, or Firefox
4. **Sepolia ETH:** Testnet ETH for transaction gas (obtained freely from Google Cloud Web3 Faucet, Alchemy Sepolia Faucet, or Sepolia PoW Faucet)

---

## 6. Installation & Local Development

### Step 1: Clone and Install Dependencies
```bash
git clone https://github.com/Sanjay1266/FarmTrace.git
cd FarmTrace
npm install
```

### Step 2: Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```
Configure your `.env` variables:
```env
# Sepolia RPC URL (or use default publicnode)
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Deployer Private Key (For Hardhat deployment only; NEVER share or commit!)
PRIVATE_KEY=your_sepolia_private_key_without_0x

# Deployed Contract Address (auto-populated by deploy script)
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Public RPC fallback for non-wallet consumer reads
VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
VITE_CHAIN_ID=11155111
```

### Step 3: Run Smart Contract Tests
Execute the comprehensive Hardhat test suite (covering access control, farmer registration, duplicate rejection, stage transitions, and corrections):
```bash
npm run test:contracts
```
*Expected: 34 passing tests.*

### Step 4: Start Frontend Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Smart Contract Deployment & Verification

### Local Hardhat Deployment (Zero Gas Required)
To run a local in-memory deployment and generate contract configuration:
```bash
npx hardhat run scripts/deploy.cjs
```
This automatically writes `src/contracts/contractConfig.json` and `src/contracts/contractData.ts`.

### Deploying to Ethereum Sepolia Testnet

1. Ensure your deployer account has at least 0.05 Sepolia ETH.
2. In `.env`, set `PRIVATE_KEY` to your dedicated testnet account private key.
3. Run the deployment script:
   ```bash
   npm run deploy:sepolia
   ```
4. Hardhat will deploy `FarmTrace.sol`, print the deployed contract address and transaction hash, and automatically update `src/contracts/contractConfig.json` and `src/contracts/contractData.ts`.

### Verifying on Sepolia Etherscan
To verify contract source code on Sepolia Etherscan:
```bash
npx hardhat verify --network sepolia <DEPLOYED_CONTRACT_ADDRESS>
```
Once verified, anyone can inspect the Solidity source code directly on [Sepolia Etherscan](https://sepolia.etherscan.io).

---

## 8. MetaMask Network Configuration

If MetaMask does not switch automatically, add Ethereum Sepolia manually:
- **Network Name:** Ethereum Sepolia Testnet
- **New RPC URL:** `https://ethereum-sepolia-rpc.publicnode.com` (or `https://rpc.sepolia.org`)
- **Chain ID:** `11155111` (Hex: `0xaa36a7`)
- **Currency Symbol:** `SEP`
- **Block Explorer URL:** `https://sepolia.etherscan.io`

---

## 9. QR Code Verification Workflow

1. **Farmer Registration:** Organization admin registers smallholder details under `/farmers`.
2. **Batch Registration:** Organization registers a product batch (e.g. `FT-000001`) with harvest date and notes under `/register-batch`.
3. **QR Generation:** A unique QR code pointing to `/#/verify/FT-000001` is immediately generated and can be downloaded as a high-resolution PNG or printed on packaging labels.
4. **Supply-Chain Progress:** Processors, logistics drivers, and retailers log checkpoints under `/supply-chain`.
5. **Consumer Scan:** The consumer scans the physical packaging QR or enters `FT-000001` at `/verify`.
6. **On-Chain Retrieval:** The application retrieves the batch, farmer, chronological checkpoint timeline, and any transparent corrections directly from Ethereum Sepolia.

---

## 10. Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **MetaMask "Wrong Network"** | Connected to Mainnet, Polygon, or Arbitrum | Click "Switch to Sepolia" in the FarmTrace header or switch network in MetaMask. |
| **"Insufficient funds for gas"** | Wallet has 0 Sepolia ETH | Request free test ETH from [Google Web3 Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) or [Sepolia Faucet](https://sepoliafaucet.com). |
| **"InvalidStageTransition"** | Attempting out-of-order stage update (e.g. dispatch before packaged) | Complete prerequisite stages first as enforced by the smart contract. |
| **"Camera access failed" in QR scanner** | Browser camera permission blocked | Allow camera permissions in browser URL bar or use the "Upload QR Image" button. |

---

## 11. Security & Limitations Disclosure

- **Private Key Safety:** Never commit your `.env` or share private keys. FarmTrace never asks for or stores seed phrases.
- **Oracle Reality:** Physical product authenticity relies on the integrity of authorized registering organizations. Blockchain provides an unalterable audit log of who claimed what and when, making post-facto tampering impossible.

---

## 12. License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
