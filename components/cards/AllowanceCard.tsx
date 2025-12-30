/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useWeb3Store } from "@/lib/web3Store";
import { ethers } from "ethers";
import { showToast } from "@/components/ToastProvider";

export default function AllowanceManagerCard() {
  const { contract, account } = useWeb3Store();
  const [owner, setOwner] = useState("");
  const [spender, setSpender] = useState("");
  const [amount, setAmount] = useState("");
  const [currentAllowance, setCurrentAllowance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  // Auto-fill owner with connected wallet
  useEffect(() => {
    if (account) {
      setOwner(account);
    }
  }, [account]);

  const checkAllowance = async () => {
    if (!contract) {
      showToast("Contract not loaded", "error");
      return;
    }
    if (!owner || !spender) {
      showToast("Please fill both addresses", "error");
      return;
    }
    if (!ethers.isAddress(owner)) {
      showToast("Invalid owner address", "error");
      return;
    }
    if (!ethers.isAddress(spender)) {
      showToast("Invalid spender address", "error");
      return;
    }

    setChecking(true);
    try {
      const allowance = await contract.allowance(owner, spender);
      const formatted = ethers.formatUnits(allowance, 18);
      setCurrentAllowance(formatted);
      showToast("Allowance fetched successfully", "success");
    } catch (error: any) {
      console.error("Check allowance error:", error);
      showToast("Failed to fetch allowance", "error");
      setCurrentAllowance(null);
    } finally {
      setChecking(false);
    }
  };

  const handleApprove = async () => {
    if (!account) {
      showToast("Please connect your wallet", "error");
      return;
    }
    if (!contract) {
      showToast("Contract not loaded", "error");
      return;
    }
    if (!spender) {
      showToast("Enter spender address", "error");
      return;
    }
    if (!ethers.isAddress(spender)) {
      showToast("Invalid spender address", "error");
      return;
    }

    let value: bigint;
    try {
      if (!amount || parseFloat(amount) < 0) {
        showToast("Enter a valid amount ≥ 0", "error");
        return;
      }
      value = ethers.parseUnits(amount.trim(), 18);
    } catch {
      showToast("Invalid amount format", "error");
      return;
    }

    setLoading(true);
    try {
      showToast("Sending approval transaction...", "info");

      const tx = await contract.approve(spender, value);
      showToast("Waiting for confirmation...", "info");

      await tx.wait(1);

      const action = value === BigInt(0) ? "revoked" : "set";
      showToast(`Allowance ${action} successfully!`, "success");

      setAmount(""); 
      setCurrentAllowance(null);
    } catch (error: any) {
      console.error("Approve error:", error);

      let msg = "Approval failed";
      if (error?.message?.includes("user rejected")) {
        msg = "Transaction rejected by user";
      } else if (error?.reason) {
        msg = error.reason;
      } else if (error?.data?.message) {
        msg = error.data.message;
      }

      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUseMyAddress = () => {
    if (account) {
      setOwner(account);
      showToast("Owner set to your address", "info");
    } else {
      showToast("No wallet connected", "error");
    }
  };

  // Reset current allowance when spender changes
  useEffect(() => {
    setCurrentAllowance(null);
  }, [spender]);

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col flex-1">
        <div className="w-12 h-1 bg-blue-600 mb-6" />
        <h3 className="text-lg font-bold italic mb-8 tracking-widest">ALLOWANCE MANAGER</h3>

        <div className="space-y-4">
          {/* Owner Address */}
          <div className="relative">
            <input
              className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-blue-600 outline-none font-mono text-sm placeholder:text-white/30"
              placeholder="Owner Address (0x...)"
              value={owner}
              onChange={(e) => setOwner(e.target.value.trim())}
              disabled={loading || checking}
            />
            {account && (
              <button
                onClick={handleUseMyAddress}
                disabled={loading || checking}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-400 hover:text-blue-300 font-bold italic tracking-wider transition-colors"
              >
                Use my address
              </button>
            )}
          </div>

          {/* Spender Address */}
          <input
            className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-blue-600 outline-none font-mono text-sm placeholder:text-white/30"
            placeholder="Spender Address (0x...)"
            value={spender}
            onChange={(e) => setSpender(e.target.value.trim())}
            disabled={loading || checking}
          />

          {/* Amount + Check Button */}
          <div className="flex gap-3">
            <input
              className="flex-1 bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-blue-600 outline-none font-mono text-sm placeholder:text-white/30"
              placeholder="New Amount (PC) — 0 to revoke"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              step="any"
              min="0"
              disabled={loading || checking}
            />
            <button
              onClick={checkAllowance}
              disabled={checking || loading || !owner || !spender}
              className="px-6 py-5 bg-blue-600/20 rounded-2xl font-black italic tracking-widest text-blue-400 hover:bg-blue-600/30 disabled:opacity-50 transition-all"
            >
              {checking ? "..." : "CHECK"}
            </button>
          </div>
        </div>

        {/* Current Allowance Display */}
        {currentAllowance !== null && (
          <div className="mt-8 text-center">
            <p className="text-white/60 text-sm mb-2">Current Allowance</p>
            <p className="text-4xl font-black italic text-blue-400 tracking-wider">
              {parseFloat(currentAllowance).toFixed(6)} PC
            </p>
          </div>
        )}

        {/* Approve / Revoke Button */}
        <button
          onClick={handleApprove}
          disabled={loading || checking || !account || !spender || !amount}
          className="mt-auto w-full py-5 rounded-2xl font-black uppercase italic tracking-widest text-black bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-400 transition-all"
        >
          {loading
            ? "PROCESSING..."
            : amount === "0" || amount === ""
            ? "REVOKE ALLOWANCE"
            : "SET ALLOWANCE"}
        </button>
      </div>
    </div>
  );
}