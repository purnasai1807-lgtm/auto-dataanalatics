import { FormEvent, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Database,
  DollarSign,
  FileText,
  Rocket,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  Workflow,
} from "lucide-react";
import { api, getApiErrorMessage, getStoredToken, getStoredUser } from "../api/client";
import { DemoAuthResponse, SalesInquiryCreateRequest, SalesInquiryCreateResponse, User } from "../api/types";
import { applyAuthSession } from "../utils/session";
import { formatCurrency } from "../utils/format";

const pricingTiers = [
  {
    slug: "starter",
    label: "Starter",
    price: 1499,
    highlight: "Fastest close",
    audience: "For freelancers, founders, and internal teams validating demand.",
    detail: "Launch the full analytics workflow with a polished buyer demo and deployment-ready codebase.",
    outcomes: ["Core analytics workspace", "Buyer-ready landing flow", "Admin operator console"],
  },
  {
    slug: "growth",
    label: "Growth",
    price: 3499,
    highlight: "Best margin",
    audience: "For agencies and product teams turning this into a paid analytics offer.",
    detail: "Position the project as a revenue product with lead capture, deal tracking, and demo-friendly UX.",
    outcomes: ["Lead capture and pricing funnel", "Sales pipeline tracking", "Production-oriented safeguards"],
  },
  {
    slug: "enterprise",
    label: "Enterprise",
    price: 7900,
    highlight: "White-label ready",
    audience: "For buyers who want to rebrand, host, and expand the platform commercially.",
    detail: "Use this as the base for a premium analytics delivery stack with room for custom integrations.",
    outcomes: ["High-ticket positioning", "Admin visibility for operators", "Hosted deployment flexibility"],
  },
];

const stats = [
  { label: "Starting price", value: "$1,499" },
  { label: "Buyer path", value: "Landing page to demo to inquiry" },
  { label: "Delivery", value: "Docker, Render, Railway, AWS-ready" },
];

const capabilities = [
  {
    icon: Upload,
    title: "One-line tracking install",
    detail: "Each project generates a hosted script your buyer can paste into any site to start tracking pageviews and custom events.",
  },
  {
    icon: BarChart3,
    title: "Executive-ready dashboards",
    detail: "Visitors, sessions, bounce rate, referrers, and event trends appear in a polished workspace designed for client delivery.",
  },
  {
    icon: Bot,
    title: "AI-style insight narration",
    detail: "Rules-based insight cards turn raw traffic movement into buyer-friendly recommendations without needing a data analyst on every account.",
  },
  {
    icon: FileText,
    title: "Premium exports and reporting",
    detail: "CSV and PDF exports make the platform easy to hand off to paying clients, agencies, and operators.",
  },
];

const workflow = [
  { title: "Install", detail: "Create a project and paste the hosted tracking snippet into the buyer's website." },
  { title: "Observe", detail: "Traffic, sessions, bounce rate, devices, referrers, and custom events start flowing into the live dashboard." },
  { title: "Monetize", detail: "Export reports, share insights, and manage multiple client properties from the same commercial workspace." },
];

const budgetBands = ["Under $2k", "$2k - $5k", "$5k - $10k", "$10k+"];

const formatPackageLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");

function HomePage() {
  const navigate = useNavigate();
  const token = getStoredToken();
  const storedUser = getStoredUser<User>();
  const inquirySectionRef = useRef<HTMLElement | null>(null);
  const [launchingDemo, setLaunchingDemo] = useState(false);
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [error, setError] = useState("");
  const [inquiryError, setInquiryError] = useState("");
  const [inquirySuccess, setInquirySuccess] = useState<SalesInquiryCreateResponse | null>(null);
  const [inquiryForm, setInquiryForm] = useState<SalesInquiryCreateRequest>({
    full_name: storedUser?.full_name ?? "",
    email: storedUser?.email ?? "",
    company: "",
    package_name: "growth",
    budget_band: "$2k - $5k",
    use_case: "",
  });

  const selectedTier = useMemo(
    () => pricingTiers.find((tier) => tier.slug === inquiryForm.package_name) ?? pricingTiers[1],
    [inquiryForm.package_name],
  );

  const launchDemo = async () => {
    try {
      setLaunchingDemo(true);
      setError("");
      const { data } = await api.post<DemoAuthResponse>("/auth/demo");
      applyAuthSession(data);
      navigate("/workspace", { state: { statusText: data.message } });
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, "Demo workspace could not be started right now."));
    } finally {
      setLaunchingDemo(false);
    }
  };

  const focusInquiryForm = (packageName: string) => {
    setInquiryForm((current) => ({ ...current, package_name: packageName }));
    inquirySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleInquirySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSubmittingInquiry(true);
      setInquiryError("");
      const { data } = await api.post<SalesInquiryCreateResponse>("/sales/inquiries", inquiryForm);
      setInquirySuccess(data);
      setInquiryForm((current) => ({
        ...current,
        company: "",
        budget_band: current.budget_band,
        use_case: "",
      }));
    } catch (requestError: unknown) {
      setInquiryError(getApiErrorMessage(requestError, "Inquiry could not be submitted right now."));
    } finally {
      setSubmittingInquiry(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--hero-bg)] text-slate-900 transition-colors dark:text-white">
      <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="glass-panel rounded-[30px] px-5 py-5 shadow-panel">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-[22px] bg-slate-950 px-4 py-3 text-white shadow-lg dark:bg-white dark:text-slate-950">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <p className="font-display text-xs uppercase tracking-[0.35em] text-teal-600 dark:text-teal-300">
                  Commercial Analytics Product
                </p>
                <h1 className="font-display text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                  Auto Data Analytics
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => focusInquiryForm("growth")}
                className="inline-flex items-center rounded-2xl border border-slate-300/70 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-200"
              >
                Request pricing
              </button>
              <Link
                to={token ? "/workspace" : "/login"}
                className="inline-flex items-center rounded-2xl border border-slate-300/70 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-200"
              >
                {token ? "Open workspace" : "Sign in"}
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
              >
                Create workspace
              </Link>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-[36px] p-7 shadow-panel sm:p-9"
          >
            <div className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600 dark:bg-white/10 dark:text-slate-300">
              <Sparkles className="mr-2 h-3.5 w-3.5 text-accent-600 dark:text-accent-500" />
              Revenue-ready SaaS asset
            </div>
            <h2 className="mt-5 max-w-3xl font-display text-5xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-6xl">
              Sell a full analytics product, not just a code repository.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
              This platform combines hosted website tracking, multi-project dashboards, AI-style insight narration, CSV
              and PDF exports, pricing capture, and operator oversight in one commercial flow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void launchDemo()}
                disabled={launchingDemo}
                className="inline-flex items-center rounded-2xl bg-gradient-to-r from-slate-950 via-shell-900 to-shell-800 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60 dark:from-white dark:via-slate-100 dark:to-slate-300 dark:text-slate-950"
              >
                {launchingDemo ? "Launching demo..." : "Explore instant demo"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => focusInquiryForm("growth")}
                className="inline-flex items-center rounded-2xl border border-slate-300/70 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-200"
              >
                Request paid build
              </button>
            </div>
            {error ? (
              <div className="mt-5 rounded-2xl border border-amber-300/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                {error}
              </div>
            ) : null}
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[24px] border border-slate-200/80 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-950/30"
                >
                  <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                    {item.label}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{item.value}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="grid gap-4"
          >
            <div className="glass-panel rounded-[32px] p-6 shadow-panel">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-teal-500/15 p-3 text-teal-700 dark:text-teal-300">
                  <Workflow className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-display text-2xl font-bold text-slate-950 dark:text-white">One product flow</div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Track, analyze, export, and sell a hosted analytics product without leaving the app.
                </p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {workflow.map((step, index) => (
                  <div
                    key={step.title}
                    className="rounded-[24px] border border-slate-200/80 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-950/30"
                  >
                    <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                      Step {index + 1}
                    </div>
                    <div className="mt-1 font-semibold text-slate-900 dark:text-white">{step.title}</div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{step.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-[32px] p-6 shadow-panel">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-orange-500/15 p-3 text-orange-700 dark:text-orange-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-display text-2xl font-bold text-slate-950 dark:text-white">Sale-ready posture</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Runtime warnings, rate limits, upload safeguards, background workers, and admin visibility are built in.
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-[24px] bg-gradient-to-br from-shell-950 via-shell-900 to-shell-800 p-5 text-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
                <div className="flex items-center gap-3">
                  <Rocket className="h-5 w-5 text-mint-500" />
                  <div className="font-semibold">Commercial conversion path</div>
                </div>
                <p className="mt-3 text-sm text-slate-200">
                  Buyers can land on this page, launch a demo, review pricing, install the tracker, and then appear in the operator console.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-4">
          {capabilities.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + index * 0.05 }}
                className="glass-panel rounded-[30px] p-5 shadow-panel"
              >
                <div className="rounded-2xl bg-white/80 p-3 text-slate-900 dark:bg-white/10 dark:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.detail}</p>
              </motion.article>
            );
          })}
        </section>

        <section className="mt-6 glass-panel rounded-[34px] p-6 shadow-panel sm:p-7">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-orange-600 dark:text-orange-300">
                Pricing
              </p>
              <h2 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
                Anchor the project above the $1,000 mark from day one.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                These packages turn the platform into a direct offer. Choose a tier, capture buyer details, and move the lead into the operator console.
              </p>
            </div>
            <div className="inline-flex items-center rounded-full bg-white/75 px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-950/30 dark:text-slate-200">
              <DollarSign className="mr-2 h-4 w-4" />
              Entry point starts at {formatCurrency(pricingTiers[0].price)}
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            {pricingTiers.map((tier, index) => (
              <motion.article
                key={tier.slug}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 + index * 0.06 }}
                className={`rounded-[30px] border p-6 shadow-sm ${
                  inquiryForm.package_name === tier.slug
                    ? "border-teal-400 bg-gradient-to-br from-teal-500/10 via-white/90 to-white/60 dark:from-teal-500/20 dark:via-slate-950/40 dark:to-slate-950/20"
                    : "border-slate-200/80 bg-white/70 dark:border-slate-700 dark:bg-slate-950/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                      {tier.highlight}
                    </div>
                    <h3 className="mt-2 font-display text-3xl font-bold text-slate-950 dark:text-white">{tier.label}</h3>
                  </div>
                  <div className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white dark:bg-white dark:text-slate-950">
                    {formatCurrency(tier.price)}
                  </div>
                </div>
                <p className="mt-4 text-sm font-medium text-slate-900 dark:text-white">{tier.audience}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{tier.detail}</p>
                <div className="mt-5 space-y-2">
                  {tier.outcomes.map((outcome) => (
                    <div
                      key={outcome}
                      className="rounded-[20px] border border-slate-200/70 bg-white/80 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200"
                    >
                      {outcome}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => focusInquiryForm(tier.slug)}
                  className="mt-5 inline-flex items-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
                >
                  Select {tier.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </motion.article>
            ))}
          </div>
        </section>

        <section ref={inquirySectionRef} className="mt-6 grid gap-6 xl:grid-cols-[0.88fr,1.12fr]">
          <motion.article
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-[34px] p-6 shadow-panel sm:p-7"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-teal-600 dark:text-teal-300">
              Offer snapshot
            </p>
            <h2 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
              {selectedTier.label} at {formatCurrency(selectedTier.price)}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{selectedTier.detail}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] border border-slate-200/80 bg-white/75 p-4 dark:border-slate-700 dark:bg-slate-950/30">
                <div className="text-xs uppercase tracking-[0.26em] text-slate-500 dark:text-slate-400">Best for</div>
                <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{selectedTier.audience}</div>
              </div>
              <div className="rounded-[24px] border border-slate-200/80 bg-white/75 p-4 dark:border-slate-700 dark:bg-slate-950/30">
                <div className="text-xs uppercase tracking-[0.26em] text-slate-500 dark:text-slate-400">Commercial focus</div>
                <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">Demo faster and convert leads inside the app</div>
              </div>
            </div>
            <div className="mt-5 rounded-[28px] bg-gradient-to-br from-shell-950 via-shell-900 to-shell-800 p-5 text-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-mint-500" />
                <div className="font-semibold">What happens next</div>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-200">
                <div>1. The buyer submits an inquiry tied to a package.</div>
                <div>2. The lead appears in the operator console with pipeline value and contact notes.</div>
                <div>3. You move the deal through qualified, proposal sent, won, or lost.</div>
              </div>
            </div>
          </motion.article>

          <motion.form
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleInquirySubmit}
            className="glass-panel rounded-[34px] p-6 shadow-panel sm:p-7"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-orange-600 dark:text-orange-300">
              Buyer inquiry
            </p>
            <h2 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
              Capture paid interest now
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Submit a lead for the selected package. The estimate is recorded in the admin pipeline automatically.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  Full name
                </span>
                <input
                  value={inquiryForm.full_name}
                  onChange={(event) => setInquiryForm((current) => ({ ...current, full_name: event.target.value }))}
                  className="w-full rounded-[22px] border border-slate-200/80 bg-white/85 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-white"
                  placeholder="Your name"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  Email
                </span>
                <input
                  type="email"
                  value={inquiryForm.email}
                  onChange={(event) => setInquiryForm((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded-[22px] border border-slate-200/80 bg-white/85 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-white"
                  placeholder="you@company.com"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  Company
                </span>
                <input
                  value={inquiryForm.company}
                  onChange={(event) => setInquiryForm((current) => ({ ...current, company: event.target.value }))}
                  className="w-full rounded-[22px] border border-slate-200/80 bg-white/85 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-white"
                  placeholder="Company or brand"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  Budget
                </span>
                <select
                  value={inquiryForm.budget_band}
                  onChange={(event) => setInquiryForm((current) => ({ ...current, budget_band: event.target.value }))}
                  className="w-full rounded-[22px] border border-slate-200/80 bg-white/85 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-white"
                >
                  {budgetBands.map((budgetBand) => (
                    <option key={budgetBand} value={budgetBand}>
                      {budgetBand}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  Package
                </span>
                <div className="grid gap-3 sm:grid-cols-3">
                  {pricingTiers.map((tier) => (
                    <button
                      key={tier.slug}
                      type="button"
                      onClick={() => setInquiryForm((current) => ({ ...current, package_name: tier.slug }))}
                      className={`rounded-[22px] border px-4 py-4 text-left transition ${
                        inquiryForm.package_name === tier.slug
                          ? "border-teal-400 bg-teal-500/10"
                          : "border-slate-200/80 bg-white/80 dark:border-slate-700 dark:bg-slate-950/30"
                      }`}
                    >
                      <div className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                        {tier.highlight}
                      </div>
                      <div className="mt-2 font-semibold text-slate-900 dark:text-white">{tier.label}</div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{formatCurrency(tier.price)}</div>
                    </button>
                  ))}
                </div>
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  Use case
                </span>
                <textarea
                  value={inquiryForm.use_case}
                  onChange={(event) => setInquiryForm((current) => ({ ...current, use_case: event.target.value }))}
                  className="min-h-[140px] w-full rounded-[22px] border border-slate-200/80 bg-white/85 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-white"
                  placeholder="Describe the client, data workflow, and what success looks like."
                  required
                />
              </label>
            </div>

            {inquiryError ? (
              <div className="mt-5 rounded-2xl border border-amber-300/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                {inquiryError}
              </div>
            ) : null}

            {inquirySuccess ? (
              <div className="mt-5 rounded-2xl border border-emerald-300/80 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100">
                {inquirySuccess.message} Estimated deal value: {formatCurrency(inquirySuccess.estimated_value_usd)}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="rounded-[22px] border border-slate-200/80 bg-white/75 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-300">
                Selected package: <span className="font-semibold text-slate-900 dark:text-white">{formatPackageLabel(inquiryForm.package_name)}</span>{" "}
                | Estimated value: <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(selectedTier.price)}</span>
              </div>
              <button
                type="submit"
                disabled={submittingInquiry}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60 dark:bg-white dark:text-slate-950"
              >
                {submittingInquiry ? "Submitting..." : "Capture inquiry"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </motion.form>
        </section>
      </div>
    </div>
  );
}

export default HomePage;
