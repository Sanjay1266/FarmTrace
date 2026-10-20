import React, { useState } from "react";
import { X, FileEdit, ShieldAlert } from "lucide-react";
import { Batch } from "../types";
import { parseContractError, recordCorrectionOnChain } from "../services/web3Service";
import { TransactionModal } from "./TransactionModal";
import { TxStatus } from "../types";

interface CorrectionModalProps {
  batch: Batch;
  isOpen: boolean;
  onClose: () => void;
  onCorrectionSuccess: () => void;
}

export const CorrectionModal: React.FC<CorrectionModalProps> = ({
  batch,
  isOpen,
  onClose,
  onCorrectionSuccess,
}) => {
  const [selectedField, setSelectedField] = useState<"productName" | "category" | "originLocation" | "organizationName">("productName");
  const [newValue, setNewValue] = useState("");
  const [reason, setReason] = useState("");
  const [txStatus, setTxStatus] = useState<TxStatus>({ status: "idle" });

  if (!isOpen) return null;

  const getCurrentValue = () => {
    switch (selectedField) {
      case "productName":
        return batch.productName;
      case "category":
        return batch.category;
      case "originLocation":
        return batch.originLocation;
      case "organizationName":
        return batch.organizationName;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim() || !reason.trim()) return;

    setTxStatus({ status: "awaiting_wallet" });
    try {
      const result = await recordCorrectionOnChain(
        batch.batchId,
        selectedField,
        newValue.trim(),
        reason.trim()
      );
      setTxStatus({
        status: "confirmed",
        hash: result.hash,
        message: `Correction recorded for ${selectedField}. Audit trail preserved on Ethereum Sepolia.`,
      });
      onCorrectionSuccess();
    } catch (err: any) {
      console.error("Correction failed:", err);
      setTxStatus({
        status: "failed",
        errorMessage: parseContractError(err),
      });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
            <div className="flex items-center space-x-2">
              <FileEdit className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-stone-900">Record Transparent Correction</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {/* Integrity Warning */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start space-x-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-950 block">Immutable Historical Audit Trail</span>
                FarmTrace never erases original data. This amendment will append a superseding audit entry recording your explanation, wallet address, and block timestamp, visible to all public consumers.
              </div>
            </div>

            {/* Target Field */}
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Field to Amend</label>
              <select
                value={selectedField}
                onChange={(e) => {
                  setSelectedField(e.target.value as any);
                  setNewValue("");
                }}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white text-stone-800 focus:ring-2 focus:ring-farm-500"
              >
                <option value="productName">Product Name</option>
                <option value="category">Category</option>
                <option value="originLocation">Origin Location</option>
                <option value="organizationName">Producer Organization Name</option>
              </select>
            </div>

            {/* Current Value Preview */}
            <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-stone-400 block mb-0.5 font-medium">Current Registered Value:</span>
              <span className="font-semibold text-stone-800">{getCurrentValue()}</span>
            </div>

            {/* New Value */}
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Corrected Value *</label>
              <input
                type="text"
                required
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Enter exact corrected information"
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-stone-800 focus:ring-2 focus:ring-farm-500"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Correction Reason (Mandatory) *</label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this correction is necessary (e.g. Lab analysis updated grading score, spelling error in village name)"
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-stone-800 focus:ring-2 focus:ring-farm-500"
              />
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newValue.trim() || !reason.trim()}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-xs transition disabled:opacity-50"
              >
                Sign & Submit Correction
              </button>
            </div>
          </form>
        </div>
      </div>

      <TransactionModal
        txStatus={txStatus}
        onClose={() => {
          setTxStatus({ status: "idle" });
          if (txStatus.status === "confirmed") {
            onClose();
          }
        }}
        title="Submitting Correction"
      />
    </>
  );
};
