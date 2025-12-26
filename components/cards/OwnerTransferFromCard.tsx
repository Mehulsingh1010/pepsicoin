/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useWeb3Store } from "@/lib/web3Store";
import { ethers } from "ethers";
import { showToast } from "@/components/ToastProvider";

export default function OwnerTransferFromCard() {
  const { contract, account, refreshBalance, isOwner } = useWeb3Store();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amt, setAmt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTransferFrom = async () => {
    if (!isOwner) return showToast("Only owner can use this", "error");
    if (!account) return showToast("Wallet not connected", "error");
    if (!from || !to || !amt) return showToast("Fill all fields", "error");
    if (!ethers.isAddress(from) || !ethers.isAddress(to)) return showToast("Invalid address", "error");

    let amount;
    try {
      amount = ethers.parseUnits(amt.trim(), 18);
      if (amount <= 0) return showToast("Amount must be > 0", "error");
    } catch {
      return showToast("Invalid amount", "error");
    }

    setLoading(true);
    try {
      const tx = await contract?.transferFrom(from, to, amount);
      showToast("Transferring...", "info");
      await tx?.wait(1);
      showToast("TransferFrom successful!", "success");
      setFrom("");
      setTo("");
      setAmt("");
      await refreshBalance();
    } catch (e: any) {
      const msg = e?.reason || (e?.message?.includes("user rejected") ? "Transaction rejected" : "TransferFrom failed");
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-[#0a0a0a] border h-full border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between relative group ${!isOwner ? "blur-sm hover:blur-none" : ""} transition-all duration-300`}>
      {/* Teaser message on hover when not owner */}
      {!isOwner && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <p className="text-red-500 font-black italic text-2xl tracking-widest text-center px-8 drop-shadow-[0_0_20px_rgba(227,6,19,0.8)]">
            OWNER ONLY ZONE
          </p>
        </div>
      )}

      {/* Disable interaction when not owner */}
      <div className={!isOwner ? "pointer-events-none" : ""}>
        <div className="relative z-10 flex flex-col flex-1">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[100px] pointer-events-none" />
          
          <div className="w-12 h-1 bg-[#E30613] mb-6" />
          <h3 className="text-lg font-bold italic mb-8 tracking-widest">TRANSFER FROM</h3>

          <div className="space-y-4 flex-1">
            <input
              className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-[#E30613] outline-none font-mono text-sm placeholder:text-white/30"
              placeholder="From Address (0x...)"
              value={from}
              onChange={(e) => setFrom(e.target.value.trim())}
              disabled={!isOwner || loading}
            />
            <input
              className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-[#E30613] outline-none font-mono text-sm placeholder:text-white/30"
              placeholder="To Address (0x...)"
              value={to}
              onChange={(e) => setTo(e.target.value.trim())}
              disabled={!isOwner || loading}
            />
            <input
              className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-[#E30613] outline-none font-mono text-sm placeholder:text-white/30"
              placeholder="Amount (PC)"
              type="number"
              step="any"
              min="0"
              value={amt}
              onChange={(e) => setAmt(e.target.value)}
              disabled={!isOwner || loading}
            />
          </div>

          <button
            onClick={handleTransferFrom}
            disabled={loading || !account || !isOwner}
            className="mt-8 w-full py-5 rounded-2xl font-black uppercase italic tracking-widest text-black bg-[#E30613] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-500 transition-colors"
          >
            {loading ? "PROCESSING..." : "TRANSFER FROM"}
          </button>
        </div>
      </div>
    </div>
  );
}