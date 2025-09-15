import { expect } from "chai";
import pkg from "hardhat";   
const { ethers } = pkg;  

describe("GreenBondEscrow", function () {
  let deployer, issuer, oracle, investor, escrow, token;

  beforeEach(async () => {
    [deployer, issuer, oracle, investor] = await ethers.getSigners();

    const Escrow = await ethers.getContractFactory("GreenBondEscrow");
    escrow = await Escrow.deploy(
      issuer.address,
      oracle.address,
      "Green Bond",
      "GBOND",
      ethers.parseUnits("1000", 18), // cap 1000 tokens
      ethers.parseEther("0.01"),     // 0.01 ETH per token
      (await ethers.provider.getBlock("latest")).timestamp + 1,
      (await ethers.provider.getBlock("latest")).timestamp + 3600,
      [100, 200],
      [5000, 5000]
    );
    await escrow.waitForDeployment();

    const tokenAddr = await escrow.token();
    const Token = await ethers.getContractFactory("BondToken");
    token = Token.attach(tokenAddr);

    // set minter after deploy
    await token.connect(issuer).setMinter(await escrow.getAddress());
  });

  it("should allow investor to buy tokens", async () => {
  await ethers.provider.send("evm_increaseTime", [2]); // move into sale period

  const tokenAmount = ethers.parseUnits("100", 18); // buying 100 tokens
  const cost = ethers.parseEther("1");              // 100 * 0.01 ETH

  await escrow.connect(investor).invest(tokenAmount, { value: cost });

  const bal = await token.balanceOf(investor.address);
  expect(bal).to.equal(tokenAmount);
});
});
