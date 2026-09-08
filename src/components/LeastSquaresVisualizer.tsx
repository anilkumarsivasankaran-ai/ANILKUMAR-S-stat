import React, { useState, useMemo } from 'react';
import {
  Target,
  RefreshCw,
  Sparkles,
  Sliders,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

interface Point {
  x: number;
  y: number;
  id: number;
}

export const LeastSquaresVisualizer: React.FC = () => {
  // Default sample points
  const initialPoints: Point[] = [
    { id: 1, x: 10, y: 18 },
    { id: 2, x: 20, y: 25 },
    { id: 3, x: 30, y: 38 },
    { id: 4, x: 40, y: 42 },
    { id: 5, x: 50, y: 56 },
    { id: 6, x: 60, y: 64 },
    { id: 7, x: 70, y: 69 },
    { id: 8, x: 80, y: 84 },
    { id: 9, x: 90, y: 92 },
  ];

  const [points, setPoints] = useState<Point[]>(initialPoints);

  // Compute true OLS slope & intercept
  const ols = useMemo(() => {
    const n = points.length;
    if (n < 2) return { slope: 1, intercept: 0 };
    const meanX = points.reduce((acc, p) => acc + p.x, 0) / n;
    const meanY = points.reduce((acc, p) => acc + p.y, 0) / n;

    let num = 0;
    let den = 0;
    for (const p of points) {
      num += (p.x - meanX) * (p.y - meanY);
      den += Math.pow(p.x - meanX, 2);
    }
    const slope = den > 0 ? num / den : 1;
    const intercept = meanY - slope * meanX;

    let rss = 0;
    for (const p of points) {
      const yHat = intercept + slope * p.x;
      rss += Math.pow(p.y - yHat, 2);
    }

    return {
      slope: Number(slope.toFixed(2)),
      intercept: Number(intercept.toFixed(2)),
      rss: Math.round(rss)
    };
  }, [points]);

  // User interactive slope and intercept
  const [manualSlope, setManualSlope] = useState<number>(ols.slope);
  const [manualIntercept, setManualIntercept] = useState<number>(ols.intercept);

  // Calculate current user RSS
  const currentRss = useMemo(() => {
    let sum = 0;
    for (const p of points) {
      const yHat = manualIntercept + manualSlope * p.x;
      sum += Math.pow(p.y - yHat, 2);
    }
    return Math.round(sum);
  }, [points, manualSlope, manualIntercept]);

  const setOptimal = () => {
    setManualSlope(ols.slope);
    setManualIntercept(ols.intercept);
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert SVG coords (padding 40, width 500, height 400) to data coords (0-100)
    const padding = 40;
    const chartW = 520 - padding * 2;
    const chartH = 400 - padding * 2;

    const dataX = Math.round(((clickX - padding) / chartW) * 100);
    const dataY = Math.round((1 - (clickY - padding) / chartH) * 100);

    if (dataX >= 5 && dataX <= 95 && dataY >= 5 && dataY <= 95) {
      setPoints([...points, { id: Date.now(), x: dataX, y: dataY }]);
    }
  };

  // Coordinates mapping
  const padding = 40;
  const width = 520;
  const height = 400;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  const toSvgX = (x: number) => padding + (x / 100) * chartW;
  const toSvgY = (y: number) => height - padding - (y / 100) * chartH;

  const lineY0 = manualIntercept + manualSlope * 0;
  const lineY100 = manualIntercept + manualSlope * 100;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-white">Interactive Least-Squares Geometric Simulator</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Observe how Ordinary Least Squares (OLS) minimizes the sum of squared residuals: RSS = Σ(yᵢ - ŷᵢ)². Drag sliders or click on the plot to add data points.
          </p>
        </div>

        <button
          onClick={() => {
            setPoints(initialPoints);
            setManualSlope(0.92);
            setManualIntercept(8.5);
          }}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center space-x-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Points</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider">Parameters Control</h2>

            {/* Slope Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Slope (β₁):</span>
                <span className="text-blue-400 font-bold">{manualSlope.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-1.5"
                max="2.5"
                step="0.02"
                value={manualSlope}
                onChange={e => setManualSlope(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-1.50</span>
                <span>Optimal: {ols.slope}</span>
                <span>+2.50</span>
              </div>
            </div>

            {/* Intercept Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">Intercept (β₀):</span>
                <span className="text-purple-400 font-bold">{manualIntercept.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-20"
                max="50"
                step="0.5"
                value={manualIntercept}
                onChange={e => setManualIntercept(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-20.0</span>
                <span>Optimal: {ols.intercept}</span>
                <span>+50.0</span>
              </div>
            </div>

            {/* Current RSS metric */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-semibold text-slate-300">Sum of Squared Errors (RSS):</span>
                <span className={`text-xl font-bold font-mono ${currentRss === ols.rss ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {currentRss.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/80">
                <span>Optimal Minimum RSS:</span>
                <span className="text-emerald-300 font-bold">{ols.rss.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={setOptimal}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Snap to Closed-Form Optimal OLS Line</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
            <strong>Tip:</strong> The red squares visually reflect eᵢ² = (yᵢ - ŷᵢ)². Ordinary Least Squares mathematically computes the exact unique slope and intercept that minimizes the total area of all these squares.
          </div>
        </div>

        {/* Interactive SVG Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-3">
            <span className="text-xs font-mono font-semibold text-white">
              Ŷ = {manualIntercept.toFixed(2)} + {manualSlope.toFixed(2)} × X
            </span>
            <span className="text-[11px] text-slate-400">Click anywhere inside chart area to add points</span>
          </div>

          <div className="bg-slate-950 rounded-xl border border-slate-800 p-2 overflow-hidden shadow-inner">
            <svg
              width={width}
              height={height}
              onClick={handleSvgClick}
              className="cursor-crosshair select-none"
            >
              {/* Grid lines */}
              {[0, 20, 40, 60, 80, 100].map(v => (
                <React.Fragment key={v}>
                  <line
                    x1={toSvgX(v)}
                    y1={toSvgY(0)}
                    x2={toSvgX(v)}
                    y2={toSvgY(100)}
                    stroke="#1e293b"
                    strokeWidth="1"
                  />
                  <line
                    x1={toSvgX(0)}
                    y1={toSvgY(v)}
                    x2={toSvgX(100)}
                    y2={toSvgY(v)}
                    stroke="#1e293b"
                    strokeWidth="1"
                  />
                  {/* Axis labels */}
                  <text x={toSvgX(v)} y={height - 18} fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">
                    {v}
                  </text>
                  <text x={24} y={toSvgY(v) + 4} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">
                    {v}
                  </text>
                </React.Fragment>
              ))}

              {/* Residual squares & vertical lines */}
              {points.map(p => {
                const yHat = manualIntercept + manualSlope * p.x;
                const ptX = toSvgX(p.x);
                const ptY = toSvgY(p.y);
                const hatY = toSvgY(yHat);
                const diffPx = Math.abs(hatY - ptY);

                return (
                  <React.Fragment key={p.id}>
                    {/* Error square */}
                    <rect
                      x={ptX}
                      y={Math.min(ptY, hatY)}
                      width={Math.min(diffPx, 80)}
                      height={diffPx}
                      fill="#ef4444"
                      fillOpacity="0.15"
                      stroke="#ef4444"
                      strokeWidth="0.8"
                      strokeDasharray="2 2"
                    />
                    {/* Vertical residual error line */}
                    <line
                      x1={ptX}
                      y1={ptY}
                      x2={ptX}
                      y2={hatY}
                      stroke="#ef4444"
                      strokeWidth="1.5"
                    />
                  </React.Fragment>
                );
              })}

              {/* OLS Regression Line */}
              <line
                x1={toSvgX(0)}
                y1={toSvgY(lineY0)}
                x2={toSvgX(100)}
                y2={toSvgY(lineY100)}
                stroke="#3b82f6"
                strokeWidth="3"
              />

              {/* Data points */}
              {points.map(p => (
                <circle
                  key={p.id}
                  cx={toSvgX(p.x)}
                  cy={toSvgY(p.y)}
                  r="5.5"
                  fill="#60a5fa"
                  stroke="#1e3a8a"
                  strokeWidth="2"
                />
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
