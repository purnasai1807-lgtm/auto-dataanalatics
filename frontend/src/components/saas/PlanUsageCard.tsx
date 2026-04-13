import { CheckCircle2, Layers3, Rocket, Users } from "lucide-react";
import type { WorkspaceSummary } from "../../api/types";
import { formatCurrency, formatNumber } from "../../utils/format";

interface PlanUsageCardProps {
  summary: WorkspaceSummary | null;
  changingPlan: boolean;
  onChangePlan: (planKey: "starter" | "growth" | "scale") => void;
}

const planIcons = {
  starter: Layers3,
  growth: Rocket,
  scale: Users,
} as const;

const planOrder: Array<"starter" | "growth" | "scale"> = ["starter", "growth", "scale"];

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
        <span>{label}</span>
        <span className="font-semibold text-slate-900 dark:text-white">
          {formatNumber(used)} / {formatNumber(limit)}
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-2 rounded-full bg-gradient-to-r from-teal-600 to-orange-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function PlanUsageCard({ summary, changingPlan, onChangePlan }: PlanUsageCardProps) {
  if (!summary) {
    return null;
  }
  return (
    <section className="glass-panel rounded-[30px] p-5 shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Billing-ready plans</p>
      <h3 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
        {summary.plan.label} plan
      </h3>
      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
        Workspace role: <span className="font-semibold text-slate-900 dark:text-white">{summary.role}</span> | Suggested price {formatCurrency(summary.plan.monthly_price_usd)}
        /month
      </p>

      <div className="mt-5 space-y-4">
        <UsageBar label="Projects" used={summary.usage.projects_used} limit={summary.usage.projects_limit} />
        <UsageBar label="Team seats" used={summary.usage.team_members_used} limit={summary.usage.team_members_limit} />
        <UsageBar label="Monthly events" used={summary.usage.monthly_events_used} limit={summary.usage.monthly_event_limit} />
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-3">
        {planOrder.map((planKey) => {
          const isCurrent = summary.plan.key === planKey;
          const Icon = planIcons[planKey];
          return (
            <button
              key={planKey}
              onClick={() => onChangePlan(planKey)}
              disabled={summary.role !== "owner" || isCurrent || changingPlan}
              className={`rounded-[24px] border p-4 text-left transition ${
                isCurrent
                  ? "border-teal-400 bg-teal-500/10"
                  : "border-slate-200/80 bg-white/75 dark:border-slate-700 dark:bg-slate-950/30"
              } disabled:cursor-not-allowed disabled:opacity-70`}
            >
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                {isCurrent ? <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-300" /> : null}
              </div>
              <div className="mt-3 font-semibold capitalize text-slate-900 dark:text-white">{planKey}</div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {planKey === "starter" ? "Best for solo launches" : planKey === "growth" ? "Best for agencies" : "Best for premium SaaS teams"}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
        {summary.plan.features.map((feature) => (
          <div key={feature} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600 dark:text-emerald-300" />
            <span>{feature}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default PlanUsageCard;
