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
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";

export const Navbar: React.FC = () => {
  const { wallet, connectWallet, disconnectWallet, switchToSepolia, formatAddress, contractAddress } = useWeb3();
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-farm-600 flex items-center justify-center text-white shadow-sm shadow-farm-600/30 group-hover:bg-farm-700 transition">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-stone-900 group-hover:text-farm-700 transition">
                Farm<span className="text-farm-600">Trace</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-farm-100 text-farm-800 rounded">
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
                    ? "bg-farm-50 text-farm-700"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
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
              className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg bg-farm-50 text-farm-700 border border-farm-200 hover:bg-farm-100 transition shadow-xs"
            >
              <Search className="w-4 h-4 text-farm-600" />
              <span>Verify Product</span>
            </Link>

            {/* Network / Wallet Status */}
            {wallet.isConnected ? (
              <div className="relative">
                {wallet.isSepolia ? (
                  <button
                    onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-stone-200 bg-white hover:bg-stone-50 transition"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-mono text-xs">{formatAddress(wallet.address)}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                  </button>
                ) : (
                  <button
                    onClick={switchToSepolia}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition animate-bounce"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Switch to Sepolia</span>
                  </button>
                )}

                {/* Dropdown Menu */}
                {walletDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-stone-200 py-2 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-stone-100">
                      <p className="text-stone-400 font-medium">Connected Wallet</p>
                      <p className="font-mono text-stone-800 font-semibold truncate">{wallet.address}</p>
                      <div className="mt-1 flex items-center space-x-1">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 font-medium">
                          Sepolia (11155111)
                        </span>
                        {wallet.isOrganization && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-farm-100 text-farm-800 font-medium">
                            Authorized Org
                          </span>
                        )}
                        {wallet.isOwner && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-800 font-medium">
                            Contract Owner
                          </span>
                        )}
                      </div>
                    </div>

                    <a
                      href={`https://sepolia.etherscan.io/address/${wallet.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-3 py-2 text-stone-700 hover:bg-stone-50 transition"
                    >
                      <span>View on Sepolia Etherscan</span>
                      <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                    </a>

                    {contractAddress && contractAddress !== "0x0000000000000000000000000000000000000000" && (
                      <a
                        href={`https://sepolia.etherscan.io/address/${contractAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-3 py-2 text-stone-700 hover:bg-stone-50 transition"
                      >
                        <span>Contract Address</span>
                        <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                      </a>
                    )}

                    <div className="border-t border-stone-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          disconnectWallet();
                          setWalletDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 transition"
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
                className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg bg-farm-600 hover:bg-farm-700 text-white shadow-sm shadow-farm-600/30 transition disabled:opacity-50"
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
              className="p-2 text-farm-700 bg-farm-50 rounded-lg border border-farm-200"
              title="Verify Product"
            >
              <Search className="w-5 h-5" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-5 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-base font-medium ${
                  isActive(link.path)
                    ? "bg-farm-50 text-farm-700 font-semibold"
                    : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-2 border-t border-stone-100 flex flex-col space-y-2">
            <Link
              to="/verify"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center space-x-2 w-full py-2.5 rounded-lg bg-farm-50 text-farm-700 font-semibold border border-farm-200"
            >
              <Search className="w-4 h-4" />
              <span>Verify Product by Batch ID</span>
            </Link>

            {wallet.isConnected ? (
              <div className="p-3 bg-stone-50 rounded-lg space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Connected:</span>
                  <span className="font-mono font-bold">{formatAddress(wallet.address)}</span>
                </div>
                {!wallet.isSepolia && (
                  <button
                    onClick={switchToSepolia}
                    className="w-full py-2 bg-amber-500 text-white rounded font-bold text-center"
                  >
                    Switch to Sepolia Network
                  </button>
                )}
                <button
                  onClick={disconnectWallet}
                  className="w-full text-center text-red-600 font-medium py-1"
                >
                  Disconnect Wallet
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-farm-600 text-white font-semibold"
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
