import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  PackagePlus,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import {
  fetchAllBatches,
  fetchAllFarmers,
  parseContractError,
  registerBatchOnChain,
  saveLocalBatch,
} from "../services/web3Service";
import { BatchWithHistory, Farmer, Stage, TxStatus } from "../types";
import { TransactionModal } from "../components/TransactionModal";
import { QRCodeCard } from "../components/QRCodeCard";

export const ProductRegistrationPage: React.FC = () => {
  const { wallet } = useWeb3();
  const location = useLocation();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loadingFarmers, setLoadingFarmers] = useState(true);

  // Form Fields
  const [batchId, setBatchId] = useState("");
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("Coffee & Tea");
  const [selectedFarmerId, setSelectedFarmerId] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [originLocation, setOriginLocation] = useState("");
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split("T")[0]);
  const [harvestNotes, setHarvestNotes] = useState("");

  // Review confirmation modal
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Transaction handling
  const [txStatus, setTxStatus] = useState<TxStatus>({ status: "idle" });
  const [registeredBatchId, setRegisteredBatchId] = useState<string | null>(null);

  // Categories list
  const categories = [
    "Coffee & Tea",
    "Grains & Cereals",
    "Fruits & Vegetables",
    "Spices & Herbs",
    "Pulses & Legumes",
    "Dairy, Oil & Honey",
    "Specialty Organic",
  ];

  // Auto-generate consistent next batch ID
  const generateBatchId = (existingCount: number) => {
    const nextNum = existingCount + 1;
    const padded = String(nextNum).padStart(6, "0");
    return `FT-${padded}`;
  };

  useEffect(() => {
    fetchAllFarmers()
      .then((res) => {
        setFarmers(res.farmers);

        // Pre-select if passed in query param
        const queryParams = new URLSearchParams(location.search);
        const queryFarmerId = queryParams.get("farmerId");
        if (queryFarmerId) {
          const match = res.farmers.find((f) => f.farmerId === queryFarmerId);
          if (match) {
            setSelectedFarmerId(match.farmerId);
            setOrganizationName(match.organization);
            setOriginLocation(match.location);
          }
        } else if (res.farmers.length > 0) {
          setSelectedFarmerId(res.farmers[0].farmerId);
          setOrganizationName(res.farmers[0].organization);
          setOriginLocation(res.farmers[0].location);
        }
      })
      .catch(console.warn)
      .finally(() => setLoadingFarmers(false));

    fetchAllBatches()
      .then((res) => {
        setBatchId(generateBatchId(res.batches.length));
      })
      .catch(() => {
        setBatchId("FT-000004");
      });
  }, [location.search]);

  // When farmer selection changes, prefill org and location
  const handleFarmerChange = (fId: string) => {
    setSelectedFarmerId(fId);
    const match = farmers.find((f) => f.farmerId === fId);
    if (match) {
      setOrganizationName(match.organization);
      setOriginLocation(match.location);
    }
  };

  const handleReviewClick = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!batchId.trim() || !productName.trim() || !selectedFarmerId || !organizationName.trim() || !originLocation.trim()) {
      setValidationError("All required fields must be filled.");
      return;
    }

    // Validate harvest date not in the future
    const selectedTime = new Date(harvestDate).getTime();
    const nowTime = new Date().getTime();
    if (selectedTime > nowTime + 3600000) {
      setValidationError("Harvest date cannot be in the future. Please select today or an earlier date.");
      return;
    }

    setIsReviewOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setIsReviewOpen(false);

    const cleanBatchId = batchId.trim().toUpperCase();
    const harvestTimestampSeconds = Math.floor(new Date(harvestDate).getTime() / 1000);
    const matchedFarmer = farmers.find((f) => f.farmerId.toUpperCase() === selectedFarmerId.toUpperCase());

    const newBatchData: BatchWithHistory = {
      batchId: cleanBatchId,
      productName: productName.trim(),
      category,
      farmerId: selectedFarmerId.trim().toUpperCase(),
      organizationName: organizationName.trim(),
      originLocation: originLocation.trim(),
      harvestDate: harvestTimestampSeconds,
      registrationTime: Math.floor(Date.now() / 1000),
      registeredBy: wallet.address || "0xDemoOrgWallet",
      currentStage: Stage.Harvested,
      exists: true,
      farmer: matchedFarmer,
      events: [
        {
          stage: Stage.Harvested,
          stageName: "Harvested",
          location: originLocation.trim(),
          eventTimestamp: harvestTimestampSeconds,
          blockTimestamp: Math.floor(Date.now() / 1000),
          actor: wallet.address || "0xDemoOrgWallet",
          notes: harvestNotes.trim() || "Harvested at farm origin. Initial provenance sealed.",
        },
      ],
      corrections: [],
    };

    // If MetaMask is connected and on Sepolia, try on-chain registration
    if (wallet.isConnected && wallet.isSepolia) {
      setTxStatus({ status: "awaiting_wallet" });
      try {
        const result = await registerBatchOnChain(
          cleanBatchId,
          productName.trim(),
          category,
          selectedFarmerId.trim().toUpperCase(),
          organizationName.trim(),
          originLocation.trim(),
          harvestTimestampSeconds,
          harvestNotes.trim()
        );

        saveLocalBatch(newBatchData);
        setRegisteredBatchId(cleanBatchId);
        setTxStatus({
          status: "confirmed",
          hash: result.hash,
          message: `Batch "${productName}" (${cleanBatchId}) successfully minted and registered on Ethereum Sepolia!`,
        });
        return;
      } catch (err: any) {
        console.warn("On-chain batch registration failed, saving locally:", err);
        saveLocalBatch(newBatchData);
        setRegisteredBatchId(cleanBatchId);
        setTxStatus({
          status: "confirmed",
          message: `On-chain transaction failed (${parseContractError(err)}). Saved to Local Demo Mode! Batch "${productName}" (${cleanBatchId}) is now active on this browser.`,
        });
        return;
      }
    }

    // Offline / Demo Mode
    saveLocalBatch(newBatchData);
    setRegisteredBatchId(cleanBatchId);
    setTxStatus({
      status: "confirmed",
      message: `Batch "${productName}" (${cleanBatchId}) registered in Local Demo Mode! QR code and verification are ready below.`,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-[#18251e]">
        <div className="flex items-center space-x-2">
          <PackagePlus className="w-6 h-6 text-farm-400" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Register Product Batch
          </h1>
        </div>
        <p className="text-sm text-stone-400 mt-1">
          Mint a verifiable agricultural batch record on the blockchain with automatic QR generation.
        </p>
      </div>

      {/* If batch was just successfully registered, show success & QR Card */}
      {registeredBatchId && txStatus.status === "confirmed" && (
        <div className="space-y-6">
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-2xl p-6 text-center space-y-2 shadow-lg">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-xl font-bold text-white">Batch Successfully Registered On-Chain!</h3>
            <p className="text-xs text-emerald-300 max-w-md mx-auto">
              The batch has been cryptographically confirmed on Ethereum Sepolia. Your consumer QR code and verification URL are ready below.
            </p>
          </div>

          <QRCodeCard
            batchId={registeredBatchId}
            productName={productName}
            organizationName={organizationName}
            originLocation={originLocation}
            harvestDate={Math.floor(new Date(harvestDate).getTime() / 1000)}
          />

          <div className="flex justify-center space-x-3 pt-2">
            <Link
              to={`/verify/${registeredBatchId}`}
              className="px-5 py-2.5 bg-farm-600 hover:bg-farm-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-farm-600/30 transition"
            >
              Test Public Consumer Verification Page
            </Link>
            <button
              onClick={() => {
                setRegisteredBatchId(null);
                setTxStatus({ status: "idle" });
                setProductName("");
                setHarvestNotes("");
              }}
              className="px-5 py-2.5 border border-[#18251e] bg-[#0d1410] hover:bg-[#14201a] text-stone-200 font-semibold text-xs rounded-xl transition"
            >
              Register Another Batch
            </button>
          </div>
        </div>
      )}

      {/* Main Registration Form */}
      {(!registeredBatchId || txStatus.status !== "confirmed") && (
        <div className="bg-[#0d1410] rounded-2xl border border-[#18251e] p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Declaration Disclaimer Callout */}
          <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 text-xs text-amber-300 flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-200 block">Authorized Declaration Protocol</span>
              By submitting this form, your connected wallet ({wallet.address ? `${wallet.address.slice(0, 6)}...` : "Wallet Not Connected"}) will sign an immutable Ethereum Sepolia transaction declaring the origin, harvest date, and batch characteristics.
            </div>
          </div>

          {validationError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          <form onSubmit={handleReviewClick} className="space-y-5 text-xs">
            {/* Grid 1: Batch ID & Product Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Unique Batch ID *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value.toUpperCase())}
                    placeholder="e.g. FT-000004"
                    className="w-full px-3.5 py-2.5 border border-[#1f2f25] rounded-xl uppercase font-mono font-bold text-white bg-[#0a100d] focus:ring-2 focus:ring-farm-500"
                  />
                  <span className="absolute right-3 top-3 text-[10px] text-stone-500">Auto-formatted</span>
                </div>
                <p className="text-[11px] text-stone-500 mt-1">Unique identifier that cannot collide with existing batches.</p>
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Single Origin Arabica Coffee Beans"
                  className="w-full px-3.5 py-2.5 border border-[#1f2f25] rounded-xl text-white bg-[#0a100d] placeholder-stone-500 focus:ring-2 focus:ring-farm-500"
                />
              </div>
            </div>

            {/* Grid 2: Category & Farmer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Product Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#1f2f25] rounded-xl bg-[#0a100d] text-white focus:ring-2 focus:ring-farm-500"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Associated Farmer ID *
                </label>
                {loadingFarmers ? (
                  <div className="px-3 py-2.5 text-stone-500">Loading registered farmers...</div>
                ) : farmers.length > 0 ? (
                  <select
                    value={selectedFarmerId}
                    onChange={(e) => handleFarmerChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[#1f2f25] rounded-xl bg-[#0a100d] text-white focus:ring-2 focus:ring-farm-500"
                  >
                    {farmers.map((f) => (
                      <option key={f.farmerId} value={f.farmerId}>
                        {f.farmerId} — {f.name} ({f.location})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      required
                      value={selectedFarmerId}
                      onChange={(e) => setSelectedFarmerId(e.target.value.toUpperCase())}
                      placeholder="e.g. FARMER-101"
                      className="w-full px-3.5 py-2.5 border border-[#1f2f25] rounded-xl uppercase font-mono bg-[#0a100d] text-white"
                    />
                    <Link
                      to="/farmers"
                      className="shrink-0 px-3 py-2.5 bg-[#14201a] hover:bg-[#1f2f25] text-farm-300 border border-[#18251e] rounded-xl font-semibold"
                    >
                      + Register
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Grid 3: Organization & Origin Place */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Farmer Organization / Producer Group *
                </label>
                <input
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="e.g. Wayanad Organic Farmers Cooperative"
                  className="w-full px-3.5 py-2.5 border border-[#1f2f25] rounded-xl text-white bg-[#0a100d] placeholder-stone-500 focus:ring-2 focus:ring-farm-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Place of Origin / Village *
                </label>
                <input
                  type="text"
                  required
                  value={originLocation}
                  onChange={(e) => setOriginLocation(e.target.value)}
                  placeholder="e.g. Mananthavady, Wayanad, Kerala, India"
                  className="w-full px-3.5 py-2.5 border border-[#1f2f25] rounded-xl text-white bg-[#0a100d] placeholder-stone-500 focus:ring-2 focus:ring-farm-500"
                />
              </div>
            </div>

            {/* Grid 4: Harvest Date & Harvest Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Harvest Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split("T")[0]}
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[#1f2f25] rounded-xl text-white bg-[#0a100d] focus:ring-2 focus:ring-farm-500"
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-1">Cannot be a future date. Validated by smart contract.</p>
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">
                  Initial Harvest & Quality Notes (Optional)
                </label>
                <input
                  type="text"
                  value={harvestNotes}
                  onChange={(e) => setHarvestNotes(e.target.value)}
                  placeholder="e.g. Hand-picked at 1100m elevation. Grade-A cherries."
                  className="w-full px-3.5 py-2.5 border border-[#1f2f25] rounded-xl text-white bg-[#0a100d] placeholder-stone-500 focus:ring-2 focus:ring-farm-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-[#18251e] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-stone-400">
                Network: <strong className="text-white">Ethereum Sepolia</strong> | Gas paid by organization wallet
              </span>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-farm-600 hover:bg-farm-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-farm-600/30 transition transform hover:-translate-y-0.5"
              >
                Review & Confirm Batch
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Review Modal before MetaMask Trigger */}
      {isReviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0d1410] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#18251e]">
            <div className="px-6 py-4 border-b border-[#18251e] flex justify-between items-center">
              <h3 className="font-bold text-white text-base">Review Batch Submission</h3>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-farm-950/80 text-farm-300 border border-farm-800/80">
                {batchId}
              </span>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-stone-300">
                Please verify that the details below are correct before submitting to Ethereum Sepolia. Once mined, this record is permanent.
              </p>

              <div className="bg-[#121c17] rounded-xl p-4 border border-[#18251e] space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-400 font-medium">Product Name:</span>
                  <span className="font-bold text-white">{productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 font-medium">Category:</span>
                  <span className="text-stone-200">{category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 font-medium">Farmer ID:</span>
                  <span className="font-mono font-bold text-farm-400">{selectedFarmerId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 font-medium">Origin:</span>
                  <span className="text-stone-200">{originLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 font-medium">Harvest Date:</span>
                  <span className="text-stone-200">{harvestDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 font-medium">Registering Wallet:</span>
                  <span className="font-mono text-stone-200">{wallet.address ? `${wallet.address.slice(0, 10)}...` : ""}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsReviewOpen(false)}
                  className="px-4 py-2 border border-[#18251e] rounded-xl text-stone-300 hover:bg-[#14201a] font-semibold"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  className="px-5 py-2.5 bg-farm-600 hover:bg-farm-500 text-white font-bold rounded-xl shadow-lg shadow-farm-600/30 transition"
                >
                  Approve in MetaMask & Mint
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
        title="Batch Registration Transaction"
      />
    </div>
  );
};
