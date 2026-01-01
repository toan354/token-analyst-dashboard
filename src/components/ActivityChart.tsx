'use client';

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { ActivityReport } from '@/lib/chain-data';

export default function ActivityChart({ report }: { report: ActivityReport }) {
  if (!report || report.blocks.length === 0) return null;

  return (
    <div className="w-full h-64 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={report.blocks}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="blockNumber" 
            stroke="#94a3b8" 
            tick={{fontSize: 12}}
            tickFormatter={(val) => `...${val % 1000}`}
          />
          <YAxis stroke="#94a3b8" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
            itemStyle={{ color: '#f8fafc' }}
          />
          <Line 
            type="monotone" 
            dataKey="txCount" 
            stroke="#60a5fa" 
            strokeWidth={2} 
            dot={false} 
            name="Transactions"
          />
          <Line 
            type="monotone" 
            dataKey="uniqueSenders" 
            stroke="#34d399" 
            strokeWidth={2} 
            dot={false} 
            name="Active Addrs"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex justify-between mt-2 text-xs text-gray-400 px-2">
         <span>Earliest: {report.blocks[0].blockNumber}</span>
         <span>Latest: {report.blocks[report.blocks.length - 1].blockNumber}</span>
      </div>
    </div>
  );
}
