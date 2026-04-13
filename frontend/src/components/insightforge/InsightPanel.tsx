import { AlertTriangle, ArrowUpRight, Lightbulb } from "lucide-react";
import type { Insight } from "../../lib/insightforgeApi";

const iconBySeverity = {
  info: Lightbulb,
  opportunity: ArrowUpRight,
  warning: AlertTriangle
};

export function InsightPanel({
  summary,
  insights,
  recommendations
}: {
  summary: string;
  insights: Insight[];
  recommendations: string[];
}) {
  return (
    <section className="premium-panel rounded-[30px] p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">AI narrative</p>
      <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950">Executive summary</h3>
      <p className="mt-4 text-sm leading-7 text-slate-600">{summary}</p>

      <div className="mt-6 space-y-3">
        {insights.map((insight) => {
          const Icon = iconBySeverity[insight.severity];
          return (
            <article key={insight.title} className="rounded-[24px] border border-slate-200/80 bg-white/70 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-slate-950 text-white">
                  <Icon className="h-4 w-4" />
                </div>
                <h4 className="font-semibold text-slate-950">{insight.title}</h4>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">{insight.detail}</p>
            </article>
          );
        })}
      </div>

      <div className="mt-6 rounded-[24px] bg-slate-950 p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Recommended actions</p>
        <div className="mt-4 space-y-3">
          {recommendations.map((item) => (
            <div key={item} className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-200">
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
