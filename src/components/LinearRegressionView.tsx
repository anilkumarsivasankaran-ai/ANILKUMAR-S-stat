import React, { useState } from 'react';
import {
  TrendingUp,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowRight,
  Sparkles,
  Info,
  Database,
  HelpCircle
} from 'lucide-react';
import { Dataset, RegressionModelOutput, NavigationTab } from '../types';

interface LinearRegressionViewProps {
  dataset: Dataset | null;
  onModelCreated: (model: RegressionModelOutput) => void;
  setActiveTab: (tab: NavigationTab) => void;
  activeModel: RegressionModelOutput | null;
}

export const LinearRegressionView: React.FC<LinearRegressionViewProps> = ({
  dataset,
  onModelCreated,
  setActiveTab,
  activeModel
}) => {
  const [target, setTarget] = useState<string>('');
  const [selectedPredictors, setSelectedPredictors] = useState<string[]>([]);
  const [trainSplit, setTrainSplit] = useState<number>(0.8);
  const [useSplit, setUseSplit] = useState<boolean>(false);
  const [standardize, setStandardize] = useState<boolean>(false);
  const [fitting, setFitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize target and default predictors from dataset
  React.useEffect(() => {
    if (dataset && dataset.numericalColumns.length > 0) {
      if (!target || !dataset.numericalColumns.includes(target)) {
        setTarget(dataset.numericalColumns[0]);
      }
      if (selectedPredictors.length === 0) {
        const others = dataset.numericalColumns.slice(1, 4);
        setSelectedPredictors(others);
      }
    }
  }, [dataset]);

  if (!dataset) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <Database className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">No Dataset Loaded</h3>
        <p className="text-xs text-slate-400 mt-1">Please upload or load a sample dataset first.</p>
      </div>
    );
  }

  const togglePredictor = (col: string) => {
    if (col === target) return;
    if (selectedPredictors.includes(col)) {
      setSelectedPredictors(selectedPredictors.filter(p => p !== col));
    } else {
      setSelectedPredictors([...selectedPredictors, col]);
    }
  };

  const handleFitModel = async () => {
    if (!target) {
      setErrorMsg('Please select a target variable (Y).');
      return;
    }
    if (selectedPredictors.length === 0) {
      setErrorMsg('Please select at least one predictor variable (X).');
      return;
    }

    setFitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/regression/fit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId: dataset.id,
          target,
          predictors: selectedPredictors,
          trainTestSplit: useSplit ? trainSplit : undefined,
          standardize
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fit regression model');
      }
      onModelCreated(data.model);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setFitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-bold text-white">Ordinary Least Squares (OLS) Linear Regression</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Fit simple and multiple linear regression models with closed-form matrix algebra, coefficient t-tests, and goodness-of-fit metrics.
          </p>
        </div>

        {activeModel && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('diagnostics')}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
            >
              <span>View Diagnostics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTab('predictions')}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <span>Make Predictions</span>
            </button>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Model Configuration Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Configure Regression Architecture</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Target Variable (Y) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white block">
              1. Dependent / Target Variable (Y)
            </label>
            <select
              value={target}
              onChange={e => {
                const newT = e.target.value;
                setTarget(newT);
                setSelectedPredictors(selectedPredictors.filter(p => p !== newT));
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono font-medium focus:outline-none focus:border-blue-500"
            >
              {dataset.numericalColumns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">The continuous outcome metric being explained or predicted.</p>
          </div>

          {/* Predictors Multi-select (X) */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-semibold text-white block">
              2. Independent / Predictor Variables (X₁, X₂, ..., Xₖ)
            </label>
            <div className="flex flex-wrap gap-2">
              {dataset.numericalColumns.map(col => {
                const isTarget = col === target;
                const isSelected = selectedPredictors.includes(col);
                return (
                  <button
                    key={col}
                    type="button"
                    disabled={isTarget}
                    onClick={() => togglePredictor(col)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition ${
                      isTarget
                        ? 'opacity-30 cursor-not-allowed bg-slate-950 border-slate-800 text-slate-500'
                        : isSelected
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {col} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400">
              Selected: {selectedPredictors.length} predictors ({selectedPredictors.join(', ') || 'None'})
            </p>
          </div>
        </div>

        {/* Advanced Options: Split & Standardization */}
        <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div>
              <span className="font-semibold text-white block">Train / Test Split</span>
              <span className="text-[11px] text-slate-400">
                {useSplit ? `Evaluate generalizability on ${(100 - trainSplit * 100).toFixed(0)}% holdout test set` : 'Train on 100% of sample'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {useSplit && (
                <span className="font-mono text-blue-400">{(trainSplit * 100).toFixed(0)}% / {(100 - trainSplit * 100).toFixed(0)}%</span>
              )}
              <input
                type="checkbox"
                checked={useSplit}
                onChange={e => setUseSplit(e.target.value === 'true' || e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div>
              <span className="font-semibold text-white block">Standardize Predictors (Z-score)</span>
              <span className="text-[11px] text-slate-400">Scale predictors to mean=0, std=1 for standardized coefficients</span>
            </div>
            <input
              type="checkbox"
              checked={standardize}
              onChange={e => setStandardize(e.target.checked)}
              className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
          </div>
        </div>

        <button
          onClick={handleFitModel}
          disabled={fitting || !target || selectedPredictors.length === 0}
          className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition shadow-sm"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{fitting ? 'Computing Matrix Inversion (XᵀX)⁻¹...' : 'Fit Linear Regression Model'}</span>
        </button>
      </div>

      {/* Active Model Results Section */}
      {activeModel && (
        <div className="space-y-6">
          {/* Regression Equation Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Estimated Model Equation</span>
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 overflow-x-auto font-mono text-sm text-slate-100 font-semibold">
              {activeModel.equation}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {activeModel.plainEnglishSummary}
            </p>
          </div>

          {/* Model Evaluation Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">R² (Variance Expl.)</span>
              <span className="text-xl font-bold font-mono text-blue-400">{(activeModel.rSquared * 100).toFixed(1)}%</span>
              <span className="text-[10px] text-slate-500 block">{activeModel.rSquared}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Adjusted R²</span>
              <span className="text-xl font-bold font-mono text-emerald-400">{(activeModel.adjRSquared * 100).toFixed(1)}%</span>
              <span className="text-[10px] text-slate-500 block">{activeModel.adjRSquared}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">RMSE</span>
              <span className="text-xl font-bold font-mono text-white">{activeModel.rmse}</span>
              <span className="text-[10px] text-slate-500 block">Residual Error</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">MAE</span>
              <span className="text-xl font-bold font-mono text-white">{activeModel.mae}</span>
              <span className="text-[10px] text-slate-500 block">Mean Abs Error</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">F-Statistic</span>
              <span className="text-xl font-bold font-mono text-purple-400">{activeModel.fStatistic}</span>
              <span className="text-[10px] text-slate-500 block">p {activeModel.fPValue < 0.001 ? '< 0.001' : `= ${activeModel.fPValue}`}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">AIC / BIC</span>
              <span className="text-sm font-bold font-mono text-slate-200 block mt-1">{activeModel.aic}</span>
              <span className="text-[10px] text-slate-500 block">BIC: {activeModel.bic}</span>
            </div>
          </div>

          {/* Train vs Test Holdout Metrics (If split enabled) */}
          {activeModel.isSplit && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Holdout Test Generalization (Overfitting Audit)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Train R² (N = {activeModel.trainSize})</span>
                  <span className="text-base font-bold text-blue-300">
                    {activeModel.trainRSquared !== undefined ? (activeModel.trainRSquared * 100).toFixed(1) : 'N/A'}%
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Test R² (N = {activeModel.testSize})</span>
                  <span className="text-base font-bold text-emerald-300">
                    {activeModel.testRSquared !== undefined ? (activeModel.testRSquared * 100).toFixed(1) : 'N/A'}%
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Train RMSE</span>
                  <span className="text-base font-bold text-slate-300">{activeModel.trainRmse}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Test RMSE</span>
                  <span className="text-base font-bold text-slate-300">{activeModel.testRmse}</span>
                </div>
              </div>
            </div>
          )}

          {/* Coefficients Table with t-tests & interpretations */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Regression Coefficients & Significance Tests</h3>
                <p className="text-xs text-slate-400">Testing H₀: βⱼ = 0 vs H₁: βⱼ ≠ 0 via Student's t-distribution</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 font-mono">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3 px-3">Predictor Variable</th>
                    <th className="py-3 px-3 text-right text-blue-300">Coef (β)</th>
                    <th className="py-3 px-3 text-right">Std Error</th>
                    <th className="py-3 px-3 text-right">t-Stat</th>
                    <th className="py-3 px-3 text-right">p-Value</th>
                    <th className="py-3 px-3 text-center">95% Conf. Interval</th>
                    <th className="py-3 px-3">Direction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {activeModel.coefficients.map(c => (
                    <tr key={c.variable} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-semibold text-white whitespace-nowrap">
                        {c.variable}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-blue-300">{c.coefficient}</td>
                      <td className="py-3 px-3 text-right text-slate-400">{c.stdError}</td>
                      <td className="py-3 px-3 text-right">{c.tStatistic}</td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          c.significant ? 'text-emerald-300 bg-emerald-950/80' : 'text-amber-300 bg-amber-950/80'
                        }`}>
                          {c.pValue < 0.001 ? '< 0.001' : c.pValue}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-400">
                        [{c.ciLower}, {c.ciUpper}]
                      </td>
                      <td className="py-3 px-3 capitalize text-slate-300">{c.direction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Individual Coefficient Interpretations */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Individual Parameter Interpretations
              </span>
              <div className="space-y-2 text-xs">
                {activeModel.coefficients.map(c => (
                  <div key={c.variable} className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-300">
                    <strong className="text-white font-mono">{c.variable}:</strong> {c.plainInterpretation}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
