# 🧹 Clean Up MetaMask: Remove Extra Accounts & Set Primary

## 🎯 Goal: Clean MetaMask with only your EcoFi accounts

---

## 🗑️ Method 1: Remove Individual Accounts

### **Step-by-Step Account Removal:**

1. **Open MetaMask**
2. **Click the account dropdown** (shows your account name/address)
3. **Select the account you want to REMOVE**
4. **Click the 3 dots (⋯)** next to the account name
5. **Click "Remove Account"**
6. **Confirm removal**

**⚠️ Note:** You can only remove IMPORTED accounts, not the original MetaMask account

---

## 🆕 Method 2: Fresh Start (Recommended for Students)

### **Complete MetaMask Reset:**

1. **Click MetaMask extension**
2. **Click the account circle** (top right)
3. **Click "Settings"**
4. **Scroll down to "Advanced"**
5. **Click "Reset Account"** (this clears transaction history)
6. **For complete reset: "Settings" → "Advanced" → "Reset Wallet"**

**⚠️ WARNING: This removes ALL accounts! Make sure you have your seed phrase saved!**

---

## ✅ Recommended Clean Setup for EcoFi

### **Fresh Import (Cleanest Method):**

1. **Remove MetaMask extension completely:**
   - Chrome: Extensions → MetaMask → Remove
   - Reinstall from Chrome Web Store

2. **Fresh Installation:**
   - Install MetaMask
   - Choose "Import using Secret Recovery Phrase" OR "Create new wallet"

3. **Add Hardhat Network FIRST:**
   ```
   Network Name: Hardhat Local
   RPC URL: http://127.0.0.1:8545
   Chain ID: 31337
   Currency Symbol: ETH
   ```

4. **Import ONLY your EcoFi accounts:**
   
   **Account 1 (Your Primary - Investor):**
   ```
   Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
   Name: "My Primary (Investor)"
   Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
   ```
   
   **Account 2 (Secondary - Issuer):**
   ```
   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   Name: "Secondary (Issuer)"
   Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   ```

---

## 🎯 Setting Primary Account

### **Make Account Your Default:**

1. **Click account dropdown**
2. **Select your preferred primary account**
3. **This becomes your default for new connections**

**💡 The account you select will be used when:**
- Connecting to new dApps
- Making transactions
- Signing messages

---

## 🧪 Quick Test After Cleanup

### **Verify Clean Setup:**

1. **Check Network:** Should show "Hardhat Local"
2. **Check Accounts:** Should only show your 2 EcoFi accounts
3. **Check Balances:** Each should show ~10,000 ETH
4. **Test Switching:** Switch between investor/issuer accounts
5. **Test dApp:** Connect to your EcoFi app with both accounts

---

## 🔄 Account Usage Strategy

### **Primary Account (Investor):**
- Use for daily testing
- Buy bonds, track investments
- General dApp interaction

### **Secondary Account (Issuer):**
- Switch to when demonstrating issuer features
- Submit environmental data
- Show project management

---

## 🚨 Backup Important Info

**Before any major changes, save these:**

```
Your EcoFi Test Accounts:

Account 1 (Primary): 
Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

Account 2 (Issuer):
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266  
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Hardhat Network:
RPC: http://127.0.0.1:8545
Chain ID: 31337
```

---

## 💡 Pro Tips

**For Clean Development:**
- Only keep accounts you actually use
- Name accounts clearly (Primary, Secondary, Test, etc.)
- Always verify you're on Hardhat Local network
- Keep a backup of private keys in a safe file

**For Demos:**
- Practice switching between accounts smoothly
- Test all features with both accounts beforehand
- Have a clean, organized account list

Would you like me to walk you through any of these methods? I recommend Method 2 (Fresh Start) for the cleanest setup! 🚀