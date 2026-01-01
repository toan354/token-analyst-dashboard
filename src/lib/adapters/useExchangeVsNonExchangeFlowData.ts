/**
 * React Hook for Exchange vs Non-Exchange Flow Data
 * 
 * Provides loading/error states and auto-refresh on config change.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ExchangeFlowInput } from '@/components/modules/ExchangeVsNonExchangeFlowModule';
import {
  fetchExchangeVsNonExchangeFlowData,
  FlowSplitAdapterConfig,
  FlowSplitAdapterResult,
  DEFAULT_DEMO_CONFIG,
} from './exchange-vs-nonexchange-flow-adapter';

export interface UseExchangeVsNonExchangeFlowResult {
  data: ExchangeFlowInput | null;
  isLoading: boolean;
  error: string | null;
  result: FlowSplitAdapterResult | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage Exchange vs Non-Exchange flow data.
 * 
 * @param config - Adapter configuration (defaults to demo mode)
 * @returns Data, loading state, error state, and refetch function
 */
export function useExchangeVsNonExchangeFlowData(
  config: FlowSplitAdapterConfig = DEFAULT_DEMO_CONFIG
): UseExchangeVsNonExchangeFlowResult {
  const [data, setData] = useState<ExchangeFlowInput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FlowSplitAdapterResult | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const adapterResult = await fetchExchangeVsNonExchangeFlowData(config);
      setResult(adapterResult);
      
      if (adapterResult.success && adapterResult.data) {
        setData(adapterResult.data);
        setError(null);
      } else {
        setData(null);
        setError(adapterResult.error || 'FLOW SPLIT DATA UNAVAILABLE');
      }
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    result,
    refetch: fetchData,
  };
}

export { DEFAULT_DEMO_CONFIG };
