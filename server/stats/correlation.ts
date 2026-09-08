import jstatPkg from 'jstat';
const { jStat } = jstatPkg as any;

export interface CorrelationResult {
  x: string;
  y: string;
  method: 'pearson' | 'spearman' | 'kendall';
  r: number;
  pValue: number;
  n: number;
  tStat: number;
  interpretation: string;
  strength: 'very_weak' | 'weak' | 'moderate' | 'strong' | 'very_strong';
  direction: 'positive' | 'negative' | 'none';
  significant: boolean;
}

export interface CorrelationMatrix {
  variables: string[];
  matrix: { [x: string]: { [y: string]: { r: number; pValue: number } } };
}

function rank(arr: number[]): number[] {
  const indexed = arr.map((val, idx) => ({ val, idx }));
  indexed.sort((a, b) => a.val - b.val);
  const ranks = new Array(arr.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j < indexed.length && indexed[j].val === indexed[i].val) {
      j++;
    }
    const avgRank = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) {
      ranks[indexed[k].idx] = avgRank;
    }
    i = j;
  }
  return ranks;
}

export function computePearson(x: number[], y: number[]): { r: number; pValue: number; tStat: number; n: number } {
  const n = x.length;
  if (n < 3) return { r: 0, pValue: 1, tStat: 0, n };

  let sumX = 0, sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  const r = den === 0 ? 0 : Math.max(-1, Math.min(1, num / den));

  if (Math.abs(r) >= 1) {
    return { r, pValue: 0, tStat: Infinity, n };
  }

  const df = n - 2;
  const tStat = r * Math.sqrt(df / (1 - r * r));
  // two-tailed Student's t distribution p-value
  const pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(tStat), df));

  return { r, pValue, tStat, n };
}

export function computeSpearman(x: number[], y: number[]): { r: number; pValue: number; tStat: number; n: number } {
  const rx = rank(x);
  const ry = rank(y);
  return computePearson(rx, ry);
}

export function computeKendall(x: number[], y: number[]): { r: number; pValue: number; tStat: number; n: number } {
  const n = x.length;
  if (n < 3) return { r: 0, pValue: 1, tStat: 0, n };

  let concordant = 0;
  let discordant = 0;

  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = x[i] - x[j];
      const dy = y[i] - y[j];
      const prod = dx * dy;
      if (prod > 0) concordant++;
      else if (prod < 0) discordant++;
    }
  }

  const totalPairs = (n * (n - 1)) / 2;
  const tau = totalPairs > 0 ? (concordant - discordant) / totalPairs : 0;
  const varTau = (2 * (2 * n + 5)) / (9 * n * (n - 1));
  const z = varTau > 0 ? tau / Math.sqrt(varTau) : 0;
  const pValue = 2 * (1 - jStat.normal.cdf(Math.abs(z), 0, 1));

  return { r: tau, pValue, tStat: z, n };
}

export function evaluateCorrelation(
  xName: string,
  yName: string,
  xVals: number[],
  yVals: number[],
  method: 'pearson' | 'spearman' | 'kendall' = 'pearson',
  alpha: number = 0.05
): CorrelationResult {
  // Filter paired values where both are valid finite numbers
  const paired: [number, number][] = [];
  for (let i = 0; i < Math.min(xVals.length, yVals.length); i++) {
    const vx = xVals[i];
    const vy = yVals[i];
    if (vx !== null && vx !== undefined && !isNaN(vx) && isFinite(vx) &&
        vy !== null && vy !== undefined && !isNaN(vy) && isFinite(vy)) {
      paired.push([vx, vy]);
    }
  }

  const cleanX = paired.map(p => p[0]);
  const cleanY = paired.map(p => p[1]);

  let calc = { r: 0, pValue: 1, tStat: 0, n: cleanX.length };
  if (method === 'spearman') {
    calc = computeSpearman(cleanX, cleanY);
  } else if (method === 'kendall') {
    calc = computeKendall(cleanX, cleanY);
  } else {
    calc = computePearson(cleanX, cleanY);
  }

  const r = Number(calc.r.toFixed(4));
  const pValue = Number(calc.pValue.toFixed(5));
  const absR = Math.abs(r);

  let strength: CorrelationResult['strength'] = 'very_weak';
  if (absR >= 0.8) strength = 'very_strong';
  else if (absR >= 0.6) strength = 'strong';
  else if (absR >= 0.4) strength = 'moderate';
  else if (absR >= 0.2) strength = 'weak';

  const direction = r > 0.05 ? 'positive' : r < -0.05 ? 'negative' : 'none';
  const significant = pValue < alpha;

  const strengthDesc = strength.replace('_', ' ');
  const sigText = significant
    ? `statistically significant (p = ${pValue < 0.001 ? '< 0.001' : pValue} < α=${alpha})`
    : `not statistically significant (p = ${pValue.toFixed(4)} ≥ α=${alpha})`;

  const interpretation = `There is a ${strengthDesc} ${direction} correlation between ${xName} and ${yName} (r = ${r}, n = ${calc.n}), which is ${sigText}. Note: Correlation indicates linear association and does not imply causation.`;

  return {
    x: xName,
    y: yName,
    method,
    r,
    pValue,
    n: calc.n,
    tStat: Number(calc.tStat.toFixed(4)),
    interpretation,
    strength,
    direction,
    significant
  };
}

export function computeCorrelationMatrix(variables: string[], data: Record<string, number[]>): CorrelationMatrix {
  const matrix: CorrelationMatrix['matrix'] = {};

  for (const var1 of variables) {
    matrix[var1] = {};
    for (const var2 of variables) {
      if (var1 === var2) {
        matrix[var1][var2] = { r: 1, pValue: 0 };
      } else {
        const res = evaluateCorrelation(var1, var2, data[var1] || [], data[var2] || [], 'pearson');
        matrix[var1][var2] = { r: res.r, pValue: res.pValue };
      }
    }
  }

  return { variables, matrix };
}
