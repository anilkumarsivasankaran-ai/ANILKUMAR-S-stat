import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Download,
  HelpCircle,
  BarChart2,
  RefreshCw,
  Database
} from 'lucide-react';
import { Dataset, NumericalStats, CategoricalStats } from '../types';

interface EDAViewProps {
  dataset: Dataset | null;
}

export const EDAView: React.FC<EDAViewProps> = ({ dataset }) => {
  const [numStats, setNumStats] = useState<NumericalStats[]>([]);
  const [catStats, setCatStats] = useState<CategoricalStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNumCol, setSelectedNumCol] = useState<string | null>(null);

  useEffect(() => {
    if (!dataset) return;
    fetchStats();
  }, [dataset?.id]);

  const fetchStats = async () => {
    if (!dataset) return;
    setLoading(true);
    try {
      const res = await fetch('/api/eda/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId: dataset.id })
      });
      const data = await res.json();
      if (data.success) {
        setNumStats(data.numericalStats);
        setCatStats(data.categoricalStats);
        if (data.numericalStats.length > 0 && !selectedNumCol) {
          setSelectedNumCol(data.numericalStats[0].column);
        }
      }
    } catch (err) {
      console.error('Failed to load EDA stats', err);
    } finally {
      setLoading(false);
    }
  };

  const exportStatsCSV = () => {
    if (numStats.length === 0) return;
    const headers = ['Variable', 'Count', 'Mean', 'Median', 'StdDev', 'Variance', 'Min', 'Max', 'Q1', 'Q3', 'IQR', 'Skewness', 'Kurtosis'];
    const rows = numStats.map(s => [
      s.column,
      s.count,
      s.mean,
      s.median,
      s.std,
      s.variance,
      s.min,
      s.max,
      s.q1,
      s.q3,
      s.iqr,
      s.skewness,
      s.kurtosis
    ].join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EDA_descriptive_stats_${dataset?.name.replace(/\.[^/.]+$/, '')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-bold text-white">Exploratory Data Analysis (EDA)</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Parametric and non-parametric summary statistics: central tendency, dispersion, quartiles, skewness, and kurtosis.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center space-x-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Recalculate</span>
          </button>
          <button
            onClick={exportStatsCSV}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center space-x-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Table CSV</span>
          </button>
        </div>
      </div>

      {/* Numerical Descriptive Statistics Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Numerical Features Summary Statistics</h2>
            <p className="text-xs text-slate-400">12 foundational moments and quartile metrics per continuous variable</p>
          </div>
          <span className="text-xs font-mono bg-slate-800 text-emerald-300 px-2 py-0.5 rounded border border-slate-700">
            {numStats.length} Numerical Variables
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-3">Variable</th>
                <th className="py-3 px-3 text-right">N</th>
                <th className="py-3 px-3 text-right text-blue-300">Mean</th>
                <th className="py-3 px-3 text-right">Median</th>
                <th className="py-3 px-3 text-right text-emerald-300">Std Dev</th>
                <th className="py-3 px-3 text-right">Variance</th>
                <th className="py-3 px-3 text-right">Min</th>
                <th className="py-3 px-3 text-right">Q1</th>
                <th className="py-3 px-3 text-right">Q3</th>
                <th className="py-3 px-3 text-right">Max</th>
                <th className="py-3 px-3 text-right">IQR</th>
                <th className="py-3 px-3 text-right">Skewness</th>
                <th className="py-3 px-3 text-right">Kurtosis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {numStats.map(s => {
                const skewBadge = Math.abs(s.skewness) < 0.5 ? 'Symmetric' : s.skewness > 0 ? '+ Skew' : '- Skew';
                return (
                  <tr key={s.column} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-semibold text-white whitespace-nowrap">{s.column}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">{s.count.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-blue-300">{s.mean.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right">{s.median.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-300">{s.std.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">{s.variance.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right">{s.min.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">{s.q1.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">{s.q3.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right">{s.max.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-slate-300">{s.iqr.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        Math.abs(s.skewness) < 0.5 ? 'text-slate-300 bg-slate-800' : 'text-amber-300 bg-amber-950/60'
                      }`}>
                        {s.skewness}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">{s.kurtosis}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Categorical Distribution Breakdown */}
      {catStats.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Categorical Features Distribution</h2>
              <p className="text-xs text-slate-400">Class cardinality, modal values, and category frequencies</p>
            </div>
            <span className="text-xs font-mono bg-slate-800 text-purple-300 px-2 py-0.5 rounded border border-slate-700">
              {catStats.length} Categorical Variables
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {catStats.map(c => (
              <div key={c.column} className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-xs font-mono">{c.column}</span>
                  <span className="text-[11px] text-slate-400">
                    {c.unique} distinct classes • {c.count.toLocaleString()} observations
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {c.frequencies.slice(0, 6).map(f => (
                    <div key={f.value} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span className="truncate max-w-[200px]">{f.value || '(Empty)'}</span>
                        <span className="font-mono text-slate-400">{f.count} ({f.percentage}%)</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${Math.min(100, f.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
