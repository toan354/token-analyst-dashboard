/**
 * ExchangeFlowRiskModule
 * 
 * Contract: ./ExchangeFlowRiskModule.contract.md
 * Layer: L1 — Health & Risk Signals
 * Purpose: Detect abnormal token flows between exchanges and non-exchange wallets.
 * 
 * RULES RESPECTED:
 * - NO investment decisions
 * - Neutral language only
 * - Graceful degradation with missing data
 * - NEVER defaults to PASS
 */

// ─────────────────────────────────────────────────
// Types (from Contract §2)
// ─────────────────────────────────────────────────

export interface HistoricalBaseline {
  avg30d: number;
  avg90d: number;
}

export interface ExchangeFlowRiskInput {
  timestamp: number;
  exchangeInflow: number;
  exchangeOutflow: number;
  netExchangeFlow: number;
  circulatingSupply: number;
  historicalBaseline?: HistoricalBaseline;
  zScore?: number;
  largeTransferCount?: number;
}

export interface ExchangeFlowRiskProps {
  data?: ExchangeFlowRiskInput | null;
  isLoading?: boolean;
  error?: string | null;
  /** Optional data confidence annotation from sanity check */
  dataConfidence?: {
    status: 'SAFE' | 'CAUTION' | 'BLOCKED';
    note?: string;
  };
}

// ─────────────────────────────────────────────────
// Status & Signal Types (from Contract §3 & §4)
// ─────────────────────────────────────────────────

type ModuleStatus = 'PASS' | 'WARNING' | 'FAIL' | 'INSUFFICIENT DATA';
type FlowDirection = 'inflow' | 'outflow' | 'neutral';
type AbnormalityLevel = 'normal' | 'elevated' | 'extreme';
type VelocityChange = 'increase' | 'stable' | 'decrease';

interface DerivedSignals {
  netFlowDirection: FlowDirection;
  abnormalityLevel: AbnormalityLevel;
  flowVelocityChange: VelocityChange;
}

interface ComputedMetrics {
  netFlowPctOfSupply: number;
  signals: DerivedSignals;
}

// ─────────────────────────────────────────────────
// Thresholds (Contract §4 — PLACEHOLDER)
// ─────────────────────────────────────────────────

const THRESHOLDS = {
  NORMAL_FLOW_PCT: 0.5,      // < 0.5% = normal
  WARNING_FLOW_PCT: 2.0,     // 0.5% - 2% = warning
  ELEVATED_ZSCORE: 1.5,      // z > 1.5 = elevated
  EXTREME_ZSCORE: 3.0,       // z > 3.0 = extreme
} as const;

// ─────────────────────────────────────────────────
// Business Logic (from Contract §3 & §4)
// ─────────────────────────────────────────────────

function computeMetrics(data: ExchangeFlowRiskInput): ComputedMetrics {
  const { netExchangeFlow, circulatingSupply, historicalBaseline, zScore } = data;
  
  // Net flow as % of supply
  const netFlowPctOfSupply = circulatingSupply > 0 
    ? Math.abs(netExchangeFlow / circulatingSupply) * 100 
    : 0;
  
  // Flow direction
  const netFlowDirection: FlowDirection = 
    netExchangeFlow > 0 ? 'inflow' : 
    netExchangeFlow < 0 ? 'outflow' : 'neutral';
  
  // Abnormality level (based on z-score if available)
  let abnormalityLevel: AbnormalityLevel = 'normal';
  if (zScore !== undefined) {
    if (Math.abs(zScore) > THRESHOLDS.EXTREME_ZSCORE) {
      abnormalityLevel = 'extreme';
    } else if (Math.abs(zScore) > THRESHOLDS.ELEVATED_ZSCORE) {
      abnormalityLevel = 'elevated';
    }
  }
  
  // Velocity change (comparison to baseline)
  let flowVelocityChange: VelocityChange = 'stable';
  if (historicalBaseline) {
    const currentMagnitude = Math.abs(netExchangeFlow);
    const baselineMagnitude = historicalBaseline.avg30d;
    if (currentMagnitude > baselineMagnitude * 1.5) {
      flowVelocityChange = 'increase';
    } else if (currentMagnitude < baselineMagnitude * 0.5) {
      flowVelocityChange = 'decrease';
    }
  }
  
  return {
    netFlowPctOfSupply,
    signals: {
      netFlowDirection,
      abnormalityLevel,
      flowVelocityChange,
    },
  };
}

function validateData(data: ExchangeFlowRiskInput | null | undefined): string[] {
  const missing: string[] = [];
  if (!data) return ['all data'];
  if (data.timestamp === undefined || data.timestamp === null) missing.push('timestamp');
  if (data.exchangeInflow === undefined || isNaN(data.exchangeInflow)) missing.push('exchangeInflow');
  if (data.exchangeOutflow === undefined || isNaN(data.exchangeOutflow)) missing.push('exchangeOutflow');
  if (data.netExchangeFlow === undefined || isNaN(data.netExchangeFlow)) missing.push('netExchangeFlow');
  if (data.circulatingSupply === undefined || data.circulatingSupply <= 0) missing.push('circulatingSupply');
  return missing;
}

function determineStatus(data: ExchangeFlowRiskInput | null | undefined, metrics: ComputedMetrics | null): ModuleStatus {
  const missingFields = validateData(data);
  if (missingFields.length > 0) return 'INSUFFICIENT DATA';
  if (!metrics) return 'INSUFFICIENT DATA';
  
  const { netFlowPctOfSupply, signals } = metrics;
  
  // FAIL conditions
  if (netFlowPctOfSupply > THRESHOLDS.WARNING_FLOW_PCT || signals.abnormalityLevel === 'extreme') {
    return 'FAIL';
  }
  
  // WARNING conditions
  if (netFlowPctOfSupply >= THRESHOLDS.NORMAL_FLOW_PCT || signals.abnormalityLevel === 'elevated') {
    return 'WARNING';
  }
  
  // PASS
  return 'PASS';
}

function generateSummary(metrics: ComputedMetrics): string {
  const { netFlowPctOfSupply, signals } = metrics;
  const directionText = signals.netFlowDirection === 'inflow' ? 'inflow (to exchanges)' :
                        signals.netFlowDirection === 'outflow' ? 'outflow (from exchanges)' : 'neutral';
  return `Net exchange flow is ${directionText} at ${netFlowPctOfSupply.toFixed(2)}% of circulating supply. Flow abnormality is ${signals.abnormalityLevel}.`;
}

// ─────────────────────────────────────────────────
// Scoped Styles (Contract §5)
// ─────────────────────────────────────────────────

const styles = {
  container: {
    padding: '12px',
    backgroundColor: '#0f0f0f',
    borderRadius: '6px',
    minHeight: '100px',
    maxHeight: '300px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    paddingBottom: '8px',
    borderBottom: '1px solid #27272a',
  },
  title: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#fafafa',
  },
  badge: (status: ModuleStatus) => ({
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 600,
    backgroundColor: 
      status === 'PASS' ? '#14532d' : 
      status === 'WARNING' ? '#713f12' : 
      status === 'FAIL' ? '#7f1d1d' : '#27272a',
    color: 
      status === 'PASS' ? '#22c55e' : 
      status === 'WARNING' ? '#eab308' : 
      status === 'FAIL' ? '#ef4444' : '#71717a',
  }),
  summary: {
    fontSize: '0.875rem',
    color: '#a1a1aa',
    marginBottom: '10px',
    lineHeight: 1.4,
  },
  signalsRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '10px',
    flexWrap: 'wrap' as const,
  },
  signal: {
    padding: '4px 8px',
    backgroundColor: '#18181b',
    borderRadius: '4px',
    fontSize: '0.75rem',
  },
  signalLabel: {
    color: '#71717a',
    marginRight: '4px',
  },
  signalValue: (type: string) => ({
    fontWeight: 600,
    color: 
      type === 'inflow' || type === 'extreme' || type === 'increase' ? '#ef4444' :
      type === 'outflow' || type === 'decrease' ? '#22c55e' :
      type === 'elevated' ? '#eab308' : '#a1a1aa',
  }),
  directionIcon: (direction: FlowDirection) => ({
    marginRight: '4px',
    color: direction === 'inflow' ? '#ef4444' : direction === 'outflow' ? '#22c55e' : '#71717a',
  }),
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px',
    marginTop: '8px',
  },
  metricCard: {
    padding: '6px',
    backgroundColor: '#18181b',
    borderRadius: '4px',
    textAlign: 'center' as const,
  },
  metricLabel: {
    fontSize: '0.625rem',
    color: '#71717a',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  metricValue: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#fafafa',
  },
  rawDataToggle: {
    marginTop: '8px',
    padding: '6px',
    backgroundColor: '#18181b',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    color: '#71717a',
    textAlign: 'center' as const,
  },
  rawDataPre: {
    marginTop: '6px',
    padding: '8px',
    backgroundColor: '#09090b',
    borderRadius: '4px',
    fontSize: '0.625rem',
    color: '#52525b',
    fontFamily: 'ui-monospace, monospace',
    overflow: 'auto',
    maxHeight: '100px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60px',
    color: '#52525b',
    textAlign: 'center' as const,
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60px',
    color: '#71717a',
  },
  errorState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60px',
    color: '#ef4444',
    fontSize: '0.875rem',
  },
  confidenceNote: {
    marginTop: '8px',
    padding: '8px 10px',
    backgroundColor: '#1c1c1e',
    borderRadius: '4px',
    borderLeft: '2px solid #52525b',
    fontSize: '0.75rem',
    color: '#a1a1aa',
    lineHeight: 1.4,
  },
  confidenceLabel: {
    fontWeight: 600,
    color: '#71717a',
    marginRight: '6px',
  },
} as const;

// ─────────────────────────────────────────────────
// Helper Components
// ─────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (Math.abs(num) >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(num) >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (Math.abs(num) >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(2);
}

function DirectionIcon({ direction }: { direction: FlowDirection }) {
  const icon = direction === 'inflow' ? '↓' : direction === 'outflow' ? '↑' : '→';
  return <span style={styles.directionIcon(direction)}>{icon}</span>;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={styles.metricValue}>{value}</div>
    </div>
  );
}

function SignalBadge({ label, value, type }: { label: string; value: string; type: string }) {
  return (
    <div style={styles.signal}>
      <span style={styles.signalLabel}>{label}:</span>
      <span style={styles.signalValue(type)}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────

export default function ExchangeFlowRiskModule({ data, isLoading, error, dataConfidence }: ExchangeFlowRiskProps) {
  // Loading state
  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingState}>Loading exchange flow data...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorState}>Error: {error}</div>
      </div>
    );
  }

  // Validate data
  const missingFields = validateData(data);
  const isDataValid = missingFields.length === 0;
  
  // Compute metrics if valid
  const metrics = isDataValid && data ? computeMetrics(data) : null;
  const status = determineStatus(data, metrics);

  // INSUFFICIENT DATA state
  if (status === 'INSUFFICIENT DATA') {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.title}>Exchange Flow Risk</span>
          <span style={styles.badge('INSUFFICIENT DATA')}>INSUFFICIENT DATA</span>
        </div>
        <div style={styles.emptyState}>
          <span style={{ fontStyle: 'italic' }}>Missing: {missingFields.join(', ')}</span>
          <span style={{ fontSize: '0.75rem', marginTop: '4px' }}>Cannot compute flow risk</span>
        </div>
      </div>
    );
  }

  // Normal render
  const summary = generateSummary(metrics!);
  const { signals } = metrics!;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>
          <DirectionIcon direction={signals.netFlowDirection} />
          Exchange Flow Risk
        </span>
        <span style={styles.badge(status)}>{status}</span>
      </div>

      {/* Neutral Summary */}
      <p style={styles.summary}>{summary}</p>

      {/* Derived Signals */}
      <div style={styles.signalsRow}>
        <SignalBadge label="Direction" value={signals.netFlowDirection} type={signals.netFlowDirection} />
        <SignalBadge label="Abnormality" value={signals.abnormalityLevel} type={signals.abnormalityLevel} />
        <SignalBadge label="Velocity" value={signals.flowVelocityChange} type={signals.flowVelocityChange} />
      </div>

      {/* Compact Metrics */}
      <div style={styles.metricsGrid}>
        <MetricCard label="Inflow" value={formatNumber(data!.exchangeInflow)} />
        <MetricCard label="Outflow" value={formatNumber(data!.exchangeOutflow)} />
        <MetricCard label="Net %" value={`${metrics!.netFlowPctOfSupply.toFixed(2)}%`} />
      </div>

      {/* Collapsible Raw Data */}
      <details>
        <summary style={styles.rawDataToggle}>[Researcher Mode] View Raw Data</summary>
        <pre style={styles.rawDataPre}>{JSON.stringify(data, null, 2)}</pre>
      </details>

      {/* Data Confidence Note (non-intrusive) */}
      {dataConfidence && dataConfidence.status !== 'SAFE' && (
        <div style={styles.confidenceNote}>
          <span style={styles.confidenceLabel}>Data Confidence:</span>
          <span>
            {dataConfidence.status === 'CAUTION' ? 'USE WITH CAUTION' : 'BLOCKED'}
            {dataConfidence.note && ` — ${dataConfidence.note}`}
          </span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────
// Mock Data Exports (Contract: Example Outputs)
// ─────────────────────────────────────────────────

export const MOCK_PASS: ExchangeFlowRiskInput = {
  timestamp: Date.now(),
  exchangeInflow: 500_000,
  exchangeOutflow: 520_000,
  netExchangeFlow: -20_000,
  circulatingSupply: 100_000_000,
  historicalBaseline: { avg30d: 25_000, avg90d: 22_000 },
  zScore: 0.3,
  largeTransferCount: 2,
};

export const MOCK_WARNING: ExchangeFlowRiskInput = {
  timestamp: Date.now(),
  exchangeInflow: 1_200_000,
  exchangeOutflow: 400_000,
  netExchangeFlow: 800_000,
  circulatingSupply: 100_000_000,
  historicalBaseline: { avg30d: 300_000, avg90d: 250_000 },
  zScore: 1.8,
  largeTransferCount: 8,
};

export const MOCK_FAIL: ExchangeFlowRiskInput = {
  timestamp: Date.now(),
  exchangeInflow: 5_000_000,
  exchangeOutflow: 500_000,
  netExchangeFlow: 4_500_000,
  circulatingSupply: 100_000_000,
  historicalBaseline: { avg30d: 500_000, avg90d: 400_000 },
  zScore: 4.2,
  largeTransferCount: 25,
};

export const MOCK_INSUFFICIENT: Partial<ExchangeFlowRiskInput> = {
  timestamp: Date.now(),
  exchangeInflow: 1_000_000,
  // Missing: exchangeOutflow, netExchangeFlow, circulatingSupply
};
