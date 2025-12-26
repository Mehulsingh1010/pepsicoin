/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useWeb3Store } from "@/lib/web3Store";
import { ethers } from "ethers";
import { showToast } from "@/components/ToastProvider";

export default function BurnCard() {
  const { contract, account, balance, refreshBalance } = useWeb3Store();
  const [amt, setAmt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBurn = async () => {
    if (!account) {
      showToast("Wallet not connected", "error");
      return;
    }

    if (!amt || parseFloat(amt) <= 0) {
      showToast("Enter a valid amount greater than 0", "error");
      return;
    }

    let amountBigInt;
    try {
      amountBigInt = ethers.parseUnits(amt.trim(), 18);
    } catch {
      showToast("Invalid amount format", "error");
      return;
    }

    const balanceBigInt = ethers.parseUnits(balance || "0", 18);

    if (amountBigInt > balanceBigInt) {
      showToast(`Insufficient balance. You have ${balance} PC`, "error");
      return;
    }

    setLoading(true);

    try {
      const tx = await contract?.burn(amountBigInt);
      showToast("Burning tokens...", "info");
      await tx?.wait(1);

      showToast("Tokens burned successfully!", "success");
      setAmt("");
      await refreshBalance();
    } catch (e: any) {
      console.error("Burn error:", e);

      let message = "Burn failed";
      if (e?.reason) message = e.reason;
      else if (e?.message?.includes("user rejected")) message = "Transaction rejected by user";

      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between h-full">
      <div>
        <div className="w-12 h-1 bg-red-600 mb-6" />
        <h3 className="text-lg font-bold italic mb-6 tracking-widest">BURN TOKENS</h3>
        
        <input
          className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-red-600 outline-none font-mono text-sm placeholder:text-white/30 mb-4"
          placeholder="Amount to burn (PC)"
          type="number"
          step="any"
          min="0"
          value={amt}
          onChange={(e) => setAmt(e.target.value)}
          disabled={loading}
        />

      
      </div>

      <button
        onClick={handleBurn}
        disabled={loading || !account || !amt}
        className="cursor-pointer mt-auto w-full py-5 rounded-2xl font-black uppercase italic tracking-widest text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? "BURNING..." : "BURN PC"}
      </button>
    </div>
  );
}