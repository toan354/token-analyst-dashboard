'use client';

import { useState } from 'react';
import { 
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend 
} from 'recharts';
import { analyzeTreasury, TreasuryAnalysis } from '@/lib/treasury';
import { TokenData } from '@/lib/types';

interface Props {
    tokenData: TokenData | null;
    onAnalysisComplete?: (result: TreasuryAnalysis) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function TreasurySection({ tokenData, onAnalysisComplete }: Props) {
    const [address, setAddress] = useState('');
    const [manualBurn, setManualBurn] = useState('');
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<TreasuryAnalysis | null>(null);

    const handleAnalyze = async () => {
        if (!tokenData) return;
        if (!address) {
            alert("Please enter a Treasury Address");
            return;
        }

        setLoading(true);
        try {
            const burn = manualBurn ? parseFloat(manualBurn) : undefined;
            const res = await analyzeTreasury(address, tokenData, burn);
            setAnalysis(res);
            if (onAnalysisComplete) onAnalysisComplete(res);
        } catch (e: any) {
            console.error(e);
            alert("Failed to analyze treasury: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    if (!tokenData) return null;

    return (
        <div className="glass-card p-6 border-t-4 border-t-emerald-500 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 mt-6">
             <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-white">Treasury Health & Runway</h2>
                    <p className="text-xs text-gray-400">Survival Analysis (Base vs Stress)</p>
                 </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 <div>
                     <label className="block text-xs text-gray-400 mb-1">Treasury Wallet Address (ETH Mainnet)</label>
                     <input 
                        type="text"
                        placeholder="0x..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500 font-mono text-sm"
                     />
                 </div>
                 <div>
                     <label className="block text-xs text-gray-400 mb-1">Manual Monthly Burn ($) - Optional</label>
                     <input 
                        type="number"
                        placeholder="e.g. 50000"
                        value={manualBurn}
                        onChange={(e) => setManualBurn(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500"
                     />
                     <span className="text-[10px] text-gray-500">Leave empty to auto-estimate from stablecoin outflows.</span>
                 </div>
             </div>

             <button 
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold transition-colors disabled:opacity-50 mb-8"
             >
                 {loading ? 'Analyzing On-Chain Assets...' : 'Calculate Runway'}
             </button>

             {analysis && (
                 <div className="animate-in fade-in duration-500">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                         {/* Breakdowns */}
                         <div>
                             <h3 className="text-sm font-bold text-gray-300 mb-4">Asset Composition</h3>
                             <div className="h-64 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={analysis.assets as any[]}
                                            dataKey="valueUsd"
                                            nameKey="symbol"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            label={(entry: any) => entry.symbol}
                                        >
                                            {analysis.assets.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: any) => `$${Number(value).toLocaleString()}`} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                    <div className="text-xs text-gray-400">Total</div>
                                    <div className="text-sm font-bold text-white">${(analysis.totalValueUsd / 1000000).toFixed(1)}M</div>
                                </div>
                             </div>
                         </div>

                         {/* Results */}
                         <div className="space-y-6">
                             <div className={`p-4 rounded-xl border ${
                                 analysis.riskLevel === 'HEALTHY' ? 'bg-green-900/10 border-green-500/30' :
                                 analysis.riskLevel === 'CAUTION' ? 'bg-yellow-900/10 border-yellow-500/30' :
                                 'bg-red-900/10 border-red-500/30'
                             }`}>
                                 <div className="flex justify-between items-center mb-2">
                                     <span className="text-sm text-gray-400">Financial Health</span>
                                     <span className={`px-2 py-1 rounded text-xs font-bold ${
                                         analysis.riskLevel === 'HEALTHY' ? 'bg-green-500/20 text-green-400' :
                                         analysis.riskLevel === 'CAUTION' ? 'bg-yellow-500/20 text-yellow-400' :
                                         'bg-red-500/20 text-red-400'
                                     }`}>
                                         {analysis.riskLevel}
                                     </span>
                                 </div>
                                 <div className="space-y-1">
                                    {analysis.flags.map((flag, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                                            <span className="text-red-400">⚠️</span> {flag}
                                        </div>
                                    ))}
                                    {analysis.flags.length === 0 && (
                                        <div className="text-xs text-green-400">No major financial risks detected.</div>
                                    )}
                                 </div>
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                 <div className="bg-slate-800 p-3 rounded-lg">
                                     <div className="text-xs text-gray-400">Base Runway</div>
                                     <div className="text-2xl font-bold text-white">
                                         {Math.floor(analysis.runwayMonths)} <span className="text-sm font-normal text-gray-500">mo</span>
                                     </div>
                                 </div>
                                 <div className="bg-slate-800 p-3 rounded-lg border border-red-500/20">
                                     <div className="text-xs text-red-400">Stress Test (-50%)</div>
                                     <div className="text-2xl font-bold text-red-100">
                                         {Math.floor(analysis.stressRunwayMonths)} <span className="text-sm font-normal text-red-400/70">mo</span>
                                     </div>
                                 </div>
                             </div>

                             <div className="bg-slate-800 p-3 rounded-lg">
                                 <div className="flex justify-between items-end">
                                     <div>
                                         <div className="text-xs text-gray-400">Est. Monthly Burn</div>
                                         <div className="text-lg font-bold text-white">${analysis.estimatedMonthlyBurn.toLocaleString()}</div>
                                     </div>
                                     <div className="text-[10px] text-gray-500">
                                         Source: {analysis.burnRateSource === 'MANUAL_INPUT' ? 'User Input' : 'Auto (Stablecoin Outflows)'}
                                     </div>
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
             )}
        </div>
    );
}
