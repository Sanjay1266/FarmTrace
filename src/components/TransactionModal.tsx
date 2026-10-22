import React from "react";
import { CheckCircle2, XCircle, Loader2, ExternalLink, X } from "lucide-react";
import { TxStatus } from "../types";

interface TransactionModalProps {
  txStatus: TxStatus;
  onClose: () => void;
  title?: string;
  onSuccessAction?: () => void;
  successActionLabel?: string;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  txStatus,
  onClose,
  title = "Blockchain Transaction",
  onSuccessAction,
  successActionLabel = "View Batch Details",
}) => {
  if (txStatus.status === "idle") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0d1410] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-[#18251e]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#18251e]">
          <h3 className="font-bold text-white text-base">{title}</h3>
          {(txStatus.status === "confirmed" || txStatus.status === "failed") && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-[#14201a] transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6 text-center">
          {/* Awaiting Wallet Confirmation */}
          {txStatus.status === "awaiting_wallet" && (
            <div className="space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-amber-950/70 border border-amber-800/80 text-amber-400 mx-auto flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Confirm in MetaMask</h4>
                <p className="text-sm text-stone-300 mt-1 max-w-xs mx-auto">
                  Please review and approve the transaction in your MetaMask wallet extension.
                </p>
              </div>
            </div>
          )}

          {/* Transaction Pending / Mining */}
          {txStatus.status === "pending" && (
            <div className="space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-farm-950/70 border border-farm-800/80 text-farm-400 mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Sealing on Ethereum Sepolia</h4>
                <p className="text-sm text-stone-300 mt-1 max-w-xs mx-auto">
                  Transaction submitted to testnet. Waiting for block inclusion and cryptographic confirmation...
                </p>
                {txStatus.hash && (
                  <div className="mt-3">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${txStatus.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 text-xs text-farm-300 font-mono bg-farm-950/80 px-3 py-1.5 rounded-lg border border-farm-800/80 hover:bg-farm-900/80 hover:text-white transition"
                    >
                      <span className="truncate max-w-[200px]">{txStatus.hash}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Confirmed */}
          {txStatus.status === "confirmed" && (
            <div className="space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-950/70 border border-emerald-800/80 text-emerald-400 mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Confirmed on Blockchain</h4>
                <p className="text-sm text-stone-300 mt-1 max-w-xs mx-auto">
                  {txStatus.message || "Your record has been immutably written to the Ethereum Sepolia smart contract."}
                </p>
                {txStatus.hash && (
                  <div className="mt-3">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${txStatus.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 text-xs text-emerald-300 font-mono bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-800/80 hover:bg-emerald-900/80 hover:text-white transition"
                    >
                      <span>View on Sepolia Etherscan</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                {onSuccessAction && (
                  <button
                    onClick={() => {
                      onClose();
                      onSuccessAction();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-farm-600 hover:bg-farm-500 text-white font-semibold text-sm shadow-lg shadow-farm-600/30 transition"
                  >
                    {successActionLabel}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#18251e] bg-[#121c17] hover:bg-[#1a2820] font-semibold text-sm text-stone-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Failed */}
          {txStatus.status === "failed" && (
            <div className="space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-rose-950/70 border border-rose-800/80 text-rose-400 mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                <XCircle className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Transaction Failed</h4>
                <div className="mt-2 p-3 bg-rose-950/40 rounded-xl text-left border border-rose-800/60">
                  <p className="text-xs text-rose-300 font-medium">
                    {txStatus.errorMessage || "An unexpected error occurred during execution."}
                  </p>
                </div>
              </div>
              <div className="pt-2 flex justify-center">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-[#18251e] hover:bg-[#22352b] text-white font-semibold text-sm transition"
                >
                  Dismiss & Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
