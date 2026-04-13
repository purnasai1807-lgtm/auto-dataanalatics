import { BarChart3, CreditCard, Home, LogOut, Settings, Sparkles } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { insightforgeRoutes } from "../../lib/routes";

const navItems = [
  { to: insightforgeRoutes.dashboard, label: "Dashboard", icon: BarChart3 },
  { to: insightforgeRoutes.pricing, label: "Pricing", icon: CreditCard },
  { to: insightforgeRoutes.profile, label: "Profile", icon: Settings }
];

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="premium-panel flex h-full flex-col rounded-[32px] p-5 shadow-soft">
      <NavLink to={insightforgeRoutes.landing} className="flex items-center gap-3 rounded-[24px] border border-white/60 bg-white/70 px-4 py-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-slate-950 text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">InsightForge AI</div>
          <div className="font-display text-xl font-semibold text-slate-950">Revenue dashboard</div>
        </div>
      </NavLink>

      <nav className="mt-6 space-y-2">
        <NavLink
          to={insightforgeRoutes.landing}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-[20px] px-4 py-3 text-sm font-semibold transition ${
              isActive ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-white/70"
            }`
          }
        >
          <Home className="h-4 w-4" />
          Home
        </NavLink>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-[20px] px-4 py-3 text-sm font-semibold transition ${
                  isActive ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-white/70"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[28px] bg-slate-950 p-5 text-white">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Account</p>
        <h3 className="mt-3 font-display text-2xl font-semibold">{user?.name ?? "Guest"}</h3>
        <p className="mt-1 text-sm text-slate-300">{user?.email ?? "Sign in to continue"}</p>
        <div className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-100">
          {user?.plan === "pro" ? "Pro plan" : "Free plan"}
        </div>
        <button
          type="button"
          onClick={logout}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[18px] border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
