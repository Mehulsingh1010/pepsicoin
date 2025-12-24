"use client";
import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { create } from "zustand";
import { toast as sonnerToast, Toaster } from "sonner";
import { gsap } from "gsap";

// --- CONTRACT CONFIG ---
const CONTRACT_ADDRESS = "0x6B36835F27fBbFB609eCEb8B5965210a582E6ad5";

// OWNER ADDRESS
const OWNER_ADDRESS = "0x0a3688922f7f85d48d5335E901E248171b9392c5".toLowerCase();

const CONTRACT_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function faucet()",
  "function timeUntilNextFaucet(address user) view returns (uint256)",
  "function faucetRemaining(address user) view returns (uint256)",
  "function burn(uint256 amount)",
  "function mint(address to, uint256 amount)",
  "function owner() view returns (address)",
];

// Custom Toast Component
const CustomToast = ({ id, title, type, onClose }) => {
  const toastRef = useRef(null);
  const logoRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    const timeline = gsap.timeline();

    gsap.fromTo(
      toastRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.4, ease: "back.out" }
    );

    timeline
      .to({}, {}, "+=4")
      .to(
        textRef.current,
        {
          opacity: 0,
          filter: "blur(10px)",
          duration: 0.5,
          ease: "power2.in",
        },
        "-=0.3"
      )
      .to(
        logoRef.current,
        {
          scale: 2,
          rotation: 720,
          opacity: 0,
          filter: "blur(15px)",
          duration: 0.6,
          ease: "power2.in",
        },
        "-=0.4"
      )
      .to(
        toastRef.current,
        {
          y: 100,
          opacity: 0,
          duration: 0.4,
          ease: "power2.in",
          onComplete: onClose,
        },
        "-=0.3"
      );
  }, [onClose]);

  const bgColor =
    type === "error"
      ? "bg-red-600/10 border-red-500/20"
      : type === "success"
      ? "bg-green-600/10 border-green-500/20"
      : type === "info"
      ? "bg-blue-600/10 border-blue-500/20"
      : "bg-white/5 border-white/10";

  const textColor =
    type === "error"
      ? "text-red-400"
      : type === "success"
      ? "text-green-400"
      : type === "info"
      ? "text-blue-400"
      : "text-white";

  return (
    <div
      ref={toastRef}
      className={`flex items-center justify-between gap-4 ${bgColor} bg-white border rounded-2xl p-4 backdrop-blur-sm min-w-[300px]`}
    >
      <div ref={textRef} className="flex-1">
        <p className={`font-bold italic tracking-widest text-sm ${textColor}`}>
          {title}
        </p>
      </div>
      <img
        ref={logoRef}
        src="/logo2.png"
        alt="logo"
        className="w-12 h-12 object-contain flex-shrink-0"
      />
    </div>
  );
};

const showCustomToast = (message, type = "info") => {
  sonnerToast.custom(
    (t) => (
      <CustomToast title={message} type={type} onClose={() => t.dismiss()} />
    ),
    {
      duration: 5000,
      position: "bottom-right",
    }
  );
};

// --- ZUSTAND STORE ---
const useWeb3Store = create((set, get) => ({
  account: null,
  balance: "0",
  isConnected: false,
  contract: null,
  tokenData: { name: "PepsiCoin", symbol: "PC", totalSupply: "0" },
  provider: null,
  timeUntilNext: 0,
  faucetRemaining: "0",
  isOwner: false,
  contractOwner: null,

  connectWallet: async () => {
    if (!window.ethereum) {
      showCustomToast("MetaMask not installed", "error");
      return false;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (!accounts.length) {
        showCustomToast("No accounts found", "error");
        return false;
      }

      let provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const sepoliaChainId = 11155111n;

      if (network.chainId !== sepoliaChainId) {
        try {
          await provider.send("wallet_switchEthereumChain", [
            { chainId: "0xaa36a7" },
          ]);
          showCustomToast("Switched to Sepolia Testnet", "success");
        } catch (switchError) {
          if (
            switchError.code === 4902 ||
            switchError?.data?.originalError?.code === 4902
          ) {
            try {
              await provider.send("wallet_addEthereumChain", [
                {
                  chainId: "0xaa36a7",
                  chainName: "Sepolia Testnet",
                  nativeCurrency: {
                    name: "Sepolia ETH",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  rpcUrls: ["https://rpc.sepolia.org"],
                  blockExplorerUrls: ["https://sepolia.etherscan.io"],
                },
              ]);
              showCustomToast("Added & switched to Sepolia", "success");
              await provider.send("wallet_switchEthereumChain", [
                { chainId: "0xaa36a7" },
              ]);
            } catch (addError) {
              showCustomToast("Failed to add Sepolia network", "error");
              return false;
            }
          } else {
            showCustomToast("Please switch to Sepolia manually", "error");
            return false;
          }
        }
        provider = new ethers.BrowserProvider(window.ethereum);
      }

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      // Fetch contract owner
      let contractOwner = null;
      let isOwner = false;
      try {
        contractOwner = await contract.owner();
        isOwner = contractOwner.toLowerCase() === accounts[0].toLowerCase();
      } catch (e) {
        console.warn("Could not fetch contract owner", e);
      }

      set({
        account: accounts[0],
        isConnected: true,
        contract,
        provider,
        isOwner,
        contractOwner,
      });

      await get().fetchMetadata();
      await get().refreshBalance();
      await get().updateFaucetInfo();

      if (isOwner) {
        showCustomToast("Connected as OWNER", "success");
      }

      window.ethereum.removeListener(
        "accountsChanged",
        get().handleAccountsChanged
      );
      window.ethereum.on("accountsChanged", get().handleAccountsChanged);

      window.ethereum.removeListener("chainChanged", handleChainChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      function handleChainChanged() {
        window.location.reload();
      }

      return true;
    } catch (err) {
      console.error(err);
      showCustomToast(err.message || "Connection failed", "error");
      return false;
    }
  },

  handleAccountsChanged: async (accounts) => {
    if (accounts.length === 0) {
      set({
        account: null,
        isConnected: false,
        contract: null,
        balance: "0",
        provider: null,
        timeUntilNext: 0,
        faucetRemaining: "0",
        isOwner: false,
        contractOwner: null,
      });
      showCustomToast("Wallet disconnected", "info");
    } else if (accounts[0] !== get().account) {
      const { contract, contractOwner } = get();
      const isOwner = contractOwner
        ? contractOwner.toLowerCase() === accounts[0].toLowerCase()
        : false;

      set({ account: accounts[0], isOwner });
      showCustomToast(
        `Account switched to ${accounts[0].slice(0, 6)}...${accounts[0].slice(
          -4
        )}`,
        "info"
      );
      
      if (isOwner) {
        showCustomToast("You are the OWNER", "success");
      }
      
      get().refreshBalance();
      get().updateFaucetInfo();
    }
  },

  disconnectWallet: () => {
    if (window.ethereum) {
      window.ethereum.removeListener(
        "accountsChanged",
        useWeb3Store.getState().handleAccountsChanged
      );
    }
    set({
      account: null,
      isConnected: false,
      contract: null,
      balance: "0",
      provider: null,
      timeUntilNext: 0,
      faucetRemaining: "0",
      isOwner: false,
      contractOwner: null,
    });
  },

  fetchMetadata: async () => {
    const { contract } = get();
    if (!contract) return;
    try {
      const [name, symbol, total] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.totalSupply(),
      ]);
      set({
        tokenData: { name, symbol, totalSupply: ethers.formatUnits(total, 18) },
      });
    } catch (e) {
      console.warn("Metadata fetch failed", e);
    }
  },

  refreshBalance: async () => {
    const { contract, account } = get();
    if (!contract || !account) return;
    try {
      const bal = await contract.balanceOf(account);
      set({ balance: ethers.formatUnits(bal, 18) });
    } catch (e) {
      console.warn("Balance fetch failed", e);
    }
  },

  updateFaucetInfo: async () => {
    const { contract, account } = get();
    if (!contract || !account) return;
    try {
      const [timeLeft, remaining] = await Promise.all([
        contract.timeUntilNextFaucet(account),
        contract.faucetRemaining(account),
      ]);
      set({
        timeUntilNext: Number(timeLeft),
        faucetRemaining: ethers.formatUnits(remaining, 18),
      });
    } catch (e) {
      console.warn("Faucet info failed", e);
    }
  },
}));

export default function PepsiCoinApp() {
  const {
    account,
    balance,
    tokenData,
    connectWallet,
    refreshBalance,
    contract,
    disconnectWallet,
    timeUntilNext,
    faucetRemaining,
    updateFaucetInfo,
    isOwner,
  } = useWeb3Store();

  const [isLaunched, setIsLaunched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [counterBalance, setCounterBalance] = useState("0.00");
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [selectedAccountModal, setSelectedAccountModal] = useState(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const easterEggRef = useRef(null);

  const [txForm, setTxForm] = useState({ to: "", amt: "" });
  const [burnAmt, setBurnAmt] = useState("");
  const [mintForm, setMintForm] = useState({ to: "", amt: "" });
  const [approveForm, setApproveForm] = useState({ spender: "", amt: "" });
  const [transferFromForm, setTransferFromForm] = useState({
    from: "",
    to: "",
    amt: "",
  });

  const portalLayerRef = useRef(null);
  const movingLogoRef = useRef(null);
  const textGroupRef = useRef(null);
  const cardsRef = useRef([]);
  const sloganRef = useRef(null);
  const accountModalRef = useRef(null);
  const mainRef = useRef(null);

  // Global Scroll Removal & Hide Scrollbars
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    };
  }, []);

  // Pre-preloader animation on mount
  useEffect(() => {
    gsap.set(movingLogoRef.current, { scale: 50, rotation: 720 });

    const preLoadTimeline = gsap.timeline({
      onComplete: () => {},
    });

    preLoadTimeline.to(movingLogoRef.current, {
      scale: 1,
      rotation: 0,
      duration: 1.5,
      ease: "power4.inOut",
    });
  }, []);

  // Odometer
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
    }
  }, [balance, isLaunched]);

  const handleEasterEggHover = () => {
    setShowEasterEgg(true);
    const text = "not_me_lol_ive_been_here_since_yesterday";
    const letters = text.split("");

    gsap.fromTo(
      easterEggRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3 }
    );

    letters.forEach((letter, idx) => {
      const letterEl = document.createElement("span");
      letterEl.textContent = letter;
      letterEl.style.opacity = "0";
      letterEl.style.display = "inline-block";
      easterEggRef.current.appendChild(letterEl);

      gsap.fromTo(
        letterEl,
        { opacity: 0, y: -20, rotation: 10, filter: "blur(12px)" },
        {
          opacity: 1,
          y: 0,
          rotation: 0,
          filter: "blur(0px)",
          duration: 0.4,
          delay: idx * 0.03,
          ease: "back.out",
        }
      );
    });
  };

  const handleEasterEggLeave = () => {
    if (easterEggRef.current) {
      const letters = easterEggRef.current.querySelectorAll("span");
      const totalLetters = letters.length;

      letters.forEach((letter, idx) => {
        gsap.to(letter, {
          opacity: 0,
          y: 20,
          rotation: -10,
          filter: "blur(12px)",
          duration: 0.3,
          delay: (totalLetters - idx) * 0.02,
          ease: "back.in",
          onComplete: () => {
            if (idx === 0) {
              setShowEasterEgg(false);
              easterEggRef.current.innerHTML = "";
            }
          },
        });
      });
    }
  };

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
        {
          scale: 50,
          rotation: 720,
          duration: 1.5,
          force3D: true,
        },
        "-=0.4"
      )
      .call(() => setIsLaunched(true))
      .to(movingLogoRef.current, {
        rotation: 0,
        scale: 1,
        top: "7.2rem",
        left: "6.5rem",
        x: 0,
        y: 0,
        width: "60px",
        height: "60px",
        duration: 1.2,
        ease: "power4.inOut",
      })
      .to(
        portalLayerRef.current,
        {
          opacity: 0,
          display: "none",
          duration: 0.5,
        },
        "-=1"
      )
      .fromTo(
        cardsRef.current,
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 1, ease: "expo.out" },
        "-=0.5"
      );
  };

  const handleOpenAccountModal = async () => {
    if (!window.ethereum) {
      showCustomToast("MetaMask not installed", "error");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const allAccounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      const uniqueAccounts = [...new Set([...accounts, ...allAccounts])];
      setAvailableAccounts(uniqueAccounts);
      setSelectedAccountModal(account);
      setShowAccountModal(true);

      requestAnimationFrame(() => {
        if (accountModalRef.current) {
          gsap.fromTo(
            accountModalRef.current,
            {
              scale: 0.95,
              opacity: 0,
              y: 10,
            },
            {
              scale: 1,
              opacity: 1,
              y: 0,
              duration: 0.35,
              ease: "power3.out",
            }
          );
        }
      });
    } catch (err) {
      showCustomToast(err.message || "Failed to fetch accounts", "error");
    }
  };

  const handleCloseAccountModal = () => {
    if (accountModalRef.current) {
      gsap.to(accountModalRef.current, {
        scale: 0.95,
        opacity: 0,
        y: 10,
        duration: 0.25,
        ease: "power3.in",
        onComplete: () => {
          setShowAccountModal(false);
        },
      });
    } else {
      setShowAccountModal(false);
    }
  };

  const handleSwitchAccount = async (newAccount) => {
    if (loading) return;

    setSelectedAccountModal(newAccount);
    setLoading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      if (!signer) {
        showCustomToast("Failed to get signer", "error");
        setLoading(false);
        return;
      }

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      let contractOwner = null;
      let isOwner = false;
      try {
        contractOwner = await contract.owner();
        isOwner = contractOwner.toLowerCase() === newAccount.toLowerCase();
      } catch (e) {
        console.warn("Could not fetch owner", e);
      }

      const store = useWeb3Store.getState();
      store.account = newAccount;
      store.isConnected = true;
      store.contract = contract;
      store.provider = provider;
      store.isOwner = isOwner;
      store.contractOwner = contractOwner;

      await store.refreshBalance();
      await store.updateFaucetInfo();

      showCustomToast(
        `Switched to ${newAccount.slice(0, 6)}...${newAccount.slice(-4)}`,
        "success"
      );

      if (isOwner) {
        showCustomToast("You are now the OWNER", "success");
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
      handleCloseAccountModal();
    } catch (err) {
      showCustomToast(err.message || "Failed to switch account", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToLanding = () => {
    const tl = gsap.timeline({
      onComplete: () => {
        setIsLaunched(false);
        setIsDisconnecting(false);
        setCounterBalance("0.00");
      },
    });

    tl.to(
      portalLayerRef.current,
      {
        opacity: 1,
        display: "flex",
        duration: 0.3,
      },
      0
    )
      .to(
        mainRef.current,
        {
          filter: "blur(20px)",
          opacity: 0,
          duration: 0.8,
          ease: "power2.inOut",
        },
        0
      )
      .to(
        movingLogoRef.current,
        {
          scale: 50,
          rotation: 720,
          duration: 1.5,
          ease: "power4.inOut",
          force3D: true,
        },
        0
      )
      .to(
        movingLogoRef.current,
        {
          scale: 1,
          rotation: 0,
          top: "43.5%",
          left: "50%",
          marginLeft: "16vw",
          width: "192px",
          height: "192px",
          duration: 1.5,
          ease: "power4.inOut",
          force3D: true,
        },
        1.2
      )
      .to(
        mainRef.current,
        {
          filter: "blur(0px)",
          opacity: 1,
          duration: 0,
        },
        2.7
      );
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    disconnectWallet();
    handleReturnToLanding();
  };

  const handleTransfer = async () => {
    if (!txForm.to || !txForm.amt) {
      showCustomToast("Fill all fields", "error");
      return;
    }

    if (!ethers.isAddress(txForm.to)) {
      showCustomToast("Invalid recipient address", "error");
      return;
    }

    setLoading(true);
    try {
      const tx = await contract.transfer(
        txForm.to,
        ethers.parseUnits(txForm.amt, 18)
      );
      showCustomToast("Sending...", "info");
      await tx.wait();
      showCustomToast("Transfer sent successfully!", "success");
      setTxForm({ to: "", amt: "" });
      await refreshBalance();
    } catch (e) {
      console.error("Transfer failed", e);
      showCustomToast(e.message || "Transfer failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === 0) return "Available now!";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h ? h + "h " : ""}${m}m ${s}s`;
  };

  const handleFaucet = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.faucet();
      showCustomToast("Claiming 100 PC...", "info");
      await tx.wait();
      showCustomToast("100 PC claimed!", "success");
      await Promise.all([refreshBalance(), updateFaucetInfo()]);
    } catch (e) {
      showCustomToast(e.message || "Faucet failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBurn = async () => {
    if (!burnAmt || parseFloat(burnAmt) <= 0) {
      showCustomToast("Enter valid amount", "error");
      return;
    }
    setLoading(true);
    try {
      const tx = await contract.burn(ethers.parseUnits(burnAmt, 18));
      showCustomToast("Burning...", "info");
      await tx.wait();
      showCustomToast("Tokens burned!", "success");
      setBurnAmt("");
      await refreshBalance();
    } catch (e) {
      showCustomToast(e.message || "Burn failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleMint = async () => {
    if (!isOwner) {
      showCustomToast("Only owner can mint", "error");
      return;
    }
    if (!mintForm.to || !mintForm.amt) {
      showCustomToast("Fill all fields", "error");
      return;
    }
    if (!ethers.isAddress(mintForm.to)) {
      showCustomToast("Invalid recipient address", "error");
      return;
    }
    if (parseFloat(mintForm.amt) <= 0) {
      showCustomToast("Enter valid amount", "error");
      return;
    }

    setLoading(true);
    try {
      const tx = await contract.mint(
        mintForm.to,
        ethers.parseUnits(mintForm.amt, 18)
      );
      showCustomToast("Minting tokens...", "info");
      await tx.wait();
      showCustomToast(`${mintForm.amt} PC minted!`, "success");
      setMintForm({ to: "", amt: "" });
      await refreshBalance();
    } catch (e) {
      showCustomToast(e.message || "Mint failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approveForm.spender || !approveForm.amt) {
      showCustomToast("Fill all fields", "error");
      return;
    }
    if (!ethers.isAddress(approveForm.spender)) {
      showCustomToast("Invalid spender address", "error");
      return;
    }
    setLoading(true);
    try {
      const tx = await contract.approve(
        approveForm.spender,
        ethers.parseUnits(approveForm.amt, 18)
      );
      showCustomToast("Approving...", "info");
      await tx.wait();
      showCustomToast("Approved!", "success");
      setApproveForm({ spender: "", amt: "" });
    } catch (e) {
      showCustomToast(e.message || "Approve failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTransferFrom = async () => {
    if (
      !transferFromForm.from ||
      !transferFromForm.to ||
      !transferFromForm.amt
    ) {
      showCustomToast("Fill all fields", "error");
      return;
    }
    if (
      !ethers.isAddress(transferFromForm.from) ||
      !ethers.isAddress(transferFromForm.to)
    ) {
      showCustomToast("Invalid address", "error");
      return;
    }
    setLoading(true);
    try {
      const tx = await contract.transferFrom(
        transferFromForm.from,
        transferFromForm.to,
        ethers.parseUnits(transferFromForm.amt, 18)
      );
      showCustomToast("Transferring...", "info");
      await tx.wait();
      showCustomToast("TransferFrom successful!", "success");
      setTransferFromForm({ from: "", to: "", amt: "" });
      await refreshBalance();
    } catch (e) {
      showCustomToast(e.message || "TransferFrom failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#020202] text-white select-none overflow-y-auto font-sans">
      <Toaster richColors position="bottom-right" theme="dark" />

      {/* SHARED LOGO */}
      <img
        ref={movingLogoRef}
        src="/logo2.png"
        alt="logo"
        className="z-[150] w-32 h-32 md:w-48 md:h-48 object-contain pointer-events-none"
        style={{
          position: isLaunched ? "absolute" : "fixed",
          top: "43.5%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          marginLeft: "15vw",
        }}
      />

      {/* PRELOADER / LANDING */}
      {!isLaunched && (
        <div
          ref={portalLayerRef}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#00275C]"
        >
          <div
            ref={textGroupRef}
            className="flex items-center uppercase font-black italic tracking-tighter text-[11vw] leading-none mb-4"
          >
            <span className="text-white">PEPSI</span>
            <span className="text-[#E30613] ml-6">C</span>
            <div
              className="w-32 h-32 md:w-48 md:h-48 cursor-pointer pointer-events-auto mx-4"
              onClick={handleLaunch}
            ></div>
            <span className="ml-[-110px] text-[#E30613]">IN</span>
          </div>

          <div ref={sloganRef} className="text-center space-y-4">
            <p className="text-blue-300 font-mono tracking-[0.8em] text-sm md:text-lg animate-pulse">
              THE CRYPTO GENERATION
            </p>
            <div className="h-[1px] w-64 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto"></div>
            <button
              onClick={handleLaunch}
              className="text-[10px] font-bold tracking-widest text-white/40 hover:text-white transition-colors"
            >
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
            <div
              ref={easterEggRef}
              className="absolute bottom-32 left-10 font-black italic text-base text-blue-400 whitespace-pre pointer-events-none leading-relaxed"
            ></div>
          )}
          <div className="absolute top-10 right-10 opacity-10 font-black italic text-4xl">
            V.2025
          </div>
        </div>
      )}

      {/* DASHBOARD */}
      <main
        ref={mainRef}
        className={`relative w-full h-full p-8 md:p-16 flex flex-col ${
          !isLaunched ? "invisible" : "visible"
        }`}
      >
        <header className="flex justify-between items-start mb-12">
          <div className="flex flex-col items-start p-[32px] justify-start w-1/3">
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-white">
                PEPSICOIN
              </h1>
              <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-[#E30613]"></div>
              <p className="text-sm text-blue-300 font-mono tracking-widest uppercase leading-relaxed max-w-xs">
                Next Generation Digital Asset
              </p>
              <p className="text-xs text-gray-500 font-light leading-relaxed max-w-xs pt-2">
                Secure, fast, and designed for the modern crypto investor.
                Experience the future of decentralized finance with cutting-edge
                blockchain technology.
              </p>
              <div className="pt-4 flex gap-8 text-xs">
                <div>
                  <p className="text-[10px] text-gray-600 uppercase mb-1">
                    Network
                  </p>
                  <p className="text-blue-400 font-bold">Sepolia Testnet</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 uppercase mb-1">
                    Status
                  </p>
                  <p className="text-green-400 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Active
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-right flex flex-col items-end justify-start">
            <p className="text-blue-500 font-mono text-[10px] tracking-widest uppercase mb-1">
              {account
                ? `CONNECTED: ${account.slice(0, 6)}...${account.slice(-4)}`
                : "NOT CONNECTED"}
            </p>
            {isOwner && (
              <p className="text-blue-400 font-mono text-[10px] tracking-widest uppercase mb-2 animate-pulse">
                ⭐ OWNER ACCESS ⭐
              </p>
            )}
            <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-4">
              BALANCE
            </h2>
            <div className="text-6xl md:text-8xl font-black font-mono tracking-tighter leading-none mb-6">
              {counterBalance}{" "}
              <span className="text-2xl md:text-3xl text-[#E30613] align-top mt-4 inline-block">
                PC
              </span>
            </div>
            {account && (
              <div className="flex gap-4">
                <button
                  onClick={handleOpenAccountModal}
                  className="text-[10px] font-bold tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
                >
                  SWITCH ACCOUNT
                </button>
                <button
                  onClick={handleDisconnect}
                  className="text-[10px] font-bold tracking-widest text-red-400 hover:text-red-300 transition-colors"
                >
                  DISCONNECT
                </button>
              </div>
            )}
          </div>
        </header>

        {/* SCROLLABLE DASHBOARD CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 pb-12 pr-4  scrollbar-hide">
          {/* TOP ROW: Token Metrics + Quick Transfer */}
          <div
            ref={(el) => (cardsRef.current[0] = el)}
            className="lg:col-span-5 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between order-1"
          >
            <div>
              <div className="w-12 h-1 bg-blue-600 mb-6"></div>
              <h3 className="text-lg font-bold italic mb-6 tracking-widest">
                TOKEN METRICS
              </h3>
              <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-2xl">
                  <p className="text-[9px] text-gray-500 font-bold mb-1 uppercase">
                    Total Supply
                  </p>
                  <p className="text-2xl font-mono">
                    {parseFloat(tokenData.totalSupply || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl">
                  <p className="text-[9px] text-gray-500 font-bold mb-1 uppercase">
                    Contract
                  </p>
                  <p className="text-blue-400 font-mono text-xs break-all">
                    {CONTRACT_ADDRESS}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            ref={(el) => (cardsRef.current[1] = el)}
            className="lg:col-span-7 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col justify-between order-2"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[100px] pointer-events-none"></div>
            <div>
              <div className="w-12 h-1 bg-[#E30613] mb-6"></div>
              <h3 className="text-lg font-bold italic mb-8 tracking-widest">
                QUICK TRANSFER
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  className="bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-blue-600 outline-none font-mono text-sm"
                  placeholder="Recipient Address (0x...)"
                  value={txForm.to}
                  onChange={(e) => setTxForm({ ...txForm, to: e.target.value })}
                />
                <input
                  className="bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-blue-600 outline-none font-mono text-sm"
                  placeholder="Amount"
                  type="number"
                  value={txForm.amt}
                  onChange={(e) =>
                    setTxForm({ ...txForm, amt: e.target.value })
                  }
                />
              </div>
            </div>
            <button
              disabled={loading || !account}
              onClick={handleTransfer}
              className="group relative overflow-hidden mt-6 w-full py-5 rounded-2xl font-black uppercase italic tracking-widest text-[white] bg-[#E30613] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute inset-0 text-black bg-black scale-x-0 origin-left transition-transform duration-500 ease-out group-hover:scale-x-100"></span>
              <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
                {loading ? "PROCESSING..." : "CONFIRM TRANSFER"}
              </span>
            </button>
          </div>

          {/* MINT CARD (Owner Only) */}
          <div
            ref={(el) => (cardsRef.current[2] = el)}
            className={`lg:col-span-4 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between order-3 relative group ${
              !isOwner ? "blur-sm hover:blur-none" : ""
            } transition-all duration-300`}
          >
            {!isOwner && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-blue-400 font-black italic text-2xl tracking-widest text-center px-8 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]">
                  ONLY OWNER CAN BE THIS COOL
                </p>
              </div>
            )}
            <div className={!isOwner ? "pointer-events-none" : ""}>
              <div className="w-12 h-1 bg-blue-600 mb-6"></div>
              <h3 className="text-lg font-bold italic mb-6 tracking-widest">
                OWNER MINT
              </h3>
              <input
                className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-blue-600 outline-none font-mono text-sm mb-4"
                placeholder="Recipient Address (0x...)"
                value={mintForm.to}
                onChange={(e) => setMintForm({ ...mintForm, to: e.target.value })}
                disabled={!isOwner}
              />
              <input
                className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-blue-600 outline-none font-mono text-sm mb-4"
                placeholder="Amount to mint"
                type="number"
                value={mintForm.amt}
                onChange={(e) => setMintForm({ ...mintForm, amt: e.target.value })}
                disabled={!isOwner}
              />
            </div>
            <button
              onClick={handleMint}
              disabled={loading || !account || !isOwner}
              className="mt-auto w-full py-5 rounded-2xl font-black uppercase italic tracking-widest text-black bg-blue-500 hover:bg-blue-400 disabled:opacity-50 transition-all"
            >
              {loading ? "MINTING..." : "MINT PC"}
            </button>
          </div>

          {/* BURN CARD */}
          <div
            ref={(el) => (cardsRef.current[3] = el)}
            className="lg:col-span-4 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between order-4"
          >
            <div>
              <div className="w-12 h-1 bg-red-600 mb-6"></div>
              <h3 className="text-lg font-bold italic mb-6 tracking-widest">
                BURN TOKENS
              </h3>
              <input
                className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-red-600 outline-none font-mono text-sm mb-4"
                placeholder="Amount to burn"
                type="number"
                value={burnAmt}
                onChange={(e) => setBurnAmt(e.target.value)}
              />
            </div>
            <button
              onClick={handleBurn}
              disabled={loading || !account || !burnAmt}
              className="mt-auto w-full py-5 rounded-2xl font-black uppercase italic tracking-widest text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-all"
            >
              {loading ? "BURNING..." : "BURN PC"}
            </button>
          </div>

          {/* FAUCET CARD */}
          <div
            ref={(el) => (cardsRef.current[4] = el)}
            className="lg:col-span-4 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between order-5"
          >
            <div>
              <div className="w-12 h-1 bg-blue-600 mb-6"></div>
              <h3 className="text-lg font-bold italic mb-6 tracking-widest">
                FREE FAUCET
              </h3>
              <div className="space-y-4 text-center">
                <p className="text-sm text-gray-400">Claim 100 PC daily</p>
                <p className="text-3xl font-black text-blue-400">
                  {faucetRemaining}
                </p>
                <p className="text-xs text-gray-500">PC remaining (lifetime)</p>
                <p className="text-sm mt-4 text-green-400 font-mono">
                  {timeUntilNext === 0
                    ? "Ready to claim!"
                    : `Next claim in: ${formatTime(timeUntilNext)}`}
                </p>
              </div>
            </div>
            <button
              onClick={handleFaucet}
              disabled={loading || !account || timeUntilNext > 0}
              className="mt-6 w-full py-5 rounded-2xl font-black uppercase italic tracking-widest text-black bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-400 transition-all"
            >
              {loading
                ? "CLAIMING..."
                : timeUntilNext > 0
                ? "WAIT"
                : "CLAIM 100 PC"}
            </button>
          </div>

          {/* ADVANCED CARD */}
          <div
            ref={(el) => (cardsRef.current[5] = el)}
            className="lg:col-span-12 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 flex flex-col order-6"
          >
            <div className="w-12 h-1 bg-blue-600 mb-6"></div>
            <h3 className="text-lg font-bold italic mb-8 tracking-widest text-white">
              ADVANCED: APPROVE & TRANSFER FROM
            </h3>

            <div className="grid lg:grid-cols-2 gap-12 flex-1">
              {/* Left Column: Approve */}
              <div className="flex flex-col">
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-semibold">
                  Approve Spender
                </p>
                <div className="space-y-3 flex-1">
                  <input
                    placeholder="Spender Address (0x...)"
                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    value={approveForm.spender}
                    onChange={(e) =>
                      setApproveForm({
                        ...approveForm,
                        spender: e.target.value,
                      })
                    }
                  />
                  <input
                    placeholder="Amount"
                    type="number"
                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    value={approveForm.amt}
                    onChange={(e) =>
                      setApproveForm({ ...approveForm, amt: e.target.value })
                    }
                  />
                </div>
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="mt-6 w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-2xl font-bold text-sm tracking-widest"
                >
                  {loading ? "PROCESSING..." : "APPROVE"}
                </button>
              </div>

              {/* Right Column: Transfer From */}
              <div className="flex flex-col">
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-semibold">
                  Transfer From
                </p>
                <div className="space-y-3 flex-1">
                  <input
                    placeholder="From Address"
                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                    value={transferFromForm.from}
                    onChange={(e) =>
                      setTransferFromForm({
                        ...transferFromForm,
                        from: e.target.value,
                      })
                    }
                  />
                  <input
                    placeholder="To Address"
                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                    value={transferFromForm.to}
                    onChange={(e) =>
                      setTransferFromForm({
                        ...transferFromForm,
                        to: e.target.value,
                      })
                    }
                  />
                  <input
                    placeholder="Amount"
                    type="number"
                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                    value={transferFromForm.amt}
                    onChange={(e) =>
                      setTransferFromForm({
                        ...transferFromForm,
                        amt: e.target.value,
                      })
                    }
                  />
                </div>
                <button
                  onClick={handleTransferFrom}
                  disabled={loading}
                  className="mt-6 w-full py-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-2xl font-bold text-sm tracking-widest"
                >
                  {loading ? "PROCESSING..." : "TRANSFER FROM"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-auto py-6 flex justify-between items-center opacity-20 text-[10px] font-mono tracking-[0.4em]">
          <span>PEPSICOIN ASSET PROTOCOL</span>
          <span>©2025 ALL RIGHTS RESERVED</span>
        </footer>
      </main>

      {/* ACCOUNT SWITCHER MODAL */}
      {showAccountModal && (
        <div className="fixed inset-0  z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            ref={accountModalRef}
            className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full mx-4"
          >
            <h3 className="text-2xl font-black italic mb-6 tracking-tighter">
              SWITCH ACCOUNT
            </h3>
            <div className="space-y-3 mb-8 max-h-[300px] overflow-y-auto">
              {availableAccounts.map((acc, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSwitchAccount(acc)}
                  disabled={loading}
                  className={`w-full p-4 rounded-2xl font-mono text-sm transition-all ${
                    selectedAccountModal === acc
                      ? "bg-blue-600 border border-blue-400 text-white"
                      : "bg-white/5 border border-white/10 text-gray-400 hover:border-white/20"
                  } disabled:opacity-50`}
                >
                  <div className="text-left">
                    <p className="text-[10px] text-gray-500 mb-1">
                      Account {idx + 1}
                    </p>
                    <p className="break-all">{acc}</p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={handleCloseAccountModal}
              className="relative w-full py-3 bg-red-600 border border-red-500 text-white font-bold rounded-md overflow-hidden transition-all uppercase italic tracking-widest text-sm group"
            >
              <span className="absolute inset-0 bg-black translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-out"></span>
              <span className="relative z-10">CLOSE</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
