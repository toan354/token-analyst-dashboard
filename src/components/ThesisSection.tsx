'use client';

import { useState, useEffect } from 'react';
import { Thesis, Catalyst, checkThesisStatus } from '@/lib/thesis';
import { DevAnalysisResult } from '@/lib/dev-analysis';
import { FlowAnalysisResult } from '@/lib/flow';
import { TreasuryAnalysis } from '@/lib/treasury';

import TracePanel from './TracePanel';

interface Props {
    devResult?: DevAnalysisResult;
    flowResult?: FlowAnalysisResult;
    treasuryResult?: TreasuryAnalysis;
    isResearcherMode?: boolean;
}

export default function ThesisSection({ devResult, flowResult, treasuryResult, isResearcherMode = false }: Props) {
    const [statement, setStatement] = useState('');
    const [catalystDesc, setCatalystDesc] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [activeThesis, setActiveThesis] = useState<Thesis | null>(null);

    // Auto-update thesis status when external signals change
    useEffect(() => {
        if (activeThesis) {
            const updated = checkThesisStatus(activeThesis, {
                dev: devResult,
                flow: flowResult,
                treasury: treasuryResult
            });
            // Only update if changes to avoid loop, simple check on warnings length or status
            if (updated.status !== activeThesis.status || updated.warnings.length !== activeThesis.warnings.length || updated.confidence !== activeThesis.confidence) {
                setActiveThesis(updated);
            }
        }
    }, [devResult, flowResult, treasuryResult]);

    const handleCreate = () => {
        if (!statement || !catalystDesc || !expiryDate) return;
        
        const newThesis: Thesis = {
            statement,
            startDate: new Date().toISOString(),
            expiryDate: new Date(expiryDate).toISOString(),
            catalysts: [{ description: catalystDesc, isPrimary: true, status: 'PENDING' }],
            status: 'ACTIVE',
            confidence: 80,
            warnings: []
        };
        
        const checked = checkThesisStatus(newThesis, {
             dev: devResult,
             flow: flowResult,
             treasury: treasuryResult
        });
        
        setActiveThesis(checked);
    };

    const daysRemaining = activeThesis ? Math.ceil((new Date(activeThesis.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

    return (
        <div className="glass-card p-6 border-t-4 border-t-indigo-500 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 mb-8">
             <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-white">Investment Thesis & Discipline</h2>
                    <p className="text-xs text-gray-400">Map Catalysts & Enforce Expiry</p>
                 </div>
             </div>

             {!activeThesis ? (
                 <div className="space-y-4">
                     <div>
                         <label className="block text-xs text-gray-400 mb-1">Thesis Statement (Why does this exist?)</label>
                         <textarea 
                            value={statement}
                            onChange={(e) => setStatement(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-base outline-none focus:border-indigo-500 min-h-[5rem] transition-colors placeholder:text-slate-500"
                            placeholder="e.g. This protocol captures L2 volume due to lower fees..."
                         />
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                             <label className="block text-xs text-gray-400 mb-1">Primary Catalyst (Must Happen)</label>
                             <input 
                                type="text"
                                value={catalystDesc}
                                onChange={(e) => setCatalystDesc(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-base outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500"
                                placeholder="e.g. V3 Mainnet Launch"
                             />
                         </div>
                         <div>
                             <label className="block text-xs text-gray-400 mb-1">Thesis Expiry Date (Hard Stop)</label>
                             <input 
                                type="date"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-base outline-none focus:border-indigo-500 transition-colors"
                             />
                         </div>
                     </div>
                     <button 
                        onClick={handleCreate}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-base font-bold transition-all shadow-lg shadow-indigo-900/20"
                     >
                         Lock Thesis
                     </button>
                 </div>
             ) : (
                 <div className="animate-in fade-in zoom-in-95 duration-500">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                         <div className="md:col-span-2">
                             <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">The Thesis</div>
                             <p className="text-xl font-serif italic text-white leading-relaxed">"{activeThesis.statement}"</p>
                             
                             <div className="mt-4 flex items-center gap-4">
                                 <div className={`px-3 py-1 rounded-lg border ${
                                     activeThesis.status === 'ACTIVE' ? 'bg-green-500/20 border-green-500/50 text-green-400' :
                                     activeThesis.status === 'UNDER_PRESSURE' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' :
                                     'bg-red-500/20 border-red-500/50 text-red-400'
                                 } font-bold text-sm`}>
                                     {activeThesis.status.replace('_', ' ')}
                                 </div>
                                 <div className="text-sm text-gray-400">
                                     Confidence: <span className="text-white font-bold">{activeThesis.confidence}%</span>
                                 </div>
                             </div>
                         </div>
                         
                         <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center">
                             <div className="text-xs text-gray-500 mb-1">Time to Expiry</div>
                             <div className={`text-3xl font-bold ${daysRemaining < 30 ? 'text-red-400' : 'text-white'}`}>
                                 {daysRemaining} <span className="text-sm font-normal text-gray-500">days</span>
                             </div>
                             <div className="text-[10px] text-gray-600 mt-1">{new Date(activeThesis.expiryDate).toLocaleDateString()}</div>
                         </div>
                     </div>

                     <div className="space-y-4">
                         {/* Catalyst */}
                         <div className="bg-slate-800 p-4 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-400 ring-4 ring-blue-400/20"></div>
                                <div>
                                    <div className="text-xs text-blue-400 font-bold uppercase">Primary Catalyst</div>
                                    <div className="text-sm text-white">{activeThesis.catalysts[0].description}</div>
                                </div>
                            </div>
                            <button className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-gray-300">
                                Mark Occurred
                            </button>
                         </div>

                         {/* Warnings */}
                         {activeThesis.warnings.length > 0 && (
                             <div className="bg-red-900/10 border border-red-500/20 rounded-lg p-4">
                                 <h4 className="text-red-400 text-xs font-bold uppercase mb-2">Discipline & Risk Alerts</h4>
                                 <ul className="space-y-1">
                                     {activeThesis.warnings.map((w, i) => (
                                         <li key={i} className="text-sm text-red-300 flex items-start gap-2">
                                             <span>•</span> {w}
                                         </li>
                                     ))}
                                 </ul>
                             </div>
                         )}
                         
                         <button 
                            onClick={() => setActiveThesis(null)}
                            className="text-xs text-gray-500 underline hover:text-gray-300"
                        >
                            Reset / New Thesis
                        </button>
                     </div>
                 </div>
             )}

            <TracePanel 
                isActive={isResearcherMode}
                title="Thesis & Discipline Trace"
                rules={activeThesis?.trace?.rules}
                inputs={activeThesis?.trace?.inputs}
                timestamp={activeThesis?.trace?.timestamp}
                source={activeThesis?.trace?.source}
            />
        </div>
    );
}
