import React, { useState, useMemo } from 'react';
import {
  TableProperties,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
  Download,
  Database
} from 'lucide-react';
import { Dataset } from '../types';

interface DataPreviewViewProps {
  dataset: Dataset | null;
}

export const DataPreviewView: React.FC<DataPreviewViewProps> = ({ dataset }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  if (!dataset) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <Database className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">No Dataset Loaded</h3>
        <p className="text-xs text-slate-400 mt-1">Upload a dataset or load the sample data to inspect rows.</p>
      </div>
    );
  }

  // Slice first 100 rows for high-performance preview
  const previewRows = useMemo(() => {
    return dataset.rows.slice(0, 100);
  }, [dataset.rows]);

  // Filter rows
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return previewRows;
    const term = searchTerm.toLowerCase();
    return previewRows.filter(row => {
      return Object.values(row).some(v => String(v).toLowerCase().includes(term));
    });
  }, [previewRows, searchTerm]);

  // Sort rows
  const sortedRows = useMemo(() => {
    if (!sortColumn) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const vA = a[sortColumn];
      const vB = b[sortColumn];
      if (vA === null || vA === undefined) return 1;
      if (vB === null || vB === undefined) return -1;
      if (typeof vA === 'number' && typeof vB === 'number') {
        return sortAsc ? vA - vB : vB - vA;
      }
      return sortAsc ? String(vA).localeCompare(String(vB)) : String(vB).localeCompare(String(vA));
    });
  }, [filteredRows, sortColumn, sortAsc]);

  const totalPages = Math.ceil(sortedRows.length / rowsPerPage) || 1;
  const paginatedRows = sortedRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleSort = (colName: string) => {
    if (sortColumn === colName) {
      setSortAsc(!sortAsc);
    } else {
      setSortColumn(colName);
      setSortAsc(true);
    }
  };

  const exportCSV = () => {
    const keys = dataset.columns.map(c => c.name);
    const header = keys.join(',');
    const rowsText = dataset.rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(',')).join('\n');
    const blob = new Blob([header + '\n' + rowsText], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataset.name.replace(/\.[^/.]+$/, '')}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <TableProperties className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-bold text-white">Tabular Data Preview</h1>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              Showing first {previewRows.length} of {dataset.rowCount.toLocaleString()} rows
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Search, sort, and inspect data values across all {dataset.columnCount} columns.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportCSV}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center space-x-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search within preview rows..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-4 text-xs text-slate-400">
          <span>{filteredRows.length} matching rows</span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4 text-slate-300" />
            </button>
            <span className="px-2 font-mono text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 select-none">
              <tr>
                <th className="py-3 px-3 w-12 text-center font-mono">#</th>
                {dataset.columns.map(col => (
                  <th
                    key={col.name}
                    onClick={() => handleSort(col.name)}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-800/60 transition whitespace-nowrap"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-slate-200">{col.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                        col.type === 'numerical' ? 'text-emerald-400 bg-emerald-950/60' : 'text-purple-400 bg-purple-950/60'
                      }`}>
                        {col.type === 'numerical' ? 'num' : 'cat'}
                      </span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row, idx) => {
                  const globalIdx = (currentPage - 1) * rowsPerPage + idx + 1;
                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 text-center text-slate-500 text-[11px]">{globalIdx}</td>
                      {dataset.columns.map(col => {
                        const val = row[col.name];
                        const isMissing = val === null || val === undefined || val === '';
                        return (
                          <td key={col.name} className="py-2.5 px-3 whitespace-nowrap">
                            {isMissing ? (
                              <span className="text-amber-400 bg-amber-950/60 border border-amber-800/50 px-1.5 py-0.5 rounded text-[10px]">
                                null
                              </span>
                            ) : (
                              <span className={typeof val === 'number' ? 'text-slate-100' : 'text-slate-300'}>
                                {String(val)}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={dataset.columns.length + 1} className="py-8 text-center text-slate-500">
                    No rows match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
