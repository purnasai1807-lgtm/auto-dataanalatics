import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Sparkles } from "lucide-react";
import { DatasetDetail, ModelRun } from "../../api/types";
interface ModelPanelProps {
  dataset?: DatasetDetail | null;
  runs: ModelRun[];
  training: boolean;
  selectedTarget: string;
  selectedProblemType: string;
  onTargetChange: (value: string) => void;
  onProblemTypeChange: (value: string) => void;
  onTrain: () => Promise<void>;
  onDownloadPredictions: (runId: string) => Promise<void>;
}
function ModelPanel({
  dataset,
  runs,
  training,
  selectedTarget,
  selectedProblemType,
  onTargetChange,
  onProblemTypeChange,
  onTrain,
  onDownloadPredictions,
}: ModelPanelProps) {
  const latestRun = runs[0];
  const targetCandidates =
    ((dataset?.profile_json?.semantics as Record<string, any> | undefined)?.target_candidates as string[] | undefined) ?? [];
  return (
    <section className="glass-panel rounded-[28px] p-5 shadow-panel">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="section-title">Auto ML Studio</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Run regression or classification pipelines with baseline, Random Forest, and XGBoost comparisons.
          </p>
        </div>
        <div className="inline-flex items-center rounded-full bg-accent-500/10 px-3 py-1 text-xs font-semibold text-accent-600 dark:bg-accent-500/20 dark:text-accent-400">
          <Sparkles className="mr-2 h-3.5 w-3.5" />
          Automated model selection
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr,1fr,auto]">
        <select
          value={selectedTarget}
          onChange={(event) => onTargetChange(event.target.value)}
          className="rounded-2xl border border-slate-300/70 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950/40"
        >
          <option value="">Auto target selection</option>
          {targetCandidates.map((target) => (
            <option key={target} value={target}>
              {target}
            </option>
          ))}
        </select>
        <select
          value={selectedProblemType}
          onChange={(event) => onProblemTypeChange(event.target.value)}
          className="rounded-2xl border border-slate-300/70 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950/40"
        >
          <option value="">Auto detect problem type</option>
          <option value="regression">Regression</option>
          <option value="classification">Classification</option>
        </select>
        <button
          onClick={onTrain}
          disabled={!dataset || training}
          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950"
        >
          {training ? "Training..." : "Run ML"}
        </button>
      </div>
      {latestRun ? (
        <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
          <div className="rounded-[24px] bg-white/65 p-5 dark:bg-slate-950/30">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Latest Run</p>
                <h3 className="mt-1 font-display text-2xl font-bold text-slate-950 dark:text-white">
                  {latestRun.best_model ?? "Queued model"}
                </h3>
              </div>
              {latestRun.predictions_storage_key ? (
                <button
                  onClick={() => onDownloadPredictions(latestRun.id)}
                  className="inline-flex items-center rounded-2xl border border-slate-300/70 bg-white/80 px-4 py-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950/40"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Predictions
                </button>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.entries(latestRun.metrics_json?.metrics ?? {}).map(([key, value]) => (
                <div key={key} className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-950/40">
                  <div className="text-xs uppercase tracking-[0.25em] text-slate-500">{key}</div>
                  <div className="mt-2 font-display text-2xl font-bold text-slate-950 dark:text-white">
                    {String(value)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-500">
                    <th className="pb-3">Model</th>
                    {Object.keys(latestRun.comparison_json?.[0] ?? {})
                      .filter((key) => key !== "model")
                      .map((key) => (
                        <th key={key} className="pb-3 capitalize">
                          {key}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {latestRun.comparison_json.map((row) => (
                    <tr key={row.model as string} className="border-t border-slate-200/60 dark:border-slate-700">
                      <td className="py-3 font-medium text-slate-900 dark:text-white">{row.model as string}</td>
                      {Object.entries(row)
                        .filter(([key]) => key !== "model")
                        .map(([key, value]) => (
                          <td key={key} className="py-3 text-slate-600 dark:text-slate-300">
                            {String(value)}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-[24px] bg-white/65 p-5 dark:bg-slate-950/30">
            <h3 className="section-title">Feature Importance</h3>
            <div className="mt-4 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={latestRun.feature_importance_json} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.25} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="feature" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="importance" fill="#14b8a6" radius={[0, 10, 10, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-[24px] border border-dashed border-slate-300/80 bg-white/60 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/20 dark:text-slate-400">
          No model runs yet. Launch Auto ML after your dataset reaches the ready state.
        </div>
      )}
    </section>
  );
}
export default ModelPanel;
