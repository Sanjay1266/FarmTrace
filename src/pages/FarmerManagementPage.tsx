import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Users,
  UserPlus,
  Search,
  MapPin,
  Building2,
  Calendar,
  Wallet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  PlusCircle,
  RefreshCw,
  Package,
  Eye,
  X,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import {
  fetchAllBatches,
  fetchAllFarmers,
  fetchBatchesForFarmer,
  parseContractError,
  registerFarmerOnChain,
  saveLocalFarmer,
} from "../services/web3Service";
import { Batch, Farmer, Stage, STAGE_LABELS, TxStatus } from "../types";
import { TransactionModal } from "../components/TransactionModal";

export const FarmerManagementPage: React.FC = () => {
  const { wallet, switchToSepolia, formatAddress } = useWeb3();
  const [searchParams, setSearchParams] = useSearchParams();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  // Selected Farmer & Undertaken Batches state
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [farmerBatches, setFarmerBatches] = useState<Batch[]>([]);
  const [loadingFarmerBatches, setLoadingFarmerBatches] = useState(false);

  // Form State
  const [farmerId, setFarmerId] = useState("");
  const [name, setName] = useState("");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [organization, setOrganization] = useState("");
  const [farmerWallet, setFarmerWallet] = useState("");
  const [txStatus, setTxStatus] = useState<TxStatus>({ status: "idle" });

  const loadData = async () => {
    setLoading(true);
    try {
      const [farmersRes, batchesRes] = await Promise.all([
        fetchAllFarmers(),
        fetchAllBatches(),
      ]);
      setFarmers(farmersRes.farmers);
      setBatches(batchesRes.batches);

      // If query param ?selected=FARMER-ID is present, select that farmer
      const selectedParam = searchParams.get("selected");
      if (selectedParam) {
        const match = farmersRes.farmers.find(
          (f) => f.farmerId.toUpperCase() === selectedParam.toUpperCase()
        );
        if (match) {
          selectFarmer(match, batchesRes.batches);
        }
      }
    } catch (err) {
      console.warn("Could not load farmers or batches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectFarmer = async (farmer: Farmer, allBatchesPool?: Batch[]) => {
    setSelectedFarmer(farmer);
    setSearchParams({ selected: farmer.farmerId });
    setLoadingFarmerBatches(true);
    try {
      // First use local in-memory pool for instantaneous rendering
      const pool = allBatchesPool || batches;
      const directMatches = pool.filter(
        (b) => b.farmerId.toUpperCase() === farmer.farmerId.toUpperCase()
      );
      setFarmerBatches(directMatches);

      // Query chain/local store for fresh batch list
      const res = await fetchBatchesForFarmer(farmer.farmerId);
      if (res.batches && res.batches.length > 0) {
        setFarmerBatches(res.batches);
      }
    } catch (e) {
      console.warn("Could not fetch batches for farmer:", e);
    } finally {
      setLoadingFarmerBatches(false);
    }
  };

  const closeInspector = () => {
    setSelectedFarmer(null);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("selected");
    setSearchParams(nextParams);
  };

  const getFarmerBatchesList = (fId: string): Batch[] => {
    return batches.filter(
      (b) => b.farmerId.toUpperCase() === fId.toUpperCase()
    );
  };

  const resetForm = () => {
    setFarmerId("");
    setName("");
    setVillage("");
    setDistrict("");
    setState("");
    setOrganization("");
    setFarmerWallet("");
    setShowRegisterForm(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedId = farmerId.trim().toUpperCase();
    const trimmedName = name.trim();
    const fullLocation = `${village.trim()}, ${district.trim()}, ${state.trim()}, ${country.trim()}`;
    const trimmedOrg = organization.trim();
    const trimmedWallet = farmerWallet.trim();

    if (!trimmedId || !trimmedName || !village.trim() || !district.trim() || !trimmedOrg) {
      alert("Please fill in all required fields.");
      return;
    }

    const newFarmerObj: Farmer = {
      farmerId: trimmedId,
      name: trimmedName,
      location: fullLocation,
      organization: trimmedOrg,
      walletAddress: trimmedWallet || undefined,
      registrationTime: Math.floor(Date.now() / 1000),
      registeredBy: wallet.address || "0xLocalDemoAddress",
      exists: true,
    };

    // If MetaMask is connected and on Sepolia/Localhost, attempt on-chain registration
    if (wallet.isConnected && wallet.isSepolia) {
      setTxStatus({ status: "awaiting_wallet" });
      try {
        const result = await registerFarmerOnChain(
          trimmedId,
          trimmedName,
          fullLocation,
          trimmedOrg,
          trimmedWallet || undefined
        );

        setTxStatus({
          status: "confirmed",
          hash: result.hash,
          message: `Farmer "${trimmedName}" (${trimmedId}) registered successfully on Ethereum Sepolia!`,
        });

        // Also save to local cache for fast loading
        saveLocalFarmer(newFarmerObj);
        resetForm();
        loadData();
        return;
      } catch (err: any) {
        console.warn("On-chain registration failed, falling back to local demo save:", err);
        // Fallback: save locally so user can still see and use the farmer in web app
        saveLocalFarmer(newFarmerObj);
        setTxStatus({
          status: "confirmed",
          message: `On-chain transaction failed (${parseContractError(err)}). Saved in Local Demo Mode! Farmer "${trimmedName}" (${trimmedId}) is now active on this browser.`,
        });
        resetForm();
        loadData();
        return;
      }
    }

    // Offline / Demo Mode: Save locally directly
    saveLocalFarmer(newFarmerObj);
    setTxStatus({
      status: "confirmed",
      message: `Farmer "${trimmedName}" (${trimmedId}) registered in Local Demo Mode! It is now immediately visible across the app.`,
    });
    resetForm();
    loadData();
  };

  const filteredFarmers = farmers.filter((f) => {
    const q = searchQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.farmerId.toLowerCase().includes(q) ||
      f.location.toLowerCase().includes(q) ||
      f.organization.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#18251e] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-farm-400" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Farmer Directory & Provenance</h1>
          </div>
          <p className="text-sm text-stone-400 mt-1">
            Registered smallholders and cooperative members with cryptographic origin records on Ethereum Sepolia.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 border border-[#18251e] bg-[#0d1410] rounded-lg hover:bg-[#14201a] text-stone-300 transition"
            title="Refresh farmers list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-farm-400" : ""}`} />
          </button>
          <button
            onClick={() => setShowRegisterForm(!showRegisterForm)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-farm-600 hover:bg-farm-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-farm-600/30 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showRegisterForm ? "Close Form" : "Register New Farmer"}</span>
          </button>
        </div>
      </div>

      {/* Quick Farmer Selector to view Undertaken Batches */}
      <div className="bg-[#0d1410] border border-[#18251e] rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-farm-950/80 border border-farm-800/60 rounded-xl text-farm-400 shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Select Farmer to View Undertaken Batches</h3>
            <p className="text-xs text-stone-400">
              Pick any registered producer to inspect all crop batches they are currently undertaking
            </p>
          </div>
        </div>

        <div className="w-full md:w-96">
          <select
            value={selectedFarmer ? selectedFarmer.farmerId : ""}
            onChange={(e) => {
              const f = farmers.find((item) => item.farmerId === e.target.value);
              if (f) selectFarmer(f);
            }}
            className="w-full px-3.5 py-2.5 bg-[#0a100d] border border-[#1f2f25] rounded-xl text-xs text-white focus:ring-2 focus:ring-farm-500 font-medium"
          >
            <option value="">-- Choose a Farmer from the Roster --</option>
            {farmers.map((f) => {
              const count = getFarmerBatchesList(f.farmerId).length;
              return (
                <option key={f.farmerId} value={f.farmerId}>
                  {f.name} ({f.farmerId}) — {count} {count === 1 ? "Batch" : "Batches"} Undertaken
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Registration Disclaimer Banner */}
      <div className="bg-amber-950/40 border border-amber-800/60 rounded-2xl p-4 text-xs text-amber-300 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-200">Declaration Notice: </span>
          Farmer registration stores an authorized producer organization's official declaration on-chain. Blockchain registration establishes tamper-evident provenance and author attribution; it does not independently verify physical biometrics or real-world identity documents.
        </div>
      </div>

      {/* Register Farmer Form Drawer */}
      {showRegisterForm && (
        <div className="bg-[#0d1410] rounded-2xl border-2 border-farm-700/60 p-6 shadow-2xl transition space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#18251e]">
            <div className="flex items-center space-x-2">
              <UserPlus className="w-5 h-5 text-farm-400" />
              <h3 className="font-bold text-white text-base">Register Farmer On-Chain</h3>
            </div>
            <span className="text-xs text-stone-400 font-mono">Gas Paid in ETH</span>
          </div>

          <form onSubmit={handleRegisterSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-300 mb-1">Farmer ID (Unique) *</label>
              <input
                type="text"
                required
                value={farmerId}
                onChange={(e) => setFarmerId(e.target.value)}
                placeholder="e.g. FARMER-104 or FPO-ID-42"
                className="w-full px-3 py-2 border border-[#1f2f25] rounded-xl uppercase font-mono text-white bg-[#0a100d] placeholder-stone-500 focus:ring-2 focus:ring-farm-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-300 mb-1">Farmer Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajesh Mehra"
                className="w-full px-3 py-2 border border-[#1f2f25] rounded-xl text-white bg-[#0a100d] placeholder-stone-500 focus:ring-2 focus:ring-farm-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-300 mb-1">Village / Origin Place *</label>
              <input
                type="text"
                required
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="e.g. Mananthavady or Palampur"
                className="w-full px-3 py-2 border border-[#1f2f25] rounded-xl text-white bg-[#0a100d] placeholder-stone-500 focus:ring-2 focus:ring-farm-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-300 mb-1">District *</label>
              <input
                type="text"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Wayanad or Kangra"
                className="w-full px-3 py-2 border border-[#1f2f25] rounded-xl text-white bg-[#0a100d] placeholder-stone-500 focus:ring-2 focus:ring-farm-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-300 mb-1">State / Province *</label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Kerala or Himachal Pradesh"
                className="w-full px-3 py-2 border border-[#1f2f25] rounded-xl text-white bg-[#0a100d] placeholder-stone-500 focus:ring-2 focus:ring-farm-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-300 mb-1">Country *</label>
              <input
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. India"
                className="w-full px-3 py-2 border border-[#1f2f25] rounded-xl text-white bg-[#0a100d] placeholder-stone-500 focus:ring-2 focus:ring-farm-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-300 mb-1">Associated Farmer Organization (FPO) *</label>
              <input
                type="text"
                required
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. Wayanad Organic Farmers Cooperative"
                className="w-full px-3 py-2 border border-[#1f2f25] rounded-xl text-white bg-[#0a100d] placeholder-stone-500 focus:ring-2 focus:ring-farm-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-300 mb-1">Farmer Ethereum Wallet Address (Optional)</label>
              <input
                type="text"
                value={farmerWallet}
                onChange={(e) => setFarmerWallet(e.target.value)}
                placeholder="0x... (leave blank if farmer has no Web3 wallet)"
                className="w-full px-3 py-2 border border-[#1f2f25] rounded-xl font-mono text-white bg-[#0a100d] placeholder-stone-500 focus:ring-2 focus:ring-farm-500"
              />
            </div>

            <div className="md:col-span-2 pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowRegisterForm(false)}
                className="px-4 py-2 border border-[#18251e] rounded-xl text-stone-300 hover:bg-[#14201a] font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-farm-600 hover:bg-farm-500 text-white font-bold rounded-xl shadow-lg shadow-farm-600/30 transition"
              >
                Submit to Blockchain
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by farmer name, ID, village, or FPO..."
          className="w-full pl-10 pr-4 py-2.5 border border-[#18251e] bg-[#0d1410] rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:ring-2 focus:ring-farm-500 shadow-md"
        />
      </div>

      {/* Farmers Cards Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-stone-400">Loading registered farmers & undertaken batches...</div>
      ) : filteredFarmers.length === 0 ? (
        <div className="p-16 text-center bg-[#0d1410] rounded-2xl border border-[#18251e] text-xs text-stone-400">
          No farmers matched your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredFarmers.map((farmer) => {
            const undertaken = getFarmerBatchesList(farmer.farmerId);
            const isSelected = selectedFarmer?.farmerId === farmer.farmerId;

            return (
              <div
                key={farmer.farmerId}
                className={`bg-[#0d1410] rounded-2xl border ${
                  isSelected ? "border-farm-500 ring-2 ring-farm-500/30" : "border-[#18251e] hover:border-farm-700/60"
                } p-5 shadow-lg transition space-y-4 flex flex-col justify-between`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-farm-950/80 text-farm-300 border border-farm-800/80">
                      {farmer.farmerId}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>On-Chain</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-lg">{farmer.name}</h3>
                    <div className="flex items-center space-x-1 text-xs text-stone-400 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                      <span className="truncate">{farmer.organization}</span>
                    </div>
                  </div>

                  <div className="text-xs text-stone-300 bg-[#121c17] p-3 rounded-xl border border-[#18251e] space-y-1.5">
                    <div className="flex items-start space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-farm-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">{farmer.location}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-stone-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        Registered: {farmer.registrationTime ? new Date(farmer.registrationTime * 1000).toLocaleDateString() : "Active"}
                      </span>
                    </div>
                    {farmer.walletAddress && (
                      <div className="flex items-center space-x-1.5 text-stone-400 pt-1 border-t border-[#18251e] font-mono text-[11px]">
                        <Wallet className="w-3.5 h-3.5 text-stone-500" />
                        <span>{formatAddress(farmer.walletAddress)}</span>
                      </div>
                    )}
                  </div>

                  {/* Undertaken Batches Section */}
                  <div className="bg-[#121c17] p-3 rounded-xl border border-[#18251e] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-300 flex items-center space-x-1.5">
                        <Package className="w-3.5 h-3.5 text-farm-400" />
                        <span>Undertaken Batches</span>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                          undertaken.length > 0
                            ? "bg-emerald-950/70 text-emerald-300 border border-emerald-800/60"
                            : "bg-[#18251e] text-stone-400 border border-[#1f2f25]"
                        }`}
                      >
                        {undertaken.length} {undertaken.length === 1 ? "Batch" : "Batches"}
                      </span>
                    </div>

                    {undertaken.length > 0 ? (
                      <div className="space-y-1.5 pt-0.5">
                        {undertaken.slice(0, 2).map((b) => (
                          <div
                            key={b.batchId}
                            onClick={(e) => {
                              e.stopPropagation();
                              selectFarmer(farmer);
                            }}
                            className="flex items-center justify-between p-2 rounded-lg bg-[#0a100d] border border-[#18251e] hover:border-farm-500/60 cursor-pointer transition text-[11px] group"
                            title="Click to view batch details"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-mono font-bold text-farm-400 group-hover:text-farm-300 block">
                                {b.batchId}
                              </span>
                              <span className="text-stone-300 truncate block text-[10px]">{b.productName}</span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#14201a] text-stone-300 border border-[#1f2f25] shrink-0">
                              {STAGE_LABELS[b.currentStage] || "Active"}
                            </span>
                          </div>
                        ))}

                        {undertaken.length > 2 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              selectFarmer(farmer);
                            }}
                            className="text-[10px] text-farm-400 hover:text-farm-300 font-semibold block text-center w-full pt-0.5 transition"
                          >
                            +{undertaken.length - 2} more batches undertaken →
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-stone-500 italic pt-0.5">
                        No batches recorded yet. Ready for first harvest.
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#18251e] flex items-center justify-between text-xs gap-2">
                  <button
                    onClick={() => selectFarmer(farmer)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#14201a] hover:bg-[#1a2b22] text-farm-300 border border-[#18251e] font-semibold text-xs transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Batches ({undertaken.length})</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/register-batch?farmerId=${farmer.farmerId}`}
                      className="inline-flex items-center space-x-1 font-bold text-farm-400 hover:text-farm-300"
                      title="Register a new harvest batch for this farmer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Register Batch</span>
                    </Link>
                    <a
                      href={`https://sepolia.etherscan.io/address/${farmer.registeredBy}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stone-400 hover:text-white"
                      title="View registering wallet on Sepolia Etherscan"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Farmer Undertaken Batches Inspector Modal */}
      {selectedFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0d1410] border border-[#18251e] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#18251e] flex items-start justify-between bg-[#0a100d]/90">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-farm-950/80 text-farm-300 border border-farm-800/80">
                    {selectedFarmer.farmerId}
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified Producer</span>
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-white">
                  Batches Undertaken by {selectedFarmer.name}
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-400 pt-1">
                  <span className="flex items-center space-x-1">
                    <Building2 className="w-3.5 h-3.5 text-stone-500" />
                    <span>{selectedFarmer.organization}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-farm-400" />
                    <span>{selectedFarmer.location}</span>
                  </span>
                </div>
              </div>

              <button
                onClick={closeInspector}
                className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-[#14201a] transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-[#121c17] border-b border-[#18251e] text-center text-xs">
              <div className="p-3 bg-[#0a100d] rounded-xl border border-[#18251e]">
                <span className="text-stone-400 block text-[11px]">Total Undertaken</span>
                <span className="text-lg font-mono font-bold text-white mt-0.5 block">
                  {farmerBatches.length}
                </span>
              </div>
              <div className="p-3 bg-[#0a100d] rounded-xl border border-[#18251e]">
                <span className="text-stone-400 block text-[11px]">In Progress (Processing/Transit)</span>
                <span className="text-lg font-mono font-bold text-amber-400 mt-0.5 block">
                  {farmerBatches.filter((b) => b.currentStage < Stage.RetailerReceived).length}
                </span>
              </div>
              <div className="p-3 bg-[#0a100d] rounded-xl border border-[#18251e]">
                <span className="text-stone-400 block text-[11px]">Retail Delivered (Complete)</span>
                <span className="text-lg font-mono font-bold text-emerald-400 mt-0.5 block">
                  {farmerBatches.filter((b) => b.currentStage === Stage.RetailerReceived).length}
                </span>
              </div>
            </div>

            {/* Modal Body: Batches List */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {loadingFarmerBatches ? (
                <div className="py-12 text-center text-xs text-stone-400 flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-farm-400" />
                  <span>Loading batches for {selectedFarmer.name}...</span>
                </div>
              ) : farmerBatches.length === 0 ? (
                <div className="p-10 text-center bg-[#0a100d] rounded-2xl border border-[#18251e] space-y-3">
                  <div className="w-12 h-12 rounded-full bg-farm-950/60 border border-farm-800/60 text-farm-400 mx-auto flex items-center justify-center">
                    <Package className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-white text-base">No Undertaken Batches Yet</h4>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto">
                    {selectedFarmer.name} has not yet registered any harvest batches on the blockchain. You can mint their first batch now.
                  </p>
                  <div className="pt-2">
                    <Link
                      to={`/register-batch?farmerId=${selectedFarmer.farmerId}`}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-farm-600 hover:bg-farm-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-farm-600/30 transition"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Register First Batch for {selectedFarmer.name}</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {farmerBatches.map((batch) => {
                    const stageIndex = batch.currentStage;
                    const stagePercent = Math.round(((stageIndex + 1) / 7) * 100);

                    return (
                      <div
                        key={batch.batchId}
                        className="p-5 bg-[#0a100d] rounded-2xl border border-[#18251e] space-y-4 shadow-sm hover:border-farm-700/60 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#18251e]">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-sm font-bold text-farm-400 bg-farm-950/70 px-2.5 py-0.5 rounded border border-farm-800/60">
                                {batch.batchId}
                              </span>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#121c17] text-stone-300 border border-[#18251e]">
                                {batch.category}
                              </span>
                            </div>
                            <h4 className="text-lg font-bold text-white mt-1.5">{batch.productName}</h4>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">
                              Stage: {STAGE_LABELS[batch.currentStage] || "Active"}
                            </span>
                          </div>
                        </div>

                        {/* Progress Tracker */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px] text-stone-400">
                            <span>Supply Chain Progress: Step {stageIndex + 1} of 7</span>
                            <span className="font-mono text-farm-400 font-bold">{stagePercent}%</span>
                          </div>
                          <div className="w-full bg-[#121c17] rounded-full h-2 overflow-hidden border border-[#18251e]">
                            <div
                              className="bg-gradient-to-r from-farm-600 to-emerald-400 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${stagePercent}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Batch Details Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-300 bg-[#121c17] p-3 rounded-xl border border-[#18251e]">
                          <div>
                            <span className="text-stone-500 block text-[10px]">Harvest Date:</span>
                            <span className="font-medium">
                              {batch.harvestDate ? new Date(batch.harvestDate * 1000).toLocaleDateString() : "Unknown"}
                            </span>
                          </div>
                          <div>
                            <span className="text-stone-500 block text-[10px]">Registered On-Chain:</span>
                            <span className="font-medium">
                              {batch.registrationTime ? new Date(batch.registrationTime * 1000).toLocaleString() : "-"}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/batch/${batch.batchId}`}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-farm-600 hover:bg-farm-500 text-white font-bold text-xs rounded-xl shadow-sm transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Batch Timeline</span>
                            </Link>

                            <Link
                              to={`/verify/${batch.batchId}`}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#121c17] hover:bg-[#18251e] text-stone-200 border border-[#18251e] font-semibold text-xs rounded-xl transition"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-farm-400" />
                              <span>Public Verify / QR</span>
                            </Link>
                          </div>

                          <Link
                            to={`/supply-chain?batchId=${batch.batchId}`}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/60 font-semibold text-xs rounded-xl transition"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>+ Log Next Checkpoint</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#18251e] bg-[#0a100d] flex items-center justify-between">
              <span className="text-xs text-stone-400">
                Farmer ID: <span className="font-mono text-white font-bold">{selectedFarmer.farmerId}</span>
              </span>

              <div className="flex items-center space-x-2">
                <Link
                  to={`/register-batch?farmerId=${selectedFarmer.farmerId}`}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-farm-600 hover:bg-farm-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-farm-600/30 transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Register Another Batch for {selectedFarmer.name}</span>
                </Link>

                <button
                  onClick={closeInspector}
                  className="px-4 py-2 bg-[#121c17] hover:bg-[#18251e] border border-[#18251e] text-stone-300 text-xs font-semibold rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      <TransactionModal
        txStatus={txStatus}
        onClose={() => setTxStatus({ status: "idle" })}
        title="Farmer Registration Transaction"
      />
    </div>
  );
};
