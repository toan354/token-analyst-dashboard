
import { ZombieStatus } from './zombie';
import { TraceData } from './types';

export interface LifecycleResult {
    ageMonths: number;
    status: 'EARLY_STAGE' | 'EXECUTION_LAG' | 'HIGH_FAILURE_PROBABILITY' | 'ON_TRACK';
    flags: string[];
    trace?: TraceData;
}

export function assessLifecycle(startDate: Date, activityStatus: ZombieStatus): LifecycleResult {
    const now = new Date();
    // Calculate months difference roughly (days/30)
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    const ageMonths = parseFloat((diffDays / 30).toFixed(1));

    const flags: string[] = [];
    let status: LifecycleResult['status'] = 'ON_TRACK';

    // Logic:
    // Age > 12m AND No Growth (Weakening/Risk) -> High Failure Probability
    // Age > 6m AND Flat/Declining (Weakening/Risk) -> Execution Lag

    const isGrowthStalled = activityStatus === 'WEAKENING' || activityStatus === 'ZOMBIE_RISK';
    
    if (ageMonths > 12) {
        if (isGrowthStalled) {
            status = 'HIGH_FAILURE_PROBABILITY';
            flags.push('Age > 12 months with no clear growth trend.');
        } else if (activityStatus === 'HEALTHY') {
            status = 'ON_TRACK';
        }
    } else if (ageMonths > 6) {
        if (isGrowthStalled) {
            status = 'EXECUTION_LAG';
            flags.push('Age > 6 months with flat or declining activity.');
        } else {
             status = 'ON_TRACK'; 
        }
    } else {
        status = 'EARLY_STAGE';
    }

    // Trace Logic
    const traceRules = [
        {
            name: 'Age Threshold (> 12m)',
            passed: ageMonths > 12, // Information only rule? passed=true means it IS older than 12m. 
            value: `${ageMonths} months`,
        },
        {
            name: 'Growth Status Check',
            passed: !isGrowthStalled, // Passed if NOT stalled
            value: activityStatus,
        }
    ];

    return { 
        ageMonths, 
        status, 
        flags,
        trace: {
            rules: traceRules,
            inputs: {
                startDate: startDate.toISOString(),
                currentDate: now.toISOString(),
                activityStatus
            },
            timestamp: now.toISOString(),
            source: 'Manual Input + Activity Module'
        }
    };
}
