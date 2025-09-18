# 🌱 EcoFi Green Bond Platform

A comprehensive blockchain-based green bond platform enabling transparent, milestone-driven funding for renewable energy projects with real-time environmental impact tracking.

## 🎯 Platform Overview

EcoFi revolutionizes green financing by combining:
- **Smart Contract Escrow** - Automated fund releases based on environmental milestones
- **Oracle-Verified Impact** - Real-time tracking of renewable energy generation and CO₂ reduction
- **Transparent Investment** - Complete visibility into fund allocation and project progress
- **Professional Certificates** - PDF impact certificates for stakeholders

## 🏗️ Architecture

### Smart Contracts
- **GreenBondEscrow.sol** - Main escrow contract managing investments and milestone-based releases
- **ImpactOracle.sol** - Environmental data oracle for kWh and CO₂ tracking
- **BondToken.sol** - ERC-20 token representing bond shares

### Frontend
- **React 18** with modern hooks and context
- **Ethers.js** for Web3 integration
- **Tailwind CSS** with glass morphism design
- **MetaMask** wallet connectivity

### Backend
- **Hardhat** development framework
- **Solidity 0.8.24** smart contracts
- **Local blockchain** for development and testing

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v16 or higher)
- **MetaMask** browser extension
- **Git** for cloning the repository

### Installation

```bash
# Clone the repository
git clone https://github.com/Rijja-explore/EcoFi_Citi_Blockchain.git
cd EcoFi_Citi_Blockchain

# Install dependencies
npm install

# Install backend dependencies
cd src/Backend
npm install
cd ../..
```

### Environment Setup

The `.env` file contains all configuration. Key variables:

```env
# Contract Addresses (auto-updated on deployment)
REACT_APP_ESCROW_ADDRESS=0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
REACT_APP_ORACLE_ADDRESS=0x0165878A594ca255338adfa4d48449f69242Eb8F

# Network Configuration
REACT_APP_CHAIN_ID=31337
REACT_APP_RPC_URL=http://127.0.0.1:8545

# Environmental Impact Multipliers
REACT_APP_CO2_PER_KWH=0.4
REACT_APP_TREES_PER_KWH=0.02
REACT_APP_WATER_PER_KWH=0.5
REACT_APP_SHOW_DEMO_DATA=false

# Wallet Addresses
REACT_APP_ISSUER_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
REACT_APP_UPDATER_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
```

## 🏃‍♂️ Running the Platform

### Step 1: Start Blockchain Node
```bash
# Terminal 1 - Keep this running
cd src/Backend
npx hardhat node --port 8545
```
**Expected:** See "Started HTTP and WebSocket JSON-RPC server" and 20 test accounts

### Step 2: Deploy Smart Contracts
```bash
# Terminal 2 - Deploy contracts
cd src/Backend
npx hardhat run scripts/deployCombined.js --network localhost
```
**Expected:** See contract deployment addresses and automatic `.env` update

### Step 3: Start Frontend
```bash
# Terminal 3 - Start React app
npm start
```
**Expected:** Browser opens at `http://localhost:3000`

### Step 4: Configure MetaMask
1. **Add Local Network:**
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency: `ETH`

2. **Import Test Account:**
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - This is the issuer account with 10,000 ETH

3. **Connect to Platform:**
   - Refresh browser after MetaMask setup
   - Click "Connect Wallet" button

## 📊 Platform Features

### 🏦 Investment System
- **Token Investment** - Purchase green bond tokens with ETH
- **Price Discovery** - Dynamic pricing based on supply/demand
- **Portfolio Tracking** - Real-time balance and value monitoring
- **Investment Simulator** - Preview returns before investing

### 🌍 Environmental Tracking
- **Real-time Metrics:**
  - CO₂ Reduced (kg)
  - Trees Equivalent (count)
  - Energy Generated (kWh)
  - Water Conserved (liters)
- **Oracle Data Submission** - For project operators
- **Impact Score** - Overall environmental performance rating

### 🎯 Milestone System
Six enterprise-scale milestones with automatic fund releases:

| Milestone | kWh Target | Fund Release | Typical Project Scale |
|-----------|------------|--------------|----------------------|
| 1 | 5,000,000 | 16.66% | Small solar farm |
| 2 | 10,000,000 | 16.67% | Medium wind farm |
| 3 | 20,000,000 | 16.67% | Large solar installation |
| 4 | 35,000,000 | 16.67% | Major wind project |
| 5 | 50,000,000 | 20.00% | Utility-scale renewable |
| 6 | 75,000,000 | 25.00% | Mega renewable complex |

### 📜 Certificate Generation
- **PDF Certificates** - Professional impact documentation
- **Investor Certificates** - Proof of green investment
- **Project Certificates** - Environmental impact validation
- **Downloadable Reports** - Shareable with stakeholders

### 👥 Role-Based Interface
- **Investors** - View portfolio, track impact, download certificates
- **Project Operators** - Submit environmental data, track milestones
- **Issuers** - Manage project, view analytics, release funds

## 🔧 Advanced Configuration

### Environmental Impact Multipliers
Customize impact calculations by modifying `.env`:

```env
# Carbon footprint reduction per kWh
REACT_APP_CO2_PER_KWH=0.4

# Tree planting equivalent per kWh
REACT_APP_TREES_PER_KWH=0.02

# Water conservation per kWh (liters)
REACT_APP_WATER_PER_KWH=0.5
```

### Demo Data
Enable demo environmental data for testing:
```env
REACT_APP_SHOW_DEMO_DATA=true
```

## 🧪 Testing & Development

### Contract Testing
```bash
cd src/Backend
npx hardhat test
```

### Oracle Testing
```bash
# Fund the oracle updater
npm run oracle:fund

# Run mock data feed
npm run oracle:loop
```

### Manual Testing Scenarios

1. **Investment Flow:**
   - Connect wallet → Invest ETH → Check portfolio → Track impact

2. **Environmental Reporting:**
   - Use Oracle Simulator → Submit kWh data → Watch milestones progress

3. **Certificate Generation:**
   - Complete investment → Submit impact data → Download PDF certificate

## 🚨 Troubleshooting

### Common Issues

**"Connection refused" errors:**
- ✅ Ensure blockchain node is running (Terminal 1)
- ✅ Check if port 8545 is available
- ✅ Restart hardhat node if needed

**"BAD_DATA" contract errors:**
- ✅ Redeploy contracts: `npx hardhat run scripts/deployCombined.js --network localhost`
- ✅ Check `.env` has correct contract addresses
- ✅ Restart React app after redeployment

**"not updater" authorization errors:**
- ✅ Fixed in latest deployment (allows both issuer and updater)
- ✅ Ensure using correct MetaMask account
- ✅ Redeploy if still seeing this error

**React app won't start:**
- ✅ Check if port 3000 is available
- ✅ Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- ✅ Check for syntax errors in recent changes

**MetaMask issues:**
- ✅ Reset account in MetaMask settings if transactions fail
- ✅ Ensure correct network (Hardhat Local, Chain ID 31337)
- ✅ Check account has sufficient ETH balance

**Environmental impact showing zeros:**
- ✅ Submit environmental data through Oracle Simulator
- ✅ Wait 2-3 seconds for auto-refresh after submission
- ✅ Check console logs for calculation errors

### Development Reset
Complete platform reset:
```bash
# Stop all terminals (Ctrl+C)
# Restart blockchain
cd src/Backend
npx hardhat node --port 8545

# In new terminal, redeploy
npx hardhat run scripts/deployCombined.js --network localhost

# Reset MetaMask account
# Restart React app
npm start
```

## 📁 Project Structure

```
EcoFi_Citi_Blockchain/
├── public/                 # Static assets
├── src/
│   ├── Backend/           # Smart contracts & deployment
│   │   ├── contracts/     # Solidity contracts
│   │   ├── scripts/       # Deployment scripts
│   │   ├── test/         # Contract tests
│   │   └── oracle/       # Oracle utilities
│   ├── artifacts/        # Compiled contracts
│   ├── App.js           # Main React component
│   ├── EcoFiDashboard.js # Primary dashboard
│   └── contractUtils.js  # Web3 utilities
├── .env                  # Environment configuration
├── package.json         # Dependencies
└── README.md           # This file
```

## 🌟 Key Features Summary

- ✅ **6 Milestone System** (5M-75M kWh targets)
- ✅ **Transparent Glass UI** with beautiful animations
- ✅ **Real-time Environmental Tracking**
- ✅ **Professional PDF Certificates**
- ✅ **MetaMask Integration**
- ✅ **Investment Portfolio Management**
- ✅ **Oracle-Verified Impact Data**
- ✅ **Automated Fund Releases**
- ✅ **Role-based Access Control**
- ✅ **Enterprise-scale Thresholds**

## 🤝 Support

For issues or questions:
1. Check this README troubleshooting section
2. Review console logs for specific errors
3. Ensure all terminals are running correctly
4. Verify MetaMask configuration matches requirements

## 📄 License

This project is part of the Citi Blockchain Innovation Challenge and follows standard open-source practices for educational and development purposes.

---

**Ready to revolutionize green finance? Start your local environment and begin building the future of sustainable investing! 🌱💚**