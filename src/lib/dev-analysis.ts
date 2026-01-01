
import { CommitActivity, Contributor, GitHubRepo } from './github';

export type DevStatus = 'ACTIVE' | 'WEAKENING' | 'INACTIVE';

export interface DevAnalysisResult {
    status: DevStatus;
    flags: string[];
    description: string;
    lastCommitDate: string;
    commitTrend: 'Rising' | 'Flat' | 'Declining' | 'None';
    activeContributorsCount: number;
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

    return {
        status,
        flags,
        description: desc,
        lastCommitDate: lastPush.toLocaleDateString(),
        commitTrend: trend,
        activeContributorsCount: contributors.length
    };
}
