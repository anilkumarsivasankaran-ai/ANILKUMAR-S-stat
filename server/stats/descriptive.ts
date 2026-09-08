import * as ss from 'simple-statistics';

export interface NumericalStats {
  column: string;
  count: number;
  mean: number;
  median: number;
  std: number;
  variance: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  iqr: number;
  skewness: number;
  kurtosis: number;
}

export interface CategoricalStats {
  column: string;
  count: number;
  unique: number;
  topValue: string;
  topFrequency: number;
  topPercentage: number;
  frequencies: { value: string; count: number; percentage: number }[];
}

export interface DataQualityReport {
  totalRows: number;
  totalColumns: number;
  missingValuesTotal: number;
  duplicateRowsCount: number;
  columns: {
    name: string;
    type: 'numerical' | 'categorical';
    missingCount: number;
    missingPercentage: number;
    uniqueCount: number;
  }[];
  outliersSummary: {
    column: string;
    iqrOutliersCount: number;
    zScoreOutliersCount: number;
  }[];
}

export function computeNumericalStats(columnName: string, values: number[]): NumericalStats {
  const clean = values.filter(v => v !== null && v !== undefined && !isNaN(v) && isFinite(v));
  if (clean.length === 0) {
    return {
      column: columnName,
      count: 0,
      mean: 0,
      median: 0,
      std: 0,
      variance: 0,
      min: 0,
      max: 0,
      q1: 0,
      q3: 0,
      iqr: 0,
      skewness: 0,
      kurtosis: 0
    };
  }

  const sorted = [...clean].sort((a, b) => a - b);
  const count = sorted.length;
  const mean = ss.mean(sorted);
  const median = ss.median(sorted);
  const std = count > 1 ? ss.sampleStandardDeviation(sorted) : 0;
  const variance = count > 1 ? ss.sampleVariance(sorted) : 0;
  const min = ss.min(sorted);
  const max = ss.max(sorted);
  const q1 = ss.quantileSorted(sorted, 0.25);
  const q3 = ss.quantileSorted(sorted, 0.75);
  const iqr = q3 - q1;
  const skewness = count > 2 ? ss.sampleSkewness(sorted) : 0;
  // sample kurtosis: ss.sampleKurtosis or excess kurtosis
  let kurtosis = 0;
  if (count > 3 && std > 0) {
    const m4 = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 4), 0) / count;
    const m2 = Math.pow(std, 2);
    kurtosis = m4 / Math.pow(m2, 2) - 3; // excess kurtosis
  }

  return {
    column: columnName,
    count,
    mean: Number(mean.toFixed(4)),
    median: Number(median.toFixed(4)),
    std: Number(std.toFixed(4)),
    variance: Number(variance.toFixed(4)),
    min: Number(min.toFixed(4)),
    max: Number(max.toFixed(4)),
    q1: Number(q1.toFixed(4)),
    q3: Number(q3.toFixed(4)),
    iqr: Number(iqr.toFixed(4)),
    skewness: Number(skewness.toFixed(4)),
    kurtosis: Number(kurtosis.toFixed(4))
  };
}

export function computeCategoricalStats(columnName: string, values: any[]): CategoricalStats {
  const counts: Record<string, number> = {};
  let validCount = 0;

  for (const v of values) {
    if (v !== null && v !== undefined && v !== '') {
      const key = String(v).trim();
      counts[key] = (counts[key] || 0) + 1;
      validCount++;
    }
  }

  const frequencies = Object.entries(counts)
    .map(([value, count]) => ({
      value,
      count,
      percentage: validCount > 0 ? Number(((count / validCount) * 100).toFixed(2)) : 0
    }))
    .sort((a, b) => b.count - a.count);

  const top = frequencies[0] || { value: 'N/A', count: 0, percentage: 0 };

  return {
    column: columnName,
    count: validCount,
    unique: Object.keys(counts).length,
    topValue: top.value,
    topFrequency: top.count,
    topPercentage: top.percentage,
    frequencies: frequencies.slice(0, 20) // top 20 categories
  };
}

export function detectOutliers(values: number[]): { iqrOutliers: number[]; zScoreOutliers: number[] } {
  const clean = values.filter(v => v !== null && v !== undefined && !isNaN(v) && isFinite(v));
  if (clean.length < 4) return { iqrOutliers: [], zScoreOutliers: [] };

  const sorted = [...clean].sort((a, b) => a - b);
  const q1 = ss.quantileSorted(sorted, 0.25);
  const q3 = ss.quantileSorted(sorted, 0.75);
  const iqr = q3 - q1;
  const lowerIqr = q1 - 1.5 * iqr;
  const upperIqr = q3 + 1.5 * iqr;

  const mean = ss.mean(sorted);
  const std = ss.sampleStandardDeviation(sorted);

  const iqrOutliers = clean.filter(v => v < lowerIqr || v > upperIqr);
  const zScoreOutliers = std > 0 ? clean.filter(v => Math.abs((v - mean) / std) > 3) : [];

  return { iqrOutliers, zScoreOutliers };
}
