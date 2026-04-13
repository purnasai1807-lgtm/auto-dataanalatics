import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/insightforge/ProtectedRoute";
import { insightforgeRoutes } from "./lib/routes";

const LandingPage = lazy(() => import("./pages/insightforge/LandingPage"));
const LoginPage = lazy(() => import("./pages/insightforge/LoginPage"));
const SignupPage = lazy(() => import("./pages/insightforge/SignupPage"));
const VerifyEmailPage = lazy(() => import("./pages/insightforge/VerifyEmailPage"));
const DashboardPage = lazy(() => import("./pages/insightforge/DashboardPage"));
const PricingPage = lazy(() => import("./pages/insightforge/PricingPage"));
const ProfilePage = lazy(() => import("./pages/insightforge/ProfilePage"));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-4 py-10 text-slate-700">
      <div className="premium-panel rounded-[28px] px-6 py-5 text-sm font-semibold shadow-soft">
        Loading InsightForge AI...
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to={insightforgeRoutes.landing} replace />} />
        <Route path={insightforgeRoutes.landing} element={<LandingPage />} />
        <Route path="/pricing" element={<Navigate to={insightforgeRoutes.pricing} replace />} />
        <Route path={insightforgeRoutes.pricing} element={<PricingPage />} />
        <Route path="/login" element={<Navigate to={insightforgeRoutes.login} replace />} />
        <Route path={insightforgeRoutes.login} element={<LoginPage />} />
        <Route path="/signup" element={<Navigate to={insightforgeRoutes.signup} replace />} />
        <Route path={insightforgeRoutes.signup} element={<SignupPage />} />
        <Route path={insightforgeRoutes.verifyEmail} element={<VerifyEmailPage />} />
        <Route
          path="/dashboard"
          element={<Navigate to={insightforgeRoutes.dashboard} replace />}
        />
        <Route
          path={insightforgeRoutes.dashboard}
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={<Navigate to={insightforgeRoutes.profile} replace />}
        />
        <Route
          path={insightforgeRoutes.profile}
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/workspace/*" element={<Navigate to={insightforgeRoutes.landing} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
