// Emergency fix: Set issuer as oracle updater
import hre from "hardhat";

async function main() {
  const [issuer] = await hre.ethers.getSigners();
  const oracleAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  
  const Oracle = await hre.ethers.getContractFactory("ImpactOracle");
  const oracle = Oracle.attach(oracleAddress);
  
  // Set issuer as updater
  await oracle.connect(issuer).setUpdater(issuer.address);
  console.log("✅ Issuer is now oracle updater!");
  
  // Verify
  const updater = await oracle.updater();
  console.log("Current updater:", updater);
  console.log("Issuer address:", issuer.address);
  console.log("Match?", updater.toLowerCase() === issuer.address.toLowerCase());
}

main().catch(console.error);