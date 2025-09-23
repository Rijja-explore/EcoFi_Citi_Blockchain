@echo off
echo 🎓 Student-Safe EcoFi Startup (Fixed Addresses)
echo ================================================
echo.
echo ✅ This script ensures:
echo    - Same addresses every time
echo    - No real money spent  
echo    - Safe for students
echo.

echo 🔧 Step 1: Starting Hardhat with FIXED addresses...
cd /d "D:\Projects\EcoFi\EcoFi_Citi_Blockchain\src\Backend"

echo.
echo 📋 Your accounts will ALWAYS be:
echo Account #1 (Issuer):  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
echo Account #2 (User):    0x70997970C51812dc3A010C7d01b50e0d17dc79C8  
echo Account #3 (User):    0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
echo.
echo 🔑 Import these private keys to MetaMask (one-time setup):
echo Key #1: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
echo Key #2: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
echo Key #3: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
echo.

echo 🚀 Starting Hardhat node with fixed accounts...
start "Hardhat Node (Fixed)" cmd /k "npx hardhat node --hostname 127.0.0.1 --port 8545"

echo.
echo ⏳ Waiting 5 seconds for node to start...
timeout /t 5 /nobreak > nul

echo.
echo 📦 Deploying contracts...
npx hardhat run --network localhost scripts/deployCombined.js

if %errorlevel% equ 0 (
    echo.
    echo ✅ Contracts deployed successfully!
    echo.
    echo 🌐 Starting React app...
    cd /d "D:\Projects\EcoFi\EcoFi_Citi_Blockchain"
    start "React App" cmd /k "npm start"
    
    echo.
    echo 🎉 Setup Complete!
    echo.
    echo 📱 MetaMask Setup (ONE-TIME ONLY):
    echo 1. Add Hardhat Local network if not already added
    echo 2. Import the 3 accounts using private keys above
    echo 3. Switch between accounts to test different roles
    echo.
    echo 💡 Remember: All transactions use FAKE ETH - no real money!
    echo.
) else (
    echo.
    echo ❌ Contract deployment failed!
    echo Make sure Hardhat node is running properly.
)

pause