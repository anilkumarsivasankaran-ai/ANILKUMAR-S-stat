import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  Info,
  Sparkles,
  HardDrive
} from 'lucide-react';
import { Dataset, NavigationTab } from '../types';

interface UploadViewProps {
  currentDataset: Dataset | null;
  onUploadSuccess: (dataset: Dataset) => void;
  onLoadSample: () => void;
  setActiveTab: (tab: NavigationTab) => void;
  isLoading: boolean;
}

export const UploadView: React.FC<UploadViewProps> = ({
  currentDataset,
  onUploadSuccess,
  onLoadSample,
  setActiveTab,
  isLoading
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/datasets/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to upload dataset');
      }
      onUploadSuccess(data.dataset);
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Section Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h1 className="text-xl font-bold text-white">Dataset Ingestion & Schema Inspector</h1>
        <p className="text-xs text-slate-400 mt-1">
          Upload tabular data via CSV or Excel (.xlsx, .xls) for automated type inference, missing value detection, and statistical modeling.
        </p>
      </div>

      {/* Upload & Benchmark Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Drop Zone */}
        <div className="lg:col-span-2 space-y-4">
          <div
            onDragOver={e => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition ${
              dragOver
                ? 'border-blue-500 bg-blue-950/20'
                : 'border-slate-700 hover:border-slate-600 bg-slate-900/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              accept=".csv,.xlsx,.xls"
              className="hidden"
            />
            <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 mb-4 border border-slate-700 shadow-sm">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-white">
              {uploading ? 'Parsing & Ingesting Dataset...' : 'Click or Drag & Drop Dataset Here'}
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 max-w-sm">
              Supports Comma-Separated Values (.csv) and Microsoft Excel workbooks (.xlsx, .xls) up to 50MB.
            </p>
            <div className="mt-4 flex items-center space-x-2 text-[11px] text-slate-400">
              <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">CSV</span>
              <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">XLSX</span>
              <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">XLS</span>
            </div>
          </div>

          {uploadError && (
            <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
              <div>
                <span className="font-semibold block">Upload Failed</span>
                <span>{uploadError}</span>
              </div>
            </div>
          )}
        </div>

        {/* 1-Click Synthetic Sample Data Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 mb-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Benchmark Dataset</span>
            </div>
            <h3 className="text-base font-semibold text-white">Need immediate test data?</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Instantly load a 1,000-row synthetic retail sales dataset containing realistic multivariate relationships:
            </p>
            <ul className="text-xs text-slate-300 mt-3 space-y-1.5 list-disc list-inside">
              <li><strong className="text-white">sales</strong>: Revenue target ($1,000s)</li>
              <li><strong className="text-white">advertising</strong>: Marketing spend</li>
              <li><strong className="text-white">price</strong> & <strong className="text-white">discount</strong>: Unit pricing</li>
              <li><strong className="text-white">customers</strong>: Store footfall</li>
              <li><strong className="text-white">store_type</strong> & <strong className="text-white">region</strong></li>
            </ul>
          </div>

          <button
            onClick={onLoadSample}
            disabled={isLoading}
            className="mt-6 w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-sm border border-indigo-400/30"
          >
            <Database className="w-4 h-4" />
            <span>Load 1,000-Row Sample</span>
          </button>
        </div>
      </div>

      {/* Current Dataset Overview Card */}
      {currentDataset && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white">{currentDataset.name}</h2>
                {currentDataset.isSynthetic && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80 font-medium">
                    Synthetic
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Ingested on {new Date(currentDataset.uploadedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('preview')}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center space-x-1.5 transition"
              >
                <span>View Data Grid</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setActiveTab('cleaning')}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
              >
                <span>Clean Data</span>
              </button>
            </div>
          </div>

          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Total Rows</span>
              <span className="text-lg font-bold text-white font-mono">{currentDataset.rowCount.toLocaleString()}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Total Columns</span>
              <span className="text-lg font-bold text-blue-400 font-mono">{currentDataset.columnCount}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Numerical</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">{currentDataset.numericalColumns.length}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Categorical</span>
              <span className="text-lg font-bold text-purple-400 font-mono">{currentDataset.categoricalColumns.length}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Missing Values</span>
              <span className={`text-lg font-bold font-mono ${currentDataset.missingValuesTotal > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                {currentDataset.missingValuesTotal}
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Memory Footprint</span>
              <span className="text-lg font-bold text-slate-300 font-mono">~{currentDataset.memoryUsageKb} KB</span>
            </div>
          </div>

          {/* Columns Schema Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Detected Variables Schema</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {currentDataset.columns.map(col => (
                <div key={col.name} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="truncate">
                    <span className="font-medium text-white font-mono block truncate">{col.name}</span>
                    <span className="text-[10px] text-slate-400">
                      {col.uniqueCount} unique • {col.missingCount > 0 ? `${col.missingCount} missing` : '100% complete'}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                    col.type === 'numerical'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                      : 'bg-purple-950 text-purple-300 border border-purple-800/60'
                  }`}>
                    {col.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
