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
          bg: "bg-emerald-950/70 text-emerald-300 border-emerald-800/80 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
          icon: CheckCircle2,
          iconColor: "text-emerald-400",
          explanation:
            "A valid, immutable record with this Batch ID exists in the FarmTrace smart contract on Ethereum Sepolia.",
        };
      case "RECORD_NOT_FOUND":
        return {
          label: labelOverride || "RECORD NOT FOUND",
          bg: "bg-rose-950/70 text-rose-300 border-rose-800/80 shadow-[0_0_12px_rgba(244,63,94,0.15)]",
          icon: AlertCircle,
          iconColor: "text-rose-400",
          explanation:
            "No record with this Batch ID was located on the smart contract. Verify the entered identifier or QR code.",
        };
      case "HISTORY_AVAILABLE":
        return {
          label: labelOverride || "CHRONOLOGICAL HISTORY AVAILABLE",
          bg: "bg-sky-950/70 text-sky-300 border-sky-800/80 shadow-[0_0_12px_rgba(14,165,233,0.15)]",
          icon: Clock,
          iconColor: "text-sky-400",
          explanation:
            "All recorded supply-chain checkpoints have verifiable block timestamps and authorized wallet signatures.",
        };
      case "CORRECTION_RECORDED":
        return {
          label: labelOverride || "TRANSPARENT CORRECTION RECORDED",
          bg: "bg-amber-950/70 text-amber-300 border-amber-800/80 shadow-[0_0_12px_rgba(245,158,11,0.15)]",
          icon: FileEdit,
          iconColor: "text-amber-400",
          explanation:
            "A declared detail was updated by an authorized wallet with an auditable explanation preserved on-chain.",
        };
      case "INCOMPLETE_HISTORY":
        return {
          label: labelOverride || "INCOMPLETE SUPPLY-CHAIN HISTORY",
          bg: "bg-orange-950/70 text-orange-300 border-orange-800/80 shadow-[0_0_12px_rgba(249,115,22,0.15)]",
          icon: HelpCircle,
          iconColor: "text-orange-400",
          explanation:
            "Some downstream supply-chain checkpoints have not yet been recorded by participating units.",
        };
      case "STAGE_CURRENT":
      default:
        return {
          label: labelOverride || "REGISTERED BATCH",
          bg: "bg-[#14201a] text-stone-200 border-[#1f2f25]",
          icon: CheckCircle2,
          iconColor: "text-farm-400",
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
        <span className="mt-1 text-[11px] text-stone-400 leading-tight max-w-sm">
          {config.explanation}
        </span>
      )}
    </div>
  );
};
