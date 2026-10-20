import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { WalletState } from "../types";
import {
  checkIsOrganization,
  getContractAddress,
  isContractConfigured,
  SEPOLIA_CHAIN_ID,
  switchOrAddSepolia,
} from "../services/web3Service";
import { FARMTRACE_ABI } from "../contracts/contractData";

interface Web3ContextType {
  wallet: WalletState;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToSepolia: () => Promise<void>;
  contractAddress: string;
  isContractReady: boolean;
  formatAddress: (addr?: string | null) => string;
  checkStageAuth: (stage: number) => Promise<boolean>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
    isSepolia: false,
    isOrganization: false,
    isOwner: false,
    error: null,
  });

  const contractAddress = getContractAddress();
  const isContractReady = isContractConfigured();

  const formatAddress = (addr?: string | null): string => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const updateWalletState = useCallback(async (accounts: string[], chainIdHex?: string) => {
    if (!accounts || accounts.length === 0) {
      setWallet({
        address: null,
        chainId: null,
        isConnected: false,
        isConnecting: false,
        isSepolia: false,
        isOrganization: false,
        isOwner: false,
        error: null,
      });
      return;
    }

    const currentAccount = accounts[0];
    let currentChainId: number | null = null;

    if (chainIdHex) {
      currentChainId = parseInt(chainIdHex, 16);
    } else if (window.ethereum) {
      const hex = await window.ethereum.request({ method: "eth_chainId" });
      currentChainId = parseInt(hex, 16);
    }

    const isSepolia = currentChainId === SEPOLIA_CHAIN_ID || currentChainId === 31337;
    let isOrg = false;
    let isOwn = false;

    if (isContractConfigured() && currentAccount) {
      try {
        isOrg = await checkIsOrganization(currentAccount);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(getContractAddress(), FARMTRACE_ABI, provider);
        const owner = await contract.owner();
        isOwn = owner.toLowerCase() === currentAccount.toLowerCase();
      } catch (e) {
        console.warn("Could not check role status:", e);
      }
    }

    setWallet({
      address: currentAccount,
      chainId: currentChainId,
      isConnected: true,
      isConnecting: false,
      isSepolia,
      isOrganization: isOrg,
      isOwner: isOwn,
      error: !isSepolia ? "Please switch your network to Ethereum Sepolia Testnet" : null,
    });
  }, []);

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setWallet((prev) => ({
        ...prev,
        error: "MetaMask extension not found. Please install MetaMask to interact with the blockchain.",
      }));
      return;
    }

    setWallet((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      const accounts: string[] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const chainIdHex: string = await window.ethereum.request({
        method: "eth_chainId",
      });
      await updateWalletState(accounts, chainIdHex);
    } catch (err: any) {
      console.error("MetaMask connection failed:", err);
      setWallet((prev) => ({
        ...prev,
        isConnecting: false,
        error: err.code === 4001 ? "Wallet connection rejected by user." : err.message || "Failed to connect wallet.",
      }));
    }
  };

  const disconnectWallet = () => {
    setWallet({
      address: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
      isSepolia: false,
      isOrganization: false,
      isOwner: false,
      error: null,
    });
  };

  const switchToSepolia = async () => {
    try {
      await switchOrAddSepolia();
      if (wallet.address) {
        await updateWalletState([wallet.address]);
      }
    } catch (err: any) {
      console.error("Switching to Sepolia failed:", err);
      setWallet((prev) => ({
        ...prev,
        error: err.message || "Failed to switch network.",
      }));
    }
  };

  const checkStageAuth = async (stage: number): Promise<boolean> => {
    if (!wallet.address || !isContractConfigured()) return false;
    if (wallet.isOrganization || wallet.isOwner) return true;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(getContractAddress(), FARMTRACE_ABI, provider);
      return await contract.isAuthorizedForStage(wallet.address, stage);
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      // Check if already authorized
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            updateWalletState(accounts);
          }
        })
        .catch(console.warn);

      const handleAccountsChanged = (accounts: string[]) => {
        updateWalletState(accounts);
      };

      const handleChainChanged = (chainIdHex: string) => {
        if (wallet.address) {
          updateWalletState([wallet.address], chainIdHex);
        }
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
          window.ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, [updateWalletState, wallet.address]);

  return (
    <Web3Context.Provider
      value={{
        wallet,
        connectWallet,
        disconnectWallet,
        switchToSepolia,
        contractAddress,
        isContractReady,
        formatAddress,
        checkStageAuth,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = (): Web3ContextType => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};
