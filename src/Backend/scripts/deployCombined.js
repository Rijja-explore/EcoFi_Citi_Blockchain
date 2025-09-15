// // scripts/deployCombined.js
// import hre from "hardhat";

// async function main() {
//   const [deployer, oracleUpdater] = await hre.ethers.getSigners();

//   console.log("🚀 Deploying Green Bond system...");
//   console.log("Deployer:", deployer.address);
//   console.log("Oracle updater (EOA):", oracleUpdater.address);

//   // --- GreenBondEscrow Deployment Params ---
//   const issuer = deployer.address;
//   const name = "Green Bond Token";
//   const symbol = "GBT";

//   const capTokens = hre.ethers.parseUnits("1000000", 18); // 1M tokens
//   const priceWeiPerToken = hre.ethers.parseUnits("0.01", "ether");

//   const now = Math.floor(Date.now() / 1000);
//   const saleStart = now + 60;      // starts in 1 min
//   const saleEnd = now + 3600;      // ends in 1 hour

//   // Example metric thresholds & release bps (must sum to 10000)
//   const thresholds = [5000, 10000, 20000];
//   const bps = [3000, 3000, 4000];

//   console.log("📦 Deploying GreenBondEscrow...");
//   const GreenBondEscrow = await hre.ethers.getContractFactory("GreenBondEscrow");
//   const escrow = await GreenBondEscrow.deploy(
//     issuer,
//     oracleUpdater.address,  // temporary oracle, replaced below
//     name,
//     symbol,
//     capTokens,
//     priceWeiPerToken,
//     saleStart,
//     saleEnd,
//     thresholds,
//     bps
//   );

//   await escrow.waitForDeployment();
//   console.log("✅ GreenBondEscrow deployed at:", escrow.target);

//   // --- Deploy ImpactOracle ---
//   console.log("🛰️ Deploying ImpactOracle...");
//   const Oracle = await hre.ethers.getContractFactory("ImpactOracle");
//   const impactOracle = await Oracle.deploy(deployer.address);
//   await impactOracle.waitForDeployment();
//   console.log("✅ ImpactOracle deployed at:", impactOracle.target);

//   // --- Wire Oracle <-> Escrow ---
//   console.log("🔗 Linking oracle to escrow...");
//   await (await impactOracle.setEscrow(escrow.target)).wait();
//   await (await escrow.setOracle(impactOracle.target)).wait();
//   await (await impactOracle.setUpdater(oracleUpdater.address)).wait();

//   // --- Set BondToken Minter ---
//   const bondTokenAddr = await escrow.token();
//   const BondToken = await hre.ethers.getContractFactory("BondToken");
//   const bondToken = BondToken.attach(bondTokenAddr);
//   await (await bondToken.setMinter(escrow.target)).wait();
//   console.log("✅ BondToken minter set to escrow");

//   console.log("\n🎉 DEPLOYMENT COMPLETE!");
//   console.log("=".repeat(50));
//   console.log("ESCROW_ADDRESS=" + escrow.target);
//   console.log("ORACLE_ADDRESS=" + impactOracle.target);
//   console.log("UPDATER_ADDRESS=" + oracleUpdater.address);
//   console.log("ISSUER_ADDRESS=" + issuer);
//   console.log("=".repeat(50));
//   console.log("💡 Add ESCROW_ADDRESS, ORACLE_ADDRESS, ORACLE_UPDATER_KEY to your .env for oracle scripts.");
// }

// main().catch((error) => {
//   console.error("❌ Deployment failed:", error);
//   process.exitCode = 1;
// });


// scripts/deployCombined.js
import hre from "hardhat";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer, oracleUpdater] = await hre.ethers.getSigners();

  console.log("🚀 Deploying Green Bond system...");
  console.log("Deployer:", deployer.address);
  console.log("Oracle updater (EOA):", oracleUpdater.address);

  // --- GreenBondEscrow Deployment Params ---
  const issuer = deployer.address;
  const name = "Green Bond Token";
  const symbol = "GBT";

  const capTokens = hre.ethers.parseUnits("1000000", 18); // 1M tokens
  const priceWeiPerToken = hre.ethers.parseUnits("0.01", "ether");

  const now = Math.floor(Date.now() / 1000);
  const saleStart = now + 60;      // starts in 1 min
  const saleEnd = now + 3600;      // ends in 1 hour

  // Example metric thresholds & release bps (must sum to 10000)
  const thresholds = [5000, 10000, 20000];
  const bps = [3000, 3000, 4000];

  console.log("📦 Deploying GreenBondEscrow...");
  const GreenBondEscrow = await hre.ethers.getContractFactory("GreenBondEscrow");
  const escrow = await GreenBondEscrow.deploy(
    issuer,
    oracleUpdater.address, // temporary oracle, replaced below
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

  // --- Deploy ImpactOracle ---
  console.log("🛰️ Deploying ImpactOracle...");
  const Oracle = await hre.ethers.getContractFactory("ImpactOracle");
  const impactOracle = await Oracle.deploy(deployer.address);
  await impactOracle.waitForDeployment();
  console.log("✅ ImpactOracle deployed at:", impactOracle.target);

  // --- Wire Oracle <-> Escrow ---
  console.log("🔗 Linking oracle to escrow...");
  await (await impactOracle.setEscrow(escrow.target)).wait();
  await (await escrow.setOracle(impactOracle.target)).wait();
  await (await impactOracle.setUpdater(oracleUpdater.address)).wait();

  // --- Set BondToken Minter ---
  const bondTokenAddr = await escrow.token();
  const BondToken = await hre.ethers.getContractFactory("BondToken");
  const bondToken = BondToken.attach(bondTokenAddr);
  await (await bondToken.setMinter(escrow.target)).wait();
  console.log("✅ BondToken minter set to escrow");

  // --- Write to .env file ---
  const envFilePath = ".env";
  const currentEnv = fs.existsSync(envFilePath)
    ? fs.readFileSync(envFilePath, "utf-8").split("\n")
    : [];

  // Filter out old values for these keys
  const filteredEnv = currentEnv.filter(
    (line) =>
      !line.startsWith("ESCROW_ADDRESS=") &&
      !line.startsWith("ORACLE_ADDRESS=") &&
      !line.startsWith("UPDATER_ADDRESS=")
  );

  // Add new values
  filteredEnv.push(`ESCROW_ADDRESS=${escrow.target}`);
  filteredEnv.push(`ORACLE_ADDRESS=${impactOracle.target}`);
  filteredEnv.push(`UPDATER_ADDRESS=${oracleUpdater.address}`);

  // Optionally add updater private key if available
  if (process.env.ORACLE_UPDATER_KEY) {
    filteredEnv.push(`ORACLE_UPDATER_KEY=${process.env.ORACLE_UPDATER_KEY}`);
  }

  fs.writeFileSync(envFilePath, filteredEnv.join("\n"));
  console.log("\n📝 .env file updated successfully!");
  console.log("You can now run: npm run oracle:fund && npm run oracle:loop");

  console.log("\n🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(50));
  console.log("ESCROW_ADDRESS=" + escrow.target);
  console.log("ORACLE_ADDRESS=" + impactOracle.target);
  console.log("UPDATER_ADDRESS=" + oracleUpdater.address);
  console.log("ISSUER_ADDRESS=" + issuer);
  console.log("=".repeat(50));
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
