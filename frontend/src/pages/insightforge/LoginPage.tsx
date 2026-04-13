import axios from "axios";
import { motion } from "framer-motion";
import { ArrowRight, LockKeyhole, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { login, resendVerificationEmail } from "../../lib/insightforgeApi";
import { getApiErrorMessage } from "../../lib/http";
import { insightforgeRoutes } from "../../lib/routes";

export default function LoginPage() {
  const { applyAuth, token, hydrated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const showDemoHints = import.meta.env.VITE_SHOW_DEMO_HINTS === "true";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");

  useEffect(() => {
    if (hydrated && token) {
      navigate(insightforgeRoutes.dashboard, { replace: true });
    }
  }, [hydrated, navigate, token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      setNotice("");
      setVerificationEmail("");
      const payload = await login({ email, password });
      applyAuth(payload);
      navigate((location.state as { from?: string } | null)?.from ?? insightforgeRoutes.dashboard, { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to sign in right now."));

      if (axios.isAxiosError(requestError) && requestError.response?.data?.details?.verificationRequired) {
        setVerificationEmail(requestError.response.data.details.email || email);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    if (!verificationEmail) {
      return;
    }

    try {
      setResending(true);
      setError("");
      const response = await resendVerificationEmail(verificationEmail);
      setNotice(response.message);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to resend the verification email right now."));
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[1fr,420px]">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-panel rounded-[34px] p-8 shadow-soft"
        >
          <div className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600">
            <Sparkles className="mr-2 h-3.5 w-3.5 text-teal-700" />
            InsightForge AI
          </div>
          <h1 className="mt-5 font-display text-5xl font-semibold tracking-tight text-slate-950">
            Welcome back to your AI analytics workspace
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
            Sign in to upload datasets, review executive-ready insights, and manage your monetization plan.
          </p>
        </motion.section>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          onSubmit={handleSubmit}
          className="premium-panel rounded-[34px] p-8 shadow-soft"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-slate-950 text-white">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-slate-950">Sign in</h2>
          <div className="mt-6 space-y-4">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-[20px] border border-slate-300/80 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-[20px] border border-slate-300/80 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500"
              required
            />
          </div>
          {error ? <div className="mt-4 rounded-[20px] border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div> : null}
          {notice ? <div className="mt-4 rounded-[20px] border border-emerald-300/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</div> : null}
          {verificationEmail ? (
            <div className="mt-4 rounded-[20px] border border-slate-200/80 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              <div className="font-semibold text-slate-950">Email verification required</div>
              <div className="mt-2">Verify <code>{verificationEmail}</code> to activate your account.</div>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending}
                className="mt-3 inline-flex items-center rounded-[16px] bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
              >
                {resending ? "Sending..." : "Resend verification email"}
              </button>
            </div>
          ) : null}
          {showDemoHints ? (
            <div className="mt-4 rounded-[20px] border border-slate-200/80 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              <div className="font-semibold text-slate-950">Seeded demo accounts</div>
              <div className="mt-2">
                <code>demo@insightforge.ai</code> / <code>InsightForge123!</code>
              </div>
              <div>
                <code>pro@insightforge.ai</code> / <code>InsightForge123!</code>
              </div>
            </div>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center rounded-[20px] bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
          <p className="mt-5 text-sm text-slate-500">
            New to InsightForge AI?{" "}
            <Link to={insightforgeRoutes.signup} className="font-semibold text-slate-950">
              Create an account
            </Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
}
