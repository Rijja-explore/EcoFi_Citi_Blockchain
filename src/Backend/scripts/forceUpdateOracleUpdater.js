// scripts/forceUpdateOracleUpdater.js
import hre from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🔧 Force Update Oracle Updater (Emergency Fix)...");
  
  // Get all signers
  const signers = await hre.ethers.getSigners();
  const [deployer, investor] = signers;
  
  // Issuer account address
  const issuerAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  
  console.log("Available signers:");
  for (let i = 0; i < signers.length; i++) {
    console.log(`  Signer ${i}: ${signers[i].address}`);
  }
  
  console.log(`\nTarget Issuer: ${issuerAddress}`);
  
  // Get oracle contract address
  const oracleAddress = process.env.ORACLE_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  console.log(`Oracle Contract: ${oracleAddress}`);
  
  // Connect to oracle contract as the deployer (owner)
  const Oracle = await hre.ethers.getContractFactory("ImpactOracle");
  const oracle = Oracle.attach(oracleAddress);
  
  // Check current state
  console.log("\n📋 Current State:");
  try {
    const currentUpdater = await oracle.updater();
    const owner = await oracle.owner();
    console.log(`  Current Updater: ${currentUpdater}`);
    console.log(`  Contract Owner: ${owner}`);
    
    // If deployer is owner, update the updater
    if (owner.toLowerCase() === deployer.address.toLowerCase()) {
      console.log("\n🔄 Updating updater as contract owner...");
      const tx = await oracle.connect(deployer).setUpdater(issuerAddress);
      await tx.wait();
      console.log("✅ Updater updated successfully!");
    } else if (owner.toLowerCase() === issuerAddress.toLowerCase()) {
      console.log("\n🔄 Issuer is owner, setting itself as updater...");
      // Find the issuer signer
      const issuerSigner = signers.find(s => s.address.toLowerCase() === issuerAddress.toLowerCase());
      if (issuerSigner) {
        const tx = await oracle.connect(issuerSigner).setUpdater(issuerAddress);
        await tx.wait();
        console.log("✅ Issuer set itself as updater!");
      } else {
        console.log("❌ Issuer signer not found in available signers");
      }
    }
    
    // Verify the update
    const newUpdater = await oracle.updater();
    console.log(`\n✅ Final Updater: ${newUpdater}`);
    console.log(`✅ Is Issuer updater? ${newUpdater.toLowerCase() === issuerAddress.toLowerCase()}`);
    
  } catch (error) {
    console.error("❌ Error accessing oracle:", error.message);
  }
}

main().catch((error) => {
  console.error("❌ Force update failed:", error);
  process.exitCode = 1;
});