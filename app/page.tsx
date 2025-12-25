/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ethers } from "ethers";
import { useWeb3Store } from "@/lib/web3Store";
import { showToast } from "@/components/ToastProvider";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/constants/contract";
import ToastProvider from "@/components/ToastProvider";
import Dashboard from "@/components/Dashboard";
import AccountModal from "@/components/AccountModal";

export default function PepsiCoinApp() {
  const {
    connectWallet,
    disconnectWallet,
    balance,
    account,
    refreshBalance,
    updateFaucetInfo,
  } = useWeb3Store();

  const [isLaunched, setIsLaunched] = useState(false);
  const [isPreloaderDone, setIsPreloaderDone] = useState(false);
  const [counterBalance, setCounterBalance] = useState("0.00");
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const movingLogoRef = useRef<HTMLImageElement>(null);
  const portalLayerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const textGroupRef = useRef<HTMLDivElement>(null);
  const sloganRef = useRef<HTMLDivElement>(null);

  // Odometer effect
  useEffect(() => {
    if (isLaunched && balance !== "0") {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: parseFloat(balance),
        duration: 2,
        ease: "power3.out",
        onUpdate: () =>
          setCounterBalance(
            obj.val.toLocaleString(undefined, { minimumFractionDigits: 2 })
          ),
      });
    } else if (!isLaunched) {
      setCounterBalance("0.00");
    }
  }, [balance, isLaunched]);

  // Disable body scroll on landing
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // Preloader animation
  useEffect(() => {
    const logo = movingLogoRef.current;
    if (!logo) return;

    // Use xPercent/yPercent instead of transform string to prevent CSS conflicts
    gsap.set(logo, {
      position: "fixed",
      top: "43.5%",
      left: "50%",
      xPercent: -50,
      yPercent: -50,
      marginLeft: "15vw",
      width: "192px",
      height: "192px",
      opacity: 1,
      scale: 50,
      rotation: 720,
      zIndex: 150,
    });

    gsap.to(logo, {
      scale: 1,
      rotation: 0,
      duration: 1.5,
      ease: "power4.out",
      onComplete: () => setIsPreloaderDone(true),
    });
  }, []);

  // SCROLL DETECTION
  useEffect(() => {
    if (!isLaunched || !mainRef.current) return;

    const mainElement = mainRef.current;
    const handleScroll = () => {
      const scrollTop = mainElement.scrollTop;
      if (scrollTop > 1) {
        gsap.to(movingLogoRef.current, { opacity: 0, duration: 0.1 });
      } else {
        gsap.to(movingLogoRef.current, { opacity: 1, duration: 0.1 });
      }
    };

    handleScroll();
    mainElement.addEventListener("scroll", handleScroll);
    return () => mainElement.removeEventListener("scroll", handleScroll);
  }, [isLaunched]);

  const handleLaunch = async () => {
    const connected = await connectWallet();
    if (!connected) return;

    const tl = gsap.timeline({ defaults: { ease: "expo.inOut" } });

    tl.to([textGroupRef.current, sloganRef.current], {
      opacity: 0,
      filter: "blur(20px)",
      y: -50,
      duration: 0.8,
      stagger: 0.1,
    })
      .to(
        movingLogoRef.current,
        { scale: 50, rotation: 720, duration: 1.5, force3D: true },
        "-=0.4"
      )
      .call(() => setIsLaunched(true))
      .to(movingLogoRef.current, {
        scale: 1,
        rotation: 0,
        top: "145px",
        left: "117px",
        xPercent: 0, // Reset centering for dashboard position
        yPercent: 0,
        width: "86px",
        height: "86px",
        marginLeft: 0,
        duration: 1.2,
        ease: "power4.inOut",
      })
      .to(
        portalLayerRef.current,
        { opacity: 0, display: "none", duration: 0.5 },
        "-=1"
      )
      .fromTo(
        ".dashboard-card",
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 1, ease: "expo.out" },
        "-=0.5"
      );
  };

  const handleReturnToLanding = () => {
    if (mainRef.current) {
      gsap.to(mainRef.current, {
        scrollTop: 0,
        duration: 0.3,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.set(movingLogoRef.current, { opacity: 1 });

          const tl = gsap.timeline({
            defaults: { ease: "expo.inOut" },
            onComplete: () => {
              setIsLaunched(false);
              setCounterBalance("0.00");
              disconnectWallet();
            },
          });

          tl.set(portalLayerRef.current, { display: "flex", opacity: 0 }, 0)
            .to(
              mainRef.current,
              { filter: "blur(20px)", opacity: 0, duration: 0.8 },
              0
            )
            .to(portalLayerRef.current, { opacity: 1, duration: 1 }, 0.2)
            .to(
              movingLogoRef.current,
              {
                scale: 50,
                rotation: 720,
                duration: 1.2,
                force3D: true,
              },
              0.1
            )
            .to(
              movingLogoRef.current,
              {
                scale: 1,
                rotation: 0,
                top: "43.5%",
                left: "50%",
                xPercent: -50,
                yPercent: -50,
                marginLeft: "15vw",
                width: "192px",
                height: "192px",
                duration: 1.4,
              },
              0.8
            )
            .fromTo(
              [textGroupRef.current, sloganRef.current],
              { opacity: 0, y: 40, filter: "blur(10px)" },
              {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                duration: 1.0,
                stagger: 0.1,
              },
              "-=0.5"
            );
        },
      });
    }
  };

  const handleOpenAccountModal = async () => {
    if (!(window as any).ethereum) {
      showToast("MetaMask not installed", "error");
      return;
    }

    try {
      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });
      const allAccounts = await (window as any).ethereum.request({
        method: "eth_accounts",
      });
      const uniqueAccounts = [...new Set([...accounts, ...allAccounts])];
      setAvailableAccounts(uniqueAccounts);
      setShowAccountModal(true);
    } catch (err) {
      showToast("Failed to fetch accounts", "error");
    }
  };

  const handleSwitchAccount = async (newAccount: string) => {
    if (loading || newAccount.toLowerCase() === account?.toLowerCase()) return;
    setLoading(true);

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      let isOwner = false;
      let contractOwner = null;
      try {
        contractOwner = await contract.owner();
        isOwner = contractOwner.toLowerCase() === newAccount.toLowerCase();
      } catch {}

      useWeb3Store.setState({
        account: newAccount,
        contract,
        provider,
        isOwner,
        contractOwner,
      });

      await refreshBalance();
      await updateFaucetInfo();

      showToast(
        `Switched to ${newAccount.slice(0, 6)}...${newAccount.slice(-4)}`,
        "success"
      );
      if (isOwner) showToast("You are the OWNER", "success");
    } catch (err) {
      showToast("Switch failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#020202] text-white select-none overflow-hidden font-sans">
      <ToastProvider />

      {/* BLUE PORTAL BACKGROUND */}
      <div
        ref={portalLayerRef}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#00275C]"
        style={{ opacity: isLaunched ? 0 : 1 }}
      >
        <div
          ref={textGroupRef}
          className="relative flex items-center uppercase font-black italic tracking-tighter text-[11vw] leading-none mb-4"
        >
          {/* Main Title logic */}
          <div
            className="flex items-center relative z-10 transition-all duration-700 ease-out"
            style={{
              opacity: isPreloaderDone && !isLaunched ? 1 : 0,
              transform:
                isPreloaderDone && !isLaunched
                  ? "translateX(0)"
                  : "translateX(-80px)",
            }}
          >
            <span className="text-white">PEPSI</span>
            <span className="text-[#E30613] ml-6">C</span>
          </div>

          {/* Transparent Spacer for the logo gap */}
          <div
            className="w-32 h-32 md:w-48 md:h-48 cursor-pointer pointer-events-auto mx-4 relative z-10"
            onClick={handleLaunch}
          />

          <span
            className="ml-[-110px] text-[#E30613] relative z-10 transition-all duration-700 ease-out"
            style={{
              opacity: isPreloaderDone && !isLaunched ? 1 : 0,
              transform:
                isPreloaderDone && !isLaunched
                  ? "translateX(0)"
                  : "translateX(80px)",
            }}
          >
            IN
          </span>
        </div>

        <div
          ref={sloganRef}
          className="text-center space-y-4 transition-all duration-700 ease-out"
          style={{
            opacity: isPreloaderDone && !isLaunched ? 1 : 0,
            transform:
              isPreloaderDone && !isLaunched
                ? "translateY(0)"
                : "translateY(40px)",
          }}
        >
          <p className="text-blue-300 font-mono tracking-[0.8em] text-sm md:text-lg animate-pulse">
            THE CRYPTO GENERATION
          </p>
          <div className="h-[1px] w-64 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto" />
          <button
            onClick={handleLaunch}
            className="text-[10px] font-bold tracking-widest text-white/40 hover:text-white transition-colors"
          >
            CLICK LOGO TO INITIALIZE NODE
          </button>
        </div>
      </div>

      {/* FLYING LOGO - Cleaned classes (no CSS transitions) */}
      <img
        ref={movingLogoRef}
        src="/logo2.png"
        alt="PepsiCoin Logo"
        className="fixed object-contain pointer-events-none will-change-transform z-[150]"
      />

      {isLaunched && (
        <Dashboard
          mainRef={mainRef}
          counterBalance={counterBalance}
          onReturnToLanding={handleReturnToLanding}
          onOpenAccountModal={handleOpenAccountModal}
        />
      )}

      <AccountModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        availableAccounts={availableAccounts}
        currentAccount={account}
        onSwitch={handleSwitchAccount}
        loading={loading}
      />
    </div>
  );
}