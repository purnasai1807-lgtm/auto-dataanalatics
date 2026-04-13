import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { api, getApiErrorMessage } from "../api/client";
import { DemoAuthResponse, TokenResponse } from "../api/types";
import { applyAuthSession } from "../utils/session";
function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [launchingDemo, setLaunchingDemo] = useState(false);
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
      applyAuthSession(data);
      navigate("/workspace");
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, "Signup failed"));
    } finally {
      setLoading(false);
    }
  };
  const launchDemo = async () => {
    try {
      setLaunchingDemo(true);
      setError("");
      const { data } = await api.post<DemoAuthResponse>("/auth/demo");
      applyAuthSession(data);
      navigate("/workspace", { state: { statusText: data.message } });
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, "Demo workspace could not be started"));
    } finally {
      setLaunchingDemo(false);
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--hero-bg)] px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel w-full max-w-md rounded-[32px] p-8 shadow-panel"
      >
        <Link className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400" to="/">
          Back to overview
        </Link>
        <p className="font-display text-xs uppercase tracking-[0.35em] text-orange-600 dark:text-orange-300">
          Create workspace
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
          Launch your sellable analytics SaaS
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
          <button
            type="button"
            onClick={() => void launchDemo()}
            disabled={launchingDemo}
            className="w-full rounded-2xl border border-slate-300/70 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100"
          >
            {launchingDemo ? "Launching demo..." : "Explore instant demo"}
            <ArrowRight className="ml-2 inline h-4 w-4" />
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
