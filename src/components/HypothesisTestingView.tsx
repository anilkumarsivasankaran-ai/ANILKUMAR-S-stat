import React, { useState } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Sliders,
  Play,
  ArrowRight,
  Database
} from 'lucide-react';
import { Dataset, HypothesisTestResult } from '../types';

interface HypothesisTestingViewProps {
  dataset: Dataset | null;
  onTestCompleted: (result: HypothesisTestResult) => void;
  testsHistory: HypothesisTestResult[];
}

export const HypothesisTestingView: React.FC<HypothesisTestingViewProps> = ({
  dataset,
  onTestCompleted,
  testsHistory
}) => {
  const [testType, setTestType] = useState<string>('two-sample-t');
  const [alpha, setAlpha] = useState<number>(0.05);
  const [tail, setTail] = useState<'two-tailed' | 'left-tailed' | 'right-tailed'>('two-tailed');

  // Input fields
  const [variable1, setVariable1] = useState<string>('');
  const [variable2, setVariable2] = useState<string>('');
  const [groupVariable, setGroupVariable] = useState<string>('');
  const [hypothesizedMean, setHypothesizedMean] = useState<number>(0);
  const [hypothesizedProp, setHypothesizedProp] = useState<number>(0.5);

  const [isRunning, setIsRunning] = useState(false);
  const [currentResult, setCurrentResult] = useState<HypothesisTestResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (dataset && dataset.numericalColumns.length > 0) {
      if (!variable1) setVariable1(dataset.numericalColumns[0]);
      if (!variable2 && dataset.numericalColumns.length > 1) setVariable2(dataset.numericalColumns[1]);
    }
    if (dataset && dataset.categoricalColumns.length > 0 && !groupVariable) {
      setGroupVariable(dataset.categoricalColumns[0]);
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

  const runTest = async () => {
    setIsRunning(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/hypothesis/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId: dataset.id,
          testType,
          tail,
          alpha,
          variable: variable1,
          variable2,
          groupVariable,
          hypothesizedMean,
          hypothesizedProp
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Hypothesis test execution failed');
      }
      setCurrentResult(data.result);
      onTestCompleted(data.result);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FlaskConical className="w-5 h-5 text-purple-400" />
            <h1 className="text-xl font-bold text-white">Statistical Hypothesis Testing Wizard</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Conduct formal parametric and non-parametric hypothesis tests with rigorous decision rules, p-values, and assumption verification.
          </p>
        </div>

        <div className="bg-purple-950/40 border border-purple-800/60 px-3 py-1.5 rounded-lg text-xs text-purple-300 font-mono">
          Strict Rule: "Fail to reject H₀" (Never "Accept H₀")
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Test Setup Wizard Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Configure Inferential Test</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1: Test Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">1. Select Hypothesis Test</label>
            <select
              value={testType}
              onChange={e => setTestType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200"
            >
              <option value="two-sample-t">Independent Two-Sample t-Test</option>
              <option value="one-sample-t">One-Sample t-Test</option>
              <option value="paired-t">Paired Samples t-Test</option>
              <option value="one-way-anova">One-Way ANOVA (3+ Groups)</option>
              <option value="mann-whitney-u">Mann-Whitney U Test (Non-parametric)</option>
              <option value="chi-square">Chi-Square Test of Independence</option>
              <option value="one-sample-z-prop">One-Sample Z-Test for Proportions</option>
              <option value="two-sample-z-prop">Two-Sample Z-Test for Proportions</option>
            </select>
          </div>

          {/* Step 2: Significance Level α */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">2. Alpha Level (α)</label>
            <div className="grid grid-cols-3 gap-2">
              {[0.05, 0.01, 0.10].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAlpha(val)}
                  className={`py-2 px-2 rounded-lg text-xs font-mono font-medium border transition ${
                    alpha === val
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  α = {val}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Directionality Tail */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">3. Hypothesis Tail</label>
            <select
              value={tail}
              onChange={e => setTail(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200"
            >
              <option value="two-tailed">Two-Tailed (≠)</option>
              <option value="right-tailed">Right-Tailed (&gt;)</option>
              <option value="left-tailed">Left-Tailed (&lt;)</option>
            </select>
          </div>
        </div>

        {/* Dynamic Variable Selection Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
          {testType === 'one-sample-t' && (
            <>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Target Continuous Variable (X)</label>
                <select
                  value={variable1}
                  onChange={e => setVariable1(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                >
                  {dataset.numericalColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Hypothesized Mean (μ₀)</label>
                <input
                  type="number"
                  value={hypothesizedMean}
                  onChange={e => setHypothesizedMean(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono"
                />
              </div>
            </>
          )}

          {testType === 'two-sample-t' && (
            <>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Measurement Variable (Continuous)</label>
                <select
                  value={variable1}
                  onChange={e => setVariable1(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                >
                  {dataset.numericalColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Comparison Variable (2nd Column or Grouping)</label>
                <select
                  value={variable2}
                  onChange={e => setVariable2(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                >
                  {dataset.numericalColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </>
          )}

          {testType === 'paired-t' && (
            <>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Pre-Measurement / Condition 1</label>
                <select
                  value={variable1}
                  onChange={e => setVariable1(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                >
                  {dataset.numericalColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Post-Measurement / Condition 2</label>
                <select
                  value={variable2}
                  onChange={e => setVariable2(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                >
                  {dataset.numericalColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </>
          )}

          {testType === 'one-way-anova' && (
            <>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Dependent Continuous Variable</label>
                <select
                  value={variable1}
                  onChange={e => setVariable1(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                >
                  {dataset.numericalColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Categorical Factor (Group)</label>
                <select
                  value={groupVariable}
                  onChange={e => setGroupVariable(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                >
                  {dataset.categoricalColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </>
          )}

          {testType === 'mann-whitney-u' && (
            <>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Sample 1 Variable</label>
                <select
                  value={variable1}
                  onChange={e => setVariable1(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                >
                  {dataset.numericalColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Sample 2 Variable</label>
                <select
                  value={variable2}
                  onChange={e => setVariable2(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                >
                  {dataset.numericalColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </>
          )}

          {testType === 'chi-square' && (
            <>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Categorical Variable 1</label>
                <select
                  value={variable1}
                  onChange={e => setVariable1(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                >
                  {dataset.categoricalColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Categorical Variable 2</label>
                <select
                  value={groupVariable}
                  onChange={e => setGroupVariable(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                >
                  {dataset.categoricalColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </>
          )}
        </div>

        <button
          onClick={runTest}
          disabled={isRunning}
          className="w-full py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition shadow-sm"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{isRunning ? 'Calculating Exact Distributions...' : 'Execute Statistical Hypothesis Test'}</span>
        </button>
      </div>

      {/* Output Results Card */}
      {currentResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs uppercase font-semibold text-purple-400 font-mono">{currentResult.testName}</span>
              <h2 className="text-lg font-bold text-white mt-0.5">Test Outcome & Statistical Inference</h2>
            </div>
            {/* Decision badge */}
            <div className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center space-x-2 border ${
              currentResult.decision === 'Reject H₀'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                : 'bg-slate-800 text-slate-200 border-slate-700'
            }`}>
              {currentResult.decision === 'Reject H₀' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-slate-400" />
              )}
              <span>Decision: {currentResult.decision}</span>
            </div>
          </div>

          {/* Hypotheses statements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block mb-1">Null Hypothesis (H₀):</span>
              <span className="text-slate-200 font-semibold">{currentResult.h0}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-purple-400 block mb-1">Alternative Hypothesis (H₁):</span>
              <span className="text-purple-200 font-semibold">{currentResult.h1}</span>
            </div>
          </div>

          {/* Test Statistics Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Statistic ({currentResult.statisticName})</span>
              <span className="text-xl font-bold font-mono text-blue-400">{currentResult.statisticValue}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Degrees of Freedom</span>
              <span className="text-xl font-bold font-mono text-white">{currentResult.df !== undefined ? currentResult.df : 'N/A'}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Exact p-Value</span>
              <span className={`text-xl font-bold font-mono ${currentResult.pValue < currentResult.alpha ? 'text-emerald-400' : 'text-amber-400'}`}>
                {currentResult.pValue < 0.0001 ? '< 0.0001' : currentResult.pValue}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Alpha Level (α)</span>
              <span className="text-xl font-bold font-mono text-slate-300">{currentResult.alpha}</span>
            </div>
          </div>

          {/* Confidence interval if present */}
          {currentResult.confidenceInterval && (
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono flex items-center justify-between">
              <span className="text-slate-400">95% Confidence Interval for Difference:</span>
              <span className="text-emerald-300 font-bold">
                [{currentResult.confidenceInterval[0]}, {currentResult.confidenceInterval[1]}]
              </span>
            </div>
          )}

          {/* Plain-English Conclusion */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <span className="font-semibold text-white block">Plain-English Interpretation & Conclusion:</span>
            <p className="leading-relaxed text-slate-300">{currentResult.interpretation}</p>
            <p className="leading-relaxed text-slate-400 italic pt-1">{currentResult.plainEnglishConclusion}</p>
          </div>

          {/* Assumptions checklist */}
          <div className="space-y-2 text-xs">
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] block">
              Methodological Assumptions Checked
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {currentResult.assumptions.map((asm, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span className="truncate">{asm}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
