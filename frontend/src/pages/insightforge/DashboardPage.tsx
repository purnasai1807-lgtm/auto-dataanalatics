import { motion } from "framer-motion";
import {
  Activity,
  ChartColumnBig,
  Download,
  FileText,
  Gauge,
  TrendingUp
} from "lucide-react";
import { startTransition, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChartCard } from "../../components/insightforge/ChartCard";
import { DemoPreviewCard } from "../../components/insightforge/DemoPreviewCard";
import { FileDropzone } from "../../components/insightforge/FileDropzone";
import { InsightPanel } from "../../components/insightforge/InsightPanel";
import { MetricCard } from "../../components/insightforge/MetricCard";
import { ReportHistory } from "../../components/insightforge/ReportHistory";
import { SetupChecklist } from "../../components/insightforge/SetupChecklist";
import { UsageBanner } from "../../components/insightforge/UsageBanner";
import { WorkspaceLayout } from "../../components/insightforge/WorkspaceLayout";
import { useAuth } from "../../context/AuthContext";
import {
  analyzeDemoDataset,
  analyzeUploadedFile,
  downloadReportPdf,
  getDashboardOverview,
  getDemoPreview,
  getReports,
  type DashboardOverview,
  type DatasetPreview,
  type Report
} from "../../lib/insightforgeApi";
import { getApiErrorMessage, hasUpgradeRequired } from "../../lib/http";
import { insightforgeRoutes } from "../../lib/routes";
import { formatNumber } from "../../utils/format";

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function DashboardPage() {
  const { refreshAuth, usage, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [preview, setPreview] = useState<DatasetPreview | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [upgradePrompt, setUpgradePrompt] = useState("");
  const [pdfExported, setPdfExported] = useState(
    () => window.localStorage.getItem("insightforge-pdf-exported") === "true"
  );

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? reports[0] ?? null,
    [reports, selectedReportId]
  );

  const billingState = searchParams.get("billing");
  const hasUploadedReport = reports.some((report) => report.source === "upload");

  async function loadWorkspace() {
    try {
      setLoading(true);
      setError("");
      const [nextOverview, nextReports, nextPreview] = await Promise.all([
        getDashboardOverview(),
        getReports(),
        getDemoPreview()
      ]);
      setOverview(nextOverview);
      setReports(nextReports);
      setPreview(nextPreview);
      startTransition(() => {
        setSelectedReportId((current) => current ?? nextReports[0]?.id ?? null);
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to load your dashboard right now."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadWorkspace();
  }, []);

  async function handleAnalyze(file: File) {
    try {
      setAnalyzing(true);
      setUpgradePrompt("");
      setError("");
      const report = await analyzeUploadedFile(file);
      await refreshAuth();
      setReports((current) => [report, ...current]);
      setSelectedReportId(report.id);
      const nextOverview = await getDashboardOverview();
      setOverview(nextOverview);
    } catch (requestError) {
      if (hasUpgradeRequired(requestError)) {
        setUpgradePrompt("You reached the free plan limit of 3 reports today. Upgrade to Pro to keep analyzing without interruption.");
      } else {
        setError(getApiErrorMessage(requestError, "The dataset could not be analyzed."));
      }
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleRunDemo() {
    try {
      setAnalyzing(true);
      setUpgradePrompt("");
      setError("");
      const report = await analyzeDemoDataset();
      await refreshAuth();
      setReports((current) => [report, ...current]);
      setSelectedReportId(report.id);
      const nextOverview = await getDashboardOverview();
      setOverview(nextOverview);
    } catch (requestError) {
      if (hasUpgradeRequired(requestError)) {
        setUpgradePrompt("Your free report quota is exhausted for today. Upgrade to Pro to unlock unlimited report generation.");
      } else {
        setError(getApiErrorMessage(requestError, "The sample dataset could not be analyzed."));
      }
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleDownloadPdf() {
    if (!selectedReport) {
      return;
    }

    try {
      setDownloading(true);
      const blob = await downloadReportPdf(selectedReport.id);
      saveBlob(blob, `${selectedReport.fileName.replace(/\.[^/.]+$/, "")}-insightforge-report.pdf`);
      window.localStorage.setItem("insightforge-pdf-exported", "true");
      setPdfExported(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "The PDF export could not be generated."));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <WorkspaceLayout>
      <div className="space-y-4">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-panel rounded-[34px] p-7 shadow-soft"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Dashboard</p>
              <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                AI-powered analytics your buyers can launch today
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Upload spreadsheets, generate insights instantly, and package the results into a premium report workflow that feels ready to sell.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              disabled={!selectedReport || downloading}
              className="inline-flex items-center justify-center rounded-[20px] bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              <Download className="mr-2 h-4 w-4" />
              {downloading ? "Exporting..." : "Export report"}
            </button>
          </div>
        </motion.section>

        <UsageBanner usage={usage ?? overview?.usage ?? null} />

        {billingState === "success" ? (
          <section className="rounded-[26px] border border-emerald-300/80 bg-emerald-50 px-5 py-4 text-sm text-emerald-900 shadow-soft">
            Pro billing is active. Your workspace now has unlimited report generation.
          </section>
        ) : null}

        {billingState === "cancelled" ? (
          <section className="rounded-[26px] border border-amber-300/80 bg-amber-50 px-5 py-4 text-sm text-amber-900 shadow-soft">
            Checkout was cancelled. Your free workspace is still active and ready to use.
          </section>
        ) : null}

        {upgradePrompt ? (
          <section className="rounded-[26px] border border-amber-300/80 bg-amber-50 px-5 py-4 text-sm text-amber-900 shadow-soft">
            {upgradePrompt}{" "}
            <Link to={insightforgeRoutes.pricing} className="font-semibold underline">
              Upgrade now
            </Link>
          </section>
        ) : null}

        {error ? (
          <section className="rounded-[26px] border border-rose-300/80 bg-rose-50 px-5 py-4 text-sm text-rose-900 shadow-soft">
            {error}
          </section>
        ) : null}

        {loading ? (
          <section className="premium-panel rounded-[34px] p-8 text-sm text-slate-600 shadow-soft">
            Loading your SaaS workspace...
          </section>
        ) : null}

        {!loading ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Reports created"
                value={formatNumber(overview?.stats.totalReportsGenerated ?? 0)}
                hint="Strong value signal for buyers and teams"
                icon={FileText}
              />
              <MetricCard
                label="Saved reports"
                value={formatNumber(overview?.stats.totalReports ?? 0)}
                hint="Available in dashboard history"
                icon={ChartColumnBig}
              />
              <MetricCard
                label="Rows analyzed"
                value={formatNumber(selectedReport?.metrics.totalRows ?? 0)}
                hint="From the active report"
                icon={Gauge}
              />
              <MetricCard
                label="Primary total"
                value={formatNumber(selectedReport?.metrics.primaryMetricTotal ?? 0)}
                hint="Detected from your leading numeric field"
                icon={TrendingUp}
              />
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.3fr,0.7fr]">
              <FileDropzone loading={analyzing} onUpload={handleAnalyze} />
              <DemoPreviewCard preview={preview} loading={analyzing} onRunDemo={handleRunDemo} />
            </section>

            <section className="grid gap-4 xl:grid-cols-[0.68fr,1.32fr]">
              <div className="space-y-4">
                <ReportHistory
                  reports={reports}
                  activeReportId={selectedReport?.id ?? null}
                  onSelect={(report) => setSelectedReportId(report.id)}
                />
                <SetupChecklist
                  hasAnyReport={reports.length > 0}
                  hasUploadedReport={hasUploadedReport}
                  hasExportedPdf={pdfExported}
                  onboardingCompleted={Boolean(user?.onboardingCompleted)}
                  isPro={user?.plan === "pro"}
                />
              </div>

              <div className="space-y-4">
                {overview?.reportTimeline?.length ? (
                  <ChartCard
                    series={{
                      label: "Total reports generated over time",
                      type: "line",
                      data: overview.reportTimeline
                    }}
                  />
                ) : null}

                {selectedReport ? (
                  <InsightPanel
                    summary={selectedReport.summary}
                    insights={selectedReport.insights}
                    recommendations={selectedReport.recommendations}
                  />
                ) : (
                    <section className="premium-panel rounded-[30px] p-8 shadow-soft">
                      <h3 className="font-display text-3xl font-semibold tracking-tight text-slate-950">
                        Start with the sample dataset or your own file
                      </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                      The onboarding path is intentionally simple: run the demo, review the insight narrative, then upload your own data and export the PDF.
                    </p>
                    </section>
                )}

                {overview?.stats.latestSummary ? (
                  <section className="premium-panel rounded-[30px] p-5 shadow-soft">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Latest value signal</p>
                    <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950">
                      Recent executive summary
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-slate-600">{overview.stats.latestSummary}</p>
                  </section>
                ) : null}
              </div>
            </section>

            {selectedReport?.chartData?.length ? (
              <section className="grid gap-4 xl:grid-cols-2">
                {selectedReport.chartData.map((series) => (
                  <ChartCard key={`${selectedReport.id}-${series.label}`} series={series} />
                ))}
              </section>
            ) : null}

            {selectedReport?.sampleRows?.length ? (
              <section className="premium-panel rounded-[30px] p-5 shadow-soft">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Data preview</p>
                    <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950">
                      Sample rows from the active report
                    </h3>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-slate-950 text-white">
                    <Activity className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-5 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200/80 text-slate-500">
                        {Object.keys(selectedReport.sampleRows[0] ?? {}).map((key) => (
                          <th key={key} className="px-3 py-3 font-semibold">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReport.sampleRows.map((row, index) => (
                        <tr key={`${selectedReport.id}-row-${index}`} className="border-b border-slate-100/80">
                          {Object.entries(row).map(([key, value]) => (
                            <td key={`${key}-${index}`} className="px-3 py-3 text-slate-600">
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </WorkspaceLayout>
  );
}
