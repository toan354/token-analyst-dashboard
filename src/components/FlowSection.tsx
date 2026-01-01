'use client';

import { useState } from 'react';
import { 
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, TooltipProps, CartesianGrid 
} from 'recharts';
import { fetchFlowData, FlowAnalysisResult } from '@/lib/flow';
import { TokenData } from '@/lib/types';

interface Props {
    tokenData: TokenData | null;
    onAnalysisComplete?: (result: FlowAnalysisResult) => void;
}

export default function FlowSection({ tokenData, onAnalysisComplete }: Props) {
    const [poolAddress, setPoolAddress] = useState('');
    const [whaleThreshold, setWhaleThreshold] = useState('10000');
    const [thesis, setThesis] = useState<'ACCUMULATION' | 'ORGANIC_GROWTH' | 'DISTRIBUTION'>('ACCUMULATION');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [analysis, setAnalysis] = useState<FlowAnalysisResult | null>(null);

    const handleAnalyze = async () => {
        if (!tokenData) return;
        setLoading(true);
        setError('');
        
        // Use a default platform address from CoinGecko if available, else require manual
        // CG data sometimes has 'platforms' { 'ethereum': '0x...' }
        const address = tokenData.platforms?.['ethereum'] || tokenData.platforms?.['base'] || '';
        
        if (!address) {
            setError('Could not invoke RPC: No Chain Address found for this token in CoinGecko data. Please try an ETH/EVM token.');
            setLoading(false);
            return;
        }

        try {
            const res = await fetchFlowData({
                tokenAddress: address,
                poolAddress: poolAddress || undefined, // Optional
                cexAddresses: [], // Advanced feature left empty for now
                whaleThreshold: parseFloat(whaleThreshold),
                thesis
            });
            setAnalysis(res);
            if (onAnalysisComplete) onAnalysisComplete(res);
        } catch (err: any) {
            setError(err.message || 'Failed to analyze flows. Ensure RPC is working and address is valid.');
        } finally {
            setLoading(false);
        }
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border border-slate-700 p-2 rounded shadow-xl">
                    <p className="text-gray-300 text-xs mb-1">{label}</p>
                    <p className="text-blue-400 font-bold text-sm">
                        Net: {payload[0].value.toFixed(2)}
                    </p>
                    <p className="text-green-400 text-xs">
                        In: {payload[0].payload.inflow.toFixed(2)}
                    </p>
                    <p className="text-red-400 text-xs">
                        Out: {payload[0].payload.outflow.toFixed(2)}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (!tokenData) return null;

    return (
        <div className="glass-card p-6 border-t-4 border-t-cyan-500 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
             <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-white">On-Chain Flow Validator</h2>
                    <p className="text-xs text-gray-400">Confirm Thesis with Money Flow (Last 24-36h)</p>
                 </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 <div>
                     <label className="block text-xs text-gray-400 mb-1">Thesis to Validate</label>
                     <select 
                        value={thesis}
                        onChange={(e) => setThesis(e.target.value as any)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
                     >
                         <option value="ACCUMULATION">Accumulation (Whales Buying)</option>
                         <option value="ORGANIC_GROWTH">Organic Growth (Steady Flow)</option>
                         <option value="DISTRIBUTION">Distribution (Whales Selling)</option>
                     </select>
                 </div>
                 <div>
                     <label className="block text-xs text-gray-400 mb-1">Whale Threshold (Tokens)</label>
                     <input 
                        type="number"
                        value={whaleThreshold}
                        onChange={(e) => setWhaleThreshold(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
                     />
                 </div>
                 <div className="col-span-1 md:col-span-2">
                     <label className="block text-xs text-gray-400 mb-1">Liquidity Pool Address (Optional, for buy/sell detection)</label>
                     <input 
                        type="text"
                        placeholder="0x... (e.g. Uniswap Pool)"
                        value={poolAddress}
                        onChange={(e) => setPoolAddress(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500 font-mono text-sm"
                     />
                 </div>
             </div>

             <button 
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white font-bold transition-colors disabled:opacity-50 mb-6"
             >
                 {loading ? 'Scanning Blockchain...' : 'Validate Thesis'}
             </button>

             {error && (
                 <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-sm mb-6">
                     {error}
                 </div>
             )}

             {analysis && (
                 <div className="animate-in fade-in duration-500">
                     <div className={`p-4 rounded-xl border mb-6 flex items-start gap-4 ${
                         analysis.thesisStatus === 'VALID' ? 'bg-green-900/10 border-green-500/30' :
                         analysis.thesisStatus === 'WARNING' ? 'bg-yellow-900/10 border-yellow-500/30' :
                         'bg-red-900/10 border-red-500/30'
                     }`}>
                         <div className={`p-2 rounded-full ${
                             analysis.thesisStatus === 'VALID' ? 'bg-green-500/20 text-green-400' :
                             analysis.thesisStatus === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400' :
                             'bg-red-500/20 text-red-400'
                         }`}>
                             {analysis.thesisStatus === 'VALID' ? (
                                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                             ) : (
                                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                             )}
                         </div>
                         <div>
                             <h3 className="text-lg font-bold text-white mb-1">
                                 Thesis {analysis.thesisStatus === 'VALID' ? 'Confirmed' : 'Challenged'}
                             </h3>
                             <p className="text-sm text-gray-300">
                                 {analysis.thesisStatus === 'VALID' ? 'On-chain flows support your thesis.' : analysis.invalidationReason}
                             </p>
                         </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4 mb-6">
                         <div className="p-4 bg-slate-800 rounded-lg">
                             <div className="text-xs text-gray-400">Whale Netflow</div>
                             <div className={`text-xl font-mono font-bold ${analysis.whaleNetflow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                 {analysis.whaleNetflow >= 0 ? '+' : ''}{analysis.whaleNetflow.toLocaleString()}
                             </div>
                         </div>
                         <div className="p-4 bg-slate-800 rounded-lg">
                             <div className="text-xs text-gray-400">Sampled Volume</div>
                             <div className="text-xl font-mono font-bold text-white">
                                 {analysis.totalVolume.toLocaleString()}
                             </div>
                         </div>
                     </div>

                     <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analysis.metrics}>
                                <defs>
                                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis hide />
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="netflow" stroke="#06b6d4" fillOpacity={1} fill="url(#colorNet)" />
                            </AreaChart>
                        </ResponsiveContainer>
                     </div>
                 </div>
             )}
        </div>
    );
}
