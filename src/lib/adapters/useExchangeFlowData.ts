/**
 * useExchangeFlowData Hook
 * 
 * React hook for fetching exchange flow data using the adapter.
 * Handles loading state, error state, and caching.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  fetchExchangeFlowData, 
  AdapterConfig, 
  AdapterResult 
} from './exchange-flow-adapter';
import { ExchangeFlowRiskInput } from '@/components/modules/ExchangeFlowRiskModule';

interface UseExchangeFlowDataResult {
  data: ExchangeFlowRiskInput | null;
  isLoading: boolean;
  error: string | null;
  missingFields: string[] | null;
  source: string | null;
  refetch: () => Promise<void>;
}

interface UseExchangeFlowDataOptions {
  /** Adapter configuration */
  config: AdapterConfig;
  /** Auto-fetch on mount (default: true) */
  autoFetch?: boolean;
  /** Refresh interval in ms (default: 0 = no refresh) */
  refreshInterval?: number;
  /** Use demo fallback if real data fails (default: true) */
  useDemoFallback?: boolean;
}

export function useExchangeFlowData(options: UseExchangeFlowDataOptions): UseExchangeFlowDataResult {
  const { 
    config, 
    autoFetch = true, 
    refreshInterval = 0,
    useDemoFallback = true,
  } = options;
  
  const [data, setData] = useState<ExchangeFlowRiskInput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[] | null>(null);
  const [source, setSource] = useState<string | null>(null);
  
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setMissingFields(null);
    
    try {
      let result: AdapterResult = await fetchExchangeFlowData(config);
      
      // Fallback to demo if enabled and real data fails
      if (!result.success && useDemoFallback && config.source !== 'demo') {
        console.warn(`[ExchangeFlowAdapter] ${config.source} failed, falling back to demo`);
        result = await fetchExchangeFlowData({ ...config, source: 'demo' });
      }
      
      if (result.success && result.data) {
        setData(result.data);
        setSource(result.source);
      } else {
        setError(result.error || 'Unknown error');
        setMissingFields(result.missingFields || null);
        setSource(result.source);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [config, useDemoFallback]);
  
  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);
  
  // Refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, fetchData]);
  
  return {
    data,
    isLoading,
    error,
    missingFields,
    source,
    refetch: fetchData,
  };
}

// ─────────────────────────────────────────────────
// Default Configurations
// ─────────────────────────────────────────────────

export const DEFAULT_DEMO_CONFIG: AdapterConfig = {
  source: 'demo',
  tokenSymbol: 'BTC',
};

export const DEFAULT_CRYPTOQUANT_CONFIG: AdapterConfig = {
  source: 'cryptoquant',
  tokenSymbol: 'BTC',
  // apiKey must be provided by user
};

export const DEFAULT_GLASSNODE_CONFIG: AdapterConfig = {
  source: 'glassnode',
  tokenSymbol: 'BTC',
  // apiKey must be provided by user
};
