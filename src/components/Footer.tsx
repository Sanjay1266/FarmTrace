import React from "react";
import { Link } from "react-router-dom";
import { Sprout, ExternalLink, HeartHandshake } from "lucide-react";
import { useWeb3 } from "../context/Web3Context";

export const Footer: React.FC = () => {
  const { contractAddress } = useWeb3();

  return (
    <footer className="bg-[#050806] text-stone-300 mt-20 border-t border-[#18251e]">
      {/* Integrity & Honesty Callout */}
      <div className="bg-[#080d0a] border-b border-[#18251e] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2.5 text-xs text-stone-400">
            <HeartHandshake className="w-4 h-4 text-farm-400 shrink-0" />
            <p>
              <span className="font-semibold text-stone-200">Our Honesty Guarantee: </span>
              Blockchain keeps our records tamper-proof once logged, but genuine food trust starts with honest farmers and ethical cooperatives. We show you who logged each step so you can see the real people behind your harvest.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-farm-600 flex items-center justify-center text-white shadow-md shadow-farm-600/30">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Farm<span className="text-farm-400">Trace</span>
              </span>
            </div>
            <p className="text-stone-400 text-xs max-w-sm leading-relaxed">
              Transparent, tamper-proof agricultural tracking from family farms to your table. Built for farmer cooperatives and conscious consumers on Ethereum Sepolia.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-xs font-bold tracking-wider uppercase mb-3">Explore</h4>
            <ul className="space-y-1.5 text-xs text-stone-400">
              <li>
                <Link to="/verify" className="hover:text-farm-400 transition">Verify a Harvest</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-farm-400 transition">Organization Dashboard</Link>
              </li>
              <li>
                <Link to="/farmers" className="hover:text-farm-400 transition">Farmers Directory</Link>
              </li>
              <li>
                <Link to="/register-batch" className="hover:text-farm-400 transition">Register Batch</Link>
              </li>
              <li>
                <Link to="/supply-chain" className="hover:text-farm-400 transition">Supply-Chain Tracking</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-farm-400 transition">Our Philosophy</Link>
              </li>
            </ul>
          </div>

          {/* Blockchain & Sepolia Resources */}
          <div>
            <h4 className="text-white text-xs font-bold tracking-wider uppercase mb-3">Network</h4>
            <ul className="space-y-1.5 text-xs text-stone-400">
              <li>
                <span className="text-stone-500">Chain:</span>{" "}
                <span className="font-mono text-stone-300">Ethereum Sepolia (11155111)</span>
              </li>
              {contractAddress && contractAddress !== "0x0000000000000000000000000000000000000000" && (
                <li>
                  <a
                    href={`https://sepolia.etherscan.io/address/${contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 hover:text-farm-400 transition font-mono"
                  >
                    <span>{`${contractAddress.slice(0, 8)}...${contractAddress.slice(-6)}`}</span>
                    <ExternalLink className="w-3 h-3 text-stone-500" />
                  </a>
                </li>
              )}
              <li>
                <a
                  href="https://sepoliafaucet.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 hover:text-farm-400 transition"
                >
                  <span>Sepolia Test Faucet</span>
                  <ExternalLink className="w-3 h-3 text-stone-500" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-[#18251e] text-xs text-stone-500 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© {new Date().getFullYear()} FarmTrace. An open-source agricultural traceability initiative.</p>
          <p>Built for smallholders, cooperatives, and honest food supply chains.</p>
        </div>
      </div>
    </footer>
  );
};
