// scripts/updateOracleUpdater.js
import hre from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  // Get signers - deployer is the oracle owner
  const [deployer, investor] = await hre.ethers.getSigners();
  
  // Issuer account (should be able to submit impact data)
  const issuerAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  
  console.log("🔧 Updating Oracle Updater Permissions...");
  console.log("Deployer (Oracle Owner):", deployer.address);
  console.log("Current Updater (Investor):", investor.address);
  console.log("New Updater (Issuer):", issuerAddress);
  
  // Get oracle contract address from environment
  const oracleAddress = process.env.ORACLE_ADDRESS;
  if (!oracleAddress) {
    throw new Error("ORACLE_ADDRESS not found in environment variables");
  }
  
  console.log("Oracle Contract:", oracleAddress);
  
  // Connect to oracle contract
  const Oracle = await hre.ethers.getContractFactory("ImpactOracle");
  const oracle = Oracle.attach(oracleAddress);
  
  // Update the updater to be the issuer address
  console.log("📝 Setting oracle updater to issuer address...");
  const tx = await oracle.connect(deployer).setUpdater(issuerAddress);
  await tx.wait();
  
  console.log("✅ Oracle updater changed successfully!");
  console.log("🎯 The Issuer account can now submit impact data");
  
  // Verify the change
  const currentUpdater = await oracle.updater();
  console.log("✅ Verified - Current updater:", currentUpdater);
  
  if (currentUpdater.toLowerCase() === issuerAddress.toLowerCase()) {
    console.log("🎉 SUCCESS! Issuer can now submit impact data");
  } else {
    console.log("❌ ERROR! Updater was not set correctly");
  }
}

main().catch((error) => {
  console.error("❌ Update failed:", error);
  process.exitCode = 1;
});