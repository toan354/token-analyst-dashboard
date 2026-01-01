/**
 * MarketStructureOverviewModule
 * 
 * Layer: L2 — Structural Metrics
 * Type: Context / Explanation (NO verdict authority)
 * Purpose: Provide slow-moving market and supply structure context
 *          to help interpret L1 risk signals.
 * 
 * ════════════════════════════════════════════════════════════════
 * MODULE INTERFACE CONTRACT
 * ════════════════════════════════════════════════════════════════
 * 
 * INPUTS (Required):
 * - marketCap: number
 * - fullyDilutedValuation: number
 * - circulatingSupply: number
 * - totalSupply: number
 * - maxSupply: number | null
 * 
 * INPUTS (Optional):
 * - historicalMarketCap: number
 * - historicalFdv: number
 * - dominance: number (%)
 * 
 * OUTPUTS:
 * a. Raw Metrics: marketCap, fdv, circulatingSupply, totalSupply, maxSupply
 * b. Structural Relationships: fdvToMarketCapRatio, circulatingToMaxRatio
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

export interface MarketStructureInput {
  marketCap: number;
  fullyDilutedValuation: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number | null;
  historicalMarketCap?: number;
  historicalFdv?: number;
  dominance?: number;
}

export interface MarketStructureProps {
  data?: MarketStructureInput | null;
  isLoading?: boolean;
  error?: string | null;
}

interface StructuralRelationships {
  fdvToMarketCapRatio: number;
  circulatingToMaxRatio: number | null;
  circulatingToTotalRatio: number;
}

// ─────────────────────────────────────────────────
// Business Logic
// ─────────────────────────────────────────────────

function computeRelationships(data: MarketStructureInput): StructuralRelationships {
  const { marketCap, fullyDilutedValuation, circulatingSupply, totalSupply, maxSupply } = data;
  
  const fdvToMarketCapRatio = marketCap > 0 ? fullyDilutedValuation / marketCap : 0;
  const circulatingToMaxRatio = maxSupply && maxSupply > 0 
    ? (circulatingSupply / maxSupply) * 100 
    : null;
  const circulatingToTotalRatio = totalSupply > 0 
    ? (circulatingSupply / totalSupply) * 100 
    : 0;
  
  return { fdvToMarketCapRatio, circulatingToMaxRatio, circulatingToTotalRatio };
}

function validateData(data: MarketStructureInput | null | undefined): string[] {
  const missing: string[] = [];
  if (!data) return ['all data'];
  if (!data.marketCap || data.marketCap <= 0) missing.push('marketCap');
  if (!data.fullyDilutedValuation || data.fullyDilutedValuation <= 0) missing.push('fullyDilutedValuation');
  if (!data.circulatingSupply || data.circulatingSupply <= 0) missing.push('circulatingSupply');
  if (!data.totalSupply || data.totalSupply <= 0) missing.push('totalSupply');
  return missing;
}

function generateContextSummary(data: MarketStructureInput, relationships: StructuralRelationships): string {
  const { fdvToMarketCapRatio, circulatingToMaxRatio, circulatingToTotalRatio } = relationships;
  
  let sentences: string[] = [];
  
  // FDV vs Market Cap insight
  if (fdvToMarketCapRatio > 3) {
    sentences.push(`Fully diluted valuation is ${fdvToMarketCapRatio.toFixed(1)}x current market cap, indicating significant future supply.`);
  } else if (fdvToMarketCapRatio > 1.5) {
    sentences.push(`Fully diluted valuation is ${fdvToMarketCapRatio.toFixed(1)}x current market cap.`);
  } else {
    sentences.push(`Fully diluted valuation is close to current market cap (${fdvToMarketCapRatio.toFixed(2)}x).`);
  }
  
  // Supply structure insight
  if (circulatingToMaxRatio !== null) {
    sentences.push(`${circulatingToTotalRatio.toFixed(1)}% of total supply is circulating (${circulatingToMaxRatio.toFixed(1)}% of max).`);
  } else {
    sentences.push(`${circulatingToTotalRatio.toFixed(1)}% of total supply is currently circulating.`);
  }
  
  // Dominance if available
  if (data.dominance !== undefined) {
    sentences.push(`Market dominance is ${data.dominance.toFixed(2)}%.`);
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
  relationshipsRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
    marginTop: '8px',
  },
  relationship: {
    padding: '6px 10px',
    backgroundColor: '#18181b',
    borderRadius: '4px',
    fontSize: '0.8125rem',
  },
  relLabel: {
    color: '#71717a',
    marginRight: '4px',
  },
  relValue: {
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
} as const;

// ─────────────────────────────────────────────────
// Helper Components
// ─────────────────────────────────────────────────

function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '--';
  if (Math.abs(num) >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(num) >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (Math.abs(num) >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

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

function Relationship({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.relationship}>
      <span style={styles.relLabel}>{label}:</span>
      <span style={styles.relValue}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────

export default function MarketStructureOverviewModule({ data, isLoading, error }: MarketStructureProps) {
  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.unavailable}>Loading market structure data...</div>
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
          <span style={styles.title}>Market Structure Overview</span>
          <span style={styles.layerTag}>L2 Context</span>
        </div>
        <div style={styles.unavailable}>
          <span style={{ fontWeight: 600, marginBottom: '4px' }}>STRUCTURAL DATA UNAVAILABLE</span>
          <span style={{ fontSize: '0.75rem' }}>Missing: {missingFields.join(', ')}</span>
        </div>
      </div>
    );
  }

  const relationships = computeRelationships(data!);
  const summary = generateContextSummary(data!, relationships);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>Market Structure Overview</span>
        <span style={styles.layerTag}>L2 Context</span>
      </div>

      {/* Context Summary */}
      <p style={styles.summary}>{summary}</p>

      {/* Raw Metrics */}
      <div style={styles.sectionLabel}>Raw Metrics</div>
      <div style={styles.metricsGrid}>
        <MetricCard label="Market Cap" value={formatNumber(data!.marketCap)} />
        <MetricCard label="FDV" value={formatNumber(data!.fullyDilutedValuation)} />
        <MetricCard label="Circulating" value={formatSupply(data!.circulatingSupply)} />
        <MetricCard label="Total Supply" value={formatSupply(data!.totalSupply)} />
        <MetricCard label="Max Supply" value={data!.maxSupply ? formatSupply(data!.maxSupply) : '∞'} />
        {data!.dominance !== undefined && (
          <MetricCard label="Dominance" value={`${data!.dominance.toFixed(2)}%`} />
        )}
      </div>

      {/* Structural Relationships */}
      <div style={styles.sectionLabel}>Structural Relationships</div>
      <div style={styles.relationshipsRow}>
        <Relationship label="FDV / MCap" value={`${relationships.fdvToMarketCapRatio.toFixed(2)}x`} />
        <Relationship label="Circ / Total" value={`${relationships.circulatingToTotalRatio.toFixed(1)}%`} />
        {relationships.circulatingToMaxRatio !== null && (
          <Relationship label="Circ / Max" value={`${relationships.circulatingToMaxRatio.toFixed(1)}%`} />
        )}
      </div>

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

export const MOCK_BALANCED_STRUCTURE: MarketStructureInput = {
  marketCap: 5_000_000_000,
  fullyDilutedValuation: 6_500_000_000,
  circulatingSupply: 750_000_000,
  totalSupply: 1_000_000_000,
  maxSupply: 1_000_000_000,
  dominance: 0.15,
};

export const MOCK_HIGH_DILUTION: MarketStructureInput = {
  marketCap: 500_000_000,
  fullyDilutedValuation: 5_000_000_000,
  circulatingSupply: 100_000_000,
  totalSupply: 1_000_000_000,
  maxSupply: 1_000_000_000,
};

export const MOCK_NO_MAX_SUPPLY: MarketStructureInput = {
  marketCap: 2_000_000_000,
  fullyDilutedValuation: 2_500_000_000,
  circulatingSupply: 800_000_000,
  totalSupply: 1_000_000_000,
  maxSupply: null,
};
