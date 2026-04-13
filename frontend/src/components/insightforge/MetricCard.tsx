import type { LucideIcon } from "lucide-react";

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}) {
  return (
    <article className="premium-panel rounded-[28px] p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{label}</div>
        <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-slate-950 text-white">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4 font-display text-4xl font-semibold tracking-tight text-slate-950">{value}</div>
      <p className="mt-2 text-sm text-slate-500">{hint}</p>
    </article>
  );
}
