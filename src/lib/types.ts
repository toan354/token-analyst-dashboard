export enum Track {
  A = 'A_VALUE',
  B = 'B_GROWTH',
  C = 'C_ALPHA',
}

export enum SecurityTier {
  Critical = 'CRITICAL', // Score = 0
  Major = 'MAJOR',       // Score x 0.5
  Minor = 'MINOR',       // Score x 0.9
  Safe = 'SAFE',         // Score x 1.0
}

export interface GatekeeperData {
  // Kill Switch
  sanctionRisk: boolean; // True if violated
  criticalSecurityBug: boolean; // True if Critical bug exists & unpatched
  deadLiquidity: boolean; // True if liquidity < $50k
  
  // Pass Criteria (Need >= 3/4)
  auditOrBacker: boolean;
  productOrTeam: boolean;
  marketRiskSafe: boolean; // Unlock absorption check
  dataDrivenNarrative: boolean; // Belongs to trending sector
}

export interface DeepDiveData {
  // Track A
  revenueToEmissionTrend?: 'increasing' | 'decreasing' | 'stable';
  mercenaryRetentionRate?: number; // % TVL remaining after incentive cut

  // Track B - AV Index Inputs
  userGrowthScore: number; // 0-10
  devActivityScore: number; // 0-10
  integrationScore: number; // 0-10
  userRetentionRate: number; // 0-100%

  // Track C - Team & Thesis
  teamPedigreeScore: number; // 0-25
  backerScore: number; // 0-25
  techNoveltyScore: number; // 0-15
  moatScore: number; // 0-15
  communityOrganicScore: number; // 0-10
  devEngagementScore: number; // 0-10

  // Common
  runwayMonths: number;
  securityTier: SecurityTier;
}

export interface GatekeeperResult {
  passed: boolean;
  killSwitchTriggered: boolean;
  score: number; // 0-4
  rejections: string[];
}

export interface AssessmentResult {
  score: number;
  summary: string;
  financialHealth: 'Good' | 'Risk' | 'Critical';
}

export interface PortfolioItem {
  id: string;
  project: { name: string; ticker: string };
  track: Track;
  analysis: AssessmentResult;
  date: string;
}
