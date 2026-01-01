/**
 * Sanity Check Runner
 * 
 * Execute with: node scripts/run-sanity-check.mjs
 */

// Generate demo dataset inline (copy from sanity-check.ts)
function generateDemoDataset() {
  const now = Date.now();
  const data = [];
  const circulatingSupply = 100_000_000;
  
  for (let i = 30; i >= 0; i--) {
    const dayOffset = i;
    const timestamp = now - dayOffset * 86400000;
    
    const seed = dayOffset * 1337;
    const rand = (n) => ((seed * n) % 1000) / 1000;
    
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

// Sanity check functions
function checkTimestampIntegrity(data) {
  const details = [];
  let status = 'PASS';
  
  const now = Date.now();
  const timestamps = data.map(d => d.timestamp);
  
  const first = new Date(Math.min(...timestamps));
  const last = new Date(Math.max(...timestamps));
  details.push(`First: ${first.toISOString()}`);
  details.push(`Last: ${last.toISOString()}`);
  details.push(`Range: ${data.length} data points`);
  
  const uniqueTimestamps = new Set(timestamps);
  if (uniqueTimestamps.size !== timestamps.length) {
    status = 'WARNING';
    details.push(`⚠️ Duplicate timestamps detected: ${timestamps.length - uniqueTimestamps.size} duplicates`);
  }
  
  const futureTs = timestamps.filter(t => t > now);
  if (futureTs.length > 0) {
    status = 'FAIL';
    details.push(`❌ Future timestamps detected: ${futureTs.length}`);
  }
  
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

function checkNumericValidity(data) {
  const details = [];
  let status = 'PASS';
  
  const issues = [];
  
  data.forEach((d, idx) => {
    if (isNaN(d.exchangeInflow)) issues.push(`Row ${idx}: exchangeInflow is NaN`);
    if (isNaN(d.exchangeOutflow)) issues.push(`Row ${idx}: exchangeOutflow is NaN`);
    if (isNaN(d.netExchangeFlow)) issues.push(`Row ${idx}: netExchangeFlow is NaN`);
    if (isNaN(d.circulatingSupply)) issues.push(`Row ${idx}: circulatingSupply is NaN`);
    
    if (d.exchangeInflow < 0) issues.push(`Row ${idx}: negative inflow (${d.exchangeInflow})`);
    if (d.exchangeOutflow < 0) issues.push(`Row ${idx}: negative outflow (${d.exchangeOutflow})`);
    
    const expectedNet = d.exchangeInflow - d.exchangeOutflow;
    const netDiff = Math.abs(d.netExchangeFlow - expectedNet);
    if (netDiff > 0.01) {
      issues.push(`Row ${idx}: netExchangeFlow mismatch`);
    }
    
    if (d.circulatingSupply <= 0) {
      issues.push(`Row ${idx}: circulatingSupply <= 0`);
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
  }
  
  return { check: 'Numeric Validity', status, details };
}

function checkUnitScaleConsistency(data) {
  const details = [];
  let status = 'PASS';
  
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
  
  const impossibleRatios = percentages.filter(p => p.pct > 20);
  if (impossibleRatios.length > 0) {
    status = 'FAIL';
    details.push(`❌ Impossible ratios detected (>20% daily)`);
  } else if (maxPct > 5) {
    status = 'WARNING';
    details.push(`⚠️ High ratio detected: ${maxPct.toFixed(2)}% (>5% warrants review)`);
  } else {
    details.push(`✓ All ratios within reasonable range`);
  }
  
  return { check: 'Unit & Scale Consistency', status, details };
}

function checkSpikeOutliers(data) {
  const details = [];
  let status = 'PASS';
  
  const netFlows = data.map(d => ({
    timestamp: d.timestamp,
    value: Math.abs(d.netExchangeFlow),
  }));
  
  const sorted = [...netFlows].sort((a, b) => b.value - a.value);
  const top1pct = sorted.slice(0, Math.max(1, Math.floor(sorted.length * 0.01)));
  
  details.push(`Top 1% largest net flows (${top1pct.length} points):`);
  top1pct.forEach(p => {
    details.push(`  - ${new Date(p.timestamp).toISOString().split('T')[0]}: ${(p.value / 1_000_000).toFixed(2)}M`);
  });
  
  const values = netFlows.map(n => n.value);
  const median = values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
  
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

function checkDataCoverage(data) {
  const details = [];
  let status = 'PASS';
  
  const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp);
  const first = sorted[0].timestamp;
  const last = sorted[sorted.length - 1].timestamp;
  
  const expectedInterval = 86400000;
  const expectedDays = Math.ceil((last - first) / expectedInterval) + 1;
  const actualDays = sorted.length;
  
  const coverage = (actualDays / expectedDays) * 100;
  details.push(`Coverage: ${coverage.toFixed(1)}% (${actualDays}/${expectedDays} days)`);
  
  const gaps = [];
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
    details.push(`⚠️ Missing intervals detected`);
  } else {
    details.push(`✓ No missing intervals`);
  }
  
  if (actualDays >= 30) {
    details.push(`✓ 30-day baseline computable`);
  } else {
    status = 'WARNING';
    details.push(`⚠️ Insufficient data for 30-day baseline`);
  }
  
  if (actualDays >= 90) {
    details.push(`✓ 90-day baseline computable`);
  } else {
    details.push(`⚠️ Insufficient data for 90-day baseline (${actualDays} days)`);
  }
  
  return { check: 'Data Coverage & Gaps', status, details };
}

function runSanityCheck(data) {
  const checks = [
    checkTimestampIntegrity(data),
    checkNumericValidity(data),
    checkUnitScaleConsistency(data),
    checkSpikeOutliers(data),
    checkDataCoverage(data),
  ];
  
  let overallStatus = 'PASS';
  const failCount = checks.filter(c => c.status === 'FAIL').length;
  const warnCount = checks.filter(c => c.status === 'WARNING').length;
  
  if (failCount > 0) overallStatus = 'FAIL';
  else if (warnCount > 0) overallStatus = 'WARNING';
  
  let recommendation;
  if (overallStatus === 'FAIL') recommendation = 'BLOCK DATA';
  else if (overallStatus === 'WARNING') recommendation = 'USE WITH CAUTION';
  else recommendation = 'SAFE TO USE';
  
  const summary = [];
  if (failCount > 0) summary.push(`${failCount} critical issue(s) detected`);
  if (warnCount > 0) summary.push(`${warnCount} warning(s) detected`);
  if (failCount === 0 && warnCount === 0) summary.push('All checks passed');
  
  return { overallStatus, checks, recommendation, summary };
}

// Run the sanity check
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
