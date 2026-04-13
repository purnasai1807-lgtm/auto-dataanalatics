import { motion } from "framer-motion";
import { ArrowRight, Sparkles, UserPlus2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { signup, type AuthPayload } from "../../lib/insightforgeApi";
import { getApiErrorMessage } from "../../lib/http";
import { insightforgeRoutes } from "../../lib/routes";

function isAuthPayload(payload: unknown): payload is AuthPayload {
  return Boolean(payload && typeof payload === "object" && "token" in payload);
}

export default function SignupPage() {
  const { applyAuth, token, hydrated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      const payload = await signup(form);

      if (isAuthPayload(payload)) {
        applyAuth(payload);
        navigate(insightforgeRoutes.dashboard, { replace: true });
        return;
      }

      navigate(`${insightforgeRoutes.verifyEmail}?email=${encodeURIComponent(payload.email)}`, {
        replace: true
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to create your account right now."));
    } finally {
      setLoading(false);
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
            Launch in minutes
          </div>
          <h1 className="mt-5 font-display text-5xl font-semibold tracking-tight text-slate-950">
            Create an account and start generating buyer-ready reports
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
            Free accounts include three AI report generations per day, a built-in sample dataset, and premium PDF export so the product feels valuable on the first session.
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
            <UserPlus2 className="h-6 w-6" />
          </div>
          <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-slate-950">Create account</h2>
          <div className="mt-6 space-y-4">
            <input
              placeholder="Full name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-[20px] border border-slate-300/80 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500"
              required
            />
            <input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-[20px] border border-slate-300/80 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="w-full rounded-[20px] border border-slate-300/80 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500"
              required
            />
          </div>
          <div className="mt-4 text-sm leading-6 text-slate-500">
            New accounts may require email verification before the first sign-in.
          </div>
          {error ? <div className="mt-4 rounded-[20px] border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div> : null}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center rounded-[20px] bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
          <p className="mt-5 text-sm text-slate-500">
            Already have an account?{" "}
            <Link to={insightforgeRoutes.login} className="font-semibold text-slate-950">
              Sign in
            </Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
}
