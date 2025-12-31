import { GatekeeperData, Track } from './types';

export interface GatekeeperResult {
  passed: boolean;
  killSwitchTriggered: boolean;
  score: number; // 0-4
  rejections: string[];
}

export function runGatekeeper(data: GatekeeperData, track: Track): GatekeeperResult {
  const result: GatekeeperResult = {
    passed: false,
    killSwitchTriggered: false,
    score: 0,
    rejections: [],
  };

  // 1. KILL SWITCH CHECKS
  if (data.sanctionRisk) {
    result.killSwitchTriggered = true;
    result.rejections.push('Sanction Risk (Global Kill Switch)');
  }

  if (data.criticalSecurityBug) {
    result.killSwitchTriggered = true;
    result.rejections.push('Critical Security Vulnerability unchecked');
  }

  // Dead Liquidity check only for Track A & B
  if (track !== Track.C && data.deadLiquidity) {
    result.killSwitchTriggered = true;
    result.rejections.push('Dead Liquidity (<$50k)');
  }

  if (result.killSwitchTriggered) {
    return result;
  }

  // 2. PASS CRITERIA (Need >= 3/4)
  let score = 0;
  if (data.auditOrBacker) score++;
  if (data.productOrTeam) score++;
  if (data.marketRiskSafe) score++;
  if (data.dataDrivenNarrative) score++;

  result.score = score;

  if (score >= 3) {
    result.passed = true;
  } else {
    result.rejections.push(`Insufficient Score: ${score}/4 (Required 3)`);
  }

  return result;
}
