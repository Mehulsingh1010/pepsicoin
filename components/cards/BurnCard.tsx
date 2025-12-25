/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useWeb3Store } from "@/lib/web3Store";
import { ethers } from "ethers";
import { showToast } from "@/components/ToastProvider";

export default function BurnCard() {
  const { contract, account, refreshBalance } = useWeb3Store();
  const [amt, setAmt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBurn = async () => {
    if (!amt || parseFloat(amt) <= 0) return showToast("Enter valid amount", "error");

    setLoading(true);
    try {
      const tx = await contract?.burn(ethers.parseUnits(amt, 18));
      showToast("Burning...", "info");
      await tx?.wait();
      showToast("Tokens burned!", "success");
      setAmt("");
      await refreshBalance();
    } catch (e: any) {
      showToast(e.message || "Burn failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] border h-full border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between">
      <div>
        <div className="w-12 h-1 bg-red-600 mb-6" />
        <h3 className="text-lg font-bold italic mb-6 tracking-widest">BURN TOKENS</h3>
        <input
          className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-red-600 outline-none font-mono text-sm mb-4"
          placeholder="Amount to burn"
          type="number"
          value={amt}
          onChange={(e) => setAmt(e.target.value)}
        />
      </div>
      <button
        onClick={handleBurn}
        disabled={loading || !account || !amt}
        className="cursor-pointer mt-auto w-full py-5 rounded-2xl font-black uppercase italic tracking-widest text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-all"
      >
        {loading ? "BURNING..." : "BURN PC"}
      </button>
    </div>
  );
}