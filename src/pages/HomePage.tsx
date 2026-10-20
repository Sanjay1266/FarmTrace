import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  PlusCircle,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  MapPin,
  Truck,
  HeartHandshake,
} from "lucide-react";
import { fetchContractCounts } from "../services/web3Service";
import { DEMO_BATCHES } from "../services/mockData";
import { useWeb3 } from "../context/Web3Context";

export const HomePage: React.FC = () => {
  const { isContractReady } = useWeb3();
  const [counts, setCounts] = useState({
    totalFarmers: 3,
    totalBatches: 3,
    totalEvents: 12,
    isLiveBlockchain: false,
  });

  useEffect(() => {
    fetchContractCounts()
      .then(setCounts)
      .catch((e) => console.warn("Failed to load counts:", e));
  }, [isContractReady]);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-18 pb-14 sm:pb-20 border-b border-stone-200 bg-linear-to-b from-farm-50/70 via-stone-50 to-stone-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Friendly pill */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-farm-100 text-farm-800 text-xs font-medium border border-farm-200">
            <span className="w-2 h-2 rounded-full bg-farm-600 animate-pulse"></span>
            <span>Verifiable on Ethereum Sepolia</span>
            <span className="text-farm-400">•</span>
            <span>Zero gas fees for consumers</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-stone-900 leading-[1.15]">
            Real Food. <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-farm-700 via-farm-600 to-emerald-600">
              Honest Origins.
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-2xl mx-auto">
            Trace your harvest from smallholder family farms to your kitchen table. A transparent, tamper-proof record built for farmer cooperatives and conscious consumers.
          </p>

          {/* Quick Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/verify"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-farm-600 hover:bg-farm-700 text-white font-bold text-sm shadow-md shadow-farm-600/20 transition transform hover:-translate-y-0.5"
            >
              <Search className="w-4 h-4" />
              <span>Verify Product by Batch ID</span>
            </Link>
            <Link
              to="/register-batch"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-bold text-sm shadow-xs transition"
            >
              <PlusCircle className="w-4 h-4 text-farm-600" />
              <span>Register New Batch</span>
            </Link>
          </div>

          {/* Key Stats Row */}
          <div className="pt-8 max-w-3xl mx-auto grid grid-cols-3 gap-3 text-center">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-mono">
                {counts.totalFarmers}
              </div>
              <div className="text-xs text-stone-500 mt-0.5 font-medium">Registered Farmers</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
              <div className="text-2xl sm:text-3xl font-extrabold text-farm-700 font-mono">
                {counts.totalBatches}
              </div>
              <div className="text-xs text-stone-500 mt-0.5 font-medium">Tracked Batches</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono">
                {counts.totalEvents}
              </div>
              <div className="text-xs text-stone-500 mt-0.5 font-medium">Recorded Checkpoints</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">How FarmTrace Works</h2>
          <p className="text-stone-500 text-xs sm:text-sm">
            Four simple steps from harvest to your home.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-lg bg-farm-100 text-farm-800 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="font-bold text-stone-900 text-sm">Harvest at the Farm</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Farmer cooperatives log the smallholder name, village, and exact picking date.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-lg bg-farm-100 text-farm-800 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="font-bold text-stone-900 text-sm">QR Code on the Bag</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              A unique Batch ID and scannable QR label are generated directly from Ethereum.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-lg bg-farm-100 text-farm-800 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="font-bold text-stone-900 text-sm">The Journey</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Processors, packagers, and drivers log each checkpoint as the harvest moves.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-lg bg-farm-100 text-farm-800 flex items-center justify-center font-bold text-sm">
              4
            </div>
            <h3 className="font-bold text-stone-900 text-sm">Scan & Know</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Scan with your phone to see the full timeline—no app, crypto, or login needed.
            </p>
          </div>
        </div>
      </section>

      {/* Honest Pledge Callout */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-stone-900 text-stone-100 rounded-2xl p-6 sm:p-8 border border-stone-800 space-y-4">
          <div className="flex items-center space-x-2 text-farm-400 font-bold text-sm">
            <HeartHandshake className="w-5 h-5 text-farm-400 shrink-0" />
            <span>Our Pledge on Honesty & Food Truth</span>
          </div>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            Technology should create trust, not marketing hype. Blockchain keeps our records tamper-proof once logged, but genuine food trust starts with honest farmers and ethical cooperatives. We show you who logged each step so you can see the real people behind your harvest.
          </p>
        </div>
      </section>

      {/* Featured Batches Preview */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900">Featured Harvests</h2>
            <p className="text-stone-500 text-xs">Try verifying these live prototype batches.</p>
          </div>
          <Link
            to="/verify"
            className="inline-flex items-center space-x-1 text-xs font-semibold text-farm-700 hover:text-farm-800"
          >
            <span>Scan custom QR</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          {DEMO_BATCHES.map((batch) => (
            <div
              key={batch.batchId}
              className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs hover:border-farm-400 transition flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-800">
                    {batch.batchId}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-farm-50 text-farm-800 border border-farm-200">
                    {batch.events.length} Checkpoints
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-stone-900 text-base">{batch.productName}</h3>
                  <p className="text-xs text-stone-500">{batch.organizationName}</p>
                </div>

                <div className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-100 space-y-0.5">
                  <p><strong>Origin:</strong> {batch.originLocation}</p>
                  <p><strong>Harvested:</strong> {new Date(batch.harvestDate * 1000).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                <Link
                  to={`/verify/${batch.batchId}`}
                  className="flex items-center space-x-1 text-xs font-bold text-farm-700 hover:text-farm-800"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Verify Harvest</span>
                </Link>
                <Link
                  to={`/batches/${batch.batchId}`}
                  className="text-xs text-stone-400 hover:text-stone-700 font-medium"
                >
                  Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
