// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {BondToken} from "./BondToken.sol";

/// @title GreenBondEscrow - sale, escrow, and milestone-based fund release
contract GreenBondEscrow is ReentrancyGuard {
    struct Milestone {
        uint256 threshold; // e.g., cumulative kWh or tons CO2 captured
        uint16 releaseBps; // portion of totalRaised to release (sum of all = 10000)
        bool achieved;
        uint256 achievedAt;
    }

    event Invested(address indexed buyer, uint256 tokenAmount, uint256 costWei);
    event SaleClosed(uint256 totalRaised, uint256 tokensSold);
    event MetricSubmitted(uint256 newValue, uint256 cumulativeValue);
    event MilestoneAchieved(uint256 indexed idx, uint256 threshold, uint16 bps);
    event FundsReleased(uint256 amountWei, address to);

    address public issuer; // project owner / recipient
    address public oracle; // address allowed to push metrics
    BondToken public token; // ERC-20 representing bond fractions

    uint256 public priceWeiPerToken; // price per 1 token (18 decimals)
    uint256 public saleStart;
    uint256 public saleEnd;
    bool public saleClosed;

    uint256 public capTokens; // max tokens sellable (18 decimals)
    uint256 public tokensSold; // cumulative tokens sold (18 decimals)
    uint256 public totalRaised; // wei collected during sale

    uint256 public cumulativeMetric; // sum of submitted metrics after sale
    uint256 public totalReleased; // wei sent to issuer

    Milestone[] public milestones;

    modifier onlyIssuer() {
        require(msg.sender == issuer, "not issuer");
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == oracle, "not oracle");
        _;
    }

    modifier duringSale() {
        require(
            !saleClosed &&
                block.timestamp >= saleStart &&
                block.timestamp < saleEnd,
            "sale inactive"
        );
        _;
    }

    constructor(
        address issuer_,
        address oracle_,
        string memory name_,
        string memory symbol_,
        uint256 capTokens_, // in 18 decimals
        uint256 priceWeiPerToken_, // wei per 1e18 tokens
        uint256 saleStart_,
        uint256 saleEnd_,
        uint256[] memory thresholds_, // metric thresholds per milestone
        uint16[] memory bps_ // basis points per milestone (sum == 10000)
    ) {
        require(issuer_ != address(0) && oracle_ != address(0), "bad addr");
        require(saleStart_ < saleEnd_, "bad window");
        require(capTokens_ > 0 && priceWeiPerToken_ > 0, "bad params");
        require(
            thresholds_.length == bps_.length && thresholds_.length > 0,
            "bad milestones"
        );

        uint256 sum;
        for (uint256 i = 0; i < bps_.length; i++) {
            sum += bps_[i];
            milestones.push(
                Milestone({
                    threshold: thresholds_[i],
                    releaseBps: bps_[i],
                    achieved: false,
                    achievedAt: 0
                })
            );
        }
        require(sum == 10000, "bps must sum to 10000");

        issuer = issuer_;
        oracle = oracle_;
        capTokens = capTokens_;
        priceWeiPerToken = priceWeiPerToken_;
        saleStart = saleStart_;
        saleEnd = saleEnd_;

        // deploy the ERC20 and set minter to this contract
        BondToken t = new BondToken(name_, symbol_, issuer);
        token = t;
        // t.setMinter(address(this));
    }

    // --- Investor flow ---
    function invest(
        uint256 tokenAmount
    ) external payable nonReentrant duringSale {
        require(tokenAmount > 0, "zero amount");
        require(tokensSold + tokenAmount <= capTokens, "cap exceeded");

        // price is per 1e18 token units
        uint256 cost = (tokenAmount * priceWeiPerToken) / 1e18;
        require(msg.value == cost, "bad msg.value");

        tokensSold += tokenAmount;
        totalRaised += msg.value;
        token.mint(msg.sender, tokenAmount);

        emit Invested(msg.sender, tokenAmount, msg.value);
    }

    function closeSale() external onlyIssuer {
        require(!saleClosed, "already closed");
        require(block.timestamp >= saleEnd, "too early");
        saleClosed = true;
        emit SaleClosed(totalRaised, tokensSold);
    }

    // --- Oracle flow ---
    /// @notice Submit additive metric value after sale is closed. E.g., +500 kWh since last report.
    function submitMetric(uint256 newValue) external onlyOracle {
        require(saleClosed, "sale not closed");
        require(newValue > 0, "zero metric");

        cumulativeMetric += newValue;
        emit MetricSubmitted(newValue, cumulativeMetric);

        // check milestones in order; release on newly-achieved ones
        for (uint256 i = 0; i < milestones.length; i++) {
            Milestone storage m = milestones[i];
            if (!m.achieved && cumulativeMetric >= m.threshold) {
                m.achieved = true;
                m.achievedAt = block.timestamp;
                emit MilestoneAchieved(i, m.threshold, m.releaseBps);

                uint256 releaseAmount = (totalRaised * m.releaseBps) / 10000;
                totalReleased += releaseAmount;
                (bool ok, ) = payable(issuer).call{value: releaseAmount}("");
                require(ok, "transfer failed");
                emit FundsReleased(releaseAmount, issuer);
            }
        }
    }

    // --- Admin ---
    function setOracle(address newOracle) external onlyIssuer {
        require(newOracle != address(0), "bad oracle");
        oracle = newOracle;
    }

    // allow issuer to withdraw any dust after all milestones are achieved
    function withdrawRemainder() external onlyIssuer {
        // ensure all milestones achieved
        for (uint256 i = 0; i < milestones.length; i++) {
            require(milestones[i].achieved, "milestone pending");
        }
        uint256 bal = address(this).balance;
        if (bal > 0) {
            (bool ok, ) = payable(issuer).call{value: bal}("");
            require(ok, "withdraw failed");
            emit FundsReleased(bal, issuer);
        }
    }

    // views
    function milestonesCount() external view returns (uint256) {
        return milestones.length;
    }

    function onOracleUpdate(uint256 cumulativeKwh) external {
        require(msg.sender == oracle, "not oracle");
        uint256 delta = cumulativeKwh - cumulativeMetric;
        if (delta > 0) {
            cumulativeMetric = cumulativeKwh; // update state
            emit MetricSubmitted(delta, cumulativeMetric);

            // check milestones
            for (uint256 i = 0; i < milestones.length; i++) {
                Milestone storage m = milestones[i];
                if (!m.achieved && cumulativeMetric >= m.threshold) {
                    m.achieved = true;
                    m.achievedAt = block.timestamp;
                    emit MilestoneAchieved(i, m.threshold, m.releaseBps);

                    uint256 releaseAmount = (totalRaised * m.releaseBps) /
                        10000;
                    totalReleased += releaseAmount;
                    (bool ok, ) = payable(issuer).call{value: releaseAmount}(
                        ""
                    );
                    require(ok, "transfer failed");
                    emit FundsReleased(releaseAmount, issuer);
                }
            }
        }
    }
}
