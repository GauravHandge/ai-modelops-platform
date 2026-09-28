'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FolderKanban, Box, FlaskConical, Rocket, ArrowLeft, ArrowUpRight, Plus, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { Project, Model, Experiment, Deployment } from '@/types';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!projectId) return;

    async function loadProjectData() {
      try {
        const [pRes, mRes, eRes, dRes] = await Promise.all([
          api.getProject(projectId),
          api.getModels(projectId),
          api.getExperiments(projectId),
          api.getDeployments(projectId),
        ]);

        setProject(pRes);
        setModels(mRes || []);
        setExperiments(eRes || []);
        setDeployments(dRes || []);
      } catch (err) {
        console.error('Failed to load project details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProjectData();
  }, [projectId]);

  if (loading) {
    return <div className="p-8 text-center text-xs text-gray-400">Loading project workspace...</div>;
  }

  if (!project) {
    return <div className="p-8 text-center text-xs text-rose-400">Project not found.</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Link href="/projects" className="text-xs text-indigo-400 hover:underline flex items-center space-x-1 font-semibold">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Projects</span>
        </Link>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 glass-panel border border-indigo-500/20">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <FolderKanban className="h-4 w-4" />
              <span>Project Workspace</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">{project.name}</h1>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl">{project.description || 'No description provided.'}</p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href={`/models?project_id=${project.id}`}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow flex items-center space-x-2 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Register Model</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Models & Experiments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Models Catalog */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Box className="h-4 w-4 text-violet-400" />
              <span>Registered Models ({models.length})</span>
            </h2>
            <Link href="/models" className="text-xs text-indigo-400 hover:underline flex items-center space-x-1 font-semibold">
              <span>Model Registry</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {models.length > 0 ? (
              models.map((m) => (
                <div key={m.id} className="p-4 glass-panel glass-panel-hover flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-white text-sm">{m.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-400 border border-violet-500/30">
                        {m.framework}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-800 text-gray-300">
                        {m.model_type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Criteria: <span className="font-mono text-indigo-300">{m.evaluation_metric} ≥ {m.evaluation_threshold}</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 text-xs">
                    {m.production_version && (
                      <span className="flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Prod: V{m.production_version}</span>
                      </span>
                    )}
                    <Link
                      href={`/models/${m.id}`}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
                    >
                      <span>Manage</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 glass-panel text-center text-xs text-gray-500">
                No models registered yet for this project.
              </div>
            )}
          </div>
        </div>

        {/* Experiments Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <FlaskConical className="h-4 w-4 text-emerald-400" />
              <span>Recent Experiments ({experiments.length})</span>
            </h2>
            <Link href="/experiments" className="text-xs text-emerald-400 hover:underline flex items-center space-x-1 font-semibold">
              <span>View All</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="glass-panel p-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300 font-mono">
              <thead className="text-gray-400 uppercase text-[10px] font-semibold tracking-wider border-b border-gray-800">
                <tr>
                  <th className="py-2 px-3">Run Name</th>
                  <th className="py-2 px-3">Framework</th>
                  <th className="py-2 px-3">Metrics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {experiments.length > 0 ? (
                  experiments.slice(0, 5).map((exp) => (
                    <tr key={exp.id}>
                      <td className="py-2.5 px-3 font-bold text-white">{exp.name}</td>
                      <td className="py-2.5 px-3 text-indigo-400">{exp.framework}</td>
                      <td className="py-2.5 px-3 text-emerald-400">
                        {exp.metrics ? JSON.stringify(exp.metrics) : 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-gray-500 text-xs font-sans">
                      No experiment runs tracked yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
