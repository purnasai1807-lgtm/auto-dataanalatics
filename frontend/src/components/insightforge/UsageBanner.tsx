import { Crown, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import type { UsageSnapshot } from "../../lib/insightforgeApi";

export function UsageBanner({ usage }: { usage: UsageSnapshot | null }) {
  if (!usage) {
    return null;
  }

  const capped = usage.plan === "free";

  return (
    <section className="rounded-[28px] bg-slate-950 p-5 text-white shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-100">
            {usage.plan === "pro" ? <Crown className="mr-2 h-3.5 w-3.5" /> : <Sparkles className="mr-2 h-3.5 w-3.5" />}
            {usage.plan === "pro" ? "Pro unlocked" : "Free plan"}
          </div>
          <h3 className="mt-3 font-display text-3xl font-semibold tracking-tight">
            {capped
              ? `${usage.reportsRemaining ?? 0} of ${usage.dailyLimit ?? 0} reports remaining today`
              : "Unlimited report generation is active"}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {capped
              ? "Upgrade to Pro to remove daily caps, keep full report history, and monetize this as a premium analytics workflow."
              : "Your workspace is configured for unlimited analysis, PDF exports, and buyer-facing delivery."}
          </p>
        </div>
        {capped ? (
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center rounded-[18px] bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
          >
            Upgrade to Pro
          </Link>
        ) : null}
      </div>
    </section>
  );
}
