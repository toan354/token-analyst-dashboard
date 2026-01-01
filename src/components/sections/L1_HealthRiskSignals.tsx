/**
 * L1 - Health & Risk Signals
 * 
 * Purpose: Gatekeeper checks and verdicts
 * Content: Pass/fail checks with short explanations
 * 
 * MODULES:
 * - StatusAggregator: Global gatekeeper status
 * - ExchangeFlowRiskModule: Exchange flow risk analysis
 * - SupplyEmissionRiskModule: Supply emission risk analysis
 */

import StatusAggregator from '@/components/modules/StatusAggregator';
import ExchangeFlowRiskModule, {
  ExchangeFlowRiskInput,
  MOCK_WARNING,
} from '@/components/modules/ExchangeFlowRiskModule';
import SupplyEmissionRiskModule, {
  SupplyEmissionRiskInput,
  MOCK_EMISSION_WARNING,
} from '@/components/modules/SupplyEmissionRiskModule';
import { 
  aggregateL1Status, 
  ModuleResult, 
  AggregatedResult,
  EXAMPLE_MIXED_WARNING 
} from '@/lib/status-aggregation';

interface CheckItem {
  name: string;
  status: 'PASS' | 'WARNING' | 'FAIL' | 'UNKNOWN';
  note?: string;
}

interface L1Props {
  checks?: CheckItem[];
  exchangeFlowData?: ExchangeFlowRiskInput | null;
  exchangeFlowLoading?: boolean;
  exchangeFlowError?: string | null;
  supplyEmissionData?: SupplyEmissionRiskInput | null;
  supplyEmissionLoading?: boolean;
  supplyEmissionError?: string | null;
  moduleResults?: ModuleResult[];
  useMockData?: boolean;
}

const defaultChecks: CheckItem[] = [
  { name: 'Liquidity Check', status: 'UNKNOWN', note: 'Awaiting data' },
  { name: 'Smart Contract Risk', status: 'UNKNOWN', note: 'Awaiting data' },
  { name: 'Team / Dev Activity', status: 'UNKNOWN', note: 'Awaiting data' },
  { name: 'Token Distribution', status: 'UNKNOWN', note: 'Awaiting data' },
];

export default function L1_HealthRiskSignals({ 
  checks = defaultChecks,
  exchangeFlowData,
  exchangeFlowLoading,
  exchangeFlowError,
  supplyEmissionData,
  supplyEmissionLoading,
  supplyEmissionError,
  moduleResults,
  useMockData = true
}: L1Props) {
  // Use mock data if enabled and no real data provided
  const flowData = exchangeFlowData ?? (useMockData ? MOCK_WARNING : null);
  const emissionData = supplyEmissionData ?? (useMockData ? MOCK_EMISSION_WARNING : null);
  
  // Aggregate module statuses
  const modules = moduleResults ?? (useMockData ? EXAMPLE_MIXED_WARNING : []);
  const aggregatedResult: AggregatedResult = aggregateL1Status(modules);

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <span className="section-label">L1</span>
        <span className="section-title">Health & Risk Signals</span>
      </div>
      <div className="section-content">
        {/* Global Gatekeeper Status */}
        <StatusAggregator result={aggregatedResult} />

        {/* Quick Check Summary */}
        {checks.length === 0 ? (
          <div className="empty-state">No checks configured</div>
        ) : (
          <div className="flex-col">
            {checks.map((check, idx) => (
              <div key={idx} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid #27272a' }}>
                <span style={{ color: '#fafafa' }}>{check.name}</span>
                <div className="flex-row">
                  <span className={`status-${check.status.toLowerCase()}`} style={{ fontWeight: 600 }}>
                    {check.status}
                  </span>
                  {check.note && (
                    <span className="text-muted text-small">({check.note})</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Exchange Flow Risk Module */}
        <ExchangeFlowRiskModule 
          data={flowData}
          isLoading={exchangeFlowLoading}
          error={exchangeFlowError}
          dataConfidence={{
            status: 'CAUTION',
            note: 'One abnormal net flow spike detected relative to historical median. Data is usable but should be interpreted with caution.',
          }}
        />

        {/* Supply Emission Risk Module */}
        <SupplyEmissionRiskModule 
          data={emissionData}
          isLoading={supplyEmissionLoading}
          error={supplyEmissionError}
        />
      </div>
    </section>
  );
}


