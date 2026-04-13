import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Database, LogOut, MoonStar, Sparkles, SunMedium } from "lucide-react";

interface SaaSShellProps {
  children: ReactNode;
  userName?: string;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onLogout: () => void;
  statusText?: string;
}

function SaaSShell({ children, userName, theme, onToggleTheme, onLogout, statusText }: SaaSShellProps) {
  return (
    <div className="min-h-screen bg-[var(--hero-bg)] text-slate-900 transition-colors dark:text-white">
      <div className="mx-auto max-w-[1560px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="glass-panel relative overflow-hidden rounded-[32px] px-5 py-6 shadow-panel">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(13,148,136,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.18),transparent_24%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-700 dark:bg-white/10 dark:text-slate-200">
                <Sparkles className="mr-2 h-3.5 w-3.5 text-teal-600 dark:text-teal-300" />
                Premium Web Analytics SaaS
              </div>
              <div className="mt-4 flex items-center gap-4">
                <div className="rounded-[22px] bg-slate-950 p-3 text-white dark:bg-white dark:text-slate-950">
                  <BarChart3 className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="font-display text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
                    Revenue-grade analytics control room
                  </h1>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    Launch client projects, install a hosted tracker, monitor traffic in near real time, export reports,
                    and surface AI-style insights from one polished workspace.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
              <div className="rounded-[24px] border border-white/20 bg-white/75 px-4 py-3 text-sm text-slate-700 dark:bg-white/10 dark:text-slate-200">
                <div className="font-semibold text-slate-950 dark:text-white">{userName ?? "Operator"}</div>
                <div>{statusText ?? "Tracking pipeline online"}</div>
              </div>
              <Link
                to="/workspace/studio"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300/70 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-100"
              >
                <Database className="mr-2 h-4 w-4" />
                Dataset Studio
              </Link>
              <button
                onClick={onToggleTheme}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300/70 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-100"
              >
                {theme === "dark" ? <SunMedium className="mr-2 h-4 w-4" /> : <MoonStar className="mr-2 h-4 w-4" />}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
              <button
                onClick={onLogout}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </header>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export default SaaSShell;
