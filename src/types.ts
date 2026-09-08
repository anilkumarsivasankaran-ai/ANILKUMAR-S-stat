export type NavigationTab =
  | 'dashboard'
  | 'upload'
  | 'preview'
  | 'cleaning'
  | 'eda'
  | 'visualizations'
  | 'correlation'
  | 'hypothesis'
  | 'regression'
  | 'least-squares'
  | 'diagnostics'
  | 'predictions'
  | 'comparison'
  | 'reports'
  | 'history';

export interface DatasetColumn {
  name: string;
  type: 'numerical' | 'categorical';
  missingCount: number;
  missingPercentage: number;
  uniqueCount: number;
}

export interface Dataset {
  id: string;
  name: string;
  uploadedAt: string;
  rowCount: number;
  columnCount: number;
  memoryUsageKb: number;
  numericalColumns: string[];
  categoricalColumns: string[];
  columns: DatasetColumn[];
  missingValuesTotal: number;
  duplicateRowsCount: number;
  rows: Record<string, any>[];
  isSynthetic?: boolean;
}

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

  isSplit: boolean;
  trainRSquared?: number;
  testRSquared?: number;
  trainRmse?: number;
  testRmse?: number;
  trainMae?: number;
  testMae?: number;
  trainSize?: number;
  testSize?: number;

  coefficients: CoefficientOutput[];
  overallFTestVerdict: string;
  plainEnglishSummary: string;

  observations: {
    actual: number;
    predicted: number;
    residual: number;
    standardizedResidual: number;
  }[];
}

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

export interface HypothesisTestResult {
  testName: string;
  testType: string;
  tail: 'two-tailed' | 'left-tailed' | 'right-tailed';
  alpha: number;
  h0: string;
  h1: string;
  statisticName: string;
  statisticValue: number;
  df?: number | string;
  pValue: number;
  decision: 'Reject H₀' | 'Fail to reject H₀';
  confidenceInterval?: [number, number];
  ciLevel?: number;
  sampleSizes: { [key: string]: number };
  sampleMeans?: { [key: string]: number };
  sampleStds?: { [key: string]: number };
  interpretation: string;
  plainEnglishConclusion: string;
  assumptions: string[];
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
    vifList: {
      variable: string;
      vif: number;
      tolerance: number;
      concernLevel: 'Low concern' | 'Moderate concern' | 'High concern';
      recommendation: string;
    }[];
    maxVif: number;
    hasSevereMulticollinearity: boolean;
    summary: string;
  };
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

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  datasetId?: string;
  cleaningOperations: string[];
  models: any[];
  hypothesisTests: any[];
  notes: string;
}
