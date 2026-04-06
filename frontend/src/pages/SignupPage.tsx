import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api, getApiErrorMessage, setStoredToken, setStoredUser } from "../api/client";
import { TokenResponse } from "../api/types";
function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("Analytics Leader");
  const [email, setEmail] = useState("demo@analytics.io");
  const [password, setPassword] = useState("DemoPass123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      const { data } = await api.post<TokenResponse>("/auth/signup", {
        full_name: fullName,
        email,
        password,
      });
      setStoredToken(data.access_token);
      setStoredUser(data.user);
      navigate("/workspace");
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, "Signup failed"));
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
        <p className="font-display text-xs uppercase tracking-[0.35em] text-orange-600 dark:text-orange-300">
          Create workspace
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
          Launch your analytics control room
        </h1>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Full name"
            className="w-full rounded-2xl border border-slate-300/70 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950/40"
          />
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
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link className="font-semibold text-orange-600 dark:text-orange-300" to="/login">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
export default SignupPage;
