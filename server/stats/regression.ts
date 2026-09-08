import jstatPkg from 'jstat';
import * as ss from 'simple-statistics';
import { transpose, matMul, matVecMul, invertMatrix } from './matrix.js';

const { jStat } = jstatPkg as any;

export interface CoefficientOutput {
  variable: string;
  coefficient: number;
  stdError: number;
  tStatistic: number;
  pValue: number;
  ciLower: number;
  ciUpper: number;
  direction: 'positive' | 'negative' | 'neutral';
  magnitude: string;
  significant: boolean;
  plainInterpretation: string;
}

export interface RegressionModelOutput {
  modelId: string;
  name: string;
  targetVariable: string;
  predictorVariables: string[];
  equation: string;
  sampleSize: number;
  dfResidual: number;
  dfModel: number;

  // Metrics
  rSquared: number;
  adjRSquared: number;
  rmse: number;
  mae: number;
  mse: number;
  fStatistic: number;
  fPValue: number;
  aic: number;
  bic: number;
  logLikelihood: number;

  // Train / Test metrics (if enabled)
  isSplit: boolean;
  trainRSquared?: number;
  testRSquared?: number;
  trainRmse?: number;
  testRmse?: number;
  trainMae?: number;
  testMae?: number;
  trainSize?: number;
  testSize?: number;

  // Coefficients
  coefficients: CoefficientOutput[];
  overallFTestVerdict: string;
  plainEnglishSummary: string;

  // Diagnostics vectors (sampled if dataset is large, up to 1000 points)
  observations: {
    actual: number;
    predicted: number;
    residual: number;
    standardizedResidual: number;
  }[];
}

export interface FitRegressionOptions {
  target: string;
  predictors: string[];
  data: Record<string, number[]>;
  trainTestSplit?: number; // e.g. 0.8 for 80/20 split
  randomSeed?: number;
  standardize?: boolean;
}

export function fitLinearRegression(options: FitRegressionOptions): RegressionModelOutput {
  const { target, predictors, data, trainTestSplit, standardize } = options;

  if (!data[target]) {
    throw new Error(`Target variable "${target}" not found in dataset`);
  }
  for (const p of predictors) {
    if (!data[p]) {
      throw new Error(`Predictor variable "${p}" not found in dataset`);
    }
  }

  // Extract clean complete cases
  const nRows = data[target].length;
  const validIndices: number[] = [];

  for (let i = 0; i < nRows; i++) {
    const yVal = data[target][i];
    if (yVal === null || yVal === undefined || isNaN(yVal) || !isFinite(yVal)) continue;

    let valid = true;
    for (const p of predictors) {
      const xVal = data[p][i];
      if (xVal === null || xVal === undefined || isNaN(xVal) || !isFinite(xVal)) {
        valid = false;
        break;
      }
    }
    if (valid) validIndices.push(i);
  }

  const n = validIndices.length;
  const k = predictors.length;
  const p = k + 1; // including intercept

  if (n <= p) {
    throw new Error(`Insufficient sample size (${n}) for fitting ${k} predictors. Need at least ${p + 1} observations.`);
  }

  // Check for constant predictors (zero variance)
  for (const pName of predictors) {
    const vals = validIndices.map(i => data[pName][i]);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    if (min === max) {
      throw new Error(`Predictor "${pName}" has zero variance (constant value ${min}). It cannot contribute to the regression model.`);
    }
  }

  // Handle train / test split if requested
  let trainIndices = validIndices;
  let testIndices: number[] = [];
  const isSplit = trainTestSplit !== undefined && trainTestSplit > 0.4 && trainTestSplit < 0.95;

  if (isSplit) {
    // Deterministic pseudo-random shuffle
    const shuffled = [...validIndices];
    let seed = options.randomSeed || 42;
    for (let i = shuffled.length - 1; i > 0; i--) {
      seed = (seed * 9301 + 49297) % 233280;
      const j = Math.floor((seed / 233280) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const splitCount = Math.floor(shuffled.length * trainTestSplit);
    trainIndices = shuffled.slice(0, splitCount);
    testIndices = shuffled.slice(splitCount);
  }

  // Standardize predictors if requested
  const means: Record<string, number> = {};
  const stds: Record<string, number> = {};

  if (standardize) {
    for (const pName of predictors) {
      const vals = trainIndices.map(i => data[pName][i]);
      means[pName] = ss.mean(vals);
      stds[pName] = ss.sampleStandardDeviation(vals) || 1;
    }
  }

  // Build X and Y on train set
  const X_train: number[][] = [];
  const Y_train: number[] = [];

  for (const idx of trainIndices) {
    const row = [1]; // Intercept
    for (const pName of predictors) {
      let val = data[pName][idx];
      if (standardize) {
        val = (val - means[pName]) / stds[pName];
      }
      row.push(val);
    }
    X_train.push(row);
    Y_train.push(data[target][idx]);
  }

  const nTrain = trainIndices.length;
  const dfResidual = nTrain - p;
  const dfModel = k;

  // Compute beta = (X^T * X)^(-1) * X^T * Y
  const Xt = transpose(X_train);
  const XtX = matMul(Xt, X_train);

  let invXtX: number[][];
  try {
    invXtX = invertMatrix(XtX);
  } catch (err: any) {
    throw new Error('Model could not be fitted: Matrix (X^T * X) is singular. This typically occurs due to perfect multicollinearity among predictors.');
  }

  const XtY = matVecMul(Xt, Y_train);
  const beta = matVecMul(invXtX, XtY);

  // Predictions on train set
  const yHatTrain = matVecMul(X_train, beta);
  const residualsTrain: number[] = [];
  let rssTrain = 0;
  let maeTrainSum = 0;

  for (let i = 0; i < nTrain; i++) {
    const res = Y_train[i] - yHatTrain[i];
    residualsTrain.push(res);
    rssTrain += res * res;
    maeTrainSum += Math.abs(res);
  }

  const meanYTrain = ss.mean(Y_train);
  let tssTrain = 0;
  for (let i = 0; i < nTrain; i++) {
    tssTrain += Math.pow(Y_train[i] - meanYTrain, 2);
  }

  const essTrain = Math.max(0, tssTrain - rssTrain);
  const rSquared = tssTrain > 0 ? Math.max(0, Math.min(1, 1 - rssTrain / tssTrain)) : 0;
  const adjRSquared = (tssTrain > 0 && dfResidual > 0)
    ? Math.max(0, 1 - (rssTrain / dfResidual) / (tssTrain / (nTrain - 1)))
    : 0;

  const mseTrain = rssTrain / dfResidual;
  const rmseTrain = Math.sqrt(rssTrain / nTrain);
  const maeTrain = maeTrainSum / nTrain;

  const sSquared = mseTrain; // unbiased residual variance estimate
  const residualStdError = Math.sqrt(sSquared);

  // Overall F-test
  const msModel = dfModel > 0 ? essTrain / dfModel : 0;
  const msResidual = dfResidual > 0 ? rssTrain / dfResidual : 1;
  const fStat = msResidual > 0 ? msModel / msResidual : 0;
  const fPValue = 1 - jStat.centralF.cdf(fStat, dfModel, dfResidual);

  // Log likelihood, AIC, BIC
  const logLik = - (nTrain / 2) * Math.log(2 * Math.PI) - (nTrain / 2) * Math.log(rssTrain / nTrain) - (nTrain / 2);
  const aic = 2 * p - 2 * logLik;
  const bic = p * Math.log(nTrain) - 2 * logLik;

  // Coefficients stats
  const alpha = 0.05;
  const tCrit = jStat.studentt.inv(1 - alpha / 2, dfResidual);

  const coefficients: CoefficientOutput[] = [];
  const varNames = ['(Intercept)', ...predictors];

  for (let j = 0; j < p; j++) {
    const coef = beta[j];
    const varVariance = invXtX[j][j] * sSquared;
    const se = Math.sqrt(Math.max(1e-15, varVariance));
    const tStat = coef / se;
    const pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(tStat), dfResidual));
    const ciLower = coef - tCrit * se;
    const ciUpper = coef + tCrit * se;
    const varName = varNames[j];
    const isSignificant = pValue < 0.05;

    let magnitude = 'negligible';
    if (Math.abs(coef) >= 10) magnitude = 'substantial';
    else if (Math.abs(coef) >= 1) magnitude = 'moderate';
    else if (Math.abs(coef) >= 0.1) magnitude = 'modest';

    const direction = coef > 1e-5 ? 'positive' : coef < -1e-5 ? 'negative' : 'neutral';

    let plainInterpretation = '';
    if (varName === '(Intercept)') {
      plainInterpretation = `When all predictor variables are set to zero, the estimated expected baseline value of ${target} is ${coef.toFixed(4)}.`;
    } else {
      plainInterpretation = `Holding all other predictors constant, a 1-unit increase in ${varName} is associated with an estimated ${coef >= 0 ? '+' : ''}${coef.toFixed(4)} unit change in ${target}. This effect is ${isSignificant ? 'statistically significant (p < 0.05)' : 'not statistically significant (p ≥ 0.05)'}.`;
    }

    coefficients.push({
      variable: varName,
      coefficient: Number(coef.toFixed(4)),
      stdError: Number(se.toFixed(4)),
      tStatistic: Number(tStat.toFixed(4)),
      pValue: Number(pValue.toFixed(5)),
      ciLower: Number(ciLower.toFixed(4)),
      ciUpper: Number(ciUpper.toFixed(4)),
      direction,
      magnitude,
      significant: isSignificant,
      plainInterpretation
    });
  }

  // Regression equation string
  let eqStr = `${target} = ${coefficients[0].coefficient.toFixed(2)}`;
  for (let j = 1; j < coefficients.length; j++) {
    const c = coefficients[j];
    const sign = c.coefficient >= 0 ? ' + ' : ' - ';
    eqStr += `${sign}${Math.abs(c.coefficient).toFixed(2)} × ${c.variable}`;
  }

  // Overall F-test conclusion
  const overallFTestVerdict = fPValue < 0.05
    ? `The overall regression model is statistically significant (F(${dfModel}, ${dfResidual}) = ${fStat.toFixed(2)}, p = ${fPValue < 0.001 ? '< 0.001' : fPValue.toFixed(4)} < 0.05), indicating that the predictors together reliably explain a significant proportion of variance in ${target}.`
    : `The overall regression model does not reach statistical significance (F(${dfModel}, ${dfResidual}) = ${fStat.toFixed(2)}, p = ${fPValue.toFixed(4)} ≥ 0.05).`;

  // Plain-English summary
  const sigPredictors = coefficients.slice(1).filter(c => c.significant).map(c => c.variable);
  const plainEnglishSummary = `The regression model accounts for ${(rSquared * 100).toFixed(1)}% of the variance in ${target} (Adjusted R² = ${(adjRSquared * 100).toFixed(1)}%, RMSE = ${rmseTrain.toFixed(2)}). ${
    sigPredictors.length > 0
      ? `Statistically significant predictors at α = 0.05 include: ${sigPredictors.join(', ')}.`
      : 'None of the individual predictors reached statistical significance at α = 0.05.'
  } Note: These relationships reflect statistical associations in the observed sample and do not establish direct causality.`;

  // Test set evaluation if split
  let testRSquared: number | undefined;
  let testRmse: number | undefined;
  let testMae: number | undefined;

  if (isSplit && testIndices.length > 0) {
    let rssTest = 0;
    let maeTestSum = 0;
    const yTestVals: number[] = [];

    for (const idx of testIndices) {
      const actual = data[target][idx];
      yTestVals.push(actual);

      let predicted = beta[0];
      for (let j = 0; j < predictors.length; j++) {
        const pName = predictors[j];
        let val = data[pName][idx];
        if (standardize) {
          val = (val - means[pName]) / stds[pName];
        }
        predicted += beta[j + 1] * val;
      }

      const res = actual - predicted;
      rssTest += res * res;
      maeTestSum += Math.abs(res);
    }

    const meanYTest = ss.mean(yTestVals);
    let tssTest = 0;
    for (const y of yTestVals) {
      tssTest += Math.pow(y - meanYTest, 2);
    }

    testRSquared = tssTest > 0 ? Number(Math.max(0, 1 - rssTest / tssTest).toFixed(4)) : 0;
    testRmse = Number(Math.sqrt(rssTest / testIndices.length).toFixed(4));
    testMae = Number((maeTestSum / testIndices.length).toFixed(4));
  }

  // Sample observations for actual vs predicted, residual vs fitted, and Q-Q plot
  const observations: RegressionModelOutput['observations'] = [];
  const maxSamplePoints = 500;
  const step = Math.max(1, Math.floor(nTrain / maxSamplePoints));

  for (let i = 0; i < nTrain; i += step) {
    const actual = Y_train[i];
    const predicted = yHatTrain[i];
    const residual = residualsTrain[i];
    const stdResidual = residualStdError > 0 ? residual / residualStdError : 0;

    observations.push({
      actual: Number(actual.toFixed(2)),
      predicted: Number(predicted.toFixed(2)),
      residual: Number(residual.toFixed(2)),
      standardizedResidual: Number(stdResidual.toFixed(2))
    });
  }

  return {
    modelId: `model_${Date.now()}`,
    name: `${target} ~ ${predictors.join(' + ')}`,
    targetVariable: target,
    predictorVariables: predictors,
    equation: eqStr,
    sampleSize: nTrain,
    dfResidual,
    dfModel,
    rSquared: Number(rSquared.toFixed(4)),
    adjRSquared: Number(adjRSquared.toFixed(4)),
    rmse: Number(rmseTrain.toFixed(4)),
    mae: Number(maeTrain.toFixed(4)),
    mse: Number(mseTrain.toFixed(4)),
    fStatistic: Number(fStat.toFixed(4)),
    fPValue: Number(fPValue.toFixed(5)),
    aic: Number(aic.toFixed(2)),
    bic: Number(bic.toFixed(2)),
    logLikelihood: Number(logLik.toFixed(2)),
    isSplit,
    trainRSquared: isSplit ? Number(rSquared.toFixed(4)) : undefined,
    testRSquared,
    trainRmse: isSplit ? Number(rmseTrain.toFixed(4)) : undefined,
    testRmse,
    trainMae: isSplit ? Number(maeTrain.toFixed(4)) : undefined,
    testMae,
    trainSize: isSplit ? nTrain : undefined,
    testSize: isSplit ? testIndices.length : undefined,
    coefficients,
    overallFTestVerdict,
    plainEnglishSummary,
    observations
  };
}
