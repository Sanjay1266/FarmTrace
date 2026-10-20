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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h3 className="font-bold text-stone-900 text-base">{title}</h3>
          {(txStatus.status === "confirmed" || txStatus.status === "failed") && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6 text-center">
          {/* Awaiting Wallet Confirmation */}
          {txStatus.status === "awaiting_wallet" && (
            <div className="space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-stone-900">Confirm in MetaMask</h4>
                <p className="text-sm text-stone-600 mt-1 max-w-xs mx-auto">
                  Please review and approve the transaction in your MetaMask wallet extension.
                </p>
              </div>
            </div>
          )}

          {/* Transaction Pending / Mining */}
          {txStatus.status === "pending" && (
            <div className="space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-farm-50 text-farm-600 mx-auto flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-stone-900">Sealing on Ethereum Sepolia</h4>
                <p className="text-sm text-stone-600 mt-1 max-w-xs mx-auto">
                  Transaction submitted to testnet. Waiting for block inclusion and cryptographic confirmation...
                </p>
                {txStatus.hash && (
                  <div className="mt-3">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${txStatus.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 text-xs text-farm-700 font-mono bg-farm-50 px-3 py-1.5 rounded-lg border border-farm-200 hover:bg-farm-100 transition"
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
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-stone-900">Confirmed on Blockchain</h4>
                <p className="text-sm text-stone-600 mt-1 max-w-xs mx-auto">
                  {txStatus.message || "Your record has been immutably written to the Ethereum Sepolia smart contract."}
                </p>
                {txStatus.hash && (
                  <div className="mt-3">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${txStatus.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 text-xs text-emerald-700 font-mono bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition"
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
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-farm-600 hover:bg-farm-700 text-white font-semibold text-sm shadow-xs transition"
                  >
                    {successActionLabel}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 font-semibold text-sm text-stone-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Failed */}
          {txStatus.status === "failed" && (
            <div className="space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
                <XCircle className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-stone-900">Transaction Failed</h4>
                <div className="mt-2 p-3 bg-rose-50 rounded-xl text-left border border-rose-200">
                  <p className="text-xs text-rose-900 font-medium">
                    {txStatus.errorMessage || "An unexpected error occurred during execution."}
                  </p>
                </div>
              </div>
              <div className="pt-2 flex justify-center">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm transition"
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
