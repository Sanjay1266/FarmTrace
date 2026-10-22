import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Layers,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import {
  appendSupplyChainEventOnChain,
  fetchAllBatches,
  fetchBatchDetails,
  parseContractError,
  updateLocalBatchStage,
} from "../services/web3Service";
import { Batch, BatchWithHistory, Stage, TxStatus } from "../types";
import { STAGE_DESCRIPTIONS, STAGE_LABELS } from "../types";
import { TransactionModal } from "../components/TransactionModal";

export const SupplyChainManagementPage: React.FC = () => {
  const { wallet, switchToSepolia, formatAddress } = useWeb3();
  const location = useLocation();
  const navigate = useNavigate();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [currentBatchDetails, setCurrentBatchDetails] = useState<BatchWithHistory | null>(null);

  // Form Fields
  const [targetStage, setTargetStage] = useState<Stage>(Stage.ProcessingReceived);
  const [eventLocation, setEventLocation] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const [txStatus, setTxStatus] = useState<TxStatus>({ status: "idle" });
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load all batches
  useEffect(() => {
    fetchAllBatches()
      .then((res) => {
        setBatches(res.batches);
        const queryParams = new URLSearchParams(location.search);
        const qBatchId = queryParams.get("batchId");
        if (qBatchId && res.batches.some((b) => b.batchId === qBatchId)) {
          setSelectedBatchId(qBatchId);
        } else if (res.batches.length > 0) {
          setSelectedBatchId(res.batches[0].batchId);
        }
      })
      .catch(console.warn);
  }, [location.search]);

  // Load selected batch details
  useEffect(() => {
    if (!selectedBatchId) return;
    fetchBatchDetails(selectedBatchId)
      .then((res) => {
        setCurrentBatchDetails(res.batch);
        // Default target stage to next logical step
        const nextStage = (res.batch.currentStage + 1) as Stage;
        if (nextStage <= Stage.RetailerReceived) {
          setTargetStage(nextStage);
        }
      })
      .catch(console.warn);
  }, [selectedBatchId]);

  // Valid next stages based on smart contract rules
  const getAvailableStages = () => {
    if (!currentBatchDetails) return [];
    const cur = currentBatchDetails.currentStage;
    const stages: { stage: Stage; label: string; disabled: boolean; reason?: string }[] = [];

    for (let s = Stage.ProcessingReceived; s <= Stage.RetailerReceived; s++) {
      let disabled = false;
      let reason = "";

      if (s <= cur) {
        disabled = true;
        reason = "Stage already completed";
      } else if (s === Stage.Dispatched && cur < Stage.Packaged) {
        disabled = true;
        reason = "Cannot dispatch before packaging";
      } else if (s === Stage.DistributorReceived && cur < Stage.Dispatched) {
        disabled = true;
        reason = "Cannot receive before dispatch";
      } else if (s === Stage.RetailerReceived && cur < Stage.DistributorReceived) {
        disabled = true;
        reason = "Must be received by distributor first";
      }

      stages.push({
        stage: s,
        label: STAGE_LABELS[s],
        disabled,
        reason,
      });
    }

    return stages;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!selectedBatchId || !eventLocation.trim()) {
      setValidationError("Batch ID and Location are required.");
      return;
    }

    // Check future date
    const selectedTime = new Date(eventDate).getTime();
    const nowTime = new Date().getTime();
    if (selectedTime > nowTime + 3600000) {
      setValidationError("Event date cannot be in the future.");
      return;
    }

    const eventTimestampSeconds = Math.floor(new Date(eventDate).getTime() / 1000);
    const newEvent = {
      stage: targetStage,
      stageName: STAGE_LABELS[targetStage],
      location: eventLocation.trim(),
      eventTimestamp: eventTimestampSeconds,
      blockTimestamp: Math.floor(Date.now() / 1000),
      actor: wallet.address || "0xDemoActorWallet",
      notes: notes.trim(),
    };

    // If MetaMask is connected and on Sepolia/Localhost, attempt on-chain registration
    if (wallet.isConnected && wallet.isSepolia) {
      setTxStatus({ status: "awaiting_wallet" });
      try {
        const result = await appendSupplyChainEventOnChain(
          selectedBatchId,
          targetStage,
          eventLocation.trim(),
          eventTimestampSeconds,
          notes.trim()
        );

        updateLocalBatchStage(selectedBatchId, newEvent, targetStage);

        setTxStatus({
          status: "confirmed",
          hash: result.hash,
          message: `Stage "${STAGE_LABELS[targetStage]}" recorded on Ethereum Sepolia for Batch ${selectedBatchId}!`,
        });

        fetchBatchDetails(selectedBatchId).then((r) => setCurrentBatchDetails(r.batch));
        setNotes("");
        return;
      } catch (err: any) {
        console.warn("On-chain append event failed, saving to local demo:", err);
        updateLocalBatchStage(selectedBatchId, newEvent, targetStage);

        setTxStatus({
          status: "confirmed",
          message: `On-chain transaction failed (${parseContractError(err)}). Saved to Local Demo Mode! Stage "${STAGE_LABELS[targetStage]}" is now updated for Batch ${selectedBatchId}.`,
        });

        fetchBatchDetails(selectedBatchId).then((r) => setCurrentBatchDetails(r.batch));
        setNotes("");
        return;
      }
    }

    // Offline / Demo Mode
    updateLocalBatchStage(selectedBatchId, newEvent, targetStage);
    setTxStatus({
      status: "confirmed",
      message: `Stage "${STAGE_LABELS[targetStage]}" recorded in Local Demo Mode for Batch ${selectedBatchId}!`,
    });

    fetchBatchDetails(selectedBatchId).then((r) => setCurrentBatchDetails(r.batch));
    setNotes("");
  };

  const availableStages = getAvailableStages();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-stone-200">
        <div className="flex items-center space-x-2">
          <Layers className="w-6 h-6 text-farm-600" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
            Supply-Chain Checkpoints & Tracking
          </h1>
        </div>
        <p className="text-sm text-stone-500 mt-1">
          Authorized participants (processing units, packaging centers, logistics carriers, retailers) record verifiable milestone events on Ethereum Sepolia.
        </p>
      </div>

      {/* Role Notice */}
      <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 shadow-xs border border-stone-800 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Role-Based Smart Contract Permissions</span>
          </span>
          <Link to="/access" className="text-farm-400 hover:underline">
            Manage Participant Roles →
          </Link>
        </div>
        <p className="text-stone-300">
          Only authorized wallet addresses with appropriate stage permissions can append events. Invalid stage jumps (such as dispatching before packaging) are strictly enforced by the Solidity smart contract.
        </p>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
        {validationError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Batch Selector */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Select Agricultural Batch *
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl bg-white text-stone-900 font-semibold focus:ring-2 focus:ring-farm-500"
            >
              {batches.map((b) => (
                <option key={b.batchId} value={b.batchId}>
                  {b.batchId} — {b.productName} ({b.originLocation})
                </option>
              ))}
            </select>
          </div>

          {/* Current Batch State Preview */}
          {currentBatchDetails && (
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-stone-400 block font-medium">Current Stage:</span>
                <span className="font-bold text-farm-700">
                  {STAGE_LABELS[currentBatchDetails.currentStage]}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block font-medium">Producer Org:</span>
                <span className="font-semibold text-stone-800 truncate block">
                  {currentBatchDetails.organizationName}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block font-medium">Recorded Checkpoints:</span>
                <span className="font-semibold text-stone-800">
                  {currentBatchDetails.events.length} Completed
                </span>
              </div>
            </div>
          )}

          {/* Target Stage Selector */}
          <div>
            <label className="block font-semibold text-stone-700 mb-2">
              Next Stage Event to Record *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableStages.map((item) => (
                <label
                  key={item.stage}
                  className={`p-3.5 rounded-xl border flex items-start space-x-3 cursor-pointer transition ${
                    item.disabled
                      ? "opacity-40 bg-stone-100 border-stone-200 cursor-not-allowed"
                      : targetStage === item.stage
                      ? "border-farm-600 bg-farm-50/60 ring-2 ring-farm-500/20"
                      : "border-stone-200 hover:border-stone-300 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="targetStage"
                    value={item.stage}
                    disabled={item.disabled}
                    checked={targetStage === item.stage}
                    onChange={() => setTargetStage(item.stage)}
                    className="mt-0.5 text-farm-600 focus:ring-farm-500"
                  />
                  <div>
                    <span className="font-bold text-stone-900 block">{item.label}</span>
                    <span className="text-[11px] text-stone-500 block leading-tight mt-0.5">
                      {STAGE_DESCRIPTIONS[item.stage]}
                    </span>
                    {item.reason && (
                      <span className="text-[10px] text-rose-600 font-semibold block mt-1">
                        ({item.reason})
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Location & Declared Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Facility / Checkpoint Location *
              </label>
              <input
                type="text"
                required
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="e.g. Green Valley Processing Plant, Calicut"
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-stone-900 focus:ring-2 focus:ring-farm-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Declared Event Date *
              </label>
              <input
                type="date"
                required
                max={new Date().toISOString().split("T")[0]}
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-stone-900 focus:ring-2 focus:ring-farm-500"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                Will be recorded alongside the cryptographic blockchain block timestamp.
              </p>
            </div>
          </div>

          {/* Observations & Quality Notes */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Quality Observations, Moisture % or Logistics Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Moisture 11.2%, Screen grade AA verified. Nitrogen-sealed packaging."
              className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-stone-900 focus:ring-2 focus:ring-farm-500"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
            <span className="text-stone-400 text-[11px]">
              Submitting wallet: <strong className="font-mono text-stone-700">{formatAddress(wallet.address) || "None"}</strong>
            </span>
            <button
              type="submit"
              className="px-6 py-3 bg-farm-600 hover:bg-farm-700 text-white font-bold text-sm rounded-xl shadow-md shadow-farm-600/20 transition transform hover:-translate-y-0.5"
            >
              Sign & Append Checkpoint
            </button>
          </div>
        </form>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        txStatus={txStatus}
        onClose={() => setTxStatus({ status: "idle" })}
        title="Recording Supply-Chain Checkpoint"
        onSuccessAction={() => navigate(`/batches/${selectedBatchId}`)}
        successActionLabel="View Updated Batch Timeline"
      />
    </div>
  );
};
