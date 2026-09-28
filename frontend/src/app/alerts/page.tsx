'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, CheckCircle, ShieldAlert, Cpu } from 'lucide-react';
import { api } from '@/lib/api';
import { DriftEvent } from '@/types';

export default function AlertsPage() {
  const [events, setEvents] = useState<DriftEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchDriftEvents = async () => {
    try {
      const data = await api.getDriftEvents();
      setEvents(data || []);
    } catch (err) {
      console.error('Failed to fetch drift events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriftEvents();
  }, []);

  const handleAcknowledge = async (eventId: string) => {
    try {
      const res = await api.acknowledgeDrift(eventId);
      setActionMsg(res.message);
      fetchDriftEvents();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge drift event');
    }
  };

  const handleTriggerRetraining = async (eventId: string) => {
    if (!confirm('Trigger automated retraining workflow for model version associated with this drift event?')) return;
    try {
      const res = await api.triggerRetraining(eventId);
      setActionMsg(res.message);
      fetchDriftEvents();
      setTimeout(() => setActionMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to trigger retraining');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6 text-rose-400" />
            <span>Data Drift & Automated Retraining Workflow Center</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Statistical feature distribution drift detection using Kolmogorov-Smirnov (KS-test) and Population Stability Index (PSI).
          </p>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center space-x-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      <div className="glass-panel p-6 border border-gray-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-900/80 text-gray-400 uppercase font-semibold text-[11px] tracking-wider border-b border-gray-800">
              <tr>
                <th className="py-3 px-4">Feature Name</th>
                <th className="py-3 px-4">KS Drift Score</th>
                <th className="py-3 px-4">P-Value</th>
                <th className="py-3 px-4">Drift Status</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Detected At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono">
              {events.length > 0 ? (
                events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-surface-hover/50 transition">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center space-x-2">
                      <span>{evt.feature_name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-rose-400 font-bold">
                      {evt.drift_score.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 text-indigo-400">
                      {evt.p_value ? evt.p_value.toFixed(4) : '< 0.05'}
                    </td>
                    <td className="py-3.5 px-4">
                      {evt.drift_detected ? (
                        <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          Drift Detected
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Stable
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-300 font-sans text-xs">
                      {evt.status}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 font-sans text-[11px]">
                      {new Date(evt.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 font-sans">
                      {evt.status === 'Open' && (
                        <button
                          onClick={() => handleAcknowledge(evt.id)}
                          className="px-2.5 py-1 rounded text-xs font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
                        >
                          Acknowledge
                        </button>
                      )}
                      {evt.status !== 'RetrainingTriggered' && (
                        <button
                          onClick={() => handleTriggerRetraining(evt.id)}
                          className="px-3 py-1 rounded text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20 flex items-center space-x-1 inline-flex"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>Trigger Retraining</span>
                        </button>
                      )}
                      {evt.status === 'RetrainingTriggered' && (
                        <span className="text-emerald-400 font-semibold text-[11px] flex items-center justify-end space-x-1">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Retraining Initiated</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 font-sans text-xs">
                    No data drift events recorded. Run drift analysis via `/api/drift/check` to evaluate live feature distributions against baseline.
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
