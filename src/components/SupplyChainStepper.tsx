import React from "react";
import {
  Sprout,
  Factory,
  CheckCircle2,
  PackageCheck,
  Truck,
  Warehouse,
  Store,
  Clock,
  MapPin,
  Check,
} from "lucide-react";
import { Stage, SupplyChainEvent } from "../types";

interface SupplyChainStepperProps {
  currentStage: Stage;
  events: SupplyChainEvent[];
}

interface StageStepConfig {
  stage: Stage;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STAGE_STEPS: StageStepConfig[] = [
  {
    stage: Stage.Harvested,
    title: "1. Harvest Recorded",
    subtitle: "Farm Origin",
    description: "Produce harvested at origin farm and minted by verified grower",
    icon: Sprout,
  },
  {
    stage: Stage.ProcessingReceived,
    title: "2. Processing Inward",
    subtitle: "Milling & Sorting",
    description: "Consignment received at processing mill or cleaning facility",
    icon: Factory,
  },
  {
    stage: Stage.ProcessingCompleted,
    title: "3. Quality Clearance",
    subtitle: "Processing Complete",
    description: "Quality grading, moisture checks, and processing finalized",
    icon: CheckCircle2,
  },
  {
    stage: Stage.Packaged,
    title: "4. Packaged & Labeled",
    subtitle: "Tamper Sealed",
    description: "Packed into hermetic units and affixed with unique batch QR",
    icon: PackageCheck,
  },
  {
    stage: Stage.Dispatched,
    title: "5. Dispatched in Transit",
    subtitle: "Logistics Carrier",
    description: "Released to freight network with transit temperature monitoring",
    icon: Truck,
  },
  {
    stage: Stage.DistributorReceived,
    title: "6. Regional Hub",
    subtitle: "Distributor Inward",
    description: "Verified inward receipt at regional distribution warehouse",
    icon: Warehouse,
  },
  {
    stage: Stage.RetailerReceived,
    title: "7. Consumer Ready",
    subtitle: "Retail Point of Sale",
    description: "Shelved at retail destination, ready for consumer verification",
    icon: Store,
  },
];

export const SupplyChainStepper: React.FC<SupplyChainStepperProps> = ({
  currentStage,
  events,
}) => {
  const currentStageIndex = Number(currentStage);
  const totalStages = STAGE_STEPS.length;
  const progressPercent = Math.min(
    100,
    Math.round(((currentStageIndex + 1) / totalStages) * 100)
  );

  return (
    <div className="bg-[#0d1410] rounded-2xl border border-[#18251e] p-6 sm:p-7 shadow-xl space-y-6">
      {/* Stepper Header with Overall Completion Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#18251e]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-farm-400 bg-farm-950/70 border border-farm-800/60 px-2 py-0.5 rounded">
              Lifecycle Stage Progress
            </span>
            <span className="text-xs text-stone-400 font-mono">
              Stage {currentStageIndex + 1} of {totalStages}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">
            Full Supply-Chain Verification Status
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Tamper-evident progression tracked from farm harvest to consumer point of sale.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-center">
          <div className="text-right">
            <div className="text-sm font-extrabold font-mono text-emerald-400">
              {progressPercent}% Complete
            </div>
            <div className="text-[10px] text-stone-400">
              {currentStageIndex === totalStages - 1
                ? "Full Provenance Cleared"
                : `${totalStages - (currentStageIndex + 1)} Stages Remaining`}
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#121c17] border border-[#18251e] flex items-center justify-center relative">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[#1a2920]"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500 transition-all duration-1000 ease-out"
                strokeDasharray={`${progressPercent}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[11px] font-bold text-emerald-300 font-mono">
              {currentStageIndex + 1}/{totalStages}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Stepper Horizontal (Desktop) / Vertical (Mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-3 sm:gap-2">
        {STAGE_STEPS.map((step, idx) => {
          const stepStageNum = Number(step.stage);
          const isCompleted = stepStageNum < currentStageIndex;
          const isCurrent = stepStageNum === currentStageIndex;
          const isPending = stepStageNum > currentStageIndex;

          const event = events.find((e) => Number(e.stage) === stepStageNum);
          const Icon = step.icon;

          return (
            <div
              key={step.stage}
              className={`relative flex flex-col justify-between p-3.5 rounded-xl border transition-all ${
                isCurrent
                  ? "bg-farm-950/50 border-farm-500/80 ring-2 ring-farm-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                  : isCompleted
                  ? "bg-[#101813] border-emerald-900/50 text-stone-200"
                  : "bg-[#0a0f0c] border-[#18251e]/80 opacity-60 text-stone-500"
              }`}
            >
              <div>
                {/* Step Icon & Status Tag */}
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition ${
                      isCurrent
                        ? "bg-farm-500 text-black shadow-md shadow-farm-500/40"
                        : isCompleted
                        ? "bg-emerald-900/60 text-emerald-300 border border-emerald-700/60"
                        : "bg-[#14201a] text-stone-500 border border-[#18251e]"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>

                  {isCurrent ? (
                    <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-farm-500 text-black animate-pulse">
                      <span>CURRENT</span>
                    </span>
                  ) : isCompleted ? (
                    <span className="text-[10px] font-semibold text-emerald-400 font-mono">
                      Done ✓
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-500 font-mono">
                      Pending
                    </span>
                  )}
                </div>

                {/* Step Title & Subtitle */}
                <h4 className={`text-xs font-bold leading-snug ${isCurrent ? "text-farm-200" : isCompleted ? "text-stone-200" : "text-stone-500"}`}>
                  {step.title}
                </h4>
                <p className="text-[11px] font-medium text-stone-400">
                  {step.subtitle}
                </p>
                <p className="text-[10px] text-stone-400/80 mt-1 line-clamp-2 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Event Metadata (if recorded) */}
              <div className="mt-3 pt-2 border-t border-[#18251e] text-[10px] space-y-1">
                {event ? (
                  <>
                    <div className="flex items-center space-x-1 text-stone-300 truncate" title={event.location}>
                      <MapPin className="w-3 h-3 text-farm-400 shrink-0" />
                      <span className="truncate">{event.location.split(",")[0]}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-stone-400">
                      <Clock className="w-3 h-3 text-stone-500 shrink-0" />
                      <span>
                        {event.eventTimestamp
                          ? new Date(event.eventTimestamp * 1000).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })
                          : "-"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-[10px] text-stone-600 italic py-1">
                    {isPending ? "Awaiting onward custody" : "Record sealed"}
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
