import jstatPkg from 'jstat';
import * as ss from 'simple-statistics';
import { fitLinearRegression } from './regression.js';

const { jStat } = jstatPkg as any;

export interface VIFResult {
  variable: string;
  vif: number;
  tolerance: number;
  concernLevel: 'Low concern' | 'Moderate concern' | 'High concern';
  recommendation: string;
}

export interface DiagnosticsOutput {
  durbinWatson: {
    statistic: number;
    interpretation: string;
    verdict: 'No Autocorrelation' | 'Positive Autocorrelation' | 'Negative Autocorrelation';
  };
  breuschPagan: {
    lmStatistic: number;
    pValue: number;
    homoscedastic: boolean;
    interpretation: string;
  };
  normality: {
    skewness: number;
    kurtosis: number;
    isApproximatelyNormal: boolean;
    interpretation: string;
    qqPlotData: { theoreticalQuantile: number; standardizedResidual: number }[];
    residualHistogram: { binStart: number; binEnd: number; count: number }[];
  };
  multicollinearity: {
    vifList: VIFResult[];
    maxVif: number;
    hasSevereMulticollinearity: boolean;
    summary: string;
  };
}

export function computeDiagnostics(
  target: string,
  predictors: string[],
  data: Record<string, number[]>,
  residuals: number[]
): DiagnosticsOutput {
  // 1. Durbin-Watson Statistic
  // d = sum((e_t - e_{t-1})^2) / sum(e_t^2)
  let dwNum = 0;
  let dwDen = 0;
  for (let i = 1; i < residuals.length; i++) {
    dwNum += Math.pow(residuals[i] - residuals[i - 1], 2);
  }
  for (let i = 0; i < residuals.length; i++) {
    dwDen += Math.pow(residuals[i], 2);
  }
  const dw = dwDen > 0 ? dwNum / dwDen : 2;

  let dwVerdict: 'No Autocorrelation' | 'Positive Autocorrelation' | 'Negative Autocorrelation' = 'No Autocorrelation';
  let dwInterpretation = 'Residuals appear uncorrelated (Durbin-Watson statistic is close to 2.0).';

  if (dw < 1.5) {
    dwVerdict = 'Positive Autocorrelation';
    dwInterpretation = 'Evidence of positive first-order autocorrelation in residuals (d < 1.5). Standard errors may be underestimated.';
  } else if (dw > 2.5) {
    dwVerdict = 'Negative Autocorrelation';
    dwInterpretation = 'Evidence of negative autocorrelation in residuals (d > 2.5).';
  }

  // 2. Normality of Residuals & Q-Q Plot
  const cleanRes = residuals.filter(v => !isNaN(v) && isFinite(v));
  const nRes = cleanRes.length;
  const meanRes = ss.mean(cleanRes);
  const stdRes = ss.sampleStandardDeviation(cleanRes);

  const skewness = nRes > 2 ? ss.sampleSkewness(cleanRes) : 0;
  let kurtosis = 0;
  if (nRes > 3 && stdRes > 0) {
    const m4 = cleanRes.reduce((acc, v) => acc + Math.pow(v - meanRes, 4), 0) / nRes;
    const m2 = Math.pow(stdRes, 2);
    kurtosis = m4 / Math.pow(m2, 2) - 3;
  }

  const isApproximatelyNormal = Math.abs(skewness) < 1.0 && Math.abs(kurtosis) < 2.0;
  const normalityInterpretation = isApproximatelyNormal
    ? `Residuals satisfy the normality assumption reasonably well (Skewness = ${skewness.toFixed(2)}, Excess Kurtosis = ${kurtosis.toFixed(2)}).`
    : `Residuals show deviations from a Gaussian distribution (Skewness = ${skewness.toFixed(2)}, Excess Kurtosis = ${kurtosis.toFixed(2)}). Consider robust standard errors or variable transformations.`;

  // Q-Q Plot data (subsampled to 200 points for smooth rendering)
  const sortedRes = [...cleanRes].sort((a, b) => a - b);
  const qqPlotData: { theoreticalQuantile: number; standardizedResidual: number }[] = [];
  const qqStep = Math.max(1, Math.floor(nRes / 150));

  for (let i = 0; i < nRes; i += qqStep) {
    // Blom's plotting position: (i - 0.375) / (n + 0.25)
    const pVal = (i + 1 - 0.375) / (nRes + 0.25);
    const zTheoretical = jStat.normal.inv(pVal, 0, 1);
    const stdResid = stdRes > 0 ? (sortedRes[i] - meanRes) / stdRes : 0;
    qqPlotData.push({
      theoreticalQuantile: Number(zTheoretical.toFixed(3)),
      standardizedResidual: Number(stdResid.toFixed(3))
    });
  }

  // Residual Histogram Bins
  const minRes = Math.min(...cleanRes);
  const maxRes = Math.max(...cleanRes);
  const numBins = 15;
  const binWidth = (maxRes - minRes) / numBins || 1;
  const bins: { binStart: number; binEnd: number; count: number }[] = [];

  for (let b = 0; b < numBins; b++) {
    const bStart = minRes + b * binWidth;
    const bEnd = bStart + binWidth;
    bins.push({ binStart: Number(bStart.toFixed(2)), binEnd: Number(bEnd.toFixed(2)), count: 0 });
  }

  for (const r of cleanRes) {
    let bIdx = Math.floor((r - minRes) / binWidth);
    if (bIdx >= numBins) bIdx = numBins - 1;
    if (bIdx >= 0) bins[bIdx].count++;
  }

  // 3. Breusch-Pagan Test for Heteroscedasticity
  // Auxiliary regression: e_i^2 on predictors
  let bpLm = 0;
  let bpPValue = 1;
  let homoscedastic = true;

  try {
    const sqResiduals = cleanRes.map(r => r * r);
    const auxData: Record<string, number[]> = {
      sqRes: sqResiduals,
      ...data
    };
    const auxModel = fitLinearRegression({
      target: 'sqRes',
      predictors,
      data: auxData
    });
    // LM statistic = n * R^2_aux, distributed as Chi-square with df = k
    bpLm = nRes * auxModel.rSquared;
    const df = predictors.length;
    bpPValue = 1 - jStat.chisquare.cdf(bpLm, df);
    homoscedastic = bpPValue >= 0.05;
  } catch {
    // fallback if aux regression fails
    bpLm = 0;
    bpPValue = 1;
  }

  const bpInterpretation = homoscedastic
    ? `Breusch-Pagan test p-value (${bpPValue < 0.001 ? '< 0.001' : bpPValue.toFixed(4)}) ≥ 0.05. Fails to reject constant variance: the homoscedasticity assumption is satisfied.`
    : `Breusch-Pagan test p-value (${bpPValue < 0.001 ? '< 0.001' : bpPValue.toFixed(4)}) < 0.05. Evidence of heteroscedasticity (non-constant residual variance). Standard error estimates may need heteroscedasticity-consistent (HC) corrections.`;

  // 4. Multicollinearity: Variance Inflation Factor (VIF)
  const vifList: VIFResult[] = [];
  let maxVif = 1;

  if (predictors.length <= 1) {
    vifList.push({
      variable: predictors[0] || 'X',
      vif: 1.0,
      tolerance: 1.0,
      concernLevel: 'Low concern',
      recommendation: 'Single predictor model. No collinearity possible.'
    });
  } else {
    for (const p of predictors) {
      const otherPredictors = predictors.filter(x => x !== p);
      try {
        const aux = fitLinearRegression({
          target: p,
          predictors: otherPredictors,
          data
        });
        const r2 = Math.min(0.9999, Math.max(0, aux.rSquared));
        const vif = 1 / (1 - r2);
        const tolerance = 1 - r2;

        let concern: VIFResult['concernLevel'] = 'Low concern';
        let recommendation = 'Low collinearity with other predictors.';
        if (vif > 10) {
          concern = 'High concern';
          recommendation = 'Severe multicollinearity. Consider removing or combining this variable with related predictors.';
        } else if (vif >= 5) {
          concern = 'Moderate concern';
          recommendation = 'Moderate multicollinearity. Coefficient standard errors may be somewhat inflated.';
        }

        if (vif > maxVif) maxVif = vif;

        vifList.push({
          variable: p,
          vif: Number(vif.toFixed(2)),
          tolerance: Number(tolerance.toFixed(4)),
          concernLevel: concern,
          recommendation
        });
      } catch {
        vifList.push({
          variable: p,
          vif: 1.0,
          tolerance: 1.0,
          concernLevel: 'Low concern',
          recommendation: 'Unable to fit auxiliary model.'
        });
      }
    }
  }

  const hasSevereMulticollinearity = maxVif > 10;
  const vifSummary = hasSevereMulticollinearity
    ? `Warning: Max VIF = ${maxVif.toFixed(2)} (> 10), indicating high multicollinearity among some predictors.`
    : maxVif >= 5
    ? `Notice: Max VIF = ${maxVif.toFixed(2)} (between 5 and 10), indicating moderate multicollinearity.`
    : `All predictors have VIF < 5 (Max VIF = ${maxVif.toFixed(2)}), indicating minimal collinearity concerns.`;

  return {
    durbinWatson: {
      statistic: Number(dw.toFixed(3)),
      interpretation: dwInterpretation,
      verdict: dwVerdict
    },
    breuschPagan: {
      lmStatistic: Number(bpLm.toFixed(3)),
      pValue: Number(bpPValue.toFixed(4)),
      homoscedastic,
      interpretation: bpInterpretation
    },
    normality: {
      skewness: Number(skewness.toFixed(3)),
      kurtosis: Number(kurtosis.toFixed(3)),
      isApproximatelyNormal,
      interpretation: normalityInterpretation,
      qqPlotData,
      residualHistogram: bins
    },
    multicollinearity: {
      vifList,
      maxVif: Number(maxVif.toFixed(2)),
      hasSevereMulticollinearity,
      summary: vifSummary
    }
  };
}
