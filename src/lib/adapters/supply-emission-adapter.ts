/**
 * Supply Emission Data Adapter
 * 
 * PURPOSE: Fetch/load real supply and emission data and map it to the
 *          SupplyEmissionRiskModule contract (FROZEN - do NOT modify).
 * 
 * ════════════════════════════════════════════════════════════════
 * DATA SOURCES SUPPORTED
 * ════════════════════════════════════════════════════════════════
 * 
 * 1. CoinGecko API (free tier available)
 * 2. Token Unlocks API (for unlock schedules)
 * 3. Messari API (comprehensive)
 * 4. Local JSON (for testing/demo)
 * 
 * LIMITATIONS:
 * - Emission rate often requires calculation from supply changes
 * - Unlock schedules may require separate specialized APIs
 * - Free APIs have rate limits
 * 
 * ════════════════════════════════════════════════════════════════
 * CONTRACT MAPPING TABLE
 * ════════════════════════════════════════════════════════════════
 * 
 * | Contract Field       | CoinGecko Source           | Messari Source            |
 * |----------------------|----------------------------|---------------------------|
 * | circulatingSupply    | market_data.circulating    | supply.circulating        |
 * | totalSupply          | market_data.total_supply   | supply.total              |
 * | maxSupply            | market_data.max_supply     | supply.max                |
 * | emissionRate         | calculated from schedule   | calculated or API         |
 * | unlockSchedule       | external (Token Unlocks)   | profile.token_distribution|
 * | inflationPctAnnualized| calculated                | metrics.supply_inflation  |
 * 
 * ════════════════════════════════════════════════════════════════
 */

import { SupplyEmissionRiskInput, UnlockEvent } from '@/components/modules/SupplyEmissionRiskModule';

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

export interface SupplyAdapterConfig {
  source: 'coingecko' | 'messari' | 'local' | 'demo';
  tokenId: string;  // CoinGecko ID or Messari slug
  apiKey?: string;
  baseUrl?: string;
}

export interface RawSupplyData {
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number | null;
  /** Daily emission if available from source */
  dailyEmission?: number;
  /** Historical supply for calculating emission */
  historicalSupply?: {
    timestamp: number;
    supply: number;
  }[];
}

export interface SupplyAdapterResult {
  success: boolean;
  data: SupplyEmissionRiskInput | null;
  error?: string;
  missingFields?: string[];
  source: string;
  fetchedAt: number;
}

// ─────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────

function validateContractCompliance(data: Partial<SupplyEmissionRiskInput>): string[] {
  const missing: string[] = [];
  
  // Required fields check
  if (data.circulatingSupply === undefined || data.circulatingSupply <= 0) missing.push('circulatingSupply');
  if (data.totalSupply === undefined || data.totalSupply <= 0) missing.push('totalSupply');
  if (data.emissionRate === undefined || isNaN(data.emissionRate)) missing.push('emissionRate');
  // maxSupply can be null, so we don't validate it as missing
  
  return missing;
}

// ─────────────────────────────────────────────────
// Normalization & Calculation
// ─────────────────────────────────────────────────

/**
 * Calculate daily emission rate from historical supply data.
 */
function calculateDailyEmission(historicalSupply?: { timestamp: number; supply: number }[]): number {
  if (!historicalSupply || historicalSupply.length < 2) {
    return 0;
  }
  
  // Sort by timestamp
  const sorted = [...historicalSupply].sort((a, b) => a.timestamp - b.timestamp);
  
  // Calculate average daily change over available period
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const daysDiff = (last.timestamp - first.timestamp) / (1000 * 60 * 60 * 24);
  
  if (daysDiff <= 0) return 0;
  
  const supplyChange = last.supply - first.supply;
  return supplyChange / daysDiff;
}

/**
 * Calculate annualized inflation percentage.
 */
function calculateInflation(circulatingSupply: number, dailyEmission: number): number {
  if (circulatingSupply <= 0) return 0;
  const dailyInflation = (dailyEmission / circulatingSupply) * 100;
  return dailyInflation * 365;
}

/**
 * Normalize raw data to contract format.
 */
function normalizeData(
  raw: RawSupplyData,
  unlockSchedule?: UnlockEvent[]
): SupplyEmissionRiskInput {
  const emissionRate = raw.dailyEmission ?? calculateDailyEmission(raw.historicalSupply);
  const inflationPctAnnualized = calculateInflation(raw.circulatingSupply, emissionRate);
  
  return {
    circulatingSupply: raw.circulatingSupply,
    totalSupply: raw.totalSupply,
    maxSupply: raw.maxSupply,
    emissionRate,
    unlockSchedule,
    inflationPctAnnualized,
  };
}

// ─────────────────────────────────────────────────
// CoinGecko Adapter
// ─────────────────────────────────────────────────

interface CoinGeckoResponse {
  market_data: {
    circulating_supply: number;
    total_supply: number;
    max_supply: number | null;
  };
}

async function fetchFromCoinGecko(config: SupplyAdapterConfig): Promise<SupplyAdapterResult> {
  const baseUrl = config.baseUrl || 'https://api.coingecko.com/api/v3';
  
  try {
    const response = await fetch(
      `${baseUrl}/coins/${config.tokenId}?localization=false&tickers=false&community_data=false&developer_data=false`,
      {
        headers: config.apiKey ? { 'x-cg-demo-api-key': config.apiKey } : {},
      }
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const coinData: CoinGeckoResponse = await response.json();
    const marketData = coinData.market_data;
    
    if (!marketData) {
      return {
        success: false,
        data: null,
        error: 'No market data returned from CoinGecko',
        source: 'coingecko',
        fetchedAt: Date.now(),
      };
    }
    
    // CoinGecko doesn't provide emission rate directly, need to estimate
    // Using a placeholder calculation based on supply difference
    const rawData: RawSupplyData = {
      circulatingSupply: marketData.circulating_supply || 0,
      totalSupply: marketData.total_supply || 0,
      maxSupply: marketData.max_supply,
      // Estimate daily emission from remaining supply / typical vesting period
      dailyEmission: marketData.total_supply && marketData.circulating_supply
        ? (marketData.total_supply - marketData.circulating_supply) / (365 * 4) // 4-year linear estimate
        : 0,
    };
    
    const normalized = normalizeData(rawData);
    const missingFields = validateContractCompliance(normalized);
    
    if (missingFields.length > 0) {
      return {
        success: false,
        data: null,
        error: 'Contract compliance failed',
        missingFields,
        source: 'coingecko',
        fetchedAt: Date.now(),
      };
    }
    
    return {
      success: true,
      data: normalized,
      source: 'coingecko',
      fetchedAt: Date.now(),
    };
    
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error',
      source: 'coingecko',
      fetchedAt: Date.now(),
    };
  }
}

// ─────────────────────────────────────────────────
// Messari Adapter
// ─────────────────────────────────────────────────

async function fetchFromMessari(config: SupplyAdapterConfig): Promise<SupplyAdapterResult> {
  if (!config.apiKey) {
    return {
      success: false,
      data: null,
      error: 'Messari API key required',
      source: 'messari',
      fetchedAt: Date.now(),
    };
  }
  
  const baseUrl = config.baseUrl || 'https://data.messari.io/api/v1';
  
  try {
    const response = await fetch(
      `${baseUrl}/assets/${config.tokenId}/metrics`,
      {
        headers: {
          'x-messari-api-key': config.apiKey,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Messari API error: ${response.status}`);
    }
    
    const data = await response.json();
    const supply = data.data?.supply;
    const metrics = data.data?.metrics;
    
    if (!supply) {
      return {
        success: false,
        data: null,
        error: 'No supply data returned from Messari',
        source: 'messari',
        fetchedAt: Date.now(),
      };
    }
    
    const rawData: RawSupplyData = {
      circulatingSupply: supply.circulating || 0,
      totalSupply: supply.total || 0,
      maxSupply: supply.max || null,
      dailyEmission: metrics?.supply_activity?.issuance_rate_daily || 0,
    };
    
    // Include inflation if available
    const inflationPct = metrics?.supply_activity?.annual_inflation_percent;
    
    const normalized = normalizeData(rawData);
    if (inflationPct !== undefined) {
      normalized.inflationPctAnnualized = inflationPct;
    }
    
    const missingFields = validateContractCompliance(normalized);
    
    if (missingFields.length > 0) {
      return {
        success: false,
        data: null,
        error: 'Contract compliance failed',
        missingFields,
        source: 'messari',
        fetchedAt: Date.now(),
      };
    }
    
    return {
      success: true,
      data: normalized,
      source: 'messari',
      fetchedAt: Date.now(),
    };
    
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error',
      source: 'messari',
      fetchedAt: Date.now(),
    };
  }
}

// ─────────────────────────────────────────────────
// Local/Demo Data Adapter
// ─────────────────────────────────────────────────

function generateDemoData(): SupplyAdapterResult {
  const now = Date.now();
  
  // Realistic demo values
  const circulatingSupply = 500_000_000;
  const totalSupply = 1_000_000_000;
  const maxSupply = 1_000_000_000;
  const dailyEmission = 100_000; // ~7.3% annualized
  
  const unlockSchedule: UnlockEvent[] = [
    {
      date: new Date(now + 20 * 24 * 60 * 60 * 1000).toISOString(),
      volume: 20_000_000,
      description: 'Team cliff unlock',
    },
    {
      date: new Date(now + 90 * 24 * 60 * 60 * 1000).toISOString(),
      volume: 50_000_000,
      description: 'Investor vesting',
    },
  ];
  
  const data: SupplyEmissionRiskInput = {
    circulatingSupply,
    totalSupply,
    maxSupply,
    emissionRate: dailyEmission,
    unlockSchedule,
    inflationPctAnnualized: calculateInflation(circulatingSupply, dailyEmission),
  };
  
  return {
    success: true,
    data,
    source: 'demo',
    fetchedAt: now,
  };
}

/**
 * Load data from local JSON file.
 */
async function loadFromLocal(filePath: string): Promise<SupplyAdapterResult> {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to load local file: ${response.status}`);
    }
    
    const raw = await response.json();
    
    // Map to contract format
    const data: Partial<SupplyEmissionRiskInput> = {
      circulatingSupply: raw.circulatingSupply ?? raw.circulating_supply,
      totalSupply: raw.totalSupply ?? raw.total_supply,
      maxSupply: raw.maxSupply ?? raw.max_supply ?? null,
      emissionRate: raw.emissionRate ?? raw.emission_rate ?? raw.dailyEmission,
      unlockSchedule: raw.unlockSchedule ?? raw.unlock_schedule,
      inflationPctAnnualized: raw.inflationPctAnnualized ?? raw.inflation_pct,
    };
    
    const missingFields = validateContractCompliance(data);
    
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
      data: data as SupplyEmissionRiskInput,
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
 * Fetch supply emission data from configured source.
 * 
 * @param config - Adapter configuration
 * @returns SupplyAdapterResult with contract-compliant data or error
 */
export async function fetchSupplyEmissionData(config: SupplyAdapterConfig): Promise<SupplyAdapterResult> {
  switch (config.source) {
    case 'coingecko':
      return fetchFromCoinGecko(config);
    
    case 'messari':
      return fetchFromMessari(config);
    
    case 'local':
      return loadFromLocal(config.baseUrl || '/data/supply-emission.json');
    
    case 'demo':
    default:
      return generateDemoData();
  }
}

// ─────────────────────────────────────────────────
// React Hook
// ─────────────────────────────────────────────────

export function useSupplyEmissionData(options: {
  config: SupplyAdapterConfig;
  autoFetch?: boolean;
  useDemoFallback?: boolean;
}) {
  // This would be implemented similar to useExchangeFlowData
  // For now, returns the types for integration
  return {
    fetchData: () => fetchSupplyEmissionData(options.config),
  };
}

// ─────────────────────────────────────────────────
// Example Outputs
// ─────────────────────────────────────────────────

/** Example: Successful data fetch */
export const EXAMPLE_SUCCESS: SupplyAdapterResult = {
  success: true,
  data: {
    circulatingSupply: 500_000_000,
    totalSupply: 1_000_000_000,
    maxSupply: 1_000_000_000,
    emissionRate: 100_000,
    unlockSchedule: [
      { date: '2026-01-21T00:00:00Z', volume: 20_000_000, description: 'Team cliff' },
    ],
    inflationPctAnnualized: 7.3,
  },
  source: 'demo',
  fetchedAt: Date.now(),
};

/** Example: Missing required field */
export const EXAMPLE_MISSING_DATA: SupplyAdapterResult = {
  success: false,
  data: null,
  error: 'Contract compliance failed',
  missingFields: ['emissionRate'],
  source: 'coingecko',
  fetchedAt: Date.now(),
};

/** Example: API error */
export const EXAMPLE_API_ERROR: SupplyAdapterResult = {
  success: false,
  data: null,
  error: 'CoinGecko API error: 429 Too Many Requests',
  source: 'coingecko',
  fetchedAt: Date.now(),
};

// ─────────────────────────────────────────────────
// Default Configurations
// ─────────────────────────────────────────────────

export const DEFAULT_DEMO_CONFIG: SupplyAdapterConfig = {
  source: 'demo',
  tokenId: 'demo-token',
};

export const DEFAULT_COINGECKO_CONFIG: SupplyAdapterConfig = {
  source: 'coingecko',
  tokenId: 'bitcoin', // Replace with target token
};

export const DEFAULT_MESSARI_CONFIG: SupplyAdapterConfig = {
  source: 'messari',
  tokenId: 'bitcoin',
  // apiKey must be provided
};
