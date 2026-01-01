'use client';

import { useState } from 'react';
import ActivitySection from '@/components/ActivitySection';
import LifecycleSection from '@/components/LifecycleSection';
import TrackClassifierSection from '@/components/TrackClassifierSection';
import DevActivitySection from '@/components/DevActivitySection';
import FlowSection from '@/components/FlowSection';
import TreasurySection from '@/components/TreasurySection';
import ThesisSection from '@/components/ThesisSection';
import SummaryCard from '@/components/SummaryCard';

import { TokenData, GatekeeperResult } from '@/lib/types';
import { fetchTokenData, searchTokens } from '@/lib/api';
import { assessGatekeeper } from '@/lib/analysis';
import { assessZombieStatus, ZombieAnalysis } from '@/lib/zombie';
import { LifecycleResult } from '@/lib/lifecycle';
import { DevAnalysisResult } from '@/lib/dev-analysis';
import { FlowAnalysisResult } from '@/lib/flow';
import { TreasuryAnalysis } from '@/lib/treasury';

export default function Home() {
  const [query, setQuery] = useState('');
  const [token, setToken] = useState<TokenData | null>(null);
  const [gatekeeperResult, setGatekeeperResult] = useState<GatekeeperResult | null>(null);
  
  // Module Results State
  const [zombieAnalysis, setZombieAnalysis] = useState<ZombieAnalysis | null>(null);
  const [lifecycleResult, setLifecycleResult] = useState<LifecycleResult | null>(null);
  const [devResult, setDevResult] = useState<DevAnalysisResult | undefined>();
  const [flowResult, setFlowResult] = useState<FlowAnalysisResult | undefined>();
  const [treasuryResult, setTreasuryResult] = useState<TreasuryAnalysis | undefined>();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    setError('');
    // Reset all states
    setToken(null);
    setGatekeeperResult(null);
    setZombieAnalysis(null);
    setLifecycleResult(null);
    setDevResult(undefined);
    setFlowResult(undefined);
    setTreasuryResult(undefined);

    try {
      let tokenId = query.toLowerCase().trim();
      const searchResults = await searchTokens(query);
      if (searchResults.length > 0) {
          tokenId = searchResults[0].id; // Use first match ID
      }

      const data = await fetchTokenData(tokenId);
      if (data) {
        setToken(data);
        setGatekeeperResult(assessGatekeeper(data));
      } else {
        setError('Token not found. Try using the exact CoinGecko ID.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: val < 1 ? 6 : 2,
    }).format(val);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Visual */}
      <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
         <svg className="w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
             <defs>
                 <radialGradient id="grad1" cx="0%" cy="0%" r="50%" fx="0%" fy="0%">
                     <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.2 }} />
                     <stop offset="100%" style={{ stopColor: '#1e293b', stopOpacity: 0 }} />
                 </radialGradient>
                 <radialGradient id="grad2" cx="100%" cy="100%" r="50%" fx="100%" fy="100%">
                     <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.2 }} />
                     <stop offset="100%" style={{ stopColor: '#1e293b', stopOpacity: 0 }} />
                 </radialGradient>
             </defs>
             <rect width="100%" height="100%" fill="url(#grad1)" />
             <rect width="100%" height="100%" fill="url(#grad2)" />
         </svg>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-6">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
          Analyst Dashboard
        </h1>
        <p className="text-gray-400">Local-First Crypto Health Monitor</p>
      </header>

      {/* Summary Risk Dashboard */}
      <section className="mb-12 p-6 rounded-xl border border-slate-700 bg-slate-900/50 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-2">Executive Risk Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Gatekeeper Card */}
              <SummaryCard
                title="Token Metrics"
                value={gatekeeperResult ? gatekeeperResult.status : 'Waiting for Search...'}
                variant={
                  !gatekeeperResult ? 'empty' :
                  gatekeeperResult.status === 'PASS' ? 'success' :
                  gatekeeperResult.status === 'WARN' ? 'warning' : 'danger'
                }
              />

               {/* Zombie Status Card */}
               <SummaryCard
                title="Network Trend"
                value={zombieAnalysis ? zombieAnalysis.status.replace('_', ' ') : 'Waiting for Scan...'}
                variant={
                  !zombieAnalysis ? 'empty' :
                  zombieAnalysis.status === 'HEALTHY' ? 'success' :
                  zombieAnalysis.status === 'WEAKENING' ? 'warning' :
                  zombieAnalysis.status === 'ZOMBIE_RISK' ? 'danger' : 'neutral'
                }
               />

              {/* Lifecycle Card */}
              <SummaryCard
                title="Lifecycle Status"
                value={lifecycleResult ? lifecycleResult.status.replace(/_/g, ' ') : 'Set Start Date'}
                variant={
                  !lifecycleResult ? 'empty' :
                  lifecycleResult.status === 'ON_TRACK' || lifecycleResult.status === 'EARLY_STAGE' ? 'success' :
                  lifecycleResult.status === 'EXECUTION_LAG' ? 'warning' : 'danger'
                }
              />

              {/* Overall Verdict */}
              <SummaryCard
                title="Total Flags"
                value={`${(gatekeeperResult?.flags.length || 0) + 
                       (lifecycleResult?.flags.length || 0) + 
                       (zombieAnalysis?.status === 'ZOMBIE_RISK' ? 1 : 0) +
                       (devResult?.status === 'INACTIVE' ? 1 : 0) +
                       (treasuryResult?.riskLevel === 'CRITICAL' ? 1 : 0)
                      } Active`}
                variant="neutral"
              />

          </div>
      </section>

      {/* Tool 1: Token Gatekeeper Search */}
      <section className="mb-12">
        <form onSubmit={handleSearch} className="flex gap-4 max-w-lg mx-auto mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Token (e.g. bitcoin)..."
            className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-base focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-base font-medium transition-colors disabled:opacity-50 shadow-lg shadow-blue-900/20"
          >
            {loading ? '...' : 'Check'}
          </button>
        </form>
        {error && <p className="text-red-400 text-center mt-4">{error}</p>}
        
        {token && gatekeeperResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="glass-card p-6 col-span-1 md:col-span-2 flex items-center justify-between">
             <div>
                <h2 className="text-3xl font-bold text-white mb-1">{token.name} <span className="text-lg text-gray-500 font-medium">({token.symbol})</span></h2>
                <span className="text-2xl font-mono text-blue-300">{formatCurrency(token.current_price)}</span>
             </div>
             <div className={`px-4 py-2 rounded-lg font-bold border ${
                 gatekeeperResult.status === 'PASS' ? 'status-pass' : 
                 gatekeeperResult.status === 'WARN' ? 'status-warn' : 'status-fail'
             }`}>
                 {gatekeeperResult.status}
             </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-4 border-b border-white/10 pb-2">Market Data</h3>
            <div className="grid grid-cols-2 gap-y-6">
                <div>
                    <div className="metric-label">Market Cap</div>
                    <div className="metric-value">{formatCurrency(token.market_cap)}</div>
                </div>
                <div>
                    <div className="metric-label">Fd. Valuation</div>
                    <div className="metric-value">{token.fully_diluted_valuation ? formatCurrency(token.fully_diluted_valuation) : 'N/A'}</div>
                </div>
                <div>
                    <div className="metric-label">24h Volume</div>
                    <div className="metric-value text-blue-200">{formatCurrency(token.total_volume)}</div>
                </div>
                <div>
                    <div className="metric-label">Circ. Supply</div>
                    <div className="metric-value">{formatNumber(token.circulating_supply)}</div>
                </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-4 border-b border-white/10 pb-2">Gatekeeper Report</h3>
            
            {gatekeeperResult.flags.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-40 text-green-400">
                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p>No Risk Flags Detected</p>
                 </div>
            ) : (
                <ul className="space-y-3">
                    {gatekeeperResult.flags.map((flag, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-red-300 bg-red-900/20 p-3 rounded-lg border border-red-500/20">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            <span>{flag}</span>
                        </li>
                    ))}
                </ul>
            )}
          </div>

        </div>
      )}
      </section>

      {/* Thesis & Discipline Layer (Top of Analysis Tools) */}
      <section className="mb-8">
           <ThesisSection 
              devResult={devResult}
              flowResult={flowResult}
              treasuryResult={treasuryResult}
           />
      </section>

      {/* Tool 2: Network Pulse, Lifecycle, & Classifier */}
      <section className="mt-12 space-y-8">
          <ActivitySection 
              onAnalysisChange={setZombieAnalysis} 
          />
          
          <LifecycleSection 
              zombieStatus={zombieAnalysis?.status || 'INSUFFICIENT_DATA'} 
              onResultChange={setLifecycleResult}
          />

          <TrackClassifierSection
              tokenData={token}
              zombieStatus={zombieAnalysis?.status || 'INSUFFICIENT_DATA'}
          />

          <DevActivitySection onAnalysisComplete={setDevResult} />
          
          <FlowSection 
              tokenData={token} 
              onAnalysisComplete={setFlowResult}
          />
          
          <TreasurySection 
              tokenData={token}
              onAnalysisComplete={setTreasuryResult}
          />
      </section>
      </main>
    </div>
  );
}
