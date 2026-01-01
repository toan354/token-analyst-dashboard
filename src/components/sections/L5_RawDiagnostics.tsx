/**
 * L5 - Raw & Diagnostics
 * 
 * Purpose: Debug info and raw data access
 * Content: Raw values, data quality, system diagnostics
 */

interface DiagnosticItem {
  key: string;
  value: string;
  status?: 'ok' | 'warn' | 'error';
}

interface L5Props {
  diagnostics?: DiagnosticItem[];
  rawData?: Record<string, unknown>;
}

const defaultDiagnostics: DiagnosticItem[] = [
  { key: 'Data Source', value: 'Not connected', status: 'warn' },
  { key: 'Last Fetch', value: '--', status: 'ok' },
  { key: 'Cache Status', value: 'Empty', status: 'ok' },
  { key: 'API Latency', value: '--', status: 'ok' },
];

export default function L5_RawDiagnostics({ 
  diagnostics = defaultDiagnostics,
  rawData
}: L5Props) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'error': return '#ef4444';
      case 'warn': return '#eab308';
      default: return '#22c55e';
    }
  };

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <span className="section-label">L5</span>
        <span className="section-title">Raw & Diagnostics</span>
      </div>
      <div className="section-content">
        {/* Diagnostics Table */}
        <div style={{ marginBottom: '16px' }}>
          <h4 className="text-small" style={{ color: '#71717a', marginBottom: '8px' }}>
            System Diagnostics
          </h4>
          <div className="flex-col">
            {diagnostics.map((item, idx) => (
              <div key={idx} className="flex-between" style={{ 
                padding: '6px 8px', 
                backgroundColor: '#0f0f0f',
                borderRadius: '2px',
                marginBottom: '4px'
              }}>
                <span className="font-mono text-small" style={{ color: '#a1a1aa' }}>
                  {item.key}
                </span>
                <span className="font-mono text-small" style={{ color: getStatusColor(item.status) }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Raw Data Preview */}
        <div>
          <h4 className="text-small" style={{ color: '#71717a', marginBottom: '8px' }}>
            Raw Data
          </h4>
          <pre style={{ 
            padding: '12px', 
            backgroundColor: '#0f0f0f', 
            borderRadius: '4px',
            fontSize: '0.75rem',
            color: '#71717a',
            overflow: 'auto',
            maxHeight: '200px'
          }}>
            {rawData ? JSON.stringify(rawData, null, 2) : '{ "status": "No data loaded" }'}
          </pre>
        </div>
      </div>
    </section>
  );
}
