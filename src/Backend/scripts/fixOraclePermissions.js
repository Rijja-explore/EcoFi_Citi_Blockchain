// Fix oracle permissions for current deployment
import hre from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🔧 Fixing Oracle Permissions for Current Deployment...");
  
  const [issuer] = await hre.ethers.getSigners();
  const oracleAddress = process.env.ORACLE_ADDRESS;
  
  console.log("Issuer (should be oracle owner & updater):", issuer.address);
  console.log("Oracle contract address:", oracleAddress);
  
  // Connect to oracle contract
  const Oracle = await hre.ethers.getContractFactory("ImpactOracle");
  const oracle = Oracle.attach(oracleAddress);
  
  try {
    // Check current state
    const currentOwner = await oracle.owner();
    const currentUpdater = await oracle.updater();
    
    console.log("Current oracle owner:", currentOwner);
    console.log("Current oracle updater:", currentUpdater);
    
    // Set issuer as updater (issuer should already be owner since they deployed it)
    if (currentUpdater.toLowerCase() !== issuer.address.toLowerCase()) {
      console.log("🔄 Setting issuer as oracle updater...");
      const tx = await oracle.connect(issuer).setUpdater(issuer.address);
      await tx.wait();
      console.log("✅ Issuer is now oracle updater!");
    } else {
      console.log("✅ Issuer is already the oracle updater!");
    }
    
    // Verify final state
    const finalUpdater = await oracle.updater();
    console.log("Final oracle updater:", finalUpdater);
    
    console.log("\n🎯 Status:");
    console.log("✅ Oracle setup complete!");
    console.log("✅ Issuer can now submit impact data!");
    
  } catch (error) {
    console.error("❌ Failed to fix oracle permissions:", error);
  }
}

main().catch(console.error);