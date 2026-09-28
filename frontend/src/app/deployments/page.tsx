'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Rocket, CheckCircle, ExternalLink, Activity, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { Deployment, Model } from '@/types';

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dRes, mRes] = await Promise.all([
          api.getDeployments(),
          api.getModels(),
        ]);
        setDeployments(dRes || []);
        setModels(mRes || []);
      } catch (err) {
        console.error('Failed to load deployments:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Rocket className="h-6 w-6 text-indigo-400" />
            <span>Active Endpoints & Deployments</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time operational deployments serving dynamic predictions over HTTP REST endpoints.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deployments.length > 0 ? (
          deployments.map((dep) => {
            const version = dep.model_version;
            return (
              <div key={dep.id} className="glass-panel p-6 flex flex-col justify-between space-y-4 border border-gray-800">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-white text-base">{dep.deployment_name}</h3>
                      <span className="text-[11px] text-indigo-400 font-mono">
                        Model Version: V{version?.version || '1.0'}
                      </span>
                    </div>
                    <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle className="h-3 w-3" />
                      <span>{dep.status}</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-gray-950 border border-gray-800 font-mono text-xs text-gray-300 space-y-1">
                    <span className="text-[10px] text-gray-500 block uppercase">Endpoint URL:</span>
                    <div className="text-indigo-300 truncate">{dep.endpoint_url}</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
                  <span className="text-gray-400">P99 Latency: ~4ms</span>
                  <Link
                    href={`/models/${version?.model_id || ''}`}
                    className="text-indigo-400 hover:underline font-semibold flex items-center space-x-1"
                  >
                    <span>Test Endpoint</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 glass-panel col-span-3 text-center text-xs text-gray-500">
            No active model endpoints deployed. Promote a model version to Production to trigger deployment.
          </div>
        )}
      </div>
    </div>
  );
}
