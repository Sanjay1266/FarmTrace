import React from "react";
import {
  ShieldAlert,
  Lock,
  Layers,
  Database,
  Globe,
  HeartHandshake,
} from "lucide-react";

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Our Philosophy & How It Works
        </h1>
        <p className="text-stone-400 text-sm">
          A grounded, honest look at agricultural traceability on the blockchain.
        </p>
      </div>

      {/* Honest Food Trust Callout */}
      <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-2xl p-6 sm:p-8 space-y-3 shadow-xl">
        <div className="flex items-center space-x-2.5 text-emerald-300 font-bold text-base">
          <HeartHandshake className="w-5 h-5 text-farm-400" />
          <span>Why FarmTrace Exists</span>
        </div>
        <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
          Smallholder farmers and cooperatives often do the hard work of growing clean, authentic produce, but traditional supply chains obscure their identities. At the same time, consumers see vague marketing labels on supermarket shelves with no way to verify them. FarmTrace bridges this gap by giving cooperatives a simple, tamper-proof way to record harvests and let consumers verify them with a simple phone scan.
        </p>
      </div>

      {/* Core Technology Stack Overview */}
      <div className="bg-[#0d1410] rounded-2xl border border-[#18251e] p-6 sm:p-8 shadow-xl space-y-5">
        <h2 className="text-lg font-bold text-white pb-2 border-b border-[#18251e]">
          How the Technology Works
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-[#121c17] rounded-xl border border-[#18251e] space-y-1">
            <span className="font-bold text-white flex items-center space-x-1.5 text-xs">
              <Database className="w-4 h-4 text-farm-400" />
              <span>No Central Database</span>
            </span>
            <p className="text-stone-400 leading-relaxed">
              Records are stored directly on the Ethereum Sepolia smart contract. No single company or administrator can secretly alter or delete past history.
            </p>
          </div>

          <div className="p-4 bg-[#121c17] rounded-xl border border-[#18251e] space-y-1">
            <span className="font-bold text-white flex items-center space-x-1.5 text-xs">
              <Lock className="w-4 h-4 text-farm-400" />
              <span>Role-Based Checkpoints</span>
            </span>
            <p className="text-stone-400 leading-relaxed">
              Mills, packagers, and transport partners have specific permissions. For example, a batch cannot be marked as dispatched before it has been packaged.
            </p>
          </div>

          <div className="p-4 bg-[#121c17] rounded-xl border border-[#18251e] space-y-1">
            <span className="font-bold text-white flex items-center space-x-1.5 text-xs">
              <Globe className="w-4 h-4 text-farm-400" />
              <span>Free Public Verification</span>
            </span>
            <p className="text-stone-400 leading-relaxed">
              Anyone can scan a bag's QR code. It reads directly from the blockchain through public RPC nodes without needing MetaMask, apps, or cryptocurrency.
            </p>
          </div>

          <div className="p-4 bg-[#121c17] rounded-xl border border-[#18251e] space-y-1">
            <span className="font-bold text-white flex items-center space-x-1.5 text-xs">
              <Layers className="w-4 h-4 text-farm-400" />
              <span>Transparent Corrections</span>
            </span>
            <p className="text-stone-400 leading-relaxed">
              Mistakes happen. If a village name or grading is corrected, the contract preserves the original entry and records the reason, editor, and timestamp for all to see.
            </p>
          </div>
        </div>
      </div>

      {/* Prominent Real-World Limitations & Disclaimers */}
      <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-6 sm:p-8 space-y-4 text-amber-900 shadow-xl">
        <div className="flex items-center space-x-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <h3 className="text-base font-bold text-amber-300">What Blockchain Can and Cannot Do</h3>
        </div>

        <div className="space-y-2.5 text-xs leading-relaxed text-amber-200/90">
          <p>
            <strong className="text-amber-200">What we guarantee:</strong> Once a record is written to Ethereum, no one can quietly alter the harvest date, edit who signed the transaction, or wipe out the history.
          </p>
          <p>
            <strong className="text-amber-200">What requires real-world trust:</strong> Blockchain software cannot test soil chemistry, verify physical organic farming practices on the ground, or prevent physical food substitution without tamper-evident packaging. Trust ultimately relies on reputable cooperatives, transparent actors, and verified identity declarations.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-[#0d1410] rounded-2xl border border-[#18251e] p-6 sm:p-8 shadow-xl space-y-5">
        <h2 className="text-lg font-bold text-white pb-2 border-b border-[#18251e]">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4 text-xs">
          <div>
            <h4 className="font-bold text-white text-sm">Do consumers need a crypto wallet?</h4>
            <p className="text-stone-400 mt-1 leading-relaxed">
              No. Anyone with a smartphone camera or browser can scan the QR code and view the full history instantly without any fees or extensions.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm">Why Ethereum Sepolia?</h4>
            <p className="text-stone-400 mt-1 leading-relaxed">
              Sepolia is Ethereum's primary public testnet. It runs the exact same smart contract logic and security guarantees as the Ethereum mainnet, allowing cooperatives to test and prototype with zero financial barriers.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm">Can bad actors submit fake records?</h4>
            <p className="text-stone-400 mt-1 leading-relaxed">
              Only authorized wallet addresses registered by an organization administrator can log stages. If someone enters inaccurate information, their wallet signature is permanently attached to the record, creating accountability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
