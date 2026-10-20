import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ExternalLink,
  Layers,
  FileEdit,
  ArrowLeft,
  Search,
  AlertCircle,
} from "lucide-react";
import { fetchBatchDetails } from "../services/web3Service";
import { BatchWithHistory } from "../types";
import { STAGE_LABELS } from "../types";
import { TimelineView } from "../components/TimelineView";
import { QRCodeCard } from "../components/QRCodeCard";
import { StatusBadge } from "../components/StatusBadge";
import { CorrectionModal } from "../components/CorrectionModal";
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
        <div className="w-12 h-12 rounded-full border-4 border-farm-200 border-t-farm-600 animate-spin mx-auto mb-4"></div>
        <p className="text-sm font-medium text-stone-600">Retrieving on-chain batch record...</p>
      </div>
    );
  }

  if (error || !batchData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900">Batch Not Found</h2>
        <p className="text-sm text-stone-600">
          {error || `No record was located on Ethereum Sepolia for Batch ID "${batchId}".`}
        </p>
        <div className="pt-2 flex justify-center space-x-3">
          <Link
            to="/dashboard"
            className="px-4 py-2 rounded-xl bg-stone-900 text-white font-semibold text-xs"
          >
            Back to Dashboard
          </Link>
          <Link
            to="/verify"
            className="px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200 gap-4">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-1.5 text-xs text-stone-500 hover:text-stone-800 font-semibold mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">{batchData.productName}</h1>
            <span className="font-mono text-sm font-bold px-2.5 py-1 rounded bg-stone-100 text-stone-800 border border-stone-200">
              {batchData.batchId}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Consumer View Button */}
          <Link
            to={`/verify/${batchData.batchId}`}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-farm-50 text-farm-700 border border-farm-200 hover:bg-farm-100 transition"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Public Verify View</span>
          </Link>

          {/* Add Checkpoint */}
          <Link
            to={`/supply-chain?batchId=${batchData.batchId}`}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-farm-600 hover:bg-farm-700 text-white shadow-xs transition"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>+ Add Checkpoint</span>
          </Link>

          {/* Transparent Correction Button */}
          {wallet.isConnected && (
            <button
              onClick={() => setIsCorrectionOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition"
              title="Record an on-chain transparent correction"
            >
              <FileEdit className="w-3.5 h-3.5 text-amber-600" />
              <span>Amend / Correct</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Indicators Row */}
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status="RECORD_FOUND" />
        <StatusBadge status="HISTORY_AVAILABLE" />
        {hasCorrections && <StatusBadge status="CORRECTION_RECORDED" />}
        <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-stone-100 text-stone-700 border border-stone-200">
          Stage: {STAGE_LABELS[batchData.currentStage] || "Active"}
        </span>
        <span className="text-xs text-stone-500 font-mono">
          {isLiveChain ? "Verified on Ethereum Sepolia" : "Loaded from Demo Prototype Store"}
        </span>
      </div>

      {/* Main Grid: Details + QR Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Metadata & Audit Trail */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-stone-900 text-base pb-3 border-b border-stone-100">
              Agricultural Batch Metadata
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-stone-400 block font-medium">Category:</span>
                <span className="font-semibold text-stone-800">{batchData.category}</span>
              </div>

              <div>
                <span className="text-stone-400 block font-medium">Harvest Date:</span>
                <span className="font-semibold text-stone-800">
                  {batchData.harvestDate ? new Date(batchData.harvestDate * 1000).toLocaleDateString() : "Unknown"}
                </span>
              </div>

              <div>
                <span className="text-stone-400 block font-medium">Farmer / Producer:</span>
                <span className="font-semibold text-stone-800">
                  {batchData.farmer ? `${batchData.farmer.name} (${batchData.farmerId})` : batchData.farmerId}
                </span>
              </div>

              <div>
                <span className="text-stone-400 block font-medium">Producer Organization:</span>
                <span className="font-semibold text-stone-800">{batchData.organizationName}</span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-stone-400 block font-medium">Origin Location:</span>
                <span className="font-semibold text-stone-800">{batchData.originLocation}</span>
              </div>

              <div>
                <span className="text-stone-400 block font-medium">Registration Time:</span>
                <span className="font-mono text-stone-700">
                  {batchData.registrationTime ? new Date(batchData.registrationTime * 1000).toLocaleString() : "-"}
                </span>
              </div>

              <div>
                <span className="text-stone-400 block font-medium">Registering Wallet:</span>
                <a
                  href={`https://sepolia.etherscan.io/address/${batchData.registeredBy}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-farm-700 hover:underline flex items-center space-x-1"
                >
                  <span>{formatAddress(batchData.registeredBy)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Corrections Audit Log (if any) */}
          {hasCorrections && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-amber-200/80">
                <FileEdit className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-amber-950 text-base">Recorded Corrections Audit Trail</h3>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                The smart contract enforces immutable correction logs. Amendments supersede earlier declared values without erasing previous states.
              </p>

              <div className="space-y-3">
                {batchData.corrections.map((corr, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-amber-200 text-xs space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-900 uppercase">
                        Field: {corr.fieldName}
                      </span>
                      <span className="text-stone-400">
                        {corr.timestamp ? new Date(corr.timestamp * 1000).toLocaleString() : ""}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div className="bg-stone-50 p-2 rounded line-through text-stone-500">
                        Previous: {corr.previousValue}
                      </div>
                      <div className="bg-emerald-50 p-2 rounded font-semibold text-emerald-800">
                        Current: {corr.newValue}
                      </div>
                    </div>

                    <div className="pt-1 text-stone-700">
                      <strong>Audit Reason:</strong> {corr.reason}
                    </div>

                    <div className="text-[10px] text-stone-400 pt-1 flex items-center space-x-1 font-mono">
                      <span>Corrected by wallet:</span>
                      <a
                        href={`https://sepolia.etherscan.io/address/${corr.correctedBy}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-farm-700 hover:underline"
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
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-stone-900 text-base pb-3 border-b border-stone-100 flex items-center justify-between">
              <span>Chronological Supply-Chain History</span>
              <span className="text-xs text-stone-500 font-normal">
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
