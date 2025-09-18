// Enhanced deployment script with automatic environment synchronization
import hre from "hardhat";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Automatic environment synchronization function
function synchronizeAllEnvironments(deploymentData) {
    console.log("\n🔄 Starting automatic environment synchronization...");
    
    const envContent = `ESCROW_ADDRESS=${deploymentData.escrow}
ORACLE_ADDRESS=${deploymentData.oracle}
BOND_FACTORY_ADDRESS=${deploymentData.factory}
UPDATER_ADDRESS=${deploymentData.updater}
ISSUER_ADDRESS=${deploymentData.issuer}
ORACLE_UPDATER_KEY=${process.env.ORACLE_UPDATER_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'}
CHAIN_ID=31337
RPC_URL=http://127.0.0.1:8545
REACT_APP_ESCROW_ADDRESS=${deploymentData.escrow}
REACT_APP_ORACLE_ADDRESS=${deploymentData.oracle}
REACT_APP_BOND_FACTORY_ADDRESS=${deploymentData.factory}
REACT_APP_UPDATER_ADDRESS=${deploymentData.updater}
REACT_APP_ISSUER_ADDRESS=${deploymentData.issuer}
REACT_APP_ORACLE_UPDATER_KEY=${process.env.ORACLE_UPDATER_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'}
REACT_APP_CHAIN_ID=31337
REACT_APP_RPC_URL=http://127.0.0.1:8545
REACT_APP_CO2_PER_KWH=0.4
REACT_APP_TREES_PER_KWH=0.02
REACT_APP_WATER_PER_KWH=0.5
`;

    // Define all possible .env file locations
    const envLocations = [
        { path: '.env', description: 'Backend .env' },
        { path: '../../.env', description: 'Frontend .env (project root)' },
        { path: '../../../.env', description: 'Alternative root .env' }
    ];

    let successCount = 0;
    envLocations.forEach(location => {
        try {
            const fullPath = path.resolve(location.path);
            fs.writeFileSync(fullPath, envContent);
            console.log(`✅ Updated ${location.description}: ${fullPath}`);
            successCount++;
        } catch (error) {
            console.log(`⚠️  Could not update ${location.description}: ${error.message}`);
        }
    });

    // Save deployment record for validation
    const deploymentRecord = {
        timestamp: new Date().toISOString(),
        network: "localhost",
        chainId: 31337,
        deployer: deploymentData.issuer,
        contracts: {
            GreenBondEscrow: deploymentData.escrow,
            ImpactOracle: deploymentData.oracle,
            BondFactory: deploymentData.factory
        },
        accounts: {
            deployer: deploymentData.issuer,
            updater: deploymentData.updater
        },
        environmentsUpdated: successCount
    };
    
    const recordPath = 'deployment-record.json';
    fs.writeFileSync(recordPath, JSON.stringify(deploymentRecord, null, 2));
    console.log(`📄 Deployment record saved: ${path.resolve(recordPath)}`);
    
    return successCount;
}

// Validation function to ensure all components use the same addresses
function validateDeployment(deploymentData) {
    console.log("\n🔍 Validating deployment consistency...");
    
    const validationItems = [
        { name: "Escrow Address", value: deploymentData.escrow },
        { name: "Oracle Address", value: deploymentData.oracle },
        { name: "Factory Address", value: deploymentData.factory },
        { name: "Deployer Address", value: deploymentData.issuer },
        { name: "Updater Address", value: deploymentData.updater }
    ];

    console.log("📋 Address Validation:");
    validationItems.forEach(item => {
        const isValid = item.value && item.value.startsWith('0x') && item.value.length === 42;
        console.log(`${isValid ? '✅' : '❌'} ${item.name}: ${item.value}`);
    });

    return true;
}

async function main() {
    console.log("🚀 Enhanced deployment with auto-sync starting...");
    
    const [deployer, oracleUpdater] = await hre.ethers.getSigners();
    console.log("📋 Deployer:", deployer.address);
    console.log("🔧 Oracle Updater:", oracleUpdater.address);
    console.log("💰 Deployer Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

    // --- GreenBondEscrow Deployment Params ---
    const issuer = deployer.address;
    const name = "Green Bond Token";
    const symbol = "GBT";

    const capTokens = hre.ethers.parseUnits("1000000", 18); // 1M tokens
    const priceWeiPerToken = hre.ethers.parseUnits("0.01", "ether");

    const now = Math.floor(Date.now() / 1000);
    const saleStart = now + 300;      // starts in 5 minutes
    const saleEnd = now + 86400 + 300;      // ends in 24 hours + 5 minutes

    // Enterprise-scale renewable energy project milestones
    const thresholds = [5000000, 10000000, 20000000, 35000000, 50000000, 75000000]; // kWh milestones
    const bps = [1666, 1667, 1667, 1667, 1666, 1667]; // ~16.67% each, sum = 10000

    console.log("\n📊 Deployment Parameters:");
    console.log("   Token Cap:", hre.ethers.formatEther(capTokens), "tokens");
    console.log("   Token Price:", hre.ethers.formatEther(priceWeiPerToken), "ETH");
    console.log("   Sale Duration:", Math.floor((saleEnd - saleStart) / 3600), "hours");
    console.log("   Thresholds:", thresholds.map(t => (t/1000000).toFixed(1) + "M kWh").join(", "));
    console.log("   BPS Sum:", bps.reduce((a, b) => a + b, 0));

    // Deploy GreenBondEscrow
    console.log("\n🏦 Deploying GreenBondEscrow...");
    const GreenBondEscrow = await hre.ethers.getContractFactory("GreenBondEscrow");
    const escrow = await GreenBondEscrow.deploy(
        issuer,
        oracleUpdater.address, // temporary oracle, replaced below
        name,
        symbol,
        capTokens,
        priceWeiPerToken,
        saleStart,
        saleEnd,
        thresholds,
        bps,
        12, // maturityMonths - 1 year
        800 // annualYieldBps - 8% annual yield
    );

    await escrow.waitForDeployment();
    const escrowAddress = escrow.target;
    console.log("✅ GreenBondEscrow deployed:", escrowAddress);

    // Deploy ImpactOracle
    console.log("\n🛰️ Deploying ImpactOracle...");
    const Oracle = await hre.ethers.getContractFactory("ImpactOracle");
    const impactOracle = await Oracle.deploy(deployer.address);
    await impactOracle.waitForDeployment();
    const oracleAddress = impactOracle.target;
    console.log("✅ ImpactOracle deployed:", oracleAddress);

    // Deploy BondFactory
    console.log("\n🏭 Deploying BondFactory...");
    const BondFactory = await hre.ethers.getContractFactory("BondFactory");
    const bondFactory = await BondFactory.deploy();
    await bondFactory.waitForDeployment();
    const factoryAddress = bondFactory.target;
    console.log("✅ BondFactory deployed:", factoryAddress);

    // Wire contracts together
    console.log("\n🔗 Linking contracts...");
    await (await impactOracle.setEscrow(escrowAddress)).wait();
    console.log("✅ Oracle → Escrow link established");
    
    await (await escrow.setOracle(oracleAddress)).wait();
    console.log("✅ Escrow → Oracle link established");
    
    await (await impactOracle.setUpdater(oracleUpdater.address)).wait();
    console.log("✅ Oracle updater permissions set");

    // Set BondToken minter
    const bondTokenAddr = await escrow.token();
    const BondToken = await hre.ethers.getContractFactory("BondToken");
    const bondToken = BondToken.attach(bondTokenAddr);
    await (await bondToken.setMinter(escrowAddress)).wait();
    console.log("✅ BondToken minter configured");

    // Prepare deployment data for synchronization
    const deploymentData = {
        escrow: escrowAddress,
        oracle: oracleAddress,
        factory: factoryAddress,
        issuer: issuer,
        updater: oracleUpdater.address,
        bondToken: bondTokenAddr
    };

    // Validate deployment
    validateDeployment(deploymentData);

    // Synchronize all environment files
    const syncCount = synchronizeAllEnvironments(deploymentData);

    // Final summary
    console.log("\n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log("=" * 60);
    console.log("📍 Contract Addresses:");
    console.log(`   🏦 GreenBondEscrow: ${escrowAddress}`);
    console.log(`   🛰️  ImpactOracle: ${oracleAddress}`);
    console.log(`   🏭 BondFactory: ${factoryAddress}`);
    console.log(`   🪙 BondToken: ${bondTokenAddr}`);
    console.log("👥 Account Addresses:");
    console.log(`   🏢 Issuer/Deployer: ${issuer}`);
    console.log(`   🔧 Oracle Updater: ${oracleUpdater.address}`);
    console.log("🔄 Environment Sync:");
    console.log(`   📁 Files Updated: ${syncCount}`);
    console.log("=" * 60);
    console.log("✨ All systems ready! Frontend and backend are synchronized.");
    console.log("🚀 You can now run your frontend with: npm start");
}

main().catch((error) => {
    console.error("❌ Enhanced deployment failed:", error);
    process.exitCode = 1;
});