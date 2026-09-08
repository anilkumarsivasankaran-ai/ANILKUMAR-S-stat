import express, { Request, Response } from 'express';
import path from 'path';
import multer from 'multer';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { createServer as createViteServer } from 'vite';
import { generateSampleDataset } from './server/sampleData.js';
import { computeNumericalStats, computeCategoricalStats, detectOutliers } from './server/stats/descriptive.js';
import { evaluateCorrelation, computeCorrelationMatrix } from './server/stats/correlation.js';
import { runHypothesisTest, HypothesisTestRequest } from './server/stats/hypothesis.js';
import { fitLinearRegression, FitRegressionOptions } from './server/stats/regression.js';
import { computeDiagnostics } from './server/stats/diagnostics.js';
import { computePrediction, PredictionRequest } from './server/stats/prediction.js';
import { generateDeepStatisticalInterpretation } from './server/ai.js';

interface DatasetStore {
  id: string;
  name: string;
  uploadedAt: string;
  rowCount: number;
  columnCount: number;
  memoryUsageKb: number;
  numericalColumns: string[];
  categoricalColumns: string[];
  columns: {
    name: string;
    type: 'numerical' | 'categorical';
    missingCount: number;
    missingPercentage: number;
    uniqueCount: number;
  }[];
  missingValuesTotal: number;
  duplicateRowsCount: number;
  rows: Record<string, any>[];
  isSynthetic?: boolean;
}

interface ProjectStore {
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

const datasets: Map<string, DatasetStore> = new Map();
const projects: Map<string, ProjectStore> = new Map();

function analyzeDataset(id: string, name: string, rows: Record<string, any>[], isSynthetic = false): DatasetStore {
  const rowCount = rows.length;
  if (rowCount === 0) {
    return {
      id,
      name,
      uploadedAt: new Date().toISOString(),
      rowCount: 0,
      columnCount: 0,
      memoryUsageKb: 0,
      numericalColumns: [],
      categoricalColumns: [],
      columns: [],
      missingValuesTotal: 0,
      duplicateRowsCount: 0,
      rows: [],
      isSynthetic
    };
  }

  const allKeys = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
  const numericalCols: string[] = [];
  const categoricalCols: string[] = [];

  // Determine types and missing values
  let missingTotal = 0;
  const colDetails = allKeys.map(key => {
    let numericCount = 0;
    let missingCount = 0;
    const uniqueValues = new Set();

    for (let i = 0; i < rowCount; i++) {
      const val = rows[i][key];
      if (val === null || val === undefined || val === '') {
        missingCount++;
        missingTotal++;
      } else {
        uniqueValues.add(val);
        if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
          numericCount++;
        } else if (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val))) {
          numericCount++;
        }
      }
    }

    const nonMissing = rowCount - missingCount;
    const isNum = nonMissing > 0 && numericCount / nonMissing >= 0.8;

    if (isNum) {
      numericalCols.push(key);
    } else {
      categoricalCols.push(key);
    }

    return {
      name: key,
      type: (isNum ? 'numerical' : 'categorical') as 'numerical' | 'categorical',
      missingCount,
      missingPercentage: Number(((missingCount / rowCount) * 100).toFixed(2)),
      uniqueCount: uniqueValues.size
    };
  });

  // Calculate duplicate rows
  const seenRowStrings = new Set<string>();
  let duplicateCount = 0;
  for (const r of rows) {
    const serialized = JSON.stringify(r);
    if (seenRowStrings.has(serialized)) {
      duplicateCount++;
    } else {
      seenRowStrings.add(serialized);
    }
  }

  // Rough memory estimate
  const approxBytes = JSON.stringify(rows).length * 2;
  const memoryUsageKb = Math.round(approxBytes / 1024);

  return {
    id,
    name,
    uploadedAt: new Date().toISOString(),
    rowCount,
    columnCount: allKeys.length,
    memoryUsageKb,
    numericalColumns: numericalCols,
    categoricalColumns: categoricalCols,
    columns: colDetails,
    missingValuesTotal: missingTotal,
    duplicateRowsCount: duplicateCount,
    rows,
    isSynthetic
  };
}

// Preload the default synthetic sales dataset
const defaultSampleRows = generateSampleDataset(1000);
const defaultSampleDataset = analyzeDataset(
  'sample_sales_2026',
  'sales_performance_2026.csv (Synthetic Benchmark)',
  defaultSampleRows,
  true
);
datasets.set(defaultSampleDataset.id, defaultSampleDataset);

// Preload a default project
const defaultProject: ProjectStore = {
  id: 'proj_default_01',
  name: 'Retail Sales & Marketing Optimization',
  description: 'Multivariate econometric and regression analysis exploring the impact of advertising, pricing, and footfall on retail sales performance.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  datasetId: defaultSampleDataset.id,
  cleaningOperations: ['Initial baseline synthetic data validation'],
  models: [],
  hypothesisTests: [],
  notes: 'Primary objective: Estimate elasticity of sales with respect to advertising expenditure and price while verifying regression assumptions.'
};
projects.set(defaultProject.id, defaultProject);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50 MB limit
  });

  // 1. Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Statistical Analytics Studio',
      timestamp: new Date().toISOString(),
      datasetsCount: datasets.size,
      projectsCount: projects.size
    });
  });

  // 2. Sample Dataset loader (both GET and POST supported)
  const getOrGenerateSample = (regenerate: boolean = false) => {
    if (regenerate || !datasets.has('sample_sales_2026')) {
      const rows = generateSampleDataset(1000);
      const dataset = analyzeDataset(
        'sample_sales_2026',
        'sales_performance_2026.csv (Synthetic Benchmark)',
        rows,
        true
      );
      datasets.set(dataset.id, dataset);
      return dataset;
    }
    return datasets.get('sample_sales_2026')!;
  };

  app.get('/api/datasets/sample', (req: Request, res: Response) => {
    try {
      const sample = getOrGenerateSample(false);
      res.json({ success: true, dataset: sample });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/datasets/sample', (req: Request, res: Response) => {
    try {
      const sample = getOrGenerateSample(true);
      res.json({ success: true, dataset: sample });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Current active dataset helper
  app.get('/api/datasets/current', (req: Request, res: Response) => {
    try {
      // Return first dataset or default sample
      const first = Array.from(datasets.values())[0] || getOrGenerateSample(false);
      res.json({ success: true, dataset: first });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Dataset Upload (CSV, XLSX, XLS)
  app.post('/api/datasets/upload', upload.single('file'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const originalName = req.file.originalname;
      const ext = path.extname(originalName).toLowerCase();
      let parsedRows: Record<string, any>[] = [];

      if (ext === '.csv') {
        const csvContent = req.file.buffer.toString('utf-8');
        const parseResult = Papa.parse(csvContent, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Failed to parse CSV file',
            details: parseResult.errors[0].message
          });
        }
        parsedRows = parseResult.data as Record<string, any>[];
      } else if (ext === '.xlsx' || ext === '.xls') {
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          return res.status(400).json({ success: false, message: 'Excel workbook contains no sheets' });
        }
        const worksheet = workbook.Sheets[sheetName];
        parsedRows = XLSX.utils.sheet_to_json(worksheet, { defval: null });
      } else {
        return res.status(400).json({
          success: false,
          message: `Unsupported file format (${ext}). Please upload CSV or Excel (.xlsx, .xls) files.`
        });
      }

      const datasetId = `ds_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const dataset = analyzeDataset(datasetId, originalName, parsedRows, false);
      datasets.set(datasetId, dataset);

      res.json({
        success: true,
        message: `Successfully uploaded and processed ${originalName}`,
        dataset
      });
    } catch (err: any) {
      console.error('Upload error:', err);
      res.status(500).json({
        success: false,
        error_code: 'DATASET_UPLOAD_ERROR',
        message: 'An error occurred while parsing the dataset',
        details: err.message
      });
    }
  });

  // 4. List and Get Datasets
  app.get('/api/datasets', (req: Request, res: Response) => {
    const list = Array.from(datasets.values()).map(d => ({
      id: d.id,
      name: d.name,
      uploadedAt: d.uploadedAt,
      rowCount: d.rowCount,
      columnCount: d.columnCount,
      memoryUsageKb: d.memoryUsageKb,
      numericalColumns: d.numericalColumns,
      categoricalColumns: d.categoricalColumns,
      missingValuesTotal: d.missingValuesTotal,
      duplicateRowsCount: d.duplicateRowsCount,
      isSynthetic: d.isSynthetic
    }));
    res.json({ success: true, datasets: list });
  });

  app.get('/api/datasets/:id', (req: Request, res: Response) => {
    const dataset = datasets.get(req.params.id);
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found' });
    }
    res.json({ success: true, dataset });
  });

  // 5. Data Cleaning operations
  app.post('/api/datasets/:id/clean', (req: Request, res: Response) => {
    try {
      const dataset = datasets.get(req.params.id);
      if (!dataset) {
        return res.status(404).json({ success: false, message: 'Dataset not found' });
      }

      const { action, column, method, columnsToRemove } = req.body;
      let newRows = [...dataset.rows];

      switch (action) {
        case 'remove_missing_rows': {
          newRows = newRows.filter(row => {
            return Object.values(row).every(v => v !== null && v !== undefined && v !== '');
          });
          break;
        }

        case 'remove_columns': {
          const toRemove: string[] = columnsToRemove || (column ? [column] : []);
          newRows = newRows.map(row => {
            const copy = { ...row };
            for (const col of toRemove) {
              delete copy[col];
            }
            return copy;
          });
          break;
        }

        case 'impute': {
          if (!column) throw new Error('Column name required for imputation');
          const vals = newRows.map(r => r[column]).filter(v => v !== null && v !== undefined && v !== '' && !isNaN(Number(v)));
          let replacementValue = 0;

          if (method === 'mean') {
            const sum = vals.reduce((a, b) => a + Number(b), 0);
            replacementValue = vals.length > 0 ? Number((sum / vals.length).toFixed(4)) : 0;
          } else if (method === 'median') {
            const sorted = [...vals.map(Number)].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            replacementValue = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
          } else if (method === 'mode') {
            const counts: Record<string, number> = {};
            for (const v of newRows.map(r => r[column])) {
              if (v !== null && v !== undefined && v !== '') counts[String(v)] = (counts[String(v)] || 0) + 1;
            }
            const modeKey = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
            replacementValue = modeKey !== undefined ? (isNaN(Number(modeKey)) ? modeKey : Number(modeKey)) as any : 0;
          }

          newRows = newRows.map(row => {
            const v = row[column];
            if (v === null || v === undefined || v === '') {
              return { ...row, [column]: replacementValue };
            }
            return row;
          });
          break;
        }

        case 'remove_duplicates': {
          const seen = new Set<string>();
          const deduped: Record<string, any>[] = [];
          for (const row of newRows) {
            const s = JSON.stringify(row);
            if (!seen.has(s)) {
              seen.add(s);
              deduped.push(row);
            }
          }
          newRows = deduped;
          break;
        }

        case 'remove_outliers': {
          if (!column) throw new Error('Column name required for outlier removal');
          const cleanVals = newRows.map(r => Number(r[column])).filter(v => !isNaN(v) && isFinite(v));
          const outliers = detectOutliers(cleanVals);
          const outlierSet = new Set(method === 'zscore' ? outliers.zScoreOutliers : outliers.iqrOutliers);

          newRows = newRows.filter(row => {
            const v = Number(row[column]);
            return !outlierSet.has(v);
          });
          break;
        }

        default:
          throw new Error(`Unknown cleaning action: ${action}`);
      }

      const updated = analyzeDataset(dataset.id, dataset.name, newRows, dataset.isSynthetic);
      datasets.set(dataset.id, updated);

      res.json({
        success: true,
        message: `Applied cleaning action "${action}" successfully. Dataset now has ${updated.rowCount} rows.`,
        dataset: updated
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error_code: 'CLEANING_FAILED',
        message: err.message
      });
    }
  });

  // 6. Exploratory Data Analysis (Descriptive statistics)
  app.post('/api/eda/describe', (req: Request, res: Response) => {
    try {
      const { datasetId, columns } = req.body;
      const dataset = (datasetId ? datasets.get(datasetId) : undefined) || Array.from(datasets.values())[0];
      if (!dataset) return res.status(404).json({ success: false, message: 'Dataset not found' });

      const colsToAnalyze = columns || [...dataset.numericalColumns, ...dataset.categoricalColumns];
      const numericalStats: any[] = [];
      const categoricalStats: any[] = [];

      for (const col of colsToAnalyze) {
        if (dataset.numericalColumns.includes(col)) {
          const vals = dataset.rows.map(r => Number(r[col]));
          numericalStats.push(computeNumericalStats(col, vals));
        } else if (dataset.categoricalColumns.includes(col)) {
          const vals = dataset.rows.map(r => r[col]);
          categoricalStats.push(computeCategoricalStats(col, vals));
        }
      }

      res.json({
        success: true,
        numericalStats,
        categoricalStats
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 7. Correlation Analysis
  app.post('/api/eda/correlation', (req: Request, res: Response) => {
    try {
      const { datasetId, x, y, method = 'pearson', alpha = 0.05 } = req.body;
      const dataset = (datasetId ? datasets.get(datasetId) : undefined) || Array.from(datasets.values())[0];
      if (!dataset) return res.status(404).json({ success: false, message: 'Dataset not found' });

      // If x and y are provided, compute pairwise
      if (x && y) {
        const xVals = dataset.rows.map(r => Number(r[x]));
        const yVals = dataset.rows.map(r => Number(r[y]));
        const result = evaluateCorrelation(x, y, xVals, yVals, method, alpha);
        return res.json({ success: true, result });
      }

      // Otherwise compute full matrix of numerical columns
      const numCols = dataset.numericalColumns;
      const colData: Record<string, number[]> = {};
      for (const c of numCols) {
        colData[c] = dataset.rows.map(r => Number(r[c]));
      }
      const matrix = computeCorrelationMatrix(numCols, colData);
      res.json({ success: true, matrix });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 8. Hypothesis Testing
  app.post('/api/hypothesis/test', (req: Request, res: Response) => {
    try {
      const { datasetId, testType, variable, variable2, groupVariable, hypothesizedMean, hypothesizedProp, tail, alpha, contingencyTable } = req.body;
      const dataset = (datasetId ? datasets.get(datasetId) : undefined) || Array.from(datasets.values())[0];

      const testReq: HypothesisTestRequest = {
        testType,
        tail,
        alpha: alpha ? Number(alpha) : 0.05,
        variable,
        variable2,
        groupVariable,
        hypothesizedMean: hypothesizedMean !== undefined ? Number(hypothesizedMean) : 0,
        hypothesizedProp: hypothesizedProp !== undefined ? Number(hypothesizedProp) : 0.5,
        contingencyTable
      };

      if (dataset) {
        if (variable && dataset.rows) {
          testReq.sample1 = dataset.rows.map(r => Number(r[variable]));
        }
        if (variable2 && dataset.rows) {
          testReq.sample2 = dataset.rows.map(r => Number(r[variable2]));
        }
        if (groupVariable && variable && dataset.rows) {
          const groups: Record<string, number[]> = {};
          for (const row of dataset.rows) {
            const g = String(row[groupVariable] || 'Unknown');
            const v = Number(row[variable]);
            if (!groups[g]) groups[g] = [];
            if (!isNaN(v) && isFinite(v)) groups[g].push(v);
          }
          testReq.groupData = groups;
        }
      }

      const result = runHypothesisTest(testReq);
      res.json({ success: true, result });
    } catch (err: any) {
      console.error('Hypothesis test error:', err);
      res.status(400).json({
        success: false,
        error_code: 'HYPOTHESIS_TEST_ERROR',
        message: err.message
      });
    }
  });

  // 9. Linear Regression Module (Fit Model)
  app.post('/api/regression/fit', (req: Request, res: Response) => {
    try {
      const { datasetId, target, predictors, trainTestSplit, randomSeed, standardize } = req.body;
      const dataset = (datasetId ? datasets.get(datasetId) : undefined) || Array.from(datasets.values())[0];
      if (!dataset) return res.status(404).json({ success: false, message: 'Dataset not found' });

      if (!target || !predictors || predictors.length === 0) {
        return res.status(400).json({
          success: false,
          error_code: 'INVALID_REGRESSION_SELECTION',
          message: 'Please select one target variable (Y) and at least one predictor variable (X).'
        });
      }

      const colData: Record<string, number[]> = {};
      colData[target] = dataset.rows.map(r => Number(r[target]));
      for (const p of predictors) {
        colData[p] = dataset.rows.map(r => Number(r[p]));
      }

      const options: FitRegressionOptions = {
        target,
        predictors,
        data: colData,
        trainTestSplit: trainTestSplit ? Number(trainTestSplit) : undefined,
        randomSeed: randomSeed ? Number(randomSeed) : 42,
        standardize: Boolean(standardize)
      };

      const model = fitLinearRegression(options);
      res.json({ success: true, model });
    } catch (err: any) {
      console.error('Regression error:', err);
      res.status(400).json({
        success: false,
        error_code: 'REGRESSION_FIT_ERROR',
        message: err.message
      });
    }
  });

  // 10. Regression Diagnostics
  app.post('/api/regression/diagnostics', (req: Request, res: Response) => {
    try {
      const { datasetId, target, predictors } = req.body;
      const dataset = (datasetId ? datasets.get(datasetId) : undefined) || Array.from(datasets.values())[0];
      if (!dataset) return res.status(404).json({ success: false, message: 'Dataset not found' });

      const colData: Record<string, number[]> = {};
      colData[target] = dataset.rows.map(r => Number(r[target]));
      for (const p of predictors) {
        colData[p] = dataset.rows.map(r => Number(r[p]));
      }

      const model = fitLinearRegression({ target, predictors, data: colData });
      const residuals = model.observations.map(o => o.residual);
      const diagnostics = computeDiagnostics(target, predictors, colData, residuals);

      res.json({ success: true, diagnostics });
    } catch (err: any) {
      console.error('Diagnostics error:', err);
      res.status(400).json({
        success: false,
        error_code: 'DIAGNOSTICS_ERROR',
        message: err.message
      });
    }
  });

  // 11. Predictions Module
  app.post('/api/regression/predict', (req: Request, res: Response) => {
    try {
      const { datasetId, target, predictors, inputValues, alpha } = req.body;
      const dataset = (datasetId ? datasets.get(datasetId) : undefined) || Array.from(datasets.values())[0];
      if (!dataset) return res.status(404).json({ success: false, message: 'Dataset not found' });

      const colData: Record<string, number[]> = {};
      colData[target] = dataset.rows.map(r => Number(r[target]));
      for (const p of predictors) {
        colData[p] = dataset.rows.map(r => Number(r[p]));
      }

      const predictReq: PredictionRequest = {
        target,
        predictors,
        inputValues: inputValues || {},
        data: colData,
        alpha: alpha ? Number(alpha) : 0.05
      };

      const prediction = computePrediction(predictReq);
      res.json({ success: true, prediction });
    } catch (err: any) {
      console.error('Prediction error:', err);
      res.status(400).json({
        success: false,
        error_code: 'PREDICTION_ERROR',
        message: err.message
      });
    }
  });

  // 12. AI Deep Thinking Assistant (Gemini 3.1 Pro Preview with HIGH Thinking Mode)
  app.post('/api/ai/deep-thinking', async (req: Request, res: Response) => {
    try {
      const { query, context } = req.body;
      if (!query) {
        return res.status(400).json({ success: false, message: 'Query is required' });
      }

      const interpretation = await generateDeepStatisticalInterpretation(query, context);
      res.json({ success: true, interpretation });
    } catch (err: any) {
      console.error('AI Deep Thinking error:', err);
      res.status(500).json({
        success: false,
        error_code: 'AI_THINKING_ERROR',
        message: err.message || 'Failed to generate AI statistical consultation.'
      });
    }
  });

  // 13. Projects REST APIs
  app.get('/api/projects', (req: Request, res: Response) => {
    res.json({ success: true, projects: Array.from(projects.values()) });
  });

  app.post('/api/projects', (req: Request, res: Response) => {
    try {
      const { name, description, datasetId, models, hypothesisTests, notes } = req.body;
      const id = `proj_${Date.now()}`;
      const newProj: ProjectStore = {
        id,
        name: name || `Analysis Project ${projects.size + 1}`,
        description: description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        datasetId,
        cleaningOperations: [],
        models: models || [],
        hypothesisTests: hypothesisTests || [],
        notes: notes || ''
      };
      projects.set(id, newProj);
      res.json({ success: true, project: newProj });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/projects/:id', (req: Request, res: Response) => {
    const proj = projects.get(req.params.id);
    if (!proj) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, project: proj });
  });

  app.delete('/api/projects/:id', (req: Request, res: Response) => {
    projects.delete(req.params.id);
    res.json({ success: true, message: 'Project deleted' });
  });

  // 14. Mount Vite middleware for development or static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Statistical Analytics Studio running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
