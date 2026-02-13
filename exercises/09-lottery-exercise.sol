// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Exercise 9: Encrypted Lottery with On-Chain Randomness
/// @notice Complete the TODOs to implement a lottery using FHE.randEuint32()
contract EncryptedLotteryExercise is ZamaEthereumConfig {
    address public owner;
    address[] public players;
    mapping(address => bool) public hasTicket;

    euint32 private _winnerIndex;
    bool public drawn;
    address public winner;

    uint256 public ticketPrice;
    uint256 public deadline;

    event TicketPurchased(address indexed player);
    event WinnerDrawn(address indexed winner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(uint256 _ticketPrice, uint256 duration) {
        owner = msg.sender;
        ticketPrice = _ticketPrice;
        deadline = block.timestamp + duration;
    }

    /// TODO 1: Implement buyTicket()
    /// Requirements:
    /// - Lottery must not be closed (block.timestamp <= deadline)
    /// - Player must not already have a ticket
    /// - msg.value must be >= ticketPrice
    /// - Add player to the players array
    /// - Set hasTicket mapping
    /// - Emit TicketPurchased event
    function buyTicket() external payable {
        // YOUR CODE HERE
    }

    /// TODO 2: Implement drawWinner() using encrypted randomness
    /// Requirements:
    /// - Only owner can call
    /// - Lottery must be closed (block.timestamp > deadline)
    /// - Must not be already drawn
    /// - Must have at least 1 player
    /// - Generate random index: FHE.rem(FHE.randEuint32(), playerCount)
    /// - Set ACL: FHE.allowThis() and FHE.allow() for owner
    /// - Set drawn = true
    function drawWinner() external onlyOwner {
        // YOUR CODE HERE
    }

    /// TODO 3: Implement revealWinner()
    /// Requirements:
    /// - Must be drawn
    /// - Winner must not already be revealed
    /// - Index must be valid (< players.length)
    /// - Store winner address from players array
    /// - Emit WinnerDrawn event
    function revealWinner(uint32 index) external onlyOwner {
        // YOUR CODE HERE
    }

    function getWinnerIndex() external view returns (euint32) {
        return _winnerIndex;
    }

    function getPlayerCount() external view returns (uint256) {
        return players.length;
    }
}
