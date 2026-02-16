export const CHAIN_ID = 11155111; // Ethereum Sepolia
export const CHAIN_ID_HEX = "0xaa36a7";
export const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
export const RELAYER_URL = "https://relayer.testnet.zama.org";

export const CONTRACTS = {
  SimpleCounter: {
    address: "0x17B6209385c2e36E6095b89572273175902547f9",
    abi: [
      "function increment(bytes32 encValue, bytes calldata inputProof) external",
      "function getMyCount() external view returns (uint256)",
      "event CountIncremented(address indexed user)",
    ],
  },
  ConfidentialERC20: {
    address: "0x623b1653AB004661BC7832AC2930Eb42607C4013",
    abi: [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
      "function totalSupply() view returns (uint64)",
      "function owner() view returns (address)",
      "function mint(address to, uint64 amount) external",
      "function transfer(bytes32 encAmount, bytes calldata inputProof, address to) external",
      "function balanceOf(address account) view returns (uint256)",
      "event Transfer(address indexed from, address indexed to)",
      "event Mint(address indexed to, uint64 amount)",
    ],
  },
} as const;

export const SEPOLIA_NETWORK = {
  chainId: CHAIN_ID_HEX,
  chainName: "Ethereum Sepolia",
  nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
  rpcUrls: [RPC_URL],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};
