/**
 * ExchangeVsNonExchangeFlowModule
 * 
 * Layer: L3 — Behavioral / Flow
 * Type: Flow decomposition / Behavioral context (NO verdict authority)
 * Purpose: Decompose on-chain flows into exchange and non-exchange
 *          destinations to reveal behavioral intent patterns.
 * 
 * ════════════════════════════════════════════════════════════════
 * MODULE INTERFACE CONTRACT
 * ════════════════════════════════════════════════════════════════
 * 
 * INPUTS (Required):
 * - timestampSeries: number[] (unix timestamps)
 * - exchangeInflowSeries: number[]
 * - exchangeOutflowSeries: number[]
 * - nonExchangeFlowSeries: number[]
 * 
 * INPUTS (Optional):
 * - bridgeFlowSeries: number[]
 * - stakingFlowSeries: number[]
 * - labeledEntityFlowSeries: number[]
 * 
 * OUTPUTS:
 * a. Raw Time-Series: exchangeNetFlow, nonExchangeNetFlow
 * b. Behavioral Decomposition: dominant destination, shift trend, intensity
 * c. Context Summary: 2-3 descriptive sentences
 * 
 * IMPORTANT:
 * - NO status badges (PASS/WARNING/FAIL)
 * - NO alert colors
 * - NO risk verdicts
 * - NO bullish/bearish language
 * ════════════════════════════════════════════════════════════════
 */

'use client';

import { useMemo } from 'react';

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

export interface ExchangeFlowInput {
  timestampSeries: number[];
  exchangeInflowSeries: number[];
  exchangeOutflowSeries: number[];
  nonExchangeFlowSeries: number[];
  bridgeFlowSeries?: number[];
  stakingFlowSeries?: number[];
  labeledEntityFlowSeries?: number[];
}

export interface ExchangeFlowProps {
  data?: ExchangeFlowInput | null;
  isLoading?: boolean;
  error?: string | null;
}

type DominantDestination = 'exchange' | 'non_exchange' | 'mixed';
type DestinationShiftTrend = 'stable' | 'shifting' | 'rotating';
type FlowIntensity = 'exchange_dominant' | 'balanced' | 'nonexchange_dominant';

interface BehavioralDecomposition {
  dominantDestination: DominantDestination;
  destinationShiftTrend: DestinationShiftTrend;
  relativeFlowIntensity: FlowIntensity;
  exchangeNetFlowTotal: number;
  nonExchangeNetFlowTotal: number;
}

// ─────────────────────────────────────────────────
// Business Logic
// ─────────────────────────────────────────────────

function computeDecomposition(data: ExchangeFlowInput): BehavioralDecomposition {
  const { exchangeInflowSeries, exchangeOutflowSeries, nonExchangeFlowSeries } = data;
  
  // Compute net flows
  const exchangeNetFlow = exchangeInflowSeries.map((inflow, i) => 
    inflow - (exchangeOutflowSeries[i] || 0)
  );
  const exchangeNetFlowTotal = exchangeNetFlow.reduce((a, b) => a + b, 0);
  const nonExchangeNetFlowTotal = nonExchangeFlowSeries.reduce((a, b) => a + b, 0);
  
  const totalAbsFlow = Math.abs(exchangeNetFlowTotal) + Math.abs(nonExchangeNetFlowTotal);
  
  // Dominant destination
  let dominantDestination: DominantDestination;
  const exchangeRatio = totalAbsFlow > 0 
    ? Math.abs(exchangeNetFlowTotal) / totalAbsFlow 
    : 0.5;
  
  if (exchangeRatio > 0.6) {
    dominantDestination = 'exchange';
  } else if (exchangeRatio < 0.4) {
    dominantDestination = 'non_exchange';
  } else {
    dominantDestination = 'mixed';
  }
  
  // Destination shift trend (check which destination leads over time)
  let shiftCount = 0;
  let prevLeader: 'exchange' | 'non_exchange' | null = null;
  
  for (let i = 0; i < exchangeNetFlow.length; i++) {
    const exchangeAbs = Math.abs(exchangeNetFlow[i]);
    const nonExchangeAbs = Math.abs(nonExchangeFlowSeries[i]);
    const currentLeader = exchangeAbs > nonExchangeAbs ? 'exchange' : 'non_exchange';
    
    if (prevLeader && currentLeader !== prevLeader) {
      shiftCount++;
    }
    prevLeader = currentLeader;
  }
  
  const shiftRatio = shiftCount / (exchangeNetFlow.length - 1);
  
  let destinationShiftTrend: DestinationShiftTrend;
  if (shiftRatio < 0.2) {
    destinationShiftTrend = 'stable';
  } else if (shiftRatio < 0.5) {
    destinationShiftTrend = 'shifting';
  } else {
    destinationShiftTrend = 'rotating';
  }
  
  // Relative flow intensity
  let relativeFlowIntensity: FlowIntensity;
  if (exchangeRatio > 0.65) {
    relativeFlowIntensity = 'exchange_dominant';
  } else if (exchangeRatio < 0.35) {
    relativeFlowIntensity = 'nonexchange_dominant';
  } else {
    relativeFlowIntensity = 'balanced';
  }
  
  return {
    dominantDestination,
    destinationShiftTrend,
    relativeFlowIntensity,
    exchangeNetFlowTotal,
    nonExchangeNetFlowTotal,
  };
}

function validateData(data: ExchangeFlowInput | null | undefined): string[] {
  const missing: string[] = [];
  if (!data) return ['all data'];
  if (!data.timestampSeries?.length) missing.push('timestampSeries');
  if (!data.exchangeInflowSeries?.length) missing.push('exchangeInflowSeries');
  if (!data.exchangeOutflowSeries?.length) missing.push('exchangeOutflowSeries');
  if (!data.nonExchangeFlowSeries?.length) missing.push('nonExchangeFlowSeries');
  
  return missing;
}

function generateContextSummary(data: ExchangeFlowInput, decomposition: BehavioralDecomposition): string {
  const { dominantDestination, destinationShiftTrend, relativeFlowIntensity } = decomposition;
  const sentences: string[] = [];
  
  // Dominant destination
  const destMap: Record<DominantDestination, string> = {
    'exchange': 'Exchange addresses have received the majority of token flows.',
    'non_exchange': 'Non-exchange addresses have received the majority of token flows.',
    'mixed': 'Token flows have been distributed between exchange and non-exchange destinations.',
  };
  sentences.push(destMap[dominantDestination]);
  
  // Shift trend
  const trendMap: Record<DestinationShiftTrend, string> = {
    'stable': 'The destination pattern has remained consistent over the period.',
    'shifting': 'There has been some shifting between destination types.',
    'rotating': 'Token flows have rotated frequently between destinations.',
  };
  sentences.push(trendMap[destinationShiftTrend]);
  
  // Intensity context
  const intensityMap: Record<FlowIntensity, string> = {
    'exchange_dominant': 'Exchange flow intensity is notably higher than non-exchange.',
    'nonexchange_dominant': 'Non-exchange flow intensity is notably higher than exchange.',
    'balanced': 'Flow intensity is relatively balanced between both destination types.',
  };
  sentences.push(intensityMap[relativeFlowIntensity]);
  
  return sentences.join(' ');
}

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────

function formatFlow(num: number): string {
  const sign = num >= 0 ? '+' : '';
  const absNum = Math.abs(num);
  if (absNum >= 1_000_000_000) return `${sign}${(num / 1_000_000_000).toFixed(2)}B`;
  if (absNum >= 1_000_000) return `${sign}${(num / 1_000_000).toFixed(2)}M`;
  if (absNum >= 1_000) return `${sign}${(num / 1_000).toFixed(2)}K`;
  return `${sign}${num.toFixed(0)}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─────────────────────────────────────────────────
// Scoped Styles (NO alert colors)
// ─────────────────────────────────────────────────

const styles = {
  container: {
    padding: '12px',
    backgroundColor: '#0f0f0f',
    borderRadius: '6px',
    minHeight: '100px',
    marginTop: '12px',
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
    color: '#fafafa' 
  },
  layerTag: {
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '0.625rem',
    fontWeight: 600,
    backgroundColor: '#3b2f5a',
    color: '#a78bfa',
    textTransform: 'uppercase' as const,
  },
  summary: { 
    fontSize: '0.875rem', 
    color: '#a1a1aa', 
    marginBottom: '12px', 
    lineHeight: 1.5 
  },
  sectionLabel: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: '#71717a',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '6px',
    marginTop: '12px',
  },
  behaviorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  behaviorCard: {
    padding: '8px',
    backgroundColor: '#18181b',
    borderRadius: '4px',
    textAlign: 'center' as const,
  },
  behaviorLabel: {
    fontSize: '0.625rem',
    color: '#71717a',
    textTransform: 'uppercase' as const,
    marginBottom: '2px',
  },
  behaviorValue: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#e4e4e7',
    textTransform: 'capitalize' as const,
  },
  chartContainer: {
    marginTop: '12px',
    padding: '8px',
    backgroundColor: '#18181b',
    borderRadius: '4px',
  },
  chartArea: {
    height: '100px',
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  barGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '2px',
  },
  barStack: {
    width: '100%',
    display: 'flex',
    gap: '1px',
    height: '60px',
    alignItems: 'flex-end',
  },
  bar: {
    flex: 1,
    borderRadius: '2px 2px 0 0',
  },
  chartLegend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '8px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.6875rem',
    color: '#71717a',
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  timeRange: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.625rem',
    color: '#52525b',
    marginTop: '4px',
  },
  totalsRow: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: '12px',
    padding: '8px',
    backgroundColor: '#18181b',
    borderRadius: '4px',
  },
  totalItem: {
    textAlign: 'center' as const,
  },
  totalLabel: {
    fontSize: '0.625rem',
    color: '#71717a',
    textTransform: 'uppercase' as const,
  },
  totalValue: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#e4e4e7',
  },
  rawDataToggle: { 
    marginTop: '12px', 
    padding: '6px', 
    backgroundColor: '#18181b', 
    borderRadius: '4px', 
    cursor: 'pointer', 
    fontSize: '0.75rem', 
    color: '#71717a', 
    textAlign: 'center' as const 
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
    maxHeight: '120px' 
  },
  unavailable: { 
    display: 'flex', 
    flexDirection: 'column' as const, 
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: '80px', 
    color: '#52525b', 
    textAlign: 'center' as const 
  },
  dataConfidence: {
    marginTop: '12px',
    padding: '8px 10px',
    backgroundColor: '#1c1c1e',
    borderRadius: '4px',
    borderLeft: '2px solid #52525b',
  },
  dataConfidenceHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '4px',
  },
  dataConfidenceLabel: {
    fontSize: '0.625rem',
    fontWeight: 600,
    color: '#71717a',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  dataConfidenceStatus: {
    fontSize: '0.625rem',
    fontWeight: 500,
    color: '#a1a1aa',
  },
  dataConfidenceText: {
    fontSize: '0.75rem',
    color: '#71717a',
    lineHeight: 1.4,
  },
} as const;

// ─────────────────────────────────────────────────
// Chart Component
// ─────────────────────────────────────────────────

function FlowComparisonChart({ data }: { data: ExchangeFlowInput }) {
  const { timestampSeries, exchangeInflowSeries, exchangeOutflowSeries, nonExchangeFlowSeries } = data;
  
  // Compute exchange net flow
  const exchangeNetFlow = exchangeInflowSeries.map((inflow, i) => 
    inflow - (exchangeOutflowSeries[i] || 0)
  );
  
  // Get max for normalization
  const allValues = [...exchangeNetFlow.map(Math.abs), ...nonExchangeFlowSeries.map(Math.abs)];
  const maxVal = Math.max(...allValues, 1);
  const maxHeight = 60;
  
  const displayCount = Math.min(timestampSeries.length, 20);
  
  return (
    <div style={styles.chartContainer}>
      <div style={styles.chartArea}>
        {timestampSeries.slice(0, displayCount).map((ts, idx) => {
          const exchHeight = (Math.abs(exchangeNetFlow[idx]) / maxVal) * maxHeight;
          const nonExchHeight = (Math.abs(nonExchangeFlowSeries[idx]) / maxVal) * maxHeight;
          
          return (
            <div key={idx} style={styles.barGroup}>
              <div style={styles.barStack}>
                <div
                  style={{
                    ...styles.bar,
                    height: `${Math.max(exchHeight, 2)}px`,
                    backgroundColor: '#818cf8',
                  }}
                  title={`Exchange: ${formatFlow(exchangeNetFlow[idx])}`}
                />
                <div
                  style={{
                    ...styles.bar,
                    height: `${Math.max(nonExchHeight, 2)}px`,
                    backgroundColor: '#c084fc',
                  }}
                  title={`Non-Exchange: ${formatFlow(nonExchangeFlowSeries[idx])}`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div style={styles.chartLegend}>
        <div style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: '#818cf8' }} />
          Exchange
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: '#c084fc' }} />
          Non-Exchange
        </div>
      </div>
      <div style={styles.timeRange}>
        <span>{formatDate(timestampSeries[0])}</span>
        <span>{formatDate(timestampSeries[displayCount - 1])}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────

export default function ExchangeVsNonExchangeFlowModule({ data, isLoading, error }: ExchangeFlowProps) {
  const decomposition = useMemo(() => {
    if (!data) return null;
    return computeDecomposition(data);
  }, [data]);

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.unavailable}>Loading flow split data...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.unavailable, color: '#ef4444' }}>Error: {error}</div>
      </div>
    );
  }

  const missingFields = validateData(data);
  
  if (missingFields.length > 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.title}>Exchange vs Non-Exchange Flow</span>
          <span style={styles.layerTag}>L3 Behavioral</span>
        </div>
        <div style={styles.unavailable}>
          <span style={{ fontWeight: 600, marginBottom: '4px' }}>FLOW SPLIT DATA UNAVAILABLE</span>
          <span style={{ fontSize: '0.75rem' }}>Missing: {missingFields.join(', ')}</span>
        </div>
      </div>
    );
  }

  const summary = generateContextSummary(data!, decomposition!);

  const destDisplay: Record<DominantDestination, string> = {
    'exchange': 'Exchange',
    'non_exchange': 'Non-Exchange',
    'mixed': 'Mixed',
  };
  
  const trendDisplay: Record<DestinationShiftTrend, string> = {
    'stable': 'Stable',
    'shifting': 'Shifting',
    'rotating': 'Rotating',
  };
  
  const intensityDisplay: Record<FlowIntensity, string> = {
    'exchange_dominant': 'Exchange Heavy',
    'nonexchange_dominant': 'Non-Exch Heavy',
    'balanced': 'Balanced',
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>Exchange vs Non-Exchange Flow</span>
        <span style={styles.layerTag}>L3 Behavioral</span>
      </div>

      {/* Context Summary */}
      <p style={styles.summary}>{summary}</p>

      {/* Behavioral Decomposition */}
      <div style={styles.sectionLabel}>Behavioral Decomposition</div>
      <div style={styles.behaviorGrid}>
        <div style={styles.behaviorCard}>
          <div style={styles.behaviorLabel}>Dominant Dest</div>
          <div style={styles.behaviorValue}>{destDisplay[decomposition!.dominantDestination]}</div>
        </div>
        <div style={styles.behaviorCard}>
          <div style={styles.behaviorLabel}>Shift Trend</div>
          <div style={styles.behaviorValue}>{trendDisplay[decomposition!.destinationShiftTrend]}</div>
        </div>
        <div style={styles.behaviorCard}>
          <div style={styles.behaviorLabel}>Flow Intensity</div>
          <div style={styles.behaviorValue}>{intensityDisplay[decomposition!.relativeFlowIntensity]}</div>
        </div>
      </div>

      {/* Flow Totals */}
      <div style={styles.totalsRow}>
        <div style={styles.totalItem}>
          <div style={styles.totalLabel}>Exchange Net</div>
          <div style={styles.totalValue}>{formatFlow(decomposition!.exchangeNetFlowTotal)}</div>
        </div>
        <div style={styles.totalItem}>
          <div style={styles.totalLabel}>Non-Exchange Net</div>
          <div style={styles.totalValue}>{formatFlow(decomposition!.nonExchangeNetFlowTotal)}</div>
        </div>
      </div>

      {/* Time-Series Comparison */}
      <div style={styles.sectionLabel}>Flow Comparison</div>
      <FlowComparisonChart data={data!} />

      {/* Data Confidence Note */}
      {decomposition!.destinationShiftTrend === 'rotating' && (
        <div style={styles.dataConfidence}>
          <div style={styles.dataConfidenceHeader}>
            <span style={styles.dataConfidenceLabel}>Data Confidence</span>
            <span style={styles.dataConfidenceStatus}>· Use With Caution</span>
          </div>
          <div style={styles.dataConfidenceText}>
            Frequent shifts observed between exchange and non-exchange dominance. 
            This reflects rotating behavioral regimes and should be interpreted contextually.
          </div>
        </div>
      )}

      {/* Raw Data for Researchers */}
      <details>
        <summary style={styles.rawDataToggle}>[Researcher Mode] View Raw JSON</summary>
        <pre style={styles.rawDataPre}>
          {JSON.stringify({
            dataPoints: data!.timestampSeries.length,
            decomposition,
          }, null, 2)}
        </pre>
      </details>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Mock Data Exports
// ─────────────────────────────────────────────────

const generateTimestamps = (days: number, startDate = new Date('2024-01-01')): number[] => {
  return Array.from({ length: days }, (_, i) => 
    startDate.getTime() + i * 24 * 60 * 60 * 1000
  );
};

/** Exchange-Dominant Phase */
export const MOCK_EXCHANGE_DOMINANT: ExchangeFlowInput = {
  timestampSeries: generateTimestamps(14),
  exchangeInflowSeries: [200, 250, 220, 280, 260, 300, 290, 320, 310, 350, 340, 380, 370, 400],
  exchangeOutflowSeries: [80, 90, 85, 100, 95, 110, 105, 115, 110, 125, 120, 135, 130, 145],
  nonExchangeFlowSeries: [30, 35, 25, 40, 30, 45, 35, 50, 40, 55, 45, 60, 50, 65],
};

/** Non-Exchange-Dominant Phase */
export const MOCK_NONEXCHANGE_DOMINANT: ExchangeFlowInput = {
  timestampSeries: generateTimestamps(14),
  exchangeInflowSeries: [50, 45, 55, 40, 60, 35, 50, 40, 55, 35, 50, 40, 45, 35],
  exchangeOutflowSeries: [80, 85, 75, 90, 70, 95, 80, 90, 75, 95, 80, 90, 85, 95],
  nonExchangeFlowSeries: [150, 180, 160, 200, 170, 220, 190, 240, 200, 260, 220, 280, 240, 300],
};

/** Mixed / Rotating Behavior */
export const MOCK_ROTATING: ExchangeFlowInput = {
  timestampSeries: generateTimestamps(14),
  exchangeInflowSeries: [150, 80, 180, 60, 200, 70, 160, 90, 170, 80, 190, 65, 175, 85],
  exchangeOutflowSeries: [50, 60, 40, 80, 30, 90, 50, 70, 40, 85, 35, 95, 45, 80],
  nonExchangeFlowSeries: [60, 180, 50, 200, 40, 190, 70, 160, 55, 185, 45, 210, 60, 175],
};

/** Balanced Distribution */
export const MOCK_BALANCED: ExchangeFlowInput = {
  timestampSeries: generateTimestamps(14),
  exchangeInflowSeries: [120, 125, 130, 128, 132, 127, 135, 130, 138, 133, 140, 136, 143, 139],
  exchangeOutflowSeries: [60, 62, 65, 63, 66, 64, 68, 65, 70, 67, 72, 69, 74, 71],
  nonExchangeFlowSeries: [55, 58, 60, 62, 64, 60, 66, 63, 68, 65, 70, 67, 72, 69],
};
