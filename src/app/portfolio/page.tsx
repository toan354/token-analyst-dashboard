'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PortfolioItem } from '../../lib/types';

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);

  useEffect(() => {
    const data = localStorage.getItem('analyst_portfolio');
    if (data) {
      setItems(JSON.parse(data));
    }
  }, []);

  return (
    <main className="container" style={{ padding: '40px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1>Portfolio Overview</h1>
        <Link href="/analyze" className="btn btn-primary">
          + New Analysis
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '80px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>No projects analyzed yet.</p>
        </div>
      ) : (
        <div className="grid-3">
          {items.map((item) => (
            <div key={item.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <h3 style={{ fontSize: '1.5rem' }}>{item.project.ticker}</h3>
                 <span style={{ 
                   color: item.analysis.score > 70 ? 'var(--status-success)' : 'orange',
                   fontWeight: 'bold'
                 }}>
                   {item.analysis.score.toFixed(1)}
                 </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{item.project.name}</p>
              <div style={{ margin: '16px 0', fontSize: '0.9rem' }}>
                <div style={{ color: 'var(--text-muted)' }}>{item.track}</div>
                <div>{item.analysis.summary}</div>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#555' }}>
                {new Date(item.date).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div style={{ marginTop: '40px' }}>
          <Link href="/" className="btn btn-outline">&larr; Back Home</Link>
      </div>
    </main>
  );
}
