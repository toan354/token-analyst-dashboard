
export interface GitHubRepo {
    owner: string;
    name: string;
    description: string;
    pushed_at: string; // ISO date
    stargazers_count: number;
    html_url: string;
}

export interface CommitActivity {
    week: number; // Unix timestamp of week start
    total: number; // commits in that week
    days: number[]; // daily breakdown
}

export interface Contributor {
    login: string;
    contributions: number;
    html_url: string;
}

const BASE_URL = "https://api.github.com";

// Helper to handle parsing text URL to owner/repo
export function parseRepoUrl(url: string): { owner: string; name: string } | null {
    try {
        const u = new URL(url);
        if (u.hostname !== 'github.com') return null;
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts.length < 2) return null;
        return { owner: parts[0], name: parts[1] };
    } catch {
        return null;
    }
}

async function fetchGitHub(endpoint: string) {
    // Note: In a real app, we'd add Authentication via Authorization header here
    // using process.env.GITHUB_TOKEN to increase rate limits.
    // For local-first without env setup, we try unauthenticated.
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
            'Accept': 'application/vnd.github.v3+json',
        },
        next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!res.ok) {
        if (res.status === 403 || res.status === 429) {
            throw new Error("GitHub API Rate Limit Exceeded. Try again later or use a token.");
        }
        if (res.status === 404) {
            throw new Error("Repository not found.");
        }
        throw new Error(`GitHub API Error: ${res.statusText}`);
    }
    return res.json();
}

export async function fetchRepoDetails(owner: string, name: string): Promise<GitHubRepo> {
    return fetchGitHub(`/repos/${owner}/${name}`);
}

export async function fetchCommitActivity(owner: string, name: string): Promise<CommitActivity[]> {
    // /stats/commit_activity returns last year of activity by week
    return fetchGitHub(`/repos/${owner}/${name}/stats/commit_activity`);
}

export async function fetchContributors(owner: string, name: string): Promise<Contributor[]> {
    return fetchGitHub(`/repos/${owner}/${name}/contributors?per_page=10`);
}
