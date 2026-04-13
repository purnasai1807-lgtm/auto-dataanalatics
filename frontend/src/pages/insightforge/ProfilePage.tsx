import { motion } from "framer-motion";
import { CheckCircle2, Crown, UserCircle2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { WorkspaceLayout } from "../../components/insightforge/WorkspaceLayout";
import { useAuth } from "../../context/AuthContext";
import { createPortalSession, getProfile, updateProfile } from "../../lib/insightforgeApi";
import { getApiErrorMessage } from "../../lib/http";
import { formatDate, formatNumber } from "../../utils/format";

export default function ProfilePage() {
  const { user, usage, refreshAuth } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  useEffect(() => {
    void getProfile().catch(() => undefined);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await updateProfile({ name });
      await refreshAuth();
      setSuccess("Profile updated.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Profile could not be updated."));
    } finally {
      setSaving(false);
    }
  }

  async function completeOnboarding() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await updateProfile({ onboardingCompleted: true });
      await refreshAuth();
      setSuccess("Onboarding marked complete.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Onboarding state could not be updated."));
    } finally {
      setSaving(false);
    }
  }

  async function openBillingPortal() {
    try {
      setBillingLoading(true);
      setError("");
      const { url } = await createPortalSession(window.location.origin);
      window.location.href = url;
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Billing portal is not available right now."));
    } finally {
      setBillingLoading(false);
    }
  }

  return (
    <WorkspaceLayout>
      <div className="space-y-4">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-panel rounded-[34px] p-7 shadow-soft"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Profile</p>
              <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-slate-950">Account and launch settings</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Manage your account identity, onboarding progress, and billing posture from one place.
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-slate-950 text-white">
              <UserCircle2 className="h-6 w-6" />
            </div>
          </div>
        </motion.section>

        {error ? (
          <section className="rounded-[26px] border border-amber-300/80 bg-amber-50 px-5 py-4 text-sm text-amber-900 shadow-soft">
            {error}
          </section>
        ) : null}

        {success ? (
          <section className="rounded-[26px] border border-emerald-300/80 bg-emerald-50 px-5 py-4 text-sm text-emerald-900 shadow-soft">
            {success}
          </section>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[0.8fr,1.2fr]">
          <div className="premium-panel rounded-[30px] p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Plan snapshot</p>
            <div className="mt-4 inline-flex items-center rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white">
              <Crown className="mr-2 h-3.5 w-3.5" />
              {user?.plan === "pro" ? "Pro" : "Free"}
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-[22px] bg-white/70 p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Reports generated</div>
                <div className="mt-2 font-display text-3xl font-semibold text-slate-950">
                  {formatNumber(user?.totalReportsGenerated ?? 0)}
                </div>
              </div>
              <div className="rounded-[22px] bg-white/70 p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Reports used today</div>
                <div className="mt-2 font-display text-3xl font-semibold text-slate-950">
                  {formatNumber(usage?.reportsUsed ?? 0)}
                </div>
              </div>
              <div className="rounded-[22px] bg-white/70 p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Member since</div>
                <div className="mt-2 text-sm font-semibold text-slate-950">{formatDate(user?.createdAt)}</div>
              </div>
            </div>

            {user?.plan === "pro" ? (
              <button
                type="button"
                onClick={() => void openBillingPortal()}
                disabled={billingLoading}
                className="mt-5 inline-flex w-full items-center justify-center rounded-[18px] bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
              >
                {billingLoading ? "Opening billing..." : "Manage billing"}
              </button>
            ) : null}
          </div>

          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="premium-panel rounded-[30px] p-6 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Personal details</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-[20px] border border-slate-300/80 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Email</span>
                  <input
                    value={user?.email ?? ""}
                    disabled
                    className="w-full rounded-[20px] border border-slate-200/80 bg-slate-100 px-4 py-3 text-sm text-slate-500"
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="mt-5 inline-flex items-center rounded-[18px] bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
              >
                Save changes
              </button>
            </form>

            <section className="premium-panel rounded-[30px] p-6 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Onboarding</p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950">
                Close the activation loop
              </h2>
              <div className="mt-5 space-y-3">
                <div className="rounded-[22px] border border-slate-200/80 bg-white/70 p-4 text-sm text-slate-600">
                  1. Upload a dataset or run the sample demo
                </div>
                <div className="rounded-[22px] border border-slate-200/80 bg-white/70 p-4 text-sm text-slate-600">
                  2. Review the AI summary and charts
                </div>
                <div className="rounded-[22px] border border-slate-200/80 bg-white/70 p-4 text-sm text-slate-600">
                  3. Export a PDF report and position the product as a monetizable analytics workflow
                </div>
              </div>
              <button
                type="button"
                onClick={() => void completeOnboarding()}
                disabled={saving || user?.onboardingCompleted}
                className="mt-5 inline-flex items-center rounded-[18px] bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {user?.onboardingCompleted ? "Onboarding complete" : "Mark onboarding complete"}
              </button>
            </section>
          </div>
        </section>
      </div>
    </WorkspaceLayout>
  );
}
