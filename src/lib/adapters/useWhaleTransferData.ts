/**
 * React Hook for Whale Transfer Behavior Data
 * 
 * Provides loading/error states and auto-refresh on config change.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { WhaleTransferInput } from '@/components/modules/WhaleTransferBehaviorModule';
import {
  fetchWhaleTransferData,
  WhaleAdapterConfig,
  WhaleAdapterResult,
  DEFAULT_DEMO_CONFIG,
} from './whale-transfer-adapter';

export interface UseWhaleTransferDataResult {
  data: WhaleTransferInput | null;
  isLoading: boolean;
  error: string | null;
  result: WhaleAdapterResult | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage whale transfer behavior data.
 * 
 * @param config - Adapter configuration (defaults to demo mode)
 * @returns Data, loading state, error state, and refetch function
 */
export function useWhaleTransferData(
  config: WhaleAdapterConfig = DEFAULT_DEMO_CONFIG
): UseWhaleTransferDataResult {
  const [data, setData] = useState<WhaleTransferInput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WhaleAdapterResult | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const adapterResult = await fetchWhaleTransferData(config);
      setResult(adapterResult);
      
      if (adapterResult.success && adapterResult.data) {
        setData(adapterResult.data);
        setError(null);
      } else {
        setData(null);
        setError(adapterResult.error || 'WHALE TRANSFER DATA UNAVAILABLE');
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
