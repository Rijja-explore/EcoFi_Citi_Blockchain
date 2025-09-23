// Environment validation and synchronization checker
import fs from "fs";
import path from "path";

function checkEnvironmentSync() {
    console.log("🔍 Checking environment synchronization...");
    
    // Define all possible .env file locations
    const envLocations = [
        { path: './src/Backend/.env', name: 'Backend .env' },
        { path: './.env', name: 'Frontend .env (root)' }
    ];

    let envData = {};
    let foundFiles = [];

    // Read all available .env files
    envLocations.forEach(location => {
        try {
            const fullPath = path.resolve(location.path);
            if (fs.existsSync(fullPath)) {
                const content = fs.readFileSync(fullPath, 'utf8');
                const parsed = {};
                content.split('\n').forEach(line => {
                    const [key, ...valueParts] = line.split('=');
                    if (key && valueParts.length > 0) {
                        parsed[key.trim()] = valueParts.join('=').trim();
                    }
                });
                envData[location.name] = parsed;
                foundFiles.push({ ...location, fullPath, exists: true });
                console.log(`✅ Found ${location.name}: ${fullPath}`);
            } else {
                foundFiles.push({ ...location, fullPath, exists: false });
                console.log(`❌ Missing ${location.name}: ${fullPath}`);
            }
        } catch (error) {
            console.log(`⚠️  Error reading ${location.name}: ${error.message}`);
        }
    });

    if (foundFiles.filter(f => f.exists).length === 0) {
        console.log("❌ No .env files found!");
        return false;
    }

    // Check critical contract addresses for consistency
    const criticalKeys = [
        'REACT_APP_BOND_FACTORY_ADDRESS',
        'REACT_APP_ESCROW_ADDRESS', 
        'REACT_APP_ORACLE_ADDRESS',
        'REACT_APP_ISSUER_ADDRESS'
    ];

    console.log("\n📋 Checking critical contract addresses:");
    
    let isConsistent = true;
    criticalKeys.forEach(key => {
        const values = new Set();
        Object.keys(envData).forEach(envFile => {
            if (envData[envFile][key]) {
                values.add(envData[envFile][key]);
            }
        });

        if (values.size === 0) {
            console.log(`⚠️  ${key}: Not found in any file`);
        } else if (values.size === 1) {
            console.log(`✅ ${key}: ${Array.from(values)[0]} (consistent)`);
        } else {
            console.log(`❌ ${key}: Inconsistent values found!`);
            values.forEach(value => console.log(`   - ${value}`));
            isConsistent = false;
        }
    });

    // Check if deployment record exists
    const recordPath = './src/Backend/deployment-record.json';
    if (fs.existsSync(recordPath)) {
        try {
            const record = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
            console.log("\n📄 Last deployment record:");
            console.log(`   Timestamp: ${record.timestamp}`);
            console.log(`   Network: ${record.network}`);
            console.log(`   Contracts deployed: ${Object.keys(record.contracts).length}`);
            console.log(`   Environments updated: ${record.environmentsUpdated}`);
        } catch (error) {
            console.log("⚠️  Could not read deployment record");
        }
    }

    return isConsistent;
}

function syncEnvironments() {
    console.log("\n🔄 Attempting to synchronize environments...");
    
    // Try to read the most recent deployment record
    const recordPath = './src/Backend/deployment-record.json';
    if (!fs.existsSync(recordPath)) {
        console.log("❌ No deployment record found. Please run deployment first.");
        return false;
    }

    try {
        const record = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
        const contracts = record.contracts;
        
        const envContent = `ESCROW_ADDRESS=${contracts.GreenBondEscrow}
ORACLE_ADDRESS=${contracts.ImpactOracle}
BOND_FACTORY_ADDRESS=${contracts.BondFactory}
UPDATER_ADDRESS=${record.accounts.updater}
ISSUER_ADDRESS=${record.accounts.deployer}
ORACLE_UPDATER_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CHAIN_ID=31337
RPC_URL=http://127.0.0.1:8545
REACT_APP_ESCROW_ADDRESS=${contracts.GreenBondEscrow}
REACT_APP_ORACLE_ADDRESS=${contracts.ImpactOracle}
REACT_APP_BOND_FACTORY_ADDRESS=${contracts.BondFactory}
REACT_APP_UPDATER_ADDRESS=${record.accounts.updater}
REACT_APP_ISSUER_ADDRESS=${record.accounts.deployer}
REACT_APP_ORACLE_UPDATER_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
REACT_APP_CHAIN_ID=31337
REACT_APP_RPC_URL=http://127.0.0.1:8545
REACT_APP_CO2_PER_KWH=0.4
REACT_APP_TREES_PER_KWH=0.02
REACT_APP_WATER_PER_KWH=0.5
`;

        // Update both backend and frontend .env files
        const locations = [
            { path: './src/Backend/.env', name: 'Backend' },
            { path: './.env', name: 'Frontend' }
        ];

        let updated = 0;
        locations.forEach(location => {
            try {
                fs.writeFileSync(location.path, envContent);
                console.log(`✅ Updated ${location.name} .env file`);
                updated++;
            } catch (error) {
                console.log(`❌ Failed to update ${location.name}: ${error.message}`);
            }
        });

        console.log(`🎉 Synchronized ${updated} environment files`);
        return updated > 0;
        
    } catch (error) {
        console.log(`❌ Error reading deployment record: ${error.message}`);
        return false;
    }
}

// Main execution
const args = process.argv.slice(2);
const command = args[0] || 'check';

switch (command) {
    case 'check':
        const isConsistent = checkEnvironmentSync();
        process.exit(isConsistent ? 0 : 1);
        break;
    case 'sync':
        const synced = syncEnvironments();
        process.exit(synced ? 0 : 1);
        break;
    case 'both':
        console.log("🔍 Step 1: Checking current state...");
        checkEnvironmentSync();
        console.log("\n🔄 Step 2: Synchronizing...");
        const bothResult = syncEnvironments();
        console.log("\n🔍 Step 3: Verifying sync...");
        const finalCheck = checkEnvironmentSync();
        process.exit(bothResult && finalCheck ? 0 : 1);
        break;
    default:
        console.log("Usage:");
        console.log("  node validateEnv.js check  - Check if environments are synchronized");
        console.log("  node validateEnv.js sync   - Synchronize environments from deployment record");
        console.log("  node validateEnv.js both   - Check, sync, then verify");
        process.exit(1);
}