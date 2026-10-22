import React, { useState } from "react";
import {
  ShieldCheck,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import {
  authorizeParticipantOnChain,
  parseContractError,
  revokeParticipantStagesOnChain,
} from "../services/web3Service";
import { Stage, TxStatus } from "../types";
import { STAGE_LABELS } from "../types";
import { TransactionModal } from "../components/TransactionModal";

export const ParticipantAccessPage: React.FC = () => {
  const { wallet, formatAddress, switchToSepolia } = useWeb3();

  // Authorize form state
  const [participantAddress, setParticipantAddress] = useState("");
  const [roleName, setRoleName] = useState("");
  const [selectedStages, setSelectedStages] = useState<Stage[]>([
    Stage.ProcessingReceived,
    Stage.ProcessingCompleted,
  ]);

  // Revoke state
  const [revokeAddress, setRevokeAddress] = useState("");
  const [revokeStages, setRevokeStages] = useState<Stage[]>([Stage.ProcessingReceived]);

  const [txStatus, setTxStatus] = useState<TxStatus>({ status: "idle" });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pre-configured participant profiles
  const sampleParticipants = [
    {
      role: "Processing Unit - Green Valley Agro Mill",
      address: "0x976EA74026E72CD55542b2494463005612CA4471",
      stages: [Stage.ProcessingReceived, Stage.ProcessingCompleted],
      status: "Authorized",
    },
    {
      role: "Logistics Fleet - AgriFreight South",
      address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
      stages: [Stage.Dispatched, Stage.DistributorReceived],
      status: "Authorized",
    },
    {
      role: "Retail Partner - Organic Fresh Market",
      address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
      stages: [Stage.RetailerReceived],
      status: "Authorized",
    },
  ];

  const handleStageToggle = (stage: Stage) => {
    if (selectedStages.includes(stage)) {
      setSelectedStages(selectedStages.filter((s) => s !== stage));
    } else {
      setSelectedStages([...selectedStages, stage]);
    }
  };

  const handleRevokeStageToggle = (stage: Stage) => {
    if (revokeStages.includes(stage)) {
      setRevokeStages(revokeStages.filter((s) => s !== stage));
    } else {
      setRevokeStages([...revokeStages, stage]);
    }
  };

  const handleAuthorizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!wallet.isConnected) {
      setErrorMsg("Please connect your MetaMask wallet.");
      return;
    }
    if (!wallet.isSepolia) {
      await switchToSepolia();
      return;
    }
    if (!participantAddress.trim() || !roleName.trim() || selectedStages.length === 0) {
      setErrorMsg("Please provide an address, role title, and select at least one stage.");
      return;
    }

    setTxStatus({ status: "awaiting_wallet" });
    try {
      const res = await authorizeParticipantOnChain(
        participantAddress.trim(),
        selectedStages,
        roleName.trim()
      );
      setTxStatus({
        status: "confirmed",
        hash: res.hash,
        message: `Participant "${roleName}" authorized on Ethereum Sepolia for ${selectedStages.length} stage(s)!`,
      });
      setParticipantAddress("");
      setRoleName("");
    } catch (err: any) {
      console.error("Authorization failed:", err);
      setTxStatus({
        status: "failed",
        errorMessage: parseContractError(err),
      });
    }
  };

  const handleRevokeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!wallet.isConnected) {
      setErrorMsg("Please connect your MetaMask wallet.");
      return;
    }
    if (!revokeAddress.trim() || revokeStages.length === 0) {
      setErrorMsg("Please provide an address and select stages to revoke.");
      return;
    }

    setTxStatus({ status: "awaiting_wallet" });
    try {
      const res = await revokeParticipantStagesOnChain(revokeAddress.trim(), revokeStages);
      setTxStatus({
        status: "confirmed",
        hash: res.hash,
        message: `Revoked ${revokeStages.length} stage permission(s) for wallet on Ethereum Sepolia.`,
      });
      setRevokeAddress("");
    } catch (err: any) {
      console.error("Revocation failed:", err);
      setTxStatus({
        status: "failed",
        errorMessage: parseContractError(err),
      });
    }
  };

  const allStages = [
    Stage.ProcessingReceived,
    Stage.ProcessingCompleted,
    Stage.Packaged,
    Stage.Dispatched,
    Stage.DistributorReceived,
    Stage.RetailerReceived,
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-[#18251e]">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-6 h-6 text-farm-400" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Supply-Chain Role-Based Access Control
          </h1>
        </div>
        <p className="text-sm text-stone-400 mt-1">
          Smart contract permissions ensure that mills, packagers, logistics fleets, and retailers can only update checkpoints within their assigned scope.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl text-xs text-rose-300 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Authorized Participants Overview Table */}
      <div className="bg-[#0d1410] rounded-2xl border border-[#18251e] shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#18251e] flex items-center justify-between">
          <h3 className="font-bold text-white text-base">Configured Supply-Chain Participants</h3>
          <span className="text-xs text-stone-400 font-mono">On-Chain Whitelist</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-[#121c17] uppercase text-[10px] text-stone-400 font-bold border-b border-[#18251e]">
              <tr>
                <th className="px-6 py-3">Participant Role & Entity</th>
                <th className="px-6 py-3">Ethereum Address</th>
                <th className="px-6 py-3">Authorized Stages</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#18251e]">
              {sampleParticipants.map((p, i) => (
                <tr key={i} className="hover:bg-[#14201a] transition">
                  <td className="px-6 py-3.5 font-bold text-white">{p.role}</td>
                  <td className="px-6 py-3.5 font-mono text-farm-400">
                    <a
                      href={`https://sepolia.etherscan.io/address/${p.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-farm-300 hover:underline flex items-center space-x-1"
                    >
                      <span>{formatAddress(p.address)}</span>
                      <ExternalLink className="w-3 h-3 text-stone-400" />
                    </a>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {p.stages.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#121c17] text-stone-300 border border-[#18251e]"
                        >
                          {STAGE_LABELS[s]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <span className="inline-flex items-center space-x-1 text-emerald-400 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{p.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forms: Authorize & Revoke */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Authorize Form */}
        <div className="bg-[#0d1410] rounded-2xl border border-[#18251e] p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-[#18251e]">
            <UserCheck className="w-5 h-5 text-farm-400" />
            <h3 className="font-bold text-white text-base">Authorize New Participant</h3>
          </div>

          <form onSubmit={handleAuthorizeSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-300 mb-1">
                Participant Entity / Role Title *
              </label>
              <input
                type="text"
                required
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. Processing Mill #2 or Calicut Transport Hub"
                className="w-full px-3 py-2 bg-[#0a100d] border border-[#1f2f25] rounded-xl text-white placeholder-stone-500 focus:border-farm-500 focus:ring-1 focus:ring-farm-500 transition"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-300 mb-1">
                Participant Ethereum Wallet Address *
              </label>
              <input
                type="text"
                required
                value={participantAddress}
                onChange={(e) => setParticipantAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 bg-[#0a100d] border border-[#1f2f25] rounded-xl font-mono text-white placeholder-stone-500 focus:border-farm-500 focus:ring-1 focus:ring-farm-500 transition"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-300 mb-1.5">
                Allowed Supply-Chain Stages *
              </label>
              <div className="space-y-1.5">
                {allStages.map((stage) => (
                  <label
                    key={stage}
                    className="flex items-center space-x-2 text-stone-300 hover:text-white cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStages.includes(stage)}
                      onChange={() => handleStageToggle(stage)}
                      className="rounded bg-[#0a100d] border-[#1f2f25] text-farm-500 focus:ring-farm-500"
                    />
                    <span>{STAGE_LABELS[stage]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-farm-600 hover:bg-farm-500 text-white font-bold rounded-xl shadow-lg shadow-farm-950/40 transition"
              >
                Sign & Authorize on Sepolia
              </button>
            </div>
          </form>
        </div>

        {/* Revoke Form */}
        <div className="bg-[#0d1410] rounded-2xl border border-[#18251e] p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-[#18251e]">
            <UserX className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-white text-base">Revoke Participant Stages</h3>
          </div>

          <form onSubmit={handleRevokeSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-300 mb-1">
                Participant Wallet Address to Revoke *
              </label>
              <input
                type="text"
                required
                value={revokeAddress}
                onChange={(e) => setRevokeAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 bg-[#0a100d] border border-[#1f2f25] rounded-xl font-mono text-white placeholder-stone-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-300 mb-1.5">
                Stages to Revoke *
              </label>
              <div className="space-y-1.5">
                {allStages.map((stage) => (
                  <label
                    key={stage}
                    className="flex items-center space-x-2 text-stone-300 hover:text-white cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={revokeStages.includes(stage)}
                      onChange={() => handleRevokeStageToggle(stage)}
                      className="rounded bg-[#0a100d] border-[#1f2f25] text-rose-500 focus:ring-rose-500"
                    />
                    <span>{STAGE_LABELS[stage]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-950/40 transition"
              >
                Sign & Revoke on Sepolia
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        txStatus={txStatus}
        onClose={() => setTxStatus({ status: "idle" })}
        title="Access Control Transaction"
      />
    </div>
  );
};
