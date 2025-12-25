"use client";

import { create } from "zustand";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/constants/contract";
import { showToast } from "@/components/ToastProvider";

export const useWeb3Store = create((set, get) => ({
  account: null,
  balance: "0",
  isConnected: false,
  contract: null,
  tokenData: { name: "PepsiCoin", symbol: "PC", totalSupply: "0" },
  provider: null,
  timeUntilNext: 0,
  faucetRemaining: "0",
  isOwner: false,
  contractOwner: null,

  connectWallet: async () => {
    if (!window.ethereum) {
      showToast("MetaMask not installed", "error");
      return false;
    }

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (!accounts || accounts.length === 0) {
        showToast("No accounts found", "error");
        return false;
      }

      let provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const sepoliaChainId = 11155111n;

      if (network.chainId !== sepoliaChainId) {
        try {
          await provider.send("wallet_switchEthereumChain", [{ chainId: "0xaa36a7" }]);
          showToast("Switched to Sepolia Testnet", "success");
        } catch (switchError) {
          if (switchError.code === 4902) {
            try {
              await provider.send("wallet_addEthereumChain", [{
                chainId: "0xaa36a7",
                chainName: "Sepolia Testnet",
                nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://rpc.sepolia.org"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              }]);
              showToast("Added & switched to Sepolia", "success");
            } catch {
              showToast("Failed to add Sepolia network", "error");
              return false;
            }
          } else {
            showToast("Please switch to Sepolia manually", "error");
            return false;
          }
        }
        provider = new ethers.BrowserProvider(window.ethereum);
      }

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      let contractOwner = null;
      let isOwner = false;
      try {
        contractOwner = await contract.owner();
        isOwner = contractOwner.toLowerCase() === accounts[0].toLowerCase();
      } catch (e) {
        console.warn("Could not fetch owner", e);
      }

      set({
        account: accounts[0],
        isConnected: true,
        contract,
        provider,
        isOwner,
        contractOwner,
      });

      await get().fetchMetadata();
      await get().refreshBalance();
      await get().updateFaucetInfo();

      if (isOwner) showToast("Connected as OWNER", "success");

      window.ethereum.on("accountsChanged", get().handleAccountsChanged);
      window.ethereum.on("chainChanged", () => window.location.reload());

      return true;
    } catch (err) {
      showToast(err.message || "Connection failed", "error");
      return false;
    }
  },

  handleAccountsChanged: (accounts) => {
    if (!accounts || accounts.length === 0) {
      set({
        account: null,
        isConnected: false,
        contract: null,
        balance: "0",
        provider: null,
        timeUntilNext: 0,
        faucetRemaining: "0",
        isOwner: false,
        contractOwner: null,
      });
      showToast("Wallet disconnected", "info");
      return;
    }

    const newAccount = accounts[0];
    if (newAccount === get().account) return;

    const { contractOwner } = get();
    const isOwner = contractOwner ? contractOwner.toLowerCase() === newAccount.toLowerCase() : false;

    set({ account: newAccount, isOwner });
    showToast(`Switched to ${newAccount.slice(0, 6)}...${newAccount.slice(-4)}`, "info");
    if (isOwner) showToast("You are the OWNER", "success");

    get().refreshBalance();
    get().updateFaucetInfo();
  },

  disconnectWallet: () => {
    if (window.ethereum) {
      window.ethereum.removeListener("accountsChanged", get().handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", () => window.location.reload);
    }

    set({
      account: null,
      isConnected: false,
      contract: null,
      balance: "0",
      provider: null,
      timeUntilNext: 0,
      faucetRemaining: "0",
      isOwner: false,
      contractOwner: null,
    });
    showToast("Disconnected", "info");
  },

  fetchMetadata: async () => {
    const { contract } = get();
    if (!contract) return;

    try {
      const [name, symbol, total] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.totalSupply(),
      ]);
      set({
        tokenData: {
          name,
          symbol,
          totalSupply: ethers.formatUnits(total, 18),
        },
      });
    } catch (e) {
      console.warn("Metadata fetch failed", e);
    }
  },

  refreshBalance: async () => {
    const { contract, account } = get();
    if (!contract || !account) return;

    try {
      const bal = await contract.balanceOf(account);
      set({ balance: ethers.formatUnits(bal, 18) });
    } catch (e) {
      console.warn("Balance fetch failed", e);
    }
  },

  updateFaucetInfo: async () => {
    const { contract, account } = get();
    if (!contract || !account) return;

    try {
      const [timeLeft, remaining] = await Promise.all([
        contract.timeUntilNextFaucet(account),
        contract.faucetRemaining(account),
      ]);
      set({
        timeUntilNext: Number(timeLeft),
        faucetRemaining: ethers.formatUnits(remaining, 18),
      });
    } catch (e) {
      console.warn("Faucet info failed", e);
    }
  },
}));