export enum Stage {
  Harvested = 0,
  ProcessingReceived = 1,
  ProcessingCompleted = 2,
  Packaged = 3,
  Dispatched = 4,
  DistributorReceived = 5,
  RetailerReceived = 6,
}

export const STAGE_LABELS: Record<Stage, string> = {
  [Stage.Harvested]: "Harvested",
  [Stage.ProcessingReceived]: "Received for Processing",
  [Stage.ProcessingCompleted]: "Processing Completed",
  [Stage.Packaged]: "Packaged & Labeled",
  [Stage.Dispatched]: "Dispatched in Transit",
  [Stage.DistributorReceived]: "Received by Distributor",
  [Stage.RetailerReceived]: "Received by Retailer",
};

export const STAGE_DESCRIPTIONS: Record<Stage, string> = {
  [Stage.Harvested]: "Produce harvested at farm origin and declared by registered farmer/organization.",
  [Stage.ProcessingReceived]: "Consignment received at processing mill or cleaning facility.",
  [Stage.ProcessingCompleted]: "Grading, sorting, drying, or processing completed with quality clearance.",
  [Stage.Packaged]: "Packed into tamper-sealed units and affixed with unique batch identifier.",
  [Stage.Dispatched]: "Released into distribution logistics network via carrier vehicle.",
  [Stage.DistributorReceived]: "Inward receipt confirmed at regional distribution warehouse or logistics hub.",
  [Stage.RetailerReceived]: "Delivered to retail outlet or consumer point of sale.",
};

export interface Farmer {
  farmerId: string;
  name: string;
  location: string;
  organization: string;
  walletAddress?: string;
  registrationTime: number; // Unix timestamp in seconds
  registeredBy: string;
  exists: boolean;
}

export interface SupplyChainEvent {
  stage: Stage;
  stageName: string;
  location: string;
  eventTimestamp: number; // Declared date
  blockTimestamp: number; // Tamper-evident blockchain timestamp
  actor: string;
  notes: string;
  txHash?: string;
}

export interface Correction {
  correctionId: number;
  fieldName: string;
  previousValue: string;
  newValue: string;
  reason: string;
  correctedBy: string;
  timestamp: number;
}

export interface Batch {
  batchId: string;
  productName: string;
  category: string;
  farmerId: string;
  organizationName: string;
  originLocation: string;
  harvestDate: number;
  registrationTime: number;
  registeredBy: string;
  currentStage: Stage;
  exists: boolean;
}

export interface BatchWithHistory extends Batch {
  farmer?: Farmer;
  events: SupplyChainEvent[];
  corrections: Correction[];
  registrationTxHash?: string;
}

export interface ContractCounts {
  totalFarmers: number;
  totalBatches: number;
  totalEvents: number;
}

export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  isSepolia: boolean;
  isOrganization: boolean;
  isOwner: boolean;
  error: string | null;
}

export interface TxStatus {
  status: "idle" | "awaiting_wallet" | "pending" | "confirmed" | "failed";
  hash?: string;
  message?: string;
  errorMessage?: string;
}
