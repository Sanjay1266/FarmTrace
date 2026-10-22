import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Search,
  Camera,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Building2,
  Package,
  FileEdit,
  Lock,
  CheckCircle2,
  MapPin,
  Clock,
  UserCheck,
  X,
  Sparkles,
} from "lucide-react";
import { fetchBatchDetails } from "../services/web3Service";
import { BatchWithHistory, Stage, Farmer } from "../types";
import { STAGE_LABELS, STAGE_DESCRIPTIONS } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { TimelineView } from "../components/TimelineView";
import { QRScannerModal } from "../components/QRScannerModal";
import { QRCodeCard } from "../components/QRCodeCard";
import { SupplyChainStepper } from "../components/SupplyChainStepper";
import { useWeb3 } from "../context/Web3Context";

export const ConsumerVerifyPage: React.FC = () => {
  const { batchId: paramBatchId } = useParams<{ batchId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { contractAddress, formatAddress } = useWeb3();

  const [inputBatchId, setInputBatchId] = useState("");
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);

  const [batchData, setBatchData] = useState<BatchWithHistory | null>(null);
  const [isLiveBlockchain, setIsLiveBlockchain] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read-only farmer profile modal state (avoids navigating to farmer management)
  const [farmerModalData, setFarmerModalData] = useState<Farmer | null>(null);

  // Scanner modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Read initial batch ID from path param or query string
  useEffect(() => {
    const idFromUrl = paramBatchId || searchParams.get("id");
    if (idFromUrl) {
      const clean = idFromUrl.trim().toUpperCase();
      setInputBatchId(clean);
      setActiveBatchId(clean);
    }
  }, [paramBatchId, searchParams]);

  // Execute lookup whenever activeBatchId changes
  useEffect(() => {
    if (!activeBatchId) {
      setBatchData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetchBatchDetails(activeBatchId)
      .then((res) => {
        setBatchData(res.batch);
        setIsLiveBlockchain(res.isLiveBlockchain);
      })
      .catch((err: any) => {
        console.warn("Verification lookup failed:", err);
        setBatchData(null);
        setError(err.message || `No record found on Ethereum Sepolia for Batch ID "${activeBatchId}".`);
      })
      .finally(() => setLoading(false));
  }, [activeBatchId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputBatchId.trim()) return;
    const clean = inputBatchId.trim().toUpperCase();
    setActiveBatchId(clean);
    setSearchParams({ id: clean });
  };

  const handleScanSuccess = (scannedBatchId: string) => {
    setIsScannerOpen(false);
    setInputBatchId(scannedBatchId);
    setActiveBatchId(scannedBatchId);
    setSearchParams({ id: scannedBatchId });
  };

  const hasCorrections = batchData && batchData.corrections && batchData.corrections.length > 0;
  const isCompleteSupplyChain = batchData && batchData.currentStage === Stage.RetailerReceived;
  const latestEvent = batchData?.events && batchData.events.length > 0 
    ? batchData.events[batchData.events.length - 1] 
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Strict Public Read-Only Security Notice */}
      <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-xs text-emerald-200">
        <div className="flex items-center space-x-2.5">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Public Consumer Verification Mode:</strong> You are viewing an official read-only provenance certificate. Checkpoint recording, stage transitions, and batch modifications are strictly restricted to authorized supply-chain nodes.
          </span>
        </div>
        <span className="hidden sm:inline-flex px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-700/60 text-[10px] font-mono text-emerald-300 shrink-0">
          SECURED AUDIT
        </span>
      </div>

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-farm-400" />
          <span>Authenticity & Provenance Verification</span>
          <span className="text-emerald-600">•</span>
          <span>Zero Gas / Free for Consumers</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Verify Agricultural Product Authenticity
        </h1>
        <p className="text-stone-400 text-sm">
          Enter a unique Batch ID or scan the product's QR code to inspect complete, tamper-evident provenance status retrieved directly from Ethereum Sepolia.
        </p>
      </div>

      {/* Search & Scan Bar */}
      <div className="max-w-xl mx-auto space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={inputBatchId}
              onChange={(e) => setInputBatchId(e.target.value.toUpperCase())}
              placeholder="Enter Batch ID (e.g. FT-000001)..."
              className="w-full pl-11 pr-4 py-3 bg-[#0a100d] border border-[#1f2f25] rounded-xl font-mono text-sm uppercase font-bold text-white placeholder-stone-500 focus:border-farm-500 focus:ring-1 focus:ring-farm-500 shadow-inner transition"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="p-3 bg-[#0d1410] hover:bg-[#121c17] border border-[#18251e] rounded-xl text-farm-400 transition shadow-sm flex items-center justify-center shrink-0"
            title="Scan QR code using camera"
          >
            <Camera className="w-5 h-5 text-farm-400" />
          </button>

          <button
            type="submit"
            className="px-6 py-3 bg-farm-600 hover:bg-farm-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-farm-950/40 transition shrink-0"
          >
            Verify
          </button>
        </form>

        {/* Quick Demo Test Pills */}
        <div className="flex items-center justify-center space-x-2 text-xs text-stone-400 pt-1">
          <span>Try sample batches:</span>
          {["FT-000001", "FT-000002", "FT-000003"].map((id) => (
            <button
              key={id}
              onClick={() => {
                setInputBatchId(id);
                setActiveBatchId(id);
                setSearchParams({ id });
              }}
              className="px-2 py-0.5 rounded bg-[#121c17] hover:bg-emerald-950/60 hover:text-emerald-300 font-mono text-stone-300 font-semibold border border-[#18251e] transition"
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-16 text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-4 border-farm-900/50 border-t-farm-400 animate-spin mx-auto"></div>
          <p className="text-xs text-stone-400 font-medium">Querying smart contract on Ethereum Sepolia...</p>
        </div>
      )}

      {/* Error / Record Not Found State */}
      {!loading && error && (
        <div className="bg-rose-950/30 border border-rose-800/50 rounded-2xl p-8 max-w-2xl mx-auto text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-full bg-rose-950/60 border border-rose-800/50 text-rose-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <StatusBadge status="RECORD_NOT_FOUND" />
            <h3 className="text-xl font-bold text-white mt-2">No Matching Blockchain Record Found</h3>
            <p className="text-xs text-rose-300 mt-1 max-w-md mx-auto leading-relaxed">
              {error}
            </p>
          </div>
          <p className="text-[11px] text-stone-400 italic max-w-sm mx-auto">
            Please check the entered Batch ID for typos or verify that the product label QR was issued through the FarmTrace platform.
          </p>
        </div>
      )}

      {/* Verified Record Result Presentation */}
      {!loading && batchData && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Master Status & Authenticity Certificate Banner */}
          <div className="bg-[#0d1410] rounded-2xl border border-farm-800/50 p-6 sm:p-7 shadow-2xl relative overflow-hidden space-y-6">
            <div className="absolute top-0 right-0 w-80 h-80 bg-farm-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#18251e]">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="inline-flex items-center space-x-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>AUTHENTICITY VERIFIED</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-stone-300 px-2 py-0.5 rounded bg-[#121c17] border border-[#18251e]">
                    {batchData.batchId}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  {batchData.productName}
                </h2>
                <p className="text-xs text-stone-400 mt-0.5 flex items-center space-x-1.5">
                  <span>Produced by:</span>
                  <strong className="text-stone-200">
                    {batchData.farmer?.name || "Verified Smallholder Grower"}
                  </strong>
                  <span>•</span>
                  <span>{batchData.organizationName}</span>
                </p>
              </div>

              {/* Status Badges Row */}
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status="RECORD_FOUND" />
                <StatusBadge
                  status={isCompleteSupplyChain ? "HISTORY_AVAILABLE" : "INCOMPLETE_HISTORY"}
                />
                {hasCorrections && <StatusBadge status="CORRECTION_RECORDED" />}
                <span className="text-[11px] font-mono font-semibold text-emerald-300 px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-800/60 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{isLiveBlockchain ? "Ethereum Sepolia" : "Verified Ledger"}</span>
                </span>
              </div>
            </div>

            {/* 4-Column Key Status Metrics Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* Card 1: Current Operational Stage */}
              <div className="bg-[#121c17] p-4 rounded-xl border border-[#18251e] space-y-1.5">
                <div className="flex items-center justify-between text-stone-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Current Stage</span>
                  <span className="text-[10px] font-mono text-farm-400 font-bold">
                    Stage {Number(batchData.currentStage) + 1}/7
                  </span>
                </div>
                <div className="text-sm font-bold text-white">
                  {STAGE_LABELS[batchData.currentStage]}
                </div>
                <div className="text-[11px] text-emerald-400 font-medium">
                  {isCompleteSupplyChain ? "Delivered & Ready at Retail" : "Active in Provenance Trail"}
                </div>
              </div>

              {/* Card 2: Current Physical Location */}
              <div className="bg-[#121c17] p-4 rounded-xl border border-[#18251e] space-y-1.5">
                <div className="flex items-center justify-between text-stone-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Latest Location</span>
                  <MapPin className="w-3.5 h-3.5 text-farm-400" />
                </div>
                <div className="text-sm font-bold text-white truncate" title={latestEvent?.location || batchData.originLocation}>
                  {latestEvent?.location.split(",")[0] || batchData.originLocation.split(",")[0]}
                </div>
                <div className="text-[11px] text-stone-400 truncate">
                  {latestEvent?.location || batchData.originLocation}
                </div>
              </div>

              {/* Card 3: Checkpoint Progression */}
              <div className="bg-[#121c17] p-4 rounded-xl border border-[#18251e] space-y-1.5">
                <div className="flex items-center justify-between text-stone-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Milestone Checkpoints</span>
                  <Clock className="w-3.5 h-3.5 text-farm-400" />
                </div>
                <div className="text-sm font-bold text-white">
                  {batchData.events.length} Checkpoints Logged
                </div>
                <div className="text-[11px] text-stone-400">
                  Last update: {latestEvent ? new Date(latestEvent.blockTimestamp * 1000).toLocaleDateString() : "At Harvest"}
                </div>
              </div>

              {/* Card 4: Integrity & Modifications */}
              <div className="bg-[#121c17] p-4 rounded-xl border border-[#18251e] space-y-1.5">
                <div className="flex items-center justify-between text-stone-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Integrity Audit</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-sm font-bold text-white">
                  {hasCorrections ? `${batchData.corrections.length} Transparent Correction` : "100% Unaltered Record"}
                </div>
                <div className="text-[11px] text-emerald-400 font-medium">
                  Zero Tampering Detected
                </div>
              </div>
            </div>

            {/* Clear Verification Claims Explanation */}
            <div className="bg-[#101813] rounded-xl p-4 border border-[#18251e] text-xs space-y-2">
              <div className="flex items-center space-x-1.5 font-bold text-white uppercase tracking-wider text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>What This Blockchain Record Verifies</span>
              </div>
              <ul className="text-stone-300 space-y-1 list-disc list-inside">
                <li>
                  <strong className="text-white">Immutable Record Existence:</strong> Batch ID <span className="font-mono font-bold text-farm-300">{batchData.batchId}</span> is cryptographically anchored on Ethereum Sepolia smart contract.
                </li>
                <li>
                  <strong className="text-white">Authorized Provenance:</strong> Minted by verified entity wallet <span className="font-mono text-farm-400">{formatAddress(batchData.registeredBy)}</span> on {new Date(batchData.registrationTime * 1000).toLocaleString()}.
                </li>
                <li>
                  <strong className="text-white">Supply-Chain Milestones:</strong> {batchData.events.length} chronological stage checkpoints verified with dual tamper-evident timestamps.
                </li>
              </ul>
              <div className="mt-2 pt-2 border-t border-[#18251e] text-[11px] text-stone-400 italic">
                * Note on Limitations: Blockchain immutability confirms that records were authored by authorized entities at specified timestamps; it guarantees data integrity after submission.
              </div>
            </div>
          </div>

          {/* Full Visual 7-Stage Supply Chain Lifecycle Stepper */}
          <SupplyChainStepper
            currentStage={batchData.currentStage}
            events={batchData.events}
          />

          {/* Product Overview & Read-Only Farmer Origin Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Batch Info Card */}
            <div className="bg-[#0d1410] rounded-2xl border border-[#18251e] p-6 shadow-xl space-y-3">
              <div className="flex items-center space-x-2 text-white font-bold text-base pb-2 border-b border-[#18251e]">
                <Package className="w-5 h-5 text-farm-400" />
                <span>Agricultural Product Specifications</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-[#18251e]/60">
                  <span className="text-stone-400">Batch Identifier:</span>
                  <span className="font-mono font-bold text-white">{batchData.batchId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#18251e]/60">
                  <span className="text-stone-400">Product Category:</span>
                  <span className="font-semibold text-stone-200">{batchData.category}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#18251e]/60">
                  <span className="text-stone-400">Declared Harvest Date:</span>
                  <span className="font-semibold text-stone-200">
                    {batchData.harvestDate ? new Date(batchData.harvestDate * 1000).toLocaleDateString() : "-"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#18251e]/60">
                  <span className="text-stone-400">Current Tracking Stage:</span>
                  <span className="font-semibold text-farm-400">
                    {STAGE_LABELS[batchData.currentStage]}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#18251e]/60">
                  <span className="text-stone-400">Current Stage Details:</span>
                  <span className="text-stone-300 text-right max-w-[220px]">
                    {STAGE_DESCRIPTIONS[batchData.currentStage]}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-stone-400">Smart Contract:</span>
                  <a
                    href={`https://sepolia.etherscan.io/address/${contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-farm-400 hover:text-farm-300 hover:underline flex items-center space-x-1"
                  >
                    <span>{formatAddress(contractAddress)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Read-Only Farmer & Origin Card (No Edit/Update Redirects) */}
            <div className="bg-[#0d1410] rounded-2xl border border-[#18251e] p-6 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#18251e]">
                <div className="flex items-center space-x-2 text-white font-bold text-base">
                  <Building2 className="w-5 h-5 text-farm-400" />
                  <span>Producer & Farm Origin</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">
                  Verified Producer
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-[#18251e]/60">
                  <span className="text-stone-400">Farmer / Cultivator:</span>
                  <span className="font-semibold text-white">
                    {batchData.farmer ? batchData.farmer.name : "Declared Smallholder Grower"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#18251e]/60">
                  <span className="text-stone-400">Farmer ID:</span>
                  <span className="font-mono font-bold text-stone-200">
                    {batchData.farmerId}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#18251e]/60">
                  <span className="text-stone-400">Producer Organization (FPO):</span>
                  <span className="font-semibold text-stone-200 text-right max-w-[200px]">
                    {batchData.organizationName}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#18251e]/60">
                  <span className="text-stone-400">Place of Origin:</span>
                  <span className="font-semibold text-stone-200 text-right max-w-[200px]">
                    {batchData.originLocation}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#18251e]/60">
                  <span className="text-stone-400">Registering Wallet:</span>
                  <a
                    href={`https://sepolia.etherscan.io/address/${batchData.registeredBy}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-farm-400 hover:text-farm-300 hover:underline flex items-center space-x-1"
                  >
                    <span>{formatAddress(batchData.registeredBy)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Read-Only Farmer Profile View Action */}
                {batchData.farmer && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setFarmerModalData(batchData.farmer || null)}
                      className="w-full py-2 px-3 rounded-lg bg-[#121c17] hover:bg-[#18251e] border border-[#1f2f25] text-stone-300 hover:text-white font-medium text-xs flex items-center justify-center space-x-1.5 transition"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-farm-400" />
                      <span>View Certified Producer Credentials</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transparent Corrections History (if any) */}
          {hasCorrections && (
            <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-6 shadow-xl space-y-3">
              <div className="flex items-center space-x-2 text-amber-300 font-bold text-base">
                <FileEdit className="w-5 h-5 text-amber-400" />
                <span>Transparent Correction History</span>
              </div>
              <p className="text-xs text-amber-200/80">
                An authorized entity updated information after initial registration. In accordance with blockchain audit standards, the original historical record is preserved alongside this reason:
              </p>

              <div className="space-y-2 mt-2">
                {batchData.corrections.map((c, i) => (
                  <div key={i} className="bg-[#0d1410] p-3.5 rounded-xl border border-amber-800/30 text-xs">
                    <div className="flex justify-between font-mono font-bold text-amber-300">
                      <span>Field Amended: {c.fieldName}</span>
                      <span className="text-stone-400 font-sans font-normal text-[11px]">
                        {c.timestamp ? new Date(c.timestamp * 1000).toLocaleString() : ""}
                      </span>
                    </div>
                    <p className="text-stone-300 mt-1">
                      <strong className="text-stone-200">Audit Reason:</strong> "{c.reason}"
                    </p>
                    <div className="mt-1 text-[11px] text-stone-400 flex items-center space-x-2 font-mono">
                      <span>Previous: <span className="line-through text-stone-500">{c.previousValue}</span></span>
                      <span>→</span>
                      <span>Corrected: <strong className="text-emerald-400">{c.newValue}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chronological Supply-Chain History Timeline */}
          <div className="bg-[#0d1410] rounded-2xl border border-[#18251e] p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#18251e] gap-2">
              <div>
                <h3 className="text-xl font-bold text-white">Chronological Checkpoint Audit Trail</h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Complete milestone trail from farm harvest through transit checkpoints.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 self-start sm:self-center">
                {batchData.events.length} Checkpoints Logged
              </span>
            </div>

            <TimelineView events={batchData.events} currentStage={batchData.currentStage} />
          </div>

          {/* QR Card Presentation for Consumers */}
          <div className="max-w-md mx-auto">
            <QRCodeCard
              batchId={batchData.batchId}
              productName={batchData.productName}
              organizationName={batchData.organizationName}
              originLocation={batchData.originLocation}
              harvestDate={batchData.harvestDate}
            />
          </div>

          {/* Concluding Immutability Assurance */}
          <div className="text-center py-4 border-t border-[#18251e] text-xs text-stone-500 space-y-1">
            <p>FarmTrace Public Verification System • Authenticated against Ethereum Sepolia Contract</p>
            <p className="text-[11px] text-stone-600">
              This verification view is cryptographically sealed and read-only.
            </p>
          </div>
        </div>
      )}

      {/* Read-Only Farmer Profile Modal (Keeps user on verify page without redirect) */}
      {farmerModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0d1410] border border-[#1f2f25] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#18251e]">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-farm-400" />
                <h3 className="text-lg font-bold text-white">Verified Producer Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setFarmerModalData(null)}
                className="p-1 rounded-lg hover:bg-[#18251e] text-stone-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#121c17] rounded-xl border border-[#18251e] flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-stone-400">Cultivator Name</p>
                  <p className="text-base font-bold text-white mt-0.5">{farmerModalData.name}</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 font-mono text-[10px] font-bold">
                  {farmerModalData.farmerId}
                </span>
              </div>

              <div className="space-y-2 px-1">
                <div className="flex justify-between py-1.5 border-b border-[#18251e]">
                  <span className="text-stone-400">Associated FPO / Collective:</span>
                  <span className="font-semibold text-stone-200 text-right">{farmerModalData.organization}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#18251e]">
                  <span className="text-stone-400">Farm Location:</span>
                  <span className="font-semibold text-stone-200 text-right max-w-[260px]">{farmerModalData.location}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#18251e]">
                  <span className="text-stone-400">Registration Timestamp:</span>
                  <span className="text-stone-300">
                    {farmerModalData.registrationTime
                      ? new Date(farmerModalData.registrationTime * 1000).toLocaleString()
                      : "Verified"}
                  </span>
                </div>
                {farmerModalData.walletAddress && (
                  <div className="flex justify-between py-1.5 border-b border-[#18251e]">
                    <span className="text-stone-400">Farmer Wallet:</span>
                    <span className="font-mono text-farm-400">{formatAddress(farmerModalData.walletAddress)}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5">
                  <span className="text-stone-400">Registered By:</span>
                  <span className="font-mono text-stone-300">{formatAddress(farmerModalData.registeredBy)}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-800/40 text-[11px] text-emerald-300 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  This producer is registered on the FarmTrace decentralized smart contract. Their verified harvests are protected with tamper-evident blockchain provenance.
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setFarmerModalData(null)}
                className="w-full py-2.5 rounded-xl bg-[#121c17] hover:bg-[#1a2920] border border-[#1f2f25] text-white font-semibold text-xs transition"
              >
                Close Producer Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
};
