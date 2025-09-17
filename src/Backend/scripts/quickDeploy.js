// Quick deployment and setup script
import hre from "hardhat";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🚀 Quick Deploy and Setup...");
  
  const [deployer] = await hre.ethers.getSigners();
  const issuerAddress = deployer.address; // Issuer is the deployer
  
  console.log("Deployer/Issuer:", issuerAddress);

  // --- Deploy Contracts (minimal version) ---
  const capTokens = hre.ethers.parseUnits("1000000", 18);
  const priceWeiPerToken = hre.ethers.parseUnits("0.01", "ether");
  const now = Math.floor(Date.now() / 1000);
  const saleStart = now + 60;
  const saleEnd = now + 3600;
  const thresholds = [5000, 10000, 20000];
  const bps = [3000, 3000, 4000];

  // Deploy Escrow
  const GreenBondEscrow = await hre.ethers.getContractFactory("GreenBondEscrow");
  const escrow = await GreenBondEscrow.deploy(
    issuerAddress, issuerAddress, "Green Bond Token", "GBT",
    capTokens, priceWeiPerToken, saleStart, saleEnd, thresholds, bps
  );
  await escrow.waitForDeployment();

  // Deploy Oracle
  const Oracle = await hre.ethers.getContractFactory("ImpactOracle");
  const oracle = await Oracle.deploy(issuerAddress); // Owner is issuer
  await oracle.waitForDeployment();

  // Link contracts
  await oracle.setEscrow(escrow.target);
  await escrow.setOracle(oracle.target);
  await oracle.setUpdater(issuerAddress); // ISSUER IS UPDATER

  // Set bond token minter
  const bondTokenAddr = await escrow.token();
  const BondToken = await hre.ethers.getContractFactory("BondToken");
  const bondToken = BondToken.attach(bondTokenAddr);
  await bondToken.setMinter(escrow.target);

  console.log("✅ Deployment Complete!");
  console.log("Escrow:", escrow.target);
  console.log("Oracle:", oracle.target);
  console.log("Issuer/Updater:", issuerAddress);

  // Update .env file
  const envPath = path.join(process.cwd(), ".env");
  const envContent = `ESCROW_ADDRESS=${escrow.target}
ORACLE_ADDRESS=${oracle.target}
UPDATER_ADDRESS=${issuerAddress}
ISSUER_ADDRESS=${issuerAddress}
ORACLE_UPDATER_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CHAIN_ID=31337
RPC_URL=http://127.0.0.1:8545
REACT_APP_ESCROW_ADDRESS=${escrow.target}
REACT_APP_ORACLE_ADDRESS=${oracle.target}
REACT_APP_UPDATER_ADDRESS=${issuerAddress}
REACT_APP_ISSUER_ADDRESS=${issuerAddress}
REACT_APP_CHAIN_ID=31337`;

  fs.writeFileSync(envPath, envContent);
  console.log("✅ .env updated!");

  // Copy to frontend .env
  const frontendEnvPath = path.join(process.cwd(), "..", "..", ".env");
  try {
    fs.writeFileSync(frontendEnvPath, envContent);
    console.log("✅ Frontend .env updated!");
  } catch (error) {
    console.log("⚠️ Could not update frontend .env:", error.message);
  }

  console.log("\n🎯 READY TO USE!");
  console.log("Issuer can now submit impact data!");
}

main().catch(console.error);