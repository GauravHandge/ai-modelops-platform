'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Box, Plus, ArrowUpRight, ShieldCheck, Layers, Cpu } from 'lucide-react';
import { api } from '@/lib/api';
import { Model, Project } from '@/types';

export default function ModelsPage() {
  const searchParams = useSearchParams();
  const filterProjectId = searchParams?.get('project_id');

  const [models, setModels] = useState<Model[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Form states
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [framework, setFramework] = useState<string>('Scikit-learn');
  const [modelType, setModelType] = useState<string>('Classification');
  const [projectId, setProjectId] = useState<string>('');
  const [evaluationMetric, setEvaluationMetric] = useState<string>('F1');
  const [evaluationThreshold, setEvaluationThreshold] = useState<number>(0.85);

  const loadData = async () => {
    try {
      const [mRes, pRes] = await Promise.all([
        api.getModels(filterProjectId || undefined),
        api.getProjects(),
      ]);
      setModels(mRes || []);
      setProjects(pRes || []);
      if (pRes && pRes.length > 0) {
        setProjectId(filterProjectId || pRes[0].id);
      }
    } catch (err) {
      console.error('Failed to load models:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterProjectId]);

  const handleRegisterModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !projectId) return;
    setLoading(true);

    try {
      await api.createModel({
        name,
        description,
        framework,
        model_type: modelType,
        project_id: projectId,
        evaluation_metric: evaluationMetric,
        evaluation_threshold: evaluationThreshold,
      });

      setName('');
      setDescription('');
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to register model');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Box className="h-6 w-6 text-violet-400" />
            <span>Central Model Registry</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Model-agnostic registry for Scikit-Learn, XGBoost, PyTorch, and Custom framework models.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 flex items-center space-x-2 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Register New Model</span>
        </button>
      </div>

      {/* Grid of Registered Models */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((m) => {
          const projectObj = projects.find((p) => p.id === m.project_id);

          return (
            <div key={m.id} className="glass-panel glass-panel-hover p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{m.name}</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Project: <span className="text-indigo-400 font-semibold">{projectObj?.name || 'Workspace'}</span>
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-violet-500/20 text-violet-400 border border-violet-500/30">
                    {m.framework}
                  </span>
                </div>

                <p className="text-xs text-gray-400 line-clamp-2">{m.description || 'No description provided.'}</p>

                <div className="p-3 rounded-lg bg-gray-900/60 border border-gray-800/80 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Model Type:</span>
                    <span className="text-white font-semibold">{m.model_type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Evaluation Criteria:</span>
                    <span className="text-indigo-400 font-mono font-bold">
                      {m.evaluation_metric} ≥ {m.evaluation_threshold}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800 flex items-center justify-between text-xs">
                <div>
                  {m.production_version ? (
                    <span className="flex items-center space-x-1 text-emerald-400 font-bold font-mono">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Prod V{m.production_version}</span>
                    </span>
                  ) : (
                    <span className="text-gray-500 italic">No Prod Version</span>
                  )}
                </div>

                <Link
                  href={`/models/${m.id}`}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 font-semibold flex items-center space-x-1 transition"
                >
                  <span>Model Details & Versions</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-lg w-full border border-gray-800 space-y-4">
            <h2 className="text-lg font-bold text-white">Register New Model</h2>
            <form onSubmit={handleRegisterModel} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Model Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. churn-predictor"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Project Workspace</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Framework</label>
                  <select
                    value={framework}
                    onChange={(e) => setFramework(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Scikit-learn">Scikit-learn</option>
                    <option value="XGBoost">XGBoost</option>
                    <option value="PyTorch">PyTorch</option>
                    <option value="Custom">Custom Framework</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Model Type</label>
                  <select
                    value={modelType}
                    onChange={(e) => setModelType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Classification">Classification</option>
                    <option value="Regression">Regression</option>
                    <option value="Computer Vision">Computer Vision</option>
                    <option value="Recommendation">Recommendation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Evaluation Metric</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. F1, Accuracy, RMSE, R2"
                    value={evaluationMetric}
                    onChange={(e) => setEvaluationMetric(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Threshold for Production</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={evaluationThreshold}
                    onChange={(e) => setEvaluationThreshold(parseFloat(e.target.value) || 0.0)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe model purpose..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow"
                >
                  {loading ? 'Registering...' : 'Register Model'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
