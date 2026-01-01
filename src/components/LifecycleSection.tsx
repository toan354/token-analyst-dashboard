'use client';

import { useState, useEffect } from 'react';
import { getHistory } from '@/lib/chain-data';
import { assessZombieStatus, ZombieStatus } from '@/lib/zombie';
import { assessLifecycle, LifecycleResult } from '@/lib/lifecycle';

import TracePanel from './TracePanel';

interface Props {
    zombieStatus: ZombieStatus;
    onResultChange?: (result: LifecycleResult) => void;
    isResearcherMode?: boolean;
}

export default function LifecycleSection({ zombieStatus, onResultChange, isResearcherMode = false }: Props) {
    const [startDate, setStartDate] = useState('');
    const [result, setResult] = useState<LifecycleResult | null>(null);

    // Recalculate when Date or Status changes
    useEffect(() => {
        if (!startDate) return;
        const start = new Date(startDate);
        if (isNaN(start.getTime())) return;

        const res = assessLifecycle(start, zombieStatus);
        setResult(res);
        if (onResultChange) onResultChange(res);
    }, [startDate, zombieStatus]);

    // Format for display
    const getStatusColor = (status: string) => {
        switch(status) {
            case 'HIGH_FAILURE_PROBABILITY': return 'text-red-500 border-red-500/30 bg-red-900/10';
            case 'EXECUTION_LAG': return 'text-yellow-500 border-yellow-500/30 bg-yellow-900/10';
            case 'ON_TRACK': return 'text-green-500 border-green-500/30 bg-green-900/10';
            default: return 'text-blue-400 border-blue-500/30 bg-blue-900/10'; // Early Stage
        }
    };

    return (
        <div className="glass-card p-6 mt-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Lifecycle Timer
            </h2>
            
            <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1">
                    <label className="block text-sm text-gray-400 mb-2">Project Start Date (Launch)</label>
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        Enter the date the project launched or when you started tracking it.
                    </p>
                </div>

                {result && (
                    <div className={`flex-1 p-4 rounded-xl border ${getStatusColor(result.status)}`}>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs uppercase tracking-wider font-semibold opacity-80">Cycle Status</span>
                            <span className="font-mono text-xl font-bold">{result.ageMonths} mo</span>
                        </div>
                        <h3 className="text-lg font-bold mb-1">{result.status.replace(/_/g, ' ')}</h3>
                        {result.flags.map((flag, i) => (
                            <div key={i} className="text-sm opacity-90 flex items-start gap-2">
                                <span className="mt-1">•</span>
                                <span>{flag}</span>
                            </div>
                        ))}
                         {result.status === 'EARLY_STAGE' && (
                            <p className="text-sm opacity-90">Project is young. Monitor initial traction.</p>
                        )}
                        {result.status === 'ON_TRACK' && (
                            <p className="text-sm opacity-90">Growth matches age expectations.</p>
                        )}
                    </div>
                )}
            </div>
             
             {/* Contextual Hint */}
             <div className="mt-4 pt-4 border-t border-white/5 text-xs text-gray-500 flex justify-between">
                <span>Current Trend: <span className={zombieStatus === 'HEALTHY' ? 'text-green-400' : 'text-yellow-400'}>{zombieStatus}</span></span>
                <span>Threshold: &gt;6m (Lag), &gt;12m (Fail Prob)</span>
             </div>

             {result && (
                <TracePanel 
                    isActive={isResearcherMode}
                    title="Lifecycle Logic Trace"
                    rules={result.trace?.rules}
                    inputs={result.trace?.inputs}
                    timestamp={result.trace?.timestamp}
                    source={result.trace?.source}
                />
             )}
        </div>
    );
}
