"use client";

import { useRef, useState } from "react";
import { gsap } from "gsap";

interface LandingProps {
  portalLayerRef: React.RefObject<HTMLDivElement>;
  textGroupRef: React.RefObject<HTMLDivElement>;
  sloganRef: React.RefObject<HTMLDivElement>;
  onLaunch: () => Promise<void>;
}

export default function Landing({ portalLayerRef, textGroupRef, sloganRef, onLaunch }: LandingProps) {
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const easterEggRef = useRef<HTMLDivElement>(null);

  const handleEasterEggHover = () => {
    setShowEasterEgg(true);
    const text = "not_me_lol_ive_been_here_since_yesterday";
    const letters = text.split("");

    letters.forEach((letter, idx) => {
      const el = document.createElement("span");
      el.textContent = letter;
      el.style.opacity = "0";
      el.style.display = "inline-block";
      easterEggRef.current?.appendChild(el);

      gsap.fromTo(el, { opacity: 0, y: -20, rotation: 10, filter: "blur(12px)" }, {
        opacity: 1,
        y: 0,
        rotation: 0,
        filter: "blur(0px)",
        duration: 0.4,
        delay: idx * 0.03,
        ease: "back.out",
      });
    });
  };

  const handleEasterEggLeave = () => {
    if (!easterEggRef.current) return;
    const spans = easterEggRef.current.querySelectorAll("span");
    spans.forEach((span, idx) => {
      gsap.to(span, {
        opacity: 0,
        y: 20,
        rotation: -10,
        filter: "blur(12px)",
        duration: 0.3,
        delay: (spans.length - idx) * 0.02,
        onComplete: idx === 0 ? () => {
          setShowEasterEgg(false);
          easterEggRef.current!.innerHTML = "";
        } : undefined,
      });
    });
  };

  return (
    <div ref={portalLayerRef} className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#00275C]">
      <div ref={textGroupRef} className="flex items-center uppercase font-black italic tracking-tighter text-[11vw] leading-none mb-4">
        <span className="text-white">PEPSI</span>
        <span className="text-[#E30613] ml-6">C</span>
        <div className="w-32 h-32 md:w-48 md:h-48 cursor-pointer pointer-events-auto mx-4" onClick={onLaunch} />
        <span className="ml-[-110px] text-[#E30613]">IN</span>
      </div>

      <div ref={sloganRef} className="text-center space-y-4">
        <p className="text-blue-300 font-mono tracking-[0.8em] text-sm md:text-lg animate-pulse">
          THE CRYPTO GENERATION
        </p>
        <div className="h-[1px] w-64 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto" />
        <button onClick={onLaunch} className="text-[10px] font-bold tracking-widest text-white/40 hover:text-white transition-colors">
          CLICK LOGO TO INITIALIZE NODE
        </button>
      </div>

      <div
        onMouseEnter={handleEasterEggHover}
        onMouseLeave={handleEasterEggLeave}
        className="absolute bottom-10 left-10 opacity-10 font-black italic text-4xl cursor-pointer hover:opacity-20 transition-opacity"
      >
        EST 1893
      </div>
      {showEasterEgg && (
        <div ref={easterEggRef} className="absolute bottom-32 left-10 font-black italic text-base text-blue-400 whitespace-pre pointer-events-none leading-relaxed" />
      )}
      <div className="absolute top-10 right-10 opacity-10 font-black italic text-4xl">V.2025</div>
    </div>
  );
}