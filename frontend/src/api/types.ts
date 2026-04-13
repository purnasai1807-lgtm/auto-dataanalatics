export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  plan_key: string;
  billing_status: string;
  created_at: string;
}
export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}
export interface DemoAuthResponse extends TokenResponse {
  message: string;
  demo_dataset: DatasetSummary;
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
export interface SalesInquiryCreateRequest {
  full_name: string;
  email: string;
  company: string;
  package_name: string;
  budget_band: string;
  use_case: string;
  source?: string;
}
export interface SalesInquiryCreateResponse {
  inquiry_id: string;
  estimated_value_usd: number | null;
  message: string;
}
export interface SalesInquiryUpdateRequest {
  status?: string;
  notes?: string | null;
  last_contacted_at?: string | null;
}
export interface SalesInquiry {
  id: string;
  full_name: string;
  email: string;
  company: string;
  package_name: string;
  budget_band: string;
  use_case: string;
  estimated_value_usd: number | null;
  status: string;
  source: string;
  notes: string | null;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
}
export interface AdminTotals {
  users: number;
  active_users: number;
  datasets: number;
  ready_datasets: number;
  processing_datasets: number;
  failed_datasets: number;
  model_runs: number;
  completed_model_runs: number;
  reports: number;
  completed_reports: number;
}
export interface AdminRuntimeSummary {
  environment: string;
  task_backend: string;
  storage_backend: string;
  demo_mode_enabled: boolean;
  admin_console_enabled: boolean;
  degraded: boolean;
  warnings: string[];
}
export interface AdminSalesSummary {
  inquiries: number;
  new: number;
  qualified: number;
  proposal_sent: number;
  won: number;
  pipeline_value_usd: number;
}
export interface AdminUserSnapshot {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  datasets: number;
  model_runs: number;
  reports: number;
  last_activity_at: string | null;
}
export interface AdminInquirySnapshot {
  id: string;
  full_name: string;
  email: string;
  company: string;
  package_name: string;
  budget_band: string;
  use_case: string;
  estimated_value_usd: number | null;
  status: string;
  source: string;
  created_at: string;
  last_contacted_at: string | null;
}
export interface AdminOverview {
  totals: AdminTotals;
  runtime: AdminRuntimeSummary;
  sales: AdminSalesSummary;
  recent_users: AdminUserSnapshot[];
  top_customers: AdminUserSnapshot[];
  recent_inquiries: AdminInquirySnapshot[];
}
export interface ProjectSummary {
  id: string;
  name: string;
  slug: string;
  site_url: string;
  timezone: string;
  allowed_domains: string[];
  tracking_key: string;
  status: "active" | "paused";
  last_event_at: string | null;
  tracking_status: "live" | "awaiting_install";
  created_at: string;
  updated_at: string;
}
export interface ProjectRead extends ProjectSummary {
  user_id: string;
  description: string | null;
}
export interface ProjectCreateRequest {
  name: string;
  site_url: string;
  description?: string;
  timezone?: string;
  allowed_domains?: string[];
}
export interface ProjectUpdateRequest {
  name?: string;
  site_url?: string;
  description?: string | null;
  timezone?: string;
  allowed_domains?: string[];
  status?: "active" | "paused";
}
export interface TrackingSnippetResponse {
  project_id: string;
  script_url: string;
  ingest_url: string;
  tracking_key: string;
  snippet: string;
  installation_steps: string[];
}
export interface AnalyticsNamedMetric {
  label: string;
  value: number;
}
export interface AnalyticsInsight {
  title: string;
  detail: string;
  severity: "positive" | "warning" | "info";
}
export interface TrackingEventItem {
  id: string;
  project_id: string;
  session_id: string;
  visitor_id: string;
  event_type: "pageview" | "event";
  event_name: string;
  path: string;
  url: string;
  page_title: string | null;
  referrer: string | null;
  referrer_host: string | null;
  browser: string;
  os: string;
  device_type: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  duration_ms: number | null;
  properties_json: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
}
export interface TrafficPoint {
  period: string;
  pageviews: number;
  sessions: number;
  visitors: number;
  events: number;
}
export interface ProjectMetricSnapshot {
  visitors: number;
  sessions: number;
  pageviews: number;
  events: number;
  active_visitors: number;
  bounce_rate: number;
  avg_events_per_session: number;
  conversion_rate: number;
  traffic_growth_percent: number;
}
export interface ProjectDashboardResponse {
  project_id: string;
  project_name: string;
  range: string;
  generated_at: string;
  metrics: ProjectMetricSnapshot;
  time_series: TrafficPoint[];
  top_pages: AnalyticsNamedMetric[];
  top_referrers: AnalyticsNamedMetric[];
  device_breakdown: AnalyticsNamedMetric[];
  event_breakdown: AnalyticsNamedMetric[];
  recent_events: TrackingEventItem[];
  insights: AnalyticsInsight[];
}
export interface WorkspacePlan {
  key: "starter" | "growth" | "scale";
  label: string;
  monthly_price_usd: number;
  max_projects: number;
  max_team_members: number;
  monthly_event_limit: number;
  features: string[];
}
export interface WorkspaceUsage {
  projects_used: number;
  team_members_used: number;
  monthly_events_used: number;
  projects_limit: number;
  team_members_limit: number;
  monthly_event_limit: number;
}
export interface WorkspaceSummary {
  owner_user_id: string;
  owner_name: string;
  role: "owner" | "admin" | "member";
  plan: WorkspacePlan;
  usage: WorkspaceUsage;
}
export interface PlanUpdateRequest {
  plan_key: "starter" | "growth" | "scale";
}
export interface TeamMember {
  id: string;
  owner_user_id: string;
  member_user_id: string;
  member_email: string;
  member_name: string;
  role: "owner" | "admin" | "member";
  status: string;
  accepted_at: string;
  created_at: string;
}
export interface TeamInvitation {
  id: string;
  owner_user_id: string;
  email: string;
  role: "owner" | "admin" | "member";
  invite_token: string;
  status: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}
export interface TeamInvitationCreateRequest {
  email: string;
  role: "owner" | "admin" | "member";
}
export interface TeamInvitationAcceptRequest {
  invite_token: string;
}
