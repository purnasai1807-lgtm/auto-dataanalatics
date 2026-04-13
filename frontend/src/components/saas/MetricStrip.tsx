import { Activity, MousePointerClick, Radar, Users } from "lucide-react";
import type { ProjectMetricSnapshot } from "../../api/types";
import { formatNumber } from "../../utils/format";

interface MetricStripProps {
  metrics: ProjectMetricSnapshot;
}

const items = [
  { key: "visitors", label: "Visitors", icon: Users, accent: "text-teal-600 dark:text-teal-300" },
  { key: "sessions", label: "Sessions", icon: Radar, accent: "text-orange-600 dark:text-orange-300" },
  { key: "pageviews", label: "Pageviews", icon: Activity, accent: "text-sky-600 dark:text-sky-300" },
  { key: "events", label: "Tracked events", icon: MousePointerClick, accent: "text-emerald-600 dark:text-emerald-300" },
] as const;

function MetricStrip({ metrics }: MetricStripProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        const value = metrics[item.key];
        return (
          <article key={item.key} className="glass-panel rounded-[28px] p-5 shadow-panel">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                  {item.label}
                </div>
                <div className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
                  {formatNumber(value)}
                </div>
              </div>
              <div className={`rounded-2xl bg-white/80 p-3 dark:bg-white/10 ${item.accent}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default MetricStrip;
