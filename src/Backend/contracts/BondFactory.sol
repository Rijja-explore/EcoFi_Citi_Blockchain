// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./GreenBondEscrow.sol";
import "./ImpactOracle.sol";

/// @title BondFactory - Factory for creating multiple green bond projects
contract BondFactory {
    struct ProjectInfo {
        address escrowContract;
        address oracleContract;
        address issuer;
        string projectName;
        string description;
        uint256 targetAmount;
        uint256 createdAt;
        bool active;
    }

    event ProjectCreated(
        uint256 indexed projectId,
        address indexed issuer,
        address escrowContract,
        address oracleContract,
        string projectName
    );

    event ProjectStatusChanged(uint256 indexed projectId, bool active);

    mapping(uint256 => ProjectInfo) public projects;
    mapping(address => uint256[]) public issuerProjects;
    uint256 public projectCount;
    address public factoryOwner;

    modifier onlyOwner() {
        require(msg.sender == factoryOwner, "not factory owner");
        _;
    }

    modifier onlyIssuer(uint256 projectId) {
        require(projects[projectId].issuer == msg.sender, "not project issuer");
        _;
    }

    constructor() {
        factoryOwner = msg.sender;
    }

    /// @notice Create a new green bond project
    function createProject(
        string memory projectName,
        string memory description,
        string memory tokenName,
        string memory tokenSymbol,
        uint256 capTokens,
        uint256 priceWeiPerToken,
        uint256 saleDuration, // in seconds
        uint256[] memory thresholds,
        uint16[] memory bps,
        uint256 maturityMonths,
        uint256 annualYieldBps
    ) external returns (uint256 projectId) {
        require(bytes(projectName).length > 0, "empty project name");
        require(capTokens > 0 && priceWeiPerToken > 0, "invalid params");

        projectId = projectCount++;
        
        uint256 saleStart = block.timestamp + 300; // starts in 5 minutes
        uint256 saleEnd = saleStart + saleDuration;

        // Deploy oracle for this project
        ImpactOracle oracle = new ImpactOracle(msg.sender);
        
        // Deploy escrow for this project
        GreenBondEscrow escrow = new GreenBondEscrow(
            msg.sender, // issuer
            address(oracle), // oracle
            tokenName,
            tokenSymbol,
            capTokens,
            priceWeiPerToken,
            saleStart,
            saleEnd,
            thresholds,
            bps,
            maturityMonths,
            annualYieldBps
        );

        // Note: Oracle setup will be handled by the frontend when the project creator connects
        // This avoids complex ownership issues during deployment

        uint256 targetAmount = (capTokens * priceWeiPerToken) / 1e18;

        projects[projectId] = ProjectInfo({
            escrowContract: address(escrow),
            oracleContract: address(oracle),
            issuer: msg.sender,
            projectName: projectName,
            description: description,
            targetAmount: targetAmount,
            createdAt: block.timestamp,
            active: true
        });

        issuerProjects[msg.sender].push(projectId);

        emit ProjectCreated(
            projectId,
            msg.sender,
            address(escrow),
            address(oracle),
            projectName
        );
    }

    /// @notice Get project details
    function getProject(uint256 projectId) external view returns (ProjectInfo memory) {
        require(projectId < projectCount, "invalid project id");
        return projects[projectId];
    }

    /// @notice Get all active projects
    function getActiveProjects() external view returns (uint256[] memory activeIds) {
        uint256 activeCount = 0;
        
        // Count active projects
        for (uint256 i = 0; i < projectCount; i++) {
            if (projects[i].active) {
                activeCount++;
            }
        }

        // Populate active projects array
        activeIds = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < projectCount; i++) {
            if (projects[i].active) {
                activeIds[index] = i;
                index++;
            }
        }
    }

    /// @notice Get projects by issuer
    function getIssuerProjects(address issuer) external view returns (uint256[] memory) {
        return issuerProjects[issuer];
    }

    /// @notice Toggle project active status (only issuer)
    function toggleProjectStatus(uint256 projectId) external onlyIssuer(projectId) {
        projects[projectId].active = !projects[projectId].active;
        emit ProjectStatusChanged(projectId, projects[projectId].active);
    }

    /// @notice Get project statistics
    function getProjectStats(uint256 projectId) external view returns (
        uint256 totalRaised,
        uint256 tokensSold,
        uint256 cumulativeMetric,
        bool saleClosed
    ) {
        require(projectId < projectCount, "invalid project id");
        
        GreenBondEscrow escrow = GreenBondEscrow(projects[projectId].escrowContract);
        
        totalRaised = escrow.totalRaised();
        tokensSold = escrow.tokensSold();
        cumulativeMetric = escrow.cumulativeMetric();
        saleClosed = escrow.saleClosed();
    }
}