import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sprout,
  Search,
  Wallet,
  AlertTriangle,
  Menu,
  X,
  ExternalLink,
  Users,
  PlusCircle,
  Activity,
  Layers,
  ChevronDown,
  Zap,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";

export const Navbar: React.FC = () => {
  const { wallet, connectWallet, disconnectWallet, switchToSepolia, switchToLocalhost, formatAddress, contractAddress } = useWeb3();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Dashboard", path: "/dashboard", icon: Activity },
    { name: "Farmers", path: "/farmers", icon: Users },
    { name: "Register Batch", path: "/register-batch", icon: PlusCircle },
    { name: "Supply Chain", path: "/supply-chain", icon: Layers },
    { name: "About", path: "/about" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#070b09]/90 backdrop-blur-md border-b border-[#18251e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-farm-600 flex items-center justify-center text-white shadow-lg shadow-farm-600/30 group-hover:bg-farm-500 transition">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-farm-400 transition">
                Farm<span className="text-farm-400">Trace</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-farm-950/80 text-farm-300 border border-farm-800/80 rounded">
                Sepolia
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                  isActive(link.path)
                    ? "bg-farm-950/70 text-farm-300 border border-farm-800/60"
                    : "text-stone-300 hover:text-white hover:bg-[#121c17]"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* Consumer Verify CTA */}
            <Link
              to="/verify"
              className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg bg-farm-950/60 text-farm-300 border border-farm-800/80 hover:bg-farm-900/60 hover:text-white transition shadow-xs"
            >
              <Search className="w-4 h-4 text-farm-400" />
              <span>Verify Product</span>
            </Link>

            {/* Network / Wallet Status */}
            {wallet.isConnected ? (
              <div className="relative">
                {wallet.isSepolia ? (
                  <button
                    onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-[#18251e] bg-[#0d1410] text-stone-200 hover:bg-[#14201a] hover:border-farm-700/60 transition"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                    <span className="font-mono text-xs">{formatAddress(wallet.address)}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                  </button>
                ) : (
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={switchToLocalhost}
                      className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-farm-950/70 text-farm-300 border border-farm-800/80 hover:bg-farm-900/60 transition"
                      title="Switch MetaMask to Hardhat Localhost (31337)"
                    >
                      <Zap className="w-3.5 h-3.5 text-farm-400" />
                      <span>Localhost 8545</span>
                    </button>
                    <button
                      onClick={switchToSepolia}
                      className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#14201a] text-stone-300 border border-[#18251e] hover:bg-[#1a2b22] hover:text-white transition"
                      title="Switch MetaMask to Sepolia"
                    >
                      <span>Sepolia</span>
                    </button>
                  </div>
                )}

                {/* Dropdown Menu */}
                {walletDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#0d1410] rounded-xl shadow-2xl border border-[#18251e] py-2 z-50 text-xs text-stone-200 backdrop-blur-md">
                    <div className="px-3 py-2 border-b border-[#18251e]">
                      <p className="text-stone-400 font-medium">Connected Wallet</p>
                      <p className="font-mono text-white font-semibold truncate">{wallet.address}</p>
                      <div className="mt-1.5 flex items-center space-x-1">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-medium">
                          {wallet.chainId === 31337 ? "Localhost (31337)" : "Sepolia (11155111)"}
                        </span>
                        {wallet.isOrganization && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-farm-950/80 text-farm-300 border border-farm-800/60 font-medium">
                            Authorized Org
                          </span>
                        )}
                        {wallet.isOwner && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-purple-950/80 text-purple-300 border border-purple-800/60 font-medium">
                            Contract Owner
                          </span>
                        )}
                      </div>
                    </div>

                    <a
                      href={`https://sepolia.etherscan.io/address/${wallet.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-3 py-2 text-stone-300 hover:bg-[#14201a] hover:text-white transition"
                    >
                      <span>View on Sepolia Etherscan</span>
                      <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                    </a>

                    {contractAddress && contractAddress !== "0x0000000000000000000000000000000000000000" && (
                      <a
                        href={`https://sepolia.etherscan.io/address/${contractAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-3 py-2 text-stone-300 hover:bg-[#14201a] hover:text-white transition"
                      >
                        <span>Contract Address</span>
                        <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                      </a>
                    )}

                    <div className="border-t border-[#18251e] mt-1 pt-1">
                      <button
                        onClick={() => {
                          disconnectWallet();
                          setWalletDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition"
                      >
                        Disconnect Wallet
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={wallet.isConnecting}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg bg-farm-600 hover:bg-farm-500 text-white shadow-lg shadow-farm-600/30 transition disabled:opacity-50"
              >
                <Wallet className="w-4 h-4" />
                <span>{wallet.isConnecting ? "Connecting..." : "Connect MetaMask"}</span>
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex sm:hidden items-center space-x-2">
            <Link
              to="/verify"
              className="p-2 text-farm-300 bg-farm-950/80 rounded-lg border border-farm-800/80"
              title="Verify Product"
            >
              <Search className="w-5 h-5" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-300 hover:text-white rounded-lg hover:bg-[#121c17]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-[#18251e] bg-[#070b09] px-4 pt-3 pb-5 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-base font-medium ${
                  isActive(link.path)
                    ? "bg-farm-950/70 text-farm-300 font-semibold border border-farm-800/60"
                    : "text-stone-300 hover:bg-[#121c17] hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-2 border-t border-[#18251e] flex flex-col space-y-2">
            <Link
              to="/verify"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center space-x-2 w-full py-2.5 rounded-lg bg-farm-950/70 text-farm-300 font-semibold border border-farm-800/80"
            >
              <Search className="w-4 h-4" />
              <span>Verify Product by Batch ID</span>
            </Link>

            {wallet.isConnected ? (
              <div className="p-3 bg-[#0d1410] border border-[#18251e] rounded-lg space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Connected:</span>
                  <span className="font-mono font-bold text-white">{formatAddress(wallet.address)}</span>
                </div>
                {!wallet.isSepolia && (
                  <button
                    onClick={switchToSepolia}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold text-center"
                  >
                    Switch to Sepolia Network
                  </button>
                )}
                <button
                  onClick={disconnectWallet}
                  className="w-full text-center text-rose-400 hover:text-rose-300 font-medium py-1"
                >
                  Disconnect Wallet
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-farm-600 hover:bg-farm-500 text-white font-semibold"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect MetaMask</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
