'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Clock, CheckCircle, Send, Cpu, Database } from 'lucide-react';
import { api } from '@/lib/api';
import { PredictionLog } from '@/types';

export default function MonitoringPage() {
  const [logs, setLogs] = useState<PredictionLog[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string>('');
  const [actualLabel, setActualLabel] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const data = await api.getPredictionLogs(50);
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to fetch prediction logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleLogGroundTruth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLogId || !actualLabel.trim()) return;
    try {
      const parsedLabel = isNaN(Number(actualLabel)) ? actualLabel : Number(actualLabel);
      await api.logGroundTruth(selectedLogId, parsedLabel);
      setMsg(`Ground-truth label '${actualLabel}' logged for prediction log ${selectedLogId.substring(0, 8)}.`);
      setActualLabel('');
      fetchLogs();
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to log ground truth');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Activity className="h-6 w-6 text-emerald-400" />
            <span>Model Performance & Prediction Log Analytics</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time inference logs, latency metrics, and ground-truth feedback collection for performance evaluation.
          </p>
        </div>
      </div>

      {msg && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle className="h-4 w-4" />
          <span>{msg}</span>
        </div>
      )}

      {/* Grid: Ground Truth Logger & Prediction Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ground Truth Submission Form */}
        <div className="glass-panel p-6 border border-gray-800 space-y-4">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm border-b border-gray-800 pb-3">
            <Database className="h-4 w-4" />
            <span>Ground Truth Feedback Logger</span>
          </div>
          <p className="text-xs text-gray-400">
            Submit actual target outcome labels for prediction logs to calculate real-time accuracy, RMSE, and F1 scores.
          </p>

          <form onSubmit={handleLogGroundTruth} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">Select Prediction Log ID</label>
              <select
                value={selectedLogId}
                onChange={(e) => setSelectedLogId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="">-- Choose Log ID --</option>
                {logs.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.id.substring(0, 8)}... (Pred: {JSON.stringify(l.prediction_output)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">Actual Ground-Truth Label</label>
              <input
                type="text"
                required
                placeholder="e.g. 1 (Churn), 0 (No Churn), or price 450000"
                value={actualLabel}
                onChange={(e) => setActualLabel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow flex items-center justify-center space-x-2 transition"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Submit Ground Truth</span>
            </button>
          </form>
        </div>

        {/* Prediction Logs Table */}
        <div className="lg:col-span-2 glass-panel p-6 border border-gray-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Cpu className="h-4 w-4 text-indigo-400" />
            <span>Recent Prediction Logs ({logs.length})</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300 font-mono">
              <thead className="bg-gray-900/80 text-gray-400 uppercase text-[10px] font-semibold tracking-wider border-b border-gray-800">
                <tr>
                  <th className="py-2.5 px-3">Log ID</th>
                  <th className="py-2.5 px-3">Input Data</th>
                  <th className="py-2.5 px-3">Prediction</th>
                  <th className="py-2.5 px-3">Ground Truth</th>
                  <th className="py-2.5 px-3">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {logs.length > 0 ? (
                  logs.map((l) => (
                    <tr key={l.id} className="hover:bg-surface-hover/50 transition">
                      <td className="py-2.5 px-3 text-indigo-400 font-bold">{l.id.substring(0, 8)}</td>
                      <td className="py-2.5 px-3 text-gray-400 max-w-[180px] truncate">
                        {JSON.stringify(l.input_data)}
                      </td>
                      <td className="py-2.5 px-3 text-white font-bold">
                        {JSON.stringify(l.prediction_output)}
                      </td>
                      <td className="py-2.5 px-3">
                        {l.actual_label !== undefined && l.actual_label !== null ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                            {JSON.stringify(l.actual_label)}
                          </span>
                        ) : (
                          <span className="text-gray-500 italic">Pending</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-gray-300 flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-indigo-400" />
                        <span>{l.latency_ms} ms</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 font-sans text-xs">
                      No prediction logs recorded yet. Use the Prediction Playground on model pages to generate logs.
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
