import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

async function main() {
  const { SEPOLIA_RPC_URL, ORACLE_ADDRESS, ORACLE_UPDATER_KEY } = process.env;
  
  // For localhost testing, use these defaults
  const rpcUrl = SEPOLIA_RPC_URL || "http://127.0.0.1:8545";
  
  if (!ORACLE_ADDRESS || !ORACLE_UPDATER_KEY) {
    throw new Error("Missing env: ORACLE_ADDRESS and ORACLE_UPDATER_KEY required");
  }

  console.log("🛰️ Connecting to oracle...");
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(ORACLE_UPDATER_KEY, provider);
  
  const abi = [
    "function pushImpact(uint256 deltaKwh, uint256 deltaCo2Kg) external",
    "function cumulativeKwh() view returns (uint256)",
    "function cumulativeCo2Kg() view returns (uint256)"
  ];
  
  const oracle = new ethers.Contract(ORACLE_ADDRESS, abi, wallet);

  // Example: push 5000 kWh and 3500 kg CO2 saved
  const deltaKwh = 5000;
  const deltaCo2 = 3500;

  console.log(`📊 Pushing impact: ${deltaKwh} kWh, ${deltaCo2} kg CO2...`);
  const tx = await oracle.pushImpact(deltaKwh, deltaCo2);
  console.log("⏳ Transaction sent:", tx.hash);
  
  await tx.wait();
  console.log("✅ Update confirmed!");
  
  const kwh = await oracle.cumulativeKwh();
  const co2 = await oracle.cumulativeCo2Kg();
  console.log("📈 New totals - kWh:", kwh.toString(), "CO2kg:", co2.toString());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});