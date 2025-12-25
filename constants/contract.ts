export const CONTRACT_ADDRESS = "0x6B36835F27fBbFB609eCEb8B5965210a582E6ad5";

export const OWNER_ADDRESS = "0x0a3688922f7f85d48d5335E901E248171b9392c5".toLowerCase();

export const CONTRACT_ABI = [
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
] as const;