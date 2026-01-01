/**
 * L3 - Behavioral / Flow
 * 
 * Purpose: On-chain and volume behavior analysis
 * Content: Time-series blocks, flow indicators
 * 
 * MODULES:
 * - OnChainFlowOverviewModule: On-chain flow dynamics and time-series
 * - ExchangeVsNonExchangeFlowModule: Flow decomposition by destination
 * - WhaleTransferBehaviorModule: Large transfer behavior analysis
 * - FlowAnalysisModule: Whale tracking, netflow analysis
 */

import OnChainFlowOverviewModule, {
  OnChainFlowInput,
  MOCK_STABLE_TRENDING,
} from '@/components/modules/OnChainFlowOverviewModule';
import ExchangeVsNonExchangeFlowModule, {
  ExchangeFlowInput,
  MOCK_BALANCED,
} from '@/components/modules/ExchangeVsNonExchangeFlowModule';
import WhaleTransferBehaviorModule, {
  WhaleTransferInput,
  MOCK_MIXED_ACTIVITY,
} from '@/components/modules/WhaleTransferBehaviorModule';
import FlowAnalysisModule from '@/components/modules/FlowAnalysisModule';
import { FlowAnalysisResult } from '@/lib/flow';

interface FlowItem {
  label: string;
  value: string;
  indicator?: 'inflow' | 'outflow' | 'neutral';
}

interface L3Props {
  flows?: FlowItem[];
  onChainFlow?: OnChainFlowInput | null;
  onChainFlowLoading?: boolean;
  onChainFlowError?: string | null;
  exchangeFlow?: ExchangeFlowInput | null;
  exchangeFlowLoading?: boolean;
  exchangeFlowError?: string | null;
  whaleTransfer?: WhaleTransferInput | null;
  whaleTransferLoading?: boolean;
  whaleTransferError?: string | null;
  flowAnalysis?: FlowAnalysisResult | null;
  flowLoading?: boolean;
  flowError?: string | null;
  useMockData?: boolean;
}

const defaultFlows: FlowItem[] = [
  { label: 'Exchange Inflow (24h)', value: '--', indicator: 'neutral' },
  { label: 'Exchange Outflow (24h)', value: '--', indicator: 'neutral' },
  { label: 'Net Flow', value: '--', indicator: 'neutral' },
  { label: 'Active Addresses', value: '--' },
  { label: 'Transaction Count', value: '--' },
];

export default function L3_BehavioralFlow({ 
  flows = defaultFlows,
  onChainFlow,
  onChainFlowLoading,
  onChainFlowError,
  exchangeFlow,
  exchangeFlowLoading,
  exchangeFlowError,
  whaleTransfer,
  whaleTransferLoading,
  whaleTransferError,
  flowAnalysis,
  flowLoading,
  flowError,
  useMockData = true
}: L3Props) {
  // Use mock data if enabled and no real data provided
  const flowData = onChainFlow ?? (useMockData ? MOCK_STABLE_TRENDING : null);
  const exchFlowData = exchangeFlow ?? (useMockData ? MOCK_BALANCED : null);
  const whaleData = whaleTransfer ?? (useMockData ? MOCK_MIXED_ACTIVITY : null);

  const getIndicatorColor = (indicator?: string) => {
    switch (indicator) {
      case 'inflow': return '#ef4444';
      case 'outflow': return '#22c55e';
      default: return '#a1a1aa';
    }
  };

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <span className="section-label">L3</span>
        <span className="section-title">Behavioral / Flow</span>
      </div>
      <div className="section-content">
        {/* Quick Flow Indicators */}
        {flows.length === 0 ? (
          <div className="empty-state">No flow data available</div>
        ) : (
          <div className="flex-col">
            {flows.map((flow, idx) => (
              <div key={idx} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid #27272a' }}>
                <span style={{ color: '#fafafa' }}>{flow.label}</span>
                <span style={{ 
                  fontSize: '1rem', 
                  fontWeight: 500, 
                  color: getIndicatorColor(flow.indicator) 
                }}>
                  {flow.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* On-Chain Flow Overview Module */}
        <OnChainFlowOverviewModule
          data={flowData}
          isLoading={onChainFlowLoading}
          error={onChainFlowError}
        />

        {/* Exchange vs Non-Exchange Flow Module */}
        <ExchangeVsNonExchangeFlowModule
          data={exchFlowData}
          isLoading={exchangeFlowLoading}
          error={exchangeFlowError}
        />

        {/* Whale Transfer Behavior Module */}
        <WhaleTransferBehaviorModule
          data={whaleData}
          isLoading={whaleTransferLoading}
          error={whaleTransferError}
        />

        {/* Flow Analysis Module */}
        <FlowAnalysisModule 
          data={flowAnalysis}
          isLoading={flowLoading}
          error={flowError}
        />
      </div>
    </section>
  );
}
