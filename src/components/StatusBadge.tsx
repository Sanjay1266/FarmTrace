import React from "react";
import { CheckCircle2, AlertCircle, Clock, FileEdit, HelpCircle } from "lucide-react";

export type StatusType =
  | "RECORD_FOUND"
  | "RECORD_NOT_FOUND"
  | "HISTORY_AVAILABLE"
  | "CORRECTION_RECORDED"
  | "INCOMPLETE_HISTORY"
  | "STAGE_CURRENT";

interface StatusBadgeProps {
  status: StatusType;
  labelOverride?: string;
  className?: string;
  showExplanation?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  labelOverride,
  className = "",
  showExplanation = false,
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case "RECORD_FOUND":
        return {
          label: labelOverride || "RECORD FOUND ON BLOCKCHAIN",
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          icon: CheckCircle2,
          iconColor: "text-emerald-600",
          explanation:
            "A valid, immutable record with this Batch ID exists in the FarmTrace smart contract on Ethereum Sepolia.",
        };
      case "RECORD_NOT_FOUND":
        return {
          label: labelOverride || "RECORD NOT FOUND",
          bg: "bg-rose-50 text-rose-800 border-rose-200",
          icon: AlertCircle,
          iconColor: "text-rose-600",
          explanation:
            "No record with this Batch ID was located on the smart contract. Verify the entered identifier or QR code.",
        };
      case "HISTORY_AVAILABLE":
        return {
          label: labelOverride || "CHRONOLOGICAL HISTORY AVAILABLE",
          bg: "bg-blue-50 text-blue-800 border-blue-200",
          icon: Clock,
          iconColor: "text-blue-600",
          explanation:
            "All recorded supply-chain checkpoints have verifiable block timestamps and authorized wallet signatures.",
        };
      case "CORRECTION_RECORDED":
        return {
          label: labelOverride || "TRANSPARENT CORRECTION RECORDED",
          bg: "bg-amber-50 text-amber-800 border-amber-300",
          icon: FileEdit,
          iconColor: "text-amber-600",
          explanation:
            "A declared detail was updated by an authorized wallet with an auditable explanation preserved on-chain.",
        };
      case "INCOMPLETE_HISTORY":
        return {
          label: labelOverride || "INCOMPLETE SUPPLY-CHAIN HISTORY",
          bg: "bg-orange-50 text-orange-800 border-orange-200",
          icon: HelpCircle,
          iconColor: "text-orange-600",
          explanation:
            "Some downstream supply-chain checkpoints have not yet been recorded by participating units.",
        };
      case "STAGE_CURRENT":
      default:
        return {
          label: labelOverride || "REGISTERED BATCH",
          bg: "bg-stone-100 text-stone-800 border-stone-200",
          icon: CheckCircle2,
          iconColor: "text-stone-600",
          explanation: "Batch is actively tracked.",
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <span
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-md border ${config.bg}`}
      >
        <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
        <span>{config.label}</span>
      </span>
      {showExplanation && (
        <span className="mt-1 text-[11px] text-stone-500 leading-tight max-w-sm">
          {config.explanation}
        </span>
      )}
    </div>
  );
};
