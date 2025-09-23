# 👥 MetaMask Setup: You (Investor) + Friend (Issuer)

## 🎯 Perfect Plan!
- **You** = Investor account (buy bonds, track investments)
- **Your Friend** = Issuer account (manage project, submit data, receive funds)

---

## 📱 STEP-BY-STEP MetaMask Setup

### 🦊 Step 1: Add Hardhat Network (Do This First!)

1. **Open MetaMask extension**
2. **Click network dropdown** (top of MetaMask - might say "Ethereum Mainnet")
3. **Click "Add Network"** or "Custom RPC"
4. **Fill in these details EXACTLY:**
   ```
   Network Name: Hardhat Local
   RPC URL: http://127.0.0.1:8545
   Chain ID: 31337
   Currency Symbol: ETH
   Block Explorer URL: (leave empty)
   ```
5. **Click "Save"**
6. **Switch to this network** (very important!)

---

### 👤 Step 2: Create YOUR Account (Investor)

1. **Click the account circle** (top right of MetaMask)
2. **Click "Import Account"**
3. **Select "Private Key"**
4. **Paste this private key:**
   ```
   0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
   ```
5. **Click "Import"**
6. **Rename account:** Click the 3 dots → "Account Details" → Edit name to "Investor (You)"

**✅ Your investor address will be: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`**

---

### 👑 Step 3: Create FRIEND's Account (Issuer)

1. **Click the account circle** again
2. **Click "Import Account"**
3. **Select "Private Key"**
4. **Paste this private key:**
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
5. **Click "Import"**
6. **Rename account:** Edit name to "Issuer (Friend)"

**✅ Friend's issuer address will be: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`**

---

## 🎮 How to Use Both Accounts

### 💰 Testing as INVESTOR (You):
1. **Switch to "Investor (You)" account** in MetaMask
2. **Connect to your dApp**
3. **You can:**
   - ✅ Buy green bonds
   - ✅ Track your investments
   - ✅ See environmental impact
   - ✅ View transaction history

### 🏢 Testing as ISSUER (Friend):
1. **Switch to "Issuer (Friend)" account** in MetaMask
2. **Connect to your dApp**
3. **You'll see "Issuer Controls" tab appear!**
4. **You can:**
   - ✅ Submit environmental data (kWh, CO2)
   - ✅ Track total funds raised
   - ✅ See milestone progress
   - ✅ Manage the project

---

## 🔄 Switching Between Accounts

**To switch roles:**
1. **Click the account dropdown** in MetaMask
2. **Select "Investor (You)"** or **"Issuer (Friend)"**
3. **Refresh your dApp page**
4. **Reconnect wallet** when prompted

---

## ✅ Verification Checklist

**Both accounts should show:**
- [ ] Network: "Hardhat Local"
- [ ] Balance: ~10,000 ETH each
- [ ] Chain ID: 31337
- [ ] No real money spent

**When connected as Investor:**
- [ ] Can see "Buy Bonds" button
- [ ] Dashboard shows investment options
- [ ] NO "Issuer Controls" tab

**When connected as Issuer:**
- [ ] Dashboard shows "Issuer Controls" tab
- [ ] Can submit impact data
- [ ] Can see project statistics

---

## 🎯 Demo Scenario

**Perfect for showing your project:**

1. **Start as Issuer (Friend's account):**
   - Deploy the green energy project
   - Set milestones and goals
   - Show project details

2. **Switch to Investor (Your account):**
   - Buy some green bonds
   - Show the investment process
   - Track environmental impact

3. **Back to Issuer:**
   - Submit new environmental data
   - Trigger milestone achievements
   - Show fund releases

4. **Back to Investor:**
   - See updated impact metrics
   - View investment returns

---

## 🚨 Quick Troubleshooting

**If you don't see expected features:**
1. ✅ Check you're on "Hardhat Local" network
2. ✅ Verify you're using the right account
3. ✅ Refresh the page after switching accounts
4. ✅ Make sure contracts are deployed

**If balance shows 0 ETH:**
1. ✅ Switch to "Hardhat Local" network
2. ✅ Restart Hardhat node if needed
3. ✅ Check you imported the right private keys

---

## 💡 Pro Tips

**For demos:**
- Name your accounts clearly ("Investor", "Issuer")
- Practice switching between them
- Prepare some test transactions
- Show both perspectives to audience

**For development:**
- Keep both accounts imported
- Test all features from both sides
- Verify all permissions work correctly
- Check UI adapts to different roles

Ready to set this up? Start with Step 1 (adding the network) and let me know if you need help with any step! 🚀