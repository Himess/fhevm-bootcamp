import { RELAYER_URL, RPC_URL, CHAIN_ID } from "./config";

// Zama fhEVM coprocessor addresses on Ethereum Sepolia
const ACL_ADDRESS = "0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D";
const KMS_ADDRESS = "0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A";
const INPUT_VERIFIER_ADDRESS = "0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0";
const VERIFYING_CONTRACT_DECRYPTION = "0x5D8BD78e2ea6bbE41f26dFe9fdaEAa349e077478";
const VERIFYING_CONTRACT_INPUT = "0x483b9dE06E4E4C7D35CCf5837A1668487406D955";
const GATEWAY_CHAIN_ID = 10901;

let instance: any = null;
let sdkLoaded = false;

/**
 * Dynamically load the relayer SDK bundle via script tag.
 */
function loadSDKScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).relayerSDK) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "/relayer-sdk-js.js";
    script.async = true;
    script.onload = () => {
      console.log("[FHEVM] SDK script loaded successfully");
      resolve();
    };
    script.onerror = (err) => {
      console.error("[FHEVM] Failed to load SDK script:", err);
      reject(new Error("Failed to load relayer SDK script"));
    };
    document.head.appendChild(script);
  });
}

/**
 * Initialize a singleton Relayer SDK instance.
 * Loads the SDK bundle dynamically, then initializes WASM and creates the instance.
 */
export async function initFhevm(): Promise<any> {
  if (instance) return instance;

  console.log("[FHEVM] Starting initialization...");

  // Step 1: Load SDK script dynamically
  if (!sdkLoaded) {
    console.log("[FHEVM] Loading SDK script...");
    await loadSDKScript();
    sdkLoaded = true;
  }

  const sdk = (window as any).relayerSDK;
  if (!sdk) {
    throw new Error("relayerSDK not found on window after script load");
  }

  console.log("[FHEVM] SDK available. Keys:", Object.keys(sdk).join(", "));

  // Step 2: Initialize WASM modules
  if (sdk.initSDK) {
    console.log("[FHEVM] Calling initSDK()...");
    await sdk.initSDK();
    console.log("[FHEVM] initSDK() completed");
  }

  // Step 3: Create the instance
  console.log("[FHEVM] Calling createInstance()...");
  instance = await sdk.createInstance({
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

  console.log("[FHEVM] Instance created successfully");
  return instance;
}

/**
 * Get the existing Relayer SDK instance (must call initFhevm first).
 */
export function getFhevm(): any {
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
