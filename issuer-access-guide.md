# 🏢 EcoFi Issuer Access Guide

## 🔑 How to Access Issuer Functions

The EcoFi platform automatically detects if your connected wallet is the **issuer** (project owner) and shows additional controls.

### **Current Issuer Address:**
`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

### **Step 1: Import Issuer Account to MetaMask**

1. **Open MetaMask**
2. **Click account circle** (top right)
3. **Click "Import Account"**
4. **Select "Private Key"**
5. **Paste this private key:**
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
6. **Click "Import"**

> ⚠️ **Note:** This is the default Hardhat test account #1 that has the issuer address above.

### **Step 2: Connect as Issuer**

1. **Make sure Hardhat node is running**
2. **Make sure contracts are deployed**
3. **Open the EcoFi dApp in browser**
4. **Connect MetaMask** with the imported issuer account
5. **The dashboard will automatically detect you're the issuer**

### **Step 3: Issuer Controls Available**

When connected as issuer, you'll see an **"Issuer Controls"** tab with:

#### **📊 Project Management:**
- View total funds raised
- Monitor bond sales progress
- Track milestone achievements
- See total funds released to date

#### **📈 Impact Data Submission:**
- Submit new kWh energy generation data
- Submit CO2 reduction metrics
- Track cumulative environmental impact
- Trigger milestone achievements

#### **💰 Funds Management:**
- View escrow balance
- Track milestone-based fund releases
- Monitor when funds become available

#### **🎯 Oracle Controls:**
- Submit environmental impact data
- Update energy generation metrics
- Trigger milestone evaluations

### **Step 4: Oracle Functions (Advanced)**

The issuer can also update impact data through the oracle:

1. **Use the Oracle Key from .env:**
   ```
   0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
   ```

2. **Submit Impact Data:**
   - Enter kWh generated
   - Enter CO2 reduced
   - Submit to trigger milestone checks

### **Alternative Access Methods:**

#### **Method 1: Use Different Hardhat Account**
If you want to use a different account as issuer:
1. Import account #2: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
2. Private key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

#### **Method 2: Deploy with Custom Issuer**
Modify the deployment script to use your preferred address as issuer.

### **🔍 Verification:**

**How to confirm you're connected as issuer:**
1. Check the browser console for: `✅ User is issuer`
2. Look for "Issuer Controls" tab in the dashboard
3. Your address should match: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

### **🚨 Troubleshooting:**

**If you don't see Issuer Controls:**
1. ✅ Check you're using the correct private key
2. ✅ Verify contracts are deployed and working
3. ✅ Confirm you're on Hardhat Local network
4. ✅ Check browser console for any errors
5. ✅ Try refreshing the page after connecting wallet

### **💡 Quick Test:**

```javascript
// Open browser console and run:
// This will show the current issuer address
ethereum.request({method: 'eth_requestAccounts'}).then(accounts => {
  console.log('Your address:', accounts[0]);
  console.log('Issuer address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
  console.log('Match:', accounts[0].toLowerCase() === '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'.toLowerCase());
});
```