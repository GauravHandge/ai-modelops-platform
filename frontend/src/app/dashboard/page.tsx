'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FolderKanban, 
  Box, 
  FlaskConical, 
  ShieldCheck, 
  Rocket, 
  AlertTriangle, 
  ArrowUpRight,
  PlusCircle,
  Activity,
  Sparkles
} from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import { api } from '@/lib/api';
import { DashboardMetrics, Project, Deployment, DriftEvent } from '@/types';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    total_projects: 0,
    registered_models: 0,
    total_experiments: 0,
    production_models: 0,
    active_deployments: 0,
    open_drift_alerts: 0,
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [driftEvents, setDriftEvents] = useState<DriftEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [mRes, pRes, dRes, eRes] = await Promise.all([
          api.getDashboardMetrics().catch(() => null),
          api.getProjects().catch(() => []),
          api.getDeployments().catch(() => []),
          api.getDriftEvents().catch(() => []),
        ]);

        if (mRes) setMetrics(mRes);
        setProjects(pRes || []);
        setDeployments(dRes || []);
        setDriftEvents(eRes || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 glass-panel border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-surface to-violet-950/40">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="h-4 w-4" />
            <span>AI ModelOps Platform</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Enterprise Model Lifecycle Dashboard</h1>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Generic MLOps control plane for model registration, multi-project versioning, experiment tracking, dynamic prediction REST endpoints, drift analysis, and rollback.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/models"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 flex items-center space-x-2 transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Register Model</span>
          </Link>
          <Link
            href="/projects"
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-xs border border-gray-700 transition"
          >
            Manage Projects
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Projects"
          value={metrics.total_projects}
          subtitle="Multi-tenant workspaces"
          icon={FolderKanban}
          color="indigo"
        />
        <MetricCard
          title="Registered Models"
          value={metrics.registered_models}
          subtitle="Generic contract"
          icon={Box}
          color="violet"
        />
        <MetricCard
          title="Model Versions"
          value={metrics.total_experiments}
          subtitle="Full DVC & params lineage"
          icon={FlaskConical}
          color="emerald"
        />
        <MetricCard
          title="In Production"
          value={metrics.production_models}
          subtitle="Evaluated & Promoted"
          icon={ShieldCheck}
          color="emerald"
        />
        <MetricCard
          title="Active Deployments"
          value={metrics.active_deployments}
          subtitle="Dynamic REST endpoints"
          icon={Rocket}
          color="indigo"
        />
        <MetricCard
          title="Drift Alerts"
          value={metrics.open_drift_alerts}
          subtitle="Statistical shifts"
          icon={AlertTriangle}
          color={metrics.open_drift_alerts > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Main Grid: Projects & Active Deployments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Projects Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <FolderKanban className="h-4 w-4 text-indigo-400" />
              <span>Active Projects & Models</span>
            </h2>
            <Link href="/projects" className="text-xs text-indigo-400 hover:underline flex items-center space-x-1 font-semibold">
              <span>View All</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.length > 0 ? (
              projects.map((p) => (
                <div key={p.id} className="p-5 glass-panel glass-panel-hover flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-white text-sm">{p.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {p.model_count || 0} Models
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">{p.description || 'No description provided.'}</p>
                  </div>

                  <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
                    <span>{p.active_deployments || 0} Deployments</span>
                    <Link href={`/projects/${p.id}`} className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1">
                      <span>Open Workspace</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 glass-panel col-span-2 text-center text-xs text-gray-500">
                No projects registered yet. Click "Manage Projects" to get started.
              </div>
            )}
          </div>
        </div>

        {/* Drift Alerts & Retraining Trigger Drawer */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <span>Data Drift Alerts</span>
            </h2>
            <Link href="/alerts" className="text-xs text-rose-400 hover:underline flex items-center space-x-1 font-semibold">
              <span>Alert Center</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="glass-panel p-4 space-y-3">
            {driftEvents.length > 0 ? (
              driftEvents.slice(0, 4).map((evt) => (
                <div key={evt.id} className="p-3 rounded-lg bg-gray-900/80 border border-rose-500/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white font-mono">Feature: {evt.feature_name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      KS: {evt.drift_score.toFixed(3)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Statistically significant feature distribution drift detected in live production inputs.
                  </p>
                  <div className="pt-2 flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">{new Date(evt.created_at).toLocaleTimeString()}</span>
                    <Link href="/alerts" className="text-rose-400 hover:underline font-semibold">
                      Trigger Retraining →
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-gray-500 space-y-2">
                <ShieldCheck className="h-6 w-6 text-emerald-400 mx-auto" />
                <p className="text-emerald-400 font-semibold">No active data drift detected.</p>
                <p className="text-[11px]">All deployed models operating within baseline statistical thresholds.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
