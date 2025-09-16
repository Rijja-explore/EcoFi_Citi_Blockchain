# EcoFi - Green Bond Dashboard

A decentralized impact investing platform built on Ethereum. This application allows users to invest in green bonds and track environmental impact metrics in real-time with data persistence via Firebase.

![EcoFi Platform](https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80)

## Project Overview

The EcoFi platform consists of:

1. **Smart Contracts (Backend)**:
   - `GreenBondEscrow.sol`: Main contract that manages bond sales and milestone-based fund releases
   - `BondToken.sol`: ERC20 token representing investment shares
   - `ImpactOracle.sol`: Tracks and reports environmental impact metrics

2. **React Frontend**:
   - Dashboard for investors to purchase bonds and track impact
   - Issuer dashboard for project owners to manage funds and report metrics
   - Real-time data visualization with Recharts
   - Interactive UI with Tailwind CSS and Framer Motion

3. **Firebase Integration**:
   - Firestore database for transaction history
   - Login timeline tracking
   - Impact data storage and retrieval
   - Project data management

## Features

- **Wallet Connection**: Seamless MetaMask integration
- **Bond Investment**: Purchase green bonds with ETH
- **Impact Tracking**: Real-time environmental metrics
- **Milestone System**: Fund releases tied to impact achievements
- **Transaction History**: Complete record of all interactions
- **Login Timeline**: Track wallet connection history
- **Issuer Controls**: Special functions for project owners
- **Responsive Design**: Works on desktop and mobile devices

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- npm or yarn
- MetaMask browser extension
- Git
- Firebase account (for data persistence)

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/Rijja-explore/EcoFi_Citi_Blockchain.git
cd EcoFi_Citi_Blockchain
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

4. **Configure Firebase** (optional, only if you want your own Firebase instance):
   - Create a new Firebase project at [firebase.google.com](https://firebase.google.com)
   - Enable Firestore Database
   - Replace the firebaseConfig object in `src/firebaseConfig.js` with your own configuration

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
npx hardhat run scripts/deployCombined.js --network localhost
```

This script will:
- Deploy all contracts
- Wire them together
- Create contract information for the frontend

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
2. Or run the oracle scripts:

```bash
cd src/Backend
# Set up the oracle (only needed once)
npm run oracle:setup

# Fund the oracle updater (only needed once)
npm run oracle:fund

# Push a single update
npm run oracle:once

# Start a mock data feed that updates continuously
npm run oracle:loop
```

## Firebase Integration

The application uses Firebase Firestore for:

1. **Transaction History**: Records all wallet interactions
2. **Login Timeline**: Tracks wallet connections and disconnections
3. **Impact Data**: Stores environmental impact metrics
4. **Project Information**: Manages project details and progress

Data is automatically synced between the blockchain and Firebase to ensure consistency.

## Development Notes

### Tech Stack

- **Frontend**: React, Tailwind CSS, ethers.js, Framer Motion
- **Backend**: Solidity, Hardhat, OpenZeppelin Contracts
- **Database**: Firebase Firestore
- **Visualization**: Recharts
- **Icons**: Lucide React

### Contract Deployment

The deployment script (`deployCombined.js`) handles:
- Deploying all contracts
- Setting up the relationships between contracts
- Creating deployment information for the frontend

If you modify the contracts, you'll need to:
1. Compile: `npx hardhat compile`
2. Deploy: `npx hardhat run scripts/deployCombined.js --network localhost`

### Frontend Contract Connection

The frontend connects to the blockchain using:
- `ethers.js` for blockchain interactions
- `contractUtils.js` for simplified contract connection

## Troubleshooting

### "Wrong Network" Message
- Ensure MetaMask is connected to Hardhat Local (Chain ID: 31337)
- Make sure your Hardhat node is running

### Contract Transaction Errors
- Check console for detailed error messages
- Ensure you're using the correct account for the operation (issuer vs. investor)

### Firebase Connection Issues
- Verify your internet connection
- Check Firebase console for any service disruptions
- Ensure your Firebase project is properly configured

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)

## Acknowledgements

- [OpenZeppelin](https://openzeppelin.com/) for secure contract libraries
- [Hardhat](https://hardhat.org/) for Ethereum development environment
- [Firebase](https://firebase.google.com/) for database services
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [ethers.js](https://docs.ethers.io/) for blockchain interactions
- [React](https://reactjs.org/) for frontend framework