export interface Project {
  id: string;
  name: string;
  description?: string;
  organization_id?: string;
  created_by_id?: string;
  created_at: string;
  model_count?: number;
  experiment_count?: number;
  active_deployments?: number;
}

export interface Model {
  id: string;
  name: string;
  description?: string;
  framework: string;
  model_type: string;
  project_id: string;
  evaluation_metric: string;
  evaluation_threshold: number;
  created_at: string;
  latest_version?: string;
  production_version?: string;
}

export interface ModelVersion {
  id: string;
  model_id: string;
  version: string;
  artifact_path: string;
  input_schema?: Record<string, any>;
  output_schema?: Record<string, any>;
  dependencies?: Record<string, any>;
  stage: 'Development' | 'Testing' | 'Staging' | 'Production' | 'Archived';
  metrics?: Record<string, number>;
  parameters?: Record<string, any>;
  dataset_version_id?: string;
  experiment_id?: string;
  status: string;
  created_at: string;
}

export interface Experiment {
  id: string;
  name: string;
  project_id: string;
  model_name: string;
  framework: string;
  dataset_version?: string;
  parameters?: Record<string, any>;
  metrics?: Record<string, number>;
  training_duration_seconds?: number;
  mlflow_run_id?: string;
  notes?: string;
  created_at: string;
}

export interface Deployment {
  id: string;
  project_id: string;
  model_version_id: string;
  deployment_name: string;
  status: string;
  endpoint_url: string;
  created_at: string;
  model_version?: ModelVersion;
}

export interface PredictionLog {
  id: string;
  deployment_id: string;
  model_version_id: string;
  input_data: any;
  prediction_output: any;
  latency_ms: number;
  actual_label?: any;
  created_at: string;
}

export interface DriftEvent {
  id: string;
  model_version_id: string;
  feature_name: string;
  drift_score: number;
  p_value?: number;
  drift_detected: boolean;
  details?: Record<string, any>;
  status: 'Open' | 'Acknowledged' | 'Resolved' | 'RetrainingTriggered';
  created_at: string;
}

export interface DashboardMetrics {
  total_projects: number;
  registered_models: number;
  total_experiments: number;
  production_models: number;
  active_deployments: number;
  open_drift_alerts: number;
}
