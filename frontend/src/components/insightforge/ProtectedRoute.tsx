import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { insightforgeRoutes } from "../../lib/routes";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { hydrated, token } = useAuth();
  const location = useLocation();

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-4">
        <div className="premium-panel rounded-[32px] px-6 py-5 text-sm font-semibold text-slate-600 shadow-soft">
          Loading InsightForge AI...
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to={insightforgeRoutes.login} replace state={{ from: location.pathname }} />;
  }

  return children;
}
