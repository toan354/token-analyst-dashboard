
import { HistoryEntry } from './chain-data';
import { TraceData } from './types';

export type ZombieStatus = 'HEALTHY' | 'WEAKENING' | 'ZOMBIE_RISK' | 'INSUFFICIENT_DATA';

export interface ZombieAnalysis {
    status: ZombieStatus;
    consecutiveTxDrops: number;
    consecutiveUserDrops: number;
    description: string;
    trace?: TraceData;
}

export function assessZombieStatus(history: HistoryEntry[]): ZombieAnalysis {
    if (history.length < 4) {
        return {
            status: 'INSUFFICIENT_DATA',
            consecutiveTxDrops: 0,
            consecutiveUserDrops: 0,
            description: `Need at least 4 data points to detect 3 consecutive drops (Have: ${history.length}).`
        };
    }

    // We only care about the last 4 entries to check the last 3 periods of change
    // t0 (oldest) -> t1 -> t2 -> t3 (newest)
    // Drop 1: t1 < t0
    // Drop 2: t2 < t1
    // Drop 3: t3 < t2
    
    // Reverse to process from newest backwards: [newest, new-1, new-2, new-3]
    const recent = [...history].reverse(); 
    
    let txDrops = 0;
    let userDrops = 0;

    // Check last 3 intervals
    // recent[0] vs recent[1]
    // recent[1] vs recent[2]
    // recent[2] vs recent[3]
    for (let i = 0; i < 3; i++) {
        if (recent[i].txCount < recent[i+1].txCount) {
            txDrops++;
        }
        if (recent[i].uniqueSenders < recent[i+1].uniqueSenders) {
            userDrops++;
        }
    }

    let status: ZombieStatus = 'HEALTHY';
    let description = 'Activity is stable or growing.';

    if (txDrops >= 3 && userDrops >= 3) {
        status = 'ZOMBIE_RISK';
        description = 'CRITICAL: Transactions and Active Users have declined for 3 consecutive periods.';
    } else if (txDrops >= 3 || userDrops >= 3) {
        status = 'WEAKENING';
        description = 'WARNING: One metric has declined for 3 consecutive periods.';
    } else if (txDrops > 1 || userDrops > 1) {
        // Just some noise or minor downtrend
        description = 'Activity fluctuates, but no sustained zombie pattern yet.';
    }

    // Trace Logic
    const traceRules = [
        {
            name: 'Tx Count Declining (3 Periods)',
            passed: txDrops < 3, // Passed means NO risk, so if drops < 3 it passes check? Or should passed mean "Rule Logic True"? 
            // Better: "Active Traffic Check" -> Passed if stable.
            // Let's stick to "Rule Triggered" -> passed=true usually means "Good". 
            // Rule: "Is Healthy?" -> True
            value: `${txDrops} consecutive drops`,
            threshold: '< 3'
        },
        {
            name: 'Active Users Declining (3 Periods)',
            passed: userDrops < 3,
            value: `${userDrops} consecutive drops`,
            threshold: '< 3'
        }
    ];

    return {
        status,
        consecutiveTxDrops: txDrops,
        consecutiveUserDrops: userDrops,
        description,
        trace: {
            rules: traceRules,
            inputs: {
                historyLength: history.length,
                lastTxCount: recent[0]?.txCount,
                prevTxCount: recent[1]?.txCount,
                lastUserCount: recent[0]?.uniqueSenders
            },
            timestamp: new Date().toISOString(),
            source: 'RPC / Indexer'
        }
    };
}
