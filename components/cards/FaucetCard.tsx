/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useWeb3Store } from "@/lib/web3Store";
import { showToast } from "@/components/ToastProvider";
import { useState } from "react";

export default function FaucetCard() {
  const { account, contract, timeUntilNext, faucetRemaining, refreshBalance, updateFaucetInfo } = useWeb3Store();
  const [loading, setLoading] = useState(false);

  const formatTime = (seconds: number) => {
    if (seconds === 0) return "Available now!";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h ? h + "h " : ""}${m}m ${s}s`;
  };

  const handleFaucet = async () => {
    setLoading(true);
    try {
      const tx = await contract?.faucet();
      showToast("Claiming 100 PC...", "info");
      await tx?.wait();
      showToast("100 PC claimed!", "success");
      await Promise.all([refreshBalance(), updateFaucetInfo()]);
    } catch (e: any) {
      showToast(e.message || "Faucet failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between">
      <div>
        <div className="w-12 h-1 bg-blue-600 mb-6" />
        <h3 className="text-lg font-bold italic mb-6 tracking-widest">FREE FAUCET</h3>
        <div className="space-y-4 text-center">
          <p className="text-sm text-gray-400">Claim 100 PC daily</p>
          <p className="text-3xl font-black text-blue-400">{faucetRemaining}</p>
          <p className="text-xs text-gray-500">PC remaining (lifetime)</p>
          <p className="text-sm mt-4 text-green-400 font-mono">
            {timeUntilNext === 0 ? "Ready to claim!" : `Next claim in: ${formatTime(timeUntilNext)}`}
          </p>
        </div>
      </div>
      <button
        onClick={handleFaucet}
        disabled={loading || !account || timeUntilNext > 0}
        className="cursor-pointer mt-6 w-full py-5 rounded-2xl font-black uppercase italic tracking-widest text-black bg-blue-500 disabled:opacity-50 hover:bg-blue-400 transition-all"
      >
        {loading ? "CLAIMING..." : timeUntilNext > 0 ? "WAIT" : "CLAIM 100 PC"}
      </button>
    </div>
  );
}