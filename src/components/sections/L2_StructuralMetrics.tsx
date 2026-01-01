/**
 * L2 - Structural Metrics
 * 
 * Purpose: Market structure analysis
 * Content: Supply, valuation, fundamentals
 * 
 * MODULES:
 * - MarketStructureOverviewModule: Market and supply structure context
 * - SupplyStructureOverviewModule: Token supply composition and distribution
 * - SupplyConcentrationModule: Token holder distribution analysis
 */

import MarketStructureOverviewModule, {
  MarketStructureInput,
  MOCK_BALANCED_STRUCTURE,
} from '@/components/modules/MarketStructureOverviewModule';
import SupplyConcentrationModule, { 
  SupplyConcentrationInput,
  MOCK_SUPPLY_CONCENTRATION_DATA 
} from '@/components/modules/SupplyConcentrationModule';
import SupplyStructureOverviewModule, {
  SupplyStructureInput,
  MOCK_BALANCED_SUPPLY,
} from '@/components/modules/SupplyStructureOverviewModule';

interface MetricItem {
  label: string;
  value: string;
  change?: string;
}

interface L2Props {
  metrics?: MetricItem[];
  marketStructure?: MarketStructureInput | null;
  marketStructureLoading?: boolean;
  marketStructureError?: string | null;
  supplyStructure?: SupplyStructureInput | null;
  supplyStructureLoading?: boolean;
  supplyStructureError?: string | null;
  supplyConcentration?: SupplyConcentrationInput | null;
  supplyConcentrationLoading?: boolean;
  supplyConcentrationError?: string | null;
  useMockData?: boolean;
}

const defaultMetrics: MetricItem[] = [
  { label: 'Market Cap', value: '--' },
  { label: 'Circulating Supply', value: '--' },
  { label: 'Max Supply', value: '--' },
  { label: 'FDV', value: '--' },
  { label: '24h Volume', value: '--' },
  { label: 'Vol/MCap Ratio', value: '--' },
];

export default function L2_StructuralMetrics({ 
  metrics = defaultMetrics,
  marketStructure,
  marketStructureLoading,
  marketStructureError,
  supplyStructure,
  supplyStructureLoading,
  supplyStructureError,
  supplyConcentration,
  supplyConcentrationLoading,
  supplyConcentrationError,
  useMockData = true
}: L2Props) {
  // Use mock data if enabled and no real data provided
  const structureData = marketStructure ?? (useMockData ? MOCK_BALANCED_STRUCTURE : null);
  const supplyData = supplyStructure ?? (useMockData ? MOCK_BALANCED_SUPPLY : null);
  const concentrationData = supplyConcentration ?? (useMockData ? MOCK_SUPPLY_CONCENTRATION_DATA : null);

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <span className="section-label">L2</span>
        <span className="section-title">Structural Metrics</span>
      </div>
      <div className="section-content">
        {/* Market Structure Overview (Context - No Status) */}
        <MarketStructureOverviewModule 
          data={structureData}
          isLoading={marketStructureLoading}
          error={marketStructureError}
        />

        {/* Supply Structure Overview (Context - No Status) */}
        <SupplyStructureOverviewModule 
          data={supplyData}
          isLoading={supplyStructureLoading}
          error={supplyStructureError}
        />

        {/* Quick Metrics Grid */}
        {metrics.length === 0 ? (
          <div className="empty-state">No metrics available</div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '16px',
            marginTop: '12px',
          }}>
            {metrics.map((metric, idx) => (
              <div key={idx} style={{ padding: '8px 0' }}>
                <div className="text-muted text-small" style={{ marginBottom: '4px' }}>
                  {metric.label}
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#fafafa' }}>
                  {metric.value}
                </div>
                {metric.change && (
                  <span className="text-small" style={{ 
                    color: metric.change.startsWith('+') ? '#22c55e' : metric.change.startsWith('-') ? '#ef4444' : '#a1a1aa' 
                  }}>
                    {metric.change}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Supply Concentration Module */}
        <SupplyConcentrationModule 
          data={concentrationData}
          isLoading={supplyConcentrationLoading}
          error={supplyConcentrationError}
        />
      </div>
    </section>
  );
}


