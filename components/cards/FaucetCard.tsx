/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useWeb3Store } from "@/lib/web3Store";
import { showToast } from "@/components/ToastProvider";

export default function FaucetCard() {
  const {
    account,
    contract,
    timeUntilNext,
    faucetRemaining,
    refreshBalance,
    updateFaucetInfo,
  } = useWeb3Store();

  const [loading, setLoading] = useState(false);

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "Available now!";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h ? `${h}h ` : ""}${m.toString().padStart(2, "0")}m ${s
      .toString()
      .padStart(2, "0")}s`;
  };

  const handleFaucet = async () => {
    if (!account || !contract) {
      showToast("Connect wallet to claim", "error");
      return;
    }

    setLoading(true);
    try {
      const tx = await contract.faucet();
      showToast("Claiming 100 PC...", "info");
      await tx.wait(1);
      showToast("100 PC claimed successfully!", "success");
      await Promise.all([refreshBalance(), updateFaucetInfo()]);
    } catch (e: any) {
      console.error("Faucet error:", e);
      const msg =
        e?.reason ||
        (e?.data?.data?.startsWith("0xd045e874")
          ? "Cannot claim: cooldown active or lifetime limit reached"
          : e?.message?.includes("user rejected")
          ? "Transaction rejected"
          : "Claim failed — try again later");
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const displayRemaining = faucetRemaining
    ? Number(faucetRemaining).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })
    : "0";

  const isReady = account && timeUntilNext === 0;
  const isCooldown = account && timeUntilNext > 0;

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col justify-between">
      {/* Blue blur accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10">
        <div className="w-12 h-1 bg-blue-600 mb-6" />
        <h3 className="text-lg font-bold italic mb-8 tracking-widest">FREE FAUCET</h3>

        <div className="space-y-6 text-center">
          <p className="text-sm text-white/60">Claim 100 PC every 24 hours</p>

          {!account ? (
            <p className="text-xl text-white/40 font-medium">
              Connect wallet to see status
            </p>
          ) : (
            <>
              <div>
                <p className="text-4xl font-black text-blue-400">
                  {displayRemaining}
                </p>
                <p className="text-xs text-white/50 mt-2">PC remaining (lifetime cap)</p>
              </div>

              <p
                className={`text-lg font-mono font-bold ${
                  isReady ? "text-green-400" : "text-red-500"
                }`}
              >
                {isReady
                  ? "Ready to claim!"
                  : isCooldown
                  ? `Next claim in ${formatTime(timeUntilNext)}`
                  : "Loading..."}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Simple button — no black slide animation, just like your original */}
      <button
        onClick={handleFaucet}
        disabled={loading || !account || timeUntilNext > 0}
        className="mt-8 w-full py-5 rounded-2xl font-black uppercase italic tracking-widest text-black bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-400 transition-colors"
      >
        {loading
          ? "CLAIMING..."
          : !account
          ? "CONNECT WALLET"
          : timeUntilNext > 0
          ? "WAIT"
          : "CLAIM 100 PC"}
      </button>
    </div>
  );
}