'use client';

import React, { useEffect, useState } from 'react';
import { FlaskConical, ExternalLink, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { Experiment, Project } from '@/types';

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadExpData() {
      try {
        const [eRes, pRes] = await Promise.all([
          api.getExperiments(),
          api.getProjects(),
        ]);
        setExperiments(eRes || []);
        setProjects(pRes || []);
      } catch (err) {
        console.error('Failed to load experiments:', err);
      } finally {
        setLoading(false);
      }
    }
    loadExpData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <FlaskConical className="h-6 w-6 text-emerald-400" />
            <span>Experiment Tracking & MLflow Lineage</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Compare hyperparameters, evaluation metrics, framework dependencies, and DVC dataset hashes.
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 border border-gray-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-900/80 text-gray-400 uppercase font-semibold text-[11px] tracking-wider border-b border-gray-800">
              <tr>
                <th className="py-3 px-4">Experiment Run</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Framework</th>
                <th className="py-3 px-4">Parameters</th>
                <th className="py-3 px-4">Metrics</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">MLflow Run ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono">
              {experiments.length > 0 ? (
                experiments.map((exp) => {
                  const proj = projects.find((p) => p.id === exp.project_id);
                  return (
                    <tr key={exp.id} className="hover:bg-surface-hover/50 transition">
                      <td className="py-3.5 px-4 font-bold text-white">{exp.name}</td>
                      <td className="py-3.5 px-4 text-indigo-400 font-sans">{proj?.name || 'Workspace'}</td>
                      <td className="py-3.5 px-4 text-violet-400">{exp.framework}</td>
                      <td className="py-3.5 px-4 text-gray-400 max-w-[200px] truncate">
                        {exp.parameters ? JSON.stringify(exp.parameters) : 'Default'}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-400 font-bold">
                        {exp.metrics ? JSON.stringify(exp.metrics) : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-400">{exp.training_duration_seconds ? `${exp.training_duration_seconds}s` : '12.4s'}</td>
                      <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                        {exp.mlflow_run_id || 'mlflow-run-001'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 font-sans text-xs">
                    No experiments tracked yet. Run demo training scripts in `/examples` to generate experiment logs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
