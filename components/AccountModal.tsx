/* eslint-disable react-hooks/immutability */
"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableAccounts: string[];
  currentAccount: string | null;
  onSwitch: (account: string) => Promise<void>;
  loading?: boolean;
}

export default function AccountModal({
  isOpen,
  onClose,
  availableAccounts,
  currentAccount,
  onSwitch,
  loading = false,
}: AccountModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  // Track the account to detect when a switch actually happens
  const previousAccount = useRef<string | null>(currentAccount);

  // Animation: Open Modal
  useEffect(() => {
    if (isOpen && modalRef.current && overlayRef.current) {
      const tl = gsap.timeline();
      tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
      tl.fromTo(
        modalRef.current,
        { scale: 0.8, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.2)" },
        "-=0.1"
      );
      
      // Sync the ref when the modal opens
      previousAccount.current = currentAccount;
    }
  }, [isOpen]);

  // Logic: Close modal automatically when currentAccount changes
  useEffect(() => {
    if (isOpen && currentAccount !== previousAccount.current && !loading) {
      handleClose();
      previousAccount.current = currentAccount;
    }
  }, [currentAccount, loading, isOpen]);

  const handleClose = () => {
    if (loading) return;
    if (modalRef.current && overlayRef.current) {
      const tl = gsap.timeline({ onComplete: onClose });
      tl.to(modalRef.current, {
        scale: 0.9,
        opacity: 0,
        y: 10,
        duration: 0.15,
        ease: "power2.in",
      }).to(overlayRef.current, { opacity: 0, duration: 0.15 }, "-=0.1");
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        className="relative bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full shadow-[0_0_50px_-15px_rgba(59,130,246,0.5)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- MINIMALIST LOADER --- */}
        {loading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a]/95 backdrop-blur-sm transition-opacity duration-300">
            <div className="relative flex items-center justify-center w-24 h-24">
              <div className="absolute inset-0 border-t-2 border-blue-500 rounded-full animate-spin duration-[0.5s]" />
              <div className="absolute inset-2 border-b-2 border-red-500 rounded-full animate-spin duration-[0.7s] reverse" />
              <img
                src="/logo2.png"
                alt="Loading"
                className="w-16 h-16 object-contain"
              />
            </div>

            <p className="mt-6 font-black italic text-[14px] tracking-[0.5em] text-white">
              SYNCHRONIZING <span className="text-blue-500">NODE</span>
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black italic tracking-tighter text-white">
            SWITCH ACCOUNT
          </h3>
          <div className="flex space-x-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          </div>
        </div>

        <div className="space-y-3 mb-8 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
          {availableAccounts.map((acc, idx) => {
            const isActive = acc.toLowerCase() === currentAccount?.toLowerCase();
            return (
              <button
                key={idx}
                onClick={() => onSwitch(acc)}
                disabled={loading || isActive}
                className={`group w-full p-4 rounded-2xl font-mono text-sm transition-all duration-300 border ${
                  isActive
                    ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                    : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:bg-white/10"
                } disabled:opacity-50`}
              >
                <div className="text-left flex items-start justify-between">
                  <div className="overflow-hidden">
                    <p
                      className={`text-[9px] uppercase font-black mb-1 ${
                        isActive ? "text-blue-200" : "text-gray-500"
                      }`}
                    >
                      ENDPOINT_ID_0{idx + 1}
                    </p>
                    <p className="truncate text-xs tracking-tight">{acc}</p>
                  </div>

                  {isActive && (
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-[9px] font-black text-blue-200">
                        ACTIVE
                      </span>
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleClose}
          disabled={loading}
          className="relative w-full py-4 bg-red-600 border border-red-500 text-white font-black rounded-2xl overflow-hidden transition-all uppercase italic tracking-widest text-xs group disabled:opacity-50 disabled:grayscale"
        >
          <span className="absolute inset-0 bg-black translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-out"></span>
          <span className="relative z-10">GO BACK</span>
        </button>
      </div>
    </div>
  );
}