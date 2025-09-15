// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title BondToken - Mintable ERC20 whose minter is the escrow contract
contract BondToken is ERC20 {
    address public owner; // simple owner for minter setup
    address public minter; // set once to the escrow contract

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        address owner_
    ) ERC20(name_, symbol_) {
        owner = owner_;
    }

    function setMinter(address m) external onlyOwner {
        require(minter == address(0), "minter already set");
        require(m != address(0), "bad minter");
        minter = m;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == minter, "not minter");
        _mint(to, amount);
    }
}
