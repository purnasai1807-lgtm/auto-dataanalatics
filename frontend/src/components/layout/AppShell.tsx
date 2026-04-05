import { ReactNode } from "react";
import { Database, LogOut, MoonStar, SunMedium } from "lucide-react";
interface AppShellProps {
  children: ReactNode;
  userName?: string;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onLogout: () => void;
  statusText?: string;
}
function AppShell({ children, userName, theme, onToggleTheme, onLogout, statusText }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--hero-bg)] text-slate-900 transition-colors dark:text-white">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="glass-panel mb-6 rounded-[28px] px-5 py-5 shadow-panel">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-slate-950/90 p-3 text-white dark:bg-white/10">
                <Database className="h-7 w-7" />
              </div>
              <div>
                <p className="font-display text-xs uppercase tracking-[0.35em] text-teal-600 dark:text-teal-300">
                  AI Analytics Workspace
                </p>
                <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                  Auto Data Analytics
                </h1>
                <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                  Upload data, auto-clean it, generate dashboards, train models, and chat with your business metrics in one place.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-2xl border border-white/10 bg-white/60 px-4 py-3 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">
                <div className="font-medium text-slate-900 dark:text-white">{userName ?? "Analyst"}</div>
                <div>{statusText ?? "Real-time data operations online"}</div>
              </div>
              <button
                onClick={onToggleTheme}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/70 px-4 py-3 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:bg-white dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              >
                {theme === "dark" ? <SunMedium className="mr-2 h-4 w-4" /> : <MoonStar className="mr-2 h-4 w-4" />}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
              <button
                onClick={onLogout}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-900"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
export default AppShell;
