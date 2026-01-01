'use client';

import { useState, useEffect } from 'react';
import { TokenData } from '@/lib/types';
import { ZombieStatus } from '@/lib/zombie';
import { classifyTrack, ClassificationResult } from '@/lib/classifier';

import TracePanel from './TracePanel';

interface Props {
    tokenData: TokenData | null;
    zombieStatus: ZombieStatus;
    isResearcherMode?: boolean;
}

export default function TrackClassifierSection({ tokenData, zombieStatus, isResearcherMode = false }: Props) {
    const [isProductLive, setIsProductLive] = useState(false);
    const [isRevenueOnChain, setIsRevenueOnChain] = useState(false);
    const [result, setResult] = useState<ClassificationResult | null>(null);

    useEffect(() => {
        // Auto-classify when inputs change
        if (tokenData) {
            setResult(classifyTrack({
                tokenData,
                activityStatus: zombieStatus,
                isProductLive,
                isRevenueOnChain
            }));
        } else {
            setResult(null);
        }
    }, [tokenData, zombieStatus, isProductLive, isRevenueOnChain]);

    if (!tokenData) return null; // Don't show if no token loaded

    return (
        <div className="glass-card p-6 mt-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
             <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-pink-500/20 rounded-lg">
                    <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-white">Track Classifier</h2>
                    <p className="text-xs text-gray-400">Determine Evaluation Framework</p>
                 </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Inputs */}
                 <div className="space-y-4">
                     <div>
                         <label className="flex items-center justify-between p-3 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer hover:border-blue-500 transition-colors">
                             <span className="text-sm font-medium text-gray-300">Is the Product Live?</span>
                             <input 
                                type="checkbox" 
                                checked={isProductLive}
                                onChange={(e) => setIsProductLive(e.target.checked)}
                                className="w-5 h-5 accent-blue-500"
                             />
                         </label>
                         <p className="text-xs text-gray-500 mt-1 px-1">Check if mainnet product is usable by public.</p>
                     </div>

                     <div>
                         <label className="flex items-center justify-between p-3 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer hover:border-blue-500 transition-colors">
                             <span className="text-sm font-medium text-gray-300">Revenue On-Chain?</span>
                             <input 
                                type="checkbox" 
                                checked={isRevenueOnChain}
                                onChange={(e) => setIsRevenueOnChain(e.target.checked)}
                                className="w-5 h-5 accent-blue-500"
                             />
                         </label>
                         <p className="text-xs text-gray-500 mt-1 px-1">Check if protocol generates verifiable on-chain revenue.</p>
                     </div>
                 </div>

                 {/* Results */}
                 <div>
                     {result ? (
                         <div className={`h-full p-6 rounded-xl border flex flex-col justify-center ${
                             result.track === 'TRACK_A' ? 'bg-blue-900/20 border-blue-400/50' :
                             result.track === 'TRACK_B' ? 'bg-purple-900/20 border-purple-400/50' :
                             'bg-orange-900/20 border-orange-400/50'
                         }`}>
                             <div className="text-xs uppercase tracking-widest font-bold opacity-70 mb-2">Classification</div>
                             <div className="text-4xl font-black text-white mb-2">{result.track.replace('_', ' ')}</div>
                             <div className={`text-lg font-bold mb-2 ${
                                  result.track === 'TRACK_A' ? 'text-blue-300' :
                                  result.track === 'TRACK_B' ? 'text-purple-300' : 'text-orange-300'
                             }`}>
                                 {result.reason}
                             </div>
                             <p className="text-sm opacity-80 leading-relaxed bg-black/20 p-3 rounded-lg">
                                 {result.description}
                             </p>
                             
                             <div className="mt-4 pt-3 border-t border-white/10 text-xs italic opacity-60">
                                 Warning: This classification determines which rules apply in deep dive.
                             </div>
                         </div>
                     ) : (
                         <div className="h-full flex items-center justify-center text-gray-500 border border-dashed border-gray-700 rounded-xl">
                             Waiting for data...
                         </div>
                     )}
                 </div>
             </div>
        </div>
    );
}
