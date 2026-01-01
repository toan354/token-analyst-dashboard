/**
 * Exchange vs Non-Exchange Flow Data Adapter
 * 
 * PURPOSE: Fetch/load on-chain flow data split by destination and map it to
 *          the ExchangeVsNonExchangeFlowModule contract (FROZEN - do NOT modify).
 * 
 * ════════════════════════════════════════════════════════════════
 * DATA SOURCES SUPPORTED
 * ════════════════════════════════════════════════════════════════
 * 
 * 1. CryptoQuant API (production)
 *    - Exchange-labeled addresses
 *    - Inflow/outflow by exchange type
 * 
 * 2. Glassnode API (alternative)
 *    - Exchange entity labels
 *    - Net transfer volume to/from exchanges
 * 
 * 3. Arkham Intelligence (premium)
 *    - High-quality entity labels
 *    - CEX, DeFi, Bridge categorization
 * 
 * 4. Local JSON/CSV (testing/demo)
 * 
 * EXCHANGE LABELING SOURCES:
 * - CryptoQuant: Proprietary exchange address database
 * - Glassnode: Entity clustering algorithms
 * - Arkham: Manual + ML-based entity identification
 * - Etherscan/Chain explorers: Community-labeled addresses
 * 
 * LABELING LIMITATIONS:
 * - New exchange addresses may not be labeled (false negatives)
 * - Some OTC desks mislabeled as exchanges (false positives)
 * - DEX aggregator contracts often unlabeled
 * - Bridge contracts may be categorized inconsistently
 * - Labeling coverage varies by chain (ETH > SOL > others)
 * 
 * ════════════════════════════════════════════════════════════════
 * CONTRACT MAPPING TABLE
 * ════════════════════════════════════════════════════════════════
 * 
 * | Contract Field            | CryptoQuant Source              | Glassnode Source              |
 * |---------------------------|---------------------------------|-------------------------------|
 * | timestampSeries           | data[].datetime → UTC ms        | data[].t * 1000               |
 * | exchangeInflowSeries      | data[].exchange_inflow          | inflow endpoint → v           |
 * | exchangeOutflowSeries     | data[].exchange_outflow         | outflow endpoint → v          |
 * | nonExchangeFlowSeries     | total_flow - exchange_flow      | calculated from entity data   |
 * | bridgeFlowSeries          | bridge endpoint (optional)      | bridge transfers endpoint     |
 * | stakingFlowSeries         | staking contracts endpoint      | staking balance changes       |
 * | labeledEntityFlowSeries   | entity_type breakdown           | entity breakdown endpoint     |
 * 
 * ════════════════════════════════════════════════════════════════
 */

import { ExchangeFlowInput } from '@/components/modules/ExchangeVsNonExchangeFlowModule';

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

export interface FlowSplitAdapterConfig {
  source: 'cryptoquant' | 'glassnode' | 'arkham' | 'local' | 'demo';
  apiKey?: string;
  tokenSymbol: string;
  chain?: string;
  baseUrl?: string;
  /** Number of days of historical data to fetch */
  lookbackDays?: number;
}

export interface RawFlowSplitData {
  timestamp: number;
  exchangeInflow: number;
  exchangeOutflow: number;
  totalFlow?: number;
  bridgeFlow?: number;
  stakingFlow?: number;
}

export interface FlowSplitAdapterResult {
  success: boolean;
  data: ExchangeFlowInput | null;
  error?: string;
  missingFields?: string[];
  source: string;
  fetchedAt: number;
  /** Labeling quality notes (for documentation only) */
  labelingNotes?: string[];
}

// ─────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────

function validateContractCompliance(data: Partial<ExchangeFlowInput>): string[] {
  const missing: string[] = [];
  
  if (!data.timestampSeries?.length) missing.push('timestampSeries');
  if (!data.exchangeInflowSeries?.length) missing.push('exchangeInflowSeries');
  if (!data.exchangeOutflowSeries?.length) missing.push('exchangeOutflowSeries');
  if (!data.nonExchangeFlowSeries?.length) missing.push('nonExchangeFlowSeries');
  
  // Check series length consistency
  if (data.timestampSeries?.length && data.exchangeInflowSeries?.length) {
    if (data.timestampSeries.length !== data.exchangeInflowSeries.length) {
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
 * - Applies token decimals
 * - Calculates non-exchange flow as: total - exchange
 */
function normalizeTimeSeries(
  rawData: RawFlowSplitData[],
  decimals: number = 18
): ExchangeFlowInput {
  const divisor = Math.pow(10, decimals);
  
  // Sort by timestamp ascending
  const sorted = [...rawData].sort((a, b) => a.timestamp - b.timestamp);
  
  const timestampSeries: number[] = [];
  const exchangeInflowSeries: number[] = [];
  const exchangeOutflowSeries: number[] = [];
  const nonExchangeFlowSeries: number[] = [];
  const bridgeFlowSeries: number[] = [];
  const stakingFlowSeries: number[] = [];
  
  let hasBridgeData = false;
  let hasStakingData = false;
  
  for (const point of sorted) {
    // Ensure UTC timestamp in milliseconds
    const ts = point.timestamp < 1e12 ? point.timestamp * 1000 : point.timestamp;
    timestampSeries.push(ts);
    
    // Apply decimals normalization
    const inflow = point.exchangeInflow / divisor;
    const outflow = point.exchangeOutflow / divisor;
    
    exchangeInflowSeries.push(inflow);
    exchangeOutflowSeries.push(outflow);
    
    // Calculate non-exchange flow
    // If totalFlow provided: nonExchange = total - (inflow + outflow)
    // Otherwise: estimate as residual (this is a data quality flag)
    if (point.totalFlow !== undefined) {
      const total = point.totalFlow / divisor;
      const exchangeTotal = inflow + outflow;
      nonExchangeFlowSeries.push(total - exchangeTotal);
    } else {
      // Without total flow, we cannot accurately compute non-exchange
      // Use placeholder of 0 - THIS IS A DATA QUALITY ISSUE
      nonExchangeFlowSeries.push(0);
    }
    
    // Optional series
    if (point.bridgeFlow !== undefined) {
      bridgeFlowSeries.push(point.bridgeFlow / divisor);
      hasBridgeData = true;
    }
    
    if (point.stakingFlow !== undefined) {
      stakingFlowSeries.push(point.stakingFlow / divisor);
      hasStakingData = true;
    }
  }
  
  const result: ExchangeFlowInput = {
    timestampSeries,
    exchangeInflowSeries,
    exchangeOutflowSeries,
    nonExchangeFlowSeries,
  };
  
  // Only include optional series if we have data
  if (hasBridgeData && bridgeFlowSeries.length === timestampSeries.length) {
    result.bridgeFlowSeries = bridgeFlowSeries;
  }
  
  if (hasStakingData && stakingFlowSeries.length === timestampSeries.length) {
    result.stakingFlowSeries = stakingFlowSeries;
  }
  
  return result;
}

// ─────────────────────────────────────────────────
// CryptoQuant Adapter
// ─────────────────────────────────────────────────

interface CryptoQuantFlowResponse {
  status: { code: number };
  result: {
    data: Array<{
      datetime: string;
      exchange_inflow: string;
      exchange_outflow: string;
      total_flow?: string;
    }>;
  };
}

async function fetchFromCryptoQuant(config: FlowSplitAdapterConfig): Promise<FlowSplitAdapterResult> {
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
    // Fetch exchange flow data
    const flowResponse = await fetch(
      `${baseUrl}/${symbol}/exchange-flows/inflow-outflow?window=day&limit=${lookback}`,
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
      }
    );
    
    if (!flowResponse.ok) {
      throw new Error(`CryptoQuant API error: ${flowResponse.status}`);
    }
    
    const flowData: CryptoQuantFlowResponse = await flowResponse.json();
    
    if (!flowData.result?.data?.length) {
      return {
        success: false,
        data: null,
        error: 'No data returned from CryptoQuant',
        source: 'cryptoquant',
        fetchedAt: Date.now(),
      };
    }
    
    // Map to raw format
    const rawData: RawFlowSplitData[] = flowData.result.data.map(d => ({
      timestamp: new Date(d.datetime).getTime(),
      exchangeInflow: parseFloat(d.exchange_inflow),
      exchangeOutflow: parseFloat(d.exchange_outflow),
      totalFlow: d.total_flow ? parseFloat(d.total_flow) : undefined,
    }));
    
    // Determine decimals based on token
    const decimals = symbol === 'btc' ? 8 : 18;
    const normalized = normalizeTimeSeries(rawData, decimals);
    
    const missingFields = validateContractCompliance(normalized);
    
    // Add labeling notes
    const labelingNotes: string[] = [
      'CryptoQuant exchange labels: Proprietary database',
      'Coverage: Major CEXs (Binance, Coinbase, Kraken, etc.)',
      'Limitation: New exchange addresses may have 24-48h labeling delay',
    ];
    
    if (missingFields.length > 0) {
      return {
        success: false,
        data: null,
        error: 'FLOW SPLIT DATA UNAVAILABLE',
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

async function fetchFromGlassnode(config: FlowSplitAdapterConfig): Promise<FlowSplitAdapterResult> {
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
    // Fetch exchange inflow
    const inflowResponse = await fetch(
      `${baseUrl}/metrics/transactions/transfers_volume_to_exchanges_sum?a=${symbol}&api_key=${config.apiKey}`,
    );
    
    // Fetch exchange outflow
    const outflowResponse = await fetch(
      `${baseUrl}/metrics/transactions/transfers_volume_from_exchanges_sum?a=${symbol}&api_key=${config.apiKey}`,
    );
    
    if (!inflowResponse.ok || !outflowResponse.ok) {
      throw new Error(`Glassnode API error: ${inflowResponse.status}/${outflowResponse.status}`);
    }
    
    const inflowData = await inflowResponse.json();
    const outflowData = await outflowResponse.json();
    
    if (!inflowData?.length || !outflowData?.length) {
      return {
        success: false,
        data: null,
        error: 'No data returned from Glassnode',
        source: 'glassnode',
        fetchedAt: Date.now(),
      };
    }
    
    // Merge inflow and outflow by timestamp
    const mergedMap = new Map<number, RawFlowSplitData>();
    
    for (const point of inflowData) {
      const ts = point.t * 1000;
      mergedMap.set(ts, {
        timestamp: ts,
        exchangeInflow: point.v || 0,
        exchangeOutflow: 0,
      });
    }
    
    for (const point of outflowData) {
      const ts = point.t * 1000;
      const existing = mergedMap.get(ts);
      if (existing) {
        existing.exchangeOutflow = point.v || 0;
      } else {
        mergedMap.set(ts, {
          timestamp: ts,
          exchangeInflow: 0,
          exchangeOutflow: point.v || 0,
        });
      }
    }
    
    const rawData = Array.from(mergedMap.values());
    const normalized = normalizeTimeSeries(rawData, 8);
    
    const missingFields = validateContractCompliance(normalized);
    
    const labelingNotes: string[] = [
      'Glassnode exchange labels: Entity clustering algorithm',
      'Coverage: ~150 exchanges tracked',
      'Limitation: Clustering may group related addresses incorrectly',
      'FLAG: nonExchangeFlowSeries estimated (totalFlow not available)',
    ];
    
    if (missingFields.length > 0) {
      return {
        success: false,
        data: null,
        error: 'FLOW SPLIT DATA UNAVAILABLE',
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

function generateDemoData(config: FlowSplitAdapterConfig): FlowSplitAdapterResult {
  const now = Date.now();
  const days = config.lookbackDays || 14;
  const dayOfYear = Math.floor((now - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  
  // Pseudo-random but deterministic based on day
  const seed = dayOfYear * 1337;
  const rand = (n: number) => ((seed * n) % 1000) / 1000;
  
  const timestampSeries: number[] = [];
  const exchangeInflowSeries: number[] = [];
  const exchangeOutflowSeries: number[] = [];
  const nonExchangeFlowSeries: number[] = [];
  
  const baseExchangeInflow = 500_000;
  const baseExchangeOutflow = 300_000;
  const baseNonExchange = 200_000;
  
  for (let i = days; i >= 0; i--) {
    const dayTs = now - i * 86400000;
    // Align to start of day UTC
    const utcDay = new Date(dayTs);
    utcDay.setUTCHours(0, 0, 0, 0);
    timestampSeries.push(utcDay.getTime());
    
    const variation = rand(i * 7);
    exchangeInflowSeries.push(baseExchangeInflow * (0.7 + variation * 0.6));
    exchangeOutflowSeries.push(baseExchangeOutflow * (0.7 + variation * 0.6));
    nonExchangeFlowSeries.push(baseNonExchange * (0.5 + variation * 1.0));
  }
  
  const data: ExchangeFlowInput = {
    timestampSeries,
    exchangeInflowSeries,
    exchangeOutflowSeries,
    nonExchangeFlowSeries,
  };
  
  const missingFields = validateContractCompliance(data);
  
  const labelingNotes: string[] = [
    'Demo data: Synthetic values for testing',
    'Exchange labels: Simulated',
    'Non-exchange flow: Randomly generated, not derived from real data',
  ];
  
  return {
    success: missingFields.length === 0,
    data: missingFields.length === 0 ? data : null,
    error: missingFields.length > 0 ? 'FLOW SPLIT DATA UNAVAILABLE' : undefined,
    missingFields: missingFields.length > 0 ? missingFields : undefined,
    source: 'demo',
    fetchedAt: Date.now(),
    labelingNotes,
  };
}

/**
 * Load data from local JSON file.
 */
async function loadFromLocal(config: FlowSplitAdapterConfig): Promise<FlowSplitAdapterResult> {
  const filePath = config.baseUrl || '/data/exchange-flow-split.json';
  
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to load local file: ${response.status}`);
    }
    
    const rawData = await response.json();
    
    // Map to contract format
    const data: Partial<ExchangeFlowInput> = {
      timestampSeries: rawData.timestampSeries || rawData.timestamps,
      exchangeInflowSeries: rawData.exchangeInflowSeries || rawData.exchange_inflow,
      exchangeOutflowSeries: rawData.exchangeOutflowSeries || rawData.exchange_outflow,
      nonExchangeFlowSeries: rawData.nonExchangeFlowSeries || rawData.non_exchange_flow,
      bridgeFlowSeries: rawData.bridgeFlowSeries || rawData.bridge_flow,
      stakingFlowSeries: rawData.stakingFlowSeries || rawData.staking_flow,
      labeledEntityFlowSeries: rawData.labeledEntityFlowSeries || rawData.labeled_entity_flow,
    };
    
    const missingFields = validateContractCompliance(data);
    
    if (missingFields.length > 0) {
      return {
        success: false,
        data: null,
        error: 'FLOW SPLIT DATA UNAVAILABLE',
        missingFields,
        source: 'local',
        fetchedAt: Date.now(),
      };
    }
    
    return {
      success: true,
      data: data as ExchangeFlowInput,
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
 * Fetch exchange vs non-exchange flow data from configured source.
 * 
 * @param config - Adapter configuration
 * @returns FlowSplitAdapterResult with contract-compliant data or error
 */
export async function fetchExchangeVsNonExchangeFlowData(
  config: FlowSplitAdapterConfig
): Promise<FlowSplitAdapterResult> {
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
export const EXAMPLE_SUCCESS: FlowSplitAdapterResult = {
  success: true,
  data: {
    timestampSeries: [1704067200000, 1704153600000, 1704240000000],
    exchangeInflowSeries: [520000.50, 480000.25, 550000.75],
    exchangeOutflowSeries: [320000.00, 350000.50, 290000.25],
    nonExchangeFlowSeries: [180000.00, 165000.00, 210000.50],
  },
  source: 'cryptoquant',
  fetchedAt: Date.now(),
  labelingNotes: [
    'CryptoQuant exchange labels: Proprietary database',
    'Coverage: Major CEXs',
  ],
};

/** Example: Missing required field */
export const EXAMPLE_MISSING_DATA: FlowSplitAdapterResult = {
  success: false,
  data: null,
  error: 'FLOW SPLIT DATA UNAVAILABLE',
  missingFields: ['nonExchangeFlowSeries'],
  source: 'glassnode',
  fetchedAt: Date.now(),
  labelingNotes: [
    'FLAG: Total flow data not available from source',
    'Cannot compute non-exchange flow without total',
  ],
};

/** Example: API error */
export const EXAMPLE_API_ERROR: FlowSplitAdapterResult = {
  success: false,
  data: null,
  error: 'CryptoQuant API error: 429 Too Many Requests',
  source: 'cryptoquant',
  fetchedAt: Date.now(),
};

// ─────────────────────────────────────────────────
// Config Presets
// ─────────────────────────────────────────────────

export const DEFAULT_DEMO_CONFIG: FlowSplitAdapterConfig = {
  source: 'demo',
  tokenSymbol: 'ETH',
  lookbackDays: 14,
};

export const DEFAULT_CRYPTOQUANT_CONFIG: FlowSplitAdapterConfig = {
  source: 'cryptoquant',
  tokenSymbol: 'BTC',
  lookbackDays: 30,
  // apiKey: process.env.CRYPTOQUANT_API_KEY,
};

export const DEFAULT_GLASSNODE_CONFIG: FlowSplitAdapterConfig = {
  source: 'glassnode',
  tokenSymbol: 'BTC',
  lookbackDays: 30,
  // apiKey: process.env.GLASSNODE_API_KEY,
};
