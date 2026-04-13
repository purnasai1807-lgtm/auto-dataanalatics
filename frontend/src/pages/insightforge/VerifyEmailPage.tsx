import { motion } from "framer-motion";
import { ArrowRight, MailCheck, RefreshCcw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resendVerificationEmail, verifyEmail } from "../../lib/insightforgeApi";
import { getApiErrorMessage } from "../../lib/http";
import { insightforgeRoutes } from "../../lib/routes";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";
  const [loading, setLoading] = useState(Boolean(token));
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(
    email && !token ? `We sent a verification link to ${email}.` : "Open the verification link from your inbox."
  );
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    async function runVerification() {
      try {
        setLoading(true);
        setError("");
        const response = await verifyEmail(token);

        if (!active) {
          return;
        }

        setVerified(true);
        setNotice(response.message);
      } catch (requestError) {
        if (!active) {
          return;
        }

        setError(getApiErrorMessage(requestError, "Unable to verify your email right now."));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void runVerification();

    return () => {
      active = false;
    };
  }, [token]);

  async function handleResend() {
    if (!email) {
      return;
    }

    try {
      setResending(true);
      setError("");
      const response = await resendVerificationEmail(email);
      setNotice(response.message);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to resend the verification email right now."));
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[1fr,420px]">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-panel rounded-[34px] p-8 shadow-soft"
        >
          <div className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600">
            <ShieldCheck className="mr-2 h-3.5 w-3.5 text-teal-700" />
            Account security
          </div>
          <h1 className="mt-5 font-display text-5xl font-semibold tracking-tight text-slate-950">
            Verify your email to unlock InsightForge AI
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
            Verified email addresses protect report history, billing access, and team analytics data.
          </p>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="premium-panel rounded-[34px] p-8 shadow-soft"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-slate-950 text-white">
            <MailCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-slate-950">Email verification</h2>
          <div className="mt-4 text-sm leading-7 text-slate-600">
            {loading ? "Verifying your secure link..." : notice}
          </div>
          {error ? <div className="mt-4 rounded-[20px] border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div> : null}
          {!verified && email ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="mt-6 inline-flex w-full items-center justify-center rounded-[20px] border border-slate-300/80 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {resending ? "Sending..." : "Resend verification email"}
              <RefreshCcw className="ml-2 h-4 w-4" />
            </button>
          ) : null}
          <Link
            to={insightforgeRoutes.login}
            className="mt-4 inline-flex w-full items-center justify-center rounded-[20px] bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
          >
            {verified ? "Continue to sign in" : "Back to sign in"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
