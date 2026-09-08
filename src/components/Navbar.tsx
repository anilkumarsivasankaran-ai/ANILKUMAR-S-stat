import React from 'react';
import {
  BarChart3,
  Database,
  Sparkles,
  FileText,
  RefreshCw,
  PlusCircle,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { Dataset, NavigationTab } from '../types';

interface NavbarProps {
  currentDataset: Dataset | null;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  onLoadSample: () => void;
  onOpenAiThinking: () => void;
  isLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDataset,
  setActiveTab,
  onLoadSample,
  onOpenAiThinking,
  isLoading
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">Statistical Analytics Studio</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                  v2.0 Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Inferential Statistics & Linear Regression Engine</p>
            </div>
          </div>

          {/* Center: Current Dataset Badge */}
          <div className="hidden md:flex items-center space-x-3 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs">
            <Database className="w-4 h-4 text-indigo-400" />
            {currentDataset ? (
              <div className="flex items-center space-x-2">
                <span className="text-slate-200 font-medium max-w-[200px] truncate">{currentDataset.name}</span>
                <span className="text-slate-400">|</span>
                <span className="text-emerald-400 font-mono font-medium">{currentDataset.rowCount.toLocaleString()} rows</span>
                <span className="text-slate-400">|</span>
                <span className="text-blue-400 font-mono font-medium">{currentDataset.columnCount} cols</span>
                {currentDataset.isSynthetic && (
                  <span className="bg-amber-950/80 text-amber-300 border border-amber-700/60 px-1.5 py-0.5 rounded text-[10px]">
                    Synthetic
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-400">No active dataset selected</span>
            )}
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onLoadSample}
              disabled={isLoading}
              className="hidden sm:inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Load 1,000-row synthetic retail sales dataset"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Reset Benchmark</span>
            </button>

            <button
              onClick={() => setActiveTab('regression')}
              className="inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Fit Regression</span>
            </button>

            <button
              onClick={onOpenAiThinking}
              className="inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm border border-indigo-400/30"
              title="Gemini 3.1 Pro High Thinking Mode Statistical Consultant"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Deep Thinking AI</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className="inline-flex items-center space-x-1.5 text-xs font-medium px-2.5 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="View Analytical Report"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
