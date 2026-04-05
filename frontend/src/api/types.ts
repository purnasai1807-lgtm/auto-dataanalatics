export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}
export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}
export interface DatasetSummary {
  id: string;
  name: string;
  original_filename: string;
  status: string;
  size_bytes: number;
  row_count: number | null;
  column_count: number | null;
  processing_progress: number;
  created_at: string;
}
export interface DatasetDetail extends DatasetSummary {
  user_id: string;
  file_type: string;
  schema_json: { columns?: Array<Record<string, unknown>> };
  profile_json: Record<string, unknown>;
  cleaning_summary: Record<string, unknown>;
  ai_insights: Array<Record<string, unknown>>;
  sample_rows: Array<Record<string, unknown>>;
  error_message: string | null;
  updated_at: string;
}
export interface DashboardResponse {
  dataset_id: string;
  filters: Record<string, unknown>;
  semantics: Record<string, unknown>;
  kpis: Record<string, number | string | null>;
  charts: Record<string, any>;
  filter_options: Record<string, any>;
  insights: Array<Record<string, any>>;
  sample_rows: Array<Record<string, any>>;
}
export interface ModelRun {
  id: string;
  dataset_id: string;
  target_column: string | null;
  problem_type: string | null;
  best_model: string | null;
  status: string;
  metrics_json: Record<string, any>;
  comparison_json: Array<Record<string, any>>;
  feature_importance_json: Array<Record<string, any>>;
  predictions_storage_key: string | null;
  model_storage_key: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}
export interface ChatResponse {
  answer: string;
  query_plan: Record<string, any>;
  visualization_hint?: Record<string, any> | null;
  tabular_result?: Array<Record<string, any>> | null;
}
export interface ReportItem {
  id: string;
  dataset_id: string | null;
  title: string;
  report_type: string;
  status: string;
  file_storage_key: string | null;
  snapshot_json: Record<string, any>;
  error_message: string | null;
  created_at: string;
}
