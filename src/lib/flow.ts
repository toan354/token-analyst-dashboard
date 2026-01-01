
import { ethers } from 'ethers';
import { DEFAULT_RPC } from './constants';

// ERC20 Transfer Event Signature
const TRANSFER_TOPIC = ethers.id("Transfer(address,address,uint256)");

export interface FlowMetrics {
    date: string; // MM-DD
    netflow: number;
    inflow: number;
    outflow: number;
    whaleMoves: number;
}

export interface FlowAnalysisResult {
    metrics: FlowMetrics[];
    totalVolume: number;
    whaleNetflow: number;
    thesisStatus: 'VALID' | 'WARNING' | 'INVALIDATED';
    invalidationReason: string;
}

export interface FlowConfig {
    tokenAddress: string;
    poolAddress?: string; // Optional LP to track
    cexAddresses?: string[]; // Optional known CEX
    whaleThreshold: number; // Amount to consider "Whale"
    thesis: 'ACCUMULATION' | 'ORGANIC_GROWTH' | 'DISTRIBUTION';
}

const ERC20_ABI = [
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "function decimals() view returns (uint8)"
];

const provider = new ethers.JsonRpcProvider(DEFAULT_RPC);

export async function fetchFlowData(config: FlowConfig): Promise<FlowAnalysisResult> {
    const { tokenAddress, poolAddress, cexAddresses = [], whaleThreshold, thesis } = config;

    // 1. Get Contract & Decimals
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    let decimals = 18;
    try {
        decimals = await contract.decimals();
    } catch {
        console.warn("Could not fetch decimals, assuming 18");
    }

    // 2. Determine Block Range (Last ~7 days @ 12s block time = ~50k blocks)
    // To be safe with public RPCs, let's do last 24h (~7200 blocks) or small chunk.
    // User constraints say "Daily or weekly aggregation".
    // Let's try 10,000 blocks (~33 hours).
    const endBlock = await provider.getBlockNumber();
    const startBlock = endBlock - 10000; 

    // 3. Fetch Logs
    // We cannot use contract.queryFilter easily on public RPCs for large ranges sometimes.
    // Using raw getLogs might be better controlled.
    const filter = contract.filters.Transfer();
    const logs = await contract.queryFilter(filter, startBlock, endBlock);

    const dailyMap = new Map<string, FlowMetrics>();
    let totalVolume = 0;
    let whaleNetflow = 0;

    // 4. Process Logs
    logs.forEach((log: any) => {
        // Parse Args
        const from = log.args[0];
        const to = log.args[1];
        const valRaw = log.args[2];
        const value = parseFloat(ethers.formatUnits(valRaw, decimals));

        // Basic Info
        totalVolume += value;
        // Approximation of date from block number (not accurate without fetching block time, but consistent relative)
        // Let's group simply by "chunks" or just single bucket for this snapshot if we can't get all block timestamps efficiently.
        // Actually, we can just return a single "Snapshot" metric or a few buckets based on block diff.
        // For the Chart, let's just make 5 buckets of 2000 blocks each.
        const bucketId = Math.floor((log.blockNumber - startBlock) / 2000);
        const dateKey = `Bin ${bucketId}`; // Conceptual time bin

        if (!dailyMap.has(dateKey)) {
            dailyMap.set(dateKey, { date: dateKey, netflow: 0, inflow: 0, outflow: 0, whaleMoves: 0 });
        }
        const m = dailyMap.get(dateKey)!;

        // Flow Logic
        // IF Pool/CEX is involved:
        // Inflow = To Pool/CEX (Selling pressure usually, depending on perspective. Wait.)
        // Prompt says: "Stablecoin -> Protocol (Inflow)" and "Token -> CEX (Outflow/Sell)".
        // BUT this fetcher is for the TARGET TOKEN.
        // So:
        // Token -> Pool = Sell/Add Liq (Supply enters market) -> Outflow from HOLDERS perspective? 
        // Let's define it clearly:
        // Netflow = Flow INTO "Smart Money/Holders" vs "Exchanges/Pools".
        
        // Let's stick to the prompt's Flow Types.
        // Type 2: Token -> CEX = Outflow (Bad).
        // If 'to' is CEX/Pool -> OUTFLOW (Selling/Dumping Risk)
        // If 'from' is CEX/Pool -> INFLOW (Buying/Accumulation)

        const isToRisk = (poolAddress && to.toLowerCase() === poolAddress.toLowerCase()) || 
                         cexAddresses.includes(to.toLowerCase());
        const isFromRisk = (poolAddress && from.toLowerCase() === poolAddress.toLowerCase()) || 
                           cexAddresses.includes(from.toLowerCase());

        if (isToRisk) {
            m.outflow += value;
            m.netflow -= value;
        }
        if (isFromRisk) {
            m.inflow += value;
            m.netflow += value;
        }

        // Whale Check (Large Transfers)
        if (value >= whaleThreshold) {
            m.whaleMoves++;
            // If it's a whale selling (moving to pool), count as negative whale netflow
            if (isToRisk) whaleNetflow -= value;
            // If whale buying (from pool), positive
            if (isFromRisk) whaleNetflow += value;
        }
    });

    const metrics = Array.from(dailyMap.values());

    // 5. Invalidation Logic
    let thesisStatus: FlowAnalysisResult['thesisStatus'] = 'VALID';
    let invalidationReason = '';

    if (thesis === 'ACCUMULATION') {
        // Thesis: Whales are buying, Netflow positive.
        // Invalidation: Whale Netflow Negative OR Heavy Outflow to CEX
        if (whaleNetflow < 0) {
            thesisStatus = 'INVALIDATED';
            invalidationReason = 'Whales are Net Sellers (Negative Netflow).';
        } else if (metrics.reduce((acc, c) => acc + c.outflow, 0) > metrics.reduce((acc, c) => acc + c.inflow, 0) * 1.5) {
             thesisStatus = 'WARNING';
             invalidationReason = 'Heavy Outflow to Pools/CEX detected.';
        }
    } else if (thesis === 'ORGANIC_GROWTH') {
        // Thesis: Steady activity, not necessarily massive whale buys.
        // Invalidation: User activity stagnates (checked elsewhere) or Massive Dump.
        if (metrics.reduce((acc, c) => acc + c.outflow, 0) > totalVolume * 0.5) {
             thesisStatus = 'WARNING';
             invalidationReason = 'Significant sell pressure relative to volume.';
        }
    } else if (thesis === 'DISTRIBUTION') {
        // Thesis: Expecting dumps.
        // Invalidation: If Whales BUY aggressively.
        if (whaleNetflow > 0 && whaleNetflow > totalVolume * 0.1) {
             thesisStatus = 'INVALIDATED'; // It's not distribution, it's accumulation!
             invalidationReason = 'Whales are Buying (Netflow Positive).';
        }
    }

    return {
        metrics,
        totalVolume,
        whaleNetflow,
        thesisStatus,
        invalidationReason
    };
}
