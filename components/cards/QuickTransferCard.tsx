/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useWeb3Store } from "@/lib/web3Store";
import { ethers } from "ethers";
import { showToast } from "@/components/ToastProvider";

export default function QuickTransferCard() {
  const { contract, account, balance, refreshBalance } = useWeb3Store();
  const [form, setForm] = useState({ to: "", amt: "" });
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    if (!account) {
      showToast("Wallet not connected", "error");
      return;
    }

    if (!form.to || !form.amt) {
      showToast("Please fill in both address and amount", "error");
      return;
    }

    if (!ethers.isAddress(form.to)) {
      showToast("Invalid recipient address", "error");
      return;
    }

    if (form.to.toLowerCase() === account.toLowerCase()) {
      showToast("You cannot transfer to your own address", "error");
      return;
    }

    let amountBigInt;
    try {
      amountBigInt = ethers.parseUnits(form.amt.trim(), 18);
    } catch {
      showToast("Invalid amount format", "error");
      return;
    }

    if (amountBigInt <= 0) {
      showToast("Amount must be greater than 0", "error");
      return;
    }

    const balanceBigInt = ethers.parseUnits(balance || "0", 18);

    if (amountBigInt > balanceBigInt) {
      showToast(`Insufficient balance. You have ${balance} PC`, "error");
      return;
    }

    setLoading(true);

    try {
      const tx = await contract?.transfer(form.to, amountBigInt);
      showToast("Transaction sent, waiting for confirmation...", "info");
      await tx?.wait(1);

      showToast("Transfer successful!", "success");
      setForm({ to: "", amt: "" });
      await refreshBalance();
    } catch (e: any) {
      console.error("Transfer error:", e);

      let message = "Transfer failed";
      if (e?.reason) message = e.reason;
      else if (e?.message?.includes("user rejected")) message = "Transaction rejected by user";

      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[100px] pointer-events-none" />
      
      <div>
        <div className="w-12 h-1 bg-[#E30613] mb-6" />
        <h3 className="text-lg font-bold italic mb-8 tracking-widest">QUICK TRANSFER</h3>
        
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <input
            className="bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-blue-600 outline-none font-mono text-sm placeholder:text-white/30"
            placeholder="Recipient Address (0x...)"
            value={form.to}
            onChange={(e) => setForm({ ...form, to: e.target.value.trim() })}
            disabled={loading}
          />
          <input
            className="bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-blue-600 outline-none font-mono text-sm placeholder:text-white/30"
            placeholder="Amount (PC)"
            type="number"
            step="any"
            min="0"
            value={form.amt}
            onChange={(e) => setForm({ ...form, amt: e.target.value })}
            disabled={loading}
          />
        </div>

  
      </div>

      <button
        disabled={loading || !account}
        onClick={handleTransfer}
        className="cursor-pointer group relative overflow-hidden mt-6 w-full py-5 rounded-2xl font-black uppercase italic tracking-widest text-white bg-[#E30613] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="absolute inset-0 bg-black scale-x-0 origin-left transition-transform duration-500 group-hover:scale-x-100" />
        <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
          {loading ? "PROCESSING..." : "CONFIRM TRANSFER"}
        </span>
      </button>
    </div>
  );
}