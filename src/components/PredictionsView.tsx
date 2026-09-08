import React, { useState } from 'react';
import {
  SlidersHorizontal,
  TrendingUp,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowRight,
  Database
} from 'lucide-react';
import { Dataset, RegressionModelOutput, PredictionResponse } from '../types';

interface PredictionsViewProps {
  dataset: Dataset | null;
  activeModel: RegressionModelOutput | null;
}

export const PredictionsView: React.FC<PredictionsViewProps> = ({
  dataset,
  activeModel
}) => {
  const [inputValues, setInputValues] = useState<Record<string, number>>({});
  const [alpha, setAlpha] = useState<number>(0.05);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (activeModel && dataset) {
      // Default to mean values of each predictor
      const defaults: Record<string, number> = {};
      for (const p of activeModel.predictorVariables) {
        const vals = dataset.rows.map(r => Number(r[p])).filter(v => !isNaN(v));
        const mean = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        defaults[p] = Number(mean.toFixed(2));
      }
      setInputValues(defaults);
    }
  }, [activeModel?.modelId, dataset?.id]);

  if (!dataset || !activeModel) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">No Regression Model Fitted</h3>
        <p className="text-xs text-slate-400 mt-1">
          Please fit a regression model in Step 9 to enable scenario predictions and interval estimations.
        </p>
      </div>
    );
  }

  const handlePredict = async () => {
    setCalculating(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/regression/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId: dataset.id,
          target: activeModel.targetVariable,
          predictors: activeModel.predictorVariables,
          inputValues,
          alpha
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to compute predictions');
      }
      setPrediction(data.prediction);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-bold text-white">Model Scenario Forecasting & Intervals</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate predictor inputs to generate point predictions, Mean Response Confidence Intervals, and Individual Prediction Intervals.
          </p>
        </div>

        <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
          Target: <strong className="text-white">{activeModel.targetVariable}</strong>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Input Form Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider">Specify Scenario Predictor Values</h2>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Confidence Level:</span>
            <select
              value={alpha}
              onChange={e => setAlpha(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono"
            >
              <option value={0.05}>95% Confidence</option>
              <option value={0.01}>99% Confidence</option>
              <option value={0.10}>90% Confidence</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {activeModel.predictorVariables.map(p => (
            <div key={p} className="space-y-1">
              <label className="text-xs font-medium text-slate-300 font-mono block truncate">{p}</label>
              <input
                type="number"
                step="any"
                value={inputValues[p] !== undefined ? inputValues[p] : ''}
                onChange={e => setInputValues({ ...inputValues, [p]: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          ))}
        </div>

        <button
          onClick={handlePredict}
          disabled={calculating}
          className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition shadow-sm"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{calculating ? 'Inverting Leverage Matrix...' : 'Generate Point Prediction & Uncertainty Intervals'}</span>
        </button>
      </div>

      {/* Prediction Results */}
      {prediction && (
        <div className="space-y-6">
          {/* Main Point Forecast Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center space-y-2">
            <span className="text-xs font-mono uppercase text-slate-400">Estimated Expected Value for {prediction.targetVariable} (Ŷ)</span>
            <div className="text-4xl font-extrabold text-blue-400 font-mono">
              {prediction.predictedValue.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Equation: {prediction.equationUsed}
            </p>
          </div>

          {/* Dual Interval Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Confidence Interval */}
            <div className="bg-slate-900 border border-blue-900/40 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                  {prediction.confidenceInterval.level}% Confidence Interval
                </h3>
                <span className="text-[11px] font-mono text-slate-400">Mean Response</span>
              </div>

              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-center font-mono">
                <span className="text-xl font-bold text-emerald-300">
                  [{prediction.confidenceInterval.lower}, {prediction.confidenceInterval.upper}]
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  SE(Mean) = {prediction.confidenceInterval.stdError}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {prediction.confidenceInterval.description}
              </p>
            </div>

            {/* 2. Prediction Interval */}
            <div className="bg-slate-900 border border-purple-900/40 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                  {prediction.predictionInterval.level}% Prediction Interval
                </h3>
                <span className="text-[11px] font-mono text-slate-400">Individual Observation</span>
              </div>

              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-center font-mono">
                <span className="text-xl font-bold text-purple-300">
                  [{prediction.predictionInterval.lower}, {prediction.predictionInterval.upper}]
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  SE(Pred) = {prediction.predictionInterval.stdError}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {prediction.predictionInterval.description}
              </p>
            </div>
          </div>

          {/* Educational Note Banner */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
            <span className="font-semibold text-white block">Why is the Prediction Interval wider than the Confidence Interval?</span>
            <p className="text-slate-400 leading-relaxed">
              The <strong>Confidence Interval</strong> reflects only sampling error in estimating the regression line (the true mean response). In contrast, a <strong>Prediction Interval</strong> forecasts a single new future case, which includes both model estimation uncertainty <em>plus</em> the random error variance of an individual event: SE<sub>pred</sub> = s√(1 + h₀).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
