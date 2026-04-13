import { Database, PlayCircle } from "lucide-react";
import type { DatasetPreview } from "../../lib/insightforgeApi";
import { formatNumber } from "../../utils/format";

export function DemoPreviewCard({
  preview,
  loading,
  onRunDemo
}: {
  preview: DatasetPreview | null;
  loading: boolean;
  onRunDemo: () => Promise<void>;
}) {
  return (
    <section className="premium-panel rounded-[30px] p-5 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Sample dataset</p>
          <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950">Explore before uploading</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Show buyers exactly what the product does with a built-in retail dataset and one-click AI analysis.
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-950 text-white">
          <Database className="h-5 w-5" />
        </div>
      </div>

      {preview ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[22px] border border-slate-200/80 bg-white/70 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Rows</div>
            <div className="mt-2 font-display text-3xl font-semibold text-slate-950">
              {formatNumber(preview.metrics.totalRows)}
            </div>
          </div>
          <div className="rounded-[22px] border border-slate-200/80 bg-white/70 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Columns</div>
            <div className="mt-2 font-display text-3xl font-semibold text-slate-950">
              {formatNumber(preview.metrics.totalColumns)}
            </div>
          </div>
          <div className="rounded-[22px] border border-slate-200/80 bg-white/70 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Primary total</div>
            <div className="mt-2 font-display text-3xl font-semibold text-slate-950">
              {formatNumber(preview.metrics.primaryMetricTotal)}
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => void onRunDemo()}
        disabled={loading}
        className="mt-5 inline-flex items-center justify-center rounded-[18px] bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
      >
        <PlayCircle className="mr-2 h-4 w-4" />
        {loading ? "Generating demo report..." : "Run sample analysis"}
      </button>
    </section>
  );
}
