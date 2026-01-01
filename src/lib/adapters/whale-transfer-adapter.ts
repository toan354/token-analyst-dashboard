/**
 * Whale Transfer Behavior Data Adapter
 * 
 * PURPOSE: Fetch/load large transfer / whale behavior data and map it to
 *          the WhaleTransferBehaviorModule contract (FROZEN - do NOT modify).
 * 
 * ════════════════════════════════════════════════════════════════
 * DATA SOURCES SUPPORTED
 * ════════════════════════════════════════════════════════════════
 * 
 * 1. CryptoQuant API (production)
 *    - Whale transaction counts
 *    - Large transfer volumes
 *    - Exchange whale flow breakdown
 * 
 * 2. Glassnode API (alternative)
 *    - Whale entity metrics
 *    - Large transfer counts by size bucket
 * 
 * 3. Arkham Intelligence (premium)
 *    - Entity-labeled large transfers
 *    - Top entity breakdown
 * 
 * 4. Local JSON/CSV (testing/demo)
 * 
 * WHALE THRESHOLD LOGIC:
 * - CryptoQuant: Uses 1000+ BTC or $10M+ USD thresholds
 * - Glassnode: Configurable size buckets (1k-10k, 10k+)
 * - This adapter: Configurable threshold in token units or USD
 * 
 * LABELING ASSUMPTIONS & LIMITATIONS:
 * - "Whale" definition varies by source and token
 * - Threshold may not account for token price changes
 * - Some large transfers may be internal exchange movements
 * - Entity labels may not capture new whale addresses
 * - Multi-sig wallets may appear as multiple whales
 * 
 * ════════════════════════════════════════════════════════════════
 * CONTRACT MAPPING TABLE
 * ════════════════════════════════════════════════════════════════
 * 
 * | Contract Field              | CryptoQuant Source           | Glassnode Source              |
 * |-----------------------------|------------------------------|-------------------------------|
 * | timestampSeries             | data[].datetime → UTC ms     | data[].t * 1000               |
 * | largeTransferCountSeries    | data[].whale_tx_count        | tx_count_entity_adjusted      |
 * | largeTransferVolumeSeries   | data[].whale_volume          | transfer_volume_whales_sum    |
 * | largeTransferThreshold      | config parameter (e.g. 1000) | config parameter              |
 * | whaleExchangeFlowSeries     | exchange_whale_netflow       | whale_exchange_flow endpoint  |
 * | whaleNonExchangeFlowSeries  | calculated residual          | calculated residual           |
 * | topEntityTransferSeries     | top_holder_flows endpoint    | entity breakdown endpoint     |
 * 
 * ════════════════════════════════════════════════════════════════
 */

import { WhaleTransferInput } from '@/components/modules/WhaleTransferBehaviorModule';

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

export interface WhaleAdapterConfig {
  source: 'cryptoquant' | 'glassnode' | 'arkham' | 'local' | 'demo';
  apiKey?: string;
  tokenSymbol: string;
  chain?: string;
  baseUrl?: string;
  /** Number of days of historical data to fetch */
  lookbackDays?: number;
  /** Threshold for "large" transfer (in token units) */
  largeTransferThreshold: number;
  /** Optional: Threshold in USD (overrides token units if provided) */
  thresholdUsd?: number;
}

export interface RawWhaleTransferData {
  timestamp: number;
  transferCount: number;
  transferVolume: number;
  exchangeFlow?: number;
  nonExchangeFlow?: number;
  topEntityFlow?: number;
}

export interface WhaleAdapterResult {
  success: boolean;
  data: WhaleTransferInput | null;
  error?: string;
  missingFields?: string[];
  source: string;
  fetchedAt: number;
  /** Whale labeling notes (for documentation only) */
  labelingNotes?: string[];
}

// ─────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────

function validateContractCompliance(data: Partial<WhaleTransferInput>): string[] {
  const missing: string[] = [];
  
  if (!data.timestampSeries?.length) missing.push('timestampSeries');
  if (!data.largeTransferCountSeries?.length) missing.push('largeTransferCountSeries');
  if (!data.largeTransferVolumeSeries?.length) missing.push('largeTransferVolumeSeries');
  if (!data.largeTransferThreshold) missing.push('largeTransferThreshold');
  
  // Check series length consistency
  if (data.timestampSeries?.length && data.largeTransferCountSeries?.length) {
    if (data.timestampSeries.length !== data.largeTransferCountSeries.length) {
      missing.push('inconsistent series lengths');
    }
  }
  
  return missing;
}

// ─────────────────────────────────────────────────
// Normalization
// ─────────────────────────────────────────────────

/**
 * Normalize raw data to contract format.
 * - Converts timestamps to UTC milliseconds
 * - Applies token decimals to volumes
 * - Separates count vs volume correctly
 */
function normalizeTimeSeries(
  rawData: RawWhaleTransferData[],
  threshold: number,
  decimals: number = 18
): WhaleTransferInput {
  const divisor = Math.pow(10, decimals);
  
  // Sort by timestamp ascending
  const sorted = [...rawData].sort((a, b) => a.timestamp - b.timestamp);
  
  const timestampSeries: number[] = [];
  const largeTransferCountSeries: number[] = [];
  const largeTransferVolumeSeries: number[] = [];
  const whaleExchangeFlowSeries: number[] = [];
  const whaleNonExchangeFlowSeries: number[] = [];
  const topEntityTransferSeries: number[] = [];
  
  let hasExchangeData = false;
  let hasNonExchangeData = false;
  let hasTopEntityData = false;
  
  for (const point of sorted) {
    // Ensure UTC timestamp in milliseconds
    const ts = point.timestamp < 1e12 ? point.timestamp * 1000 : point.timestamp;
    timestampSeries.push(ts);
    
    // Count is integer, no decimals needed
    largeTransferCountSeries.push(Math.round(point.transferCount));
    
    // Apply decimals normalization to volumes
    largeTransferVolumeSeries.push(point.transferVolume / divisor);
    
    // Optional series
    if (point.exchangeFlow !== undefined) {
      whaleExchangeFlowSeries.push(point.exchangeFlow / divisor);
      hasExchangeData = true;
    }
    
    if (point.nonExchangeFlow !== undefined) {
      whaleNonExchangeFlowSeries.push(point.nonExchangeFlow / divisor);
      hasNonExchangeData = true;
    }
    
    if (point.topEntityFlow !== undefined) {
      topEntityTransferSeries.push(point.topEntityFlow / divisor);
      hasTopEntityData = true;
    }
  }
  
  const result: WhaleTransferInput = {
    timestampSeries,
    largeTransferCountSeries,
    largeTransferVolumeSeries,
    largeTransferThreshold: threshold,
  };
  
  // Only include optional series if we have data
  if (hasExchangeData && whaleExchangeFlowSeries.length === timestampSeries.length) {
    result.whaleExchangeFlowSeries = whaleExchangeFlowSeries;
  }
  
  if (hasNonExchangeData && whaleNonExchangeFlowSeries.length === timestampSeries.length) {
    result.whaleNonExchangeFlowSeries = whaleNonExchangeFlowSeries;
  }
  
  if (hasTopEntityData && topEntityTransferSeries.length === timestampSeries.length) {
    result.topEntityTransferSeries = topEntityTransferSeries;
  }
  
  return result;
}

// ─────────────────────────────────────────────────
// CryptoQuant Adapter
// ─────────────────────────────────────────────────

interface CryptoQuantWhaleResponse {
  status: { code: number };
  result: {
    data: Array<{
      datetime: string;
      whale_count: string;
      whale_volume: string;
      exchange_netflow?: string;
    }>;
  };
}

async function fetchFromCryptoQuant(config: WhaleAdapterConfig): Promise<WhaleAdapterResult> {
  if (!config.apiKey) {
    return {
      success: false,
      data: null,
      error: 'CryptoQuant API key required',
      source: 'cryptoquant',
      fetchedAt: Date.now(),
    };
  }
  
  const baseUrl = config.baseUrl || 'https://api.cryptoquant.com/v1';
  const symbol = config.tokenSymbol.toLowerCase();
  const lookback = config.lookbackDays || 30;
  
  try {
    // Fetch whale transfer data
    const response = await fetch(
      `${baseUrl}/${symbol}/network-data/whale-transactions?window=day&limit=${lookback}`,
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`CryptoQuant API error: ${response.status}`);
    }
    
    const whaleData: CryptoQuantWhaleResponse = await response.json();
    
    if (!whaleData.result?.data?.length) {
      return {
        success: false,
        data: null,
        error: 'No data returned from CryptoQuant',
        source: 'cryptoquant',
        fetchedAt: Date.now(),
      };
    }
    
    // Map to raw format
    const rawData: RawWhaleTransferData[] = whaleData.result.data.map(d => ({
      timestamp: new Date(d.datetime).getTime(),
      transferCount: parseFloat(d.whale_count),
      transferVolume: parseFloat(d.whale_volume),
      exchangeFlow: d.exchange_netflow ? parseFloat(d.exchange_netflow) : undefined,
    }));
    
    // Determine decimals based on token
    const decimals = symbol === 'btc' ? 8 : 18;
    const normalized = normalizeTimeSeries(rawData, config.largeTransferThreshold, decimals);
    
    const missingFields = validateContractCompliance(normalized);
    
    const labelingNotes: string[] = [
      'CryptoQuant whale definition: 1000+ BTC or equivalent',
      'Exchange flow: Based on proprietary exchange labels',
      'Limitation: Internal exchange movements may be included',
    ];
    
    if (missingFields.length > 0) {
      return {
        success: false,
        data: null,
        error: 'WHALE TRANSFER DATA UNAVAILABLE',
        missingFields,
        source: 'cryptoquant',
        fetchedAt: Date.now(),
        labelingNotes,
      };
    }
    
    return {
      success: true,
      data: normalized,
      source: 'cryptoquant',
      fetchedAt: Date.now(),
      labelingNotes,
    };
    
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error',
      source: 'cryptoquant',
      fetchedAt: Date.now(),
    };
  }
}

// ─────────────────────────────────────────────────
// Glassnode Adapter
// ─────────────────────────────────────────────────

async function fetchFromGlassnode(config: WhaleAdapterConfig): Promise<WhaleAdapterResult> {
  if (!config.apiKey) {
    return {
      success: false,
      data: null,
      error: 'Glassnode API key required',
      source: 'glassnode',
      fetchedAt: Date.now(),
    };
  }
  
  const baseUrl = config.baseUrl || 'https://api.glassnode.com/v1';
  const symbol = config.tokenSymbol.toUpperCase();
  
  try {
    // Fetch whale transaction count
    const countResponse = await fetch(
      `${baseUrl}/metrics/entities/whale_count?a=${symbol}&api_key=${config.apiKey}`,
    );
    
    // Fetch whale transfer volume
    const volumeResponse = await fetch(
      `${baseUrl}/metrics/transactions/transfer_volume_whales_sum?a=${symbol}&api_key=${config.apiKey}`,
    );
    
    if (!countResponse.ok || !volumeResponse.ok) {
      throw new Error(`Glassnode API error: ${countResponse.status}/${volumeResponse.status}`);
    }
    
    const countData = await countResponse.json();
    const volumeData = await volumeResponse.json();
    
    if (!countData?.length || !volumeData?.length) {
      return {
        success: false,
        data: null,
        error: 'No data returned from Glassnode',
        source: 'glassnode',
        fetchedAt: Date.now(),
      };
    }
    
    // Merge by timestamp
    const mergedMap = new Map<number, RawWhaleTransferData>();
    
    for (const point of countData) {
      const ts = point.t * 1000;
      mergedMap.set(ts, {
        timestamp: ts,
        transferCount: point.v || 0,
        transferVolume: 0,
      });
    }
    
    for (const point of volumeData) {
      const ts = point.t * 1000;
      const existing = mergedMap.get(ts);
      if (existing) {
        existing.transferVolume = point.v || 0;
      }
    }
    
    const rawData = Array.from(mergedMap.values()).filter(d => d.transferVolume > 0);
    const normalized = normalizeTimeSeries(rawData, config.largeTransferThreshold, 8);
    
    const missingFields = validateContractCompliance(normalized);
    
    const labelingNotes: string[] = [
      'Glassnode whale definition: Top ~1% of addresses by balance',
      'Entity clustering may group related addresses',
      'FLAG: Exchange/Non-exchange breakdown not available from this endpoint',
    ];
    
    if (missingFields.length > 0) {
      return {
        success: false,
        data: null,
        error: 'WHALE TRANSFER DATA UNAVAILABLE',
        missingFields,
        source: 'glassnode',
        fetchedAt: Date.now(),
        labelingNotes,
      };
    }
    
    return {
      success: true,
      data: normalized,
      source: 'glassnode',
      fetchedAt: Date.now(),
      labelingNotes,
    };
    
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error',
      source: 'glassnode',
      fetchedAt: Date.now(),
    };
  }
}

// ─────────────────────────────────────────────────
// Local/Demo Data Adapter
// ─────────────────────────────────────────────────

function generateDemoData(config: WhaleAdapterConfig): WhaleAdapterResult {
  const now = Date.now();
  const days = config.lookbackDays || 14;
  const dayOfYear = Math.floor((now - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  
  // Pseudo-random but deterministic based on day
  const seed = dayOfYear * 1337;
  const rand = (n: number) => ((seed * n) % 1000) / 1000;
  
  const timestampSeries: number[] = [];
  const largeTransferCountSeries: number[] = [];
  const largeTransferVolumeSeries: number[] = [];
  const whaleExchangeFlowSeries: number[] = [];
  const whaleNonExchangeFlowSeries: number[] = [];
  
  const baseCount = 8;
  const baseVolume = 500_000;
  
  for (let i = days; i >= 0; i--) {
    const dayTs = now - i * 86400000;
    // Align to start of day UTC
    const utcDay = new Date(dayTs);
    utcDay.setUTCHours(0, 0, 0, 0);
    timestampSeries.push(utcDay.getTime());
    
    const variation = rand(i * 13);
    const count = Math.round(baseCount * (0.5 + variation * 1.5));
    const volume = baseVolume * (0.5 + variation * 1.5);
    
    largeTransferCountSeries.push(count);
    largeTransferVolumeSeries.push(volume);
    
    // Split volume between exchange and non-exchange
    const exchRatio = 0.4 + rand(i * 7) * 0.3;
    whaleExchangeFlowSeries.push(volume * exchRatio);
    whaleNonExchangeFlowSeries.push(volume * (1 - exchRatio));
  }
  
  const data: WhaleTransferInput = {
    timestampSeries,
    largeTransferCountSeries,
    largeTransferVolumeSeries,
    largeTransferThreshold: config.largeTransferThreshold,
    whaleExchangeFlowSeries,
    whaleNonExchangeFlowSeries,
  };
  
  const missingFields = validateContractCompliance(data);
  
  const labelingNotes: string[] = [
    'Demo data: Synthetic values for testing',
    'Whale threshold: ' + config.largeTransferThreshold + ' (config parameter)',
    'Exchange/Non-exchange split: Randomly generated',
  ];
  
  return {
    success: missingFields.length === 0,
    data: missingFields.length === 0 ? data : null,
    error: missingFields.length > 0 ? 'WHALE TRANSFER DATA UNAVAILABLE' : undefined,
    missingFields: missingFields.length > 0 ? missingFields : undefined,
    source: 'demo',
    fetchedAt: Date.now(),
    labelingNotes,
  };
}

/**
 * Load data from local JSON file.
 */
async function loadFromLocal(config: WhaleAdapterConfig): Promise<WhaleAdapterResult> {
  const filePath = config.baseUrl || '/data/whale-transfers.json';
  
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to load local file: ${response.status}`);
    }
    
    const rawData = await response.json();
    
    // Map to contract format
    const data: Partial<WhaleTransferInput> = {
      timestampSeries: rawData.timestampSeries || rawData.timestamps,
      largeTransferCountSeries: rawData.largeTransferCountSeries || rawData.whale_count,
      largeTransferVolumeSeries: rawData.largeTransferVolumeSeries || rawData.whale_volume,
      largeTransferThreshold: rawData.largeTransferThreshold || config.largeTransferThreshold,
      whaleExchangeFlowSeries: rawData.whaleExchangeFlowSeries || rawData.exchange_flow,
      whaleNonExchangeFlowSeries: rawData.whaleNonExchangeFlowSeries || rawData.non_exchange_flow,
      topEntityTransferSeries: rawData.topEntityTransferSeries || rawData.top_entity_flow,
    };
    
    const missingFields = validateContractCompliance(data);
    
    if (missingFields.length > 0) {
      return {
        success: false,
        data: null,
        error: 'WHALE TRANSFER DATA UNAVAILABLE',
        missingFields,
        source: 'local',
        fetchedAt: Date.now(),
      };
    }
    
    return {
      success: true,
      data: data as WhaleTransferInput,
      source: 'local',
      fetchedAt: Date.now(),
    };
    
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error',
      source: 'local',
      fetchedAt: Date.now(),
    };
  }
}

// ─────────────────────────────────────────────────
// Main Adapter Function
// ─────────────────────────────────────────────────

/**
 * Fetch whale transfer behavior data from configured source.
 * 
 * @param config - Adapter configuration
 * @returns WhaleAdapterResult with contract-compliant data or error
 */
export async function fetchWhaleTransferData(
  config: WhaleAdapterConfig
): Promise<WhaleAdapterResult> {
  switch (config.source) {
    case 'cryptoquant':
      return fetchFromCryptoQuant(config);
    
    case 'glassnode':
      return fetchFromGlassnode(config);
    
    case 'local':
      return loadFromLocal(config);
    
    case 'demo':
    default:
      return generateDemoData(config);
  }
}

// ─────────────────────────────────────────────────
// Example Outputs
// ─────────────────────────────────────────────────

/** Example: Successful data fetch */
export const EXAMPLE_SUCCESS: WhaleAdapterResult = {
  success: true,
  data: {
    timestampSeries: [1704067200000, 1704153600000, 1704240000000],
    largeTransferCountSeries: [5, 8, 12],
    largeTransferVolumeSeries: [250000.50, 480000.25, 750000.75],
    largeTransferThreshold: 10000,
    whaleExchangeFlowSeries: [150000.00, 280000.00, 450000.00],
    whaleNonExchangeFlowSeries: [100000.50, 200000.25, 300000.75],
  },
  source: 'cryptoquant',
  fetchedAt: Date.now(),
  labelingNotes: [
    'CryptoQuant whale definition: 1000+ BTC',
    'Exchange flow: Proprietary labels',
  ],
};

/** Example: Missing required field */
export const EXAMPLE_MISSING_DATA: WhaleAdapterResult = {
  success: false,
  data: null,
  error: 'WHALE TRANSFER DATA UNAVAILABLE',
  missingFields: ['largeTransferVolumeSeries'],
  source: 'glassnode',
  fetchedAt: Date.now(),
  labelingNotes: [
    'FLAG: Volume data endpoint returned empty',
  ],
};

/** Example: API error */
export const EXAMPLE_API_ERROR: WhaleAdapterResult = {
  success: false,
  data: null,
  error: 'CryptoQuant API error: 429 Too Many Requests',
  source: 'cryptoquant',
  fetchedAt: Date.now(),
};

// ─────────────────────────────────────────────────
// Config Presets
// ─────────────────────────────────────────────────

export const DEFAULT_DEMO_CONFIG: WhaleAdapterConfig = {
  source: 'demo',
  tokenSymbol: 'ETH',
  lookbackDays: 14,
  largeTransferThreshold: 10_000,
};

export const DEFAULT_CRYPTOQUANT_CONFIG: WhaleAdapterConfig = {
  source: 'cryptoquant',
  tokenSymbol: 'BTC',
  lookbackDays: 30,
  largeTransferThreshold: 1000, // 1000 BTC
  // apiKey: process.env.CRYPTOQUANT_API_KEY,
};

export const DEFAULT_GLASSNODE_CONFIG: WhaleAdapterConfig = {
  source: 'glassnode',
  tokenSymbol: 'BTC',
  lookbackDays: 30,
  largeTransferThreshold: 1000,
  // apiKey: process.env.GLASSNODE_API_KEY,
};
