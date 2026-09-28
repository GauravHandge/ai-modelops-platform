'use client';

import React from 'react';
import { Check, ShieldCheck, ArrowUpRight, History } from 'lucide-react';
import { ModelVersion } from '@/types';

interface VersionCompareMatrixProps {
  versions: ModelVersion[];
  evaluationMetric: string;
  evaluationThreshold: number;
  onPromote: (versionId: string, stage: string) => void;
}

export default function VersionCompareMatrix({
  versions,
  evaluationMetric,
  evaluationThreshold,
  onPromote
}: VersionCompareMatrixProps) {
  if (!versions || versions.length === 0) {
    return (
      <div className="p-8 glass-panel text-center text-gray-500 text-xs">
        No model versions registered yet for comparison.
      </div>
    );
  }

  const stageBadgeColors: Record<string, string> = {
    Production: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Staging: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    Testing: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    Development: 'bg-gray-800 text-gray-300 border-gray-700',
    Archived: 'bg-gray-900 text-gray-500 border-gray-800',
  };

  return (
    <div className="glass-panel p-6 border border-gray-800 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Model Version Lineage & Comparison Matrix</h3>
            <p className="text-xs text-gray-400">
              Evaluation Criteria: <span className="text-indigo-400 font-mono font-semibold">{evaluationMetric} ≥ {evaluationThreshold}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-300">
          <thead className="bg-gray-900/80 text-gray-400 uppercase font-semibold text-[11px] tracking-wider border-b border-gray-800">
            <tr>
              <th className="py-3 px-4">Version</th>
              <th className="py-3 px-4">Stage</th>
              <th className="py-3 px-4">Metrics</th>
              <th className="py-3 px-4">Hyperparameters</th>
              <th className="py-3 px-4">Dataset trace</th>
              <th className="py-3 px-4">Registered</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 font-mono">
            {versions.map((ver) => {
              const metrics = ver.metrics || {};
              const mainMetricVal = metrics[evaluationMetric.toLowerCase()] ?? metrics['f1'] ?? metrics['accuracy'] ?? metrics['rmse'];

              const isProd = ver.stage === 'Production';
              const meetsThreshold = mainMetricVal !== undefined && mainMetricVal >= evaluationThreshold;

              return (
                <tr key={ver.id} className="hover:bg-surface-hover/50 transition">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center space-x-2">
                    <span>V{ver.version}</span>
                    {isProd && <ShieldCheck className="h-4 w-4 text-emerald-400 inline" />}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${stageBadgeColors[ver.stage] || stageBadgeColors['Development']}`}>
                      {ver.stage}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="space-y-1 text-[11px]">
                      {Object.entries(metrics).map(([k, v]) => (
                        <div key={k} className="flex items-center space-x-2">
                          <span className="text-gray-400 uppercase">{k}:</span>
                          <span className={k.toLowerCase() === evaluationMetric.toLowerCase() ? 'text-indigo-400 font-bold' : 'text-gray-200'}>
                            {typeof v === 'number' ? v.toFixed(4) : v}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-400 max-w-[200px] truncate">
                    {ver.parameters ? JSON.stringify(ver.parameters) : 'Default'}
                  </td>
                  <td className="py-3.5 px-4 text-indigo-400 font-mono text-[11px]">
                    {ver.dataset_version_id ? ver.dataset_version_id.substring(0, 8) : 'dvc-v1.0'}
                  </td>
                  <td className="py-3.5 px-4 text-gray-400 font-sans text-[11px]">
                    {new Date(ver.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2 font-sans">
                    {!isProd && (
                      <button
                        onClick={() => onPromote(ver.id, 'Production')}
                        className={`px-3 py-1 rounded text-xs font-semibold border transition ${
                          meetsThreshold
                            ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30'
                            : 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                        }`}
                        title={meetsThreshold ? 'Promote version to Production stage' : `Requires ${evaluationMetric} >= ${evaluationThreshold}`}
                      >
                        Promote Prod
                      </button>
                    )}
                    {ver.stage === 'Development' && (
                      <button
                        onClick={() => onPromote(ver.id, 'Staging')}
                        className="px-2.5 py-1 rounded text-xs font-medium bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30"
                      >
                        To Staging
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
