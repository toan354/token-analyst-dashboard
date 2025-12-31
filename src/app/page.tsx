import Link from 'next/link';

export default function Home() {
  return (
    <main className="container" style={{ paddingTop: '80px', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '80px' }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '16px', background: 'linear-gradient(to right, #fff, #999)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ANALYST FRAMEWORK <span style={{ color: 'var(--brand-primary)', WebkitTextFillColor: 'initial' }}>v6.1</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 40px auto' }}>
          Facts. Context. Probabilities. <br/>
          The holistic edition for multi-threaded crypto analysis.
        </p>
        
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link href="/analyze" className="btn btn-primary">
            Start New Analysis
          </Link>
          <Link href="/portfolio" className="btn btn-outline">
            View Portfolio
          </Link>
        </div>
      </div>

      {/* Quick Stats / Modules Preview */}
      <div className="grid-3" style={{ width: '100%' }}>
        <div className="card">
          <h3 style={{ color: 'var(--brand-primary)', marginBottom: '8px' }}>GATEKEEPER</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Quick Scan & Kill Switch.</p>
          <div style={{ marginTop: '16px', fontSize: '0.9rem', color: 'var(--status-success)' }}>
            System Ready
          </div>
        </div>
        <div className="card">
          <h3 style={{ color: 'var(--brand-primary)', marginBottom: '8px' }}>DEEP DIVE</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Scoring Engines (A/B/C).</p>
          <div style={{ marginTop: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Wait for input...
          </div>
        </div>
        <div className="card">
          <h3 style={{ color: 'var(--brand-primary)', marginBottom: '8px' }}>PORTFOLIO</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Exposure & Lifecycle.</p>
          <div style={{ marginTop: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            No active positions
          </div>
        </div>
      </div>

    </main>
  );
}
