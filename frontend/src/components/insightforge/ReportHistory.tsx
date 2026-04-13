import { FileText } from "lucide-react";
import type { Report } from "../../lib/insightforgeApi";
import { formatDate } from "../../utils/format";

export function ReportHistory({
  reports,
  activeReportId,
  onSelect
}: {
  reports: Report[];
  activeReportId: string | null;
  onSelect: (report: Report) => void;
}) {
  return (
    <section className="premium-panel rounded-[30px] p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">History</p>
          <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950">Saved reports</h3>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-slate-950 text-white">
          <FileText className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {reports.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-300/80 bg-white/70 px-4 py-8 text-sm text-slate-500">
            Your reports will appear here once you upload a dataset or run the sample analysis.
          </div>
        ) : null}

        {reports.map((report) => (
          <button
            key={report.id}
            type="button"
            onClick={() => onSelect(report)}
            className={`w-full rounded-[24px] border p-4 text-left transition ${
              activeReportId === report.id
                ? "border-teal-500 bg-teal-500/10"
                : "border-slate-200/80 bg-white/70 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-semibold text-slate-950">{report.fileName}</h4>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white">
                {report.source}
              </span>
            </div>
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{report.summary}</p>
            <div className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              {formatDate(report.createdAt)}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
