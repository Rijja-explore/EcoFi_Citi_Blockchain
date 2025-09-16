const dotenv = require("dotenv");
const { ethers } = require("ethers");

dotenv.config();

async function main() {
  const { SEPOLIA_RPC_URL, ORACLE_UPDATER_KEY } = process.env;
  
  const rpcUrl = SEPOLIA_RPC_URL || "http://127.0.0.1:8545";
  
  if (!ORACLE_UPDATER_KEY) {
    throw new Error("Missing env: ORACLE_UPDATER_KEY required");
  }

  console.log("💰 Funding updater wallet...");
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  // Get deployer (has funds from hardhat node)
  const deployerSigner = await provider.getSigner(0);
  
  // Get updater address
  const updaterWallet = new ethers.Wallet(ORACLE_UPDATER_KEY);
  const updaterAddress = updaterWallet.address;
  
  console.log("Deployer address:", await deployerSigner.getAddress());
  console.log("Updater address:", updaterAddress);
  
  // Check current balance
  const currentBalance = await provider.getBalance(updaterAddress);
  console.log("Current updater balance:", ethers.formatEther(currentBalance), "ETH");
  
  if (currentBalance < ethers.parseEther("0.1")) {
    console.log("🚀 Sending 1 ETH to updater for gas...");
    const tx = await deployerSigner.sendTransaction({
      to: updaterAddress,
      value: ethers.parseEther("1.0")
    });
    await tx.wait();
    console.log("✅ Funding complete!");
    
    const newBalance = await provider.getBalance(updaterAddress);
    console.log("New updater balance:", ethers.formatEther(newBalance), "ETH");
  } else {
    console.log("✅ Updater already has sufficient balance!");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});