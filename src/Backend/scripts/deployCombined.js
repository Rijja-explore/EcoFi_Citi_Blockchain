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
import path from "path";
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
  const saleStart = now;           // starts immediately
  const saleEnd = now + 3600;      // ends in 1 hour

  // Milestone thresholds & release bps (must sum to 10000)
  // Enterprise-scale renewable energy project milestones for massive solar/wind farms
  const thresholds = [5000000, 10000000, 20000000, 35000000, 50000000, 75000000]; // 5M, 10M, 20M, 35M, 50M, 75M kWh milestones
  const bps = [1666, 1667, 1667, 1667, 1666, 1667]; // ~16.67% each, sum = 10000

  console.log("� Deployment parameters:");
  console.log("   Thresholds:", thresholds);
  console.log("   BPS:", bps);
  console.log("   BPS Sum:", bps.reduce((a, b) => a + b, 0));

  console.log("�📦 Deploying GreenBondEscrow...");
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
    bps,
    12, // maturityMonths - 1 year
    500 // annualYieldBps - 5% annual yield
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

  // --- Deploy BondFactory ---
  console.log("🏭 Deploying BondFactory...");
  const BondFactory = await hre.ethers.getContractFactory("BondFactory");
  const bondFactory = await BondFactory.deploy();
  await bondFactory.waitForDeployment();
  console.log("✅ BondFactory deployed at:", bondFactory.target);

  // Connect the factory to the deployer signer for transactions
  const bondFactoryWithSigner = bondFactory.connect(deployer);

  // --- Create Default Project ---
  console.log("🌱 Creating default green bond project...");
  const defaultProject = {
    name: "EcoFi Solar Farm Initiative",
    description: "A pioneering solar energy project that will generate clean renewable energy while creating jobs and reducing carbon emissions. This project aims to install 10MW of solar panels across urban rooftops, providing sustainable energy to local communities.",
    tokenName: "SolarGreen Bond",
    tokenSymbol: "SLRGB",
    targetAmount: "500", // 500 ETH target
    saleDuration: "30"   // 30 days
  };

  // Calculate project parameters (using different variable names to avoid conflicts)
  const projectTargetAmountWei = hre.ethers.parseEther(defaultProject.targetAmount);
  const projectCapTokens = hre.ethers.parseUnits("1000000", 18); // 1M tokens
  const projectPriceWeiPerToken = projectTargetAmountWei / 1000000n;
  const projectSaleDurationSeconds = parseInt(defaultProject.saleDuration) * 24 * 60 * 60; // 30 days in seconds

  // Enterprise-scale milestones for environmental impact
  const projectThresholds = [5000000, 10000000, 20000000, 35000000, 50000000, 75000000]; // kWh milestones
  const projectBps = [1666, 1667, 1667, 1667, 1666, 1667]; // basis points that sum to 10000

  console.log("Creating project with parameters:");
  console.log(`  Name: ${defaultProject.name}`);
  console.log(`  Target: ${defaultProject.targetAmount} ETH`);
  console.log(`  Duration: ${defaultProject.saleDuration} days`);
  console.log(`  Token: ${defaultProject.tokenName} (${defaultProject.tokenSymbol})`);

  // Create the project using the factory
  const createProjectTx = await bondFactoryWithSigner.createProject(
    defaultProject.name,
    defaultProject.description,
    defaultProject.tokenName,
    defaultProject.tokenSymbol,
    projectCapTokens,
    projectPriceWeiPerToken,
    projectSaleDurationSeconds,
    projectThresholds,
    projectBps,
    5,    // 5 years maturity
    800   // 8% annual yield in basis points
  );

  await createProjectTx.wait();
  console.log("✅ Default project created successfully!");

  // Get the project ID (should be 0 for the first project)
  const projectCount = await bondFactory.projectCount();
  console.log(`📊 Total projects created: ${projectCount.toString()}`);

  // --- Write to single .env file in project root ---
  const projectRoot = path.resolve(process.cwd(), '../../');
  const envFilePath = path.join(projectRoot, '.env');
  const envVars = [
    `ESCROW_ADDRESS=${escrow.target}`,
    `ORACLE_ADDRESS=${impactOracle.target}`,
    `BOND_FACTORY_ADDRESS=${bondFactory.target}`,
    `UPDATER_ADDRESS=${oracleUpdater.address}`,
    `ISSUER_ADDRESS=${issuer}`,
    `ORACLE_UPDATER_KEY=${process.env.ORACLE_UPDATER_KEY || ''}`,
    `CHAIN_ID=31337`,
    `RPC_URL=http://127.0.0.1:8545`,
    // React frontend compatibility
    `REACT_APP_ESCROW_ADDRESS=${escrow.target}`,
    `REACT_APP_ORACLE_ADDRESS=${impactOracle.target}`,
    `REACT_APP_BOND_FACTORY_ADDRESS=${bondFactory.target}`,
    `REACT_APP_UPDATER_ADDRESS=${oracleUpdater.address}`,
    `REACT_APP_ISSUER_ADDRESS=${issuer}`,
    `REACT_APP_ORACLE_UPDATER_KEY=${process.env.ORACLE_UPDATER_KEY || ''}`,
    `REACT_APP_CHAIN_ID=31337`,
    `REACT_APP_RPC_URL=http://127.0.0.1:8545`,
    // Environmental impact calculation multipliers
    `REACT_APP_CO2_PER_KWH=0.4`,
    `REACT_APP_TREES_PER_KWH=0.02`,
    `REACT_APP_WATER_PER_KWH=0.5`
  ];
  fs.writeFileSync(envFilePath, envVars.join('\n'));
  console.log(`\n📝 .env file updated at project root: ${envFilePath}`);
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
