@echo off
echo 🚀 Starting EcoFi Development Environment...
echo.

echo 📋 This script will help you start all components:
echo.

echo 1️⃣ Starting Hardhat Node...
echo Opening new terminal for Hardhat node...
start "Hardhat Node" cmd /k "cd /d D:\Projects\EcoFi\EcoFi_Citi_Blockchain\src\Backend && npx hardhat node --port 8545"

echo.
echo 2️⃣ Waiting 5 seconds for node to start...
timeout /t 5 /nobreak > nul

echo.
echo 3️⃣ Deploying contracts...
cd /d "D:\Projects\EcoFi\EcoFi_Citi_Blockchain\src\Backend"
npx hardhat run --network localhost scripts/deployCombined.js

echo.
echo 4️⃣ Starting React app...
echo Opening new terminal for React app...
start "React App" cmd /k "cd /d D:\Projects\EcoFi\EcoFi_Citi_Blockchain && npm start"

echo.
echo ✅ Setup complete! 
echo.
echo 🦊 Don't forget to:
echo 1. Configure MetaMask with Hardhat Local network
echo 2. Import test account: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
echo 3. Switch to Hardhat Local network in MetaMask
echo.
echo 📖 See setup-guide.md for detailed instructions
echo.
pause