/**
 * OnChainFlowOverviewModule
 * 
 * Layer: L3 — Behavioral / Flow
 * Type: Descriptive / Time-series (NO verdict authority)
 * Purpose: Describe on-chain token flow dynamics and directional behavior
 *          across time to support analyst and research interpretation.
 * 
 * ════════════════════════════════════════════════════════════════
 * MODULE INTERFACE CONTRACT
 * ════════════════════════════════════════════════════════════════
 * 
 * INPUTS (Required):
 * - timestampSeries: number[] (unix timestamps)
 * - inflowSeries: number[]
 * - outflowSeries: number[]
 * - netFlowSeries: number[]
 * 
 * INPUTS (Optional):
 * - exchangeFlowSeries: number[]
 * - whaleFlowSeries: number[]
 * - rollingAverage: number[]
 * 
 * OUTPUTS:
 * a. Raw Time-Series: inflow, outflow, netFlow
 * b. Behavioral Descriptions: dominant direction, volatility, regime
 * c. Context Summary: 2-3 descriptive sentences
 * 
 * IMPORTANT:
 * - NO status badges (PASS/WARNING/FAIL)
 * - NO alert colors
 * - NO risk verdicts
 * - NO buy/sell or bullish/bearish wording
 * ════════════════════════════════════════════════════════════════
 */

'use client';

import { useMemo } from 'react';

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

export interface OnChainFlowInput {
  timestampSeries: number[];
  inflowSeries: number[];
  outflowSeries: number[];
  netFlowSeries: number[];
  exchangeFlowSeries?: number[];
  whaleFlowSeries?: number[];
  rollingAverage?: number[];
}

export interface OnChainFlowProps {
  data?: OnChainFlowInput | null;
  isLoading?: boolean;
  error?: string | null;
}

type FlowDirection = 'net_inflow' | 'net_outflow' | 'oscillating';
type FlowVolatility = 'low' | 'moderate' | 'high';
type FlowRegime = 'stable' | 'trending' | 'unstable';

interface BehavioralDescription {
  dominantFlowDirection: FlowDirection;
  volatilityOfFlows: FlowVolatility;
  regimeHint: FlowRegime;
}

// ─────────────────────────────────────────────────
// Business Logic
// ─────────────────────────────────────────────────

function computeBehavioralDescription(data: OnChainFlowInput): BehavioralDescription {
  const { netFlowSeries } = data;
  
  // Dominant direction
  const positiveCount = netFlowSeries.filter(v => v > 0).length;
  const negativeCount = netFlowSeries.filter(v => v < 0).length;
  const total = netFlowSeries.length;
  
  let dominantFlowDirection: FlowDirection;
  if (positiveCount > total * 0.6) {
    dominantFlowDirection = 'net_inflow';
  } else if (negativeCount > total * 0.6) {
    dominantFlowDirection = 'net_outflow';
  } else {
    dominantFlowDirection = 'oscillating';
  }
  
  // Volatility (coefficient of variation)
  const mean = netFlowSeries.reduce((a, b) => a + b, 0) / total;
  const variance = netFlowSeries.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / total;
  const stdDev = Math.sqrt(variance);
  const cv = mean !== 0 ? Math.abs(stdDev / mean) : 0;
  
  let volatilityOfFlows: FlowVolatility;
  if (cv < 0.5) {
    volatilityOfFlows = 'low';
  } else if (cv < 1.5) {
    volatilityOfFlows = 'moderate';
  } else {
    volatilityOfFlows = 'high';
  }
  
  // Regime (based on sign changes)
  let signChanges = 0;
  for (let i = 1; i < netFlowSeries.length; i++) {
    if ((netFlowSeries[i] > 0) !== (netFlowSeries[i - 1] > 0)) {
      signChanges++;
    }
  }
  const changeRatio = signChanges / (total - 1);
  
  let regimeHint: FlowRegime;
  if (changeRatio < 0.2) {
    regimeHint = 'trending';
  } else if (changeRatio < 0.5) {
    regimeHint = 'stable';
  } else {
    regimeHint = 'unstable';
  }
  
  return { dominantFlowDirection, volatilityOfFlows, regimeHint };
}

function validateData(data: OnChainFlowInput | null | undefined): string[] {
  const missing: string[] = [];
  if (!data) return ['all data'];
  if (!data.timestampSeries?.length) missing.push('timestampSeries');
  if (!data.inflowSeries?.length) missing.push('inflowSeries');
  if (!data.outflowSeries?.length) missing.push('outflowSeries');
  if (!data.netFlowSeries?.length) missing.push('netFlowSeries');
  
  // Check consistency
  if (data.timestampSeries?.length !== data.netFlowSeries?.length) {
    missing.push('inconsistent series lengths');
  }
  
  return missing;
}

function generateContextSummary(data: OnChainFlowInput, behavior: BehavioralDescription): string {
  const { dominantFlowDirection, volatilityOfFlows, regimeHint } = behavior;
  const sentences: string[] = [];
  
  // Direction description
  const directionMap: Record<FlowDirection, string> = {
    'net_inflow': 'Token flows have been predominantly directed inward over the observed period.',
    'net_outflow': 'Token flows have been predominantly directed outward over the observed period.',
    'oscillating': 'Token flows have alternated between inward and outward directions.'
  };
  sentences.push(directionMap[dominantFlowDirection]);
  
  // Volatility + Regime
  const volatilityMap: Record<FlowVolatility, string> = {
    'low': 'Flow magnitudes have remained relatively consistent',
    'moderate': 'Flow magnitudes have shown moderate variation',
    'high': 'Flow magnitudes have varied significantly'
  };
  const regimeMap: Record<FlowRegime, string> = {
    'stable': 'with a stable pattern.',
    'trending': 'following a directional trend.',
    'unstable': 'with frequent reversals.'
  };
  sentences.push(`${volatilityMap[volatilityOfFlows]} ${regimeMap[regimeHint]}`);
  
  // Data points summary
  const avgNetFlow = data.netFlowSeries.reduce((a, b) => a + b, 0) / data.netFlowSeries.length;
  const direction = avgNetFlow >= 0 ? 'inward' : 'outward';
  sentences.push(`Average net flow: ${formatFlow(Math.abs(avgNetFlow))} ${direction}.`);
  
  return sentences.join(' ');
}

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────

function formatFlow(num: number): string {
  if (Math.abs(num) >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(num) >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (Math.abs(num) >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(0);
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
    height: '120px',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: '2px',
    borderBottom: '1px solid #3f3f46',
    paddingBottom: '4px',
  },
  bar: {
    flex: 1,
    minWidth: '4px',
    maxWidth: '12px',
    borderRadius: '2px 2px 0 0',
    transition: 'height 0.2s',
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
} as const;

// ─────────────────────────────────────────────────
// Chart Component (Simple bar chart)
// ─────────────────────────────────────────────────

function FlowChart({ data }: { data: OnChainFlowInput }) {
  const { netFlowSeries, timestampSeries, inflowSeries, outflowSeries } = data;
  
  // Normalize values for display
  const maxAbs = Math.max(...netFlowSeries.map(Math.abs), 1);
  const maxHeight = 60; // pixels (half of chart height for each direction)
  
  return (
    <div style={styles.chartContainer}>
      <div style={styles.chartArea}>
        {netFlowSeries.slice(0, 30).map((value, idx) => {
          const height = Math.abs(value) / maxAbs * maxHeight;
          const isPositive = value >= 0;
          return (
            <div
              key={idx}
              style={{
                ...styles.bar,
                height: `${Math.max(height, 2)}px`,
                backgroundColor: isPositive ? '#6366f1' : '#8b5cf6',
                alignSelf: isPositive ? 'flex-end' : 'flex-start',
                opacity: 0.7 + (idx / netFlowSeries.length) * 0.3,
              }}
              title={`${formatDate(timestampSeries[idx])}: ${formatFlow(value)}`}
            />
          );
        })}
      </div>
      <div style={styles.chartLegend}>
        <div style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: '#6366f1' }} />
          Inflow
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: '#8b5cf6' }} />
          Outflow
        </div>
      </div>
      <div style={styles.timeRange}>
        <span>{formatDate(timestampSeries[0])}</span>
        <span>{formatDate(timestampSeries[timestampSeries.length - 1])}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────

export default function OnChainFlowOverviewModule({ data, isLoading, error }: OnChainFlowProps) {
  const behavior = useMemo(() => {
    if (!data) return null;
    return computeBehavioralDescription(data);
  }, [data]);

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.unavailable}>Loading flow data...</div>
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
          <span style={styles.title}>On-Chain Flow Overview</span>
          <span style={styles.layerTag}>L3 Behavioral</span>
        </div>
        <div style={styles.unavailable}>
          <span style={{ fontWeight: 600, marginBottom: '4px' }}>FLOW DATA UNAVAILABLE</span>
          <span style={{ fontSize: '0.75rem' }}>Missing: {missingFields.join(', ')}</span>
        </div>
      </div>
    );
  }

  const summary = generateContextSummary(data!, behavior!);

  const directionDisplay: Record<FlowDirection, string> = {
    'net_inflow': 'Net Inflow',
    'net_outflow': 'Net Outflow',
    'oscillating': 'Oscillating',
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>On-Chain Flow Overview</span>
        <span style={styles.layerTag}>L3 Behavioral</span>
      </div>

      {/* Context Summary */}
      <p style={styles.summary}>{summary}</p>

      {/* Behavioral Descriptions */}
      <div style={styles.sectionLabel}>Behavioral Indicators</div>
      <div style={styles.behaviorGrid}>
        <div style={styles.behaviorCard}>
          <div style={styles.behaviorLabel}>Dominant Direction</div>
          <div style={styles.behaviorValue}>{directionDisplay[behavior!.dominantFlowDirection]}</div>
        </div>
        <div style={styles.behaviorCard}>
          <div style={styles.behaviorLabel}>Flow Volatility</div>
          <div style={styles.behaviorValue}>{behavior!.volatilityOfFlows}</div>
        </div>
        <div style={styles.behaviorCard}>
          <div style={styles.behaviorLabel}>Regime</div>
          <div style={styles.behaviorValue}>{behavior!.regimeHint}</div>
        </div>
      </div>

      {/* Time-Series Visualization */}
      <div style={styles.sectionLabel}>Flow Time-Series</div>
      <FlowChart data={data!} />

      {/* Raw Data for Researchers */}
      <details>
        <summary style={styles.rawDataToggle}>[Researcher Mode] View Raw JSON</summary>
        <pre style={styles.rawDataPre}>
          {JSON.stringify({
            dataPoints: data!.netFlowSeries.length,
            behavior,
            sample: {
              first5: data!.netFlowSeries.slice(0, 5),
              last5: data!.netFlowSeries.slice(-5),
            }
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

/** Net Inflow Dominant Period */
export const MOCK_INFLOW_DOMINANT: OnChainFlowInput = {
  timestampSeries: generateTimestamps(14),
  inflowSeries: [120, 150, 180, 200, 160, 190, 210, 180, 220, 250, 240, 230, 260, 280],
  outflowSeries: [80, 90, 70, 100, 85, 95, 110, 90, 120, 130, 125, 115, 140, 150],
  netFlowSeries: [40, 60, 110, 100, 75, 95, 100, 90, 100, 120, 115, 115, 120, 130],
};

/** Net Outflow Dominant Period */
export const MOCK_OUTFLOW_DOMINANT: OnChainFlowInput = {
  timestampSeries: generateTimestamps(14),
  inflowSeries: [80, 70, 60, 75, 65, 70, 55, 60, 50, 45, 55, 50, 40, 35],
  outflowSeries: [150, 160, 140, 155, 145, 160, 170, 165, 180, 175, 185, 190, 200, 210],
  netFlowSeries: [-70, -90, -80, -80, -80, -90, -115, -105, -130, -130, -130, -140, -160, -175],
};

/** Choppy / Oscillating Behavior */
export const MOCK_OSCILLATING: OnChainFlowInput = {
  timestampSeries: generateTimestamps(14),
  inflowSeries: [100, 80, 120, 90, 130, 70, 140, 85, 110, 95, 125, 80, 115, 100],
  outflowSeries: [90, 110, 85, 120, 95, 130, 80, 135, 100, 125, 90, 130, 95, 115],
  netFlowSeries: [10, -30, 35, -30, 35, -60, 60, -50, 10, -30, 35, -50, 20, -15],
};

/** Stable Trending Period */
export const MOCK_STABLE_TRENDING: OnChainFlowInput = {
  timestampSeries: generateTimestamps(14),
  inflowSeries: [100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165],
  outflowSeries: [80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100, 102, 104, 106],
  netFlowSeries: [20, 23, 26, 29, 32, 35, 38, 41, 44, 47, 50, 53, 56, 59],
};
