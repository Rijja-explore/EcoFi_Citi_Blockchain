// scripts/deploy.js
import hre from "hardhat";

async function main() {
  const [deployer, oracle] = await hre.ethers.getSigners();

  console.log("Deploying contracts with:", deployer.address);

  // Example deployment params
  const issuer = deployer.address;
  const oracleAddr = oracle.address;
  const name = "Green Bond Token";
  const symbol = "GBT";

  const capTokens = hre.ethers.parseUnits("1000000", 18); // 1 million tokens
  const priceWeiPerToken = hre.ethers.parseUnits("0.01", "ether"); // 0.01 ETH per token

  const now = Math.floor(Date.now() / 1000);
  const saleStart = now + 60; // starts in 1 min
  const saleEnd = now + 3600; // ends in 1 hour

  const thresholds = [100, 200, 300]; // dummy metric thresholds
  const bps = [3000, 3000, 4000]; // must sum to 10000

  // Deploy GreenBondEscrow with all args
  const GreenBondEscrow = await hre.ethers.getContractFactory("GreenBondEscrow");
  const escrow = await GreenBondEscrow.deploy(
    issuer,
    oracleAddr,
    name,
    symbol,
    capTokens,
    priceWeiPerToken,
    saleStart,
    saleEnd,
    thresholds,
    bps
  );

  await escrow.waitForDeployment();
  console.log("✅ GreenBondEscrow deployed at:", escrow.target);

  // Fetch the BondToken deployed *inside* GreenBondEscrow
  // after deploying escrow
const bondTokenAddr = await escrow.token();
const BondToken = await hre.ethers.getContractFactory("BondToken");
const bondToken = BondToken.attach(bondTokenAddr);

// call setMinter from deployer (the owner)
await bondToken.setMinter(escrow.target);
console.log("✅ BondToken minter set to escrow");

}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
