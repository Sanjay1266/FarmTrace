import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ExternalLink,
  Layers,
  FileEdit,
  ArrowLeft,
  Search,
  AlertCircle,
  Lock,
} from "lucide-react";
import { fetchBatchDetails } from "../services/web3Service";
import { BatchWithHistory } from "../types";
import { STAGE_LABELS } from "../types";
import { TimelineView } from "../components/TimelineView";
import { QRCodeCard } from "../components/QRCodeCard";
import { StatusBadge } from "../components/StatusBadge";
import { CorrectionModal } from "../components/CorrectionModal";
import { SupplyChainStepper } from "../components/SupplyChainStepper";
import { useWeb3 } from "../context/Web3Context";

export const BatchDetailsPage: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const { wallet, formatAddress } = useWeb3();

  const [batchData, setBatchData] = useState<BatchWithHistory | null>(null);
  const [isLiveChain, setIsLiveChain] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Correction modal state
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);

  const loadBatch = async () => {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchBatchDetails(batchId);
      setBatchData(result.batch);
      setIsLiveChain(result.isLiveBlockchain);
    } catch (err: any) {
      console.warn("Failed to load batch:", err);
      setError(err.message || "Failed to retrieve batch details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatch();
  }, [batchId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-farm-900/50 border-t-farm-400 animate-spin mx-auto mb-4"></div>
        <p className="text-sm font-medium text-stone-400">Retrieving on-chain batch record...</p>
      </div>
    );
  }

  if (error || !batchData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-950/40 text-rose-400 border border-rose-800/50 mx-auto flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Batch Not Found</h2>
        <p className="text-sm text-stone-400">
          {error || `No record was located on Ethereum Sepolia for Batch ID "${batchId}".`}
        </p>
        <div className="pt-2 flex justify-center space-x-3">
          <Link
            to="/dashboard"
            className="px-4 py-2 rounded-xl bg-farm-600 hover:bg-farm-500 text-white font-semibold text-xs shadow-lg shadow-farm-950/40 transition"
          >
            Back to Dashboard
          </Link>
          <Link
            to="/verify"
            className="px-4 py-2 rounded-xl border border-[#18251e] bg-[#0d1410] hover:bg-[#121c17] text-stone-300 font-semibold text-xs transition"
          >
            Search Another Batch
          </Link>
        </div>
      </div>
    );
  }

  const hasCorrections = batchData.corrections && batchData.corrections.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Link & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#18251e] gap-4">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-1.5 text-xs text-stone-400 hover:text-white font-semibold mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{batchData.productName}</h1>
            <span className="font-mono text-sm font-bold px-2.5 py-1 rounded bg-[#121c17] text-stone-200 border border-[#1f2f25]">
              {batchData.batchId}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Public Consumer View Button */}
          <Link
            to={`/verify/${batchData.batchId}`}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-950/50 text-emerald-300 border border-emerald-800/50 hover:bg-emerald-900/40 transition"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Public Verify View</span>
          </Link>

          {/* Add Checkpoint & Correction: Strictly restricted to authorized organization custodian wallets */}
          {wallet.isConnected && (wallet.isOrganization || wallet.isOwner) ? (
            <>
              <Link
                to={`/supply-chain?batchId=${batchData.batchId}`}
                className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-farm-600 hover:bg-farm-500 text-white shadow-lg shadow-farm-950/40 transition"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>+ Add Checkpoint</span>
              </Link>

              <button
                onClick={() => setIsCorrectionOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-amber-800/60 bg-amber-950/50 text-amber-300 hover:bg-amber-900/40 transition"
                title="Record an on-chain transparent correction"
              >
                <FileEdit className="w-3.5 h-3.5 text-amber-400" />
                <span>Amend / Correct</span>
              </button>
            </>
          ) : (
            <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-2 rounded-lg bg-[#121c17] text-stone-400 border border-[#18251e] text-[11px]">
              <Lock className="w-3 h-3 text-stone-500" />
              <span>Read-Only (Custodian Login Required)</span>
            </span>
          )}
        </div>
      </div>

      {/* Status Indicators Row */}
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status="RECORD_FOUND" />
        <StatusBadge status="HISTORY_AVAILABLE" />
        {hasCorrections && <StatusBadge status="CORRECTION_RECORDED" />}
        <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[#121c17] text-stone-300 border border-[#18251e]">
          Stage: {STAGE_LABELS[batchData.currentStage] || "Active"}
        </span>
        <span className="text-xs text-stone-400 font-mono">
          {isLiveChain ? "Verified on Ethereum Sepolia" : "Loaded from Demo Prototype Store"}
        </span>
      </div>

      {/* Full Supply-Chain 7-Stage Stepper Status */}
      <SupplyChainStepper
        currentStage={batchData.currentStage}
        events={batchData.events}
      />

      {/* Main Grid: Details + QR Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Metadata & Audit Trail */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Card */}
          <div className="bg-[#0d1410] rounded-2xl border border-[#18251e] p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base pb-3 border-b border-[#18251e]">
              Agricultural Batch Metadata
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-stone-400 block font-medium">Category:</span>
                <span className="font-semibold text-stone-200">{batchData.category}</span>
              </div>

              <div>
                <span className="text-stone-400 block font-medium">Harvest Date:</span>
                <span className="font-semibold text-stone-200">
                  {batchData.harvestDate ? new Date(batchData.harvestDate * 1000).toLocaleDateString() : "Unknown"}
                </span>
              </div>

              <div>
                <span className="text-stone-400 block font-medium">Farmer / Producer:</span>
                <Link
                  to={`/farmers?selected=${batchData.farmerId}`}
                  className="font-semibold text-farm-400 hover:text-farm-300 hover:underline flex items-center space-x-1"
                  title="View all batches undertaken by this farmer"
                >
                  <span>{batchData.farmer ? `${batchData.farmer.name} (${batchData.farmerId})` : batchData.farmerId}</span>
                  <ExternalLink className="w-3 h-3 text-stone-500" />
                </Link>
              </div>

              <div>
                <span className="text-stone-400 block font-medium">Producer Organization:</span>
                <span className="font-semibold text-stone-200">{batchData.organizationName}</span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-stone-400 block font-medium">Origin Location:</span>
                <span className="font-semibold text-stone-200">{batchData.originLocation}</span>
              </div>

              <div>
                <span className="text-stone-400 block font-medium">Registration Time:</span>
                <span className="font-mono text-stone-300">
                  {batchData.registrationTime ? new Date(batchData.registrationTime * 1000).toLocaleString() : "-"}
                </span>
              </div>

              <div>
                <span className="text-stone-400 block font-medium">Registering Wallet:</span>
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
            </div>
          </div>

          {/* Corrections Audit Log (if any) */}
          {hasCorrections && (
            <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-amber-800/40">
                <FileEdit className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-amber-300 text-base">Recorded Corrections Audit Trail</h3>
              </div>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                The smart contract enforces immutable correction logs. Amendments supersede earlier declared values without erasing previous states.
              </p>

              <div className="space-y-3">
                {batchData.corrections.map((corr, idx) => (
                  <div key={idx} className="bg-[#0d1410] p-4 rounded-xl border border-amber-800/30 text-xs space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-400 uppercase">
                        Field: {corr.fieldName}
                      </span>
                      <span className="text-stone-400">
                        {corr.timestamp ? new Date(corr.timestamp * 1000).toLocaleString() : ""}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div className="bg-[#121c17] p-2 rounded line-through text-stone-500 border border-[#18251e]">
                        Previous: {corr.previousValue}
                      </div>
                      <div className="bg-emerald-950/50 p-2 rounded font-semibold text-emerald-300 border border-emerald-800/40">
                        Current: {corr.newValue}
                      </div>
                    </div>

                    <div className="pt-1 text-stone-300">
                      <strong className="text-stone-200">Audit Reason:</strong> {corr.reason}
                    </div>

                    <div className="text-[10px] text-stone-400 pt-1 flex items-center space-x-1 font-mono">
                      <span>Corrected by wallet:</span>
                      <a
                        href={`https://sepolia.etherscan.io/address/${corr.correctedBy}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-farm-400 hover:text-farm-300 hover:underline"
                      >
                        {formatAddress(corr.correctedBy)}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supply Chain Timeline */}
          <div className="bg-[#0d1410] rounded-2xl border border-[#18251e] p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base pb-3 border-b border-[#18251e] flex items-center justify-between">
              <span>Chronological Supply-Chain History</span>
              <span className="text-xs text-stone-400 font-normal">
                {batchData.events.length} Checkpoints Recorded
              </span>
            </h3>

            <TimelineView events={batchData.events} currentStage={batchData.currentStage} />
          </div>
        </div>

        {/* Right Column: QR Code & Verification Card */}
        <div className="space-y-6">
          <QRCodeCard
            batchId={batchData.batchId}
            productName={batchData.productName}
            organizationName={batchData.organizationName}
            originLocation={batchData.originLocation}
            harvestDate={batchData.harvestDate}
          />
        </div>
      </div>

      {/* Transparent Correction Modal */}
      {isCorrectionOpen && (
        <CorrectionModal
          batch={batchData}
          isOpen={isCorrectionOpen}
          onClose={() => setIsCorrectionOpen(false)}
          onCorrectionSuccess={() => {
            loadBatch();
          }}
        />
      )}
    </div>
  );
};
