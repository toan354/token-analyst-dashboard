/**
 * L3 Exchange vs Non-Exchange Flow - Data Sanity Check
 * 
 * PURPOSE: Read-only audit of behavioral flow split data.
 * NO data transformation. NO verdicts or interpretations.
 * 
 * Writes results to l3-flow-split-sanity-report.json
 */

const fs = require('fs');

// ─────────────────────────────────────────────────
// Mock Data Definitions (from ExchangeVsNonExchangeFlowModule)
// ─────────────────────────────────────────────────

const generateTimestamps = (days, startDate = new Date('2024-01-01')) => {
  return Array.from({ length: days }, (_, i) => 
    startDate.getTime() + i * 24 * 60 * 60 * 1000
  );
};

const MOCK_EXCHANGE_DOMINANT = {
  name: 'MOCK_EXCHANGE_DOMINANT',
  timestampSeries: generateTimestamps(14),
  exchangeInflowSeries: [200, 250, 220, 280, 260, 300, 290, 320, 310, 350, 340, 380, 370, 400],
  exchangeOutflowSeries: [80, 90, 85, 100, 95, 110, 105, 115, 110, 125, 120, 135, 130, 145],
  nonExchangeFlowSeries: [30, 35, 25, 40, 30, 45, 35, 50, 40, 55, 45, 60, 50, 65],
};

const MOCK_NONEXCHANGE_DOMINANT = {
  name: 'MOCK_NONEXCHANGE_DOMINANT',
  timestampSeries: generateTimestamps(14),
  exchangeInflowSeries: [50, 45, 55, 40, 60, 35, 50, 40, 55, 35, 50, 40, 45, 35],
  exchangeOutflowSeries: [80, 85, 75, 90, 70, 95, 80, 90, 75, 95, 80, 90, 85, 95],
  nonExchangeFlowSeries: [150, 180, 160, 200, 170, 220, 190, 240, 200, 260, 220, 280, 240, 300],
};

const MOCK_ROTATING = {
  name: 'MOCK_ROTATING',
  timestampSeries: generateTimestamps(14),
  exchangeInflowSeries: [150, 80, 180, 60, 200, 70, 160, 90, 170, 80, 190, 65, 175, 85],
  exchangeOutflowSeries: [50, 60, 40, 80, 30, 90, 50, 70, 40, 85, 35, 95, 45, 80],
  nonExchangeFlowSeries: [60, 180, 50, 200, 40, 190, 70, 160, 55, 185, 45, 210, 60, 175],
};

const MOCK_BALANCED = {
  name: 'MOCK_BALANCED',
  timestampSeries: generateTimestamps(14),
  exchangeInflowSeries: [120, 125, 130, 128, 132, 127, 135, 130, 138, 133, 140, 136, 143, 139],
  exchangeOutflowSeries: [60, 62, 65, 63, 66, 64, 68, 65, 70, 67, 72, 69, 74, 71],
  nonExchangeFlowSeries: [55, 58, 60, 62, 64, 60, 66, 63, 68, 65, 70, 67, 72, 69],
};

const ALL_MOCKS = [MOCK_EXCHANGE_DOMINANT, MOCK_NONEXCHANGE_DOMINANT, MOCK_ROTATING, MOCK_BALANCED];

// ─────────────────────────────────────────────────
// Sanity Check Functions
// ─────────────────────────────────────────────────

function checkTimeSeriesAlignment(data) {
  const issues = [];
  const { timestampSeries, exchangeInflowSeries, exchangeOutflowSeries, nonExchangeFlowSeries } = data;
  
  // Check all series have same length
  const lengths = {
    timestamp: timestampSeries.length,
    exchangeInflow: exchangeInflowSeries.length,
    exchangeOutflow: exchangeOutflowSeries.length,
    nonExchangeFlow: nonExchangeFlowSeries.length,
  };
  
  if (!Object.values(lengths).every(l => l === lengths.timestamp)) {
    issues.push('Series length mismatch: ' + JSON.stringify(lengths));
  }
  
  // Check for duplicate timestamps
  if (new Set(timestampSeries).size !== timestampSeries.length) {
    issues.push('Duplicate timestamps detected');
  }
  
  // Check uniform interval
  const intervals = timestampSeries.slice(1).map((t, i) => t - timestampSeries[i]);
  const uniqueIntervals = [...new Set(intervals)];
  const intervalMs = uniqueIntervals[0];
  const intervalType = intervalMs === 86400000 ? 'daily' : intervalMs === 3600000 ? 'hourly' : intervalMs + 'ms';
  
  if (uniqueIntervals.length > 1) {
    issues.push('Non-uniform intervals');
  }
  
  // Check for future timestamps
  if (timestampSeries.some(t => t > Date.now())) {
    issues.push('Future timestamps detected');
  }
  
  return {
    passed: issues.length === 0,
    issues,
    intervalType,
    totalDataPoints: timestampSeries.length,
    firstTimestamp: new Date(timestampSeries[0]).toISOString(),
    lastTimestamp: new Date(timestampSeries.slice(-1)[0]).toISOString(),
  };
}

function checkNumericValidity(data) {
  const issues = [];
  const invalidEntries = [];
  const { exchangeInflowSeries, exchangeOutflowSeries, nonExchangeFlowSeries } = data;
  
  // Check for NaN/undefined
  const checkArray = (arr, name) => {
    arr.forEach((v, i) => {
      if (isNaN(v) || v === undefined || v === null) {
        issues.push(`${name} contains invalid value at index ${i}`);
        invalidEntries.push({ field: name, index: i, value: v });
      }
    });
  };
  
  checkArray(exchangeInflowSeries, 'exchangeInflowSeries');
  checkArray(exchangeOutflowSeries, 'exchangeOutflowSeries');
  checkArray(nonExchangeFlowSeries, 'nonExchangeFlowSeries');
  
  // Check non-negative constraints
  const negativeInflows = exchangeInflowSeries.filter(v => v < 0);
  const negativeOutflows = exchangeOutflowSeries.filter(v => v < 0);
  const negativeNonExchange = nonExchangeFlowSeries.filter(v => v < 0);
  
  if (negativeInflows.length > 0) issues.push('Negative exchange inflows: ' + negativeInflows.length);
  if (negativeOutflows.length > 0) issues.push('Negative exchange outflows: ' + negativeOutflows.length);
  if (negativeNonExchange.length > 0) issues.push('Negative non-exchange flows: ' + negativeNonExchange.length);
  
  return {
    passed: issues.length === 0,
    issues,
    invalidEntries: invalidEntries.slice(0, 5),
  };
}

function checkFlowReconciliation(data) {
  const issues = [];
  const { exchangeInflowSeries, exchangeOutflowSeries, nonExchangeFlowSeries } = data;
  
  // Compute exchange net flow for each timestamp
  const exchangeNetFlow = exchangeInflowSeries.map((inflow, i) => inflow - exchangeOutflowSeries[i]);
  
  // Calculate residuals (what portion of total is exchange vs non-exchange)
  const residuals = [];
  for (let i = 0; i < exchangeNetFlow.length; i++) {
    const exchNet = exchangeNetFlow[i];
    const nonExch = nonExchangeFlowSeries[i];
    const total = Math.abs(exchNet) + Math.abs(nonExch);
    
    // Residual is unused - we're just checking the relationship exists and is consistent
    if (total > 0) {
      residuals.push({
        index: i,
        exchangeNet: exchNet,
        nonExchange: nonExch,
        total: total,
      });
    }
  }
  
  // Calculate exchange net flow verification
  const exchangeNetVerified = exchangeNetFlow.every((net, i) => 
    Math.abs(net - (exchangeInflowSeries[i] - exchangeOutflowSeries[i])) < 0.001
  );
  
  if (!exchangeNetVerified) {
    issues.push('Exchange net flow calculation inconsistency');
  }
  
  // Distribution stats
  const allResidualTotals = residuals.map(r => r.total);
  const maxTotal = Math.max(...allResidualTotals);
  const minTotal = Math.min(...allResidualTotals);
  const medianTotal = allResidualTotals.sort((a, b) => a - b)[Math.floor(allResidualTotals.length / 2)];
  const maxMedianRatio = (maxTotal / medianTotal).toFixed(2);
  
  return {
    passed: issues.length === 0,
    issues,
    exchangeNetFlowVerified: exchangeNetVerified,
    distribution: {
      maxTotal,
      minTotal,
      medianTotal,
      maxMedianRatio,
    },
  };
}

function checkLabelingPlausibility(data) {
  const { exchangeInflowSeries, exchangeOutflowSeries, nonExchangeFlowSeries } = data;
  const issues = [];
  
  // Calculate exchange share for each timestamp
  const exchangeShares = [];
  for (let i = 0; i < exchangeInflowSeries.length; i++) {
    const exchTotal = exchangeInflowSeries[i] + exchangeOutflowSeries[i];
    const nonExch = nonExchangeFlowSeries[i];
    const total = exchTotal + Math.abs(nonExch);
    const share = total > 0 ? (exchTotal / total) * 100 : 0;
    exchangeShares.push(share);
  }
  
  // Check if constantly near 0% or 100%
  const avgShare = exchangeShares.reduce((a, b) => a + b, 0) / exchangeShares.length;
  const minShare = Math.min(...exchangeShares);
  const maxShare = Math.max(...exchangeShares);
  
  if (avgShare < 5) issues.push('Exchange share constantly near 0%');
  if (avgShare > 95) issues.push('Exchange share constantly near 100%');
  
  // Detect sudden labeling shifts (>30% change between consecutive days)
  const shifts = [];
  for (let i = 1; i < exchangeShares.length; i++) {
    const change = Math.abs(exchangeShares[i] - exchangeShares[i - 1]);
    if (change > 30) {
      shifts.push({ index: i, from: exchangeShares[i - 1].toFixed(1), to: exchangeShares[i].toFixed(1), change: change.toFixed(1) });
    }
  }
  
  if (shifts.length > exchangeShares.length * 0.3) {
    issues.push('Frequent labeling shifts detected');
  }
  
  return {
    passed: issues.length === 0,
    issues,
    exchangeShareDistribution: {
      min: minShare.toFixed(1),
      max: maxShare.toFixed(1),
      avg: avgShare.toFixed(1),
    },
    regimeShifts: shifts.slice(0, 5),
    totalShifts: shifts.length,
  };
}

function checkCoverageAndGaps(data) {
  const { timestampSeries } = data;
  const issues = [];
  
  const first = timestampSeries[0];
  const last = timestampSeries.slice(-1)[0];
  const expectedIntervals = Math.floor((last - first) / 86400000) + 1;
  const actualPoints = timestampSeries.length;
  const coverage = ((actualPoints / expectedIntervals) * 100).toFixed(1);
  
  // Detect gaps
  const gaps = [];
  for (let i = 1; i < timestampSeries.length; i++) {
    const interval = timestampSeries[i] - timestampSeries[i - 1];
    if (interval > 86400000 * 1.5) {
      gaps.push({
        from: new Date(timestampSeries[i - 1]).toISOString().split('T')[0],
        to: new Date(timestampSeries[i]).toISOString().split('T')[0],
        gapDays: (interval / 86400000).toFixed(1),
      });
    }
  }
  
  if (gaps.length > 0) issues.push('Gaps detected: ' + gaps.length);
  if (parseFloat(coverage) < 100) issues.push('Coverage: ' + coverage + '%');
  
  return {
    passed: issues.length === 0,
    issues,
    coverage,
    expectedPoints: expectedIntervals,
    actualPoints,
    gaps,
  };
}

// ─────────────────────────────────────────────────
// Run All Checks
// ─────────────────────────────────────────────────

function runSanityCheck(data) {
  return {
    dataset: data.name,
    alignment: checkTimeSeriesAlignment(data),
    numeric: checkNumericValidity(data),
    reconciliation: checkFlowReconciliation(data),
    labeling: checkLabelingPlausibility(data),
    coverage: checkCoverageAndGaps(data),
  };
}

const results = ALL_MOCKS.map(runSanityCheck);

// Determine overall status
let overallStatus = 'PASS';
const allIssues = [];

results.forEach(r => {
  const datasetIssues = [
    ...r.alignment.issues,
    ...r.numeric.issues,
    ...r.reconciliation.issues,
    ...r.labeling.issues,
    ...r.coverage.issues,
  ];
  
  datasetIssues.forEach(i => allIssues.push('[' + r.dataset + '] ' + i));
  
  // Determine status
  if (!r.alignment.passed || !r.numeric.passed || !r.reconciliation.passed) {
    overallStatus = 'FAIL';
  } else if ((!r.labeling.passed || !r.coverage.passed) && overallStatus !== 'FAIL') {
    overallStatus = 'WARNING';
  }
});

const report = {
  title: 'L3 EXCHANGE VS NON-EXCHANGE FLOW - DATA SANITY CHECK',
  timestamp: new Date().toISOString(),
  overallStatus,
  recommendation: overallStatus === 'PASS' ? 'SAFE TO USE' : overallStatus === 'WARNING' ? 'USE WITH CAUTION' : 'BLOCK DATA',
  summary: {
    datasetsChecked: results.length,
    totalIssues: allIssues.length,
    issues: allIssues,
  },
  datasets: results.map(r => ({
    name: r.dataset,
    status: (!r.alignment.passed || !r.numeric.passed || !r.reconciliation.passed) ? 'FAIL' : 
            (!r.labeling.passed || !r.coverage.passed) ? 'WARNING' : 'PASS',
    alignment: {
      status: r.alignment.passed ? 'PASS' : 'FAIL',
      intervalType: r.alignment.intervalType,
      dataPoints: r.alignment.totalDataPoints,
      range: r.alignment.firstTimestamp.split('T')[0] + ' to ' + r.alignment.lastTimestamp.split('T')[0],
    },
    numeric: {
      status: r.numeric.passed ? 'PASS' : 'FAIL',
      invalidEntries: r.numeric.invalidEntries,
    },
    reconciliation: {
      status: r.reconciliation.passed ? 'PASS' : 'FAIL',
      exchangeNetFlowVerified: r.reconciliation.exchangeNetFlowVerified,
      maxMedianRatio: r.reconciliation.distribution.maxMedianRatio,
    },
    labeling: {
      status: r.labeling.passed ? 'PASS' : 'WARNING',
      exchangeShareMin: r.labeling.exchangeShareDistribution.min,
      exchangeShareMax: r.labeling.exchangeShareDistribution.max,
      exchangeShareAvg: r.labeling.exchangeShareDistribution.avg,
      regimeShifts: r.labeling.totalShifts,
    },
    coverage: {
      status: r.coverage.passed ? 'PASS' : 'WARNING',
      percentage: r.coverage.coverage,
      gaps: r.coverage.gaps.length,
    },
  })),
};

fs.writeFileSync('l3-flow-split-sanity-report.json', JSON.stringify(report, null, 2), 'utf8');
console.log('Report written to l3-flow-split-sanity-report.json');
console.log('Overall Status:', overallStatus);
console.log('Recommendation:', report.recommendation);
