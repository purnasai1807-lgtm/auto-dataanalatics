import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Database, Download, RefreshCcw, Sparkles } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import UploadPanel from "../components/upload/UploadPanel";
import FilterBar from "../components/dashboard/FilterBar";
import KpiGrid from "../components/dashboard/KpiGrid";
import ChartsGrid from "../components/dashboard/ChartsGrid";
import ModelPanel from "../components/ml/ModelPanel";
import ChatPanel, { ChatMessage } from "../components/chat/ChatPanel";
import ReportsPanel from "../components/reports/ReportsPanel";
import {
  api,
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  setStoredUser,
} from "../api/client";
import {
  ChatResponse,
  DashboardResponse,
  DatasetDetail,
  DatasetSummary,
  ModelRun,
  ReportItem,
  User,
} from "../api/types";
import { useTheme } from "../hooks/useTheme";
import { useDatasetSocket } from "../hooks/useDatasetSocket";
import { formatCurrency, formatDate, formatNumber } from "../utils/format";
const initialFilters = {
  date_from: "",
  date_to: "",
  country: "",
  category: "",
  product_line: "",
};
function WorkspacePage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const token = getStoredToken();
  const [user, setUser] = useState<User | null>(getStoredUser<User>());
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [datasetDetail, setDatasetDetail] = useState<DatasetDetail | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [modelRuns, setModelRuns] = useState<ModelRun[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [filters, setFilters] = useState(initialFilters);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [training, setTraining] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [asking, setAsking] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedTarget, setSelectedTarget] = useState("");
  const [selectedProblemType, setSelectedProblemType] = useState("");
  const [statusText, setStatusText] = useState("Real-time status stream connected");
  const selectedDatasetSummary = useMemo(
    () => datasets.find((dataset) => dataset.id === selectedDatasetId) ?? null,
    [datasets, selectedDatasetId],
  );
  const currentReports = useMemo(
    () => reports.filter((report) => report.dataset_id === selectedDatasetId),
    [reports, selectedDatasetId],
  );
  const hydrateWorkspace = useCallback(async () => {
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const [{ data: me }, { data: datasetList }, { data: reportList }] = await Promise.all([
        api.get<User>("/auth/me"),
        api.get<DatasetSummary[]>("/datasets"),
        api.get<ReportItem[]>("/reports"),
      ]);
      setUser(me);
      setStoredUser(me);
      setDatasets(datasetList);
      setReports(reportList);
      setSelectedDatasetId((current) => current ?? datasetList[0]?.id ?? null);
    } catch {
      clearStoredAuth();
      navigate("/login");
    }
  }, [navigate, token]);
  const fetchDatasetDetail = useCallback(
    async (datasetId: string) => {
      const [{ data: detail }, { data: runs }] = await Promise.all([
        api.get<DatasetDetail>(`/datasets/${datasetId}`),
        api.get<ModelRun[]>(`/ml/datasets/${datasetId}/runs`),
      ]);
      setDatasetDetail(detail);
      setModelRuns(runs);
      if (detail.status === "ready") {
        const params = Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value),
        );
        const { data } = await api.get<DashboardResponse>(`/analytics/${datasetId}/dashboard`, { params });
        setDashboard(data);
      } else {
        setDashboard(null);
      }
    },
    [filters],
  );
  useEffect(() => {
    void hydrateWorkspace();
  }, [hydrateWorkspace]);
  useEffect(() => {
    if (!selectedDatasetId) {
      setDatasetDetail(null);
      setDashboard(null);
      setModelRuns([]);
      return;
    }
    void fetchDatasetDetail(selectedDatasetId);
  }, [fetchDatasetDetail, selectedDatasetId]);
  useEffect(() => {
    if (selectedDatasetId && datasetDetail?.status === "ready") {
      void fetchDatasetDetail(selectedDatasetId);
    }
  }, [filters]);
  useEffect(() => {
    const targetCandidates =
      ((datasetDetail?.profile_json?.semantics as Record<string, any> | undefined)?.target_candidates as string[] | undefined) ?? [];
    if (!selectedTarget && targetCandidates[0]) {
      setSelectedTarget(targetCandidates[0]);
    }
  }, [datasetDetail, selectedTarget]);
  const handleSocketMessage = useCallback(
    (payload: any) => {
      if (payload?.type !== "dataset_status") {
        return;
      }
      setStatusText(`Dataset ${payload.dataset.status} • ${payload.dataset.processing_progress}%`);
      const latestRunStatus = modelRuns[0]?.status ?? null;
      const latestReportStatus = currentReports[0]?.status ?? null;
      const needsRefresh =
        payload.dataset.status !== datasetDetail?.status ||
        payload.dataset.processing_progress !== datasetDetail?.processing_progress ||
        (payload.latest_model_run?.status ?? null) !== latestRunStatus ||
        (payload.latest_report?.status ?? null) !== latestReportStatus;
      if (needsRefresh) {
        void hydrateWorkspace();
        if (selectedDatasetId) {
          void fetchDatasetDetail(selectedDatasetId);
        }
      }
    },
    [
      currentReports,
      datasetDetail?.processing_progress,
      datasetDetail?.status,
      fetchDatasetDetail,
      hydrateWorkspace,
      modelRuns,
      selectedDatasetId,
    ],
  );
  useDatasetSocket({ datasetId: selectedDatasetId, token, onMessage: handleSocketMessage });
  const handleUpload = async (file: File, name: string) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      const { data } = await api.post<{ dataset: DatasetSummary }>("/datasets/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (!event.total) {
            return;
          }
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        },
      });
      setSelectedDatasetId(data.dataset.id);
      await hydrateWorkspace();
    } finally {
      setUploading(false);
      setUploadProgress(100);
    }
  };
  const handleTrain = async () => {
    if (!selectedDatasetId) {
      return;
    }
    setTraining(true);
    try {
      await api.post(`/ml/${selectedDatasetId}/train`, {
        target_column: selectedTarget || null,
        problem_type: selectedProblemType || null,
      });
      await fetchDatasetDetail(selectedDatasetId);
    } finally {
      setTraining(false);
    }
  };
  const handleAsk = async (question: string) => {
    if (!selectedDatasetId) {
      return;
    }
    setChatMessages((current) => [...current, { role: "user", content: question }]);
    setAsking(true);
    try {
      const { data } = await api.post<ChatResponse>(`/chat/${selectedDatasetId}/ask`, { question });
      setChatMessages((current) => [...current, { role: "assistant", content: data.answer, response: data }]);
    } finally {
      setAsking(false);
    }
  };
  const handleGenerateReport = async () => {
    if (!selectedDatasetId) {
      return;
    }
    setGeneratingReport(true);
    try {
      await api.post(`/reports/${selectedDatasetId}/generate`);
      await hydrateWorkspace();
    } finally {
      setGeneratingReport(false);
    }
  };
  const openDownload = async (path: string) => {
    const { data } = await api.get<{ url: string }>(path);
    window.open(data.url, "_blank");
  };
  return (
    <AppShell
      userName={user?.full_name}
      theme={theme}
      onToggleTheme={toggleTheme}
      onLogout={() => {
        clearStoredAuth();
        navigate("/login");
      }}
      statusText={statusText}
    >
      <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
        <motion.aside initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <UploadPanel uploading={uploading} progress={uploadProgress} onUpload={handleUpload} />
          <section className="glass-panel rounded-[28px] p-5 shadow-panel">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="section-title">Dataset History</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Re-open previous analyses and monitor status.
                </p>
              </div>
              <button
                onClick={() => void hydrateWorkspace()}
                className="rounded-2xl border border-slate-300/70 bg-white/80 p-3 text-slate-700 transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200"
              >
                <RefreshCcw className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {datasets.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-300/80 bg-white/60 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/20 dark:text-slate-400">
                  Upload your first dataset to unlock dashboards, models, and chat.
                </div>
              ) : null}
              {datasets.map((dataset) => (
                <button
                  key={dataset.id}
                  onClick={() => {
                    setSelectedDatasetId(dataset.id);
                    setFilters(initialFilters);
                    setChatMessages([]);
                  }}
                  className={`w-full rounded-[24px] border p-4 text-left transition hover:-translate-y-0.5 ${
                    selectedDatasetId === dataset.id
                      ? "border-teal-400 bg-teal-500/10"
                      : "border-slate-200/80 bg-white/65 dark:border-slate-700 dark:bg-slate-950/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-900 dark:text-white">{dataset.name}</div>
                    <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[10px] uppercase tracking-[0.24em] text-white dark:bg-white dark:text-slate-950">
                      {dataset.status}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(dataset.created_at)} • {formatNumber(dataset.processing_progress)}%
                  </div>
                </button>
              ))}
            </div>
          </section>
        </motion.aside>
        <motion.main initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {selectedDatasetSummary ? (
            <>
              <section className="glass-panel rounded-[28px] p-5 shadow-panel">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 dark:bg-white/10 dark:text-slate-300">
                      <Database className="mr-2 h-3.5 w-3.5" />
                      Selected dataset
                    </div>
                    <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                      {selectedDatasetSummary.name}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      {selectedDatasetSummary.original_filename} • {selectedDatasetSummary.status} •{" "}
                      {selectedDatasetSummary.row_count ?? "--"} rows • {selectedDatasetSummary.column_count ?? "--"} columns
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => selectedDatasetId && void openDownload(`/datasets/${selectedDatasetId}/download-cleaned`)}
                      disabled={!datasetDetail?.cleaning_summary || datasetDetail?.status !== "ready"}
                      className="inline-flex items-center rounded-2xl border border-slate-300/70 bg-white/80 px-4 py-3 text-sm font-semibold disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950/40"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Cleaned Data
                    </button>
                    <div className="inline-flex items-center rounded-2xl bg-accent-500/10 px-4 py-3 text-sm font-semibold text-accent-600 dark:bg-accent-500/20 dark:text-accent-400">
                      <Sparkles className="mr-2 h-4 w-4" />
                      {datasetDetail?.status === "ready" ? "AI-ready" : "Processing"}
                    </div>
                  </div>
                </div>
              </section>
              {datasetDetail?.status === "ready" && dashboard ? (
                <>
                  <FilterBar
                    filterOptions={dashboard.filter_options}
                    filters={filters}
                    onChange={(next) => setFilters({ ...initialFilters, ...next })}
                  />
                  <KpiGrid kpis={dashboard.kpis} />
                  <section className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
                    <div className="glass-panel rounded-[28px] p-5 shadow-panel">
                      <h2 className="section-title">AI Insights</h2>
                      <div className="mt-4 space-y-3">
                        {(dashboard.insights ?? []).map((insight, index) => (
                          <div
                            key={index}
                            className="rounded-[24px] border border-slate-200/80 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-950/30"
                          >
                            <div className="font-medium text-slate-900 dark:text-white">
                              {String(insight.title ?? `Insight ${index + 1}`)}
                            </div>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                              {String(insight.detail ?? insight.business_action ?? "Insight available")}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="glass-panel rounded-[28px] p-5 shadow-panel">
                      <h2 className="section-title">Data Quality Summary</h2>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[24px] bg-white/70 p-4 dark:bg-slate-950/30">
                          <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Duplicates Removed</div>
                          <div className="mt-2 font-display text-3xl font-bold text-slate-950 dark:text-white">
                            {formatNumber(datasetDetail.cleaning_summary?.duplicates_removed as number)}
                          </div>
                        </div>
                        <div className="rounded-[24px] bg-white/70 p-4 dark:bg-slate-950/30">
                          <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Columns</div>
                          <div className="mt-2 font-display text-3xl font-bold text-slate-950 dark:text-white">
                            {formatNumber(datasetDetail.column_count)}
                          </div>
                        </div>
                        <div className="rounded-[24px] bg-white/70 p-4 dark:bg-slate-950/30">
                          <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Rows</div>
                          <div className="mt-2 font-display text-3xl font-bold text-slate-950 dark:text-white">
                            {formatNumber(datasetDetail.row_count)}
                          </div>
                        </div>
                        <div className="rounded-[24px] bg-white/70 p-4 dark:bg-slate-950/30">
                          <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Estimated Value</div>
                          <div className="mt-2 font-display text-3xl font-bold text-slate-950 dark:text-white">
                            {formatCurrency((dashboard.kpis?.total_sales as number | null) ?? 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                  <ChartsGrid charts={dashboard.charts} />
                  <ModelPanel
                    dataset={datasetDetail}
                    runs={modelRuns}
                    training={training}
                    selectedTarget={selectedTarget}
                    selectedProblemType={selectedProblemType}
                    onTargetChange={setSelectedTarget}
                    onProblemTypeChange={setSelectedProblemType}
                    onTrain={handleTrain}
                    onDownloadPredictions={(runId) => openDownload(`/ml/runs/${runId}/predictions`)}
                  />
                  <section className="grid gap-4 xl:grid-cols-[1fr,0.95fr]">
                    <ChatPanel messages={chatMessages} loading={asking} onSend={handleAsk} />
                    <ReportsPanel
                      reports={currentReports}
                      generating={generatingReport}
                      onGenerate={handleGenerateReport}
                      onDownload={(reportId) => openDownload(`/reports/${reportId}/download`)}
                    />
                  </section>
                  <section className="glass-panel rounded-[28px] p-5 shadow-panel">
                    <h2 className="section-title">Sample Records</h2>
                    <div className="mt-4 overflow-x-auto rounded-[24px] bg-white/60 p-4 dark:bg-slate-950/30">
                      <table className="min-w-full text-left text-sm">
                        <thead>
                          <tr className="text-slate-500">
                            {(dashboard.sample_rows?.[0] ? Object.keys(dashboard.sample_rows[0]) : []).map((key) => (
                              <th key={key} className="pb-3 pr-4 font-medium uppercase tracking-[0.18em]">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dashboard.sample_rows?.slice(0, 8).map((row, index) => (
                            <tr key={index} className="border-t border-slate-200/70 dark:border-slate-700">
                              {Object.values(row).map((value, cellIndex) => (
                                <td key={cellIndex} className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                                  {String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              ) : (
                <section className="glass-panel rounded-[28px] p-8 shadow-panel">
                  <div className="mx-auto max-w-2xl text-center">
                    <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                      {datasetDetail?.status === "failed" ? "Processing failed" : "Dataset is being prepared"}
                    </h2>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                      The platform is cleaning columns, profiling trends, and generating AI-ready dashboard metadata.
                    </p>
                    <div className="mx-auto mt-6 h-3 max-w-xl rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-mint-500 to-accent-500 transition-all"
                        style={{ width: `${datasetDetail?.processing_progress ?? selectedDatasetSummary.processing_progress}%` }}
                      />
                    </div>
                    {datasetDetail?.error_message ? (
                      <p className="mt-4 text-sm text-red-500">{datasetDetail.error_message}</p>
                    ) : null}
                  </div>
                </section>
              )}
            </>
          ) : (
            <section className="glass-panel rounded-[32px] p-10 text-center shadow-panel">
              <h2 className="font-display text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
                Build your first AI dashboard
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                Upload a business dataset to trigger automated cleaning, dashboard generation, AI insight writing, machine learning, and conversational analytics.
              </p>
            </section>
          )}
        </motion.main>
      </div>
    </AppShell>
  );
}
export default WorkspacePage;
