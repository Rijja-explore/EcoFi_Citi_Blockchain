# EcoFi - Green Bond Dashboard

A decentralized impact investing platform built on Ethereum. This application allows users to invest in green bonds and track environmental impact metrics.

## Project Overview

The EcoFi platform consists of:

1. **Smart Contracts (Backend)**:
   - `GreenBondEscrow.sol`: Main contract that manages bond sales and milestone-based fund releases
   - `BondToken.sol`: ERC20 token representing investment shares
   - `ImpactOracle.sol`: Tracks and reports environmental impact metrics

2. **React Frontend**:
   - Dashboard for investors to purchase bonds and track impact
   - Issuer dashboard for project owners to manage funds and report metrics

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- npm or yarn
- MetaMask browser extension
- Git

### Installation

1. **Clone the repository:**

```bash
git clone <repository-url>
cd EcoFi
```

2. **Install dependencies for the frontend:**

```bash
npm install
```

3. **Install dependencies for the backend:**

```bash
cd src/Backend
npm install
cd ../..
```

### Running the Application

#### Step 1: Start a local Hardhat node

```bash
cd src/Backend
npx hardhat node
```

Keep this terminal open.

#### Step 2: Deploy the contracts to the local network

In a new terminal:

```bash
cd src/Backend
npx hardhat run scripts/deployForFrontend.js --network localhost
```

This script will:
- Deploy all contracts
- Wire them together
- Create a `.env` file in the project root with contract addresses
- Create a `contractInfo.json` file in the `src` directory

#### Step 3: Start the React app

In a new terminal:

```bash
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Connecting with MetaMask

1. Open MetaMask and connect to the local Hardhat network:
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

2. Import one of the private keys provided by Hardhat (first account is the contract deployer/issuer)

3. Click "Connect Wallet" in the EcoFi dashboard

## Testing the Oracle

To simulate environmental impact updates:

1. Use the "Oracle Simulation" panel in the issuer dashboard
2. Enter the Oracle Updater private key, which can be found in:
   - The `.env` file as `REACT_APP_ORACLE_UPDATER_KEY`
   - The second account provided by Hardhat

## Development Notes

### Contract Deployment

The deployment script (`deployForFrontend.js`) handles:
- Deploying all contracts
- Setting up the relationships between contracts
- Creating a `.env` file with contract addresses
- Creating a `contractInfo.json` file with deployment info

If you modify the contracts, you'll need to:
1. Compile: `npx hardhat compile`
2. Deploy: `npx hardhat run scripts/deployForFrontend.js --network localhost`

### Frontend Contract Connection

The frontend connects to the blockchain using:
- `ethers.js` for blockchain interactions
- `contractUtils.js` for simplified contract connection
- Environment variables loaded from `.env`

## Troubleshooting

### "Wrong Network" Message
- Ensure MetaMask is connected to Hardhat Local (Chain ID: 31337)
- Make sure your Hardhat node is running

### Contract Transaction Errors
- Check console for detailed error messages
- Ensure you're using the correct account for the operation (issuer vs. investor)

### "Cannot read properties of undefined" Errors
- Check that contract addresses in `.env` match the deployed contracts
- Verify that contract artifacts are up to date with `npx hardhat compile`

## License

[MIT License](LICENSE)