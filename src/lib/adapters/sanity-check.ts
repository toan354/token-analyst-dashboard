/**
 * Data Sanity Check Script
 * 
 * PURPOSE: Validate data integrity for L1 Exchange Flow Risk adapter
 * TYPE: Audit only - no modifications
 * 
 * Run with: npx ts-node --esm src/lib/adapters/sanity-check.ts
 */

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

interface DataPoint {
  timestamp: number;
  exchangeInflow: number;
  exchangeOutflow: number;
  netExchangeFlow: number;
  circulatingSupply: number;
}

interface SanityResult {
  check: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  details: string[];
}

interface SanityReport {
  overallStatus: 'PASS' | 'WARNING' | 'FAIL';
  checks: SanityResult[];
  recommendation: 'SAFE TO USE' | 'USE WITH CAUTION' | 'BLOCK DATA';
  summary: string[];
}

// ─────────────────────────────────────────────────
// Generate Demo Data (30 days)
// ─────────────────────────────────────────────────

function generateDemoDataset(): DataPoint[] {
  const now = Date.now();
  const data: DataPoint[] = [];
  const circulatingSupply = 100_000_000;
  
  for (let i = 30; i >= 0; i--) {
    const dayOffset = i;
    const timestamp = now - dayOffset * 86400000;
    
    // Pseudo-random but deterministic
    const seed = dayOffset * 1337;
    const rand = (n: number) => ((seed * n) % 1000) / 1000;
    
    const baseInflow = 500_000 + rand(1) * 200_000;
    const baseOutflow = 480_000 + rand(2) * 180_000;
    
    // Add a spike on day 15
    const spikeMultiplier = dayOffset === 15 ? 5 : 1;
    
    data.push({
      timestamp,
      exchangeInflow: baseInflow * spikeMultiplier,
      exchangeOutflow: baseOutflow,
      netExchangeFlow: (baseInflow * spikeMultiplier) - baseOutflow,
      circulatingSupply,
    });
  }
  
  return data;
}

// ─────────────────────────────────────────────────
// Sanity Check Functions
// ─────────────────────────────────────────────────

function checkTimestampIntegrity(data: DataPoint[]): SanityResult {
  const details: string[] = [];
  let status: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
  
  const now = Date.now();
  const timestamps = data.map(d => d.timestamp);
  
  // First and last timestamp
  const first = new Date(Math.min(...timestamps));
  const last = new Date(Math.max(...timestamps));
  details.push(`First: ${first.toISOString()}`);
  details.push(`Last: ${last.toISOString()}`);
  details.push(`Range: ${data.length} data points`);
  
  // Check for duplicates
  const uniqueTimestamps = new Set(timestamps);
  if (uniqueTimestamps.size !== timestamps.length) {
    status = 'WARNING';
    details.push(`⚠️ Duplicate timestamps detected: ${timestamps.length - uniqueTimestamps.size} duplicates`);
  }
  
  // Check for future timestamps
  const futureTs = timestamps.filter(t => t > now);
  if (futureTs.length > 0) {
    status = 'FAIL';
    details.push(`❌ Future timestamps detected: ${futureTs.length}`);
  }
  
  // Check interval consistency
  const sorted = [...timestamps].sort((a, b) => a - b);
  const intervals = sorted.slice(1).map((t, i) => t - sorted[i]);
  const uniqueIntervals = [...new Set(intervals)];
  
  if (uniqueIntervals.length === 1) {
    const intervalHours = uniqueIntervals[0] / 3600000;
    details.push(`Interval: ${intervalHours}h (uniform)`);
  } else if (uniqueIntervals.length <= 3) {
    details.push(`Interval: mostly uniform (${uniqueIntervals.length} variations)`);
  } else {
    status = status === 'PASS' ? 'WARNING' : status;
    details.push(`⚠️ Interval inconsistency: ${uniqueIntervals.length} different intervals`);
  }
  
  return { check: 'Timestamp Integrity', status, details };
}

function checkNumericValidity(data: DataPoint[]): SanityResult {
  const details: string[] = [];
  let status: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
  
  const issues: string[] = [];
  
  data.forEach((d, idx) => {
    // NaN checks
    if (isNaN(d.exchangeInflow)) issues.push(`Row ${idx}: exchangeInflow is NaN`);
    if (isNaN(d.exchangeOutflow)) issues.push(`Row ${idx}: exchangeOutflow is NaN`);
    if (isNaN(d.netExchangeFlow)) issues.push(`Row ${idx}: netExchangeFlow is NaN`);
    if (isNaN(d.circulatingSupply)) issues.push(`Row ${idx}: circulatingSupply is NaN`);
    
    // Negative checks
    if (d.exchangeInflow < 0) issues.push(`Row ${idx}: negative inflow (${d.exchangeInflow})`);
    if (d.exchangeOutflow < 0) issues.push(`Row ${idx}: negative outflow (${d.exchangeOutflow})`);
    
    // Net flow verification
    const expectedNet = d.exchangeInflow - d.exchangeOutflow;
    const netDiff = Math.abs(d.netExchangeFlow - expectedNet);
    if (netDiff > 0.01) {
      issues.push(`Row ${idx}: netExchangeFlow mismatch (expected ${expectedNet}, got ${d.netExchangeFlow})`);
    }
    
    // Circulating supply check
    if (d.circulatingSupply <= 0) {
      issues.push(`Row ${idx}: circulatingSupply <= 0 (${d.circulatingSupply})`);
    }
  });
  
  if (issues.length === 0) {
    details.push('✓ No NaN values');
    details.push('✓ No negative inflow/outflow');
    details.push('✓ netExchangeFlow = inflow - outflow verified');
    details.push('✓ circulatingSupply > 0 at all times');
  } else {
    status = 'FAIL';
    details.push(`❌ ${issues.length} violations found:`);
    issues.slice(0, 5).forEach(i => details.push(`  - ${i}`));
    if (issues.length > 5) details.push(`  ... and ${issues.length - 5} more`);
  }
  
  return { check: 'Numeric Validity', status, details };
}

function checkUnitScaleConsistency(data: DataPoint[]): SanityResult {
  const details: string[] = [];
  let status: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
  
  // Calculate net_flow_pct_of_supply for each point
  const percentages = data.map(d => ({
    timestamp: d.timestamp,
    pct: (Math.abs(d.netExchangeFlow) / d.circulatingSupply) * 100,
  }));
  
  const pctValues = percentages.map(p => p.pct);
  const minPct = Math.min(...pctValues);
  const maxPct = Math.max(...pctValues);
  const avgPct = pctValues.reduce((a, b) => a + b, 0) / pctValues.length;
  
  details.push(`net_flow_pct_of_supply distribution:`);
  details.push(`  Min: ${minPct.toFixed(4)}%`);
  details.push(`  Max: ${maxPct.toFixed(4)}%`);
  details.push(`  Avg: ${avgPct.toFixed(4)}%`);
  
  // Check for impossible ratios (>20% daily)
  const impossibleRatios = percentages.filter(p => p.pct > 20);
  if (impossibleRatios.length > 0) {
    status = 'FAIL';
    details.push(`❌ Impossible ratios detected (>20% daily):`);
    impossibleRatios.slice(0, 3).forEach(p => {
      details.push(`  - ${new Date(p.timestamp).toISOString().split('T')[0]}: ${p.pct.toFixed(2)}%`);
    });
  } else if (maxPct > 5) {
    status = 'WARNING';
    details.push(`⚠️ High ratio detected: ${maxPct.toFixed(2)}% (>5% warrants review)`);
  } else {
    details.push(`✓ All ratios within reasonable range`);
  }
  
  return { check: 'Unit & Scale Consistency', status, details };
}

function checkSpikeOutliers(data: DataPoint[]): SanityResult {
  const details: string[] = [];
  let status: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
  
  const netFlows = data.map(d => ({
    timestamp: d.timestamp,
    value: Math.abs(d.netExchangeFlow),
  }));
  
  // Sort by value descending
  const sorted = [...netFlows].sort((a, b) => b.value - a.value);
  
  // Top 1% and 5%
  const top1pct = sorted.slice(0, Math.max(1, Math.floor(sorted.length * 0.01)));
  const top5pct = sorted.slice(0, Math.max(1, Math.floor(sorted.length * 0.05)));
  
  details.push(`Top 1% largest net flows (${top1pct.length} points):`);
  top1pct.forEach(p => {
    details.push(`  - ${new Date(p.timestamp).toISOString().split('T')[0]}: ${(p.value / 1_000_000).toFixed(2)}M`);
  });
  
  // Calculate rolling median
  const values = netFlows.map(n => n.value);
  const median = values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
  
  // Flag spikes > 3x median
  const spikes = netFlows.filter(n => n.value > median * 3);
  if (spikes.length > 0) {
    status = 'WARNING';
    details.push(`⚠️ Spikes detected (>3x median):`);
    spikes.forEach(s => {
      const ratio = (s.value / median).toFixed(1);
      details.push(`  - ${new Date(s.timestamp).toISOString().split('T')[0]}: ${ratio}x median`);
    });
    details.push(`  Possible explanations: exchange listing, migration, whale movement`);
  } else {
    details.push(`✓ No extreme spikes vs rolling median`);
  }
  
  return { check: 'Spike & Outlier Detection', status, details };
}

function checkDataCoverage(data: DataPoint[]): SanityResult {
  const details: string[] = [];
  let status: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
  
  const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp);
  const first = sorted[0].timestamp;
  const last = sorted[sorted.length - 1].timestamp;
  
  // Expected daily interval (86400000 ms)
  const expectedInterval = 86400000;
  const expectedDays = Math.ceil((last - first) / expectedInterval) + 1;
  const actualDays = sorted.length;
  
  const coverage = (actualDays / expectedDays) * 100;
  details.push(`Coverage: ${coverage.toFixed(1)}% (${actualDays}/${expectedDays} days)`);
  
  // Detect gaps
  const gaps: { start: Date; end: Date; days: number }[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const diff = sorted[i].timestamp - sorted[i - 1].timestamp;
    if (diff > expectedInterval * 1.5) {
      const gapDays = Math.floor(diff / expectedInterval) - 1;
      gaps.push({
        start: new Date(sorted[i - 1].timestamp),
        end: new Date(sorted[i].timestamp),
        days: gapDays,
      });
    }
  }
  
  if (gaps.length > 0) {
    status = 'WARNING';
    details.push(`⚠️ Missing intervals detected:`);
    gaps.slice(0, 3).forEach(g => {
      details.push(`  - ${g.start.toISOString().split('T')[0]} to ${g.end.toISOString().split('T')[0]} (${g.days} days)`);
    });
  } else {
    details.push(`✓ No missing intervals`);
  }
  
  // Check baseline windows
  if (actualDays >= 30) {
    details.push(`✓ 30-day baseline computable`);
  } else {
    status = status === 'PASS' ? 'WARNING' : status;
    details.push(`⚠️ Insufficient data for 30-day baseline (${actualDays} days)`);
  }
  
  if (actualDays >= 90) {
    details.push(`✓ 90-day baseline computable`);
  } else {
    details.push(`⚠️ Insufficient data for 90-day baseline (${actualDays} days)`);
  }
  
  return { check: 'Data Coverage & Gaps', status, details };
}

// ─────────────────────────────────────────────────
// Main Sanity Check
// ─────────────────────────────────────────────────

function runSanityCheck(data: DataPoint[]): SanityReport {
  const checks: SanityResult[] = [
    checkTimestampIntegrity(data),
    checkNumericValidity(data),
    checkUnitScaleConsistency(data),
    checkSpikeOutliers(data),
    checkDataCoverage(data),
  ];
  
  // Determine overall status
  let overallStatus: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
  const failCount = checks.filter(c => c.status === 'FAIL').length;
  const warnCount = checks.filter(c => c.status === 'WARNING').length;
  
  if (failCount > 0) {
    overallStatus = 'FAIL';
  } else if (warnCount > 0) {
    overallStatus = 'WARNING';
  }
  
  // Determine recommendation
  let recommendation: 'SAFE TO USE' | 'USE WITH CAUTION' | 'BLOCK DATA';
  if (overallStatus === 'FAIL') {
    recommendation = 'BLOCK DATA';
  } else if (overallStatus === 'WARNING') {
    recommendation = 'USE WITH CAUTION';
  } else {
    recommendation = 'SAFE TO USE';
  }
  
  // Summary
  const summary: string[] = [];
  if (failCount > 0) {
    summary.push(`${failCount} critical issue(s) detected`);
  }
  if (warnCount > 0) {
    summary.push(`${warnCount} warning(s) detected`);
  }
  if (failCount === 0 && warnCount === 0) {
    summary.push('All checks passed');
  }
  
  return { overallStatus, checks, recommendation, summary };
}

// ─────────────────────────────────────────────────
// Export for Use
// ─────────────────────────────────────────────────

export { 
  runSanityCheck, 
  generateDemoDataset,
  type DataPoint,
  type SanityReport,
  type SanityResult,
};

// ─────────────────────────────────────────────────
// CLI Execution
// ─────────────────────────────────────────────────

if (typeof require !== 'undefined' && require.main === module) {
  console.log('═══════════════════════════════════════════════');
  console.log('L1 EXCHANGE FLOW RISK — DATA SANITY REPORT');
  console.log('═══════════════════════════════════════════════');
  console.log('');
  
  const data = generateDemoDataset();
  const report = runSanityCheck(data);
  
  console.log(`OVERALL STATUS: ${report.overallStatus}`);
  console.log(`RECOMMENDATION: ${report.recommendation}`);
  console.log('');
  
  report.checks.forEach(check => {
    console.log(`─── ${check.check} [${check.status}] ───`);
    check.details.forEach(d => console.log(`  ${d}`));
    console.log('');
  });
  
  console.log('═══════════════════════════════════════════════');
  console.log('SUMMARY:');
  report.summary.forEach(s => console.log(`  • ${s}`));
  console.log('═══════════════════════════════════════════════');
}
