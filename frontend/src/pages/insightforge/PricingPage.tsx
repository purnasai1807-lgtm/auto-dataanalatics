import { motion } from "framer-motion";
import { ArrowRight, Crown, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createCheckoutSession, createPortalSession } from "../../lib/insightforgeApi";
import { getApiErrorMessage } from "../../lib/http";
import { insightforgeRoutes } from "../../lib/routes";

const plans = [
  {
    label: "Free",
    price: "$0",
    description: "Perfect for validating the product and demonstrating value quickly.",
    features: ["3 reports per day", "CSV and XLSX uploads", "AI summary and chart generation", "PDF exports"]
  },
  {
    label: "Pro",
    price: "$79/mo",
    description: "Built for agencies, operators, and founders monetizing the workflow.",
    features: ["Unlimited reports", "Priority billing flow with Stripe", "Full report history", "Production-ready usage without daily caps"]
  }
];

export default function PricingPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [loadingMode, setLoadingMode] = useState<"checkout" | "portal" | null>(null);
  const [error, setError] = useState("");

  async function handleCheckout() {
    if (!token) {
      navigate(insightforgeRoutes.signup);
      return;
    }

    try {
      setLoadingMode("checkout");
      setError("");
      const { url } = await createCheckoutSession(window.location.origin);
      window.location.href = url;
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Stripe checkout is not available right now."));
    } finally {
      setLoadingMode(null);
    }
  }

  async function handlePortal() {
    try {
      setLoadingMode("portal");
      setError("");
      const { url } = await createPortalSession(window.location.origin);
      window.location.href = url;
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Billing portal is not available right now."));
    } finally {
      setLoadingMode(null);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1320px] space-y-4">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-panel rounded-[34px] p-7 shadow-soft"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Pricing</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Free to start. Pro when the product begins earning.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
            The plan structure is intentionally simple so a buyer can understand the value quickly and upgrade without friction.
          </p>
        </motion.section>

        {error ? (
          <section className="rounded-[26px] border border-amber-300/80 bg-amber-50 px-5 py-4 text-sm text-amber-900 shadow-soft">
            {error}
          </section>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-2">
          {plans.map((plan, index) => (
            <motion.article
              key={plan.label}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className={`rounded-[34px] p-7 shadow-soft ${
                plan.label === "Pro" ? "bg-slate-950 text-white" : "premium-panel"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${plan.label === "Pro" ? "text-slate-400" : "text-slate-500"}`}>
                    {plan.label === "Pro" ? "Best for monetization" : "Entry plan"}
                  </p>
                  <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight">{plan.label}</h2>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-[18px] ${plan.label === "Pro" ? "bg-white/10" : "bg-slate-950 text-white"}`}>
                  {plan.label === "Pro" ? <Crown className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                </div>
              </div>
              <div className="mt-5 font-display text-5xl font-semibold tracking-tight">{plan.price}</div>
              <p className={`mt-4 text-sm leading-7 ${plan.label === "Pro" ? "text-slate-300" : "text-slate-600"}`}>{plan.description}</p>
              <div className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <div
                    key={feature}
                    className={`rounded-[22px] border px-4 py-3 text-sm ${
                      plan.label === "Pro"
                        ? "border-white/10 bg-white/5 text-slate-200"
                        : "border-slate-200/80 bg-white/70 text-slate-600"
                    }`}
                  >
                    {feature}
                  </div>
                ))}
              </div>
              <div className="mt-6">
                {plan.label === "Free" ? (
                  <Link
                    to={token ? insightforgeRoutes.dashboard : insightforgeRoutes.signup}
                    className="inline-flex items-center rounded-[18px] bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                  >
                    {token ? "Back to dashboard" : "Start free"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                ) : user?.plan === "pro" ? (
                  <button
                    type="button"
                    onClick={() => void handlePortal()}
                    disabled={loadingMode === "portal"}
                    className="inline-flex items-center rounded-[18px] bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    {loadingMode === "portal" ? "Opening..." : "Manage billing"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleCheckout()}
                    disabled={loadingMode === "checkout"}
                    className="inline-flex items-center rounded-[18px] bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    {loadingMode === "checkout" ? "Redirecting..." : "Upgrade to Pro"}
                  </button>
                )}
              </div>
            </motion.article>
          ))}
        </section>
      </div>
    </div>
  );
}
