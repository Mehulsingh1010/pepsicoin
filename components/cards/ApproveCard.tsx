/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useWeb3Store } from "@/lib/web3Store";
import { ethers } from "ethers";
import { showToast } from "@/components/ToastProvider";

export default function ApproveCard() {
  const { contract, account } = useWeb3Store();
  const [spender, setSpender] = useState("");
  const [amt, setAmt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    if (!account) return showToast("Wallet not connected", "error");
    if (!spender || !amt) return showToast("Fill all fields", "error");
    if (!ethers.isAddress(spender)) return showToast("Invalid spender address", "error");

    let amount;
    try {
      amount = ethers.parseUnits(amt.trim(), 18);
      if (amount <= 0) return showToast("Amount must be > 0", "error");
    } catch {
      return showToast("Invalid amount", "error");
    }

    setLoading(true);
    try {
      const tx = await contract?.approve(spender, amount);
      showToast("Approving...", "info");
      await tx?.wait(1);
      showToast("Approved successfully!", "success");
      setSpender("");
      setAmt("");
    } catch (e: any) {
      const msg = e?.reason || (e?.message?.includes("user rejected") ? "Transaction rejected" : "Approve failed");
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col flex-1">
        <div className="w-12 h-1 bg-blue-600 mb-6" />
        <h3 className="text-lg font-bold italic mb-8 tracking-widest">APPROVE SPENDER</h3>

        <div className="space-y-4 flex-1">
          <input
            className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-blue-600 outline-none font-mono text-sm placeholder:text-white/30"
            placeholder="Spender Address (0x...)"
            value={spender}
            onChange={(e) => setSpender(e.target.value.trim())}
            disabled={loading}
          />
          <input
            className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-blue-600 outline-none font-mono text-sm placeholder:text-white/30"
            placeholder="Amount (PC)"
            type="number"
            step="any"
            min="0"
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Simple solid button — no transition, no black slide */}
        <button
          onClick={handleApprove}
          disabled={loading || !account}
          className="mt-8 w-full py-5 rounded-2xl font-black uppercase italic tracking-widest text-black bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-400 transition-colors"
        >
          {loading ? "PROCESSING..." : "APPROVE"}
        </button>
      </div>
    </div>
  );
}