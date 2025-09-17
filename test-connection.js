// Simple test to verify contract connection
const { ethers } = require('ethers');
require('dotenv').config();

async function testConnection() {
    console.log('🧪 Testing EcoFi Contract Connection...\n');
    
    try {
        // Test 1: Check if Hardhat node is running
        console.log('1️⃣ Testing Hardhat node connection...');
        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        const blockNumber = await provider.getBlockNumber();
        console.log(`✅ Hardhat node is running (Block: ${blockNumber})\n`);
        
        // Test 2: Check environment variables
        console.log('2️⃣ Checking environment variables...');
        const escrowAddr = process.env.REACT_APP_ESCROW_ADDRESS;
        const oracleAddr = process.env.REACT_APP_ORACLE_ADDRESS;
        
        if (!escrowAddr || !oracleAddr) {
            console.log('❌ Environment variables missing!');
            console.log('Run: npx hardhat run --network localhost scripts/deployCombined.js');
            return;
        }
        
        console.log(`✅ Escrow: ${escrowAddr}`);
        console.log(`✅ Oracle: ${oracleAddr}\n`);
        
        // Test 3: Check if contracts exist
        console.log('3️⃣ Testing contract deployment...');
        const escrowCode = await provider.getCode(escrowAddr);
        if (escrowCode === '0x') {
            console.log('❌ No contract found at escrow address!');
            console.log('Run: npx hardhat run --network localhost scripts/deployCombined.js');
            return;
        }
        console.log('✅ Contracts are deployed\n');
        
        // Test 4: Test contract calls
        console.log('4️⃣ Testing contract method calls...');
        const escrowABI = require('./src/Backend/artifacts/contracts/GreenBondEscrow.sol/GreenBondEscrow.json');
        const escrow = new ethers.Contract(escrowAddr, escrowABI.abi, provider);
        
        const price = await escrow.priceWeiPerToken();
        const tokens = await escrow.capTokens();
        const issuer = await escrow.issuer();
        
        console.log(`✅ Price per token: ${ethers.formatEther(price)} ETH`);
        console.log(`✅ Cap tokens: ${ethers.formatEther(tokens)}`);
        console.log(`✅ Issuer: ${issuer}\n`);
        
        console.log('🎉 ALL TESTS PASSED!');
        console.log('📱 Now configure MetaMask:');
        console.log('   - Network: Hardhat Local');
        console.log('   - RPC: http://127.0.0.1:8545');
        console.log('   - Chain ID: 31337');
        console.log('   - Import account: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
        
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 Solution: Start Hardhat node first:');
            console.log('   cd D:\\Projects\\EcoFi\\EcoFi_Citi_Blockchain\\src\\Backend');
            console.log('   npx hardhat node --port 8545');
        }
    }
}

testConnection();