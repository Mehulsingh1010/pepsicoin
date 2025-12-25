/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useWeb3Store } from "@/lib/web3Store";
import { ethers } from "ethers";
import { showToast } from "@/components/ToastProvider";

export default function OwnerMintCard() {
  const { contract, isOwner, account, refreshBalance } = useWeb3Store();
  const [form, setForm] = useState({ to: "", amt: "" });
  const [loading, setLoading] = useState(false);

  const handleMint = async () => {
    if (!isOwner) return showToast("Only owner can mint", "error");
    if (!form.to || !form.amt) return showToast("Fill all fields", "error");
    if (!ethers.isAddress(form.to)) return showToast("Invalid address", "error");

    setLoading(true);
    try {
      const tx = await contract?.mint(form.to, ethers.parseUnits(form.amt, 18));
      showToast("Minting tokens...", "info");
      await tx?.wait();
      showToast(`${form.amt} PC minted!`, "success");
      setForm({ to: "", amt: "" });
      await refreshBalance();
    } catch (e: any) {
      showToast(e.message || "Mint failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between relative group ${!isOwner ? "blur-sm hover:blur-none" : ""} transition-all duration-300`}>
      {!isOwner && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-blue-400 font-black italic text-2xl tracking-widest text-center px-8 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]">
            ONLY OWNER CAN BE THIS COOL
          </p>
        </div>
      )}
      <div className={!isOwner ? "pointer-events-none" : ""}>
        <div className="w-12 h-1 bg-blue-600 mb-6" />
        <h3 className="text-lg font-bold italic mb-6 tracking-widest">OWNER MINT</h3>
        <input
          className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-blue-600 outline-none font-mono text-sm mb-4"
          placeholder="Recipient Address (0x...)"
          value={form.to}
          onChange={(e) => setForm({ ...form, to: e.target.value })}
          disabled={!isOwner}
        />
        <input
          className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-blue-600 outline-none font-mono text-sm mb-4"
          placeholder="Amount to mint"
          type="number"
          value={form.amt}
          onChange={(e) => setForm({ ...form, amt: e.target.value })}
          disabled={!isOwner}
        />
      </div>
      <button
        onClick={handleMint}
        disabled={loading || !account || !isOwner}
        className="cursor-pointer mt-auto w-full py-5 rounded-2xl font-black uppercase italic tracking-widest text-black bg-blue-500 hover:bg-blue-400 disabled:opacity-50 transition-all"
      >
        {loading ? "MINTING..." : "MINT PC"}
      </button>
    </div>
  );
}