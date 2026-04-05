import { FileDown, FilePlus } from "lucide-react";
import { ReportItem } from "../../api/types";
import { formatDate } from "../../utils/format";
interface ReportsPanelProps {
  reports: ReportItem[];
  generating: boolean;
  onGenerate: () => Promise<void>;
  onDownload: (reportId: string) => Promise<void>;
}
function ReportsPanel({ reports, generating, onGenerate, onDownload }: ReportsPanelProps) {
  return (
    <section className="glass-panel rounded-[28px] p-5 shadow-panel">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="section-title">Exports & Reports</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Generate executive PDF reports and keep a history of analytical outputs.
          </p>
        </div>
        <button
          onClick={onGenerate}
          disabled={generating}
          className="inline-flex items-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-50 dark:bg-white dark:text-slate-950"
        >
          <FilePlus className="mr-2 h-4 w-4" />
          {generating ? "Generating..." : "Generate PDF"}
        </button>
      </div>
      <div className="space-y-3">
        {reports.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-300/80 bg-white/60 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/20 dark:text-slate-400">
            No reports yet. Generate a PDF after your analytics dashboard is ready.
          </div>
        ) : null}
        {reports.map((report) => (
          <div
            key={report.id}
            className="flex flex-col gap-3 rounded-[24px] border border-slate-200/80 bg-white/65 p-4 dark:border-slate-700 dark:bg-slate-950/30 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="font-medium text-slate-900 dark:text-white">{report.title}</div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {report.status} • {formatDate(report.created_at)}
              </div>
            </div>
            <button
              onClick={() => onDownload(report.id)}
              disabled={!report.file_storage_key}
              className="inline-flex items-center rounded-2xl border border-slate-300/70 bg-white/80 px-4 py-3 text-sm font-semibold disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950/40"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Download
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
export default ReportsPanel;
