/**
 * FlowAnalysisModule - Sub-module for L3 Behavioral/Flow
 * 
 * LAYOUT RULES RESPECTED:
 * - NO new scroll containers
 * - NO absolute/fixed positioning
 * - Fits vertically with min-height
 * - Degrades gracefully with missing data
 * - Exposes raw numbers for researchers
 */

import { FlowAnalysisResult, FlowMetrics } from '@/lib/flow';

interface FlowAnalysisModuleProps {
  data?: FlowAnalysisResult | null;
  isLoading?: boolean;
  error?: string | null;
}

// Scoped styles (inline to avoid global CSS pollution)
const styles = {
  container: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#0f0f0f',
    borderRadius: '6px',
    minHeight: '120px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #27272a',
  },
  title: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#fafafa',
  },
  badge: (status: string) => ({
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 600,
    backgroundColor: status === 'VALID' ? '#14532d' : status === 'WARNING' ? '#713f12' : '#7f1d1d',
    color: status === 'VALID' ? '#22c55e' : status === 'WARNING' ? '#eab308' : '#ef4444',
  }),
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px',
    marginBottom: '12px',
  },
  metricCard: {
    padding: '8px',
    backgroundColor: '#18181b',
    borderRadius: '4px',
  },
  metricLabel: {
    fontSize: '0.75rem',
    color: '#71717a',
    marginBottom: '4px',
  },
  metricValue: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#fafafa',
  },
  binsContainer: {
    marginTop: '12px',
  },
  binRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid #27272a',
    fontSize: '0.875rem',
  },
  rawDataToggle: {
    marginTop: '12px',
    padding: '8px',
    backgroundColor: '#18181b',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    color: '#71717a',
    textAlign: 'center' as const,
  },
  rawDataPre: {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: '#09090b',
    borderRadius: '4px',
    fontSize: '0.625rem',
    color: '#52525b',
    fontFamily: 'ui-monospace, monospace',
    overflow: 'auto',
    maxHeight: '150px',
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80px',
    color: '#52525b',
    fontStyle: 'italic' as const,
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80px',
    color: '#71717a',
  },
  errorState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80px',
    color: '#ef4444',
    fontSize: '0.875rem',
  },
  invalidationNote: {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: '#1c1917',
    borderLeft: '3px solid #eab308',
    borderRadius: '2px',
    fontSize: '0.75rem',
    color: '#a1a1aa',
  },
} as const;

function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null || isNaN(num)) return '--';
  if (Math.abs(num) >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (Math.abs(num) >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(2);
}

function FlowMetricCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={{ ...styles.metricValue, color: color || '#fafafa' }}>{value}</div>
    </div>
  );
}

function BinRow({ bin }: { bin: FlowMetrics }) {
  const netColor = bin.netflow > 0 ? '#22c55e' : bin.netflow < 0 ? '#ef4444' : '#a1a1aa';
  return (
    <div style={styles.binRow}>
      <span style={{ color: '#a1a1aa' }}>{bin.date}</span>
      <span style={{ color: '#22c55e' }}>+{formatNumber(bin.inflow)}</span>
      <span style={{ color: '#ef4444' }}>-{formatNumber(bin.outflow)}</span>
      <span style={{ color: netColor, fontWeight: 600 }}>{formatNumber(bin.netflow)}</span>
      <span style={{ color: '#71717a' }}>🐋 {bin.whaleMoves}</span>
    </div>
  );
}

export default function FlowAnalysisModule({ data, isLoading, error }: FlowAnalysisModuleProps) {
  // Loading state
  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingState}>Loading flow analysis...</div>
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

  // Empty/No data state
  if (!data) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.title}>Flow Analysis</span>
        </div>
        <div style={styles.emptyState}>No flow data available — configure token address to analyze</div>
      </div>
    );
  }

  const { metrics, totalVolume, whaleNetflow, thesisStatus, invalidationReason } = data;

  return (
    <div style={styles.container}>
      {/* Header with Status Badge */}
      <div style={styles.header}>
        <span style={styles.title}>Flow Analysis</span>
        <span style={styles.badge(thesisStatus)}>{thesisStatus}</span>
      </div>

      {/* Summary Metrics Grid */}
      <div style={styles.metricsGrid}>
        <FlowMetricCard label="Total Volume" value={formatNumber(totalVolume)} />
        <FlowMetricCard 
          label="Whale Netflow" 
          value={formatNumber(whaleNetflow)} 
          color={whaleNetflow > 0 ? '#22c55e' : whaleNetflow < 0 ? '#ef4444' : '#a1a1aa'}
        />
        <FlowMetricCard label="Time Bins" value={String(metrics?.length ?? 0)} />
        <FlowMetricCard 
          label="Whale Moves" 
          value={String(metrics?.reduce((acc, m) => acc + m.whaleMoves, 0) ?? 0)} 
        />
      </div>

      {/* Invalidation Warning */}
      {invalidationReason && (
        <div style={styles.invalidationNote}>
          ⚠️ {invalidationReason}
        </div>
      )}

      {/* Time Bins Table (for researchers) */}
      {metrics && metrics.length > 0 && (
        <div style={styles.binsContainer}>
          <div style={{ ...styles.binRow, color: '#71717a', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>Bin</span>
            <span>Inflow</span>
            <span>Outflow</span>
            <span>Net</span>
            <span>Whales</span>
          </div>
          {metrics.map((bin, idx) => (
            <BinRow key={idx} bin={bin} />
          ))}
        </div>
      )}

      {/* Raw Data for Researchers */}
      <details style={{ marginTop: '12px' }}>
        <summary style={styles.rawDataToggle}>
          [Researcher Mode] View Raw JSON
        </summary>
        <pre style={styles.rawDataPre}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}
