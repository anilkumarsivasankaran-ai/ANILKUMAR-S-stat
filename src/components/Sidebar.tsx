import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  TableProperties,
  Sparkles,
  Calculator,
  PieChart,
  GitCompare,
  FlaskConical,
  TrendingUp,
  Activity,
  SlidersHorizontal,
  FileCheck2,
  FolderKanban,
  Target,
  Wand2
} from 'lucide-react';
import { NavigationTab } from '../types';

interface SidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  datasetName?: string;
  hasModels: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  hasModels
}) => {
  const sections = [
    {
      group: 'DATA WORKFLOW',
      items: [
        { id: 'dashboard', label: '1. Dashboard', icon: LayoutDashboard },
        { id: 'upload', label: '2. Upload Dataset', icon: UploadCloud },
        { id: 'preview', label: '3. Data Preview', icon: TableProperties },
        { id: 'cleaning', label: '4. Data Cleaning', icon: Wand2 },
      ]
    },
    {
      group: 'EXPLORATION & STATS',
      items: [
        { id: 'eda', label: '5. Exploratory Data Analysis', icon: Calculator },
        { id: 'visualizations', label: '6. Data Visualizations', icon: PieChart },
        { id: 'correlation', label: '7. Correlation Analysis', icon: GitCompare },
      ]
    },
    {
      group: 'INFERENCE & MODELING',
      items: [
        { id: 'hypothesis', label: '8. Hypothesis Testing', icon: FlaskConical },
        { id: 'regression', label: '9. Linear Regression', icon: TrendingUp },
        { id: 'least-squares', label: '10. Least-Squares Sim', icon: Target },
      ]
    },
    {
      group: 'EVALUATION & REPORTS',
      items: [
        { id: 'diagnostics', label: '11. Model Diagnostics', icon: Activity, badge: hasModels ? undefined : 'Needs Fit' },
        { id: 'predictions', label: '12. Predictions', icon: SlidersHorizontal, badge: hasModels ? undefined : 'Needs Fit' },
        { id: 'comparison', label: '13. Model Comparison', icon: GitCompare },
        { id: 'reports', label: '14. Analytical Report', icon: FileCheck2 },
        { id: 'history', label: '15. Projects & History', icon: FolderKanban },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="p-4 space-y-6">
        {sections.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase px-3 mb-2">
              {sec.group}
            </h3>
            {sec.items.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as NavigationTab)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
};
