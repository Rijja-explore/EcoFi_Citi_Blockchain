# 🎓 Student Guide: Free Test ETH Setup

## 🆓 No Real Money Needed!

### 🔍 Understanding Test Networks:
- **Hardhat Local** = Completely fake blockchain on your computer
- **All ETH is fake** = No real money involved
- **Network fees** = Paid with fake ETH
- **Perfect for students!** 📚

## 🎯 Quick Setup for Free Testing:

### Step 1: Make Sure You're on Hardhat Local
1. Open MetaMask
2. Click network dropdown (top of MetaMask)
3. Should show "Hardhat Local" or "Localhost 8545"
4. If not, add this network:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency: `ETH`

### Step 2: Import Test Accounts (Free 10,000 ETH each!)

**Account #1 (Issuer):**
```
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Balance: 10,000 ETH (FAKE)
```

**Account #2 (Investor):**
```
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Balance: 10,000 ETH (FAKE)
```

**Account #3 (Another Investor):**
```
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
Address: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
Balance: 10,000 ETH (FAKE)
```

### Step 3: How to Import in MetaMask:
1. Click account circle (top right in MetaMask)
2. Click "Import Account"
3. Select "Private Key"
4. Paste one of the private keys above
5. Click "Import"
6. Repeat for multiple accounts

## 🎮 Testing Different Roles:

### 👑 As Issuer (Account #1):
- Can manage the project
- Submit impact data
- Receive funds from milestones
- See "Issuer Controls" tab

### 💰 As Investor (Account #2 or #3):
- Buy green bonds
- Track environmental impact
- See investment returns

## 🔧 If You Still See "Insufficient Funds":

### Option 1: Start Fresh Hardhat Node
```bash
cd D:\Projects\EcoFi\EcoFi_Citi_Blockchain\src\Backend
npx hardhat node --port 8545
```

### Option 2: Reset MetaMask Account
1. MetaMask Settings → Advanced
2. Click "Reset Account"
3. This clears transaction history and fixes balance issues

### Option 3: Fund Account Manually
```bash
# In Hardhat console
npx hardhat console --network localhost

# Send ETH to your account
await network.provider.send("hardhat_setBalance", [
  "0xYourAccountAddress",
  "0x21E19E0C9BAB2400000", // 10000 ETH
]);
```

## 💡 Pro Student Tips:

### 🆓 Always Free Networks:
- **Hardhat Local** (what you're using)
- **Ganache** (alternative local)
- **Testnets** (Sepolia, Goerli) - free but need faucets

### 💸 Never Use These (Cost Real Money):
- **Ethereum Mainnet**
- **Polygon Mainnet**
- **BSC Mainnet**

### 🎓 Student Best Practices:
1. Always test locally first (Hardhat)
2. Use testnets for public demos
3. Never deploy to mainnet while learning
4. Keep private keys secure (even test ones)

## 🚨 Emergency Reset:
If everything breaks:
1. Delete MetaMask extension
2. Reinstall MetaMask
3. Import accounts again
4. Restart Hardhat node
5. Redeploy contracts

Remember: **It's all fake money on your local computer!** 🎉