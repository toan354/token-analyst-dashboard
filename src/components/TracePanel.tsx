import React, { useState } from 'react';

interface RuleTrace {
    name: string;
    passed: boolean;
    value?: string | number | null; 
    threshold?: string | number;
}

interface TracePanelProps {
    isActive: boolean;
    title?: string;
    rules?: RuleTrace[];
    inputs?: Record<string, any>;
    timestamp?: string;
    source?: string;
    description?: string; // For general "why this happened" text
}

export default function TracePanel({ isActive, title = 'Trace Layer', rules = [], inputs = {}, timestamp, source, description }: TracePanelProps) {
    if (!isActive) return null;

    return (
        <div className="mt-4 p-4 bg-slate-900/80 border border-indigo-500/30 rounded-lg animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-4 border-b border-indigo-500/20 pb-2">
                <h4 className="text-sm font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    {title}
                </h4>
                <div className="text-[10px] text-gray-500 text-right">
                    <div>SRC: {source || 'Internal'}</div>
                    <div>TIME: {timestamp || new Date().toLocaleTimeString()}</div>
                </div>
            </div>

            {description && (
                <div className="mb-4 text-sm text-gray-300 italic bg-black/20 p-2 rounded border-l-2 border-indigo-500">
                    "{description}"
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Rules Section */}
                {rules.length > 0 && (
                    <div>
                        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase">Evaluated Rules</div>
                        <ul className="space-y-2">
                            {rules.map((rule, idx) => (
                                <li key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-slate-800/50">
                                    <span className="text-gray-300">{rule.name}</span>
                                    <div className="flex items-center gap-2">
                                         {rule.value !== undefined && (
                                            <span className="text-gray-500 font-mono">[{rule.value} {rule.threshold ? `/ ${rule.threshold}` : ''}]</span>
                                         )}
                                         <span className={`px-1.5 py-0.5 rounded font-bold ${rule.passed ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                             {rule.passed ? 'PASS' : 'FAIL'}
                                         </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Raw Data Input Section */}
                {inputs && Object.keys(inputs).length > 0 && (
                    <div>
                         <div className="text-xs font-semibold text-gray-500 mb-2 uppercase">Raw Data Snapshot</div>
                         <div className="bg-slate-800/50 rounded p-2">
                             <table className="w-full text-xs">
                                 <tbody>
                                     {Object.entries(inputs).map(([key, val]) => (
                                         <tr key={key} className="border-b border-white/5 last:border-0">
                                             <td className="py-1 text-gray-400 font-mono">{key}</td>
                                             <td className="py-1 text-right text-indigo-200 font-mono">{typeof val === 'number' ? val.toLocaleString() : String(val)}</td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                    </div>
                )}
            </div>
        </div>
    );
}
