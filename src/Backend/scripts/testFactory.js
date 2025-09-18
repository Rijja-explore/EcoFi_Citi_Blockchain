import pkg from "hardhat";
const { ethers } = pkg;

async function testBondFactory() {
    const [owner] = await ethers.getSigners();
    console.log("Testing with account:", owner.address);

    // Get the factory contract
    const factoryAddress = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82";
    const factory = await ethers.getContractAt("BondFactory", factoryAddress);

    console.log("Factory contract loaded at:", await factory.getAddress());
    
    try {
        // Test project creation with simple parameters
        const tx = await factory.createProject(
            "Test Project",
            "A test project description",
            "TGREEN",
            "TGR", 
            ethers.parseEther("1000"), // capTokens: 1000 tokens
            ethers.parseEther("0.001"), // priceWeiPerToken: 0.001 ETH per token
            86400, // saleDuration: 1 day
            [ethers.parseEther("100"), ethers.parseEther("200"), ethers.parseEther("300"), ethers.parseEther("400"), ethers.parseEther("500"), ethers.parseEther("600")], // thresholds
            [100, 200, 300, 400, 500, 600], // bps
            12, // maturityMonths
            1000 // annualYieldBps: 10%
        );

        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt.hash);
        
        // Check if project was created
        const projectCount = await factory.projectCount();
        console.log("Project count:", projectCount.toString());
        
        if (projectCount > 0) {
            const project = await factory.getProject(0);
            console.log("Project created:", project);
        }
        
    } catch (error) {
        console.error("Error creating project:", error);
        console.error("Error data:", error.data);
    }
}

testBondFactory()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });