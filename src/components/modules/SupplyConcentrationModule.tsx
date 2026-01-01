/**
 * SupplyConcentrationModule
 * 
 * Layer: L2 — Structural Metrics
 * Type: Context / Explanation (NO verdict authority)
 * Purpose: Describe token holder concentration and ownership distribution
 *          to provide structural context for analyst interpretation.
 * 
 * ════════════════════════════════════════════════════════════════
 * MODULE INTERFACE CONTRACT (L2 COMPLIANT)
 * ════════════════════════════════════════════════════════════════
 * 
 * INPUTS (Required):
 * - totalSupply: number
 * - holders: HolderRecord[]
 * 
 * INPUTS (Optional):
 * - previousSnapshot: HolderRecord[] (for delta analysis)
 * 
 * OUTPUTS:
 * a. Raw Metrics: topHolderShare, top5Share, top10Share, holderCount
 * b. Structural Descriptions: concentrationLevel, distributionShape
 * c. Context Summary: 2-3 neutral sentences
 * 
 * IMPORTANT:
 * - NO status badges (PASS/WARNING/FAIL)
 * - NO alert colors
 * - NO risk verdicts
 * - NO recommendations
 * ════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

export interface HolderRecord {
  address: string;
  balance: number;
  label?: 'team' | 'treasury' | 'exchange' | 'contract' | 'unknown';
}

export interface SupplyConcentrationInput {
  totalSupply: number;
  holders: HolderRecord[];
  previousSnapshot?: HolderRecord[];
}

export interface SupplyConcentrationProps {
  data?: SupplyConcentrationInput | null;
  isLoading?: boolean;
  error?: string | null;
}

// Structural description types (NO verdicts)
type ConcentrationLevel = 'low' | 'moderate' | 'high';
type DistributionShape = 'flat' | 'skewed';

// ─────────────────────────────────────────────────
// Business Logic
// ─────────────────────────────────────────────────

interface ComputedMetrics {
  topHolderShare: number;
  top5HoldersShare: number;
  top10HoldersShare: number;
  top50HoldersShare: number;
  teamShare: number;
  treasuryShare: number;
  exchangeShare: number;
  holderCount: number;
  concentrationLevel: ConcentrationLevel;
  distributionShape: DistributionShape;
  distributionDelta: number | null;
}

function computeMetrics(data: SupplyConcentrationInput): ComputedMetrics {
  const { totalSupply, holders, previousSnapshot } = data;
  
  // Sort by balance descending
  const sorted = [...holders].sort((a, b) => b.balance - a.balance);
  
  // Raw metrics
  const topHolder = sorted[0]?.balance ?? 0;
  const top5 = sorted.slice(0, 5).reduce((sum, h) => sum + h.balance, 0);
  const top10 = sorted.slice(0, 10).reduce((sum, h) => sum + h.balance, 0);
  const top50 = sorted.slice(0, 50).reduce((sum, h) => sum + h.balance, 0);
  
  const topHolderShare = totalSupply > 0 ? (topHolder / totalSupply) * 100 : 0;
  const top5HoldersShare = totalSupply > 0 ? (top5 / totalSupply) * 100 : 0;
  const top10HoldersShare = totalSupply > 0 ? (top10 / totalSupply) * 100 : 0;
  const top50HoldersShare = totalSupply > 0 ? (top50 / totalSupply) * 100 : 0;
  
  // By label
  const teamBalance = holders.filter(h => h.label === 'team').reduce((sum, h) => sum + h.balance, 0);
  const treasuryBalance = holders.filter(h => h.label === 'treasury').reduce((sum, h) => sum + h.balance, 0);
  const exchangeBalance = holders.filter(h => h.label === 'exchange').reduce((sum, h) => sum + h.balance, 0);
  
  const teamShare = totalSupply > 0 ? (teamBalance / totalSupply) * 100 : 0;
  const treasuryShare = totalSupply > 0 ? (treasuryBalance / totalSupply) * 100 : 0;
  const exchangeShare = totalSupply > 0 ? (exchangeBalance / totalSupply) * 100 : 0;
  
  // Structural descriptions (descriptive, NOT evaluative)
  let concentrationLevel: ConcentrationLevel;
  if (top10HoldersShare < 30) {
    concentrationLevel = 'low';
  } else if (top10HoldersShare < 60) {
    concentrationLevel = 'moderate';
  } else {
    concentrationLevel = 'high';
  }
  
  // Distribution shape based on top holder vs top 10 spread
  const distributionShape: DistributionShape = 
    topHolderShare > top10HoldersShare * 0.4 ? 'skewed' : 'flat';
  
  // Distribution delta (if previous snapshot available)
  let distributionDelta: number | null = null;
  if (previousSnapshot && previousSnapshot.length >= 10) {
    const prevSorted = [...previousSnapshot].sort((a, b) => b.balance - a.balance);
    const prevTop10Balance = prevSorted.slice(0, 10).reduce((sum, h) => sum + h.balance, 0);
    const prevTotalSupply = previousSnapshot.reduce((sum, h) => sum + h.balance, 0);
    const prevTop10Percent = prevTotalSupply > 0 ? (prevTop10Balance / prevTotalSupply) * 100 : 0;
    distributionDelta = top10HoldersShare - prevTop10Percent;
  }
  
  return {
    topHolderShare,
    top5HoldersShare,
    top10HoldersShare,
    top50HoldersShare,
    teamShare,
    treasuryShare,
    exchangeShare,
    holderCount: holders.length,
    concentrationLevel,
    distributionShape,
    distributionDelta,
  };
}

function validateData(data: SupplyConcentrationInput | null | undefined): string[] {
  const missing: string[] = [];
  if (!data) return ['all data'];
  if (!data.holders || data.holders.length === 0) missing.push('holders');
  if (!data.totalSupply || data.totalSupply <= 0) missing.push('totalSupply');
  return missing;
}

function generateContextSummary(metrics: ComputedMetrics): string {
  const { top10HoldersShare, concentrationLevel, distributionShape, holderCount } = metrics;
  
  const sentences: string[] = [];
  
  // Concentration description
  sentences.push(`Top 10 holders control ${top10HoldersShare.toFixed(1)}% of total supply.`);
  
  // Distribution shape
  if (distributionShape === 'skewed') {
    sentences.push(`Ownership is concentrated toward the largest holder.`);
  } else {
    sentences.push(`Ownership is relatively distributed among top holders.`);
  }
  
  // Holder count context
  sentences.push(`Total tracked holders: ${holderCount.toLocaleString()}.`);
  
  return sentences.join(' ');
}

// ─────────────────────────────────────────────────
// Scoped Styles (NO alert colors)
// ─────────────────────────────────────────────────

const styles = {
  container: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#0f0f0f',
    borderRadius: '6px',
    minHeight: '100px',
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
    backgroundColor: '#1e3a5f',
    color: '#60a5fa',
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
  metricsGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(3, 1fr)', 
    gap: '8px',
  },
  metricCard: { 
    padding: '8px', 
    backgroundColor: '#18181b', 
    borderRadius: '4px', 
    textAlign: 'center' as const 
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
    color: '#fafafa' 
  },
  distributionBar: {
    height: '8px',
    backgroundColor: '#27272a',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#52525b', // Neutral color, NO alert colors
    borderRadius: '4px',
  },
  structuralRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
    marginTop: '8px',
  },
  structuralItem: {
    padding: '6px 10px',
    backgroundColor: '#18181b',
    borderRadius: '4px',
    fontSize: '0.8125rem',
  },
  structuralLabel: {
    color: '#71717a',
    marginRight: '4px',
  },
  structuralValue: {
    fontWeight: 600,
    color: '#e4e4e7',
    textTransform: 'capitalize' as const,
  },
  deltaText: {
    fontSize: '0.75rem',
    color: '#71717a',
    marginTop: '8px',
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
// Helper Components
// ─────────────────────────────────────────────────

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={styles.metricValue}>{value}</div>
    </div>
  );
}

function StructuralItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.structuralItem}>
      <span style={styles.structuralLabel}>{label}:</span>
      <span style={styles.structuralValue}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────

export default function SupplyConcentrationModule({ data, isLoading, error }: SupplyConcentrationProps) {
  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.unavailable}>Loading holder structure data...</div>
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
          <span style={styles.title}>Holder Concentration Overview</span>
          <span style={styles.layerTag}>L2 Context</span>
        </div>
        <div style={styles.unavailable}>
          <span style={{ fontWeight: 600, marginBottom: '4px' }}>HOLDER STRUCTURE DATA UNAVAILABLE</span>
          <span style={{ fontSize: '0.75rem' }}>Missing: {missingFields.join(', ')}</span>
        </div>
      </div>
    );
  }

  const metrics = computeMetrics(data!);
  const summary = generateContextSummary(metrics);

  return (
    <div style={styles.container}>
      {/* Header - NO status badge */}
      <div style={styles.header}>
        <span style={styles.title}>Holder Concentration Overview</span>
        <span style={styles.layerTag}>L2 Context</span>
      </div>

      {/* Context Summary */}
      <p style={styles.summary}>{summary}</p>

      {/* Distribution Bar (neutral color) */}
      <div style={styles.distributionBar}>
        <div style={{ ...styles.barFill, width: `${Math.min(metrics.top10HoldersShare, 100)}%` }} />
      </div>

      {/* Raw Metrics */}
      <div style={styles.sectionLabel}>Raw Metrics</div>
      <div style={styles.metricsGrid}>
        <MetricCard label="Top Holder" value={`${metrics.topHolderShare.toFixed(1)}%`} />
        <MetricCard label="Top 5" value={`${metrics.top5HoldersShare.toFixed(1)}%`} />
        <MetricCard label="Top 10" value={`${metrics.top10HoldersShare.toFixed(1)}%`} />
        <MetricCard label="Top 50" value={`${metrics.top50HoldersShare.toFixed(1)}%`} />
        <MetricCard label="Holders" value={metrics.holderCount.toLocaleString()} />
        <MetricCard label="Team %" value={`${metrics.teamShare.toFixed(1)}%`} />
      </div>

      {/* Allocation Breakdown */}
      <div style={styles.sectionLabel}>Allocation Breakdown</div>
      <div style={styles.metricsGrid}>
        <MetricCard label="Treasury" value={`${metrics.treasuryShare.toFixed(1)}%`} />
        <MetricCard label="Exchange" value={`${metrics.exchangeShare.toFixed(1)}%`} />
        <MetricCard label="Team" value={`${metrics.teamShare.toFixed(1)}%`} />
      </div>

      {/* Structural Descriptions */}
      <div style={styles.sectionLabel}>Structural Description</div>
      <div style={styles.structuralRow}>
        <StructuralItem label="Concentration" value={metrics.concentrationLevel} />
        <StructuralItem label="Distribution" value={metrics.distributionShape} />
      </div>

      {/* Delta indicator if available */}
      {metrics.distributionDelta !== null && (
        <div style={styles.deltaText}>
          Δ Top 10 vs previous snapshot: 
          <span style={{ marginLeft: '4px', color: '#e4e4e7' }}>
            {metrics.distributionDelta > 0 ? '+' : ''}{metrics.distributionDelta.toFixed(2)}%
          </span>
        </div>
      )}

      {/* Raw Data for Researchers */}
      <details>
        <summary style={styles.rawDataToggle}>[Researcher Mode] View Raw JSON</summary>
        <pre style={styles.rawDataPre}>{JSON.stringify({ metrics, holdersSample: data!.holders.slice(0, 5) }, null, 2)}</pre>
      </details>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Mock Data Exports
// ─────────────────────────────────────────────────

export const MOCK_SUPPLY_CONCENTRATION_DATA: SupplyConcentrationInput = {
  totalSupply: 1_000_000_000,
  holders: [
    { address: '0xTeam1...', balance: 150_000_000, label: 'team' },
    { address: '0xTreasury...', balance: 100_000_000, label: 'treasury' },
    { address: '0xBinance...', balance: 80_000_000, label: 'exchange' },
    { address: '0xCoinbase...', balance: 60_000_000, label: 'exchange' },
    { address: '0xWhale1...', balance: 45_000_000, label: 'unknown' },
    { address: '0xWhale2...', balance: 40_000_000, label: 'unknown' },
    { address: '0xWhale3...', balance: 35_000_000, label: 'unknown' },
    { address: '0xContract1...', balance: 30_000_000, label: 'contract' },
    { address: '0xWhale4...', balance: 25_000_000, label: 'unknown' },
    { address: '0xWhale5...', balance: 20_000_000, label: 'unknown' },
    { address: '0xSmall1...', balance: 10_000_000, label: 'unknown' },
    { address: '0xSmall2...', balance: 8_000_000, label: 'unknown' },
  ],
};

/** Low concentration example */
export const MOCK_LOW_CONCENTRATION: SupplyConcentrationInput = {
  totalSupply: 1_000_000_000,
  holders: Array.from({ length: 100 }, (_, i) => ({
    address: `0xHolder${i}...`,
    balance: 10_000_000 - i * 50_000,
    label: 'unknown' as const,
  })),
};

/** High concentration example */
export const MOCK_HIGH_CONCENTRATION: SupplyConcentrationInput = {
  totalSupply: 1_000_000_000,
  holders: [
    { address: '0xFounder...', balance: 400_000_000, label: 'team' },
    { address: '0xTeam...', balance: 200_000_000, label: 'team' },
    { address: '0xTreasury...', balance: 150_000_000, label: 'treasury' },
    { address: '0xExchange...', balance: 100_000_000, label: 'exchange' },
    ...Array.from({ length: 10 }, (_, i) => ({
      address: `0xSmall${i}...`,
      balance: 5_000_000,
      label: 'unknown' as const,
    })),
  ],
};
