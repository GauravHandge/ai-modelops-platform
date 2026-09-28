'use client';

import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, AlertCircle, Clock, Cpu, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';

interface PredictionPlaygroundProps {
  modelId: string;
  modelName: string;
  inputSchema?: Record<string, any>;
  framework: string;
}

export default function PredictionPlayground({
  modelId,
  modelName,
  inputSchema,
  framework
}: PredictionPlaygroundProps) {
  const [inputMode, setInputMode] = useState<'form' | 'json'>('form');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [jsonData, setJsonData] = useState<string>('{}');
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const features = inputSchema?.features || [];

  useEffect(() => {
    // Populate default form data based on features
    const initialForm: Record<string, any> = {};
    if (features.length > 0) {
      features.forEach((feat: any) => {
        if (typeof feat === 'object' && feat.name) {
          if (feat.type === 'int') initialForm[feat.name] = 30;
          else if (feat.type === 'float') initialForm[feat.name] = 50.0;
          else initialForm[feat.name] = 'sample';
        }
      });
    } else {
      // Default fallback for tabular models
      initialForm['age'] = 32;
      initialForm['tenure_months'] = 12;
      initialForm['monthly_charges'] = 65.5;
      initialForm['num_support_tickets'] = 1;
    }
    setFormData(initialForm);
    setJsonData(JSON.stringify(initialForm, null, 2));
  }, [inputSchema]);

  const handleInputChange = (name: string, value: any, type?: string) => {
    const parsedVal = type === 'int' ? parseInt(value) || 0 : type === 'float' ? parseFloat(value) || 0.0 : value;
    const updated = { ...formData, [name]: parsedVal };
    setFormData(updated);
    setJsonData(JSON.stringify(updated, null, 2));
  };

  const handleRunPrediction = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const payload = inputMode === 'form' ? formData : JSON.parse(jsonData);
      const res = await api.predictModel(modelId, payload);
      setResponse(res);
    } catch (err: any) {
      setError(err.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 border border-gray-800 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Dynamic Prediction Playground</h3>
            <p className="text-xs text-gray-400">Live API test bench for {modelName} ({framework})</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-gray-900/80 p-1 rounded-lg border border-gray-800">
          <button
            onClick={() => setInputMode('form')}
            className={`px-3 py-1 rounded text-xs font-semibold transition ${
              inputMode === 'form' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Form Fields
          </button>
          <button
            onClick={() => setInputMode('json')}
            className={`px-3 py-1 rounded text-xs font-semibold transition ${
              inputMode === 'json' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Raw JSON Payload
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Input Data Payload</label>
            <span className="text-[11px] text-indigo-400 font-mono">Dynamic Contract Validation</span>
          </div>

          {inputMode === 'form' ? (
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
              {Object.keys(formData).length > 0 ? (
                Object.entries(formData).map(([key, val]) => (
                  <div key={key} className="flex flex-col space-y-1">
                    <span className="text-xs font-semibold text-gray-300 font-mono">{key}</span>
                    <input
                      type={typeof val === 'number' ? 'number' : 'text'}
                      value={val}
                      onChange={(e) => handleInputChange(key, e.target.value, typeof val === 'number' ? 'float' : 'text')}
                      className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-400 py-4 text-center">No schema features defined. Switch to Raw JSON Payload.</div>
              )}
            </div>
          ) : (
            <textarea
              rows={10}
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-900 border border-gray-800 text-xs text-emerald-400 font-mono focus:outline-none focus:border-indigo-500"
            />
          )}

          <button
            onClick={handleRunPrediction}
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Executing Inference...</span>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>Execute Prediction</span>
              </>
            )}
          </button>
        </div>

        {/* Prediction Results */}
        <div className="space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Inference Response</label>
          
          <div className="min-h-[280px] p-4 rounded-lg bg-gray-950 border border-gray-800 flex flex-col justify-between">
            {error ? (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            ) : response ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400">Inference Successful</span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs font-mono text-gray-400">
                    <span className="flex items-center space-x-1">
                      <Clock className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{response.latency_ms} ms</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300">
                      V{response.model_version}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-gray-400 uppercase font-semibold">Prediction Result</span>
                  <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-2xl font-black text-white font-mono">
                    {JSON.stringify(response.prediction)}
                  </div>
                </div>

                {response.probabilities && (
                  <div className="space-y-2">
                    <span className="text-xs text-gray-400 uppercase font-semibold">Class Probabilities</span>
                    <div className="p-3 rounded-lg bg-gray-900/60 border border-gray-800 space-y-2 text-xs font-mono">
                      {Array.isArray(response.probabilities) ? (
                        response.probabilities.map((prob: number, idx: number) => (
                          <div key={idx} className="flex items-center justify-between space-x-2">
                            <span className="text-gray-400">Class {idx}</span>
                            <div className="flex-1 mx-3 h-2 rounded-full bg-gray-800 overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${Math.min(100, prob * 100)}%` }}
                              />
                            </div>
                            <span className="text-indigo-400 font-bold">{(prob * 100).toFixed(1)}%</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-300">{JSON.stringify(response.probabilities)}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-12 text-center text-gray-500 space-y-2">
                <Cpu className="h-8 w-8 text-gray-700" />
                <p className="text-xs">Click "Execute Prediction" to trigger dynamic model adapter inference.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
