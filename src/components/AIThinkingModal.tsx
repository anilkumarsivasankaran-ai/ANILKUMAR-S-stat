import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  BrainCircuit,
  Bot,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { Dataset, RegressionModelOutput, HypothesisTestResult } from '../types';

interface AIThinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: Dataset | null;
  activeModel: RegressionModelOutput | null;
  tests: HypothesisTestResult[];
}

export const AIThinkingModal: React.FC<AIThinkingModalProps> = ({
  isOpen,
  onClose,
  dataset,
  activeModel,
  tests
}) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickPrompts = [
    'Audit my active regression model assumptions (VIF, Breusch-Pagan, Normality) and propose concrete fixes.',
    'Synthesize an executive board memo translating our statistical findings into business action.',
    'Evaluate whether the effect sizes of our statistically significant predictors carry substantive economic meaning.',
    'Analyze risks of omitted variable bias, endogeneity, and non-linear interactions in this dataset.'
  ];

  const handleAsk = async (text: string) => {
    if (!text.trim()) return;
    setIsThinking(true);
    setErrorMsg(null);
    setResponse(null);

    const context = {
      dataset: dataset ? {
        name: dataset.name,
        rowCount: dataset.rowCount,
        columnCount: dataset.columnCount,
        numericalColumns: dataset.numericalColumns,
        categoricalColumns: dataset.categoricalColumns,
        missingCount: dataset.missingValuesTotal
      } : null,
      activeModel: activeModel ? {
        equation: activeModel.equation,
        target: activeModel.targetVariable,
        predictors: activeModel.predictorVariables,
        rSquared: activeModel.rSquared,
        adjRSquared: activeModel.adjRSquared,
        rmse: activeModel.rmse,
        fStatistic: activeModel.fStatistic,
        fPValue: activeModel.fPValue,
        coefficients: activeModel.coefficients
      } : null,
      testsCount: tests.length,
      latestTest: tests.length > 0 ? tests[tests.length - 1] : null
    };

    try {
      const res = await fetch('/api/ai/deep-thinking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, context })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'AI consultation failed');
      }
      setResponse(data.interpretation);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <BrainCircuit className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-base">Gemini 3.1 Pro Deep Thinking Statistical Consultant</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700">
                  ThinkingLevel.HIGH
                </span>
              </div>
              <p className="text-xs text-slate-400">Advanced econometric reasoning, assumption audits, and causal caveats</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Quick Prompts */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              One-Click Statistical Inquiries
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(p);
                    handleAsk(p);
                  }}
                  className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-xs text-slate-300 hover:text-white transition line-clamp-2"
                >
                  "{p}"
                </button>
              ))}
            </div>
          </div>

          {/* Thinking status */}
          {isThinking && (
            <div className="p-8 rounded-xl bg-slate-950 border border-indigo-900/50 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">Engaging Gemini 3.1 Pro High Thinking Mode...</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Synthesizing full design matrix context, reviewing Gauss-Markov assumptions, computing critical significance thresholds, and formulating causal warnings.
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Output Response */}
          {response && (
            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider pb-2 border-b border-slate-800">
                <Sparkles className="w-4 h-4" />
                <span>Senior Principal Statistician Evaluation</span>
              </div>
              <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans space-y-2">
                {response}
              </div>
            </div>
          )}
        </div>

        {/* Query Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleAsk(query);
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ask any statistical question about your model, p-values, or dataset..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isThinking || !query.trim()}
              className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Consult</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
