/**
 * L0 - Executive Overview
 * 
 * Purpose: Quick glance summary for fast decisions
 * Content: Asset name, price, overall status, high-level flag count
 */

interface L0Props {
  assetName?: string;
  price?: string;
  status?: 'PASS' | 'WARNING' | 'FAIL' | 'UNKNOWN';
  flagCount?: number;
}

export default function L0_ExecutiveOverview({
  assetName = 'Asset Name',
  price = '$0.00',
  status = 'UNKNOWN',
  flagCount = 0
}: L0Props) {
  const statusClass = `status-${status.toLowerCase()}`;

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <span className="section-label">L0</span>
        <span className="section-title">Executive Overview</span>
      </div>
      <div className="section-content">
        <div className="flex-between" style={{ marginBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fafafa', marginBottom: '4px' }}>
              {assetName}
            </h2>
            <span style={{ fontSize: '1.25rem', fontWeight: 500, color: '#a1a1aa' }}>
              {price}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className={statusClass} style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {status}
            </div>
            <div className="text-muted text-small">
              {flagCount} flag{flagCount !== 1 ? 's' : ''} detected
            </div>
          </div>
        </div>
        {status === 'UNKNOWN' && (
          <div className="empty-state">
            No data available — awaiting analysis
          </div>
        )}
      </div>
    </section>
  );
}
