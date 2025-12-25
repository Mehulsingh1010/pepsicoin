"use client";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";

export function ConfirmationModal({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current && overlayRef.current) {
      const tl = gsap.timeline();
      tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
      tl.fromTo(modalRef.current, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.2)" });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[500] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
      <div ref={modalRef} className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 max-w-sm w-full shadow-[0_0_50px_-15px_rgba(239,68,68,0.3)]">
        
        <div className="text-center mb-8">
           <h3 className="text-2xl font-black italic tracking-tighter text-white uppercase mb-2">Terminate Session?</h3>
           <p className="text-[10px] font-mono font-black text-gray-500 tracking-widest leading-relaxed uppercase">
             Confirming will disconnect your node and reset the active session cache.
           </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onConfirm}
            className="w-full py-4 bg-red-600 text-white font-black rounded-2xl italic tracking-widest text-xs uppercase hover:bg-white hover:text-red-600 transition-all duration-300"
          >
            Yes, Disconnect
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-4 bg-white/5 border border-white/10 text-gray-400 font-black rounded-2xl italic tracking-widest text-xs uppercase hover:bg-white/10 hover:text-white transition-all duration-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}