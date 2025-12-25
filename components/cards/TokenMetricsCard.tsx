import { useWeb3Store } from "@/lib/web3Store";
import { CONTRACT_ADDRESS } from "@/constants/contract";

export default function TokenMetricsCard() {
  const { tokenData } = useWeb3Store();

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between">
      <div>
        <div className="w-12 h-1 bg-blue-600 mb-6" />
        <h3 className="text-lg font-bold italic mb-6 tracking-widest">TOKEN METRICS</h3>
        <div className="space-y-4">
          <div className="bg-white/5 p-4 rounded-2xl">
            <p className="text-[9px] text-gray-500 font-bold mb-1 uppercase">Total Supply</p>
            <p className="text-2xl font-mono">
              {parseFloat(tokenData.totalSupply || "0").toLocaleString()}
            </p>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl">
            <p className="text-[9px] text-gray-500 font-bold mb-1 uppercase">Contract</p>
            <p className="text-blue-400 font-mono text-xs break-all">{CONTRACT_ADDRESS}</p>
          </div>
        </div>
      </div>
    </div>
  );
}