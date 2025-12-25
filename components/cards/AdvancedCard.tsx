/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useWeb3Store } from "@/lib/web3Store";
import { ethers } from "ethers";
import { showToast } from "@/components/ToastProvider";

export default function AdvancedCard() {
  const { contract, refreshBalance } = useWeb3Store();
  const [approve, setApprove] = useState({ spender: "", amt: "" });
  const [transferFrom, setTransferFrom] = useState({ from: "", to: "", amt: "" });
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    if (!approve.spender || !approve.amt) return showToast("Fill all fields", "error");
    if (!ethers.isAddress(approve.spender)) return showToast("Invalid spender", "error");

    setLoading(true);
    try {
      const tx = await contract?.approve(approve.spender, ethers.parseUnits(approve.amt, 18));
      showToast("Approving...", "info");
      await tx?.wait();
      showToast("Approved!", "success");
      setApprove({ spender: "", amt: "" });
    } catch (e: any) {
      showToast(e.message || "Approve failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTransferFrom = async () => {
    if (!transferFrom.from || !transferFrom.to || !transferFrom.amt) return showToast("Fill all fields", "error");
    if (!ethers.isAddress(transferFrom.from) || !ethers.isAddress(transferFrom.to)) return showToast("Invalid address", "error");

    setLoading(true);
    try {
      const tx = await contract?.transferFrom(transferFrom.from, transferFrom.to, ethers.parseUnits(transferFrom.amt, 18));
      showToast("Transferring...", "info");
      await tx?.wait();
      showToast("TransferFrom successful!", "success");
      setTransferFrom({ from: "", to: "", amt: "" });
      await refreshBalance();
    } catch (e: any) {
      showToast(e.message || "TransferFrom failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 flex flex-col">
      <div className="w-12 h-1 bg-blue-600 mb-6" />
      <h3 className="text-lg font-bold italic mb-8 tracking-widest text-white">
        ADVANCED: APPROVE & TRANSFER FROM
      </h3>
      <div className="grid lg:grid-cols-2 gap-12 flex-1">
        <div className="flex flex-col">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-semibold">Approve Spender</p>
          <div className="space-y-3 flex-1">
            <input placeholder="Spender Address (0x...)" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:ring-1 focus:ring-blue-500 transition-all" value={approve.spender} onChange={(e) => setApprove({ ...approve, spender: e.target.value })} />
            <input placeholder="Amount" type="number" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:ring-1 focus:ring-blue-500 transition-all" value={approve.amt} onChange={(e) => setApprove({ ...approve, amt: e.target.value })} />
          </div>
          <button onClick={handleApprove} disabled={loading} className="cursor-pointer mt-6 w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-2xl font-bold text-sm tracking-widest">
            {loading ? "PROCESSING..." : "APPROVE"}
          </button>
        </div>

        <div className="flex flex-col">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-semibold">Transfer From</p>
          <div className="space-y-3 flex-1">
            <input placeholder="From Address" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:ring-1 focus:ring-red-500 transition-all" value={transferFrom.from} onChange={(e) => setTransferFrom({ ...transferFrom, from: e.target.value })} />
            <input placeholder="To Address" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:ring-1 focus:ring-red-500 transition-all" value={transferFrom.to} onChange={(e) => setTransferFrom({ ...transferFrom, to: e.target.value })} />
            <input placeholder="Amount" type="number" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:ring-1 focus:ring-red-500 transition-all" value={transferFrom.amt} onChange={(e) => setTransferFrom({ ...transferFrom, amt: e.target.value })} />
          </div>
          <button onClick={handleTransferFrom} disabled={loading} className="cursor-pointer mt-6 w-full py-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-2xl font-bold text-sm tracking-widest">
            {loading ? "PROCESSING..." : "TRANSFER FROM"}
          </button>
        </div>
      </div>
    </div>
  );
}