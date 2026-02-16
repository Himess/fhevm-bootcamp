import { createInstance, type FhevmInstance } from "@zama-fhe/relayer-sdk/web";
import { RELAYER_URL, RPC_URL, CHAIN_ID } from "./config";

// Zama fhEVM coprocessor addresses on Ethereum Sepolia
const ACL_ADDRESS = "0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D";
const KMS_ADDRESS = "0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A";
const INPUT_VERIFIER_ADDRESS = "0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0";
const VERIFYING_CONTRACT_DECRYPTION = "0x5D8BD78e2ea6bbE41f26dFe9fdaEAa349e077478";
const VERIFYING_CONTRACT_INPUT = "0x483b9dE06E4E4C7D35CCf5837A1668487406D955";
const GATEWAY_CHAIN_ID = 10901;

let instance: FhevmInstance | null = null;

/**
 * Initialize a singleton Relayer SDK instance.
 * Uses Zama's Sepolia coprocessor infrastructure.
 */
export async function initFhevm(): Promise<FhevmInstance> {
  if (instance) return instance;

  instance = await createInstance({
    kmsContractAddress: KMS_ADDRESS,
    aclContractAddress: ACL_ADDRESS,
    inputVerifierContractAddress: INPUT_VERIFIER_ADDRESS,
    verifyingContractAddressDecryption: VERIFYING_CONTRACT_DECRYPTION,
    verifyingContractAddressInputVerification: VERIFYING_CONTRACT_INPUT,
    chainId: CHAIN_ID,
    gatewayChainId: GATEWAY_CHAIN_ID,
    network: RPC_URL,
    relayerUrl: RELAYER_URL,
  });

  return instance;
}

/**
 * Get the existing Relayer SDK instance (must call initFhevm first).
 */
export function getFhevm(): FhevmInstance {
  if (!instance) throw new Error("FHEVM not initialized. Call initFhevm() first.");
  return instance;
}

/**
 * Create an encrypted input for a contract call.
 */
export async function createEncryptedInput(contractAddress: string, userAddress: string) {
  const fhe = await initFhevm();
  return fhe.createEncryptedInput(contractAddress, userAddress);
}
