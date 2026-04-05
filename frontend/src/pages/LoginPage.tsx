import { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api, setStoredToken, setStoredUser } from "../api/client";
import { TokenResponse } from "../api/types";
function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("demo@analytics.io");
  const [password, setPassword] = useState("DemoPass123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      const { data } = await api.post<TokenResponse>("/auth/login", { email, password });
      setStoredToken(data.access_token);
      setStoredUser(data.user);
      navigate("/workspace");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--hero-bg)] px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel w-full max-w-md rounded-[32px] p-8 shadow-panel"
      >
        <p className="font-display text-xs uppercase tracking-[0.35em] text-teal-600 dark:text-teal-300">
          Welcome back
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
          Sign in to your AI analytics hub
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          Use your account to manage datasets, dashboards, chat insights, and reports.
        </p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder="Email"
            className="w-full rounded-2xl border border-slate-300/70 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950/40"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="Password"
            className="w-full rounded-2xl border border-slate-300/70 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950/40"
          />
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-50 dark:bg-white dark:text-slate-950"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          Need an account?{" "}
          <Link className="font-semibold text-teal-600 dark:text-teal-300" to="/signup">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
export default LoginPage;
