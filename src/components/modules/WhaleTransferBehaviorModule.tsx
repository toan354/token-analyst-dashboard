/**
 * WhaleTransferBehaviorModule
 * 
 * Layer: L3 — Behavioral / Flow
 * Type: Large actor behavior analysis (NO verdict authority)
 * Purpose: Describe the frequency, size, and destination patterns
 *          of large on-chain transfers to reveal whale-level behavior.
 * 
 * ════════════════════════════════════════════════════════════════
 * MODULE INTERFACE CONTRACT
 * ════════════════════════════════════════════════════════════════
 * 
 * INPUTS (Required):
 * - timestampSeries: number[] (unix timestamps)
 * - largeTransferCountSeries: number[]
 * - largeTransferVolumeSeries: number[]
 * - largeTransferThreshold: number (definition of "large")
 * 
 * INPUTS (Optional):
 * - whaleExchangeFlowSeries: number[]
 * - whaleNonExchangeFlowSeries: number[]
 * - topEntityTransferSeries: number[]
 * 
 * OUTPUTS:
 * a. Raw Behavioral Metrics: count/volume series, avg size, concentration
 * b. Behavioral Patterns: activity level, destination bias, regime
 * c. Context Summary: 2-3 descriptive sentences
 * 
 * IMPORTANT:
 * - NO status badges (PASS/WARNING/FAIL)
 * - NO alert colors
 * - NO risk verdicts
 * - NO buy/sell or bullish/bearish language
 * ════════════════════════════════════════════════════════════════
 */

'use client';

import { useMemo } from 'react';

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

export interface WhaleTransferInput {
  timestampSeries: number[];
  largeTransferCountSeries: number[];
  largeTransferVolumeSeries: number[];
  largeTransferThreshold: number;
  whaleExchangeFlowSeries?: number[];
  whaleNonExchangeFlowSeries?: number[];
  topEntityTransferSeries?: number[];
}

export interface WhaleTransferProps {
  data?: WhaleTransferInput | null;
  isLoading?: boolean;
  error?: string | null;
}

type ActivityLevel = 'low' | 'moderate' | 'high';
type DestinationBias = 'exchange' | 'non_exchange' | 'mixed';
type ActivityRegime = 'quiet' | 'active' | 'bursty';

interface BehavioralPatterns {
  whaleActivityLevel: ActivityLevel;
  transferDestinationBias: DestinationBias;
  activityRegime: ActivityRegime;
  averageTransferSize: number;
  concentrationRatio: number;
  totalVolume: number;
  totalCount: number;
}

// ─────────────────────────────────────────────────
// Business Logic
// ─────────────────────────────────────────────────

function computePatterns(data: WhaleTransferInput): BehavioralPatterns {
  const { 
    largeTransferCountSeries, 
    largeTransferVolumeSeries,
    whaleExchangeFlowSeries,
    whaleNonExchangeFlowSeries,
  } = data;
  
  const totalCount = largeTransferCountSeries.reduce((a, b) => a + b, 0);
  const totalVolume = largeTransferVolumeSeries.reduce((a, b) => a + b, 0);
  const averageTransferSize = totalCount > 0 ? totalVolume / totalCount : 0;
  
  // Activity level based on average daily count
  const avgDailyCount = totalCount / largeTransferCountSeries.length;
  let whaleActivityLevel: ActivityLevel;
  if (avgDailyCount < 5) {
    whaleActivityLevel = 'low';
  } else if (avgDailyCount < 15) {
    whaleActivityLevel = 'moderate';
  } else {
    whaleActivityLevel = 'high';
  }
  
  // Destination bias
  let transferDestinationBias: DestinationBias = 'mixed';
  if (whaleExchangeFlowSeries && whaleNonExchangeFlowSeries) {
    const exchTotal = whaleExchangeFlowSeries.reduce((a, b) => a + Math.abs(b), 0);
    const nonExchTotal = whaleNonExchangeFlowSeries.reduce((a, b) => a + Math.abs(b), 0);
    const total = exchTotal + nonExchTotal;
    
    if (total > 0) {
      const exchRatio = exchTotal / total;
      if (exchRatio > 0.6) {
        transferDestinationBias = 'exchange';
      } else if (exchRatio < 0.4) {
        transferDestinationBias = 'non_exchange';
      }
    }
  }
  
  // Activity regime (based on variance in daily counts)
  const countMean = avgDailyCount;
  const countVariance = largeTransferCountSeries.reduce((sum, c) => 
    sum + Math.pow(c - countMean, 2), 0
  ) / largeTransferCountSeries.length;
  const cv = countMean > 0 ? Math.sqrt(countVariance) / countMean : 0;
  
  let activityRegime: ActivityRegime;
  if (cv < 0.3) {
    activityRegime = 'quiet';
  } else if (cv < 0.8) {
    activityRegime = 'active';
  } else {
    activityRegime = 'bursty';
  }
  
  // Concentration ratio (top 3 days vs total)
  const sortedVolumes = [...largeTransferVolumeSeries].sort((a, b) => b - a);
  const top3Volume = sortedVolumes.slice(0, 3).reduce((a, b) => a + b, 0);
  const concentrationRatio = totalVolume > 0 ? (top3Volume / totalVolume) * 100 : 0;
  
  return {
    whaleActivityLevel,
    transferDestinationBias,
    activityRegime,
    averageTransferSize,
    concentrationRatio,
    totalVolume,
    totalCount,
  };
}

function validateData(data: WhaleTransferInput | null | undefined): string[] {
  const missing: string[] = [];
  if (!data) return ['all data'];
  if (!data.timestampSeries?.length) missing.push('timestampSeries');
  if (!data.largeTransferCountSeries?.length) missing.push('largeTransferCountSeries');
  if (!data.largeTransferVolumeSeries?.length) missing.push('largeTransferVolumeSeries');
  if (!data.largeTransferThreshold) missing.push('largeTransferThreshold');
  
  return missing;
}

function generateContextSummary(data: WhaleTransferInput, patterns: BehavioralPatterns): string {
  const { whaleActivityLevel, transferDestinationBias, activityRegime } = patterns;
  const sentences: string[] = [];
  
  // Activity description
  const activityMap: Record<ActivityLevel, string> = {
    'low': 'Large transfer activity has been relatively quiet over the observed period.',
    'moderate': 'Large transfers have occurred at a moderate frequency.',
    'high': 'There has been elevated large transfer activity throughout the period.',
  };
  sentences.push(activityMap[whaleActivityLevel]);
  
  // Regime description
  const regimeMap: Record<ActivityRegime, string> = {
    'quiet': 'Transfer frequency has remained steady with minimal variation.',
    'active': 'Activity levels have shown consistent engagement.',
    'bursty': 'Transfers have been concentrated in distinct bursts rather than distributed evenly.',
  };
  sentences.push(regimeMap[activityRegime]);
  
  // Destination context
  if (transferDestinationBias !== 'mixed') {
    const destMap: Record<DestinationBias, string> = {
      'exchange': 'Large transfers have been directed primarily toward exchange addresses.',
      'non_exchange': 'Large transfers have been directed primarily toward non-exchange addresses.',
      'mixed': '',
    };
    sentences.push(destMap[transferDestinationBias]);
  }
  
  return sentences.join(' ');
}

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────

function formatVolume(num: number): string {
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
  thresholdBadge: {
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '0.625rem',
    backgroundColor: '#27272a',
    color: '#a1a1aa',
    marginLeft: '8px',
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
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  },
  metricCard: {
    padding: '8px',
    backgroundColor: '#18181b',
    borderRadius: '4px',
    textAlign: 'center' as const,
  },
  metricLabel: {
    fontSize: '0.625rem',
    color: '#71717a',
    textTransform: 'uppercase' as const,
    marginBottom: '2px',
  },
  metricValue: {
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: '#e4e4e7',
  },
  behaviorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginTop: '8px',
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
  dualChart: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  chartSection: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  chartLabel: {
    fontSize: '0.6875rem',
    color: '#71717a',
    textTransform: 'uppercase' as const,
    marginBottom: '4px',
    textAlign: 'center' as const,
  },
  chartArea: {
    height: '60px',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: '2px',
  },
  bar: {
    flex: 1,
    minWidth: '3px',
    maxWidth: '10px',
    borderRadius: '2px 2px 0 0',
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
// Chart Component
// ─────────────────────────────────────────────────

function DualChart({ data }: { data: WhaleTransferInput }) {
  const { timestampSeries, largeTransferCountSeries, largeTransferVolumeSeries } = data;
  
  const maxCount = Math.max(...largeTransferCountSeries, 1);
  const maxVolume = Math.max(...largeTransferVolumeSeries, 1);
  const maxHeight = 60;
  const displayCount = Math.min(timestampSeries.length, 20);
  
  return (
    <div style={styles.chartContainer}>
      <div style={styles.dualChart}>
        {/* Count Chart */}
        <div style={styles.chartSection}>
          <div style={styles.chartLabel}>Transfer Count</div>
          <div style={styles.chartArea}>
            {largeTransferCountSeries.slice(0, displayCount).map((count, idx) => {
              const height = (count / maxCount) * maxHeight;
              return (
                <div
                  key={idx}
                  style={{
                    ...styles.bar,
                    height: `${Math.max(height, 2)}px`,
                    backgroundColor: '#818cf8',
                  }}
                  title={`${formatDate(timestampSeries[idx])}: ${count} transfers`}
                />
              );
            })}
          </div>
        </div>
        
        {/* Volume Chart */}
        <div style={styles.chartSection}>
          <div style={styles.chartLabel}>Transfer Volume</div>
          <div style={styles.chartArea}>
            {largeTransferVolumeSeries.slice(0, displayCount).map((volume, idx) => {
              const height = (volume / maxVolume) * maxHeight;
              return (
                <div
                  key={idx}
                  style={{
                    ...styles.bar,
                    height: `${Math.max(height, 2)}px`,
                    backgroundColor: '#c084fc',
                  }}
                  title={`${formatDate(timestampSeries[idx])}: ${formatVolume(volume)}`}
                />
              );
            })}
          </div>
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

export default function WhaleTransferBehaviorModule({ data, isLoading, error }: WhaleTransferProps) {
  const patterns = useMemo(() => {
    if (!data) return null;
    return computePatterns(data);
  }, [data]);

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.unavailable}>Loading whale transfer data...</div>
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
          <span style={styles.title}>Large / Whale Transfer Behavior</span>
          <span style={styles.layerTag}>L3 Behavioral</span>
        </div>
        <div style={styles.unavailable}>
          <span style={{ fontWeight: 600, marginBottom: '4px' }}>WHALE TRANSFER DATA UNAVAILABLE</span>
          <span style={{ fontSize: '0.75rem' }}>Missing: {missingFields.join(', ')}</span>
        </div>
      </div>
    );
  }

  const summary = generateContextSummary(data!, patterns!);

  const activityDisplay: Record<ActivityLevel, string> = {
    'low': 'Low',
    'moderate': 'Moderate',
    'high': 'High',
  };
  
  const biasDisplay: Record<DestinationBias, string> = {
    'exchange': 'Exchange',
    'non_exchange': 'Non-Exchange',
    'mixed': 'Mixed',
  };
  
  const regimeDisplay: Record<ActivityRegime, string> = {
    'quiet': 'Quiet',
    'active': 'Active',
    'bursty': 'Bursty',
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <span style={styles.title}>Large / Whale Transfer Behavior</span>
          <span style={styles.thresholdBadge}>≥{formatVolume(data!.largeTransferThreshold)}</span>
        </div>
        <span style={styles.layerTag}>L3 Behavioral</span>
      </div>

      {/* Context Summary */}
      <p style={styles.summary}>{summary}</p>

      {/* Raw Behavioral Metrics */}
      <div style={styles.sectionLabel}>Behavioral Metrics</div>
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Total Count</div>
          <div style={styles.metricValue}>{patterns!.totalCount}</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Total Volume</div>
          <div style={styles.metricValue}>{formatVolume(patterns!.totalVolume)}</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Avg Size</div>
          <div style={styles.metricValue}>{formatVolume(patterns!.averageTransferSize)}</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Top 3 Conc.</div>
          <div style={styles.metricValue}>{patterns!.concentrationRatio.toFixed(1)}%</div>
        </div>
      </div>

      {/* Behavioral Patterns */}
      <div style={styles.sectionLabel}>Behavioral Patterns</div>
      <div style={styles.behaviorGrid}>
        <div style={styles.behaviorCard}>
          <div style={styles.behaviorLabel}>Activity Level</div>
          <div style={styles.behaviorValue}>{activityDisplay[patterns!.whaleActivityLevel]}</div>
        </div>
        <div style={styles.behaviorCard}>
          <div style={styles.behaviorLabel}>Destination Bias</div>
          <div style={styles.behaviorValue}>{biasDisplay[patterns!.transferDestinationBias]}</div>
        </div>
        <div style={styles.behaviorCard}>
          <div style={styles.behaviorLabel}>Activity Regime</div>
          <div style={styles.behaviorValue}>{regimeDisplay[patterns!.activityRegime]}</div>
        </div>
      </div>

      {/* Dual Time-Series Chart */}
      <div style={styles.sectionLabel}>Time-Series</div>
      <DualChart data={data!} />

      {/* Raw Data for Researchers */}
      <details>
        <summary style={styles.rawDataToggle}>[Researcher Mode] View Raw JSON</summary>
        <pre style={styles.rawDataPre}>
          {JSON.stringify({
            dataPoints: data!.timestampSeries.length,
            threshold: data!.largeTransferThreshold,
            patterns,
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

/** Low Steady Activity */
export const MOCK_LOW_STEADY: WhaleTransferInput = {
  timestampSeries: generateTimestamps(14),
  largeTransferCountSeries: [2, 3, 2, 4, 3, 2, 3, 4, 2, 3, 4, 3, 2, 3],
  largeTransferVolumeSeries: [50_000, 75_000, 60_000, 100_000, 80_000, 55_000, 70_000, 95_000, 65_000, 80_000, 90_000, 75_000, 60_000, 70_000],
  largeTransferThreshold: 10_000,
  whaleExchangeFlowSeries: [25_000, 40_000, 30_000, 50_000, 40_000, 25_000, 35_000, 50_000, 35_000, 40_000, 45_000, 35_000, 30_000, 35_000],
  whaleNonExchangeFlowSeries: [25_000, 35_000, 30_000, 50_000, 40_000, 30_000, 35_000, 45_000, 30_000, 40_000, 45_000, 40_000, 30_000, 35_000],
};

/** High Volume Burst */
export const MOCK_HIGH_BURST: WhaleTransferInput = {
  timestampSeries: generateTimestamps(14),
  largeTransferCountSeries: [3, 4, 5, 25, 35, 40, 8, 5, 4, 3, 4, 5, 4, 3],
  largeTransferVolumeSeries: [100_000, 150_000, 200_000, 2_500_000, 4_000_000, 5_500_000, 350_000, 180_000, 120_000, 100_000, 140_000, 170_000, 130_000, 110_000],
  largeTransferThreshold: 25_000,
  whaleExchangeFlowSeries: [60_000, 90_000, 120_000, 2_000_000, 3_200_000, 4_400_000, 250_000, 100_000, 70_000, 60_000, 80_000, 100_000, 75_000, 65_000],
  whaleNonExchangeFlowSeries: [40_000, 60_000, 80_000, 500_000, 800_000, 1_100_000, 100_000, 80_000, 50_000, 40_000, 60_000, 70_000, 55_000, 45_000],
};

/** Destination Shift Pattern */
export const MOCK_DESTINATION_SHIFT: WhaleTransferInput = {
  timestampSeries: generateTimestamps(14),
  largeTransferCountSeries: [8, 10, 12, 15, 14, 12, 10, 8, 10, 12, 14, 16, 15, 12],
  largeTransferVolumeSeries: [400_000, 500_000, 600_000, 750_000, 700_000, 600_000, 500_000, 400_000, 500_000, 600_000, 700_000, 800_000, 750_000, 600_000],
  largeTransferThreshold: 25_000,
  whaleExchangeFlowSeries: [350_000, 420_000, 480_000, 550_000, 450_000, 300_000, 200_000, 120_000, 150_000, 180_000, 200_000, 220_000, 200_000, 180_000],
  whaleNonExchangeFlowSeries: [50_000, 80_000, 120_000, 200_000, 250_000, 300_000, 300_000, 280_000, 350_000, 420_000, 500_000, 580_000, 550_000, 420_000],
};

/** Mixed Activity */
export const MOCK_MIXED_ACTIVITY: WhaleTransferInput = {
  timestampSeries: generateTimestamps(14),
  largeTransferCountSeries: [5, 8, 12, 6, 15, 4, 18, 7, 10, 5, 14, 8, 11, 6],
  largeTransferVolumeSeries: [200_000, 400_000, 600_000, 250_000, 750_000, 180_000, 900_000, 350_000, 500_000, 220_000, 700_000, 400_000, 550_000, 280_000],
  largeTransferThreshold: 20_000,
  whaleExchangeFlowSeries: [100_000, 200_000, 300_000, 125_000, 375_000, 90_000, 450_000, 175_000, 250_000, 110_000, 350_000, 200_000, 275_000, 140_000],
  whaleNonExchangeFlowSeries: [100_000, 200_000, 300_000, 125_000, 375_000, 90_000, 450_000, 175_000, 250_000, 110_000, 350_000, 200_000, 275_000, 140_000],
};
