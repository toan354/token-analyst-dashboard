/**
 * StatusAggregator Component
 * 
 * PURPOSE: Display aggregated L1 gatekeeper status with transparency list.
 * LAYER: L1 — Health & Risk Signals
 * 
 * RULES:
 * - Shows global status badge
 * - Lists triggering modules
 * - Displays ALL modules with individual statuses (no hiding)
 */

import { 
  AggregatedResult, 
  ModuleResult, 
  GlobalStatus,
  ModuleStatus 
} from '@/lib/status-aggregation';

interface StatusAggregatorProps {
  result: AggregatedResult;
}

// ─────────────────────────────────────────────────
// Scoped Styles
// ─────────────────────────────────────────────────

const styles = {
  container: {
    padding: '12px',
    backgroundColor: '#0f0f0f',
    borderRadius: '6px',
    marginBottom: '12px',
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
    fontWeight: 700,
    color: '#fafafa',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  globalBadge: (status: GlobalStatus) => ({
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '0.875rem',
    fontWeight: 700,
    backgroundColor: 
      status === 'PASS' ? '#14532d' : 
      status === 'WARNING' ? '#713f12' : 
      status === 'FAIL' ? '#7f1d1d' : '#27272a',
    color: 
      status === 'PASS' ? '#22c55e' : 
      status === 'WARNING' ? '#eab308' : 
      status === 'FAIL' ? '#ef4444' : '#71717a',
  }),
  summary: {
    fontSize: '0.875rem',
    color: '#a1a1aa',
    marginBottom: '12px',
    lineHeight: 1.5,
  },
  moduleList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  moduleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 8px',
    backgroundColor: '#18181b',
    borderRadius: '4px',
  },
  moduleName: {
    fontSize: '0.8125rem',
    color: '#fafafa',
  },
  moduleBadge: (status: ModuleStatus) => ({
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '0.6875rem',
    fontWeight: 600,
    backgroundColor: 
      status === 'PASS' ? '#14532d' : 
      status === 'WARNING' ? '#713f12' : 
      status === 'FAIL' ? '#7f1d1d' : '#27272a',
    color: 
      status === 'PASS' ? '#22c55e' : 
      status === 'WARNING' ? '#eab308' : 
      status === 'FAIL' ? '#ef4444' : '#71717a',
  }),
  triggerIndicator: {
    marginLeft: '6px',
    fontSize: '0.625rem',
    color: '#ef4444',
  },
} as const;

// ─────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────

function ModuleItem({ 
  module, 
  isTriggering 
}: { 
  module: ModuleResult; 
  isTriggering: boolean;
}) {
  return (
    <div style={styles.moduleRow}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={styles.moduleName}>{module.moduleName}</span>
        {isTriggering && <span style={styles.triggerIndicator}>● triggered</span>}
      </div>
      <span style={styles.moduleBadge(module.status)}>{module.status}</span>
    </div>
  );
}

export default function StatusAggregator({ result }: StatusAggregatorProps) {
  const { globalStatus, summaryText, triggeringModules, allModules } = result;

  return (
    <div style={styles.container}>
      {/* Header with Global Status */}
      <div style={styles.header}>
        <span style={styles.title}>Gatekeeper Status</span>
        <span style={styles.globalBadge(globalStatus)}>{globalStatus}</span>
      </div>

      {/* Summary */}
      <p style={styles.summary}>{summaryText}</p>

      {/* Transparency List — ALL modules shown */}
      <div style={styles.moduleList}>
        {allModules.map((module) => (
          <ModuleItem 
            key={module.moduleId}
            module={module}
            isTriggering={triggeringModules.includes(module.moduleId)}
          />
        ))}
      </div>
    </div>
  );
}
