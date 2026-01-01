/**
 * L1 Status Aggregation Logic
 * 
 * PURPOSE: Combine multiple L1 risk module statuses into ONE global gatekeeper status.
 * TYPE: Rule-based aggregation (NOT scoring or averaging)
 * 
 * AGGREGATION RULES:
 * 1. FAIL has veto power → any FAIL = global FAIL
 * 2. WARNING is accumulative → 1+ WARNING = global WARNING  
 * 3. INSUFFICIENT_DATA is first-class → any INSUFFICIENT = global PARTIAL
 * 4. All PASS → global PASS
 */

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

export type ModuleStatus = 'PASS' | 'WARNING' | 'FAIL' | 'INSUFFICIENT_DATA';
export type GlobalStatus = 'PASS' | 'WARNING' | 'FAIL' | 'PARTIAL';

export interface ModuleResult {
  moduleId: string;
  moduleName: string;
  status: ModuleStatus;
  summary: string;
}

export interface AggregatedResult {
  globalStatus: GlobalStatus;
  summaryText: string;
  triggeringModules: string[];
  allModules: ModuleResult[];
}

// ─────────────────────────────────────────────────
// Pure Aggregation Function (Deterministic)
// ─────────────────────────────────────────────────

export function aggregateL1Status(modules: ModuleResult[]): AggregatedResult {
  // Edge case: no modules
  if (modules.length === 0) {
    return {
      globalStatus: 'PARTIAL',
      summaryText: 'No risk modules configured.',
      triggeringModules: [],
      allModules: [],
    };
  }

  // Count statuses
  const failModules = modules.filter(m => m.status === 'FAIL');
  const warningModules = modules.filter(m => m.status === 'WARNING');
  const insufficientModules = modules.filter(m => m.status === 'INSUFFICIENT_DATA');
  const passModules = modules.filter(m => m.status === 'PASS');

  // RULE 1: FAIL has veto power
  if (failModules.length > 0) {
    const names = failModules.map(m => m.moduleName);
    return {
      globalStatus: 'FAIL',
      summaryText: `Critical risk detected in ${names.length} module(s): ${names.join(', ')}.`,
      triggeringModules: failModules.map(m => m.moduleId),
      allModules: modules,
    };
  }

  // RULE 2: WARNING is accumulative (1 or more)
  if (warningModules.length > 0) {
    const names = warningModules.map(m => m.moduleName);
    return {
      globalStatus: 'WARNING',
      summaryText: `Elevated risk in ${names.length} module(s): ${names.join(', ')}.`,
      triggeringModules: warningModules.map(m => m.moduleId),
      allModules: modules,
    };
  }

  // RULE 3: INSUFFICIENT_DATA produces PARTIAL
  if (insufficientModules.length > 0) {
    const names = insufficientModules.map(m => m.moduleName);
    return {
      globalStatus: 'PARTIAL',
      summaryText: `Incomplete data in ${names.length} module(s): ${names.join(', ')}.`,
      triggeringModules: insufficientModules.map(m => m.moduleId),
      allModules: modules,
    };
  }

  // RULE 4: All PASS
  return {
    globalStatus: 'PASS',
    summaryText: `All ${passModules.length} risk module(s) passed.`,
    triggeringModules: [],
    allModules: modules,
  };
}

// ─────────────────────────────────────────────────
// Example Outputs (For Testing)
// ─────────────────────────────────────────────────

export const EXAMPLE_ALL_PASS: ModuleResult[] = [
  { moduleId: 'exchange_flow_risk', moduleName: 'Exchange Flow Risk', status: 'PASS', summary: 'Flow is normal.' },
  { moduleId: 'supply_concentration', moduleName: 'Supply Concentration', status: 'PASS', summary: 'Distribution is healthy.' },
  { moduleId: 'holder_risk', moduleName: 'Holder Risk', status: 'PASS', summary: 'No whale accumulation.' },
];

export const EXAMPLE_MIXED_WARNING: ModuleResult[] = [
  { moduleId: 'exchange_flow_risk', moduleName: 'Exchange Flow Risk', status: 'WARNING', summary: 'Elevated inflow detected.' },
  { moduleId: 'supply_concentration', moduleName: 'Supply Concentration', status: 'PASS', summary: 'Distribution is healthy.' },
  { moduleId: 'holder_risk', moduleName: 'Holder Risk', status: 'WARNING', summary: 'Whale accumulation detected.' },
];

export const EXAMPLE_FAIL_PRESENT: ModuleResult[] = [
  { moduleId: 'exchange_flow_risk', moduleName: 'Exchange Flow Risk', status: 'FAIL', summary: 'Extreme outflow detected.' },
  { moduleId: 'supply_concentration', moduleName: 'Supply Concentration', status: 'WARNING', summary: 'High concentration.' },
  { moduleId: 'holder_risk', moduleName: 'Holder Risk', status: 'PASS', summary: 'No whale accumulation.' },
];

export const EXAMPLE_INSUFFICIENT: ModuleResult[] = [
  { moduleId: 'exchange_flow_risk', moduleName: 'Exchange Flow Risk', status: 'PASS', summary: 'Flow is normal.' },
  { moduleId: 'supply_concentration', moduleName: 'Supply Concentration', status: 'INSUFFICIENT_DATA', summary: 'Missing holder data.' },
  { moduleId: 'holder_risk', moduleName: 'Holder Risk', status: 'PASS', summary: 'No whale accumulation.' },
];
