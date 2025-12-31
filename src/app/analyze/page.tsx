'use client';

import { useState } from 'react';
import { Track, SecurityTier, GatekeeperData, DeepDiveData, GatekeeperResult, AssessmentResult, PortfolioItem } from '../../lib/types';
import { runGatekeeper } from '../../lib/gatekeeper';
import { runDeepDiveAnalysis } from '../../lib/scoring';
import Link from 'next/link';

export default function AnalyzePage() {
  const [step, setStep] = useState(1);
  const [project, setProject] = useState({ name: '', ticker: '' });
  const [track, setTrack] = useState<Track | null>(null);
  
  // Gatekeeper State
  const [gatekeeperData, setGatekeeperData] = useState<GatekeeperData>({
    sanctionRisk: false,
    criticalSecurityBug: false,
    deadLiquidity: false,
    auditOrBacker: false,
    productOrTeam: false,
    marketRiskSafe: false,
    dataDrivenNarrative: false,
  });
  
  const [gatekeeperResult, setGatekeeperResult] = useState<GatekeeperResult | null>(null);

  // Deep Dive State
  const [deepDiveData, setDeepDiveData] = useState<DeepDiveData>({
    runwayMonths: 12,
    securityTier: SecurityTier.Safe,
    userGrowthScore: 5,
    devActivityScore: 5,
    integrationScore: 5,
    userRetentionRate: 50,
    teamPedigreeScore: 0,
    backerScore: 0,
    techNoveltyScore: 0,
    moatScore: 0,
    communityOrganicScore: 0,
    devEngagementScore: 0,
    revenueToEmissionTrend: 'stable',
    mercenaryRetentionRate: 100,
  });

  const [finalResult, setFinalResult] = useState<AssessmentResult | null>(null);

  const handleGatekeeperSubmit = () => {
    if (!track) return;
    const result = runGatekeeper(gatekeeperData, track);
    setGatekeeperResult(result);
    if (!result.killSwitchTriggered && result.passed) {
      setStep(3);
    } else {
      setStep(99); // Rejected Screen
    }
  };

  const saveToPortfolio = (analysis: AssessmentResult) => {
    if (!track) return;
    const newEntry: PortfolioItem = {
      id: Date.now().toString(),
      project,
      track,
      analysis,
      date: new Date().toISOString(),
    };
    
    // Quick and dirty localStorage persistence
    try {
      const existing = JSON.parse(localStorage.getItem('analyst_portfolio') || '[]');
      localStorage.setItem('analyst_portfolio', JSON.stringify([newEntry, ...existing]));
    } catch (e) {
      console.error('Failed to save', e);
    }
  };

  const handleDeepDiveSubmit = () => {
    if (!track) return;
    const analysis = runDeepDiveAnalysis(deepDiveData, track);
    setFinalResult(analysis);
    saveToPortfolio(analysis);
    setStep(4); // Report Screen
  };

  // Render Helpers
  const renderStep1 = () => (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>Based on facts. <span style={{color: 'var(--brand-primary)'}}>Start Analysis.</span></h2>
      <div style={{ marginTop: '24px' }}>
        <input 
          placeholder="Project Name" 
          value={project.name}
          onChange={e => setProject({...project, name: e.target.value})}
          style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #444', color: '#fff', marginBottom: '12px', borderRadius: '4px' }}
        />
        <input 
          placeholder="Ticker ($XYZ)" 
          value={project.ticker}
          onChange={e => setProject({...project, ticker: e.target.value.toUpperCase()})}
          style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #444', color: '#fff', marginBottom: '24px', borderRadius: '4px' }}
        />
        
        <h3>Select Track</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '12px' }}>
          {[Track.A, Track.B, Track.C].map(t => (
            <button 
              key={t}
              onClick={() => setTrack(t)}
              className={track === t ? 'btn btn-primary' : 'btn btn-outline'}
              style={{ flexDirection: 'column', gap: '8px', padding: '24px' }}
            >
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{t.split('_')[1]}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                {t === Track.A ? 'Est. Value' : t === Track.B ? 'Scaling' : 'Early Alpha'}
              </div>
            </button>
          ))}
        </div>

        <button 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '32px' }}
          disabled={!track || !project.name}
          onClick={() => setStep(2)}
        >
          Initialize Gatekeeper &rarr;
        </button>
      </div>
    </div>
  );

  const renderGatekeeper = () => (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>The Gatekeeper</h2>
        <div style={{ fontSize: '0.9rem', color: '#888' }}>15 Minute Check</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <div>
          <h3 style={{ color: 'var(--status-error)', marginBottom: '16px' }}>☠️ KILL SWITCH</h3>
          {[
            { key: 'sanctionRisk', label: 'Sanction Risk / Money Laundering' },
            { key: 'criticalSecurityBug', label: 'Critical Security / Timelock < 24h' },
            { key: 'deadLiquidity', label: 'Dead Liquidity (< $50k)' }
          ].map(item => (
            <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer', padding: '12px', background: '#1a0505', border: '1px solid #330505', borderRadius: '4px' }}>
              <input 
                type="checkbox" 
                checked={gatekeeperData[item.key as keyof GatekeeperData] as boolean}
                onChange={e => setGatekeeperData({...gatekeeperData, [item.key]: e.target.checked})}
                style={{ width: '20px', height: '20px', accentColor: 'red' }}
              />
              <span style={{ color: '#ffaaaa' }}>{item.label}</span>
            </label>
          ))}
        </div>

        <div>
           <h3 style={{ color: 'var(--status-success)', marginBottom: '16px' }}>✅ PASS CRITERIA (Need 3/4)</h3>
           {[
            { key: 'auditOrBacker', label: 'Audited (A/B) or Tier 1 Backer (C)' },
            { key: 'productOrTeam', label: 'Live Product or Star Team' },
            { key: 'marketRiskSafe', label: 'Unlock Absorption Safe' },
            { key: 'dataDrivenNarrative', label: 'Trending Sector (Cashflow)' }
           ].map(item => (
             <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer', padding: '12px', background: '#051a05', border: '1px solid #053305', borderRadius: '4px' }}>
              <input 
                type="checkbox" 
                checked={gatekeeperData[item.key as keyof GatekeeperData] as boolean}
                onChange={e => setGatekeeperData({...gatekeeperData, [item.key]: e.target.checked})}
                style={{ width: '20px', height: '20px', accentColor: '#00e676' }}
              />
              <span style={{ color: '#aaffcc' }}>{item.label}</span>
            </label>
           ))}
        </div>
      </div>

      <button className="btn btn-primary" style={{ width: '100%', marginTop: '32px' }} onClick={handleGatekeeperSubmit}>
        Run Gatekeeper Check
      </button>
    </div>
  );

  const renderDeepDive = () => (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Deep Dive: {track}</h2>
      
      <div style={{ marginTop: '24px' }}>
        <h4 style={{ color: 'var(--text-secondary)' }}>Security & Health</h4>
        <div className="grid-2">
          <label>
            Runway (Months)
            <input 
              type="number" 
              value={deepDiveData.runwayMonths}
              onChange={e => setDeepDiveData({...deepDiveData, runwayMonths: parseInt(e.target.value)})}
              style={{ display: 'block', width: '100%', padding: '8px', background: '#222', border: '1px solid #444', color: '#fff', marginTop: '4px' }}
            />
          </label>
           <label>
            Security Tier
            <select
              value={deepDiveData.securityTier}
              onChange={e => setDeepDiveData({...deepDiveData, securityTier: e.target.value as SecurityTier})}
              style={{ display: 'block', width: '100%', padding: '8px', background: '#222', border: '1px solid #444', color: '#fff', marginTop: '4px' }}
            >
              {Object.values(SecurityTier).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        </div>

        <hr style={{ margin: '24px 0', borderColor: '#333' }} />

        {track === Track.B && (
          <>
            <h4>AV Index Inputs (0-10)</h4>
            <div className="grid-2">
              <label>User Growth <input type="number" max="10" value={deepDiveData.userGrowthScore} onChange={e => setDeepDiveData({...deepDiveData, userGrowthScore: +e.target.value})} /></label>
              <label>Dev Activity <input type="number" max="10" value={deepDiveData.devActivityScore} onChange={e => setDeepDiveData({...deepDiveData, devActivityScore: +e.target.value})} /></label>
              <label>Integration <input type="number" max="10" value={deepDiveData.integrationScore} onChange={e => setDeepDiveData({...deepDiveData, integrationScore: +e.target.value})} /></label>
              <label>Retention % <input type="number" max="100" value={deepDiveData.userRetentionRate} onChange={e => setDeepDiveData({...deepDiveData, userRetentionRate: +e.target.value})} /></label>
            </div>
          </>
        )}
        
        {track === Track.C && (
           <>
            <h4>Alpha Scorecard Inputs (Points)</h4>
             <div className="grid-2">
              <label>Team Pedigree (Max 25) <input type="number" value={deepDiveData.teamPedigreeScore} onChange={e => setDeepDiveData({...deepDiveData, teamPedigreeScore: +e.target.value})} /></label>
              <label>Smart Money/Backer (Max 25) <input type="number" value={deepDiveData.backerScore} onChange={e => setDeepDiveData({...deepDiveData, backerScore: +e.target.value})} /></label>
              <label>Tech Novelty (Max 15) <input type="number" value={deepDiveData.techNoveltyScore} onChange={e => setDeepDiveData({...deepDiveData, techNoveltyScore: +e.target.value})} /></label>
              <label>Moat (Max 15) <input type="number" value={deepDiveData.moatScore} onChange={e => setDeepDiveData({...deepDiveData, moatScore: +e.target.value})} /></label>
            </div>
           </>
        )}

        <button className="btn btn-primary" style={{ width: '100%', marginTop: '32px' }} onClick={handleDeepDiveSubmit}>
          Calculate Final Score
        </button>  
      </div>
    </div>
  );

  const renderRejection = () => (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', borderColor: 'var(--status-error)' }}>
      <h1 style={{ color: 'var(--status-error)', fontSize: '4rem' }}>REJECTED</h1>
      <p style={{ fontSize: '1.5rem', marginBottom: '24px' }}>The project failed the Gatekeeper protocol.</p>
      
      <div style={{ textAlign: 'left', background: '#300', padding: '16px', borderRadius: '8px' }}>
        <ul>
          {gatekeeperResult?.rejections.map((r, i) => (
            <li key={i} style={{ color: '#ffaaaa', marginBottom: '8px' }}>{r}</li>
          ))}
        </ul>
      </div>

      <button className="btn btn-outline" style={{ marginTop: '32px' }} onClick={() => window.location.reload()}>Start Over</button>
    </div>
  );

  const renderReport = () => (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div className="card" style={{ borderColor: 'var(--brand-primary)' }}>
         {/* Success Badge */}
         <div style={{ textAlign: 'center', marginBottom: '16px', color: 'var(--status-success)' }}>
            ✓ Analysis Saved to Portfolio
         </div>

         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '3rem' }}>{project.ticker}</h1>
              <p style={{ color: 'var(--text-secondary)' }}>{project.name} | {track}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--brand-primary)' }}>
                {(finalResult?.score ?? 0).toFixed(1)}
              </div>
              <div>Final Score</div>
            </div>
         </div>

         <hr style={{ margin: '32px 0', borderColor: '#333' }} />

         <div className="grid-2">
            <div>
              <h3>Summary</h3>
              <p className="highlight">{finalResult?.summary ?? 'No summary available'}</p>
            </div>
            <div>
              <h3>Financial Health</h3>
              <p style={{ 
                color: finalResult?.financialHealth === 'Critical' ? 'red' : 
                       finalResult?.financialHealth === 'Risk' ? 'orange' : 'green',
                fontWeight: 'bold', fontSize: '1.2rem'
              }}>
                {finalResult?.financialHealth ?? 'Unknown'}
              </p>
            </div>
         </div>

         <div style={{ marginTop: '40px', padding: '24px', background: '#222', borderRadius: '8px' }}>
            <h3>Analyst Signal</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '16px' }}>
              {(finalResult?.score ?? 0) > 70 ? <span style={{color: 'var(--status-success)'}}>INVESTIGATE (Position Size: Med)</span> : 
               (finalResult?.score ?? 0) > 50 ? <span style={{color: 'orange'}}>MONITOR</span> : 
               <span style={{color: 'red'}}>NO BET</span>}
            </div>
         </div>

         <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
            <button className="btn btn-primary" onClick={() => window.print()}>Export PDF</button>
            <Link href="/portfolio" className="btn btn-outline">Go to Portfolio</Link>
         </div>
      </div>
    </div>
  );

  return (
    <main style={{ padding: '40px 0', minHeight: '100vh' }}>
      {step === 1 && renderStep1()}
      {step === 2 && renderGatekeeper()}
      {step === 3 && renderDeepDive()}
      {step === 4 && renderReport()}
      {step === 99 && renderRejection()}
    </main>
  );
}
