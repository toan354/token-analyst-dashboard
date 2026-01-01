'use client';

import { useState, useEffect } from 'react';
import { fetchAndAnalyzeBlocks, ActivityReport, getHistory, HistoryEntry } from '@/lib/chain-data';
import { assessZombieStatus, ZombieAnalysis } from '@/lib/zombie';
import ActivityChart from './ActivityChart';

interface Props {
    onAnalysisChange?: (analysis: ZombieAnalysis) => void;
}

export default function ActivitySection({ onAnalysisChange }: Props) {
  const [report, setReport] = useState<ActivityReport | null>(null);
  const [analysis, setAnalysis] = useState<ZombieAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
     // Load initial analysis if history exists
     checkStatus();
  }, []);

  const checkStatus = async () => {
      const history = await getHistory(); 
      if (history.length > 0) {
          const result = assessZombieStatus(history);
          setAnalysis(result);
          if (onAnalysisChange) onAnalysisChange(result);
      }
  };

  const handleScan = async () => {
    setLoading(true);
    try {
      // Fetch last 20 blocks
      const data = await fetchAndAnalyzeBlocks(20);
      setReport(data);
      await checkStatus();
    } catch (e) {
      console.error(e);
      alert("Failed to scan chain data.");
    } finally {
      setLoading(false);
    }
  };

  // Function to simulate data for testing since we can't wait days
  const handleSimulateZombie = async () => {
      // This would ideally be a development tool, adding fake declining entries to history
      alert("Simulation would write fake history entries. (Not implemented in this step to keep code simple)");
  };


  return (
    <div>
      <div className="flex items-center justify-between mb-6">
         <div>
            <h2 className="text-2xl font-bold text-white">On-Chain Activity</h2>
            <p className="text-gray-400 text-sm">Live Network Pulse (Ethereum Mainnet)</p>
         </div>
         <button 
           onClick={handleScan}
           disabled={loading}
           className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 text-sm font-medium transition-colors"
         >
           {loading ? 'Scanning Blocks...' : 'Scan Activity'}
         </button>
      </div>

      {!report && !loading && (
          <div className="text-center py-10 text-gray-500 border border-dashed border-gray-700 rounded-lg">
             Click "Scan Activity" to analyze activity and update Zombie Status.
          </div>
      )}

      {loading && (
          <div className="text-center py-10 text-blue-400">
             <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mb-2"></div>
             <p>Fetching Blocks & Calculating Trends...</p>
          </div>
      )}

      {analysis && (
          <div className={`mb-6 p-4 rounded-xl border ${
              analysis.status === 'ZOMBIE_RISK' ? 'bg-red-900/10 border-red-500/30' : 
              analysis.status === 'WEAKENING' ? 'bg-yellow-900/10 border-yellow-500/30' : 
              analysis.status === 'HEALTHY' ? 'bg-green-900/10 border-green-500/30' : 'bg-slate-800 border-slate-700'
          }`}>
             <div className="flex items-start justify-between">
                <div>
                   <h3 className={`text-lg font-bold ${
                       analysis.status === 'ZOMBIE_RISK' ? 'text-red-400' :
                       analysis.status === 'WEAKENING' ? 'text-yellow-400' : 
                       analysis.status === 'HEALTHY' ? 'text-green-400' : 'text-gray-400'
                   }`}>
                       Zombie Status: {analysis.status.replace('_', ' ')}
                   </h3>
                   <p className="text-sm text-gray-300 mt-1">{analysis.description}</p>
                   {analysis.status !== 'INSUFFICIENT_DATA' && (
                       <p className="text-xs text-gray-500 mt-2">
                           Consecutive Drops: Tx ({analysis.consecutiveTxDrops}), Users ({analysis.consecutiveUserDrops})
                       </p>
                   )}
                </div>
             </div>
          </div>
      )}

      {report && (
         <div className="animate-in fade-in zoom-in-95 duration-500">
             <div className="grid grid-cols-3 gap-4 mb-6">
                 <div className="bg-slate-800/50 p-4 rounded-lg">
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Total Txs</div>
                    <div className="text-2xl font-mono">{report.totalTransactions}</div>
                 </div>
                 <div className="bg-slate-800/50 p-4 rounded-lg">
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Est. Unique Users</div>
                    <div className="text-2xl font-mono text-green-400">{report.estimatedUniqueUsers}</div>
                 </div>
                 <div className="bg-slate-800/50 p-4 rounded-lg">
                    <div className="text-xs text-slate-400 uppercase tracking-wider">TPS (Approx)</div>
                    <div className="text-2xl font-mono text-blue-400">{(report.averageTxPerBlock / 12).toFixed(1)}</div>
                 </div>
             </div>
             
             <ActivityChart report={report} />
         </div>
      )}
    </div>
  );
}
