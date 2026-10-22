import { ethers } from "ethers";
import { FARMTRACE_ABI, FARMTRACE_CONTRACT_ADDRESS, FARMTRACE_DEFAULT_CHAIN_ID } from "../contracts/contractData";
import { Batch, BatchWithHistory, Correction, Farmer, Stage, SupplyChainEvent } from "../types";
import { DEMO_BATCHES, DEMO_FARMERS } from "./mockData";

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_HEX_CHAIN_ID = "0xaa36a7";
export const LOCAL_CHAIN_ID = 31337;
export const LOCAL_HEX_CHAIN_ID = "0x7a69";

// Default RPC fallback: If configured for localhost, use http://127.0.0.1:8545, else public Sepolia RPC
const DEFAULT_RPC =
  import.meta.env.VITE_SEPOLIA_RPC_URL ||
  (FARMTRACE_DEFAULT_CHAIN_ID === 31337
    ? "http://127.0.0.1:8545"
    : "https://ethereum-sepolia-rpc.publicnode.com");

// Get configured contract address from env or deployed config
export const getContractAddress = (): string => {
  return import.meta.env.VITE_CONTRACT_ADDRESS && import.meta.env.VITE_CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000"
    ? import.meta.env.VITE_CONTRACT_ADDRESS
    : FARMTRACE_CONTRACT_ADDRESS;
};

// Check if a valid deployed contract address is configured
export const isContractConfigured = (): boolean => {
  const addr = getContractAddress();
  return Boolean(addr && addr !== "0x0000000000000000000000000000000000000000" && ethers.isAddress(addr));
};

/**
 * Get read-only provider (public RPC, localhost, or browser provider if available)
 */
export const getReadOnlyProvider = (): ethers.Provider => {
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      return new ethers.BrowserProvider(window.ethereum);
    } catch {
      // Fallback to JsonRpcProvider
    }
  }
  return new ethers.JsonRpcProvider(DEFAULT_RPC);
};

/**
 * Prompt MetaMask to switch to Localhost (31337) network or add it
 */
export const switchOrAddLocalhost = async (): Promise<void> => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: LOCAL_HEX_CHAIN_ID }],
    });
  } catch (switchError: any) {
    if (switchError.code === 4902 || switchError.code === -32603) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: LOCAL_HEX_CHAIN_ID,
            chainName: "Hardhat Localhost 8545",
            nativeCurrency: {
              name: "ETH",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: ["http://127.0.0.1:8545"],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
};

/**
 * Ensure any connected wallet on localhost has gas and organization permissions
 */
export const ensureLocalAccountReady = async (
  userAddress: string
): Promise<{ funded: boolean; authorized: boolean }> => {
  let funded = false;
  let authorized = false;
  if (!userAddress || !ethers.isAddress(userAddress)) return { funded, authorized };
  try {
    const localProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const net = await localProvider.getNetwork();
    if (Number(net.chainId) !== 31337) return { funded, authorized };

    const adminSigner = await localProvider.getSigner(0);

    // 1. Check and auto-fund balance if less than 1 ETH
    const balance = await localProvider.getBalance(userAddress);
    if (balance < ethers.parseEther("1.0")) {
      const fundTx = await adminSigner.sendTransaction({
        to: userAddress,
        value: ethers.parseEther("10.0"),
      });
      await fundTx.wait();
      funded = true;
      console.log(`[FarmTrace] Auto-funded ${userAddress} with 10 ETH on Localhost 8545`);
    }

    // 2. Authorize wallet on smart contract if not already authorized
    const addr = getContractAddress();
    if (addr && addr !== "0x0000000000000000000000000000000000000000") {
      const contract = new ethers.Contract(addr, FARMTRACE_ABI, adminSigner);
      const isOrg = await contract.isOrganization(userAddress);
      const owner = await contract.owner();
      if (!isOrg && owner.toLowerCase() !== userAddress.toLowerCase()) {
        const authTx = await contract.setOrganization(userAddress, true);
        await authTx.wait();
        authorized = true;
        console.log(`[FarmTrace] Auto-authorized ${userAddress} as Organization on FarmTrace contract`);
      }
    }
  } catch (e) {
    console.warn("[FarmTrace] ensureLocalAccountReady info:", e);
  }
  return { funded, authorized };
};

/**
 * Get browser signer for write operations via MetaMask
 */
export const getBrowserSigner = async (): Promise<ethers.Signer> => {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not detected. Please install MetaMask to perform this operation.");
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  const currentChain = Number(network.chainId);

  if (currentChain !== SEPOLIA_CHAIN_ID && currentChain !== 31337) {
    if (FARMTRACE_DEFAULT_CHAIN_ID === 31337) {
      await switchOrAddLocalhost();
    } else {
      await switchOrAddSepolia();
    }
  }
  return await provider.getSigner();
};

/**
 * Prompt MetaMask to switch to Sepolia network or add it
 */
export const switchOrAddSepolia = async (): Promise<void> => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_HEX_CHAIN_ID }],
    });
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: SEPOLIA_HEX_CHAIN_ID,
            chainName: "Ethereum Sepolia Testnet",
            nativeCurrency: {
              name: "Sepolia ETH",
              symbol: "SEP",
              decimals: 18,
            },
            rpcUrls: [DEFAULT_RPC, "https://rpc.sepolia.org"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
};

/**
 * Read-only contract instance
 */
export const getReadOnlyContract = (provider?: ethers.Provider): ethers.Contract => {
  const p = provider || getReadOnlyProvider();
  const address = getContractAddress();
  return new ethers.Contract(address, FARMTRACE_ABI, p);
};

/**
 * Read-write contract instance
 */
export const getWriteContract = async (): Promise<ethers.Contract> => {
  const signer = await getBrowserSigner();
  const address = getContractAddress();
  return new ethers.Contract(address, FARMTRACE_ABI, signer);
};

// ==========================================
// LOCAL DEMO / OFFLINE STORAGE PERSISTENCE
// ==========================================
const LOCAL_FARMERS_KEY = "farmtrace_local_farmers";
const LOCAL_BATCHES_KEY = "farmtrace_local_batches";

export const getLocalFarmers = (): Farmer[] => {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(LOCAL_FARMERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("Could not read local farmers:", e);
    return [];
  }
};

export const saveLocalFarmer = (farmer: Farmer): void => {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const existing = getLocalFarmers().filter(
      (f) => f.farmerId.toUpperCase() !== farmer.farmerId.toUpperCase()
    );
    existing.unshift(farmer);
    localStorage.setItem(LOCAL_FARMERS_KEY, JSON.stringify(existing));
  } catch (e) {
    console.warn("Could not save local farmer:", e);
  }
};

export const getLocalBatches = (): BatchWithHistory[] => {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(LOCAL_BATCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("Could not read local batches:", e);
    return [];
  }
};

export const saveLocalBatch = (batch: BatchWithHistory): void => {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const existing = getLocalBatches().filter(
      (b) => b.batchId.toUpperCase() !== batch.batchId.toUpperCase()
    );
    existing.unshift(batch);
    localStorage.setItem(LOCAL_BATCHES_KEY, JSON.stringify(existing));
  } catch (e) {
    console.warn("Could not save local batch:", e);
  }
};

export const updateLocalBatchStage = (
  batchId: string,
  newEvent: SupplyChainEvent,
  newStage: Stage
): boolean => {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    const batches = getLocalBatches();
    const cleanId = batchId.toUpperCase();
    const idx = batches.findIndex((b) => b.batchId.toUpperCase() === cleanId);
    if (idx !== -1) {
      batches[idx].currentStage = newStage;
      batches[idx].events = [...batches[idx].events, newEvent];
      localStorage.setItem(LOCAL_BATCHES_KEY, JSON.stringify(batches));
      return true;
    }
    const demo = DEMO_BATCHES.find((b) => b.batchId.toUpperCase() === cleanId);
    if (demo) {
      const cloned: BatchWithHistory = {
        ...demo,
        currentStage: newStage,
        events: [...demo.events, newEvent],
      };
      saveLocalBatch(cloned);
      return true;
    }
  } catch (e) {
    console.warn("Could not update local batch stage:", e);
  }
  return false;
};

// ==========================================
// BLOCKCHAIN READ FUNCTIONS
// ==========================================

export interface FetchBatchResult {
  batch: BatchWithHistory;
  isLiveBlockchain: boolean;
}

/**
 * Fetch a single batch with full supply-chain events and corrections
 */
export const fetchBatchDetails = async (batchId: string): Promise<FetchBatchResult> => {
  const cleanId = batchId.trim().toUpperCase();

  // If live contract is configured, query the blockchain
  if (isContractConfigured()) {
    try {
      const contract = getReadOnlyContract();
      const rawBatch = await contract.getBatch(cleanId);
      const rawEvents = await contract.getBatchEvents(cleanId);
      const rawCorrections = await contract.getBatchCorrections(cleanId);

      let farmerData: Farmer | undefined = undefined;
      try {
        const rawFarmer = await contract.getFarmer(rawBatch.farmerId);
        farmerData = {
          farmerId: rawFarmer.farmerId,
          name: rawFarmer.name,
          location: rawFarmer.location,
          organization: rawFarmer.organization,
          walletAddress: rawFarmer.walletAddress !== ethers.ZeroAddress ? rawFarmer.walletAddress : undefined,
          registrationTime: Number(rawFarmer.registrationTime),
          registeredBy: rawFarmer.registeredBy,
          exists: rawFarmer.exists,
        };
      } catch (fErr) {
        console.warn(`Farmer ${rawBatch.farmerId} record fetch warning:`, fErr);
      }

      const events: SupplyChainEvent[] = rawEvents.map((ev: any) => ({
        stage: Number(ev.stage) as Stage,
        stageName: ev.stageName,
        location: ev.location,
        eventTimestamp: Number(ev.eventTimestamp),
        blockTimestamp: Number(ev.blockTimestamp),
        actor: ev.actor,
        notes: ev.notes,
      }));

      const corrections: Correction[] = rawCorrections.map((c: any) => ({
        correctionId: Number(c.correctionId),
        fieldName: c.fieldName,
        previousValue: c.previousValue,
        newValue: c.newValue,
        reason: c.reason,
        correctedBy: c.correctedBy,
        timestamp: Number(c.timestamp),
      }));

      const batchWithHistory: BatchWithHistory = {
        batchId: rawBatch.batchId,
        productName: rawBatch.productName,
        category: rawBatch.category,
        farmerId: rawBatch.farmerId,
        organizationName: rawBatch.organizationName,
        originLocation: rawBatch.originLocation,
        harvestDate: Number(rawBatch.harvestDate),
        registrationTime: Number(rawBatch.registrationTime),
        registeredBy: rawBatch.registeredBy,
        currentStage: Number(rawBatch.currentStage) as Stage,
        exists: rawBatch.exists,
        farmer: farmerData,
        events,
        corrections,
      };

      return { batch: batchWithHistory, isLiveBlockchain: true };
    } catch (err: any) {
      console.warn("Live blockchain read encountered error, checking local/demo store:", err);
      const localMatch = getLocalBatches().find((b) => b.batchId.toUpperCase() === cleanId);
      if (localMatch) {
        return { batch: localMatch, isLiveBlockchain: false };
      }
      const demoMatch = DEMO_BATCHES.find((b) => b.batchId.toUpperCase() === cleanId);
      if (demoMatch) {
        return { batch: demoMatch, isLiveBlockchain: false };
      }
      throw new Error(`Batch "${cleanId}" not found on smart contract.`);
    }
  }

  // Fallback to local or demo data if no contract is configured yet
  const localMatch = getLocalBatches().find((b) => b.batchId.toUpperCase() === cleanId);
  if (localMatch) {
    return { batch: localMatch, isLiveBlockchain: false };
  }
  const demoMatch = DEMO_BATCHES.find((b) => b.batchId.toUpperCase() === cleanId);
  if (demoMatch) {
    return { batch: demoMatch, isLiveBlockchain: false };
  }
  throw new Error(`Batch "${cleanId}" not found.`);
};

/**
 * Fetch all batches
 */
export const fetchAllBatches = async (): Promise<{ batches: Batch[]; isLiveBlockchain: boolean }> => {
  const localBatches = getLocalBatches();
  if (isContractConfigured()) {
    try {
      const contract = getReadOnlyContract();
      const allIds: string[] = await contract.getAllBatchIds();
      const batches: Batch[] = [];

      for (const id of allIds) {
        try {
          const raw = await contract.getBatch(id);
          batches.push({
            batchId: raw.batchId,
            productName: raw.productName,
            category: raw.category,
            farmerId: raw.farmerId,
            organizationName: raw.organizationName,
            originLocation: raw.originLocation,
            harvestDate: Number(raw.harvestDate),
            registrationTime: Number(raw.registrationTime),
            registeredBy: raw.registeredBy,
            currentStage: Number(raw.currentStage) as Stage,
            exists: raw.exists,
          });
        } catch (itemErr) {
          console.warn(`Could not fetch batch ${id}:`, itemErr);
        }
      }

      const onChainIds = new Set(batches.map((b) => b.batchId.toUpperCase()));
      const uniqueLocal = localBatches.filter((b) => !onChainIds.has(b.batchId.toUpperCase()));
      return { batches: [...batches, ...uniqueLocal], isLiveBlockchain: true };
    } catch (err) {
      console.warn("Error fetching batches from chain, showing local/demo batches:", err);
      const localIds = new Set(localBatches.map((b) => b.batchId.toUpperCase()));
      const filteredDemos = DEMO_BATCHES.filter((b) => !localIds.has(b.batchId.toUpperCase()));
      return { batches: [...localBatches, ...filteredDemos], isLiveBlockchain: false };
    }
  }
  const localIds = new Set(localBatches.map((b) => b.batchId.toUpperCase()));
  const filteredDemos = DEMO_BATCHES.filter((b) => !localIds.has(b.batchId.toUpperCase()));
  return { batches: [...localBatches, ...filteredDemos], isLiveBlockchain: false };
};

/**
 * Fetch all farmers
 */
export const fetchAllFarmers = async (): Promise<{ farmers: Farmer[]; isLiveBlockchain: boolean }> => {
  const localFarmers = getLocalFarmers();
  if (isContractConfigured()) {
    try {
      const contract = getReadOnlyContract();
      const allIds: string[] = await contract.getAllFarmerIds();
      const farmers: Farmer[] = [];

      for (const id of allIds) {
        try {
          const raw = await contract.getFarmer(id);
          farmers.push({
            farmerId: raw.farmerId,
            name: raw.name,
            location: raw.location,
            organization: raw.organization,
            walletAddress: raw.walletAddress !== ethers.ZeroAddress ? raw.walletAddress : undefined,
            registrationTime: Number(raw.registrationTime),
            registeredBy: raw.registeredBy,
            exists: raw.exists,
          });
        } catch (itemErr) {
          console.warn(`Could not fetch farmer ${id}:`, itemErr);
        }
      }

      const onChainIds = new Set(farmers.map((f) => f.farmerId.toUpperCase()));
      const uniqueLocal = localFarmers.filter((f) => !onChainIds.has(f.farmerId.toUpperCase()));
      return { farmers: [...farmers, ...uniqueLocal], isLiveBlockchain: true };
    } catch (err) {
      console.warn("Error fetching farmers from chain, showing local/demo farmers:", err);
      const localIds = new Set(localFarmers.map((f) => f.farmerId.toUpperCase()));
      const filteredDemos = DEMO_FARMERS.filter((f) => !localIds.has(f.farmerId.toUpperCase()));
      return { farmers: [...localFarmers, ...filteredDemos], isLiveBlockchain: false };
    }
  }
  const localIds = new Set(localFarmers.map((f) => f.farmerId.toUpperCase()));
  const filteredDemos = DEMO_FARMERS.filter((f) => !localIds.has(f.farmerId.toUpperCase()));
  return { farmers: [...localFarmers, ...filteredDemos], isLiveBlockchain: false };
};

/**
 * Fetch counts (total farmers, batches, events)
 */
export const fetchContractCounts = async (): Promise<{
  totalFarmers: number;
  totalBatches: number;
  totalEvents: number;
  isLiveBlockchain: boolean;
}> => {
  const localFarmers = getLocalFarmers();
  const localBatches = getLocalBatches();
  const localBatchIds = new Set(localBatches.map((b) => b.batchId.toUpperCase()));
  const filteredDemos = DEMO_BATCHES.filter((b) => !localBatchIds.has(b.batchId.toUpperCase()));
  const allBatches = [...localBatches, ...filteredDemos];
  const localEventsCount = allBatches.reduce((acc, b) => acc + (b.events ? b.events.length : 1), 0);

  if (isContractConfigured()) {
    try {
      const contract = getReadOnlyContract();
      const [farmers, batches, events] = await contract.getCounts();
      return {
        totalFarmers: Number(farmers) + localFarmers.length,
        totalBatches: Number(batches) + localBatches.length,
        totalEvents: Number(events) + (localBatches.length > 0 ? localEventsCount : 0),
        isLiveBlockchain: true,
      };
    } catch (err) {
      console.warn("Error fetching counts from chain, calculating from local/demo store:", err);
    }
  }
  return {
    totalFarmers: localFarmers.length + DEMO_FARMERS.length,
    totalBatches: allBatches.length,
    totalEvents: localEventsCount,
    isLiveBlockchain: false,
  };
};

/**
 * Check if address is authorized as organization or owner
 */
export const checkIsOrganization = async (address: string): Promise<boolean> => {
  if (!isContractConfigured() || !address) return false;
  try {
    const contract = getReadOnlyContract();
    const isOrg = await contract.isOrganization(address);
    const owner = await contract.owner();
    return Boolean(isOrg || owner.toLowerCase() === address.toLowerCase());
  } catch (err) {
    console.warn("Could not check organization status:", err);
    return false;
  }
};

/**
 * Check if address is authorized for a specific stage
 */
export const checkStageAuthorization = async (address: string, stage: Stage): Promise<boolean> => {
  if (!isContractConfigured() || !address) return false;
  try {
    const contract = getReadOnlyContract();
    return await contract.isAuthorizedForStage(address, stage);
  } catch (err) {
    console.warn("Could not check stage authorization:", err);
    return false;
  }
};

// ==========================================
// BLOCKCHAIN WRITE FUNCTIONS
// ==========================================

export interface WriteTxResult {
  hash: string;
  receipt: ethers.TransactionReceipt | null;
}

/**
 * Register a new farmer on Ethereum Sepolia
 */
export const registerFarmerOnChain = async (
  farmerId: string,
  name: string,
  location: string,
  organization: string,
  walletAddress?: string
): Promise<WriteTxResult> => {
  const contract = await getWriteContract();
  const wallet = walletAddress && ethers.isAddress(walletAddress) ? walletAddress : ethers.ZeroAddress;

  const tx = await contract.registerFarmer(
    farmerId.trim().toUpperCase(),
    name.trim(),
    location.trim(),
    organization.trim(),
    wallet
  );
  const receipt = await tx.wait();
  return { hash: tx.hash, receipt };
};

/**
 * Register a new product batch on Ethereum Sepolia
 */
export const registerBatchOnChain = async (
  batchId: string,
  productName: string,
  category: string,
  farmerId: string,
  organizationName: string,
  originLocation: string,
  harvestDate: number, // Unix timestamp in seconds
  notes: string
): Promise<WriteTxResult> => {
  const contract = await getWriteContract();

  const tx = await contract.registerBatch(
    batchId.trim().toUpperCase(),
    productName.trim(),
    category.trim(),
    farmerId.trim().toUpperCase(),
    organizationName.trim(),
    originLocation.trim(),
    harvestDate,
    notes.trim()
  );
  const receipt = await tx.wait();
  return { hash: tx.hash, receipt };
};

/**
 * Append a supply chain event on Ethereum Sepolia
 */
export const appendSupplyChainEventOnChain = async (
  batchId: string,
  stage: Stage,
  location: string,
  eventTimestamp: number,
  notes: string
): Promise<WriteTxResult> => {
  const contract = await getWriteContract();

  const tx = await contract.appendSupplyChainEvent(
    batchId.trim().toUpperCase(),
    stage,
    location.trim(),
    eventTimestamp,
    notes.trim()
  );
  const receipt = await tx.wait();
  return { hash: tx.hash, receipt };
};

/**
 * Record a transparent batch correction on Ethereum Sepolia
 */
export const recordCorrectionOnChain = async (
  batchId: string,
  fieldName: "productName" | "category" | "originLocation" | "organizationName",
  newValue: string,
  reason: string
): Promise<WriteTxResult> => {
  const contract = await getWriteContract();

  const tx = await contract.recordBatchCorrection(
    batchId.trim().toUpperCase(),
    fieldName,
    newValue.trim(),
    reason.trim()
  );
  const receipt = await tx.wait();
  return { hash: tx.hash, receipt };
};

/**
 * Authorize a participant address for specific stages
 */
export const authorizeParticipantOnChain = async (
  participant: string,
  stages: Stage[],
  roleName: string
): Promise<WriteTxResult> => {
  const contract = await getWriteContract();
  const tx = await contract.authorizeParticipant(participant, stages, roleName);
  const receipt = await tx.wait();
  return { hash: tx.hash, receipt };
};

/**
 * Revoke participant authorization for specific stages
 */
export const revokeParticipantStagesOnChain = async (
  participant: string,
  stages: Stage[]
): Promise<WriteTxResult> => {
  const contract = await getWriteContract();
  const tx = await contract.revokeParticipantStages(participant, stages);
  const receipt = await tx.wait();
  return { hash: tx.hash, receipt };
};

/**
 * Format ethers error messages nicely for user notifications
 */
export const parseContractError = (error: any): string => {
  if (!error) return "An unknown error occurred.";
  if (error.code === "ACTION_REJECTED" || error.message?.includes("user rejected action") || error.code === 4001) {
    return "Transaction was cancelled / rejected in MetaMask.";
  }
  if (error.code === "INSUFFICIENT_FUNDS" || error.message?.includes("insufficient funds")) {
    return "Insufficient Sepolia ETH to cover gas fee. Please request test ETH from a Sepolia faucet.";
  }
  if (error.reason) {
    return error.reason;
  }
  if (error.data?.message) {
    return error.data.message;
  }
  if (error.message) {
    if (error.message.includes("FarmerAlreadyExists")) return "A farmer with this ID is already registered.";
    if (error.message.includes("BatchAlreadyExists")) return "A batch with this ID is already registered.";
    if (error.message.includes("FarmerNotFound")) return "Associated Farmer ID was not found.";
    if (error.message.includes("BatchNotFound")) return "Batch ID was not found on the smart contract.";
    if (error.message.includes("UnauthorizedForStage")) return "Your connected wallet is not authorized for this supply chain stage.";
    if (error.message.includes("Unauthorized")) return "Your connected wallet is not authorized for this operation.";
    if (error.message.includes("FutureHarvestDate")) return "Harvest date cannot be in the future.";
    if (error.message.includes("InvalidStageTransition")) return "Invalid stage transition. Check stage sequence prerequisites.";
    return error.message;
  }
  return "Smart contract transaction failed.";
};

// Global ethereum typing
declare global {
  interface Window {
    ethereum?: any;
  }
}
