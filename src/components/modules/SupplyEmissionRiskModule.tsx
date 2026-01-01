/**
 * SupplyEmissionRiskModule
 * 
 * Layer: L1 — Health & Risk Signals
 * Purpose: Assess token supply inflation and emission pressure
 *          that may structurally impact price and liquidity.
 * 
 * ════════════════════════════════════════════════════════════════
 * MODULE INTERFACE CONTRACT
 * ════════════════════════════════════════════════════════════════
 * 
 * INPUTS (Required):
 * - circulatingSupply: number
 * - totalSupply: number
 * - maxSupply: number | null (if applicable)
 * - emissionRate: number (daily tokens emitted)
 * 
 * INPUTS (Optional):
 * - unlockSchedule: UnlockEvent[] (upcoming unlocks)
 * - inflationPctAnnualized: number
 * 
 * OUTPUTS:
 * a. Raw Metrics: circulatingSupply, emissionRate, inflationPct, upcomingUnlockVolume
 * b. Derived Signals: inflationPressure, supplyDilutionTrend, unlockRiskFlag
 * c. Neutral Summary: 1-2 descriptive sentences
 * 
 * STATUS LOGIC (placeholder thresholds):
 * - PASS: inflation < 3% AND no major unlocks upcoming
 * - WARNING: inflation 3-10% OR unlock upcoming
 * - FAIL: inflation > 10% OR large unlock imminent
 * 
 * FAILURE BEHAVIOR:
 * - Missing required data → INSUFFICIENT_DATA
 * - Never infer values
 * ════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

export interface UnlockEvent {
  date: string;
  volume: number;
  description?: string;
}

export interface SupplyEmissionRiskInput {
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number | null;
  emissionRate: number; // daily
  unlockSchedule?: UnlockEvent[];
  inflationPctAnnualized?: number;
}

export interface SupplyEmissionRiskProps {
  data?: SupplyEmissionRiskInput | null;
  isLoading?: boolean;
  error?: string | null;
}

// ─────────────────────────────────────────────────
// Status & Signal Types
// ─────────────────────────────────────────────────

type ModuleStatus = 'PASS' | 'WARNING' | 'FAIL' | 'INSUFFICIENT_DATA';
type InflationPressure = 'low' | 'moderate' | 'high';
type DilutionTrend = 'stable' | 'increasing' | 'accelerating';
type UnlockRiskFlag = 'none' | 'upcoming' | 'imminent';

interface DerivedSignals {
  inflationPressure: InflationPressure;
  supplyDilutionTrend: DilutionTrend;
  unlockRiskFlag: UnlockRiskFlag;
}

interface ComputedMetrics {
  inflationPctAnnualized: number;
  upcomingUnlockVolume: number;
  signals: DerivedSignals;
}

// ─────────────────────────────────────────────────
// Thresholds (PLACEHOLDER)
// ─────────────────────────────────────────────────

const THRESHOLDS = {
  LOW_INFLATION: 3,        // < 3% = low
  HIGH_INFLATION: 10,      // > 10% = high
  IMMINENT_UNLOCK_DAYS: 7,
  UPCOMING_UNLOCK_DAYS: 30,
  LARGE_UNLOCK_PCT: 5,     // > 5% of supply = large
} as const;

// ─────────────────────────────────────────────────
// Business Logic
// ─────────────────────────────────────────────────

function computeMetrics(data: SupplyEmissionRiskInput): ComputedMetrics {
  const { circulatingSupply, emissionRate, unlockSchedule, inflationPctAnnualized } = data;
  
  // Calculate annualized inflation if not provided
  const dailyInflation = circulatingSupply > 0 ? (emissionRate / circulatingSupply) * 100 : 0;
  const inflation = inflationPctAnnualized ?? (dailyInflation * 365);
  
  // Inflation pressure signal
  let inflationPressure: InflationPressure = 'low';
  if (inflation > THRESHOLDS.HIGH_INFLATION) inflationPressure = 'high';
  else if (inflation >= THRESHOLDS.LOW_INFLATION) inflationPressure = 'moderate';
  
  // Dilution trend (simplified: based on emission vs baseline)
  let supplyDilutionTrend: DilutionTrend = 'stable';
  if (inflation > 5) supplyDilutionTrend = 'increasing';
  if (inflation > 15) supplyDilutionTrend = 'accelerating';
  
  // Unlock risk
  let unlockRiskFlag: UnlockRiskFlag = 'none';
  let upcomingUnlockVolume = 0;
  
  if (unlockSchedule && unlockSchedule.length > 0) {
    const now = Date.now();
    for (const event of unlockSchedule) {
      const eventDate = new Date(event.date).getTime();
      const daysUntil = (eventDate - now) / (1000 * 60 * 60 * 24);
      const unlockPct = circulatingSupply > 0 ? (event.volume / circulatingSupply) * 100 : 0;
      
      if (daysUntil <= THRESHOLDS.IMMINENT_UNLOCK_DAYS && unlockPct >= THRESHOLDS.LARGE_UNLOCK_PCT) {
        unlockRiskFlag = 'imminent';
        upcomingUnlockVolume += event.volume;
      } else if (daysUntil <= THRESHOLDS.UPCOMING_UNLOCK_DAYS) {
        if (unlockRiskFlag !== 'imminent') unlockRiskFlag = 'upcoming';
        upcomingUnlockVolume += event.volume;
      }
    }
  }
  
  return {
    inflationPctAnnualized: inflation,
    upcomingUnlockVolume,
    signals: { inflationPressure, supplyDilutionTrend, unlockRiskFlag },
  };
}

function validateData(data: SupplyEmissionRiskInput | null | undefined): string[] {
  const missing: string[] = [];
  if (!data) return ['all data'];
  if (data.circulatingSupply === undefined || data.circulatingSupply <= 0) missing.push('circulatingSupply');
  if (data.totalSupply === undefined || data.totalSupply <= 0) missing.push('totalSupply');
  if (data.emissionRate === undefined || isNaN(data.emissionRate)) missing.push('emissionRate');
  return missing;
}

function determineStatus(data: SupplyEmissionRiskInput | null | undefined, metrics: ComputedMetrics | null): ModuleStatus {
  const missingFields = validateData(data);
  if (missingFields.length > 0) return 'INSUFFICIENT_DATA';
  if (!metrics) return 'INSUFFICIENT_DATA';
  
  const { inflationPctAnnualized, signals } = metrics;
  
  // FAIL
  if (inflationPctAnnualized > THRESHOLDS.HIGH_INFLATION || signals.unlockRiskFlag === 'imminent') {
    return 'FAIL';
  }
  
  // WARNING
  if (inflationPctAnnualized >= THRESHOLDS.LOW_INFLATION || signals.unlockRiskFlag === 'upcoming') {
    return 'WARNING';
  }
  
  return 'PASS';
}

function generateSummary(metrics: ComputedMetrics, data: SupplyEmissionRiskInput): string {
  const { inflationPctAnnualized, signals } = metrics;
  const supplyRatio = data.totalSupply > 0 ? ((data.circulatingSupply / data.totalSupply) * 100).toFixed(1) : '--';
  
  let unlockNote = '';
  if (signals.unlockRiskFlag === 'imminent') unlockNote = ' Large unlock is imminent.';
  else if (signals.unlockRiskFlag === 'upcoming') unlockNote = ' Unlock event is upcoming.';
  
  return `Annualized inflation is ${inflationPctAnnualized.toFixed(1)}%. Circulating supply is ${supplyRatio}% of total.${unlockNote}`;
}

// ─────────────────────────────────────────────────
// Scoped Styles
// ─────────────────────────────────────────────────

const styles = {
  container: {
    padding: '12px',
    backgroundColor: '#0f0f0f',
    borderRadius: '6px',
    minHeight: '100px',
    maxHeight: '300px',
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
  title: { fontSize: '0.875rem', fontWeight: 600, color: '#fafafa' },
  badge: (status: ModuleStatus) => ({
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 600,
    backgroundColor: status === 'PASS' ? '#14532d' : status === 'WARNING' ? '#713f12' : status === 'FAIL' ? '#7f1d1d' : '#27272a',
    color: status === 'PASS' ? '#22c55e' : status === 'WARNING' ? '#eab308' : status === 'FAIL' ? '#ef4444' : '#71717a',
  }),
  summary: { fontSize: '0.875rem', color: '#a1a1aa', marginBottom: '10px', lineHeight: 1.4 },
  signalsRow: { display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' as const },
  signal: { padding: '4px 8px', backgroundColor: '#18181b', borderRadius: '4px', fontSize: '0.75rem' },
  signalLabel: { color: '#71717a', marginRight: '4px' },
  signalValue: (type: string) => ({
    fontWeight: 600,
    color: type === 'high' || type === 'imminent' || type === 'accelerating' ? '#ef4444' :
           type === 'moderate' || type === 'upcoming' || type === 'increasing' ? '#eab308' : '#22c55e',
  }),
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '8px' },
  metricCard: { padding: '6px', backgroundColor: '#18181b', borderRadius: '4px', textAlign: 'center' as const },
  metricLabel: { fontSize: '0.625rem', color: '#71717a', textTransform: 'uppercase' as const },
  metricValue: { fontSize: '0.875rem', fontWeight: 600, color: '#fafafa' },
  rawDataToggle: { marginTop: '8px', padding: '6px', backgroundColor: '#18181b', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', color: '#71717a', textAlign: 'center' as const },
  rawDataPre: { marginTop: '6px', padding: '8px', backgroundColor: '#09090b', borderRadius: '4px', fontSize: '0.625rem', color: '#52525b', fontFamily: 'ui-monospace, monospace', overflow: 'auto', maxHeight: '100px' },
  emptyState: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: '60px', color: '#52525b', textAlign: 'center' as const },
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

export default function SupplyEmissionRiskModule({ data, isLoading, error }: SupplyEmissionRiskProps) {
  if (isLoading) {
    return <div style={styles.container}><div style={styles.emptyState}>Loading supply emission data...</div></div>;
  }
  if (error) {
    return <div style={styles.container}><div style={{ ...styles.emptyState, color: '#ef4444' }}>Error: {error}</div></div>;
  }

  const missingFields = validateData(data);
  const isDataValid = missingFields.length === 0;
  const metrics = isDataValid && data ? computeMetrics(data) : null;
  const status = determineStatus(data, metrics);

  if (status === 'INSUFFICIENT_DATA') {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.title}>Supply Emission Risk</span>
          <span style={styles.badge('INSUFFICIENT_DATA')}>INSUFFICIENT DATA</span>
        </div>
        <div style={styles.emptyState}>
          <span style={{ fontStyle: 'italic' }}>Missing: {missingFields.join(', ')}</span>
        </div>
      </div>
    );
  }

  const summary = generateSummary(metrics!, data!);
  const { signals } = metrics!;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Supply Emission Risk</span>
        <span style={styles.badge(status)}>{status}</span>
      </div>
      <p style={styles.summary}>{summary}</p>
      <div style={styles.signalsRow}>
        <SignalBadge label="Inflation" value={signals.inflationPressure} type={signals.inflationPressure} />
        <SignalBadge label="Dilution" value={signals.supplyDilutionTrend} type={signals.supplyDilutionTrend} />
        <SignalBadge label="Unlock" value={signals.unlockRiskFlag} type={signals.unlockRiskFlag} />
      </div>
      <div style={styles.metricsGrid}>
        <MetricCard label="Circulating" value={formatNumber(data!.circulatingSupply)} />
        <MetricCard label="Emission/Day" value={formatNumber(data!.emissionRate)} />
        <MetricCard label="Inflation %" value={`${metrics!.inflationPctAnnualized.toFixed(1)}%`} />
      </div>
      <details>
        <summary style={styles.rawDataToggle}>[Researcher Mode] View Raw Data</summary>
        <pre style={styles.rawDataPre}>{JSON.stringify(data, null, 2)}</pre>
      </details>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Mock Data Exports
// ─────────────────────────────────────────────────

export const MOCK_EMISSION_PASS: SupplyEmissionRiskInput = {
  circulatingSupply: 500_000_000,
  totalSupply: 1_000_000_000,
  maxSupply: 1_000_000_000,
  emissionRate: 30_000, // ~2.2% annualized
};

export const MOCK_EMISSION_WARNING: SupplyEmissionRiskInput = {
  circulatingSupply: 500_000_000,
  totalSupply: 1_000_000_000,
  maxSupply: 1_000_000_000,
  emissionRate: 100_000, // ~7.3% annualized
  unlockSchedule: [
    { date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), volume: 20_000_000, description: 'Team cliff unlock' },
  ],
};

export const MOCK_EMISSION_FAIL: SupplyEmissionRiskInput = {
  circulatingSupply: 500_000_000,
  totalSupply: 1_000_000_000,
  maxSupply: null,
  emissionRate: 200_000, // ~14.6% annualized
  unlockSchedule: [
    { date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), volume: 50_000_000, description: 'Large investor unlock' },
  ],
};
