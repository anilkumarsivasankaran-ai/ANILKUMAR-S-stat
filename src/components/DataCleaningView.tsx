import React, { useState } from 'react';
import {
  Wand2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Filter,
  Layers,
  Database
} from 'lucide-react';
import { Dataset } from '../types';

interface DataCleaningViewProps {
  dataset: Dataset | null;
  onDatasetUpdated: (dataset: Dataset) => void;
}

export const DataCleaningView: React.FC<DataCleaningViewProps> = ({
  dataset,
  onDatasetUpdated
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Impute state
  const [selectedImputeCol, setSelectedImputeCol] = useState<string>('');
  const [imputeMethod, setImputeMethod] = useState<'mean' | 'median' | 'mode'>('mean');

  // Outlier state
  const [selectedOutlierCol, setSelectedOutlierCol] = useState<string>('');
  const [outlierMethod, setOutlierMethod] = useState<'iqr' | 'zscore'>('iqr');

  // Column drop state
  const [selectedDropCol, setSelectedDropCol] = useState<string>('');

  if (!dataset) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <Database className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">No Dataset Loaded</h3>
        <p className="text-xs text-slate-400 mt-1">Please upload or load a sample dataset first.</p>
      </div>
    );
  }

  const applyCleaning = async (action: string, payload: any) => {
    setLoadingAction(action);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/datasets/${dataset.id}/clean`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Cleaning action failed');
      }
      onDatasetUpdated(data.dataset);
      setSuccessMessage(data.message);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const columnsWithMissing = dataset.columns.filter(c => c.missingCount > 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center space-x-2">
          <Wand2 className="w-5 h-5 text-blue-400" />
          <h1 className="text-xl font-bold text-white">Data Cleaning & Preparation</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Handle missing values, eliminate duplicate observations, and remediate statistical outliers to prepare datasets for regression and hypothesis testing.
        </p>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Dataset Health Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Missing Values</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className={`text-2xl font-bold font-mono ${dataset.missingValuesTotal > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {dataset.missingValuesTotal}
            </span>
            <span className="text-xs text-slate-400">
              ({((dataset.missingValuesTotal / (dataset.rowCount * dataset.columnCount || 1)) * 100).toFixed(2)}% of cells)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {columnsWithMissing.length > 0 ? `${columnsWithMissing.length} columns affected` : 'Dataset has no missing values'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Duplicate Rows</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className={`text-2xl font-bold font-mono ${dataset.duplicateRowsCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {dataset.duplicateRowsCount}
            </span>
            <span className="text-xs text-slate-400">duplicate records</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {dataset.duplicateRowsCount > 0 ? 'Can be safely purged' : 'Zero redundant observations'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Total Active Rows</span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-white">{dataset.rowCount.toLocaleString()}</span>
            <span className="text-xs text-slate-400">across {dataset.columnCount} features</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Sample ready for modeling</span>
        </div>
      </div>

      {/* Cleaning Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Module 1: Missing Value Imputation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-white text-sm">Statistical Imputation</h3>
          </div>
          <p className="text-xs text-slate-400">
            Replace missing cells in a column using its mean (for symmetric continuous), median (robust to skew), or mode (for discrete).
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Target Column</label>
              <select
                value={selectedImputeCol}
                onChange={e => setSelectedImputeCol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Select column to impute --</option>
                {dataset.columns.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.missingCount} missing • {c.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Imputation Strategy</label>
              <div className="grid grid-cols-3 gap-2">
                {(['mean', 'median', 'mode'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setImputeMethod(m)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-medium border capitalize transition ${
                      imputeMethod === m
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => applyCleaning('impute', { column: selectedImputeCol, method: imputeMethod })}
              disabled={!selectedImputeCol || loadingAction === 'impute'}
              className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-medium transition"
            >
              {loadingAction === 'impute' ? 'Imputing...' : `Impute with ${imputeMethod.toUpperCase()}`}
            </button>
          </div>
        </div>

        {/* Module 2: Outlier Trimming */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-white text-sm">Outlier Remediation</h3>
          </div>
          <p className="text-xs text-slate-400">
            Detect and remove extreme observations that inflate variance or disproportionately bias OLS regression slopes.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Numerical Column</label>
              <select
                value={selectedOutlierCol}
                onChange={e => setSelectedOutlierCol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Select numerical column --</option>
                {dataset.numericalColumns.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Detection Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOutlierMethod('iqr')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition ${
                    outlierMethod === 'iqr'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  IQR Method (1.5 × IQR)
                </button>
                <button
                  type="button"
                  onClick={() => setOutlierMethod('zscore')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition ${
                    outlierMethod === 'zscore'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  Z-Score (|z| &gt; 3.0)
                </button>
              </div>
            </div>

            <button
              onClick={() => applyCleaning('remove_outliers', { column: selectedOutlierCol, method: outlierMethod })}
              disabled={!selectedOutlierCol || loadingAction === 'remove_outliers'}
              className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-medium transition"
            >
              {loadingAction === 'remove_outliers' ? 'Purging Outliers...' : 'Purge Detected Outliers'}
            </button>
          </div>
        </div>

        {/* Module 3: Batch Missing Rows & Duplicates Removal */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Trash2 className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-white text-sm">Row Cleanup Operations</h3>
          </div>
          <p className="text-xs text-slate-400">
            Drop incomplete records or deduplicate observations to establish an uncompromised sample.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <span className="font-medium text-white text-xs block">Drop Incomplete Rows</span>
                <span className="text-[11px] text-slate-400">Remove any row with at least 1 missing cell</span>
              </div>
              <button
                onClick={() => applyCleaning('remove_missing_rows', {})}
                disabled={dataset.missingValuesTotal === 0 || loadingAction === 'remove_missing_rows'}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-amber-300 border border-slate-700 text-xs font-medium transition"
              >
                Drop Rows
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <span className="font-medium text-white text-xs block">Deduplicate Dataset</span>
                <span className="text-[11px] text-slate-400">Purge identical duplicate rows ({dataset.duplicateRowsCount} found)</span>
              </div>
              <button
                onClick={() => applyCleaning('remove_duplicates', {})}
                disabled={dataset.duplicateRowsCount === 0 || loadingAction === 'remove_duplicates'}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-blue-300 border border-slate-700 text-xs font-medium transition"
              >
                Deduplicate
              </button>
            </div>
          </div>
        </div>

        {/* Module 4: Drop Redundant Columns */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <h3 className="font-semibold text-white text-sm">Feature Removal</h3>
          </div>
          <p className="text-xs text-slate-400">
            Exclude extraneous, uninformative, or high-missing columns from the working matrix.
          </p>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-[11px] font-medium text-slate-300 block mb-1">Column to Remove</label>
              <select
                value={selectedDropCol}
                onChange={e => setSelectedDropCol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Select column to drop --</option>
                {dataset.columns.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => applyCleaning('remove_columns', { column: selectedDropCol })}
              disabled={!selectedDropCol || loadingAction === 'remove_columns'}
              className="w-full py-2 px-4 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/80 disabled:opacity-30 text-xs font-medium transition"
            >
              {loadingAction === 'remove_columns' ? 'Removing Column...' : 'Drop Selected Column'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
