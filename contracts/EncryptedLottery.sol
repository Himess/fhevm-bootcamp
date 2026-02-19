// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title EncryptedLottery - Module 09: On-chain lottery with encrypted randomness
/// @notice Players buy tickets, a random winner is selected using FHE randomness.
contract EncryptedLottery is ZamaEthereumConfig {
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
    event PrizeClaimed(address indexed winner, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor(uint256 _ticketPrice, uint256 duration) {
        owner = msg.sender;
        ticketPrice = _ticketPrice;
        deadline = block.timestamp + duration;
    }

    /// @notice Buy a lottery ticket
    function buyTicket() external payable {
        require(block.timestamp <= deadline, "Lottery closed");
        require(!hasTicket[msg.sender], "Already has ticket");
        require(msg.value >= ticketPrice, "Insufficient payment");

        players.push(msg.sender);
        hasTicket[msg.sender] = true;
        emit TicketPurchased(msg.sender);
    }

    /// @notice Draw a winner using encrypted randomness
    function drawWinner() external onlyOwner {
        require(block.timestamp > deadline, "Lottery still open");
        require(!drawn, "Already drawn");
        require(players.length > 0, "No players");

        // Generate encrypted random index
        _winnerIndex = FHE.rem(FHE.randEuint32(), uint32(players.length));
        FHE.allowThis(_winnerIndex);
        FHE.allow(_winnerIndex, owner);

        drawn = true;
    }

    /// @notice Reveal and store the winner (simplified: uses mock decrypt in tests)
    /// @dev In fhEVM v0.9+, use FHE.makePubliclyDecryptable() on the encrypted index,
    ///      then call publicDecrypt() off-chain via the relayer SDK to get the plaintext
    function revealWinner(uint32 index) external onlyOwner {
        require(drawn, "Not drawn yet");
        require(winner == address(0), "Already revealed");
        require(index < players.length, "Invalid index");

        winner = players[index];
        emit WinnerDrawn(winner);
    }

    /// @notice Winner claims the prize pool
    function claimPrize() external {
        require(winner == msg.sender, "Not the winner");
        uint256 prize = address(this).balance;
        require(prize > 0, "No prize");

        // CEI pattern: clear winner before external call to prevent reentrancy
        winner = address(0);

        (bool sent, ) = msg.sender.call{ value: prize }("");
        require(sent, "Transfer failed");
        emit PrizeClaimed(msg.sender, prize);
    }

    /// @notice Get the encrypted winner index handle
    function getWinnerIndex() external view returns (euint32) {
        return _winnerIndex;
    }

    /// @notice Get the number of players
    function getPlayerCount() external view returns (uint256) {
        return players.length;
    }

    /// @notice Get the prize pool balance
    function getPrizePool() external view returns (uint256) {
        return address(this).balance;
    }
}
