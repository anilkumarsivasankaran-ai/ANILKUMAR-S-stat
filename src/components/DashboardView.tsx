import React from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  TrendingUp,
  FlaskConical,
  Activity,
  FileCheck2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Layers,
  Database,
  BarChart2,
  AlertCircle
} from 'lucide-react';
import { Dataset, NavigationTab, RegressionModelOutput, HypothesisTestResult } from '../types';

interface DashboardViewProps {
  dataset: Dataset | null;
  models: RegressionModelOutput[];
  tests: HypothesisTestResult[];
  setActiveTab: (tab: NavigationTab) => void;
  onLoadSample: () => void;
  onOpenAiThinking: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  dataset,
  models,
  tests,
  setActiveTab,
  onLoadSample,
  onOpenAiThinking
}) => {
  const workflowSteps = [
    { title: '1. Upload', tab: 'upload', done: !!dataset, desc: 'CSV or XLSX' },
    { title: '2. Preview', tab: 'preview', done: !!dataset, desc: '100 rows + schema' },
    { title: '3. Clean', tab: 'cleaning', done: dataset ? dataset.missingValuesTotal === 0 : false, desc: 'Impute & filter' },
    { title: '4. EDA', tab: 'eda', done: !!dataset, desc: 'Summary stats' },
    { title: '5. Visualize', tab: 'visualizations', done: !!dataset, desc: 'Distributions' },
    { title: '6. Correlation', tab: 'correlation', done: !!dataset, desc: 'Pearson & Spearman' },
    { title: '7. Hypothesis', tab: 'hypothesis', done: tests.length > 0, desc: `${tests.length} tests run` },
    { title: '8. Regression', tab: 'regression', done: models.length > 0, desc: `${models.length} models fit` },
    { title: '9. Diagnostics', tab: 'diagnostics', done: models.length > 0, desc: 'VIF & Homoscedasticity' },
    { title: '10. Report', tab: 'reports', done: models.length > 0, desc: 'Downloadable PDF/HTML' },
  ];

  const dataQualityScore = dataset
    ? Math.max(0, Math.round(100 - (dataset.missingValuesTotal / (dataset.rowCount * (dataset.columnCount || 1))) * 100))
    : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Statistical Modeling Workspace</span>
            <h1 className="text-2xl font-bold text-white mt-1">End-to-End Statistical Analytics Studio</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Conduct rigorous exploratory analysis, hypothesis testing, Ordinary Least Squares (OLS) regression, model diagnostics, and generate publication-ready analytical reports.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Your Dataset</span>
            </button>
            <button
              onClick={onLoadSample}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
            >
              <Database className="w-4 h-4 text-blue-400" />
              <span>Load 1,000-Row Sample</span>
            </button>
            <button
              onClick={onOpenAiThinking}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition border border-indigo-400/30"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Deep Thinking Consultant</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Active Dataset</span>
            <div className="p-2 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-800/40">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-white truncate">{dataset ? dataset.name : 'None'}</h3>
            <p className="text-xs text-slate-400 mt-1">
              {dataset ? `${dataset.rowCount.toLocaleString()} rows • ${dataset.columnCount} columns` : 'Upload or load sample data'}
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Data Health Score</span>
            <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-white">{dataset ? `${dataQualityScore}%` : 'N/A'}</h3>
            <p className="text-xs text-slate-400 mt-1">
              {dataset ? `${dataset.missingValuesTotal} missing • ${dataset.duplicateRowsCount} duplicates` : 'No data loaded'}
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Fitted Models</span>
            <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-white">{models.length}</h3>
            <p className="text-xs text-slate-400 mt-1">
              {models.length > 0 ? `Latest R² = ${(models[models.length - 1].rSquared * 100).toFixed(1)}%` : 'Ready to fit regression'}
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Hypothesis Tests</span>
            <div className="p-2 rounded-lg bg-purple-950/60 text-purple-400 border border-purple-800/40">
              <FlaskConical className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-white">{tests.length}</h3>
            <p className="text-xs text-slate-400 mt-1">
              {tests.length > 0 ? `${tests.filter(t => t.decision === 'Reject H₀').length} rejected H₀` : 'T-test, ANOVA, Chi-Sq'}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Workflow Progress Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Full Analytics Lifecycle</h2>
            <p className="text-xs text-slate-400">Click any stage to jump directly into the analysis workspace</p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded">
            Stage {workflowSteps.filter(s => s.done).length} of {workflowSteps.length} active
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {workflowSteps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(step.tab as NavigationTab)}
              className={`p-3 rounded-lg border text-left transition relative group ${
                step.done
                  ? 'bg-slate-800/90 border-blue-600/50 hover:border-blue-500'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-semibold ${step.done ? 'text-blue-300' : 'text-slate-300'}`}>
                  {step.title}
                </span>
                {step.done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-700" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">{step.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Rules & Quick Launch Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Statistical Principles in this Software */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center space-x-2 text-white font-semibold mb-4">
            <AlertCircle className="w-4 h-4 text-indigo-400" />
            <span>Studio Scientific & Statistical Guardrails</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
            <div className="bg-slate-950/50 p-3.5 rounded-lg border border-slate-800/80">
              <span className="font-semibold text-blue-300 block mb-1">1. Association ≠ Causation</span>
              <p className="text-slate-400 leading-relaxed">
                Linear regression and correlations reflect observational associations, not direct causality, unless randomized experimental assignment was applied.
              </p>
            </div>
            <div className="bg-slate-950/50 p-3.5 rounded-lg border border-slate-800/80">
              <span className="font-semibold text-emerald-300 block mb-1">2. Rigorous Decision Rule</span>
              <p className="text-slate-400 leading-relaxed">
                We never state "accept H₀". The software strictly enforces the proper inferential standard: <strong>Reject H₀</strong> or <strong>Fail to reject H₀</strong>.
              </p>
            </div>
            <div className="bg-slate-950/50 p-3.5 rounded-lg border border-slate-800/80">
              <span className="font-semibold text-purple-300 block mb-1">3. Exact p-Values & Sample Size</span>
              <p className="text-slate-400 leading-relaxed">
                Exact p-values and sample sizes are calculated and reported for all hypothesis tests and OLS coefficient t-tests.
              </p>
            </div>
            <div className="bg-slate-950/50 p-3.5 rounded-lg border border-slate-800/80">
              <span className="font-semibold text-amber-300 block mb-1">4. Confidence vs. Prediction</span>
              <p className="text-slate-400 leading-relaxed">
                We clearly differentiate between <strong>Confidence Intervals</strong> (mean response uncertainty) and wider <strong>Prediction Intervals</strong> (individual future observation).
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-white text-sm mb-1">Quick Actions</h3>
            <p className="text-xs text-slate-400 mb-4">Fast shortcuts to core modeling modules</p>
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('regression')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition"
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span>Fit Linear Regression</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => setActiveTab('hypothesis')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition"
              >
                <div className="flex items-center space-x-2">
                  <FlaskConical className="w-4 h-4 text-purple-400" />
                  <span>Run Hypothesis Wizard</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => setActiveTab('least-squares')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition"
              >
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Least-Squares Interactive Sim</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition"
              >
                <div className="flex items-center space-x-2">
                  <FileCheck2 className="w-4 h-4 text-amber-400" />
                  <span>Generate Analytical Report</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Powered by Node & Gemini</span>
            <span className="text-indigo-400 font-medium cursor-pointer" onClick={onOpenAiThinking}>
              Consult AI →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
