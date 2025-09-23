# 🌱 EcoFi - Decentralized Green Bond Platform

> **Bridging Climate Finance with Blockchain Technology**

EcoFi is a revolutionary decentralized impact investing platform that democratizes access to green bonds while ensuring transparency and accountability through blockchain technology. Built on Ethereum, it enables investors to directly fund environmental projects and track real-world impact metrics.

## 🚀 Quick Reference

### **Fast Start Commands**
```bash
# Terminal 1: Start blockchain
cd src/Backend && npx hardhat node

# Terminal 2: Deploy contracts  
cd src/Backend && npx hardhat --config hardhat.config.cjs run scripts/deployCombined.js --network localhost

# Terminal 3: Start application
npm start
```

### **Key URLs**
- **Application**: http://localhost:3000
- **Hardhat Network**: http://127.0.0.1:8545 (Chain ID: 31337)
- **Contract Explorer**: Console logs show deployed addresses

### **MetaMask Setup**
- **Network**: Hardhat Local
- **RPC URL**: http://127.0.0.1:8545  
- **Chain ID**: 31337
- **Currency**: ETH

## 🏗️ EcoFi Implementation Architecture

### **🔗 Smart Contract Layer**

#### **GreenBondEscrow.sol** - Core Investment Engine
- **Purpose**: Manages the complete lifecycle of green bond investments
- **Key Features**:
  - Milestone-based fund release mechanism
  - Role-based access control (issuers vs investors)
  - Investment tracking and bond token minting
  - Automated impact verification integration
- **Critical Functions**:
  - `invest()`: Process investor contributions and mint bond tokens
  - `releaseFunds()`: Release funds based on impact milestones
  - `updateImpactData()`: Integrate with oracle for impact verification

#### **BondToken.sol** - Investment Representation  
- **Purpose**: ERC20 token representing ownership stakes in green projects
- **Features**:
  - Standard ERC20 functionality with custom minting
  - Integrated with escrow for automatic token distribution
  - Represents proportional ownership of environmental impact

#### **ImpactOracle.sol** - Environmental Data Integration
- **Purpose**: Connects real-world environmental data to blockchain
- **Capabilities**:
  - CO2 reduction tracking
  - Energy efficiency monitoring  
  - Water conservation metrics
  - Third-party data source integration

### **🎨 Frontend Implementation**

#### **EcoFiDashboard.js** - Main Application Hub
- **Architecture**: React functional components with hooks
- **State Management**: Complex state handling for:
  - Wallet connection and user authentication
  - Project selection and investment flow
  - Role-based UI rendering (issuer vs investor)
  - Real-time blockchain data synchronization

#### **Key Features Implemented**:

1. **🔐 Role-Based Access Control**
   ```javascript
   // Dynamic issuer detection via blockchain query
   const checkIssuerStatus = async (address) => {
     const escrowContract = new ethers.Contract(/* ... */);
     return await escrowContract.isIssuer(address);
   };
   ```

2. **💰 Investment Protection System**
   ```javascript
   // Multi-layered protection against double-spending
   const investmentInProgress = useRef(false);
   // Prevents recursive MetaMask calls
   // Button disabled states during transactions
   // Event propagation prevention
   ```

3. **📊 Real-Time Impact Tracking**
   - Live CO2 reduction metrics
   - Energy efficiency dashboards  
   - Project milestone progress
   - Investment ROI calculations

4. **🎯 Project Selection Consistency**
   - Unified ProjectSelector component
   - Cross-component state synchronization
   - Persistent selection across UI interactions

### **🔧 Technical Stack Deep Dive**

#### **Blockchain Integration**
- **ethers.js v5**: Primary blockchain interaction library
- **MetaMask Integration**: Wallet connection and transaction signing
- **Contract ABI Management**: Dynamic contract instance creation
- **Gas Optimization**: Efficient transaction batching

#### **Frontend Technologies**
- **React 18**: Component-based architecture with hooks
- **Tailwind CSS**: Utility-first styling with custom glass effects
- **Lucide React**: Consistent icon system
- **Responsive Design**: Mobile-first approach

#### **State Management Strategy**
```javascript
// Complex state interactions
const [userAccount, setUserAccount] = useState('');
const [isIssuer, setIsIssuer] = useState(false);
const [selectedProject, setSelectedProject] = useState('');
const [loading, setLoading] = useState(false);
const investmentInProgress = useRef(false);
```

### **🌍 Environmental Impact Features**

1. **📈 Impact Metrics Dashboard**
   - Real-time CO2 reduction tracking
   - Energy efficiency improvements
   - Water conservation metrics
   - Biodiversity impact indicators

2. **🎯 Milestone-Based Funding**
   - Progressive fund release based on verified impact
   - Automated verification through oracle integration
   - Investor protection through escrow mechanisms

3. **📊 Transparency & Reporting**
   - Immutable impact records on blockchain
   - Real-time project progress updates
   - Comprehensive audit trails

## 🔄 Project Workflow

### **For Investors**
1. **Connect Wallet** → MetaMask integration
2. **Browse Projects** → View available green bonds
3. **Invest** → Contribute ETH, receive bond tokens
4. **Track Impact** → Monitor environmental outcomes
5. **Claim Returns** → Receive returns based on project success

### **For Issuers**
1. **Project Creation** → Register environmental project
2. **Set Milestones** → Define impact targets
3. **Receive Funding** → Collect investor contributions
4. **Report Progress** → Update impact metrics via oracle
5. **Access Funds** → Milestone-based fund releases

## 🛠️ Development Setup

### **Prerequisites**
- **Node.js** v16+ with npm
- **MetaMask** browser extension
- **Git** version control
- **VS Code** (recommended IDE)

### **Installation & Setup**

#### **1. Repository Setup**
```bash
# Clone the repository
git clone <repository-url>
cd EcoFi_Citi_Blockchain

# Install frontend dependencies
npm install

# Install backend dependencies  
cd src/Backend
npm install
cd ../..
```

#### **2. Blockchain Development Network**
```bash
# Terminal 1: Start Hardhat local blockchain
cd src/Backend
npx hardhat node
# ✅ Keep this running - provides 20 test accounts with 10,000 ETH each
```

#### **3. Smart Contract Deployment**
```bash
# Terminal 2: Deploy all contracts
cd src/Backend
npx hardhat --config hardhat.config.cjs run scripts/deployCombined.js --network localhost

# This creates:
# ✅ .env file with contract addresses
# ✅ contractInfo.json in src/ directory
# ✅ Wired contract relationships
```

#### **4. Application Launch**
```bash
# Terminal 3: Start React application
npm start
# 🚀 Application available at http://localhost:3000
```

### **MetaMask Configuration**

#### **Network Setup**
```javascript
// Add Hardhat Local Network to MetaMask
Network Name: "Hardhat Local"
RPC URL: "http://127.0.0.1:8545"
Chain ID: 31337
Currency Symbol: "ETH"
```

#### **Test Account Import**
```bash
# Use any of the 20 private keys from Hardhat node output
# Account #0 (Contract Deployer/Issuer): 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
# Account #1 (Oracle Updater): 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
# Accounts #2-19 (Investors): Additional test accounts
```

## 🧪 Testing & Development

### **Oracle Simulation**
```javascript
// Test environmental impact updates
// 1. Switch to issuer account in MetaMask
// 2. Use Oracle Simulation panel in dashboard
// 3. Input oracle updater private key from .env
// 4. Submit impact metrics (CO2 reduction, energy efficiency)
```

### **Investment Flow Testing**
```javascript
// Test complete investment cycle
// 1. Connect as investor (accounts #2-19)
// 2. Select project from dropdown
// 3. Enter investment amount
// 4. Confirm MetaMask transaction
// 5. Verify bond token receipt
// 6. Track impact metrics updates
```

### **Contract Redeployment**
```bash
# If contracts are modified:
cd src/Backend
npx hardhat compile
npx hardhat --config hardhat.config.cjs run scripts/deployCombined.js --network localhost
# ⚠️ This creates new contract addresses - restart frontend
```

## 🔍 Advanced Features

### **Smart Contract Capabilities**

#### **GreenBondEscrow Advanced Functions**
```solidity
// Investment with automatic token minting
function invest(uint256 projectId) external payable

// Milestone-based fund release
function releaseFunds(uint256 amount, string memory milestone) external

// Impact data integration
function updateImpactData(uint256 co2Reduction, uint256 energyEfficiency) external
```

#### **Dynamic Role Management**
```javascript
// Blockchain-based issuer detection
const checkIssuerStatus = async (userAddress) => {
  const escrowContract = new ethers.Contract(
    contractAddresses.escrow,
    escrowABI,
    provider
  );
  return await escrowContract.isIssuer(userAddress);
};
```

### **Frontend Advanced Patterns**

#### **Protected Investment Flow**
```javascript
// Multi-layered investment protection
const investmentInProgress = useRef(false);

const handleInvest = useCallback(async () => {
  if (investmentInProgress.current) return; // Prevent double-calls
  
  investmentInProgress.current = true;
  setLoading(true);
  
  try {
    // Single MetaMask transaction call
    const tx = await escrowContract.invest(selectedProject, {
      value: ethers.utils.parseEther(investAmount)
    });
    await tx.wait();
  } finally {
    investmentInProgress.current = false;
    setLoading(false);
  }
}, [selectedProject, investAmount]);
```

#### **Real-Time Data Synchronization**
```javascript
// Blockchain event listeners for live updates
useEffect(() => {
  const setupEventListeners = () => {
    escrowContract.on('Investment', (investor, amount, projectId) => {
      updateInvestmentData();
    });
    
    oracleContract.on('ImpactUpdate', (co2Reduction, energyEfficiency) => {
      updateImpactMetrics();
    });
  };
  
  if (escrowContract && oracleContract) {
    setupEventListeners();
  }
}, [escrowContract, oracleContract]);
```

## 🚨 Troubleshooting Guide

### **Common Issues & Solutions**

#### **🔴 "Wrong Network" Error**
```javascript
// Solution: Verify MetaMask network
Expected: Hardhat Local (Chain ID: 31337)
Current: Check MetaMask network dropdown
Fix: Switch to Hardhat Local or restart Hardhat node
```

#### **🔴 Contract Transaction Failures**
```javascript
// Check console for specific error messages
Common causes:
- Insufficient ETH balance
- Wrong account type (issuer vs investor)
- Contract not deployed/outdated addresses
- Gas estimation failures
```

#### **🔴 Investment Button Not Working**
```javascript
// Verify these conditions:
✅ Wallet connected
✅ Correct network (31337)
✅ Project selected in dropdown
✅ Valid investment amount entered
✅ Sufficient ETH balance
✅ Not during loading state
```

#### **🔴 "Cannot read properties of undefined"**
```javascript
// Contract connection issues
Solutions:
1. Check .env file has correct contract addresses
2. Verify contractInfo.json exists in src/
3. Redeploy contracts: npx hardhat run scripts/deployCombined.js --network localhost
4. Restart React application
```

### **Debug Mode Commands**
```bash
# Check contract deployment status
cd src/Backend
npx hardhat console --network localhost

# View detailed transaction logs
# Enable in EcoFiDashboard.js: console.log statements

# Check MetaMask console for Web3 errors
# Browser DevTools > Console > Filter: MetaMask
```

## 📊 Performance Monitoring

### **Key Metrics to Track**
- Transaction confirmation times
- Gas usage optimization
- UI responsiveness during blockchain calls
- Error rates in investment flow
- Impact data update frequency

### **Optimization Areas**
- Contract interaction batching
- State update debouncing  
- Responsive design improvements
- Loading state management

## 🔐 Security Considerations

### **Smart Contract Security**
- Reentrancy protection in fund releases
- Access control for critical functions
- Input validation and sanity checks
- Emergency pause functionality

### **Frontend Security**
- Input sanitization for user data
- Secure private key handling recommendations
- Protection against double-spending attacks
- Rate limiting for Oracle updates

## 📝 Contributing Guidelines

### **Code Style**
- ESLint configuration for JavaScript/React
- Solidity style guide compliance
- Comprehensive inline documentation
- Git commit message conventions

### **Testing Requirements**
- Unit tests for smart contracts
- Integration tests for frontend components
- End-to-end user flow testing
- Gas optimization testing

## 📜 License

MIT License - See [LICENSE](LICENSE) file for details.

---

## 🌟 Project Highlights

**EcoFi** represents the next generation of climate finance, combining:
- **🌍 Environmental Impact**: Direct funding for climate solutions
- **🔗 Blockchain Transparency**: Immutable impact tracking
- **💰 Democratic Access**: Open investment opportunities
- **🎯 Verified Results**: Oracle-integrated impact verification
- **🚀 Modern Technology**: React + Ethereum stack

*Building a sustainable future through decentralized climate finance.*