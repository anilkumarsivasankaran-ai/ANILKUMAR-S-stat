import jstatPkg from 'jstat';
import { transpose, matMul, matVecMul, invertMatrix } from './matrix.js';

const { jStat } = jstatPkg as any;

export interface PredictionRequest {
  target: string;
  predictors: string[];
  inputValues: Record<string, number>;
  data: Record<string, number[]>;
  alpha?: number; // default 0.05 for 95% intervals
}

export interface PredictionResponse {
  predictedValue: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    level: number;
    stdError: number;
    description: string;
  };
  predictionInterval: {
    lower: number;
    upper: number;
    level: number;
    stdError: number;
    description: string;
  };
  inputsUsed: Record<string, number>;
  targetVariable: string;
  equationUsed: string;
}

export function computePrediction(req: PredictionRequest): PredictionResponse {
  const { target, predictors, inputValues, data } = req;
  const alpha = req.alpha || 0.05;

  // Build clean design matrix X and Y from original data to compute (X^TX)^(-1) and s^2
  const nRows = data[target].length;
  const validIndices: number[] = [];

  for (let i = 0; i < nRows; i++) {
    const yVal = data[target][i];
    if (yVal === null || isNaN(yVal) || !isFinite(yVal)) continue;
    let ok = true;
    for (const p of predictors) {
      const xVal = data[p][i];
      if (xVal === null || isNaN(xVal) || !isFinite(xVal)) {
        ok = false;
        break;
      }
    }
    if (ok) validIndices.push(i);
  }

  const n = validIndices.length;
  const p = predictors.length + 1; // including intercept
  const dfResidual = n - p;

  const X: number[][] = [];
  const Y: number[] = [];

  for (const idx of validIndices) {
    const row = [1];
    for (const pName of predictors) {
      row.push(data[pName][idx]);
    }
    X.push(row);
    Y.push(data[target][idx]);
  }

  const Xt = transpose(X);
  const XtX = matMul(Xt, X);
  const invXtX = invertMatrix(XtX);
  const XtY = matVecMul(Xt, Y);
  const beta = matVecMul(invXtX, XtY);

  // Compute residuals and unbiased MSE (s^2)
  const yHat = matVecMul(X, beta);
  let rss = 0;
  for (let i = 0; i < n; i++) {
    const res = Y[i] - yHat[i];
    rss += res * res;
  }
  const sSquared = dfResidual > 0 ? rss / dfResidual : 1;
  const s = Math.sqrt(sSquared);

  // Construct query vector x0 = [1, x0_1, x0_2, ...]
  const x0 = [1];
  for (const pName of predictors) {
    const v = inputValues[pName] !== undefined ? inputValues[pName] : 0;
    x0.push(v);
  }

  // Point prediction = x0^T * beta
  let pointPrediction = 0;
  for (let j = 0; j < p; j++) {
    pointPrediction += x0[j] * beta[j];
  }

  // Leverage h0 = x0^T * (X^T X)^(-1) * x0
  // First compute (X^T X)^(-1) * x0
  const invXtX_x0 = matVecMul(invXtX, x0);
  let leverage = 0;
  for (let j = 0; j < p; j++) {
    leverage += x0[j] * invXtX_x0[j];
  }
  leverage = Math.max(0, leverage);

  const tCrit = jStat.studentt.inv(1 - alpha / 2, dfResidual);

  // SE for mean response
  const seMean = s * Math.sqrt(leverage);
  const ciLower = pointPrediction - tCrit * seMean;
  const ciUpper = pointPrediction + tCrit * seMean;

  // SE for individual observation
  const sePred = s * Math.sqrt(1 + leverage);
  const piLower = pointPrediction - tCrit * sePred;
  const piUpper = pointPrediction + tCrit * sePred;

  // Format equation
  let eq = `${target} = ${beta[0].toFixed(2)}`;
  for (let j = 0; j < predictors.length; j++) {
    const coef = beta[j + 1];
    eq += `${coef >= 0 ? ' + ' : ' - '}${Math.abs(coef).toFixed(2)} × ${predictors[j]}`;
  }

  const levelPct = (1 - alpha) * 100;

  return {
    predictedValue: Number(pointPrediction.toFixed(2)),
    confidenceInterval: {
      lower: Number(ciLower.toFixed(2)),
      upper: Number(ciUpper.toFixed(2)),
      level: levelPct,
      stdError: Number(seMean.toFixed(3)),
      description: `${levelPct}% Confidence Interval estimates the true MEAN response of ${target} across all observations with these predictor values.`
    },
    predictionInterval: {
      lower: Number(piLower.toFixed(2)),
      upper: Number(piUpper.toFixed(2)),
      level: levelPct,
      stdError: Number(sePred.toFixed(3)),
      description: `${levelPct}% Prediction Interval estimates the range for a SINGLE new future individual observation, accounting for both regression model uncertainty and random individual error (inherently wider).`
    },
    inputsUsed: inputValues,
    targetVariable: target,
    equationUsed: eq
  };
}
