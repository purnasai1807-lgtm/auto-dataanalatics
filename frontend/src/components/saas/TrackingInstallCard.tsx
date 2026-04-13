import { useState } from "react";
import { Check, Copy, KeyRound, RotateCw } from "lucide-react";
import type { TrackingSnippetResponse } from "../../api/types";

interface TrackingInstallCardProps {
  projectName: string;
  snippet: TrackingSnippetResponse | null;
  canRotate: boolean;
  rotating: boolean;
  onRotate: () => void;
}

function TrackingInstallCard({ projectName, snippet, canRotate, rotating, onRotate }: TrackingInstallCardProps) {
  const [copied, setCopied] = useState(false);

  const copySnippet = async () => {
    if (!snippet) {
      return;
    }
    await navigator.clipboard.writeText(snippet.snippet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section className="glass-panel rounded-[30px] p-5 shadow-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
            Tracking Setup
          </p>
          <h3 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            Install on {projectName}
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Copy the hosted script below, paste it into your site head, and call custom events with
            `window.autoAnalytics.track(...)`.
          </p>
        </div>
        {canRotate ? (
          <button
            onClick={onRotate}
            disabled={rotating}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300/70 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-100"
          >
            <RotateCw className="mr-2 h-4 w-4" />
            {rotating ? "Rotating..." : "Rotate key"}
          </button>
        ) : null}
      </div>

      <div className="mt-5 rounded-[24px] bg-slate-950 p-4 text-sm text-slate-100 dark:bg-slate-950">
        <div className="mb-3 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.26em] text-slate-300">
          <KeyRound className="mr-2 h-3.5 w-3.5" />
          Public tracking key
        </div>
        <div className="break-all rounded-[18px] border border-white/10 bg-white/5 px-3 py-3 font-mono text-xs leading-6">
          {snippet?.tracking_key ?? "Generate a project to receive a live tracking key."}
        </div>
        <div className="mt-4 rounded-[18px] border border-white/10 bg-black/20 px-4 py-4 font-mono text-xs leading-7 text-slate-200">
          {snippet?.snippet ?? '<script async src="https://api.example.com/api/v1/tracking/script.js" data-project-key="trk_xxx"></script>'}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-600 dark:text-slate-300">
          {snippet?.installation_steps?.[2] ?? "Use custom events for signup, checkout, booking, or demo requests."}
        </div>
        <button
          onClick={() => void copySnippet()}
          disabled={!snippet}
          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60 dark:bg-white dark:text-slate-950"
        >
          {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? "Copied" : "Copy snippet"}
        </button>
      </div>
    </section>
  );
}

export default TrackingInstallCard;
