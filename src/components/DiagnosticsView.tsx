import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  TrendingUp,
  Database
} from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Dataset, RegressionModelOutput, DiagnosticsOutput } from '../types';

interface DiagnosticsViewProps {
  dataset: Dataset | null;
  activeModel: RegressionModelOutput | null;
}

export const DiagnosticsView: React.FC<DiagnosticsViewProps> = ({
  dataset,
  activeModel
}) => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'linearity' | 'normality' | 'homoscedasticity' | 'multicollinearity' | 'autocorrelation'>('linearity');

  useEffect(() => {
    if (!dataset || !activeModel) return;
    fetchDiagnostics();
  }, [dataset?.id, activeModel?.modelId]);

  const fetchDiagnostics = async () => {
    if (!dataset || !activeModel) return;
    setLoading(true);
    try {
      const res = await fetch('/api/regression/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId: dataset.id,
          target: activeModel.targetVariable,
          predictors: activeModel.predictorVariables
        })
      });
      const data = await res.json();
      if (data.success) {
        setDiagnostics(data.diagnostics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!dataset || !activeModel) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">No Regression Model Fitted</h3>
        <p className="text-xs text-slate-400 mt-1">
          Please navigate to Step 9 (Linear Regression) and fit a model first to run diagnostic audits.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-bold text-white">Regression Diagnostic Audits</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Evaluating Gauss-Markov assumptions: Linearity, Normality of Residuals, Homoscedasticity, Multicollinearity (VIF), and Autocorrelation.
          </p>
        </div>

        <button
          onClick={fetchDiagnostics}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center space-x-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Diagnostics</span>
        </button>
      </div>

      {/* Model Context Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Target (Y):</span>
          <span className="font-mono font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {activeModel.targetVariable}
          </span>
          <span className="text-slate-400">Predictors (X):</span>
          <span className="font-mono text-blue-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {activeModel.predictorVariables.join(', ')}
          </span>
        </div>
        <div className="flex items-center space-x-3 text-slate-400 font-mono">
          <span>R² = {(activeModel.rSquared * 100).toFixed(1)}%</span>
          <span>RMSE = {activeModel.rmse}</span>
          <span>N = {activeModel.sampleSize}</span>
        </div>
      </div>

      {/* Diagnostic Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 text-xs">
        {[
          { id: 'linearity', label: '1. Linearity & Residuals vs Fitted' },
          { id: 'normality', label: '2. Normality of Residuals (Q-Q Plot)' },
          { id: 'homoscedasticity', label: '3. Homoscedasticity (Breusch-Pagan)' },
          { id: 'multicollinearity', label: '4. Multicollinearity (VIF)' },
          { id: 'autocorrelation', label: '5. Autocorrelation (Durbin-Watson)' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-2 rounded-lg font-medium transition ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Linearity */}
      {activeTab === 'linearity' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plot 1: Actual vs Predicted */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Actual vs. Predicted</h3>
              <span className="text-[11px] text-slate-400">Points should cluster around diagonal</span>
            </div>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="predicted" name="Predicted" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="actual" name="Actual" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                  <Scatter data={activeModel.observations} fill="#3b82f6" fillOpacity={0.65} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Plot 2: Residual vs Fitted */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Residuals vs. Fitted Values</h3>
              <span className="text-[11px] text-slate-400">Zero horizontal line indicates unbiasedness</span>
            </div>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="predicted" name="Fitted (ŷ)" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="residual" name="Residual (e)" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                  <Scatter data={activeModel.observations} fill="#10b981" fillOpacity={0.65} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Normality of Residuals & Q-Q Plot */}
      {activeTab === 'normality' && diagnostics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Normal Q-Q Plot */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Normal Q-Q Plot</h3>
                <span className="text-[11px] text-slate-400">Theoretical vs Sample Quantiles</span>
              </div>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="theoreticalQuantile" name="Theoretical Quantile" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="standardizedResidual" name="Standardized Residual" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                    <Scatter data={diagnostics.normality.qqPlotData} fill="#8b5cf6" fillOpacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Residual Distribution Histogram */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Residual Histogram</h3>
                <span className="text-[11px] text-slate-400">Frequency distribution of errors</span>
              </div>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={diagnostics.normality.residualHistogram} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="binStart" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center space-x-2 font-semibold text-white">
              {diagnostics.normality.isApproximatelyNormal ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
              <span>Normality Diagnostic Verdict</span>
            </div>
            <p className="leading-relaxed text-slate-300">{diagnostics.normality.interpretation}</p>
            <p className="text-[11px] font-mono text-slate-400">
              Skewness = {diagnostics.normality.skewness} • Excess Kurtosis = {diagnostics.normality.kurtosis}
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Homoscedasticity (Breusch-Pagan) */}
      {activeTab === 'homoscedasticity' && diagnostics && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Breusch-Pagan Test for Constant Variance</h3>
              <p className="text-xs text-slate-400">Testing H₀: Residual variance is constant (homoscedasticity)</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
              diagnostics.breuschPagan.homoscedastic
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                : 'bg-amber-950/80 text-amber-300 border-amber-700'
            }`}>
              {diagnostics.breuschPagan.homoscedastic ? 'Homoscedastic (Passed)' : 'Heteroscedasticity Warning'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center font-mono">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 block">LM Statistic</span>
              <span className="text-lg font-bold text-white">{diagnostics.breuschPagan.lmStatistic}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 block">p-Value</span>
              <span className={`text-lg font-bold ${diagnostics.breuschPagan.homoscedastic ? 'text-emerald-400' : 'text-amber-400'}`}>
                {diagnostics.breuschPagan.pValue < 0.001 ? '< 0.001' : diagnostics.breuschPagan.pValue}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 block">Decision (α = 0.05)</span>
              <span className="text-xs font-semibold text-slate-300 block mt-1">
                {diagnostics.breuschPagan.homoscedastic ? 'Fail to reject H₀' : 'Reject H₀'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
            <span className="font-semibold text-white block">Interpretation:</span>
            <p className="leading-relaxed">{diagnostics.breuschPagan.interpretation}</p>
          </div>
        </div>
      )}

      {/* Tab 4: Multicollinearity (VIF) */}
      {activeTab === 'multicollinearity' && diagnostics && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Variance Inflation Factor (VIF) Analysis</h3>
              <p className="text-xs text-slate-400">Rule of thumb: VIF &lt; 5 is low concern; VIF &gt; 10 indicates severe multicollinearity</p>
            </div>
            <span className="text-xs font-mono text-slate-300 bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
              Max VIF = {diagnostics.multicollinearity.maxVif}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-3">Predictor</th>
                  <th className="py-3 px-3 text-right">VIF</th>
                  <th className="py-3 px-3 text-right">Tolerance (1/VIF)</th>
                  <th className="py-3 px-3">Concern Level</th>
                  <th className="py-3 px-3">Actionable Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {diagnostics.multicollinearity.vifList.map(item => (
                  <tr key={item.variable} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-semibold text-white">{item.variable}</td>
                    <td className="py-3 px-3 text-right font-bold text-blue-300">{item.vif}</td>
                    <td className="py-3 px-3 text-right text-slate-400">{item.tolerance}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        item.concernLevel === 'Low concern'
                          ? 'bg-emerald-950/80 text-emerald-300'
                          : item.concernLevel === 'Moderate concern'
                          ? 'bg-amber-950/80 text-amber-300'
                          : 'bg-red-950/80 text-red-300'
                      }`}>
                        {item.concernLevel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{item.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
            {diagnostics.multicollinearity.summary}
          </div>
        </div>
      )}

      {/* Tab 5: Autocorrelation (Durbin-Watson) */}
      {activeTab === 'autocorrelation' && diagnostics && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Durbin-Watson Autocorrelation Test</h3>
              <p className="text-xs text-slate-400">Tests for first-order autocorrelation in residuals (d ≈ 2.0 indicates uncorrelated errors)</p>
            </div>
            <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-700">
              {diagnostics.durbinWatson.verdict}
            </span>
          </div>

          <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center max-w-sm mx-auto space-y-2 font-mono">
            <span className="text-xs uppercase text-slate-400">Durbin-Watson Statistic (d)</span>
            <div className="text-3xl font-bold text-blue-400">{diagnostics.durbinWatson.statistic}</div>
            <span className="text-[11px] text-slate-500 block">Baseline range: 1.5 to 2.5 is typical</span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
            {diagnostics.durbinWatson.interpretation}
          </div>
        </div>
      )}
    </div>
  );
};
