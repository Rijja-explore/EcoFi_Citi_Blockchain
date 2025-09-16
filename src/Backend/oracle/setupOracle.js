const dotenv = require("dotenv");
const { ethers } = require("ethers");

dotenv.config();

async function main() {
  const { SEPOLIA_RPC_URL, ORACLE_ADDRESS, ORACLE_UPDATER_KEY } = process.env;
  
  const rpcUrl = SEPOLIA_RPC_URL || "http://127.0.0.1:8545";
  
  if (!ORACLE_ADDRESS || !ORACLE_UPDATER_KEY) {
    throw new Error("Missing env: ORACLE_ADDRESS and ORACLE_UPDATER_KEY required");
  }

  console.log("🔧 Setting up oracle updater...");
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  // Use the first account (deployer) to set the updater
  const deployerSigner = await provider.getSigner(0);
  
  // Create wallet from the updater key to get its address
  const updaterWallet = new ethers.Wallet(ORACLE_UPDATER_KEY);
  const updaterAddress = updaterWallet.address;
  
  console.log("Deployer address:", await deployerSigner.getAddress());
  console.log("Updater address:", updaterAddress);
  
  const oracleAbi = [
    "function setUpdater(address _updater) external",
    "function updater() view returns (address)",
    "function owner() view returns (address)"
  ];
  
  const oracle = new ethers.Contract(ORACLE_ADDRESS, oracleAbi, deployerSigner);

  // Check current state
  const currentUpdater = await oracle.updater();
  const owner = await oracle.owner();
  console.log("Current updater:", currentUpdater);
  console.log("Oracle owner:", owner);

  if (currentUpdater.toLowerCase() !== updaterAddress.toLowerCase()) {
    console.log("🔄 Setting updater address...");
    const tx = await oracle.setUpdater(updaterAddress);
    await tx.wait();
    console.log("✅ Updater set successfully!");
  } else {
    console.log("✅ Updater already set correctly!");
  }

  // Verify the setting
  const newUpdater = await oracle.updater();
  console.log("Verified updater address:", newUpdater);
  
  if (newUpdater.toLowerCase() === updaterAddress.toLowerCase()) {
    console.log("🎉 Oracle is ready for updates!");
  } else {
    console.error("❌ Failed to set updater correctly");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});