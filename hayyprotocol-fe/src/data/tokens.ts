export type TokenSymbol = "STX" | "BTC" | "sBTC" | "ETH" | "USDC" | "WBTC";

export interface TokenInfo {
  symbol: TokenSymbol;
  name: string;
  status: "Active" | "Coming Soon";
  chain?: "Stacks" | "Ethereum" | "Polygon";
  apySupply?: number; // %
  apyBorrow?: number; // %
  interestRate?: number; // % for borrowing display
  availableLiquidity?: number; // units of token available to borrow
}

export const TOKENS: Record<TokenSymbol, TokenInfo> = {
  STX: { symbol: "STX", name: "Stacks", status: "Active", apySupply: 4.2, chain: "Stacks" },
  BTC: { symbol: "BTC", name: "Bitcoin", status: "Coming Soon", apySupply: 0.0, chain: "Bitcoin" as any },
  sBTC: { symbol: "sBTC", name: "Stacks Bitcoin", status: "Active", apySupply: 6.5, chain: "Stacks" },
  ETH: { symbol: "ETH", name: "Ethereum", status: "Coming Soon", apySupply: 0.0, apyBorrow: 3.9, interestRate: 3.9, chain: "Ethereum", availableLiquidity: 5000 },
  USDC:{ symbol: "USDC", name: "USD Coin", status: "Coming Soon", apySupply: 0.0, apyBorrow: 2.5, interestRate: 2.5, chain: "Ethereum", availableLiquidity: 1000000 },
  WBTC:{ symbol: "WBTC", name: "Wrapped BTC", status: "Coming Soon", apySupply: 0.0, apyBorrow: 4.9, interestRate: 4.9, chain: "Ethereum", availableLiquidity: 1000 },
};

export const BORROWABLE_TOKENS: TokenSymbol[] = ["USDC", "ETH", "WBTC"];

export const PRICES_USD: Record<TokenSymbol, number> = {
  STX: 2.0,
  BTC: 65000,
  sBTC: 65000,
  ETH: 3500,
  USDC: 1,
  WBTC: 65000,
};
