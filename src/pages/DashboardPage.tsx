import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Users,
  Package,
  Layers,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { fetchAllBatches, fetchContractCounts } from "../services/web3Service";
import { Batch } from "../types";
import { STAGE_LABELS } from "../types";

export const DashboardPage: React.FC = () => {
  const { wallet, connectWallet, switchToSepolia, contractAddress, isContractReady } = useWeb3();
  const [counts, setCounts] = useState({ totalFarmers: 0, totalBatches: 0, totalEvents: 0, isLiveBlockchain: false });
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [countsRes, batchesRes] = await Promise.all([
        fetchContractCounts(),
        fetchAllBatches(),
      ]);
      setCounts(countsRes);
      setBatches(batchesRes.batches);
    } catch (err) {
      console.warn("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [isContractReady]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#18251e] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-6 h-6 text-farm-400" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Organization Dashboard</h1>
          </div>
          <p className="text-sm text-stone-400 mt-1">
            Real-time on-chain statistics, farmer registrations, and product batches on Ethereum Sepolia.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-[#18251e] bg-[#0d1410] hover:bg-[#14201a] text-stone-200 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-farm-400" : ""}`} />
            <span>Refresh Chain Data</span>
          </button>

          <Link
            to="/register-batch"
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-farm-600 hover:bg-farm-500 text-white shadow-lg shadow-farm-600/30 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Batch</span>
          </Link>
        </div>
      </div>

      {/* Network & Wallet Warning Callout */}
      {!wallet.isConnected ? (
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-200">MetaMask Wallet Not Connected</h4>
              <p className="text-xs text-amber-300 mt-0.5">
                Connect your organization's authorized wallet to register new farmers, register batches, and record supply-chain checkpoints. Public visitors can still verify batches without connecting.
              </p>
            </div>
          </div>
          <button
            onClick={connectWallet}
            className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 shadow-lg shadow-amber-600/30 transition"
          >
            <Wallet className="w-4 h-4" />
            <span>Connect MetaMask</span>
          </button>
        </div>
      ) : !wallet.isSepolia ? (
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-rose-200">Wrong Network Detected</h4>
              <p className="text-xs text-rose-300 mt-0.5">
                Your MetaMask wallet is connected to an unsupported network (Chain ID: {wallet.chainId}). Please switch to Ethereum Sepolia Testnet (11155111).
              </p>
            </div>
          </div>
          <button
            onClick={switchToSepolia}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 shadow-lg shadow-rose-600/30 transition"
          >
            Switch to Sepolia
          </button>
        </div>
      ) : null}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#0d1410] p-6 rounded-2xl border border-[#18251e] shadow-lg space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Registered Farmers</span>
            <Users className="w-5 h-5 text-farm-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {counts.totalFarmers}
          </div>
          <p className="text-[11px] text-stone-500">Authorized agricultural producers</p>
        </div>

        <div className="bg-[#0d1410] p-6 rounded-2xl border border-[#18251e] shadow-lg space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Tracked Batches</span>
            <Package className="w-5 h-5 text-farm-400" />
          </div>
          <div className="text-3xl font-extrabold text-farm-400 font-mono">
            {counts.totalBatches}
          </div>
          <p className="text-[11px] text-stone-500">Total minted product batches</p>
        </div>

        <div className="bg-[#0d1410] p-6 rounded-2xl border border-[#18251e] shadow-lg space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Recorded Checkpoints</span>
            <Layers className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">
            {counts.totalEvents}
          </div>
          <p className="text-[11px] text-stone-500">Supply-chain milestone events</p>
        </div>

        <div className="bg-[#0d1410] p-6 rounded-2xl border border-[#18251e] shadow-lg space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Contract Status</span>
            <ShieldCheck className="w-5 h-5 text-sky-400" />
          </div>
          <div className="text-xs font-bold text-white truncate font-mono">
            {contractAddress ? `${contractAddress.slice(0, 10)}...${contractAddress.slice(-6)}` : "Not Deployed"}
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Sepolia Active</span>
          </div>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-[#0d1410] rounded-2xl border border-[#18251e] shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#18251e] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Registered Product Batches</h3>
            <p className="text-xs text-stone-400">Live batches recorded directly in the smart contract.</p>
          </div>
          <Link
            to="/register-batch"
            className="text-xs font-bold text-farm-400 hover:text-farm-300"
          >
            + Register Batch
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-stone-400">Loading blockchain records...</div>
        ) : batches.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400">No batches registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-[#121c17] uppercase text-[10px] text-stone-400 font-bold border-b border-[#18251e]">
                <tr>
                  <th className="px-6 py-3">Batch ID</th>
                  <th className="px-6 py-3">Product Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Farmer ID</th>
                  <th className="px-6 py-3">Current Stage</th>
                  <th className="px-6 py-3">Harvest Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#18251e]">
                {batches.map((batch) => (
                  <tr key={batch.batchId} className="hover:bg-[#14201a] transition">
                    <td className="px-6 py-3.5 font-mono font-bold text-white">
                      {batch.batchId}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-stone-200">
                      {batch.productName}
                    </td>
                    <td className="px-6 py-3.5 text-stone-400">{batch.category}</td>
                    <td className="px-6 py-3.5 font-mono text-farm-400">{batch.farmerId}</td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-farm-950/80 text-farm-300 border border-farm-800/80">
                        {STAGE_LABELS[batch.currentStage] || "Harvested"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-stone-400">
                      {batch.harvestDate ? new Date(batch.harvestDate * 1000).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-2">
                      <Link
                        to={`/verify/${batch.batchId}`}
                        className="text-farm-400 hover:text-farm-300 font-bold"
                        title="Consumer verification page"
                      >
                        Verify
                      </Link>
                      <span className="text-stone-700">|</span>
                      <Link
                        to={`/batches/${batch.batchId}`}
                        className="text-stone-400 hover:text-white font-medium"
                      >
                        Details
                      </Link>
                      <span className="text-stone-700">|</span>
                      <Link
                        to={`/supply-chain?batchId=${batch.batchId}`}
                        className="text-emerald-400 hover:text-emerald-300 font-medium"
                      >
                        + Event
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Organization Shortcuts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0d1410] p-6 rounded-2xl border border-[#18251e] shadow-lg space-y-3 hover:border-farm-700/60 transition">
          <div className="w-10 h-10 rounded-xl bg-farm-950/80 border border-farm-800/80 text-farm-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-white text-base">Farmer Management</h4>
          <p className="text-xs text-stone-400 leading-relaxed">
            Register new smallholders, view cooperative affiliations, and link product batches to farmer profiles.
          </p>
          <Link
            to="/farmers"
            className="inline-flex items-center space-x-1 text-xs font-bold text-farm-400 hover:text-farm-300 pt-2"
          >
            <span>Manage Farmers</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-[#0d1410] p-6 rounded-2xl border border-[#18251e] shadow-lg space-y-3 hover:border-farm-700/60 transition">
          <div className="w-10 h-10 rounded-xl bg-farm-950/80 border border-farm-800/80 text-farm-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-white text-base">Supply-Chain Checkpoints</h4>
          <p className="text-xs text-stone-400 leading-relaxed">
            Record processing milestones, packaging seal updates, transit dispatch, and retail receipt.
          </p>
          <Link
            to="/supply-chain"
            className="inline-flex items-center space-x-1 text-xs font-bold text-farm-400 hover:text-farm-300 pt-2"
          >
            <span>Record Stage Event</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-[#0d1410] p-6 rounded-2xl border border-[#18251e] shadow-lg space-y-3 hover:border-farm-700/60 transition">
          <div className="w-10 h-10 rounded-xl bg-farm-950/80 border border-farm-800/80 text-farm-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-white text-base">Participant Access Control</h4>
          <p className="text-xs text-stone-400 leading-relaxed">
            Grant granular stage permissions to mills, logistics carriers, and retailers based on wallet addresses.
          </p>
          <Link
            to="/access"
            className="inline-flex items-center space-x-1 text-xs font-bold text-farm-400 hover:text-farm-300 pt-2"
          >
            <span>Manage Permissions</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
