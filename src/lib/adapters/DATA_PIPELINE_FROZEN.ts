/**
 * ════════════════════════════════════════════════════════════════
 * DATA PIPELINE — FROZEN
 * ════════════════════════════════════════════════════════════════
 * 
 * Status: DATA PHASE COMPLETE
 * Frozen: 2026-01-01T16:36:09+07:00
 * 
 * ────────────────────────────────────────────────────────────────
 * FREEZE SCOPE
 * ────────────────────────────────────────────────────────────────
 * 
 * The following components are FROZEN and MUST NOT be modified:
 * 
 * 1. DATA ADAPTERS
 *    - exchange-flow-adapter.ts
 *    - supply-emission-adapter.ts
 *    - exchange-vs-nonexchange-flow-adapter.ts
 *    - whale-transfer-adapter.ts
 * 
 * 2. REACT HOOKS
 *    - useExchangeFlowData.ts
 *    - useExchangeVsNonExchangeFlowData.ts
 *    - useWhaleTransferData.ts
 * 
 * 3. MODULE CONTRACTS
 *    - OnChainFlowOverviewModule (L3)
 *    - ExchangeVsNonExchangeFlowModule (L3)
 *    - WhaleTransferBehaviorModule (L3)
 *    - ExchangeFlowRiskModule (L2)
 *    - SupplyEmissionRiskModule (L2)
 * 
 * 4. SANITY CHECKS
 *    - l3-flow-sanity-check.js
 *    - l3-flow-split-sanity-check.js
 *    - l3-whale-sanity-check.js
 * 
 * 5. AGGREGATION LOGIC
 *    - status-aggregation.ts
 * 
 * ────────────────────────────────────────────────────────────────
 * PROHIBITED MODIFICATIONS
 * ────────────────────────────────────────────────────────────────
 * 
 * - NO refactoring of adapter logic
 * - NO new data sources
 * - NO field changes to module contracts
 * - NO threshold modifications
 * - NO changes to sanity check criteria
 * 
 * ────────────────────────────────────────────────────────────────
 * AVAILABLE DATASETS FOR RESEARCH (L4)
 * ────────────────────────────────────────────────────────────────
 * 
 * L2 Risk Modules:
 * ├── ExchangeFlowRiskInput
 * │   ├── timestamp, exchangeInflow, exchangeOutflow, netExchangeFlow
 * │   ├── circulatingSupply, historicalBaseline, zScore
 * │   └── largeTransferCount (optional)
 * │
 * └── SupplyEmissionRiskInput
 *     ├── currentSupply, maxSupply, inflationRate
 *     ├── nextUnlockDate, nextUnlockAmount, vestingSchedule
 *     └── stakingRatio (optional)
 * 
 * L3 Behavioral Modules:
 * ├── OnChainFlowInput
 * │   ├── timestampSeries, inflowSeries, outflowSeries, netFlowSeries
 * │   └── exchangeFlowSeries, whaleFlowSeries, rollingAverage (optional)
 * │
 * ├── ExchangeFlowInput (Exchange vs Non-Exchange)
 * │   ├── timestampSeries, exchangeInflowSeries, exchangeOutflowSeries
 * │   ├── nonExchangeFlowSeries
 * │   └── bridgeFlowSeries, stakingFlowSeries, labeledEntityFlowSeries (optional)
 * │
 * └── WhaleTransferInput
 *     ├── timestampSeries, largeTransferCountSeries, largeTransferVolumeSeries
 *     ├── largeTransferThreshold
 *     └── whaleExchangeFlowSeries, whaleNonExchangeFlowSeries, topEntityTransferSeries (optional)
 * 
 * ────────────────────────────────────────────────────────────────
 * SANITY CHECK RESULTS
 * ────────────────────────────────────────────────────────────────
 * 
 * | Module                          | Status  | Recommendation    |
 * |---------------------------------|---------|-------------------|
 * | L3 On-Chain Flow Overview       | PASS    | SAFE TO USE       |
 * | L3 Exchange vs Non-Exchange     | WARNING | USE WITH CAUTION  |
 * | L3 Whale Transfer Behavior      | PASS    | SAFE TO USE       |
 * 
 * ────────────────────────────────────────────────────────────────
 * NEXT PHASE: L4 RESEARCH NARRATIVE
 * ────────────────────────────────────────────────────────────────
 * 
 * The data pipeline is now ready to support:
 * - Thesis construction and validation
 * - Catalyst mapping and tracking
 * - Research narrative generation
 * - Cross-module correlation analysis
 * 
 * ════════════════════════════════════════════════════════════════
 */

// This file serves as documentation only.
// The data pipeline is FROZEN and should not be modified.

export const DATA_PIPELINE_STATUS = {
  phase: 'COMPLETE',
  frozen: true,
  frozenAt: '2026-01-01T16:36:09+07:00',
  readyForL4: true,
} as const;
