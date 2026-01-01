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

  // Trace Logic
  const traceRules = [
      { 
          name: 'Liquidity Check (> $500k)', 
          passed: token.total_volume >= 500000, 
          value: `$${token.total_volume.toLocaleString()}`, 
          threshold: '$500,000' 
      },
      { 
          name: 'Microcap Check (> $5M)', 
          passed: token.market_cap >= 5000000, 
          value: `$${token.market_cap.toLocaleString()}`, 
          threshold: '$5,000,000' 
      },
      { 
          name: 'Zombie Check (Vol > $10k)', 
          passed: token.total_volume >= 10000, 
          value: `$${token.total_volume.toLocaleString()}`, 
          threshold: '$10,000' 
      }
  ];

  return { 
      status, 
      flags,
      trace: {
          rules: traceRules,
          inputs: {
              marketCap: token.market_cap,
              volume: token.total_volume,
              fdv: token.fully_diluted_valuation || 'N/A',
              price: token.current_price
          },
          timestamp: new Date().toISOString(),
          source: 'CoinGecko API'
      }
  };
}
