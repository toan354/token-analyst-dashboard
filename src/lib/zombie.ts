
import { HistoryEntry } from './chain-data';

export type ZombieStatus = 'HEALTHY' | 'WEAKENING' | 'ZOMBIE_RISK' | 'INSUFFICIENT_DATA';

export interface ZombieAnalysis {
    status: ZombieStatus;
    consecutiveTxDrops: number;
    consecutiveUserDrops: number;
    description: string;
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

    return {
        status,
        consecutiveTxDrops: txDrops,
        consecutiveUserDrops: userDrops,
        description
    };
}
