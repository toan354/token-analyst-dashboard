/**
 * L3 Whale Transfer Behavior - Data Sanity Check
 * 
 * PURPOSE: Read-only audit of whale/large transfer behavioral data.
 * NO data transformation. NO verdicts or risk interpretation.
 * 
 * Writes results to l3-whale-sanity-report.json
 */

const fs = require('fs');

// ─────────────────────────────────────────────────
// Mock Data Definitions (from WhaleTransferBehaviorModule)
// ─────────────────────────────────────────────────

const generateTimestamps = (days, startDate = new Date('2024-01-01')) => {
  return Array.from({ length: days }, (_, i) => 
    startDate.getTime() + i * 24 * 60 * 60 * 1000
  );
};

const MOCK_LOW_STEADY = {
  name: 'MOCK_LOW_STEADY',
  timestampSeries: generateTimestamps(14),
  largeTransferCountSeries: [2, 3, 2, 4, 3, 2, 3, 4, 2, 3, 4, 3, 2, 3],
  largeTransferVolumeSeries: [50000, 75000, 60000, 100000, 80000, 55000, 70000, 95000, 65000, 80000, 90000, 75000, 60000, 70000],
  largeTransferThreshold: 10000,
  whaleExchangeFlowSeries: [25000, 40000, 30000, 50000, 40000, 25000, 35000, 50000, 35000, 40000, 45000, 35000, 30000, 35000],
  whaleNonExchangeFlowSeries: [25000, 35000, 30000, 50000, 40000, 30000, 35000, 45000, 30000, 40000, 45000, 40000, 30000, 35000],
};

const MOCK_HIGH_BURST = {
  name: 'MOCK_HIGH_BURST',
  timestampSeries: generateTimestamps(14),
  largeTransferCountSeries: [3, 4, 5, 25, 35, 40, 8, 5, 4, 3, 4, 5, 4, 3],
  largeTransferVolumeSeries: [100000, 150000, 200000, 2500000, 4000000, 5500000, 350000, 180000, 120000, 100000, 140000, 170000, 130000, 110000],
  largeTransferThreshold: 25000,
  whaleExchangeFlowSeries: [60000, 90000, 120000, 2000000, 3200000, 4400000, 250000, 100000, 70000, 60000, 80000, 100000, 75000, 65000],
  whaleNonExchangeFlowSeries: [40000, 60000, 80000, 500000, 800000, 1100000, 100000, 80000, 50000, 40000, 60000, 70000, 55000, 45000],
};

const MOCK_DESTINATION_SHIFT = {
  name: 'MOCK_DESTINATION_SHIFT',
  timestampSeries: generateTimestamps(14),
  largeTransferCountSeries: [8, 10, 12, 15, 14, 12, 10, 8, 10, 12, 14, 16, 15, 12],
  largeTransferVolumeSeries: [400000, 500000, 600000, 750000, 700000, 600000, 500000, 400000, 500000, 600000, 700000, 800000, 750000, 600000],
  largeTransferThreshold: 25000,
  whaleExchangeFlowSeries: [350000, 420000, 480000, 550000, 450000, 300000, 200000, 120000, 150000, 180000, 200000, 220000, 200000, 180000],
  whaleNonExchangeFlowSeries: [50000, 80000, 120000, 200000, 250000, 300000, 300000, 280000, 350000, 420000, 500000, 580000, 550000, 420000],
};

const MOCK_MIXED_ACTIVITY = {
  name: 'MOCK_MIXED_ACTIVITY',
  timestampSeries: generateTimestamps(14),
  largeTransferCountSeries: [5, 8, 12, 6, 15, 4, 18, 7, 10, 5, 14, 8, 11, 6],
  largeTransferVolumeSeries: [200000, 400000, 600000, 250000, 750000, 180000, 900000, 350000, 500000, 220000, 700000, 400000, 550000, 280000],
  largeTransferThreshold: 20000,
  whaleExchangeFlowSeries: [100000, 200000, 300000, 125000, 375000, 90000, 450000, 175000, 250000, 110000, 350000, 200000, 275000, 140000],
  whaleNonExchangeFlowSeries: [100000, 200000, 300000, 125000, 375000, 90000, 450000, 175000, 250000, 110000, 350000, 200000, 275000, 140000],
};

const ALL_MOCKS = [MOCK_LOW_STEADY, MOCK_HIGH_BURST, MOCK_DESTINATION_SHIFT, MOCK_MIXED_ACTIVITY];

// ─────────────────────────────────────────────────
// Sanity Check Functions
// ─────────────────────────────────────────────────

function checkTimeSeriesIntegrity(data) {
  const issues = [];
  const { timestampSeries, largeTransferCountSeries, largeTransferVolumeSeries } = data;
  
  const lengths = {
    timestamp: timestampSeries.length,
    count: largeTransferCountSeries.length,
    volume: largeTransferVolumeSeries.length,
  };
  
  // Add optional series if present
  if (data.whaleExchangeFlowSeries) lengths.exchangeFlow = data.whaleExchangeFlowSeries.length;
  if (data.whaleNonExchangeFlowSeries) lengths.nonExchangeFlow = data.whaleNonExchangeFlowSeries.length;
  
  if (!Object.values(lengths).every(l => l === lengths.timestamp)) {
    issues.push('Series length mismatch: ' + JSON.stringify(lengths));
  }
  
  if (new Set(timestampSeries).size !== timestampSeries.length) {
    issues.push('Duplicate timestamps detected');
  }
  
  const intervals = timestampSeries.slice(1).map((t, i) => t - timestampSeries[i]);
  const uniqueIntervals = [...new Set(intervals)];
  const intervalMs = uniqueIntervals[0];
  const intervalType = intervalMs === 86400000 ? 'daily' : intervalMs === 3600000 ? 'hourly' : intervalMs + 'ms';
  
  if (uniqueIntervals.length > 1) {
    issues.push('Non-uniform intervals');
  }
  
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
  const { largeTransferCountSeries, largeTransferVolumeSeries, largeTransferThreshold } = data;
  
  // Check for NaN/undefined in counts
  largeTransferCountSeries.forEach((v, i) => {
    if (isNaN(v) || v === undefined || v === null) {
      issues.push('Count contains invalid value at index ' + i);
      invalidEntries.push({ field: 'count', index: i, value: v });
    }
    if (v < 0) {
      issues.push('Negative count at index ' + i);
      invalidEntries.push({ field: 'count', index: i, value: v });
    }
  });
  
  // Check for NaN/undefined in volumes
  largeTransferVolumeSeries.forEach((v, i) => {
    if (isNaN(v) || v === undefined || v === null) {
      issues.push('Volume contains invalid value at index ' + i);
      invalidEntries.push({ field: 'volume', index: i, value: v });
    }
    if (v < 0) {
      issues.push('Negative volume at index ' + i);
      invalidEntries.push({ field: 'volume', index: i, value: v });
    }
  });
  
  // Check threshold
  if (!largeTransferThreshold || largeTransferThreshold <= 0) {
    issues.push('Invalid or missing threshold');
  }
  
  return {
    passed: issues.length === 0,
    issues,
    invalidEntries: invalidEntries.slice(0, 5),
    threshold: largeTransferThreshold,
  };
}

function checkCountVolumePlausibility(data) {
  const issues = [];
  const outliers = [];
  const { largeTransferCountSeries, largeTransferVolumeSeries, largeTransferThreshold } = data;
  
  // Calculate correlation between count and volume
  const n = largeTransferCountSeries.length;
  const meanCount = largeTransferCountSeries.reduce((a, b) => a + b, 0) / n;
  const meanVolume = largeTransferVolumeSeries.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denomCountSq = 0;
  let denomVolumeSq = 0;
  
  for (let i = 0; i < n; i++) {
    const countDiff = largeTransferCountSeries[i] - meanCount;
    const volumeDiff = largeTransferVolumeSeries[i] - meanVolume;
    numerator += countDiff * volumeDiff;
    denomCountSq += countDiff * countDiff;
    denomVolumeSq += volumeDiff * volumeDiff;
  }
  
  const correlation = denomCountSq > 0 && denomVolumeSq > 0 
    ? numerator / (Math.sqrt(denomCountSq) * Math.sqrt(denomVolumeSq))
    : 0;
  
  // Check for extreme volume with zero count
  for (let i = 0; i < n; i++) {
    const count = largeTransferCountSeries[i];
    const volume = largeTransferVolumeSeries[i];
    
    if (count === 0 && volume > largeTransferThreshold) {
      issues.push('Volume > threshold but count = 0 at index ' + i);
      outliers.push({ index: i, count, volume, issue: 'volume_without_count' });
    }
    
    if (count > 10 && volume < largeTransferThreshold) {
      issues.push('High count but volume < threshold at index ' + i);
      outliers.push({ index: i, count, volume, issue: 'count_without_volume' });
    }
  }
  
  // Check avg volume per transfer makes sense
  const avgVolumePerTransfer = [];
  for (let i = 0; i < n; i++) {
    if (largeTransferCountSeries[i] > 0) {
      avgVolumePerTransfer.push(largeTransferVolumeSeries[i] / largeTransferCountSeries[i]);
    }
  }
  
  const minAvg = avgVolumePerTransfer.length > 0 ? Math.min(...avgVolumePerTransfer) : 0;
  const maxAvg = avgVolumePerTransfer.length > 0 ? Math.max(...avgVolumePerTransfer) : 0;
  
  // If min avg is below threshold, flag it
  if (minAvg > 0 && minAvg < largeTransferThreshold * 0.5) {
    issues.push('Min avg volume per transfer is below expected threshold');
  }
  
  return {
    passed: issues.length === 0,
    issues,
    correlation: correlation.toFixed(3),
    outliers: outliers.slice(0, 5),
    avgVolumePerTransfer: { min: minAvg.toFixed(0), max: maxAvg.toFixed(0) },
  };
}

function checkScalePlausibility(data) {
  const issues = [];
  const { largeTransferVolumeSeries } = data;
  
  const sorted = [...largeTransferVolumeSeries].sort((a, b) => a - b);
  const max = Math.max(...largeTransferVolumeSeries);
  const min = Math.min(...largeTransferVolumeSeries.filter(v => v > 0));
  const median = sorted[Math.floor(sorted.length / 2)];
  const mean = largeTransferVolumeSeries.reduce((a, b) => a + b, 0) / largeTransferVolumeSeries.length;
  const maxMedianRatio = (max / median).toFixed(2);
  
  // Check for extreme spikes (>50x median)
  const extremeSpikes = largeTransferVolumeSeries.filter(v => v > median * 50);
  if (extremeSpikes.length > 0) {
    issues.push('Extreme volume spikes (>50x median): ' + extremeSpikes.length);
  }
  
  return {
    passed: issues.length === 0,
    issues,
    max,
    min,
    median,
    mean: mean.toFixed(0),
    maxMedianRatio,
    extremeSpikes: extremeSpikes.length,
  };
}

function checkBehavioralShape(data) {
  const { largeTransferCountSeries } = data;
  const n = largeTransferCountSeries.length;
  
  // Calculate coefficient of variation
  const mean = largeTransferCountSeries.reduce((a, b) => a + b, 0) / n;
  const variance = largeTransferCountSeries.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / n;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
  
  // Determine regime
  let regime;
  if (cv < 0.3) {
    regime = 'quiet';
  } else if (cv < 0.8) {
    regime = 'active';
  } else {
    regime = 'bursty';
  }
  
  // Detect sudden regime transitions (>3x change between consecutive days)
  const transitions = [];
  for (let i = 1; i < n; i++) {
    const prev = largeTransferCountSeries[i - 1] || 1;
    const curr = largeTransferCountSeries[i];
    const ratio = curr / prev;
    if (ratio > 3 || ratio < 0.33) {
      transitions.push({ index: i, from: prev, to: curr, ratio: ratio.toFixed(2) });
    }
  }
  
  return {
    regime,
    coefficientOfVariation: cv.toFixed(2),
    suddenTransitions: transitions.length,
    transitionExamples: transitions.slice(0, 3),
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
    timeSeries: checkTimeSeriesIntegrity(data),
    numeric: checkNumericValidity(data),
    countVolume: checkCountVolumePlausibility(data),
    scale: checkScalePlausibility(data),
    behavioral: checkBehavioralShape(data),
    coverage: checkCoverageAndGaps(data),
  };
}

const results = ALL_MOCKS.map(runSanityCheck);

// Determine overall status
let overallStatus = 'PASS';
const allIssues = [];

results.forEach(r => {
  const datasetIssues = [
    ...r.timeSeries.issues,
    ...r.numeric.issues,
    ...r.countVolume.issues,
    ...r.scale.issues,
    ...r.coverage.issues,
  ];
  
  datasetIssues.forEach(i => allIssues.push('[' + r.dataset + '] ' + i));
  
  if (!r.timeSeries.passed || !r.numeric.passed) {
    overallStatus = 'FAIL';
  } else if ((!r.countVolume.passed || !r.scale.passed || !r.coverage.passed) && overallStatus !== 'FAIL') {
    overallStatus = 'WARNING';
  }
});

const report = {
  title: 'L3 WHALE TRANSFER BEHAVIOR - DATA SANITY CHECK',
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
    status: (!r.timeSeries.passed || !r.numeric.passed) ? 'FAIL' : 
            (!r.countVolume.passed || !r.scale.passed || !r.coverage.passed) ? 'WARNING' : 'PASS',
    timeSeries: {
      status: r.timeSeries.passed ? 'PASS' : 'FAIL',
      intervalType: r.timeSeries.intervalType,
      dataPoints: r.timeSeries.totalDataPoints,
      range: r.timeSeries.firstTimestamp.split('T')[0] + ' to ' + r.timeSeries.lastTimestamp.split('T')[0],
    },
    numeric: {
      status: r.numeric.passed ? 'PASS' : 'FAIL',
      threshold: r.numeric.threshold,
      invalidEntries: r.numeric.invalidEntries.length,
    },
    countVolume: {
      status: r.countVolume.passed ? 'PASS' : 'WARNING',
      correlation: r.countVolume.correlation,
      outliers: r.countVolume.outliers.length,
    },
    scale: {
      status: r.scale.passed ? 'PASS' : 'WARNING',
      max: r.scale.max,
      median: r.scale.median,
      maxMedianRatio: r.scale.maxMedianRatio,
    },
    behavioral: r.behavioral,
    coverage: {
      status: r.coverage.passed ? 'PASS' : 'WARNING',
      percentage: r.coverage.coverage,
      gaps: r.coverage.gaps.length,
    },
  })),
};

fs.writeFileSync('l3-whale-sanity-report.json', JSON.stringify(report, null, 2), 'utf8');
console.log('Report written to l3-whale-sanity-report.json');
console.log('Overall Status:', overallStatus);
console.log('Recommendation:', report.recommendation);
