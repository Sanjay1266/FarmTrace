import React from "react";
import {
  Sprout,
  Factory,
  CheckCircle,
  PackageCheck,
  Truck,
  Warehouse,
  Store,
  ExternalLink,
  Clock,
  ShieldCheck,
  UserCheck,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Stage, SupplyChainEvent } from "../types";

interface TimelineViewProps {
  events: SupplyChainEvent[];
  currentStage: Stage;
}

const getStageIcon = (stage: Stage) => {
  switch (stage) {
    case Stage.Harvested:
      return Sprout;
    case Stage.ProcessingReceived:
      return Factory;
    case Stage.ProcessingCompleted:
      return CheckCircle;
    case Stage.Packaged:
      return PackageCheck;
    case Stage.Dispatched:
      return Truck;
    case Stage.DistributorReceived:
      return Warehouse;
    case Stage.RetailerReceived:
      return Store;
    default:
      return CheckCircle;
  }
};

const formatDate = (timestampSeconds: number) => {
  if (!timestampSeconds || timestampSeconds <= 0) return "Not specified";
  const date = new Date(timestampSeconds * 1000);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const TimelineView: React.FC<TimelineViewProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="p-8 text-center bg-[#0d1410] rounded-xl border border-[#18251e]">
        <AlertCircle className="w-8 h-8 text-stone-500 mx-auto mb-2" />
        <p className="text-stone-400 text-sm font-medium">No supply-chain events recorded yet for this batch.</p>
      </div>
    );
  }

  // Sorted chronologically by blockTimestamp or index
  const sortedEvents = [...events].sort((a, b) => a.blockTimestamp - b.blockTimestamp);

  return (
    <div className="space-y-6">
      {/* Informative Banner */}
      <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3.5 text-xs text-amber-300 flex items-start space-x-2.5">
        <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-200">Dual Timestamp Verification: </span>
          The timeline distinguishes between the <strong>declared event date</strong> entered by the participant and the <strong>tamper-evident blockchain block timestamp</strong> when the transaction was sealed on Ethereum Sepolia.
        </div>
      </div>

      <div className="relative pl-6 sm:pl-8 border-l-2 border-farm-800/60 space-y-8">
        {sortedEvents.map((event, index) => {
          const Icon = getStageIcon(event.stage);
          const isLatest = index === sortedEvents.length - 1;

          return (
            <div key={`${event.stage}-${index}`} className="relative group">
              {/* Node Marker */}
              <div
                className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-4 border-[#070b09] transition shadow-md ${
                  isLatest
                    ? "bg-farm-500 text-black ring-4 ring-farm-900/60 shadow-[0_0_12px_rgba(34,197,94,0.4)]"
                    : "bg-[#121c17] text-farm-400 border-[#18251e]"
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>

              {/* Event Content Card */}
              <div className="bg-[#0d1410] rounded-xl border border-[#18251e] p-4 sm:p-5 shadow-lg hover:border-farm-700/60 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#18251e]">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-farm-300 bg-farm-950/70 border border-farm-800/60 px-2 py-0.5 rounded">
                      Checkpoint {index + 1}
                    </span>
                    <h4 className="text-base sm:text-lg font-bold text-white mt-1">
                      {event.stageName}
                    </h4>
                  </div>
                  {isLatest && (
                    <span className="self-start sm:self-center px-2.5 py-1 text-xs font-semibold rounded-full bg-farm-950/80 text-farm-300 border border-farm-800/80 shadow-[0_0_8px_rgba(34,197,94,0.2)]">
                      Current Effective Stage
                    </span>
                  )}
                </div>

                {/* Event Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs">
                  {/* Location */}
                  <div>
                    <span className="text-stone-400 font-medium block">Location:</span>
                    <span className="text-stone-200 font-medium">{event.location || "Location not recorded"}</span>
                  </div>

                  {/* Actor Wallet */}
                  <div>
                    <span className="text-stone-400 font-medium block">Submitting Wallet:</span>
                    <div className="flex items-center space-x-1">
                      <UserCheck className="w-3.5 h-3.5 text-farm-400 shrink-0" />
                      <a
                        href={`https://sepolia.etherscan.io/address/${event.actor}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-farm-400 hover:text-farm-300 hover:underline truncate"
                        title={event.actor}
                      >
                        {event.actor ? `${event.actor.slice(0, 8)}...${event.actor.slice(-6)}` : "Unknown"}
                      </a>
                    </div>
                  </div>

                  {/* Declared Date */}
                  <div className="bg-[#121c17] p-2.5 rounded-lg border border-[#18251e]">
                    <div className="flex items-center space-x-1 text-stone-400 font-medium mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Declared Event Date (Participant)</span>
                    </div>
                    <p className="font-semibold text-white">{formatDate(event.eventTimestamp)}</p>
                    <p className="text-[10px] text-stone-500 italic mt-0.5">Self-reported by actor at time of action</p>
                  </div>

                  {/* Blockchain Block Timestamp */}
                  <div className="bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-900/60">
                    <div className="flex items-center space-x-1 text-emerald-300 font-medium mb-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Blockchain Block Timestamp (Immutable)</span>
                    </div>
                    <p className="font-semibold text-white">{formatDate(event.blockTimestamp)}</p>
                    <p className="text-[10px] text-emerald-400/80 italic mt-0.5">Cryptographically sealed in Ethereum block</p>
                  </div>
                </div>

                {/* Notes */}
                {event.notes && (
                  <div className="mt-3 pt-3 border-t border-[#18251e] text-xs">
                    <span className="text-stone-400 font-medium block mb-1">Checkpoint Observations / Quality Notes:</span>
                    <p className="text-stone-300 bg-[#121c17] border border-[#18251e] p-2.5 rounded-lg italic">
                      "{event.notes}"
                    </p>
                  </div>
                )}

                {/* Etherscan Tx Hash Link */}
                {event.txHash && (
                  <div className="mt-3 pt-2 text-[11px] flex items-center justify-between text-stone-400">
                    <span className="font-mono truncate mr-2">Tx: {event.txHash}</span>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${event.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-farm-400 hover:text-farm-300 font-medium shrink-0"
                    >
                      <span>Sepolia Etherscan</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
