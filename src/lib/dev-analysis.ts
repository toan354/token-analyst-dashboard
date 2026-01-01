
import { CommitActivity, Contributor, GitHubRepo } from './github';
import { TraceData } from './types';

export type DevStatus = 'ACTIVE' | 'WEAKENING' | 'INACTIVE';

export interface DevAnalysisResult {
    status: DevStatus;
    flags: string[];
    description: string;
    lastCommitDate: string;
    commitTrend: 'Rising' | 'Flat' | 'Declining' | 'None';
    activeContributorsCount: number;
    trace?: TraceData;
}

export function assessDevActivity(
    repo: GitHubRepo, 
    commits: CommitActivity[], 
    contributors: Contributor[]
): DevAnalysisResult {
    const flags: string[] = [];
    let status: DevStatus = 'ACTIVE';

    // 1. Freshness Check
    const lastPush = new Date(repo.pushed_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastPush.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 60) {
        status = 'INACTIVE';
        flags.push('No commits in last 60 days');
    } else if (diffDays < 14) {
        flags.push('Recently Active (<14 days)');
    } else {
        flags.push(`Last commit ${diffDays} days ago`);
    }

    // 2. Commit Trend (Last 4 weeks)
    // Filter out empty arrays or weeks with 0 if needed, but 0 is a valid signal.
    // The API returns [oldest ... newest]. We want the last 3-4 weeks.
    // stats/commit_activity returns 52 weeks.
    const recentWeeks = commits.slice(-4);
    let decliningWeeks = 0;
    
    for (let i = 0; i < recentWeeks.length - 1; i++) {
        if (recentWeeks[i].total > recentWeeks[i+1].total) {
            decliningWeeks++;
        }
    }
    
    let trend: DevAnalysisResult['commitTrend'] = 'Flat';
    if (decliningWeeks >= 3) {
        trend = 'Declining';
        if (status !== 'INACTIVE') status = 'WEAKENING';
        flags.push('Dev Activity Decay (3w decline)');
    } else if (recentWeeks[recentWeeks.length-1].total > recentWeeks[recentWeeks.length-2].total) {
        trend = 'Rising';
    }

    // 3. Contributor Risk
    // Simple heuristic: If top contributor has >80% of recent, or simply only 1 visible.
    // The contributors endpoint returns ALL time contributions usually, but roughly useful.
    if (contributors.length <= 1) {
        flags.push('Bus Factor Risk (Single Contributor)');
        if (status === 'ACTIVE') status = 'WEAKENING'; // Downgrade if single dev
    }

    // Description Construction
    let desc = '';
    if (status === 'INACTIVE') {
        desc = 'Development has stalled. High risk of abandonment.';
    } else if (status === 'WEAKENING') {
        desc = 'Activity is slowing down or relies on too few people.';
    } else {
        desc = 'Consistent development activity detected.';
    }

    // Trace Logic
    const traceRules = [
        { name: 'Inactivity Check (>60 days)', passed: diffDays <= 60, value: `${diffDays} days ago`, threshold: '< 60 days' },
        { name: 'Recent Activity Check (<14 days)', passed: diffDays < 14, value: `${diffDays} days ago`, threshold: '< 14 days' },
        { name: 'Commit Trend (Declining)', passed: decliningWeeks < 3, value: trend, threshold: '< 3 declining weeks' },
        { name: 'Bus Factor Check (>1 Dev)', passed: contributors.length > 1, value: `${contributors.length} contributors`, threshold: '> 1 contributor' }
    ];

    return {
        status,
        flags,
        description: desc,
        lastCommitDate: lastPush.toLocaleDateString(),
        commitTrend: trend,
        activeContributorsCount: contributors.length,
        trace: {
            rules: traceRules,
            inputs: {
                repoPushedAt: repo.pushed_at,
                commitsLast4Weeks: recentWeeks.map(w => w.total),
                contributorCount: contributors.length
            },
            timestamp: new Date().toISOString(),
            source: 'GitHub API'
        }
    };
}
