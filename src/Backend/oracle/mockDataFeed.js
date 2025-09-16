const dotenv = require("dotenv");
const { ethers } = require("ethers");

dotenv.config();

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function runLoop() {
  const { SEPOLIA_RPC_URL, ORACLE_ADDRESS, ORACLE_UPDATER_KEY } = process.env;
  if (!SEPOLIA_RPC_URL || !ORACLE_ADDRESS || !ORACLE_UPDATER_KEY) {
    throw new Error("Missing env: SEPOLIA_RPC_URL, ORACLE_ADDRESS, ORACLE_UPDATER_KEY");
  }
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(ORACLE_UPDATER_KEY, provider);
  const abi = [
    "function pushImpact(uint256 deltaKwh, uint256 deltaCo2Kg) external",
    "function cumulativeKwh() view returns (uint256)"
  ];
  const oracle = new ethers.Contract(ORACLE_ADDRESS, abi, wallet);

  console.log("Starting mock feed…");
  // Push every 30 seconds
  setInterval(async () => {
    try {
      // Daytime-ish variability
      const deltaKwh = randomInt(250, 800);     // adjust as desired
      const deltaCo2 = Math.floor(deltaKwh * 0.7); // rough kg CO2 offset per kWh

      const tx = await oracle.pushImpact(deltaKwh, deltaCo2);
      console.log(`Pushed ΔkWh=${deltaKwh}, ΔCO2=${deltaCo2} -> tx ${tx.hash}`);
      await tx.wait();
      const kwh = await oracle.cumulativeKwh();
      console.log("Cumulative kWh:", kwh.toString());
    } catch (e) {
      console.error("Push failed:", e.message);
    }
  }, 30_000);
}

runLoop().catch((e) => {
  console.error(e);
  process.exit(1);
});
