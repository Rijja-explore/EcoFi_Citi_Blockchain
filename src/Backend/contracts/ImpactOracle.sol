// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IEscrowHook {
    function onOracleUpdate(uint256 cumulativeKwh) external;
}

contract ImpactOracle is Ownable {
    address public updater;       // EOA allowed to push updates
    address public escrow;        // MilestoneEscrow address

    uint256 public cumulativeKwh;
    uint256 public cumulativeCo2Kg;

    event UpdaterSet(address updater);
    event EscrowSet(address escrow);
    event ImpactUpdated(uint256 deltaKwh, uint256 deltaCo2Kg, uint256 newCumulativeKwh, uint256 newCumulativeCo2Kg);

    constructor(address _owner) Ownable(_owner) {}

    modifier onlyUpdater() {
        require(msg.sender == updater, "not updater");
        _;
    }

    function setUpdater(address _updater) external onlyOwner {
        require(_updater != address(0), "updater zero");
        updater = _updater;
        emit UpdaterSet(_updater);
    }

    function setEscrow(address _escrow) external onlyOwner {
        require(_escrow != address(0), "escrow zero");
        escrow = _escrow;
        emit EscrowSet(_escrow);
    }

    /// @notice Called by the oracle bot to push new production deltas.
    function pushImpact(uint256 deltaKwh, uint256 deltaCo2Kg) external onlyUpdater {
        cumulativeKwh += deltaKwh;
        cumulativeCo2Kg += deltaCo2Kg;

        emit ImpactUpdated(deltaKwh, deltaCo2Kg, cumulativeKwh, cumulativeCo2Kg);

        // Notify escrow about the new cumulative value
        if (escrow != address(0)) {
            IEscrowHook(escrow).onOracleUpdate(cumulativeKwh);
        }
    }
}
