import React from 'react';
import {
  FolderKanban,
  FileText,
  TrendingUp,
  FlaskConical,
  Wand2,
  Calendar,
  CheckCircle2,
  Database
} from 'lucide-react';
import { Dataset, RegressionModelOutput, HypothesisTestResult, NavigationTab } from '../types';

interface ProjectsHistoryViewProps {
  dataset: Dataset | null;
  models: RegressionModelOutput[];
  tests: HypothesisTestResult[];
  setActiveTab: (tab: NavigationTab) => void;
  setActiveModel: (m: RegressionModelOutput) => void;
}

export const ProjectsHistoryView: React.FC<ProjectsHistoryViewProps> = ({
  dataset,
  models,
  tests,
  setActiveTab,
  setActiveModel
}) => {
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center space-x-2">
          <FolderKanban className="w-5 h-5 text-indigo-400" />
          <h1 className="text-xl font-bold text-white">Project Workspaces & Audit History</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Chronological audit trail of all data transformations, statistical tests, and econometric models evaluated in this session.
        </p>
      </div>

      {/* Grid of Histories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fitted Models Ledger */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Fitted Regression Models ({models.length})</h2>
            </div>
            <button
              onClick={() => setActiveTab('regression')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              + New Model
            </button>
          </div>

          {models.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No regression models fitted yet in this session.</p>
          ) : (
            <div className="space-y-2.5">
              {models.map(m => (
                <div
                  key={m.modelId}
                  onClick={() => {
                    setActiveModel(m);
                    setActiveTab('regression');
                  }}
                  className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition space-y-1"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-white font-mono">{m.name}</span>
                    <span className="text-[10px] font-mono text-blue-400 font-semibold">
                      R² = {(m.rSquared * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 truncate">{m.equation}</p>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-1">
                    <span>Target: {m.targetVariable}</span>
                    <span>RMSE: {m.rmse} • N={m.sampleSize}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hypothesis Tests Ledger */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FlaskConical className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-semibold text-white">Hypothesis Tests Ledger ({tests.length})</h2>
            </div>
            <button
              onClick={() => setActiveTab('hypothesis')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium"
            >
              + Run Test
            </button>
          </div>

          {tests.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No formal hypothesis tests conducted yet.</p>
          ) : (
            <div className="space-y-2.5">
              {tests.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-white">{t.testName}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      t.decision === 'Reject H₀'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {t.decision}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{t.interpretation}</p>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1">
                    <span>{t.statisticName} = {t.statisticValue}</span>
                    <span>p = {t.pValue < 0.001 ? '< 0.001' : t.pValue}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
