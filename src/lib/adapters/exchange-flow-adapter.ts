/**
 * Exchange Flow Data Adapter
 * 
 * PURPOSE: Fetch/load real exchange flow data and map it to the
 *          ExchangeFlowRiskModule contract (FROZEN - do NOT modify).
 * 
 * ════════════════════════════════════════════════════════════════
 * DATA SOURCES SUPPORTED
 * ════════════════════════════════════════════════════════════════
 * 
 * 1. CryptoQuant API (recommended for production)
 * 2. Glassnode API (alternative)
 * 3. Local CSV/JSON (for testing/demo)
 * 
 * LIMITATIONS:
 * - Most on-chain data APIs require paid subscriptions
 * - Free tiers have rate limits (typically 10-100 req/day)
 * - Historical baseline requires 90+ days of data
 * 
 * ════════════════════════════════════════════════════════════════
 * CONTRACT MAPPING TABLE
 * ════════════════════════════════════════════════════════════════
 * 
 * | Contract Field       | CryptoQuant Source         | Glassnode Source          |
 * |----------------------|----------------------------|---------------------------|
 * | timestamp            | data.timestamp             | t                         |
 * | exchangeInflow       | data.inflow                | v (from inflow endpoint)  |
 * | exchangeOutflow      | data.outflow               | v (from outflow endpoint) |
 * | netExchangeFlow      | data.netflow               | calculated: inflow-outflow|
 * | circulatingSupply    | separate endpoint          | separate endpoint         |
 * | historicalBaseline   | calculated from 30/90d avg | calculated from history   |
 * | zScore               | calculated                 | calculated                |
 * | largeTransferCount   | whale_count endpoint       | whale_count endpoint      |
 * 
 * ════════════════════════════════════════════════════════════════
 */

import { ExchangeFlowRiskInput, HistoricalBaseline } from '@/components/modules/ExchangeFlowRiskModule';

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

export interface AdapterConfig {
  source: 'cryptoquant' | 'glassnode' | 'local' | 'demo';
  apiKey?: string;
  tokenSymbol: string;
  baseUrl?: string;
}

export interface RawExchangeFlowData {
  timestamp: number;
  inflow: number;
  outflow: number;
  netflow?: number;
}

export interface AdapterResult {
  success: boolean;
  data: ExchangeFlowRiskInput | null;
  error?: string;
  missingFields?: string[];
  source: string;
  fetchedAt: number;
}

// ─────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────

function validateContractCompliance(data: Partial<ExchangeFlowRiskInput>): string[] {
  const missing: string[] = [];
  
  // Required fields check
  if (data.timestamp === undefined || data.timestamp === null) missing.push('timestamp');
  if (data.exchangeInflow === undefined || isNaN(data.exchangeInflow)) missing.push('exchangeInflow');
  if (data.exchangeOutflow === undefined || isNaN(data.exchangeOutflow)) missing.push('exchangeOutflow');
  if (data.netExchangeFlow === undefined || isNaN(data.netExchangeFlow)) missing.push('netExchangeFlow');
  if (data.circulatingSupply === undefined || data.circulatingSupply <= 0) missing.push('circulatingSupply');
  
  return missing;
}

// ─────────────────────────────────────────────────
// Normalization
// ─────────────────────────────────────────────────

/**
 * Normalize raw data to contract format.
 * Handles unit conversion (e.g., satoshis to BTC).
 */
function normalizeData(
  raw: RawExchangeFlowData,
  circulatingSupply: number,
  decimals: number = 8,
  historical?: RawExchangeFlowData[]
): ExchangeFlowRiskInput {
  // Convert from smallest unit if needed
  const divisor = Math.pow(10, decimals);
  
  const exchangeInflow = raw.inflow / divisor;
  const exchangeOutflow = raw.outflow / divisor;
  const netExchangeFlow = raw.netflow !== undefined 
    ? raw.netflow / divisor 
    : exchangeInflow - exchangeOutflow;
  
  // Calculate historical baseline if data available
  let historicalBaseline: HistoricalBaseline | undefined;
  let zScore: number | undefined;
  
  if (historical && historical.length >= 30) {
    const last30 = historical.slice(-30);
    const last90 = historical.slice(-90);
    
    const avg30d = last30.reduce((sum, d) => sum + Math.abs((d.netflow ?? d.inflow - d.outflow) / divisor), 0) / last30.length;
    const avg90d = last90.reduce((sum, d) => sum + Math.abs((d.netflow ?? d.inflow - d.outflow) / divisor), 0) / last90.length;
    
    historicalBaseline = { avg30d, avg90d };
    
    // Calculate z-score based on 30d data
    const mean = avg30d;
    const variance = last30.reduce((sum, d) => {
      const val = Math.abs((d.netflow ?? d.inflow - d.outflow) / divisor);
      return sum + Math.pow(val - mean, 2);
    }, 0) / last30.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev > 0) {
      zScore = (Math.abs(netExchangeFlow) - mean) / stdDev;
    }
  }
  
  return {
    timestamp: raw.timestamp,
    exchangeInflow,
    exchangeOutflow,
    netExchangeFlow,
    circulatingSupply: circulatingSupply / divisor,
    historicalBaseline,
    zScore,
  };
}

// ─────────────────────────────────────────────────
// CryptoQuant Adapter
// ─────────────────────────────────────────────────

interface CryptoQuantResponse {
  status: { code: number };
  result: {
    data: Array<{
      datetime: string;
      inflow: string;
      outflow: string;
      netflow: string;
    }>;
  };
}

async function fetchFromCryptoQuant(config: AdapterConfig): Promise<AdapterResult> {
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
  
  try {
    // Fetch exchange flow data
    const flowResponse = await fetch(
      `${baseUrl}/btc/exchange-flows/netflow?window=day&limit=90`,
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
      }
    );
    
    if (!flowResponse.ok) {
      throw new Error(`CryptoQuant API error: ${flowResponse.status}`);
    }
    
    const flowData: CryptoQuantResponse = await flowResponse.json();
    
    if (!flowData.result?.data?.length) {
      return {
        success: false,
        data: null,
        error: 'No data returned from CryptoQuant',
        source: 'cryptoquant',
        fetchedAt: Date.now(),
      };
    }
    
    // Fetch circulating supply
    const supplyResponse = await fetch(
      `${baseUrl}/${symbol}/market-data/circulating-supply`,
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
      }
    );
    
    let circulatingSupply = 0;
    if (supplyResponse.ok) {
      const supplyData = await supplyResponse.json();
      circulatingSupply = parseFloat(supplyData.result?.data?.[0]?.value || '0');
    }
    
    // Map latest data point
    const latest = flowData.result.data[0];
    const historical = flowData.result.data.map(d => ({
      timestamp: new Date(d.datetime).getTime(),
      inflow: parseFloat(d.inflow),
      outflow: parseFloat(d.outflow),
      netflow: parseFloat(d.netflow),
    }));
    
    const rawData: RawExchangeFlowData = {
      timestamp: new Date(latest.datetime).getTime(),
      inflow: parseFloat(latest.inflow),
      outflow: parseFloat(latest.outflow),
      netflow: parseFloat(latest.netflow),
    };
    
    const normalized = normalizeData(rawData, circulatingSupply, 8, historical);
    const missingFields = validateContractCompliance(normalized);
    
    if (missingFields.length > 0) {
      return {
        success: false,
        data: null,
        error: 'Contract compliance failed',
        missingFields,
        source: 'cryptoquant',
        fetchedAt: Date.now(),
      };
    }
    
    return {
      success: true,
      data: normalized,
      source: 'cryptoquant',
      fetchedAt: Date.now(),
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

async function fetchFromGlassnode(config: AdapterConfig): Promise<AdapterResult> {
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
    // Fetch inflow
    const inflowResponse = await fetch(
      `${baseUrl}/metrics/transactions/transfers_volume_exchanges_net?a=${symbol}&api_key=${config.apiKey}`,
    );
    
    if (!inflowResponse.ok) {
      throw new Error(`Glassnode API error: ${inflowResponse.status}`);
    }
    
    const flowData = await inflowResponse.json();
    
    if (!flowData?.length) {
      return {
        success: false,
        data: null,
        error: 'No data returned from Glassnode',
        source: 'glassnode',
        fetchedAt: Date.now(),
      };
    }
    
    // Map latest data point
    const latest = flowData[flowData.length - 1];
    const netflow = latest.v;
    
    // For Glassnode, we need separate calls for inflow/outflow
    // Using netflow and estimating split for demo purposes
    const rawData: RawExchangeFlowData = {
      timestamp: latest.t * 1000, // Glassnode uses seconds
      inflow: netflow > 0 ? Math.abs(netflow) : 0,
      outflow: netflow < 0 ? Math.abs(netflow) : 0,
      netflow: netflow,
    };
    
    // Fetch circulating supply
    const supplyResponse = await fetch(
      `${baseUrl}/metrics/supply/current?a=${symbol}&api_key=${config.apiKey}`,
    );
    
    let circulatingSupply = 0;
    if (supplyResponse.ok) {
      const supplyData = await supplyResponse.json();
      circulatingSupply = supplyData[supplyData.length - 1]?.v || 0;
    }
    
    const normalized = normalizeData(rawData, circulatingSupply * 1e8, 8);
    const missingFields = validateContractCompliance(normalized);
    
    if (missingFields.length > 0) {
      return {
        success: false,
        data: null,
        error: 'Contract compliance failed',
        missingFields,
        source: 'glassnode',
        fetchedAt: Date.now(),
      };
    }
    
    return {
      success: true,
      data: normalized,
      source: 'glassnode',
      fetchedAt: Date.now(),
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

/**
 * Generate realistic demo data for testing.
 * Uses deterministic random based on date for consistency.
 */
function generateDemoData(): AdapterResult {
  const now = Date.now();
  const dayOfYear = Math.floor((now - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  
  // Pseudo-random but deterministic based on day
  const seed = dayOfYear * 1337;
  const rand = (n: number) => ((seed * n) % 1000) / 1000;
  
  // Base values with some daily variation
  const baseInflow = 500_000 + rand(1) * 200_000;
  const baseOutflow = 480_000 + rand(2) * 180_000;
  const circulatingSupply = 100_000_000;
  
  // Generate 30-day historical data for baseline
  const historical: RawExchangeFlowData[] = [];
  for (let i = 30; i >= 0; i--) {
    const dayVariation = rand(i * 3);
    historical.push({
      timestamp: now - i * 86400000,
      inflow: baseInflow * (0.8 + dayVariation * 0.4),
      outflow: baseOutflow * (0.8 + dayVariation * 0.4),
    });
  }
  
  const latest = historical[historical.length - 1];
  const normalized = normalizeData(latest, circulatingSupply, 0, historical);
  
  // Add large transfer count (demo)
  normalized.largeTransferCount = Math.floor(rand(4) * 15);
  
  const missingFields = validateContractCompliance(normalized);
  
  return {
    success: missingFields.length === 0,
    data: missingFields.length === 0 ? normalized : null,
    error: missingFields.length > 0 ? 'Contract compliance failed' : undefined,
    missingFields: missingFields.length > 0 ? missingFields : undefined,
    source: 'demo',
    fetchedAt: Date.now(),
  };
}

/**
 * Load data from local JSON file.
 */
async function loadFromLocal(filePath: string): Promise<AdapterResult> {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to load local file: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Validate and map to contract
    const mapped: Partial<ExchangeFlowRiskInput> = {
      timestamp: data.timestamp || Date.now(),
      exchangeInflow: data.exchangeInflow ?? data.inflow,
      exchangeOutflow: data.exchangeOutflow ?? data.outflow,
      netExchangeFlow: data.netExchangeFlow ?? data.netflow ?? (data.inflow - data.outflow),
      circulatingSupply: data.circulatingSupply,
      historicalBaseline: data.historicalBaseline,
      zScore: data.zScore,
      largeTransferCount: data.largeTransferCount,
    };
    
    const missingFields = validateContractCompliance(mapped);
    
    if (missingFields.length > 0) {
      return {
        success: false,
        data: null,
        error: 'Contract compliance failed',
        missingFields,
        source: 'local',
        fetchedAt: Date.now(),
      };
    }
    
    return {
      success: true,
      data: mapped as ExchangeFlowRiskInput,
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
 * Fetch exchange flow data from configured source.
 * 
 * @param config - Adapter configuration
 * @returns AdapterResult with contract-compliant data or error
 */
export async function fetchExchangeFlowData(config: AdapterConfig): Promise<AdapterResult> {
  switch (config.source) {
    case 'cryptoquant':
      return fetchFromCryptoQuant(config);
    
    case 'glassnode':
      return fetchFromGlassnode(config);
    
    case 'local':
      return loadFromLocal(config.baseUrl || '/data/exchange-flow.json');
    
    case 'demo':
    default:
      return generateDemoData();
  }
}

// ─────────────────────────────────────────────────
// Example Outputs
// ─────────────────────────────────────────────────

/** Example: Successful data fetch */
export const EXAMPLE_SUCCESS: AdapterResult = {
  success: true,
  data: {
    timestamp: Date.now(),
    exchangeInflow: 1_200_000,
    exchangeOutflow: 400_000,
    netExchangeFlow: 800_000,
    circulatingSupply: 100_000_000,
    historicalBaseline: { avg30d: 300_000, avg90d: 250_000 },
    zScore: 1.8,
    largeTransferCount: 8,
  },
  source: 'demo',
  fetchedAt: Date.now(),
};

/** Example: Missing required field */
export const EXAMPLE_MISSING_DATA: AdapterResult = {
  success: false,
  data: null,
  error: 'Contract compliance failed',
  missingFields: ['circulatingSupply'],
  source: 'cryptoquant',
  fetchedAt: Date.now(),
};

/** Example: API error */
export const EXAMPLE_API_ERROR: AdapterResult = {
  success: false,
  data: null,
  error: 'CryptoQuant API error: 429 Too Many Requests',
  source: 'cryptoquant',
  fetchedAt: Date.now(),
};
