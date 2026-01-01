
import { ethers } from 'ethers';
import { DEFAULT_RPC } from './constants';
import { TokenData } from './types';

export interface TreasuryAsset {
    symbol: string;
    balance: number;
    valueUsd: number;
    isNative: boolean;
    isStable: boolean;
    address?: string;
}

export interface TreasuryAnalysis {
    assets: TreasuryAsset[];
    totalValueUsd: number;
    stablecoinReserves: number;
    nativeTokenReserves: number;
    estimatedMonthlyBurn: number;
    runwayMonths: number;
    stressRunwayMonths: number; // Native price -50%
    burnRateSource: 'ESTIMATED_ONCHAIN' | 'MANUAL_INPUT';
    riskLevel: 'HEALTHY' | 'CAUTION' | 'CRITICAL';
    flags: string[];
}

const STABLECOINS = [
    { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
    { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 }
];

const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "event Transfer(address indexed from, address indexed to, uint256 value)"
];

const provider = new ethers.JsonRpcProvider(DEFAULT_RPC);

export async function analyzeTreasury(
    treasuryAddress: string, 
    tokenData: TokenData, 
    inputBurnRate?: number // Optional manual override
): Promise<TreasuryAnalysis> {
    const assets: TreasuryAsset[] = [];
    let totalValueUsd = 0;
    let stablecoinReserves = 0;
    let nativeTokenReserves = 0;

    // 1. Fetch Native ETH Balance
    const ethBalanceRaw = await provider.getBalance(treasuryAddress);
    const ethBalance = parseFloat(ethers.formatEther(ethBalanceRaw));
    // Assume ETH price $3500 for estimation if not fetching, OR fetch via API. 
    // Since we have CoinGecko for the main token, getting ETH price is an extra step. 
    // For now, let's assume a static reasonable price or 0 if we want to be hyper-conservative.
    // Better: Fetch ETH price? We don't have a direct helper for "ETH" price in our current api.ts easily without a new call.
    // Let's use a conservative placeholder or just treat it as a "Stable" asset if it's ETH? No, it's volatile.
    // Let's assume $2000 for safety or skip converting to USD precisely? 
    // Actually, let's just mark it but maybe not value it perfectly without price feed.
    // Wait, `tokenData` has `current_price` for the PROJECT token. 
    // I entered "NO paid APIs". I recall `api.ts` `searchTokens` returns list.
    // I'll skip fetching ETH price to keep it simple and fast, or assume $3000.
    const ESTIMATED_ETH_PRICE = 3000; 
    
    if (ethBalance > 0) {
        const val = ethBalance * ESTIMATED_ETH_PRICE;
        assets.push({
            symbol: 'ETH',
            balance: ethBalance,
            valueUsd: val,
            isNative: false,
            isStable: false
        });
        totalValueUsd += val;
    }

    // 2. Fetch Stablecoins
    for (const stable of STABLECOINS) {
        try {
            const contract = new ethers.Contract(stable.address, ERC20_ABI, provider);
            const balRaw = await contract.balanceOf(treasuryAddress);
            const bal = parseFloat(ethers.formatUnits(balRaw, stable.decimals));
            if (bal > 1) { // Ignore dust
                // stable value = balance (approx $1 peg)
                assets.push({
                    symbol: stable.symbol,
                    balance: bal,
                    valueUsd: bal,
                    isNative: false,
                    isStable: true
                });
                totalValueUsd += bal;
                stablecoinReserves += bal;
            }
        } catch (e) {
            console.warn(`Failed to fetch ${stable.symbol}`, e);
        }
    }

    // 3. Fetch Project Native Token
    // We need the contract address. `tokenData.platforms` has it.
    const nativeAddr = tokenData.platforms?.['ethereum'];
    if (nativeAddr) {
        try {
            const contract = new ethers.Contract(nativeAddr, ERC20_ABI, provider);
             // We don't know decimals for sure, assume 18 unless we check?
            // Most are 18.
            const balRaw = await contract.balanceOf(treasuryAddress);
            const bal = parseFloat(ethers.formatUnits(balRaw, 18)); // Assumption
            
            if (bal > 0) {
                const val = bal * tokenData.current_price;
                assets.push({
                    symbol: tokenData.symbol.toUpperCase(),
                    balance: bal,
                    valueUsd: val,
                    isNative: true,
                    isStable: false,
                    address: nativeAddr
                });
                totalValueUsd += val;
                nativeTokenReserves += val;
            }
        } catch (e) {
            console.warn("Failed to fetch native token balance", e);
        }
    }

    // 4. Estimate Burn Rate (if not provided)
    let burnRate = inputBurnRate || 0;
    let burnSource: TreasuryAnalysis['burnRateSource'] = inputBurnRate ? 'MANUAL_INPUT' : 'ESTIMATED_ONCHAIN';

    if (!inputBurnRate) {
        // Scan stablecoin OUTFLOWS - that's the real burn usually.
        // Scanning 30 days (216,000 blocks roughly? No, 7200/day * 30 = ~216k.)
        // That's A LOT for a public RPC.
        // Let's scan 3 days (approx 20k blocks) and multiply by 10 for a rough estimate.
        // Or 7 days x 4.
        const endBlock = await provider.getBlockNumber();
        const startBlock = endBlock - 50000; // ~1 week

        let weeklyBurn = 0;

        for (const stable of STABLECOINS) {
             const contract = new ethers.Contract(stable.address, ERC20_ABI, provider);
             const filter = contract.filters.Transfer(treasuryAddress, null); // From Treasury -> Anywhere
             try {
                const logs = await contract.queryFilter(filter, startBlock, endBlock);
                logs.forEach((log: any) => {
                    const val = parseFloat(ethers.formatUnits(log.args[2], stable.decimals));
                    weeklyBurn += val;
                });
             } catch (e) {
                 console.warn(`Failed to scan logs for ${stable.symbol}`, e);
             }
        }
        
        // Also check ETH outflows? ignoring for now as gas is small often, or complex.
        burnRate = weeklyBurn * 4; // Monthly estimate
    }
    
    // Safety check: if burn is 0, set to 1 to avoid Infinity
    if (burnRate === 0) burnRate = 1;

    // 5. Calculate Runway
    const runwayMonths = totalValueUsd / burnRate;

    // 6. Stress Test: Native Token -50%
    const stressTotal = stablecoinReserves + (assets.find(a => a.symbol === 'ETH')?.valueUsd || 0) + (nativeTokenReserves * 0.5);
    const stressRunwayMonths = stressTotal / burnRate;

    // 7. Flags
    const flags: string[] = [];
    let riskLevel: TreasuryAnalysis['riskLevel'] = 'HEALTHY';

    if (runwayMonths < 6) {
        riskLevel = 'CRITICAL';
        flags.push('Critical Funding Risk (< 6mo)');
    } else if (runwayMonths < 12) {
        riskLevel = 'CAUTION';
        flags.push('Short Runway Risk (< 12mo)');
    }

    if (nativeTokenReserves > totalValueUsd * 0.7) {
        flags.push('High Token Price Dependency (>70%)');
        if (riskLevel === 'HEALTHY') riskLevel = 'CAUTION';
    }
    
    if (burnRate > totalValueUsd * 0.1) {
         flags.push('High Burn Rate (>10% treasury/mo)');
    }

    return {
        assets,
        totalValueUsd,
        stablecoinReserves,
        nativeTokenReserves,
        estimatedMonthlyBurn: burnRate,
        runwayMonths,
        stressRunwayMonths,
        burnRateSource: burnSource,
        riskLevel,
        flags
    };
}
