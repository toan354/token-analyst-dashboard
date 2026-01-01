/**
 * ContextBar - Optional small context indicator
 * 
 * STRICT RULES:
 * - Small, compact bar
 * - flex-shrink: 0
 * - NO scrolling
 */

interface ContextBarProps {
  chain?: string;
  timeframe?: string;
  mode?: 'Analyst' | 'Research';
}

export default function ContextBar({
  chain = 'Ethereum',
  timeframe = '24h',
  mode = 'Analyst'
}: ContextBarProps) {
  return (
    <div className="context-bar">
      <div className="flex-row">
        <span>
          <strong>Chain:</strong> {chain}
        </span>
        <span className="text-muted">•</span>
        <span>
          <strong>Timeframe:</strong> {timeframe}
        </span>
        <span className="text-muted">•</span>
        <span>
          <strong>Mode:</strong>{' '}
          <span style={{ 
            color: mode === 'Analyst' ? '#3b82f6' : '#8b5cf6',
            fontWeight: 500 
          }}>
            {mode}
          </span>
        </span>
      </div>
    </div>
  );
}
