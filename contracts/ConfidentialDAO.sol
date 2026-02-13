// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, euint32, euint8, externalEuint64, externalEuint8, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ConfidentialDAO - Module 14 Capstone: DAO with encrypted voting + treasury
/// @notice Combines encrypted governance tokens, private voting, and treasury management
contract ConfidentialDAO is ZamaEthereumConfig {
    string public name;
    address public admin;

    // Governance token balances (encrypted)
    mapping(address => euint64) internal _tokenBalances;
    uint64 public totalTokenSupply;

    // Proposals
    struct Proposal {
        string description;
        address payable recipient;
        uint256 amount;
        euint32 yesVotes;
        euint32 noVotes;
        uint256 deadline;
        bool executed;
        bool revealed;
        uint32 yesResult;
        uint32 noResult;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    uint256 public proposalCount;

    // Minimum token balance to create proposal
    uint64 public constant PROPOSAL_THRESHOLD = 100;

    event TokensMinted(address indexed to, uint64 amount);
    event ProposalCreated(uint256 indexed id, string description, address recipient, uint256 amount);
    event VoteCast(uint256 indexed proposalId, address indexed voter);
    event ProposalExecuted(uint256 indexed proposalId);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    constructor(string memory _name) {
        name = _name;
        admin = msg.sender;
    }

    /// @notice Mint governance tokens
    function mintTokens(address to, uint64 amount) external onlyAdmin {
        totalTokenSupply += amount;
        _initBalance(to);
        _tokenBalances[to] = FHE.add(_tokenBalances[to], FHE.asEuint64(amount));
        FHE.allowThis(_tokenBalances[to]);
        FHE.allow(_tokenBalances[to], to);
        emit TokensMinted(to, amount);
    }

    mapping(address => bool) private _initialized;

    function _initBalance(address account) internal {
        if (!_initialized[account]) {
            _tokenBalances[account] = FHE.asEuint64(0);
            FHE.allowThis(_tokenBalances[account]);
            _initialized[account] = true;
        }
    }

    /// @notice Get encrypted token balance
    function tokenBalanceOf(address account) external view returns (euint64) {
        return _tokenBalances[account];
    }

    /// @notice Create a treasury spending proposal
    /// @dev PROPOSAL_THRESHOLD cannot be enforced on-chain with encrypted balances
    /// because ebool cannot be used in require(). In production, consider requiring
    /// a governance NFT or a plaintext ETH deposit to gate proposal creation.
    function createProposal(
        string calldata description,
        address payable recipient,
        uint256 amount,
        uint256 duration
    ) external {
        uint256 id = proposalCount++;
        proposals[id].description = description;
        proposals[id].recipient = recipient;
        proposals[id].amount = amount;
        proposals[id].yesVotes = FHE.asEuint32(0);
        proposals[id].noVotes = FHE.asEuint32(0);
        proposals[id].deadline = block.timestamp + duration;

        FHE.allowThis(proposals[id].yesVotes);
        FHE.allowThis(proposals[id].noVotes);

        emit ProposalCreated(id, description, recipient, amount);
    }

    /// @notice Cast an encrypted vote (0 = no, 1 = yes)
    function vote(uint256 proposalId, externalEuint8 encVote, bytes calldata inputProof) external {
        require(proposalId < proposalCount, "Invalid proposal");
        require(block.timestamp <= proposals[proposalId].deadline, "Voting ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        euint8 voteValue = FHE.fromExternal(encVote, inputProof);
        ebool isYes = FHE.eq(voteValue, FHE.asEuint8(1));

        euint32 one = FHE.asEuint32(1);
        euint32 zero = FHE.asEuint32(0);

        proposals[proposalId].yesVotes = FHE.add(
            proposals[proposalId].yesVotes,
            FHE.select(isYes, one, zero)
        );
        proposals[proposalId].noVotes = FHE.add(
            proposals[proposalId].noVotes,
            FHE.select(isYes, zero, one)
        );

        FHE.allowThis(proposals[proposalId].yesVotes);
        FHE.allowThis(proposals[proposalId].noVotes);

        hasVoted[proposalId][msg.sender] = true;
        emit VoteCast(proposalId, msg.sender);
    }

    /// @notice Fund the DAO treasury
    receive() external payable {}

    /// @notice Finalize voting and make results publicly decryptable
    function finalizeProposal(uint256 proposalId) external onlyAdmin {
        require(proposalId < proposalCount, "Invalid proposal");
        require(block.timestamp > proposals[proposalId].deadline, "Voting ongoing");
        require(!proposals[proposalId].revealed, "Already revealed");

        proposals[proposalId].revealed = true;
        FHE.makePubliclyDecryptable(proposals[proposalId].yesVotes);
        FHE.makePubliclyDecryptable(proposals[proposalId].noVotes);
    }

    /// @notice Execute a finalized proposal (transfer treasury funds to recipient)
    function executeProposal(uint256 proposalId) external onlyAdmin {
        require(proposalId < proposalCount, "Invalid proposal");
        require(proposals[proposalId].revealed, "Not finalized");
        require(!proposals[proposalId].executed, "Already executed");
        require(address(this).balance >= proposals[proposalId].amount, "Insufficient treasury");

        proposals[proposalId].executed = true;

        (bool sent,) = proposals[proposalId].recipient.call{value: proposals[proposalId].amount}("");
        require(sent, "Transfer failed");

        emit ProposalExecuted(proposalId);
    }

    /// @notice Get treasury balance
    function treasuryBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Get encrypted yes votes
    function getYesVotes(uint256 proposalId) external view returns (euint32) {
        return proposals[proposalId].yesVotes;
    }

    /// @notice Get encrypted no votes
    function getNoVotes(uint256 proposalId) external view returns (euint32) {
        return proposals[proposalId].noVotes;
    }
}
