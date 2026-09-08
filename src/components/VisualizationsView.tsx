import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  Layers,
  Database,
  Sliders
} from 'lucide-react';
import { Dataset } from '../types';

interface VisualizationsViewProps {
  dataset: Dataset | null;
}

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#6366f1'];

export const VisualizationsView: React.FC<VisualizationsViewProps> = ({ dataset }) => {
  const [chartType, setChartType] = useState<'scatter' | 'histogram' | 'bar' | 'pie'>('scatter');

  // Selectors
  const [xVar, setXVar] = useState<string>('');
  const [yVar, setYVar] = useState<string>('');
  const [catVar, setCatVar] = useState<string>('');
  const [numBins, setNumBins] = useState<number>(15);

  // Initialize variables when dataset loads
  React.useEffect(() => {
    if (dataset && dataset.numericalColumns.length > 0) {
      if (!xVar || !dataset.numericalColumns.includes(xVar)) {
        setXVar(dataset.numericalColumns[0]);
      }
      if (!yVar || !dataset.numericalColumns.includes(yVar)) {
        setYVar(dataset.numericalColumns[1] || dataset.numericalColumns[0]);
      }
    }
    if (dataset && dataset.categoricalColumns.length > 0) {
      if (!catVar || !dataset.categoricalColumns.includes(catVar)) {
        setCatVar(dataset.categoricalColumns[0]);
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

  // 1. Scatter Plot Data & Trendline
  const scatterData = useMemo(() => {
    if (!xVar || !yVar || !dataset.rows) return [];
    const points: { x: number; y: number }[] = [];
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    const sample = dataset.rows.slice(0, 400); // sample for performant render

    for (const r of sample) {
      const x = Number(r[xVar]);
      const y = Number(r[yVar]);
      if (!isNaN(x) && !isNaN(y)) {
        points.push({ x, y });
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
      }
    }

    const n = points.length;
    const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) : 0;
    const intercept = n > 0 ? (sumY - slope * sumX) / n : 0;

    return {
      points,
      slope,
      intercept,
      minX: Math.min(...points.map(p => p.x)),
      maxX: Math.max(...points.map(p => p.x))
    };
  }, [dataset.rows, xVar, yVar]);

  // 2. Histogram Data
  const histogramData = useMemo(() => {
    if (!xVar || !dataset.rows) return [];
    const vals = dataset.rows.map(r => Number(r[xVar])).filter(v => !isNaN(v));
    if (vals.length === 0) return [];

    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const width = (max - min) / numBins || 1;

    const bins: { bin: string; count: number; xMid: number }[] = [];
    for (let i = 0; i < numBins; i++) {
      const bStart = min + i * width;
      const bEnd = bStart + width;
      bins.push({
        bin: `${bStart.toFixed(1)} - ${bEnd.toFixed(1)}`,
        xMid: Number(((bStart + bEnd) / 2).toFixed(1)),
        count: 0
      });
    }

    for (const v of vals) {
      let idx = Math.floor((v - min) / width);
      if (idx >= numBins) idx = numBins - 1;
      if (idx >= 0) bins[idx].count++;
    }

    return bins;
  }, [dataset.rows, xVar, numBins]);

  // 3. Categorical Bar / Pie Data
  const categoricalData = useMemo(() => {
    if (!catVar || !dataset.rows) return [];
    const counts: Record<string, number> = {};
    for (const r of dataset.rows) {
      const val = String(r[catVar] ?? 'Unknown');
      counts[val] = (counts[val] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [dataset.rows, catVar]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-bold text-white">Statistical Data Visualizations</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Bivariate scatter plots with OLS trendline, continuous frequency histograms, and discrete distributions.
          </p>
        </div>

        {/* Chart type pills */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {(['scatter', 'histogram', 'bar', 'pie'] as const).map(t => (
            <button
              key={t}
              onClick={() => setChartType(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition ${
                chartType === t ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Variable Controls Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-4 text-xs">
        {chartType === 'scatter' && (
          <>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-medium">X-Axis Predictor:</span>
              <select
                value={xVar}
                onChange={e => setXVar(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200"
              >
                {dataset.numericalColumns.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-medium">Y-Axis Target:</span>
              <select
                value={yVar}
                onChange={e => setYVar(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200"
              >
                {dataset.numericalColumns.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {scatterData.points && (
              <span className="text-slate-400 font-mono text-[11px] ml-auto">
                Trendline: Y = {scatterData.intercept.toFixed(2)} + {scatterData.slope.toFixed(2)} × X
              </span>
            )}
          </>
        )}

        {chartType === 'histogram' && (
          <>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-medium">Distribution Variable:</span>
              <select
                value={xVar}
                onChange={e => setXVar(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200"
              >
                {dataset.numericalColumns.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-medium">Bins:</span>
              <select
                value={numBins}
                onChange={e => setNumBins(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200"
              >
                <option value={10}>10 Bins</option>
                <option value={15}>15 Bins</option>
                <option value={20}>20 Bins</option>
                <option value={30}>30 Bins</option>
              </select>
            </div>
          </>
        )}

        {(chartType === 'bar' || chartType === 'pie') && (
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-medium">Categorical Variable:</span>
            <select
              value={catVar}
              onChange={e => setCatVar(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200"
            >
              {dataset.categoricalColumns.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Chart Canvas Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 min-h-[440px] flex flex-col justify-center">
        {chartType === 'scatter' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-white font-mono">
                Scatter Plot: {yVar} vs {xVar}
              </h3>
              <span className="text-[11px] text-slate-400">400 random sample points rendered</span>
            </div>
            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis type="number" dataKey="x" name={xVar} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis type="number" dataKey="y" name={yVar} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                  <Scatter name="Data Points" data={scatterData.points} fill="#3b82f6" fillOpacity={0.65} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {chartType === 'histogram' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-white font-mono">
                Frequency Histogram: {xVar}
              </h3>
              <span className="text-[11px] text-slate-400">{numBins} discrete continuous intervals</span>
            </div>
            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData} margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="bin" stroke="#94a3b8" angle={-35} textAnchor="end" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                  <Bar dataKey="count" name="Frequency" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {chartType === 'bar' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-white font-mono">
                Category Counts: {catVar}
              </h3>
            </div>
            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoricalData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                  <Bar dataKey="value" name="Observation Count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {chartType === 'pie' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-white font-mono">
                Proportion Composition: {catVar}
              </h3>
            </div>
            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoricalData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {categoricalData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
