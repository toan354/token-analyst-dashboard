'use client';

import { useState } from 'react';
import { 
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, TooltipProps 
} from 'recharts';
import { 
    fetchCommitActivity, fetchRepoDetails, fetchContributors, parseRepoUrl,
    GitHubRepo, CommitActivity, Contributor 
} from '@/lib/github';
import { assessDevActivity, DevAnalysisResult } from '@/lib/dev-analysis';

interface Props {
    onAnalysisComplete?: (result: DevAnalysisResult) => void;
}

export default function DevActivitySection({ onAnalysisComplete }: Props) {
    const [repoUrl, setRepoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [chartsData, setChartsData] = useState<any[]>([]);
    const [analysis, setAnalysis] = useState<DevAnalysisResult | null>(null);
    const [repoName, setRepoName] = useState('');
    const [error, setError] = useState('');

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!repoUrl) return;

        const parsed = parseRepoUrl(repoUrl);
        if (!parsed) {
            setError('Invalid GitHub URL. Format: https://github.com/owner/repo');
            return;
        }

        setLoading(true);
        try {
            const [repo, commits, contributors] = await Promise.all([
                fetchRepoDetails(parsed.owner, parsed.name),
                fetchCommitActivity(parsed.owner, parsed.name),
                fetchContributors(parsed.owner, parsed.name)
            ]);

            const result = assessDevActivity(repo, commits, contributors);
            setAnalysis(result);
            if (onAnalysisComplete) onAnalysisComplete(result);
            setRepoName(`${parsed.owner}/${parsed.name}`);

            // Prepare chart data (Last 12 weeks)
            const recent = commits.slice(-12).map(c => ({
                week: new Date(c.week * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                commits: c.total
            }));
            setChartsData(recent);

        } catch (err: any) {
             setError(err.message || 'Failed to fetch GitHub data');
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
                        {payload[0].value} commits
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="glass-card p-6 border-t-4 border-t-purple-500 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
             <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-purple-500/20 rounded-lg">
                    <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-white">Dev Activity</h2>
                    <p className="text-xs text-gray-400">Execution & Health Check</p>
                 </div>
             </div>

             <form onSubmit={handleAnalyze} className="mb-8 flex gap-4">
                 <input 
                    type="text" 
                    placeholder="https://github.com/org/repo"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500 outline-none"
                 />
                 <button 
                    disabled={loading}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold transition-colors disabled:opacity-50"
                 >
                     {loading ? 'Check' : 'Analyze'}
                 </button>
             </form>

             {error && (
                 <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-sm mb-6">
                     {error}
                 </div>
             )}

             {analysis && (
                 <div className="animate-in fade-in duration-500">
                     <div className="flex justify-between items-start mb-6">
                         <div>
                             <h3 className="text-lg font-bold text-white">{repoName}</h3>
                             <div className="flex gap-2 mt-2">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    analysis.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                                    analysis.status === 'WEAKENING' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-red-500/20 text-red-400'
                                }`}>
                                    {analysis.status}
                                </span>
                                <span className="px-2 py-1 rounded text-xs bg-slate-800 text-gray-400">
                                    Trend: {analysis.commitTrend}
                                </span>
                             </div>
                         </div>
                         <div className="text-right">
                             <div className="text-2xl font-mono font-bold text-white">{analysis.activeContributorsCount}</div>
                             <div className="text-xs text-gray-500 uppercase tracking-wider">Contributors</div>
                         </div>
                     </div>

                     <div className="h-48 w-full mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartsData}>
                                <XAxis dataKey="week" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis hide />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                                <Bar dataKey="commits" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                     </div>

                     <div className="space-y-2">
                         <p className="text-sm text-gray-300 italic">"{analysis.description}"</p>
                         {analysis.flags.map((flag, idx) => (
                             <div key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                                 <span className="w-1 h-1 rounded-full bg-purple-500"></span>
                                 {flag}
                             </div>
                         ))}
                     </div>
                 </div>
             )}
        </div>
    );
}
