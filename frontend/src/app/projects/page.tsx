'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FolderKanban, Plus, ArrowUpRight, Trash2, Box, Rocket } from 'lucide-react';
import { api } from '@/lib/api';
import { Project } from '@/types';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data || []);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await api.createProject({ name, description });
      setName('');
      setDescription('');
      setShowModal(false);
      fetchProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id: string, projName: string) => {
    if (!confirm(`Are you sure you want to delete project '${projName}'?`)) return;
    try {
      await api.deleteProject(id);
      fetchProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <FolderKanban className="h-6 w-6 text-indigo-400" />
            <span>Projects Workspace</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">Manage independent ML projects, models, experiments, and deployments.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 flex items-center space-x-2 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => (
          <div key={p.id} className="glass-panel glass-panel-hover p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="text-base font-bold text-white">{p.name}</h3>
                <button
                  onClick={() => handleDeleteProject(p.id, p.name)}
                  className="text-gray-500 hover:text-rose-400 transition"
                  title="Delete Project"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 line-clamp-3">{p.description || 'No description provided.'}</p>
            </div>

            <div className="pt-4 border-t border-gray-800 space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded bg-gray-900/60">
                  <div className="font-bold text-indigo-400">{p.model_count || 0}</div>
                  <div className="text-[10px] text-gray-400">Models</div>
                </div>
                <div className="p-2 rounded bg-gray-900/60">
                  <div className="font-bold text-emerald-400">{p.experiment_count || 0}</div>
                  <div className="text-[10px] text-gray-400">Experiments</div>
                </div>
                <div className="p-2 rounded bg-gray-900/60">
                  <div className="font-bold text-violet-400">{p.active_deployments || 0}</div>
                  <div className="text-[10px] text-gray-400">Deployments</div>
                </div>
              </div>

              <Link
                href={`/projects/${p.id}`}
                className="w-full py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold flex items-center justify-center space-x-1 border border-gray-700 transition"
              >
                <span>Open Project Workspace</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-indigo-400" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-md w-full border border-gray-800 space-y-4">
            <h2 className="text-lg font-bold text-white">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Customer Churn, House Price Prediction"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Project purpose, target business domain..."
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
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
