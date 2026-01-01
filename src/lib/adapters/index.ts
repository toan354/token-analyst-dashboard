/**
 * ════════════════════════════════════════════════════════════════
 * DATA PIPELINE — FROZEN
 * Status: DATA PHASE COMPLETE
 * Frozen: 2026-01-01
 * 
 * All adapters, hooks, and contracts in this module are LOCKED.
 * Do NOT modify without explicit approval.
 * ════════════════════════════════════════════════════════════════
 */

// Pipeline status export
export { DATA_PIPELINE_STATUS } from './DATA_PIPELINE_FROZEN';

// Adapter exports
export { 
  fetchExchangeFlowData,
  type AdapterConfig,
  type AdapterResult,
  type RawExchangeFlowData,
  EXAMPLE_SUCCESS,
  EXAMPLE_MISSING_DATA,
  EXAMPLE_API_ERROR,
} from './exchange-flow-adapter';

export { 
  useExchangeFlowData,
  DEFAULT_DEMO_CONFIG,
  DEFAULT_CRYPTOQUANT_CONFIG,
  DEFAULT_GLASSNODE_CONFIG,
} from './useExchangeFlowData';

export {
  fetchSupplyEmissionData,
  type SupplyAdapterConfig,
  type SupplyAdapterResult,
  EXAMPLE_SUCCESS as SUPPLY_EXAMPLE_SUCCESS,
  EXAMPLE_MISSING_DATA as SUPPLY_EXAMPLE_MISSING,
  DEFAULT_DEMO_CONFIG as SUPPLY_DEFAULT_DEMO,
  DEFAULT_COINGECKO_CONFIG,
  DEFAULT_MESSARI_CONFIG,
} from './supply-emission-adapter';

export {
  fetchExchangeVsNonExchangeFlowData,
  type FlowSplitAdapterConfig,
  type FlowSplitAdapterResult,
  EXAMPLE_SUCCESS as FLOW_SPLIT_EXAMPLE_SUCCESS,
  EXAMPLE_MISSING_DATA as FLOW_SPLIT_EXAMPLE_MISSING,
  DEFAULT_DEMO_CONFIG as FLOW_SPLIT_DEFAULT_DEMO,
  DEFAULT_CRYPTOQUANT_CONFIG as FLOW_SPLIT_CRYPTOQUANT,
  DEFAULT_GLASSNODE_CONFIG as FLOW_SPLIT_GLASSNODE,
} from './exchange-vs-nonexchange-flow-adapter';

export {
  useExchangeVsNonExchangeFlowData,
} from './useExchangeVsNonExchangeFlowData';

export {
  fetchWhaleTransferData,
  type WhaleAdapterConfig,
  type WhaleAdapterResult,
  EXAMPLE_SUCCESS as WHALE_EXAMPLE_SUCCESS,
  EXAMPLE_MISSING_DATA as WHALE_EXAMPLE_MISSING,
  DEFAULT_DEMO_CONFIG as WHALE_DEFAULT_DEMO,
  DEFAULT_CRYPTOQUANT_CONFIG as WHALE_CRYPTOQUANT,
  DEFAULT_GLASSNODE_CONFIG as WHALE_GLASSNODE,
} from './whale-transfer-adapter';

export {
  useWhaleTransferData,
} from './useWhaleTransferData';
