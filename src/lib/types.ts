export interface TokenData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  circulating_supply: number;
  platforms?: { [key: string]: string };
  fully_diluted_valuation: number | null;
  price_change_percentage_24h: number;
  github_repos: string[];
}

export interface GatekeeperResult {
  status: 'PASS' | 'WARN' | 'FAIL';
  flags: string[];
}
