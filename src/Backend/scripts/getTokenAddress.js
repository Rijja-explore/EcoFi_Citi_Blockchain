// scripts/getTokenAddress.js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const escrowAddress = process.env.ESCROW_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  try {
    // Get the deployed escrow contract
    const GreenBondEscrow = await ethers.getContractFactory("GreenBondEscrow");
    const escrow = await GreenBondEscrow.attach(escrowAddress);
  
    // Get the token address from the escrow
    const tokenAddress = await escrow.token();
    
    console.log("=================================================");
    console.log("BondToken Address:", tokenAddress);
    console.log("=================================================");
    console.log(`\nREACT_APP_BOND_TOKEN_ADDRESS=${tokenAddress}`);
  } catch (error) {
    console.error("Error fetching token address:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });