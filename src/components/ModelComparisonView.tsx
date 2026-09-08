import React from 'react';
import {
  GitCompare,
  TrendingUp,
  Award,
  ArrowRight,
  CheckCircle2,
  Trash2,
  Database
} from 'lucide-react';
import { RegressionModelOutput, NavigationTab } from '../types';

interface ModelComparisonViewProps {
  models: RegressionModelOutput[];
  activeModel: RegressionModelOutput | null;
  setActiveModel: (m: RegressionModelOutput) => void;
  setActiveTab: (tab: NavigationTab) => void;
  onDeleteModel: (modelId: string) => void;
}

export const ModelComparisonView: React.FC<ModelComparisonViewProps> = ({
  models,
  activeModel,
  setActiveModel,
  setActiveTab,
  onDeleteModel
}) => {
  if (models.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">No Regression Models to Compare</h3>
        <p className="text-xs text-slate-400 mt-1 mb-4">
          Fit two or more regression models with different predictor subsets to compare explanatory power and parsimony.
        </p>
        <button
          onClick={() => setActiveTab('regression')}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
        >
          Fit Your First Model
        </button>
      </div>
    );
  }

  // Find best model based on lowest AIC or highest Adjusted R²
  const bestModel = [...models].sort((a, b) => b.adjRSquared - a.adjRSquared)[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <GitCompare className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-bold text-white">Model Selection & Comparison Matrix</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Compare model performance metrics across candidate specifications to detect overfitting and identify the most parsimonious model.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('regression')}
          className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition"
        >
          <span>Fit Another Specification</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Best Model Highlight Card */}
      {bestModel && (
        <div className="bg-slate-900 border border-emerald-900/60 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex-shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-emerald-400 uppercase font-semibold">Recommended Champion Specification</span>
              <h3 className="text-base font-bold text-white mt-0.5">{bestModel.name}</h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Adjusted R² = {(bestModel.adjRSquared * 100).toFixed(1)}% • RMSE = {bestModel.rmse} • AIC = {bestModel.aic}
              </p>
            </div>
          </div>

          {activeModel?.modelId !== bestModel.modelId && (
            <button
              onClick={() => setActiveModel(bestModel)}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
            >
              Set as Active Model
            </button>
          )}
        </div>
      )}

      {/* Side-by-Side Comparison Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Model Name / Predictors</th>
                <th className="py-3 px-3 text-right">k</th>
                <th className="py-3 px-3 text-right text-blue-300">R²</th>
                <th className="py-3 px-3 text-right text-emerald-300">Adj R²</th>
                <th className="py-3 px-3 text-right">RMSE</th>
                <th className="py-3 px-3 text-right">MAE</th>
                <th className="py-3 px-3 text-right">F-Stat</th>
                <th className="py-3 px-3 text-right">AIC</th>
                <th className="py-3 px-3 text-right">BIC</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {models.map(m => {
                const isActive = activeModel?.modelId === m.modelId;
                const isBest = bestModel?.modelId === m.modelId;
                return (
                  <tr key={m.modelId} className={`hover:bg-slate-800/40 transition ${isActive ? 'bg-blue-950/20' : ''}`}>
                    <td className="py-3 px-4 font-semibold text-white">
                      <div className="flex items-center space-x-2">
                        {isBest && <Award className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                        <span className="truncate max-w-[240px]" title={m.name}>{m.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">{m.dfModel}</td>
                    <td className="py-3 px-3 text-right font-bold text-blue-300">{(m.rSquared * 100).toFixed(1)}%</td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-300">{(m.adjRSquared * 100).toFixed(1)}%</td>
                    <td className="py-3 px-3 text-right text-white">{m.rmse}</td>
                    <td className="py-3 px-3 text-right text-slate-400">{m.mae}</td>
                    <td className="py-3 px-3 text-right text-slate-400">{m.fStatistic}</td>
                    <td className="py-3 px-3 text-right text-slate-300">{m.aic}</td>
                    <td className="py-3 px-3 text-right text-slate-400">{m.bic}</td>
                    <td className="py-3 px-4 text-center">
                      {isActive ? (
                        <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-semibold">
                          Active
                        </span>
                      ) : (
                        <button
                          onClick={() => setActiveModel(m)}
                          className="text-[10px] text-slate-400 hover:text-white underline"
                        >
                          Select
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onDeleteModel(m.modelId)}
                        className="p-1 text-slate-500 hover:text-red-400 transition"
                        title="Remove model specification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
