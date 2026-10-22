import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { fetchAllFarmers, parseContractError, registerFarmerOnChain, saveLocalFarmer } from "../services/web3Service";
import { Farmer, TxStatus } from "../types";
import { TransactionModal } from "../components/TransactionModal";

export const FarmerManagementPage: React.FC = () => {
  const { wallet, switchToSepolia, formatAddress } = useWeb3();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRegisterForm, setShowRegisterForm] = useState(false);

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

  const loadFarmers = async () => {
    setLoading(true);
    try {
      const res = await fetchAllFarmers();
      setFarmers(res.farmers);
    } catch (err) {
      console.warn("Could not load farmers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarmers();
  }, []);

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
        loadFarmers();
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
        loadFarmers();
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
    loadFarmers();
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
            onClick={loadFarmers}
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
        <div className="p-16 text-center text-xs text-stone-400">Loading registered farmers...</div>
      ) : filteredFarmers.length === 0 ? (
        <div className="p-16 text-center bg-[#0d1410] rounded-2xl border border-[#18251e] text-xs text-stone-400">
          No farmers matched your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredFarmers.map((farmer) => (
            <div
              key={farmer.farmerId}
              className="bg-[#0d1410] rounded-2xl border border-[#18251e] p-5 shadow-lg hover:border-farm-700/60 transition space-y-4 flex flex-col justify-between"
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
              </div>

              <div className="pt-3 border-t border-[#18251e] flex items-center justify-between text-xs">
                <Link
                  to={`/register-batch?farmerId=${farmer.farmerId}`}
                  className="inline-flex items-center space-x-1 font-bold text-farm-400 hover:text-farm-300"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Register Batch for Farmer</span>
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
          ))}
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
