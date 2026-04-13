import { http } from "./http";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  plan: "free" | "pro";
  reportsUsed: number;
  totalReportsGenerated: number;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface UsageSnapshot {
  plan: "free" | "pro";
  reportsUsed: number;
  reportsRemaining: number | null;
  dailyLimit: number | null;
  totalReportsGenerated: number;
  usageWindowStartedAt: string;
}

export interface AuthPayload {
  token: string;
  user: AuthUser;
  usage: UsageSnapshot;
}

export interface Insight {
  title: string;
  detail: string;
  severity: "info" | "opportunity" | "warning";
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface ChartSeries {
  label: string;
  type: "bar" | "line" | "pie";
  data: ChartPoint[];
}

export interface Report {
  _id?: string;
  id: string;
  fileName: string;
  summary: string;
  insights: Insight[];
  recommendations: string[];
  chartData: ChartSeries[];
  metrics: {
    totalRows?: number;
    totalColumns?: number;
    numericColumns?: number;
    primaryMetricTotal?: number | null;
    primaryMetricAverage?: number | null;
    highestValue?: number | null;
  };
  datasetMeta: {
    columns?: string[];
    detectedDateColumn?: string | null;
    detectedPrimaryMetric?: string | null;
    detectedGroupingColumn?: string | null;
  };
  sampleRows: Array<Record<string, unknown>>;
  source: "upload" | "demo";
  createdAt: string;
}

export interface DatasetPreview {
  fileName: string;
  metrics: Report["metrics"];
  sampleRows: Array<Record<string, unknown>>;
  columnStats: Array<{
    name: string;
    numericCount: number;
    dateCount: number;
    distinctCount: number;
    summary: {
      min: number;
      max: number;
      average: number;
      total: number;
    } | null;
  }>;
  chartData: ChartSeries[];
}

export interface DashboardOverview {
  stats: {
    totalReports: number;
    totalReportsGenerated: number;
    currentPlan: "free" | "pro";
    latestSummary: string;
  };
  usage: UsageSnapshot;
  reportTimeline: ChartPoint[];
  recentReports: Array<{
    id: string;
    fileName: string;
    summary: string;
    createdAt: string;
    source: "upload" | "demo";
  }>;
}

export interface ProfileResponse {
  profile: AuthUser;
  usage: UsageSnapshot;
}

function normalizeReport(report: Report): Report {
  return {
    ...report,
    id: report.id ?? report._id ?? ""
  };
}

export async function signup(payload: { name: string; email: string; password: string }) {
  const { data } = await http.post<AuthPayload>("/auth/signup", payload);
  return data;
}

export async function login(payload: { email: string; password: string }) {
  const { data } = await http.post<AuthPayload>("/auth/login", payload);
  return data;
}

export async function getMe() {
  const { data } = await http.get<{ user: AuthUser; usage: UsageSnapshot }>("/auth/me");
  return data;
}

export async function getDashboardOverview() {
  const { data } = await http.get<DashboardOverview>("/dashboard/overview");
  return data;
}

export async function getReports() {
  const { data } = await http.get<{ reports: Report[] }>("/reports");
  return data.reports.map(normalizeReport);
}

export async function getReport(reportId: string) {
  const { data } = await http.get<{ report: Report }>(`/reports/${reportId}`);
  return normalizeReport(data.report);
}

export async function getDemoPreview() {
  const { data } = await http.get<DatasetPreview>("/reports/demo/preview");
  return data;
}

export async function analyzeDemoDataset() {
  const { data } = await http.post<{ report: Report }>("/reports/demo/analyze");
  return normalizeReport(data.report);
}

export async function analyzeUploadedFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await http.post<{ report: Report }>("/reports/analyze", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return normalizeReport(data.report);
}

export async function downloadReportPdf(reportId: string) {
  const { data } = await http.get<Blob>(`/reports/${reportId}/pdf`, {
    responseType: "blob"
  });
  return data;
}

export async function getProfile() {
  const { data } = await http.get<ProfileResponse>("/profile");
  return data;
}

export async function updateProfile(payload: { name?: string; onboardingCompleted?: boolean }) {
  const { data } = await http.patch<ProfileResponse>("/profile", payload);
  return data;
}

export async function createCheckoutSession(returnUrl?: string) {
  const { data } = await http.post<{ url: string }>("/billing/checkout-session", returnUrl ? { returnUrl } : {});
  return data;
}

export async function createPortalSession(returnUrl?: string) {
  const { data } = await http.post<{ url: string }>("/billing/portal-session", returnUrl ? { returnUrl } : {});
  return data;
}
