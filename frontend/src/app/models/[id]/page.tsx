'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Box, ArrowLeft, RotateCcw, ShieldCheck, History, Plus, AlertCircle, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { Model, ModelVersion } from '@/types';
import VersionCompareMatrix from '@/components/VersionCompareMatrix';
import PredictionPlayground from '@/components/PredictionPlayground';

export default function ModelDetailPage() {
  const params = useParams();
  const modelId = params?.id as string;

  const [model, setModel] = useState<Model | null>(null);
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadVersion, setUploadVersion] = useState<string>('1.0');
  const [uploadStage, setUploadStage] = useState<string>('Development');
  const [uploading, setUploading] = useState<boolean>(false);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Please select a model file (.pkl, .joblib, .pt)');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('version', uploadVersion);
      formData.append('stage', uploadStage);

      await api.uploadModelVersion(modelId, formData);
      setActionMessage(`Model artifact '${uploadFile.name}' uploaded successfully as Version ${uploadVersion}!`);
      setShowUploadModal(false);
      setUploadFile(null);
      loadModelData();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const loadModelData = async () => {
    if (!modelId) return;
    try {
      const [mRes, vRes] = await Promise.all([
        api.getModel(modelId),
        api.getModelVersions(modelId),
      ]);
      setModel(mRes);
      setVersions(vRes || []);
    } catch (err) {
      console.error('Failed to load model details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModelData();
  }, [modelId]);

  const handlePromoteVersion = async (versionId: string, stage: string) => {
    try {
      const res = await api.promoteVersion(versionId, { stage, reason: `Manual promotion to ${stage}` });
      setActionMessage(res.message);
      loadModelData();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Promotion failed');
    }
  };

  const handleRollback = async () => {
    if (!confirm('Are you sure you want to rollback the Production model version to the previous stable release?')) return;
    try {
      const res = await api.rollbackModel(modelId);
      setActionMessage(res.message);
      loadModelData();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Rollback failed');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-gray-400">Loading model lineage & details...</div>;
  }

  if (!model) {
    return <div className="p-8 text-center text-xs text-rose-400">Model not found in registry.</div>;
  }

  const latestVersion = versions.length > 0 ? versions[0] : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Link href="/models" className="text-xs text-indigo-400 hover:underline flex items-center space-x-1 font-semibold">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Model Registry</span>
        </Link>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 glass-panel border border-violet-500/20">
          <div>
            <div className="flex items-center space-x-2 text-violet-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Box className="h-4 w-4" />
              <span>{model.framework} • {model.model_type}</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">{model.name}</h1>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl">{model.description || 'No description provided.'}</p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow flex items-center space-x-2 transition"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Model File (.pkl / .joblib)</span>
            </button>

            <button
              onClick={handleRollback}
              disabled={!model.production_version}
              className={`px-4 py-2 rounded-lg font-bold text-xs shadow flex items-center space-x-2 transition ${
                model.production_version
                  ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30'
                  : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
              }`}
              title="Rollback Production deployment to previous stable version"
            >
              <RotateCcw className="h-4 w-4" />
              <span>1-Click Rollback</span>
            </button>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center space-x-2 animate-fade-in">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 glass-panel border border-gray-800 space-y-1">
          <span className="text-[11px] font-semibold text-gray-400 uppercase">Framework</span>
          <div className="text-lg font-bold text-white">{model.framework}</div>
        </div>
        <div className="p-4 glass-panel border border-gray-800 space-y-1">
          <span className="text-[11px] font-semibold text-gray-400 uppercase">Evaluation Threshold</span>
          <div className="text-lg font-bold text-indigo-400 font-mono">
            {model.evaluation_metric} ≥ {model.evaluation_threshold}
          </div>
        </div>
        <div className="p-4 glass-panel border border-gray-800 space-y-1">
          <span className="text-[11px] font-semibold text-gray-400 uppercase">Production Version</span>
          <div className="text-lg font-bold text-emerald-400 font-mono flex items-center space-x-1">
            {model.production_version ? (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>V{model.production_version}</span>
              </>
            ) : (
              <span className="text-gray-500 text-sm">None</span>
            )}
          </div>
        </div>
        <div className="p-4 glass-panel border border-gray-800 space-y-1">
          <span className="text-[11px] font-semibold text-gray-400 uppercase">Registered Versions</span>
          <div className="text-lg font-bold text-violet-400 font-mono">{versions.length} versions</div>
        </div>
      </div>

      {/* Dynamic Prediction Playground */}
      <PredictionPlayground
        modelId={model.id}
        modelName={model.name}
        inputSchema={latestVersion?.input_schema}
        framework={model.framework}
      />

      {/* Version Lineage & Comparison Matrix */}
      <VersionCompareMatrix
        versions={versions}
        evaluationMetric={model.evaluation_metric}
        evaluationThreshold={model.evaluation_threshold}
        onPromote={handlePromoteVersion}
      />

      {/* Upload Model File Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel p-6 max-w-md w-full border border-indigo-500/30 space-y-4">
            <div className="flex items-center space-x-2 text-indigo-400">
              <Upload className="h-5 w-5" />
              <h2 className="text-lg font-bold text-white">Upload Model Artifact (.pkl / .joblib)</h2>
            </div>
            <p className="text-xs text-gray-400">
              Select any trained model file from your computer to register it directly as a new version.
            </p>

            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Select Model File</label>
                <input
                  type="file"
                  required
                  accept=".joblib,.pkl,.pt,.pth,.h5,.onnx"
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 bg-gray-900 rounded-lg border border-gray-800 p-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Version Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1.0, 2.0"
                    value={uploadVersion}
                    onChange={(e) => setUploadVersion(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Target Stage</label>
                  <select
                    value={uploadStage}
                    onChange={(e) => setUploadStage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Development">Development</option>
                    <option value="Staging">Staging</option>
                    <option value="Production">Production</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow flex items-center space-x-2"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{uploading ? 'Uploading...' : 'Upload & Register'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
