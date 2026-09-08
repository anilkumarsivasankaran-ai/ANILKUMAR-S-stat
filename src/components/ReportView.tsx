import React, { useState } from 'react';
import {
  FileCheck2,
  Printer,
  Download,
  Share2,
  CheckCircle2,
  AlertCircle,
  Database,
  TrendingUp,
  FlaskConical,
  Award
} from 'lucide-react';
import { Dataset, RegressionModelOutput, HypothesisTestResult } from '../types';

interface ReportViewProps {
  dataset: Dataset | null;
  activeModel: RegressionModelOutput | null;
  tests: HypothesisTestResult[];
}

export const ReportView: React.FC<ReportViewProps> = ({
  dataset,
  activeModel,
  tests
}) => {
  const [reportTitle, setReportTitle] = useState('Statistical Analytics & Econometric Modeling Report');
  const [analystName, setAnalystName] = useState('Senior Quantitative Analyst');

  if (!dataset) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <Database className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">No Dataset Loaded</h3>
        <p className="text-xs text-slate-400 mt-1">Please upload or load a sample dataset first to compile an analytical report.</p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHtml = () => {
    const reportElem = document.getElementById('printable-report-area');
    if (!reportElem) return;

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${reportTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; line-height: 1.6; max-width: 900px; margin: 40px auto; padding: 0 20px; }
    h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
    h2 { color: #1e3a8a; margin-top: 32px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-family: monospace; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background: #f1f5f9; }
    .metric-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; margin: 8px 0; }
    .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 6px; }
    .code { font-family: monospace; background: #f1f5f9; padding: 8px; border-radius: 4px; }
  </style>
</head>
<body>
  ${reportElem.innerHTML}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytical_report_${dataset.name.replace(/\.[^/.]+$/, '')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Action bar (Hidden when printing) */}
      <div className="print:hidden bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileCheck2 className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-white">Analytical Report Generator</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete 12-section technical summary ready for executive briefing, academic submission, or PDF printing.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadHtml}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export HTML</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div
        id="printable-report-area"
        className="bg-slate-900 text-slate-200 border border-slate-800 rounded-xl p-8 sm:p-12 space-y-8 shadow-sm print:bg-white print:text-black print:border-0 print:p-0"
      >
        {/* Document Header */}
        <div className="border-b border-slate-800 print:border-slate-300 pb-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] uppercase font-mono tracking-wider text-blue-400 font-semibold">
                Publication-Ready Statistical Report
              </span>
              <h1 className="text-2xl font-extrabold text-white print:text-black mt-1">{reportTitle}</h1>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                Dataset: <strong>{dataset.name}</strong> • Sample Size: <strong>N = {dataset.rowCount.toLocaleString()}</strong>
              </p>
            </div>
            <div className="text-right text-xs text-slate-400 print:text-slate-600 font-mono">
              <div>Date: {new Date().toLocaleDateString()}</div>
              <div>Analyst: {analystName}</div>
              <div className="text-emerald-400 print:text-emerald-700 font-semibold">Statistical Studio v2.0</div>
            </div>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-white print:text-black uppercase tracking-wider border-b border-slate-800 print:border-slate-200 pb-1">
            1. Executive Summary
          </h2>
          <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed">
            This study evaluated multivariate empirical relationships in <strong>{dataset.name}</strong> containing {dataset.rowCount.toLocaleString()} observations across {dataset.columnCount} features.
            {activeModel ? (
              <> The primary regression model accounted for <strong>{(activeModel.rSquared * 100).toFixed(1)}% of total variance</strong> in <em>{activeModel.targetVariable}</em> (F({activeModel.dfModel}, {activeModel.dfResidual}) = {activeModel.fStatistic}, p {activeModel.fPValue < 0.001 ? '< 0.001' : `= ${activeModel.fPValue}`}). Statistically significant predictors included {activeModel.coefficients.filter(c => c.significant && c.variable !== '(Intercept)').map(c => c.variable).join(', ') || 'none'}.</>
            ) : (
              ' Exploratory data analysis and descriptive distributions have been characterized across all continuous and discrete attributes.'
            )}
          </p>
        </div>

        {/* Section 2: Dataset Overview & Quality */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white print:text-black uppercase tracking-wider border-b border-slate-800 print:border-slate-200 pb-1">
            2. Dataset Architecture & Health Audit
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-200">
              <span className="text-slate-400 block text-[10px]">Total Observations</span>
              <span className="text-base font-bold text-white print:text-black">{dataset.rowCount.toLocaleString()}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-200">
              <span className="text-slate-400 block text-[10px]">Numerical Features</span>
              <span className="text-base font-bold text-blue-400 print:text-blue-700">{dataset.numericalColumns.length}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-200">
              <span className="text-slate-400 block text-[10px]">Categorical Features</span>
              <span className="text-base font-bold text-purple-400 print:text-purple-700">{dataset.categoricalColumns.length}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-200">
              <span className="text-slate-400 block text-[10px]">Missing Cells</span>
              <span className="text-base font-bold text-slate-300 print:text-slate-700">{dataset.missingValuesTotal} (0%)</span>
            </div>
          </div>
        </div>

        {/* Section 3: Regression Model & Equation */}
        {activeModel && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-white print:text-black uppercase tracking-wider border-b border-slate-800 print:border-slate-200 pb-1">
              3. Regression Model Specification
            </h2>
            <div className="p-3.5 rounded-lg bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-200 font-mono text-xs font-semibold text-blue-300 print:text-blue-800">
              {activeModel.equation}
            </div>

            {/* Model Evaluation Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-200">
                <span className="text-[10px] text-slate-400 block">R² / Adj R²</span>
                <span className="font-bold text-white print:text-black">
                  {(activeModel.rSquared * 100).toFixed(1)}% / {(activeModel.adjRSquared * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-200">
                <span className="text-[10px] text-slate-400 block">RMSE / MAE</span>
                <span className="font-bold text-white print:text-black">{activeModel.rmse} / {activeModel.mae}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-200">
                <span className="text-[10px] text-slate-400 block">Overall F-Stat</span>
                <span className="font-bold text-white print:text-black">{activeModel.fStatistic} (p {activeModel.fPValue < 0.001 ? '< 0.001' : `= ${activeModel.fPValue}`})</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-200">
                <span className="text-[10px] text-slate-400 block">AIC / BIC</span>
                <span className="font-bold text-white print:text-black">{activeModel.aic} / {activeModel.bic}</span>
              </div>
            </div>

            {/* Coefficients table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs font-mono border border-slate-800 print:border-slate-300">
                <thead className="bg-slate-950 print:bg-slate-100 border-b border-slate-800 print:border-slate-300 text-[10px] uppercase">
                  <tr>
                    <th className="py-2 px-3">Predictor</th>
                    <th className="py-2 px-3 text-right">Coefficient (β)</th>
                    <th className="py-2 px-3 text-right">Std Error</th>
                    <th className="py-2 px-3 text-right">t-Stat</th>
                    <th className="py-2 px-3 text-right">p-Value</th>
                    <th className="py-2 px-3 text-center">95% CI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                  {activeModel.coefficients.map(c => (
                    <tr key={c.variable}>
                      <td className="py-2 px-3 font-semibold">{c.variable}</td>
                      <td className="py-2 px-3 text-right font-bold text-blue-300 print:text-blue-800">{c.coefficient}</td>
                      <td className="py-2 px-3 text-right text-slate-400 print:text-slate-600">{c.stdError}</td>
                      <td className="py-2 px-3 text-right">{c.tStatistic}</td>
                      <td className="py-2 px-3 text-right font-semibold">
                        {c.pValue < 0.001 ? '< 0.001' : c.pValue}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-400 print:text-slate-600">[{c.ciLower}, {c.ciUpper}]</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 4: Hypothesis Testing History */}
        {tests.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-white print:text-black uppercase tracking-wider border-b border-slate-800 print:border-slate-200 pb-1">
              4. Formal Hypothesis Testing Ledger
            </h2>
            <div className="space-y-2">
              {tests.map((t, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between items-center font-mono">
                    <strong className="text-white print:text-black">{t.testName}</strong>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.decision === 'Reject H₀' ? 'text-emerald-400 print:text-emerald-700' : 'text-slate-400'
                    }`}>
                      Decision: {t.decision} (p = {t.pValue})
                    </span>
                  </div>
                  <p className="text-slate-300 print:text-slate-700 leading-relaxed">{t.interpretation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 5: Strategic Caveats & Recommendations */}
        <div className="space-y-2 pt-2">
          <h2 className="text-sm font-bold text-white print:text-black uppercase tracking-wider border-b border-slate-800 print:border-slate-200 pb-1">
            5. Methodological Caveats & Actionable Recommendations
          </h2>
          <div className="p-4 rounded-lg bg-slate-950 print:bg-slate-50 border border-slate-800 print:border-slate-200 text-xs text-slate-300 print:text-slate-700 space-y-2">
            <p>
              <strong>1. Association vs. Causality:</strong> The observed regression relationships describe empirical associations in this observational dataset. Unobserved confounding factors and reverse causality cannot be ruled out without randomized controlled experiments.
            </p>
            <p>
              <strong>2. External Validity:</strong> Model predictions and interval estimates are calibrated specifically to the covariate ranges observed in this sample. Extrapolation significantly beyond observed ranges risks structural instability.
            </p>
            <p>
              <strong>3. Resource Allocation:</strong> Management should prioritize budget allocations to predictors demonstrating both high statistical significance (p &lt; 0.05) and substantial practical economic effect sizes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
