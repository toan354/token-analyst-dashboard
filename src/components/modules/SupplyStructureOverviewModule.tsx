/**
 * SupplyStructureOverviewModule
 * 
 * Layer: L2 — Structural Metrics
 * Type: Token Supply Structure (NO verdict authority)
 * Purpose: Describe token supply composition and distribution structure
 *          to contextualize emission and flow-related risks.
 * 
 * ════════════════════════════════════════════════════════════════
 * MODULE INTERFACE CONTRACT
 * ════════════════════════════════════════════════════════════════
 * 
 * INPUTS (Required):
 * - circulatingSupply: number
 * - totalSupply: number
 * - maxSupply: number | null
 * - lockedSupply: number
 * - vestingSupply: number | null
 * 
 * INPUTS (Optional):
 * - topHolderShare: number (%)
 * - teamAllocationPct: number (%)
 * - investorAllocationPct: number (%)
 * 
 * OUTPUTS:
 * a. Raw Metrics: circulatingSupply, lockedSupply, vestingSupply, maxSupply
 * b. Structural Breakdown: circulating_pct, locked_pct, vesting_pct
 * c. Context Summary: 2-3 neutral sentences
 * 
 * IMPORTANT:
 * - NO status badges (PASS/WARNING/FAIL)
 * - NO alert colors
 * - NO risk verdicts
 * ════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

export interface SupplyStructureInput {
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number | null;
  lockedSupply: number;
  vestingSupply: number | null;
  topHolderShare?: number;
  teamAllocationPct?: number;
  investorAllocationPct?: number;
}

export interface SupplyStructureProps {
  data?: SupplyStructureInput | null;
  isLoading?: boolean;
  error?: string | null;
}

interface StructuralBreakdown {
  circulatingPct: number;
  lockedPct: number;
  vestingPct: number | null;
  unlockExposure: string;
}

// ─────────────────────────────────────────────────
// Business Logic
// ─────────────────────────────────────────────────

function computeBreakdown(data: SupplyStructureInput): StructuralBreakdown {
  const { totalSupply, circulatingSupply, lockedSupply, vestingSupply } = data;
  
  const circulatingPct = totalSupply > 0 ? (circulatingSupply / totalSupply) * 100 : 0;
  const lockedPct = totalSupply > 0 ? (lockedSupply / totalSupply) * 100 : 0;
  const vestingPct = vestingSupply !== null && totalSupply > 0 
    ? (vestingSupply / totalSupply) * 100 
    : null;
  
  // Descriptive unlock exposure (structural, not risk-based)
  let unlockExposure: string;
  const nonCirculatingPct = 100 - circulatingPct;
  
  if (nonCirculatingPct >= 60) {
    unlockExposure = "Majority of supply is not yet circulating";
  } else if (nonCirculatingPct >= 30) {
    unlockExposure = "Significant portion remains non-circulating";
  } else if (nonCirculatingPct >= 10) {
    unlockExposure = "Most supply is already in circulation";
  } else {
    unlockExposure = "Nearly fully circulating supply";
  }
  
  return { circulatingPct, lockedPct, vestingPct, unlockExposure };
}

function validateData(data: SupplyStructureInput | null | undefined): string[] {
  const missing: string[] = [];
  if (!data) return ['all data'];
  if (!data.circulatingSupply || data.circulatingSupply <= 0) missing.push('circulatingSupply');
  if (!data.totalSupply || data.totalSupply <= 0) missing.push('totalSupply');
  if (data.lockedSupply === undefined || data.lockedSupply === null) missing.push('lockedSupply');
  return missing;
}

function generateContextSummary(data: SupplyStructureInput, breakdown: StructuralBreakdown): string {
  const { circulatingPct, lockedPct, vestingPct } = breakdown;
  
  const sentences: string[] = [];
  
  // Circulating structure
  sentences.push(`${circulatingPct.toFixed(1)}% of total supply is currently circulating.`);
  
  // Locked/Vesting structure
  if (vestingPct !== null && vestingPct > 0) {
    sentences.push(`${lockedPct.toFixed(1)}% is locked, with ${vestingPct.toFixed(1)}% subject to vesting schedules.`);
  } else if (lockedPct > 0) {
    sentences.push(`${lockedPct.toFixed(1)}% of supply is currently locked.`);
  }
  
  // Allocation hints if available
  if (data.teamAllocationPct !== undefined || data.investorAllocationPct !== undefined) {
    const parts: string[] = [];
    if (data.teamAllocationPct !== undefined) parts.push(`team (${data.teamAllocationPct}%)`);
    if (data.investorAllocationPct !== undefined) parts.push(`investors (${data.investorAllocationPct}%)`);
    sentences.push(`Allocation includes ${parts.join(' and ')}.`);
  }
  
  return sentences.join(' ');
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
    gridTemplateColumns: 'repeat(2, 1fr)', 
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
  breakdownContainer: {
    marginTop: '8px',
  },
  breakdownRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
  },
  breakdownLabel: {
    width: '100px',
    fontSize: '0.75rem',
    color: '#71717a',
  },
  breakdownBarContainer: {
    flex: 1,
    height: '8px',
    backgroundColor: '#27272a',
    borderRadius: '4px',
    overflow: 'hidden',
    marginRight: '8px',
  },
  breakdownBar: {
    height: '100%',
    backgroundColor: '#52525b',
    borderRadius: '4px',
  },
  breakdownValue: {
    width: '50px',
    fontSize: '0.75rem',
    color: '#a1a1aa',
    textAlign: 'right' as const,
  },
  exposureHint: {
    padding: '8px',
    backgroundColor: '#18181b',
    borderRadius: '4px',
    fontSize: '0.8125rem',
    color: '#a1a1aa',
    marginTop: '12px',
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

function formatSupply(num: number | null | undefined): string {
  if (num === null || num === undefined) return '--';
  if (Math.abs(num) >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(num) >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (Math.abs(num) >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(0);
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={styles.metricValue}>{value}</div>
    </div>
  );
}

function BreakdownBar({ label, percentage }: { label: string; percentage: number | null }) {
  if (percentage === null) return null;
  
  return (
    <div style={styles.breakdownRow}>
      <span style={styles.breakdownLabel}>{label}</span>
      <div style={styles.breakdownBarContainer}>
        <div style={{ ...styles.breakdownBar, width: `${Math.min(percentage, 100)}%` }} />
      </div>
      <span style={styles.breakdownValue}>{percentage.toFixed(1)}%</span>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────

export default function SupplyStructureOverviewModule({ data, isLoading, error }: SupplyStructureProps) {
  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.unavailable}>Loading supply structure data...</div>
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
          <span style={styles.title}>Supply Structure Overview</span>
          <span style={styles.layerTag}>L2 Context</span>
        </div>
        <div style={styles.unavailable}>
          <span style={{ fontWeight: 600, marginBottom: '4px' }}>SUPPLY STRUCTURE DATA UNAVAILABLE</span>
          <span style={{ fontSize: '0.75rem' }}>Missing: {missingFields.join(', ')}</span>
        </div>
      </div>
    );
  }

  const breakdown = computeBreakdown(data!);
  const summary = generateContextSummary(data!, breakdown);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>Supply Structure Overview</span>
        <span style={styles.layerTag}>L2 Context</span>
      </div>

      {/* Context Summary */}
      <p style={styles.summary}>{summary}</p>

      {/* Raw Metrics */}
      <div style={styles.sectionLabel}>Raw Metrics</div>
      <div style={styles.metricsGrid}>
        <MetricCard label="Circulating" value={formatSupply(data!.circulatingSupply)} />
        <MetricCard label="Locked" value={formatSupply(data!.lockedSupply)} />
        <MetricCard label="Vesting" value={data!.vestingSupply !== null ? formatSupply(data!.vestingSupply) : 'N/A'} />
        <MetricCard label="Max Supply" value={data!.maxSupply !== null ? formatSupply(data!.maxSupply) : '∞'} />
      </div>

      {/* Structural Breakdown (Visual Bars) */}
      <div style={styles.sectionLabel}>Structural Breakdown</div>
      <div style={styles.breakdownContainer}>
        <BreakdownBar label="Circulating" percentage={breakdown.circulatingPct} />
        <BreakdownBar label="Locked" percentage={breakdown.lockedPct} />
        <BreakdownBar label="Vesting" percentage={breakdown.vestingPct} />
      </div>

      {/* Unlock Exposure Hint */}
      <div style={styles.exposureHint}>
        <strong>Supply Unlock Exposure:</strong> {breakdown.unlockExposure}
      </div>

      {/* Optional Allocation Details */}
      {(data!.topHolderShare !== undefined || 
        data!.teamAllocationPct !== undefined || 
        data!.investorAllocationPct !== undefined) && (
        <>
          <div style={styles.sectionLabel}>Allocation Details</div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {data!.topHolderShare !== undefined && (
              <div style={{ fontSize: '0.8125rem', color: '#a1a1aa' }}>
                Top Holder: <strong style={{ color: '#e4e4e7' }}>{data!.topHolderShare}%</strong>
              </div>
            )}
            {data!.teamAllocationPct !== undefined && (
              <div style={{ fontSize: '0.8125rem', color: '#a1a1aa' }}>
                Team: <strong style={{ color: '#e4e4e7' }}>{data!.teamAllocationPct}%</strong>
              </div>
            )}
            {data!.investorAllocationPct !== undefined && (
              <div style={{ fontSize: '0.8125rem', color: '#a1a1aa' }}>
                Investors: <strong style={{ color: '#e4e4e7' }}>{data!.investorAllocationPct}%</strong>
              </div>
            )}
          </div>
        </>
      )}

      {/* Raw Data for Researchers */}
      <details>
        <summary style={styles.rawDataToggle}>[Researcher Mode] View Raw JSON</summary>
        <pre style={styles.rawDataPre}>{JSON.stringify(data, null, 2)}</pre>
      </details>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Mock Data Exports
// ─────────────────────────────────────────────────

/** High Circulating / Low Locked scenario */
export const MOCK_HIGH_CIRCULATING: SupplyStructureInput = {
  circulatingSupply: 850_000_000,
  totalSupply: 1_000_000_000,
  maxSupply: 1_000_000_000,
  lockedSupply: 100_000_000,
  vestingSupply: 50_000_000,
  topHolderShare: 5.2,
  teamAllocationPct: 10,
  investorAllocationPct: 15,
};

/** Low Circulating / High Vesting scenario */
export const MOCK_LOW_CIRCULATING: SupplyStructureInput = {
  circulatingSupply: 200_000_000,
  totalSupply: 1_000_000_000,
  maxSupply: 10_000_000_000,
  lockedSupply: 400_000_000,
  vestingSupply: 400_000_000,
  topHolderShare: 18.5,
  teamAllocationPct: 20,
  investorAllocationPct: 25,
};

/** Balanced scenario */
export const MOCK_BALANCED_SUPPLY: SupplyStructureInput = {
  circulatingSupply: 500_000_000,
  totalSupply: 1_000_000_000,
  maxSupply: 1_000_000_000,
  lockedSupply: 250_000_000,
  vestingSupply: 250_000_000,
};

/** No vesting, infinite max scenario */
export const MOCK_NO_VESTING: SupplyStructureInput = {
  circulatingSupply: 750_000_000,
  totalSupply: 1_000_000_000,
  maxSupply: null,
  lockedSupply: 250_000_000,
  vestingSupply: null,
};
