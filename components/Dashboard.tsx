/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWeb3Store } from "@/lib/web3Store";
import TokenMetricsCard from "./cards/TokenMetricsCard";
import QuickTransferCard from "./cards/QuickTransferCard";
import OwnerMintCard from "./cards/OwnerMintCard";
import BurnCard from "./cards/BurnCard";
import FaucetCard from "./cards/FaucetCard";
import AdvancedCard from "./cards/AdvancedCard";
import { ConfirmationModal } from "./ConfirmationModal";

export default function Dashboard({ mainRef, counterBalance, onReturnToLanding, onOpenAccountModal }: any) {
  const { account, isOwner } = useWeb3Store();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleFinalExit = () => {
    setShowExitConfirm(false);
    setTimeout(() => onReturnToLanding(), 500);
  };

  const cards = [
    <TokenMetricsCard key="1" />, <QuickTransferCard key="2" />, 
    <OwnerMintCard key="3" />, <BurnCard key="4" />, 
    <FaucetCard key="5" />, <AdvancedCard key="6" />
  ];

  const gridSpans = ["lg:col-span-5", "lg:col-span-7", "lg:col-span-4", "lg:col-span-4", "lg:col-span-4", "lg:col-span-12"];

  return (
    <main ref={mainRef} className="relative overflow-auto w-full h-full p-4 md:p-16 flex flex-col bg-[#020202] text-white">
      
      {/* HEADER SECTION */}
  <header className="px-8 mb-14 py-10 flex flex-col lg:flex-row justify-between items-center lg:items-center gap-12">
  
  {/* LEFT SIDE: LOGO & BRANDING */}
  <div className="flex flex-col md:flex-row items-center gap-6 w-full lg:w-auto">
    
    {/* LOGO CONTAINER */}
  <div className="relative flex-shrink-0 group cursor-pointer">
  {/* CSS for the Fire Flickering Effect */}
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes flame-flicker {
      0% { transform: translateY(-4px) scale(1) rotate(0deg); opacity: 0.9; }
      25% { transform: translateY(-8px) scale(1.05) rotate(1deg); opacity: 1; }
      50% { transform: translateY(-5px) scale(0.95) rotate(-1deg); opacity: 0.8; }
      75% { transform: translateY(-10px) scale(1.1) rotate(0.5deg); opacity: 1; }
      100% { transform: translateY(-4px) scale(1) rotate(0deg); opacity: 0.9; }
    }
    .animate-flame {
      animation: flame-flicker 1.5s infinite ease-in-out;
    }
  `}} />

  {/* THE GLOW / FIRE PLUME */}
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    {/* Main "Hot" Flame Core */}
    <div 
      className="absolute w-16 h-20 md:w-24 md:h-28 bg-blue-500/60 blur-[15px] opacity-0 
                 group-hover:opacity-100 group-hover:animate-flame transition-opacity duration-500"
      style={{
        borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
      }}
    />
    
    {/* Outer Ambient Heat (Slightly larger, softer) */}
    <div 
      className="absolute w-20 h-24 md:w-28 md:h-32 bg-blue-400/30 blur-[25px] opacity-0 
                 group-hover:opacity-100 group-hover:animate-flame transition-opacity duration-700"
      style={{
        borderRadius: '50% 50% 20% 20%',
        animationDelay: '0.2s' // Delays the second layer for a more natural look
      }}
    />
  </div>

  {/* THE LOGO CONTAINER */}
  <div className="relative z-10 w-24 h-24 md:w-32 md:h-32 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
    <img 
      src="/logo2.png" 
      className="w-2/3 h-auto drop-shadow-[0_0_8px_rgba(59,130,246,0.6)] relative z-20" 
      alt="PepsiCoin Asset" 
    />
  </div>
</div>
    {/* BRANDING TEXT */}
    <div className="flex flex-col text-center md:text-left">
      <div className="flex flex-col md:flex-row md:items-baseline gap-2">
        <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-none text-white">
          PEPSI<span className="text-blue-600">COIN</span>
        </h1>
      </div>

      <div className="flex items-center justify-center md:justify-start gap-3 mt-3 mb-4">
        <div className="px-2 py-0.5 bg-blue-600/20 border border-blue-500/30 text-blue-500 text-[10px] font-black italic tracking-widest rounded uppercase">
          Protocol_Active
        </div>
        <span className="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-[0.2em]">PC-2025_INIT</span>
      </div>

      <p className="text-xs md:text-sm text-gray-400 font-medium leading-relaxed max-w-sm italic border-l-2 border-blue-600/30 pl-4 hidden md:block">
        Secure, fast, and designed for the modern crypto investor. 
        Experience the future of decentralized finance.
      </p>
    </div>
  </div>

  {/* RIGHT SIDE: BALANCE & ACTIONS */}
  <div className="flex flex-col items-center lg:items-end w-full lg:w-auto">
    <div className="mb-2 w-full max-w-[200px] lg:max-w-none">
        <span className="text-[9px] font-mono font-black tracking-[0.4em] text-blue-500/60 block mb-1 uppercase text-center lg:text-right">
          Synchronized_Assets
        </span>
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-blue-600/30 to-transparent lg:via-transparent lg:to-blue-600/30" />
    </div>
    
    <div className="flex items-baseline gap-2 mb-6">
      <span className="text-6xl md:text-8xl font-black font-mono tracking-tighter leading-none tabular-nums text-white">
        {counterBalance}
      </span>
      <span className="text-xl md:text-3xl text-red-600 font-black italic">PC</span>
    </div>

    {account && (
      <div className="flex gap-8">
        <button onClick={onOpenAccountModal} className="cursor-pointer group flex flex-col items-center lg:items-end">
          <span className="text-[10px] font-black tracking-widest text-blue-500 group-hover:text-white transition-all">CHANGE_ACCOUNT</span>
          <div className="h-[2px] w-4 bg-blue-600 transition-all group-hover:w-full mt-1" />
        </button>
        <button onClick={() => setShowExitConfirm(true)} className="cursor-pointer group flex flex-col items-center lg:items-end">
          <span className="text-[10px] font-black tracking-widest text-red-600 group-hover:text-white transition-all uppercase">DISCONNECT</span>
          <div className="h-[2px] w-4 bg-red-600 transition-all group-hover:w-full mt-1" />
        </button>
      </div>
    )}
  </div>
</header>

      {/* CONNECTED HOVER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 relative z-10 pb-20" onMouseLeave={() => setHoveredIndex(null)}>
        <style jsx>{`
          @keyframes scan {
            0% { top: 0; opacity: 0; }
            50% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
          .animate-scan {
            animation: scan 3s linear infinite;
          }
        `}</style>

        {cards.map((card, idx) => (
          <div 
            key={idx} 
            className={`relative ${gridSpans[idx]} group p-0.5 rounded-[2.5rem]`}
            onMouseEnter={() => setHoveredIndex(idx)}
          >
            <AnimatePresence>
              {hoveredIndex === idx && (
                <motion.div
                  layoutId="hoverGlow"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
                  className="absolute inset-0 bg-blue-600/10 border border-blue-500/30 rounded-[2.5rem] z-0 shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)]"
                />
              )}
            </AnimatePresence>

            <div className="relative z-10 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] h-full overflow-hidden transition-colors">
              {card}
            </div>
          </div>
        ))}
      </div>

      <ConfirmationModal isOpen={showExitConfirm} onClose={() => setShowExitConfirm(false)} onConfirm={handleFinalExit} />
    </main>
  );
}