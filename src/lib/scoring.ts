import { DeepDiveData, Track, SecurityTier } from './types';

// Helper: Calculate AV Index (Track B)
function calculateAVIndex(data: DeepDiveData): number {
  // AV = [(0.4 * User) + (0.4 * Dev) + (0.2 * Integration)] * Decay
  const rawScore = (0.4 * data.userGrowthScore) + 
                   (0.4 * data.devActivityScore) + 
                   (0.2 * data.integrationScore);
  
  let decayFactor = 1.0;
  if (data.userRetentionRate > 50) decayFactor = 1.0;
  else if (data.userRetentionRate < 30) decayFactor = 0.5;
  else decayFactor = 0.75; // Interpolated or middle ground

  return rawScore * decayFactor; // Returns 0-10 scale
}

// Helper: Calculate Team Score (Track C)
function calculateTrackCScore(data: DeepDiveData): number {
  // Max 100
  // Team (50)
  const team = data.teamPedigreeScore + data.backerScore; 
  // Tech/Thesis (30)
  const thesis = data.techNoveltyScore + data.moatScore;
  // Community (20)
  const community = data.communityOrganicScore + data.devEngagementScore;

  return team + thesis + community;
}

export function calculateFinancialHealth(data: DeepDiveData): 'Good' | 'Risk' | 'Critical' {
  if (data.runwayMonths < 6) return 'Critical';
  if (data.runwayMonths < 12) return 'Risk';
  return 'Good';
}

export function calculateSecurityMultiplier(tier: SecurityTier): number {
  switch (tier) {
    case SecurityTier.Critical: return 0;
    case SecurityTier.Major: return 0.5;
    case SecurityTier.Minor: return 0.9;
    case SecurityTier.Safe: return 1.0;
    default: return 1.0;
  }
}

export function runDeepDiveAnalysis(data: DeepDiveData, track: Track) {
  const securityMult = calculateSecurityMultiplier(data.securityTier);
  const financialHealth = calculateFinancialHealth(data);

  let score = 0;
  let summary = '';

  if (track === Track.B) {
    const avIndex = calculateAVIndex(data);
    // Scale AV Index (0-10) to 0-100 for consistency, then apply security
    score = (avIndex * 10) * securityMult;
    summary = `AV Index: ${avIndex.toFixed(2)}/10`;
  } else if (track === Track.C) {
    const qualitativeScore = calculateTrackCScore(data);
    score = qualitativeScore * securityMult; // Security check still applies
    summary = `Qualitative Score: ${qualitativeScore}/100`;
  } else {
    // Track A - Value
    // Simplified logic for now: based on retention and trend
    let base = 70; // Start at passing
    if (data.revenueToEmissionTrend === 'increasing') base += 20;
    if (data.revenueToEmissionTrend === 'decreasing') base -= 20;
    if ((data.mercenaryRetentionRate || 0) < 70) base -= 30;
    
    score = Math.max(0, Math.min(100, base)) * securityMult;
    summary = `Value Score: ${score.toFixed(0)}`;
  }

  return {
    score,
    summary,
    financialHealth
  };
}
