'use client'
import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { create } from 'zustand';
import { toast as sonnerToast, Toaster } from 'sonner';
import { gsap } from 'gsap';

// --- CONTRACT CONFIG ---
// Custom Toast Component
const CustomToast = ({ id, title, type, onClose }) => {
    const toastRef = useRef(null);
    const logoRef = useRef(null);
    const textRef = useRef(null);

    useEffect(() => {
        const timeline = gsap.timeline();
        
        // Show toast
        gsap.fromTo(toastRef.current,
            { opacity: 0, y: 50 },
            { opacity: 1, y: 0, duration: 0.4, ease: "back.out" }
        );

        // After 4 seconds, start erasing
        timeline.to({}, {}, "+=4")
            .to(textRef.current, {
                opacity: 0,
                filter: "blur(10px)",
                duration: 0.5,
                ease: "power2.in"
            }, "-=0.3")
            .to(logoRef.current, {
                scale: 2,
                rotation: 720,
                opacity: 0,
                filter: "blur(15px)",
                duration: 0.6,
                ease: "power2.in"
            }, "-=0.4")
            .to(toastRef.current, {
                y: 100,
                opacity: 0,
                duration: 0.4,
                ease: "power2.in",
                onComplete: onClose
            }, "-=0.3");
    }, [onClose]);

    const bgColor = type === 'error' ? 'bg-red-600/10 border-red-500/20' : 
                    type === 'success' ? 'bg-green-600/10 border-green-500/20' :
                    type === 'info' ? 'bg-blue-600/10 border-blue-500/20' : 'bg-white/5 border-white/10';

    const textColor = type === 'error' ? 'text-red-400' : 
                      type === 'success' ? 'text-green-400' :
                      type === 'info' ? 'text-blue-400' : 'text-white';

    return (
        <div 
            ref={toastRef}
            className={`flex items-center justify-between gap-4 ${bgColor} border rounded-2xl p-4 backdrop-blur-sm min-w-[300px]`}
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

// Toast Manager
const toasts = new Map();
let toastId = 0;

const showCustomToast = (message, type = 'info') => {
    const id = toastId++;
    sonnerToast.custom((t) => (
        <CustomToast 
            id={id}
            title={message}
            type={type}
            onClose={() => t.dismiss()}
        />
    ), {
        duration: 5000,
        position: 'bottom-right'
    });
};
const CONTRACT_ADDRESS = '0x91B1DC5BFC2DA049667037ec714a67430db0dB82';
const CONTRACT_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)"
];

// --- ZUSTAND STORE ---
const useWeb3Store = create((set, get) => ({
    account: null,
    balance: '0',
    isConnected: false,
    contract: null,
    tokenData: { name: 'PepsiCoin', symbol: 'PC', totalSupply: '0' },
    provider: null,
    
   connectWallet: async () => {
    if (!window.ethereum) {
        showCustomToast('MetaMask not installed', 'error');
        return false;
    }

    try {
        // Step 1: Request accounts (this prompts connection if not already connected)
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });

        if (!accounts.length) {
            showCustomToast('No accounts found', 'error');
            return false;
        }

        // Step 2: Create provider and check current network
        let provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        const sepoliaChainId = 11155111n; // BigInt for ethers v6

        if (network.chainId !== sepoliaChainId) {
            try {
                // Try to switch to Sepolia
                await provider.send('wallet_switchEthereumChain', [
                    { chainId: '0xaa36a7' } // Hex for 11155111
                ]);
                showCustomToast('Switched to Sepolia Testnet', 'success');
            } catch (switchError) {
                // If chain not added (error code 4902), add it first
                if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
                    try {
                        await provider.send('wallet_addEthereumChain', [
                            {
                                chainId: '0xaa36a7',
                                chainName: 'Sepolia Testnet',
                                nativeCurrency: {
                                    name: 'Sepolia ETH',
                                    symbol: 'ETH',
                                    decimals: 18
                                },
                                rpcUrls: ['https://rpc.sepolia.org'], // Reliable public RPC
                                blockExplorerUrls: ['https://sepolia.etherscan.io']
                            }
                        ]);
                        showCustomToast('Added & switched to Sepolia Testnet', 'success');

                        // After adding, switch again
                        await provider.send('wallet_switchEthereumChain', [
                            { chainId: '0xaa36a7' }
                        ]);
                    } catch (addError) {
                        showCustomToast('Failed to add Sepolia network', 'error');
                        return false;
                    }
                } else {
                    showCustomToast('Please switch to Sepolia Testnet manually', 'error');
                    return false;
                }
            }

            // Recreate provider after network switch
            provider = new ethers.BrowserProvider(window.ethereum);
        }

        // Step 3: Get signer and contract
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        // Step 4: Update store
        set({ 
            account: accounts[0], 
            isConnected: true, 
            contract, 
            provider 
        });

        await get().fetchMetadata();
        await get().refreshBalance();

        // Step 5: Set up listeners
        window.ethereum.removeListener('accountsChanged', get().handleAccountsChanged);
        window.ethereum.on('accountsChanged', get().handleAccountsChanged);

        // Reload on manual chain change (safest for most dApps)
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        function handleChainChanged() {
            window.location.reload();
        }

        return true;
    } catch (err) {
        console.error(err);
        showCustomToast(err.message || 'Connection failed', 'error');
        return false;
    }
},

    handleAccountsChanged: (accounts) => {
        if (accounts.length === 0) {
            set({ 
                account: null, 
                isConnected: false, 
                contract: null,
                balance: '0',
                provider: null
            });
            showCustomToast('Wallet disconnected', 'info');
        } else if (accounts[0] !== get().account) {
            set({ account: accounts[0] });
            showCustomToast(`Account switched to ${accounts[0].slice(0,6)}...${accounts[0].slice(-4)}`, 'info');
            get().refreshBalance();
        }
    },

    disconnectWallet: () => {
        if (window.ethereum) {
            window.ethereum.removeListener('accountsChanged', get().handleAccountsChanged);
        }
        set({ 
            account: null, 
            isConnected: false, 
            contract: null,
            balance: '0',
            provider: null
        });
    },

    fetchMetadata: async () => {
        const { contract } = get();
        if (!contract) return;
        try {
            const [name, symbol, total] = await Promise.all([
                contract.name(), 
                contract.symbol(), 
                contract.totalSupply()
            ]);
            set({ tokenData: { name, symbol, totalSupply: ethers.formatUnits(total, 18) }});
        } catch (e) { 
            console.warn("Metadata fetch failed", e);
            showCustomToast("Failed to fetch token data", "error");
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
            showCustomToast("Failed to fetch balance", "error");
        }
    }
}));

export default function PepsiCoinApp() {
    const { account, balance, tokenData, connectWallet, refreshBalance, contract, disconnectWallet } = useWeb3Store();
    const [isLaunched, setIsLaunched] = useState(false);
    const [isPreLoaded, setIsPreLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [counterBalance, setCounterBalance] = useState("0.00");
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [availableAccounts, setAvailableAccounts] = useState([]);
    const [selectedAccountModal, setSelectedAccountModal] = useState(null);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [showEasterEgg, setShowEasterEgg] = useState(false);
const easterEggRef = useRef(null);

    const [txForm, setTxForm] = useState({ to: '', amt: '' });
    const portalLayerRef = useRef(null);
    const movingLogoRef = useRef(null);
    const textGroupRef = useRef(null); 
    const cardsRef = useRef([]);
    const sloganRef = useRef(null);
    const accountModalRef = useRef(null);
    const mainRef = useRef(null);

    // Global Scroll Removal
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    // Pre-preloader animation on mount
    useEffect(() => {
        gsap.set(movingLogoRef.current, { scale: 50, rotation: 720 });
        
        const preLoadTimeline = gsap.timeline({
            onComplete: () => setIsPreLoaded(true)
        });

        preLoadTimeline.to(movingLogoRef.current,
            { scale: 1, rotation: 0, duration: 1.5, ease: "power4.inOut" }
        );
    }, []);

    // Monitor wallet connection and transition back to landing if disconnected
    useEffect(() => {
        if (isLaunched && !account && !isDisconnecting) {
            handleReturnToLanding();
        }
    }, [account, isLaunched, isDisconnecting]);

    // Odometer
    useEffect(() => {
        if (isLaunched && balance !== '0') {
            const obj = { val: 0 };
            gsap.to(obj, {
                val: parseFloat(balance),
                duration: 2,
                ease: "power3.out",
                onUpdate: () => setCounterBalance(obj.val.toLocaleString(undefined, {minimumFractionDigits: 2}))
            });
        }
    }, [balance, isLaunched]);


   const handleEasterEggHover = () => {
    setShowEasterEgg(true);
    const text = "not_me_lol_ive_been_here_since_yesterday";
    const letters = text.split('');
    
    gsap.fromTo(easterEggRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 }
    );

    letters.forEach((letter, idx) => {
        const letterEl = document.createElement('span');
        letterEl.textContent = letter;
        letterEl.style.opacity = '0';
        letterEl.style.display = 'inline-block';
        easterEggRef.current.appendChild(letterEl);

        gsap.fromTo(letterEl,
            { opacity: 0, y: -20, rotation: 10, filter: "blur(12px)" },
            { 
                opacity: 1, 
                y: 0, 
                rotation: 0,
                filter: "blur(0px)",
                duration: 0.4,
                delay: idx * 0.03,
                ease: "back.out"
            }
        );
    });
};

const handleEasterEggLeave = () => {
    if (easterEggRef.current) {
        const letters = easterEggRef.current.querySelectorAll('span');
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
                        easterEggRef.current.innerHTML = '';
                    }
                }
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
            stagger: 0.1
        })
        .to(movingLogoRef.current, {
            scale: 50, 
            rotation: 720,
            duration: 1.5,
            force3D: true,
        }, "-=0.4")
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
            ease: "power4.inOut"
        })
        .to(portalLayerRef.current, { 
            opacity: 0, 
            display: "none",
            duration: 0.5 
        }, "-=1")
        .fromTo(cardsRef.current, 
            { y: 100, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.1, duration: 1, ease: "expo.out" },
            "-=0.5"
        );
    };

    const handleOpenAccountModal = async () => {
        if (!window.ethereum) {
            showCustomToast('MetaMask not installed', 'error');
            return;
        }

        try {
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            const allAccounts = await window.ethereum.request({
                method: 'eth_accounts'
            });

            const uniqueAccounts = [...new Set([...accounts, ...allAccounts])];
            setAvailableAccounts(uniqueAccounts);
            setSelectedAccountModal(account);
            setShowAccountModal(true);
            
            setTimeout(() => {
                if (accountModalRef.current) {
                    gsap.fromTo(accountModalRef.current,
                        { scale: 0, opacity: 0, y: 100 },
                        { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: "back.out" }
                    );
                }
            }, 0);
        } catch (err) {
            showCustomToast(err.message || 'Failed to fetch accounts', 'error');
        }
    };

    const handleCloseAccountModal = () => {
        if (accountModalRef.current) {
            gsap.to(accountModalRef.current, {
                scale: 0,
                opacity: 0,
                y: 100,
                duration: 0.5,
                ease: "back.in",
                onComplete: () => setShowAccountModal(false)
            });
        }
    };

    const handleSwitchAccount = async (newAccount) => {
        setSelectedAccountModal(newAccount);
        setLoading(true);

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            
            if (!signer) {
                showCustomToast('Failed to get signer', 'error');
                setLoading(false);
                return;
            }

            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            
            const store = useWeb3Store.getState();
            store.account = newAccount;
            store.isConnected = true;
            store.contract = contract;
            store.provider = provider;
            
            await store.refreshBalance();

            showCustomToast(`Switched to ${newAccount.slice(0,6)}...${newAccount.slice(-4)}`, 'success');
            handleCloseAccountModal();
        } catch (err) {
            showCustomToast(err.message || 'Failed to switch account', 'error');
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
            }
        });

        // Phase 1: Show landing page immediately and blur dashboard
        tl.to(portalLayerRef.current, {
            opacity: 1,
            display: 'flex',
            duration: 0.3
        }, 0)
        .to(mainRef.current, {
            filter: 'blur(20px)',
            opacity: 0,
            duration: 0.8,
            ease: 'power2.inOut'
        }, 0)
        
        // Phase 2: Scale logo to max with spin
        .to(movingLogoRef.current, {
            scale: 50,
            rotation: 720,
            duration: 1.5,
            ease: 'power4.inOut',
            force3D: true
        }, 0)
        
        // Phase 3: Reverse logo back to landing position
        .to(movingLogoRef.current, {
            scale: 1,
            rotation: 0,
            top: '43.5%',
            left: '50%',
            marginLeft: '15vw',
            width: '192px',
            height: '192px',
            duration: 1.5,
            ease: 'power4.inOut',
            force3D: true
        }, 1.2)
        // Reset main content visibility and blur
        .to(mainRef.current, {
            filter: 'blur(0px)',
            opacity: 1,
            duration: 0
        }, 2.7);
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
            const tx = await contract.transfer(txForm.to, ethers.parseUnits(txForm.amt, 18));
            showCustomToast("Sending...", "info");
            await tx.wait();
            showCustomToast("Transfer sent successfully!", "success");
            setTxForm({ to: '', amt: '' });
            await refreshBalance();
        } catch (e) { 
            console.error("Transfer failed", e);
            showCustomToast(e.message || "Transfer failed", "error");
        }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-[#020202] text-white select-none font-sans overflow-hidden">
            <Toaster 
    richColors 
    position="bottom-right"
    theme="dark"
/>

            {/* SHARED LOGO */}
            <img 
                ref={movingLogoRef}
                src="/logo2.png" 
                alt="logo"
                className="fixed z-[150] w-32 h-32 md:w-48 md:h-48 object-contain pointer-events-none"
                style={{
                    top: '43.5%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    marginLeft: '15vw'
                }}
            />

            {/* PRELOADER / LANDING */}
            {!isLaunched && (
                <div ref={portalLayerRef} className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#00275C]">
                    {/* Main Title Group */}
                    <div ref={textGroupRef} className="flex items-center uppercase font-black italic tracking-tighter text-[11vw] leading-none mb-4">
                        <span className="text-white">PEPSI</span>
                        <span className="text-[#E30613] ml-6">C</span>
                        {/* Interactive Gap */}
                        <div 
                            className="w-32 h-32 md:w-48 md:h-48 cursor-pointer pointer-events-auto mx-4" 
                            onClick={handleLaunch}
                        ></div>
                        <span className="ml-[-110px] text-[#E30613]">IN</span>
                    </div>

                    {/* Filling the Space: Slogan & Subtext */}
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
{/* Background Decorative Text */}
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
{showEasterEgg && (
    <div 
        ref={easterEggRef}
        className="absolute bottom-10 left-10 font-black italic text-2xl text-blue-400 whitespace-nowrap pointer-events-none"
    ></div>
)}                    <div className="absolute top-10 right-10 opacity-10 font-black italic text-4xl">V.2025</div>
                </div>
            )}

            {/* DASHBOARD */}
            <main ref={mainRef} className={`relative w-full h-full p-8 md:p-16  flex flex-col ${!isLaunched ? 'invisible' : 'visible'}`}>
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
                                Secure, fast, and designed for the modern crypto investor. Experience the future of decentralized finance with cutting-edge blockchain technology.
                            </p>
                            <div className="pt-4 flex gap-8 text-xs">
                                <div>
                                    <p className="text-[10px] text-gray-600 uppercase mb-1">Network</p>
                                    <p className="text-blue-400 font-bold">Sepolia Testnet</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-600 uppercase mb-1">Status</p>
                                    <p className="text-green-400 font-bold flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                        Active
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SECTION - ACCOUNT & BALANCE */}
                    <div className="text-right flex flex-col items-end justify-start">
                        <p className="text-blue-500 font-mono text-[10px] tracking-widest uppercase mb-1">
                            {account ? `CONNECTED: ${account.slice(0,6)}...${account.slice(-4)}` : "NOT CONNECTED"}
                        </p>
                        <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-4">BALANCE</h2>
                        <div className="text-6xl md:text-8xl font-black font-mono tracking-tighter leading-none mb-6">
                            {counterBalance} <span className="text-2xl md:text-3xl text-[#E30613] align-top mt-4 inline-block">PC</span>
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 max-h-[60vh]">
                    {/* Metrics Card */}
                    <div ref={el => cardsRef.current[0] = el} className="lg:col-span-4 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-1 bg-blue-600 mb-6"></div>
                            <h3 className="text-lg font-bold italic mb-6 tracking-widest">TOKEN METRICS</h3>
                            <div className="space-y-4">
                                <div className="bg-white/5 p-4 rounded-2xl">
                                    <p className="text-[9px] text-gray-500 font-bold mb-1 uppercase">Total Supply</p>
                                    <p className="text-2xl font-mono">{parseFloat(tokenData.totalSupply).toLocaleString()}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl">
                                    <p className="text-[9px] text-gray-500 font-bold mb-1 uppercase">Network</p>
                                    <p className="text-blue-400 font-bold">Sepolia Testnet</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transfer Card */}
                    <div ref={el => cardsRef.current[1] = el} className="lg:col-span-8 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[100px] pointer-events-none"></div>
                        <div>
                            <div className="w-12 h-1 bg-[#E30613] mb-6"></div>
                            <h3 className="text-lg font-bold italic mb-8 tracking-widest">QUICK TRANSFER</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <input 
                                    className="bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-blue-600 outline-none font-mono text-sm"
                                    placeholder="Recipient Address (0x...)"
                                    value={txForm.to}
                                    onChange={e => setTxForm({...txForm, to: e.target.value})}
                                />
                                <input 
                                    className="bg-white/5 border border-white/10 p-5 rounded-2xl focus:border-blue-600 outline-none font-mono text-sm"
                                    placeholder="Amount"
                                    type="number"
                                    value={txForm.amt}
                                    onChange={e => setTxForm({...txForm, amt: e.target.value})}
                                />
                            </div>
                        </div>
                        <button
  disabled={loading || !account}
  onClick={handleTransfer}
  className="
    group relative overflow-hidden
    mt-6 w-full py-5
    rounded-2xl
    font-black uppercase italic tracking-widest
    text-black
    bg-white
    disabled:opacity-50 disabled:cursor-not-allowed
  "
>
  {/* sliding background */}
  <span
    className="
      absolute inset-0
      bg-[#E30613]
      scale-x-0
      origin-left
      transition-transform duration-500 ease-out
      group-hover:scale-x-100
      group-hover:origin-left
      group-disabled:scale-x-0
    "
  />

  {/* text */}
  <span
    className="
      relative z-10
      transition-colors duration-300
      group-hover:text-white
    "
  >
    {loading ? "PROCESSING..." : "CONFIRM TRANSFER"}
  </span>
</button>

                    </div>
                </div>

                <footer className="mt-auto py-6 flex justify-between items-center opacity-20 text-[10px] font-mono tracking-[0.4em]">
                    <span>PEPSICOIN ASSET PROTOCOL</span>
                    <span>©2025 ALL RIGHTS RESERVED</span>
                </footer>
            </main>

            {/* ACCOUNT SWITCHER MODAL */}
            {showAccountModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div ref={accountModalRef} className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full mx-4">
                        <h3 className="text-2xl font-black italic mb-6 tracking-tighter">SWITCH ACCOUNT</h3>
                        <div className="space-y-3 mb-8 max-h-[300px] overflow-y-auto">
                            {availableAccounts.map((acc, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSwitchAccount(acc)}
                                    disabled={loading}
                                    className={`w-full p-4 rounded-2xl font-mono text-sm transition-all ${
                                        selectedAccountModal === acc
                                            ? 'bg-blue-600 border border-blue-400 text-white'
                                            : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/20'
                                    } disabled:opacity-50`}
                                >
                                    <div className="text-left">
                                        <p className="text-[10px] text-gray-500 mb-1">Account {idx + 1}</p>
                                        <p className="break-all">{acc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleCloseAccountModal}
                            className="w-full py-3 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all uppercase italic tracking-widest text-sm"
                        >
                            CLOSE
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}