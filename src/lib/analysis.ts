import { GatekeeperResult, TokenData } from './types';

export function assessGatekeeper(token: TokenData): GatekeeperResult {
  const flags: string[] = [];
  let status: 'PASS' | 'WARN' | 'FAIL' = 'PASS';

  // Rule 1: Volume Check
  if (token.total_volume < 500000) {
    flags.push('Low Liquidity (Vol < $500k)');
    status = 'WARN';
  }

  // Rule 2: Microcap Check
  if (token.market_cap < 5000000) {
    flags.push('Microcap Risk (MCap < $5M)');
    // If it's already WARN, it stays WARN. Usually low mcap is just a risk, not an instant fail unless extreme.
    if (status === 'PASS') status = 'WARN';
  }

  // Example fail condition: Extremely low volume
  if (token.total_volume < 10000) {
      status = 'FAIL';
      flags.push('Zombie Liquidity (Vol < $10k)');
  }

  return { status, flags };
}
