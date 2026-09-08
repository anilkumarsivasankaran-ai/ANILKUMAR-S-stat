import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { UploadView } from './components/UploadView';
import { DataPreviewView } from './components/DataPreviewView';
import { DataCleaningView } from './components/DataCleaningView';
import { EDAView } from './components/EDAView';
import { VisualizationsView } from './components/VisualizationsView';
import { CorrelationView } from './components/CorrelationView';
import { HypothesisTestingView } from './components/HypothesisTestingView';
import { LinearRegressionView } from './components/LinearRegressionView';
import { LeastSquaresVisualizer } from './components/LeastSquaresVisualizer';
import { DiagnosticsView } from './components/DiagnosticsView';
import { PredictionsView } from './components/PredictionsView';
import { ModelComparisonView } from './components/ModelComparisonView';
import { ReportView } from './components/ReportView';
import { ProjectsHistoryView } from './components/ProjectsHistoryView';
import { AIThinkingModal } from './components/AIThinkingModal';
import { Dataset, NavigationTab, RegressionModelOutput, HypothesisTestResult } from './types';

export default function App() {
  const [currentDataset, setCurrentDataset] = useState<Dataset | null>(null);
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [models, setModels] = useState<RegressionModelOutput[]>([]);
  const [activeModel, setActiveModel] = useState<RegressionModelOutput | null>(null);
  const [tests, setTests] = useState<HypothesisTestResult[]>([]);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load active or sample dataset on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // First try fetching active dataset
      const res = await fetch('/api/datasets/current');
      const data = await res.json();
      if (data.success && data.dataset) {
        setCurrentDataset(data.dataset);
      } else {
        // Automatically load benchmark sample dataset so user is greeted with populated data
        await handleLoadSample();
      }
    } catch (err) {
      console.error('Initial data load error:', err);
      await handleLoadSample();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/datasets/sample', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setCurrentDataset(data.dataset);
      }
    } catch (err) {
      console.error('Failed to load sample dataset:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = (dataset: Dataset) => {
    setCurrentDataset(dataset);
    setActiveTab('preview');
  };

  const handleDatasetUpdated = (dataset: Dataset) => {
    setCurrentDataset(dataset);
  };

  const handleModelCreated = (newModel: RegressionModelOutput) => {
    setModels(prev => [newModel, ...prev.filter(m => m.modelId !== newModel.modelId)]);
    setActiveModel(newModel);
  };

  const handleDeleteModel = (modelId: string) => {
    setModels(prev => prev.filter(m => m.modelId !== modelId));
    if (activeModel?.modelId === modelId) {
      const remaining = models.filter(m => m.modelId !== modelId);
      setActiveModel(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const handleTestCompleted = (result: HypothesisTestResult) => {
    setTests(prev => [result, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentDataset={currentDataset}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLoadSample={handleLoadSample}
        onOpenAiThinking={() => setIsAiModalOpen(true)}
        isLoading={isLoading}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Workflow Sidebar (Desktop) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          datasetName={currentDataset?.name}
          hasModels={models.length > 0}
        />

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                dataset={currentDataset}
                models={models}
                tests={tests}
                setActiveTab={setActiveTab}
                onLoadSample={handleLoadSample}
                onOpenAiThinking={() => setIsAiModalOpen(true)}
              />
            )}

            {activeTab === 'upload' && (
              <UploadView
                currentDataset={currentDataset}
                onUploadSuccess={handleUploadSuccess}
                onLoadSample={handleLoadSample}
                setActiveTab={setActiveTab}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'preview' && (
              <DataPreviewView dataset={currentDataset} />
            )}

            {activeTab === 'cleaning' && (
              <DataCleaningView
                dataset={currentDataset}
                onDatasetUpdated={handleDatasetUpdated}
              />
            )}

            {activeTab === 'eda' && (
              <EDAView dataset={currentDataset} />
            )}

            {activeTab === 'visualizations' && (
              <VisualizationsView dataset={currentDataset} />
            )}

            {activeTab === 'correlation' && (
              <CorrelationView dataset={currentDataset} />
            )}

            {activeTab === 'hypothesis' && (
              <HypothesisTestingView
                dataset={currentDataset}
                onTestCompleted={handleTestCompleted}
                testsHistory={tests}
              />
            )}

            {activeTab === 'regression' && (
              <LinearRegressionView
                dataset={currentDataset}
                onModelCreated={handleModelCreated}
                setActiveTab={setActiveTab}
                activeModel={activeModel}
              />
            )}

            {activeTab === 'least-squares' && (
              <LeastSquaresVisualizer />
            )}

            {activeTab === 'diagnostics' && (
              <DiagnosticsView
                dataset={currentDataset}
                activeModel={activeModel}
              />
            )}

            {activeTab === 'predictions' && (
              <PredictionsView
                dataset={currentDataset}
                activeModel={activeModel}
              />
            )}

            {activeTab === 'comparison' && (
              <ModelComparisonView
                models={models}
                activeModel={activeModel}
                setActiveModel={setActiveModel}
                setActiveTab={setActiveTab}
                onDeleteModel={handleDeleteModel}
              />
            )}

            {activeTab === 'reports' && (
              <ReportView
                dataset={currentDataset}
                activeModel={activeModel}
                tests={tests}
              />
            )}

            {activeTab === 'history' && (
              <ProjectsHistoryView
                dataset={currentDataset}
                models={models}
                tests={tests}
                setActiveTab={setActiveTab}
                setActiveModel={setActiveModel}
              />
            )}
          </div>
        </main>
      </div>

      {/* Gemini 3.1 Pro High-Thinking AI Modal */}
      <AIThinkingModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        dataset={currentDataset}
        activeModel={activeModel}
        tests={tests}
      />
    </div>
  );
}
