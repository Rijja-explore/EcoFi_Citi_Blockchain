// scripts/checkOracleState.js
import hre from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🔍 Checking Oracle Contract State...");
  
  // Get oracle contract address
  const oracleAddress = process.env.ORACLE_ADDRESS;
  console.log("Oracle Contract:", oracleAddress);
  
  // Connect to oracle contract
  const Oracle = await hre.ethers.getContractFactory("ImpactOracle");
  const oracle = Oracle.attach(oracleAddress);
  
  // Check current updater
  const currentUpdater = await oracle.updater();
  console.log("Current Updater:", currentUpdater);
  
  // Check owner
  const owner = await oracle.owner();
  console.log("Contract Owner:", owner);
  
  // Expected addresses
  const issuerAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const investorAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  
  console.log("\n📋 Address Comparison:");
  console.log("Issuer Address:  ", issuerAddress);
  console.log("Investor Address:", investorAddress);
  console.log("Current Updater: ", currentUpdater);
  console.log("Contract Owner:  ", owner);
  
  console.log("\n✅ Status:");
  console.log("Is Issuer the updater?", currentUpdater.toLowerCase() === issuerAddress.toLowerCase());
  console.log("Is Issuer the owner?", owner.toLowerCase() === issuerAddress.toLowerCase());
}

main().catch((error) => {
  console.error("❌ Check failed:", error);
  process.exitCode = 1;
});