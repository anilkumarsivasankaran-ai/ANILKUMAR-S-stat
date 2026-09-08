import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  RefreshCw,
  Database
} from 'lucide-react';
import { Dataset, CorrelationResult, CorrelationMatrix } from '../types';

interface CorrelationViewProps {
  dataset: Dataset | null;
}

export const CorrelationView: React.FC<CorrelationViewProps> = ({ dataset }) => {
  const [var1, setVar1] = useState<string>('');
  const [var2, setVar2] = useState<string>('');
  const [method, setMethod] = useState<'pearson' | 'spearman' | 'kendall'>('pearson');
  const [pairwiseResult, setPairwiseResult] = useState<CorrelationResult | null>(null);
  const [matrixResult, setMatrixResult] = useState<CorrelationMatrix | null>(null);
  const [loadingPair, setLoadingPair] = useState(false);
  const [loadingMatrix, setLoadingMatrix] = useState(false);

  useEffect(() => {
    if (!dataset || dataset.numericalColumns.length < 2) return;
    const v1 = dataset.numericalColumns[0];
    const v2 = dataset.numericalColumns[1];
    setVar1(v1);
    setVar2(v2);
    computePairwise(v1, v2, method);
    computeMatrix();
  }, [dataset?.id]);

  const computePairwise = async (x: string, y: string, m: string) => {
    if (!dataset || !x || !y) return;
    setLoadingPair(true);
    try {
      const res = await fetch('/api/eda/correlation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId: dataset.id, x, y, method: m })
      });
      const data = await res.json();
      if (data.success) {
        setPairwiseResult(data.result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPair(false);
    }
  };

  const computeMatrix = async () => {
    if (!dataset || dataset.numericalColumns.length < 2) return;
    setLoadingMatrix(true);
    try {
      const res = await fetch('/api/eda/correlation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId: dataset.id })
      });
      const data = await res.json();
      if (data.success) {
        setMatrixResult(data.matrix);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMatrix(false);
    }
  };

  const getHeatmapColor = (r: number) => {
    if (isNaN(r)) return 'bg-slate-900';
    if (r === 1) return 'bg-blue-600 text-white font-bold';
    if (r > 0.6) return 'bg-blue-600/70 text-white';
    if (r > 0.3) return 'bg-blue-500/40 text-blue-200';
    if (r > 0) return 'bg-blue-500/20 text-slate-300';
    if (r === 0) return 'bg-slate-950 text-slate-400';
    if (r > -0.3) return 'bg-rose-500/20 text-slate-300';
    if (r > -0.6) return 'bg-rose-500/40 text-rose-200';
    return 'bg-rose-600/70 text-white';
  };

  if (!dataset) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <Database className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">No Dataset Loaded</h3>
        <p className="text-xs text-slate-400 mt-1">Please upload or load a sample dataset first.</p>
      </div>
    );
  }

  if (dataset.numericalColumns.length < 2) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
        Correlation analysis requires at least two numerical columns.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <GitCompare className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-bold text-white">Correlation Analysis Engine</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Compute Pearson (linear), Spearman (monotonic rank), and Kendall’s Tau coefficients with two-tailed p-values.
          </p>
        </div>

        {/* Association vs Causation Warning Banner */}
        <div className="bg-amber-950/40 border border-amber-800/60 px-3 py-2 rounded-lg flex items-center space-x-2 text-[11px] text-amber-300 max-w-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>Association ≠ Causation. Correlations measure mathematical co-movement, not direct causal effect.</span>
        </div>
      </div>

      {/* Pairwise Calculator Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Bivariate Correlation Test</h2>
          {/* Method selector */}
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {(['pearson', 'spearman', 'kendall'] as const).map(m => (
              <button
                key={m}
                onClick={() => {
                  setMethod(m);
                  computePairwise(var1, var2, m);
                }}
                className={`px-3 py-1 rounded capitalize transition ${
                  method === m ? 'bg-blue-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Variable Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Variable 1 (X)</label>
            <select
              value={var1}
              onChange={e => {
                setVar1(e.target.value);
                computePairwise(e.target.value, var2, method);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
            >
              {dataset.numericalColumns.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Variable 2 (Y)</label>
            <select
              value={var2}
              onChange={e => {
                setVar2(e.target.value);
                computePairwise(var1, e.target.value, method);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
            >
              {dataset.numericalColumns.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Pairwise Metric Results */}
        {pairwiseResult && (
          <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Correlation (r)</span>
                <span className="text-xl font-bold font-mono text-blue-400">{pairwiseResult.r}</span>
                <span className="text-[10px] text-slate-500 block capitalize">{pairwiseResult.strength}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Two-Tailed p-Value</span>
                <span className={`text-xl font-bold font-mono ${pairwiseResult.significant ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {pairwiseResult.pValue < 0.001 ? '< 0.001' : pairwiseResult.pValue}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {pairwiseResult.significant ? 'Significant (p < 0.05)' : 'Not Significant'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Sample Size (n)</span>
                <span className="text-xl font-bold font-mono text-white">{pairwiseResult.n.toLocaleString()}</span>
                <span className="text-[10px] text-slate-500 block">Complete pairs</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">t-Statistic</span>
                <span className="text-xl font-bold font-mono text-slate-300">{pairwiseResult.tStat}</span>
                <span className="text-[10px] text-slate-500 block">df = {pairwiseResult.n - 2}</span>
              </div>
            </div>

            {/* Plain-English Interpretation */}
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-300 space-y-1">
              <span className="font-semibold text-white block">Plain-English Interpretation:</span>
              <p className="leading-relaxed text-slate-300">{pairwiseResult.interpretation}</p>
            </div>
          </div>
        )}
      </div>

      {/* Correlation Matrix Heatmap */}
      {matrixResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Full Correlation Matrix Heatmap</h2>
              <p className="text-xs text-slate-400">Click any cell to load pairwise testing above</p>
            </div>
            <button
              onClick={computeMatrix}
              disabled={loadingMatrix}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingMatrix ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs font-mono">
              <thead>
                <tr>
                  <th className="py-2.5 px-3 text-left font-semibold text-slate-400 bg-slate-950">Feature</th>
                  {matrixResult.variables.map(v => (
                    <th key={v} className="py-2.5 px-3 font-semibold text-slate-300 bg-slate-950 whitespace-nowrap">
                      {v}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {matrixResult.variables.map(rowVar => (
                  <tr key={rowVar}>
                    <td className="py-2 px-3 text-left font-semibold text-slate-200 whitespace-nowrap bg-slate-950/60">
                      {rowVar}
                    </td>
                    {matrixResult.variables.map(colVar => {
                      const item = matrixResult.matrix[rowVar]?.[colVar];
                      const r = item ? item.r : (rowVar === colVar ? 1 : 0);
                      const p = item ? item.pValue : 0;
                      return (
                        <td
                          key={colVar}
                          onClick={() => {
                            setVar1(rowVar);
                            setVar2(colVar);
                            computePairwise(rowVar, colVar, method);
                          }}
                          className={`py-2 px-3 cursor-pointer transition hover:opacity-80 ${getHeatmapColor(r)}`}
                          title={`${rowVar} vs ${colVar}: r = ${r}, p = ${p}`}
                        >
                          <div className="text-[11px]">{r.toFixed(2)}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
