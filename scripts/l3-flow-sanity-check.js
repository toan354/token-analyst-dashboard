/**
 * L3 On-Chain Flow Overview - Data Sanity Check
 * Writes results to l3-sanity-report.json
 */

const fs = require('fs');

// Mock Data Definitions
const generateTimestamps = (days, startDate = new Date('2024-01-01')) => {
  return Array.from({ length: days }, (_, i) => 
    startDate.getTime() + i * 24 * 60 * 60 * 1000
  );
};

const MOCK_INFLOW_DOMINANT = {
  name: 'MOCK_INFLOW_DOMINANT',
  timestampSeries: generateTimestamps(14),
  inflowSeries: [120, 150, 180, 200, 160, 190, 210, 180, 220, 250, 240, 230, 260, 280],
  outflowSeries: [80, 90, 70, 100, 85, 95, 110, 90, 120, 130, 125, 115, 140, 150],
  netFlowSeries: [40, 60, 110, 100, 75, 95, 100, 90, 100, 120, 115, 115, 120, 130],
};

const MOCK_OUTFLOW_DOMINANT = {
  name: 'MOCK_OUTFLOW_DOMINANT',
  timestampSeries: generateTimestamps(14),
  inflowSeries: [80, 70, 60, 75, 65, 70, 55, 60, 50, 45, 55, 50, 40, 35],
  outflowSeries: [150, 160, 140, 155, 145, 160, 170, 165, 180, 175, 185, 190, 200, 210],
  netFlowSeries: [-70, -90, -80, -80, -80, -90, -115, -105, -130, -130, -130, -140, -160, -175],
};

const MOCK_OSCILLATING = {
  name: 'MOCK_OSCILLATING',
  timestampSeries: generateTimestamps(14),
  inflowSeries: [100, 80, 120, 90, 130, 70, 140, 85, 110, 95, 125, 80, 115, 100],
  outflowSeries: [90, 110, 85, 120, 95, 130, 80, 135, 100, 125, 90, 130, 95, 115],
  netFlowSeries: [10, -30, 35, -30, 35, -60, 60, -50, 10, -30, 35, -50, 20, -15],
};

const MOCK_STABLE_TRENDING = {
  name: 'MOCK_STABLE_TRENDING',
  timestampSeries: generateTimestamps(14),
  inflowSeries: [100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165],
  outflowSeries: [80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100, 102, 104, 106],
  netFlowSeries: [20, 23, 26, 29, 32, 35, 38, 41, 44, 47, 50, 53, 56, 59],
};

const ALL_MOCKS = [MOCK_INFLOW_DOMINANT, MOCK_OUTFLOW_DOMINANT, MOCK_OSCILLATING, MOCK_STABLE_TRENDING];

// Check functions
function checkTimeSeriesIntegrity(data) {
  const issues = [];
  const { timestampSeries, inflowSeries, outflowSeries, netFlowSeries } = data;
  
  const lengths = { timestamp: timestampSeries.length, inflow: inflowSeries.length, outflow: outflowSeries.length, netFlow: netFlowSeries.length };
  if (!Object.values(lengths).every(l => l === lengths.timestamp)) issues.push('Series length mismatch');
  
  if (new Set(timestampSeries).size !== timestampSeries.length) issues.push('Duplicate timestamps');
  
  const intervals = timestampSeries.slice(1).map((t, i) => t - timestampSeries[i]);
  const uniqueIntervals = [...new Set(intervals)];
  const intervalMs = uniqueIntervals[0];
  const intervalType = intervalMs === 86400000 ? 'daily' : intervalMs === 3600000 ? 'hourly' : intervalMs + 'ms';
  if (uniqueIntervals.length > 1) issues.push('Non-uniform intervals');
  if (timestampSeries.some(t => t > Date.now())) issues.push('Future timestamps');
  
  return { passed: issues.length === 0, issues, intervalType, totalDataPoints: timestampSeries.length,
    firstTimestamp: new Date(timestampSeries[0]).toISOString(), lastTimestamp: new Date(timestampSeries.slice(-1)[0]).toISOString() };
}

function checkNumericConsistency(data) {
  const issues = [], mismatches = [];
  const { inflowSeries, outflowSeries, netFlowSeries } = data;
  
  [['inflow', inflowSeries], ['outflow', outflowSeries], ['netFlow', netFlowSeries]].forEach(([name, arr]) => {
    if (arr.some(v => isNaN(v) || v === undefined || v === null)) issues.push(name + ' contains invalid values');
  });
  
  if (inflowSeries.some(v => v < 0)) issues.push('Negative inflows');
  if (outflowSeries.some(v => v < 0)) issues.push('Negative outflows');
  
  netFlowSeries.forEach((v, i) => {
    const exp = inflowSeries[i] - outflowSeries[i];
    if (Math.abs(exp - v) > 0.001) mismatches.push({ index: i, expected: exp, actual: v });
  });
  if (mismatches.length > 0) issues.push('net_flow != inflow - outflow at ' + mismatches.length + ' indices');
  
  return { passed: issues.length === 0, issues, netFlowVerified: mismatches.length === 0, mismatches: mismatches.slice(0, 3) };
}

function checkScalePlausibility(data) {
  const issues = [];
  const allValues = [...data.inflowSeries, ...data.outflowSeries, ...data.netFlowSeries.map(Math.abs)];
  const sorted = [...allValues].sort((a, b) => a - b);
  const max = Math.max(...allValues), median = sorted[Math.floor(sorted.length / 2)];
  const mean = (allValues.reduce((a, b) => a + b, 0) / allValues.length).toFixed(2);
  const maxMedianRatio = (max / median).toFixed(2);
  
  if (allValues.some(v => v > median * 10)) issues.push('Extreme spikes detected');
  
  return { passed: issues.length === 0, issues, max, median, mean, maxMedianRatio };
}

function checkBehavioralShape(data) {
  const net = data.netFlowSeries, total = net.length;
  const pos = net.filter(v => v > 0).length, neg = net.filter(v => v < 0).length;
  const dir = pos > total * 0.6 ? 'net_inflow' : neg > total * 0.6 ? 'net_outflow' : 'oscillating';
  let signChanges = 0;
  for (let i = 1; i < net.length; i++) if ((net[i] > 0) !== (net[i - 1] > 0)) signChanges++;
  const ratio = signChanges / (total - 1);
  const regime = ratio < 0.2 ? 'trending' : ratio < 0.5 ? 'stable' : 'unstable';
  const top1 = net.map(Math.abs).sort((a, b) => b - a).slice(0, Math.max(1, Math.ceil(total * 0.01)));
  return { dominantDirection: dir, regime, signChanges, changeRatio: ratio.toFixed(2), extremeBursts: top1 };
}

function checkDataCoverage(data) {
  const ts = data.timestampSeries, issues = [];
  const expected = Math.floor((ts.slice(-1)[0] - ts[0]) / 86400000) + 1;
  const coverage = ((ts.length / expected) * 100).toFixed(1);
  const gaps = [];
  for (let i = 1; i < ts.length; i++) if (ts[i] - ts[i - 1] > 86400000 * 1.5) gaps.push({ from: new Date(ts[i - 1]).toISOString().split('T')[0], to: new Date(ts[i]).toISOString().split('T')[0] });
  if (gaps.length > 0) issues.push('Gaps: ' + gaps.length);
  if (parseFloat(coverage) < 100) issues.push('Coverage: ' + coverage + '%');
  return { passed: issues.length === 0, issues, coverage, expectedPoints: expected, actualPoints: ts.length, gaps };
}

// Run all checks
const results = ALL_MOCKS.map(data => ({
  dataset: data.name,
  timeSeries: checkTimeSeriesIntegrity(data),
  numeric: checkNumericConsistency(data),
  scale: checkScalePlausibility(data),
  behavioral: checkBehavioralShape(data),
  coverage: checkDataCoverage(data),
}));

// Determine status
let overallStatus = 'PASS';
const allIssues = [];
results.forEach(r => {
  const issues = [...r.timeSeries.issues, ...r.numeric.issues, ...r.scale.issues, ...r.coverage.issues];
  issues.forEach(i => allIssues.push('[' + r.dataset + '] ' + i));
  if (!r.timeSeries.passed || !r.numeric.passed) overallStatus = 'FAIL';
  else if ((!r.scale.passed || !r.coverage.passed) && overallStatus !== 'FAIL') overallStatus = 'WARNING';
});

const report = {
  title: 'L3 ON-CHAIN FLOW OVERVIEW - DATA SANITY CHECK',
  timestamp: new Date().toISOString(),
  overallStatus,
  recommendation: overallStatus === 'PASS' ? 'SAFE TO USE' : overallStatus === 'WARNING' ? 'USE WITH CAUTION' : 'BLOCK DATA',
  summary: { datasetsChecked: results.length, totalIssues: allIssues.length, issues: allIssues },
  datasets: results.map(r => ({
    name: r.dataset,
    status: (!r.timeSeries.passed || !r.numeric.passed) ? 'FAIL' : (!r.scale.passed || !r.coverage.passed) ? 'WARNING' : 'PASS',
    timeSeries: { status: r.timeSeries.passed ? 'PASS' : 'FAIL', intervalType: r.timeSeries.intervalType, dataPoints: r.timeSeries.totalDataPoints, range: r.timeSeries.firstTimestamp.split('T')[0] + ' to ' + r.timeSeries.lastTimestamp.split('T')[0] },
    numeric: { status: r.numeric.passed ? 'PASS' : 'FAIL', netFlowVerified: r.numeric.netFlowVerified, mismatches: r.numeric.mismatches },
    scale: { status: r.scale.passed ? 'PASS' : 'WARNING', max: r.scale.max, median: r.scale.median, maxMedianRatio: r.scale.maxMedianRatio },
    behavioral: r.behavioral,
    coverage: { status: r.coverage.passed ? 'PASS' : 'WARNING', percentage: r.coverage.coverage, gaps: r.coverage.gaps.length },
  })),
};

fs.writeFileSync('l3-sanity-report.json', JSON.stringify(report, null, 2), 'utf8');
console.log('Report written to l3-sanity-report.json');
console.log('Overall Status:', overallStatus);
console.log('Recommendation:', report.recommendation);
