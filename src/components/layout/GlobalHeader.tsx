/**
 * GlobalHeader - Fixed height header (≤100px)
 * 
 * STRICT RULES:
 * - max-height: 100px, min-height: 48px
 * - NO position: absolute/fixed
 * - NO scrolling
 */

interface GlobalHeaderProps {
  assetName?: string;
  lastUpdated?: string;
}

export default function GlobalHeader({ 
  assetName = 'No Asset Selected',
  lastUpdated = '--'
}: GlobalHeaderProps) {
  return (
    <header className="global-header">
      <div className="flex-between">
        {/* App Title */}
        <div className="flex-row">
          <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fafafa' }}>
            Analyst Terminal
          </h1>
          <span className="text-muted text-small">v6.1</span>
        </div>

        {/* Asset Selector */}
        <div className="flex-row">
          <span className="text-small" style={{ color: '#fafafa', fontWeight: 500 }}>
            {assetName}
          </span>
          <span className="text-muted text-small">|</span>
          <span className="text-muted text-small font-mono">
            Updated: {lastUpdated}
          </span>
        </div>
      </div>
    </header>
  );
}
