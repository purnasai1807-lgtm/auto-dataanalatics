import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  FileDown,
  ShieldCheck,
  Sparkles,
  UploadCloud
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { insightforgeRoutes } from "../../lib/routes";

const features = [
  {
    icon: UploadCloud,
    title: "AI-powered file analysis",
    detail: "Upload CSV and XLSX files to get fast summaries, business insights, and board-ready recommendations."
  },
  {
    icon: BarChart3,
    title: "Instant visual storytelling",
    detail: "Line, bar, and pie charts are generated automatically so users can move from raw rows to executive clarity."
  },
  {
    icon: FileDown,
    title: "Downloadable reports",
    detail: "Export premium PDF reports your clients, investors, or internal teams can act on immediately."
  }
];

const testimonials = [
  {
    quote:
      "We used the sample dataset in a sales demo and closed our first analytics client the same week. It looks and feels launch-ready.",
    name: "AVVARU PURNASAI",
    role: ""
  }
];

const steps = [
  "Upload a CSV or Excel file",
  "Review AI insights and auto-generated charts",
  "Export a polished report and share it with your team"
];

export default function LandingPage() {
  const { token } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--app-bg)] px-4 py-4 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1480px]">
        <header className="premium-panel flex flex-col gap-5 rounded-[34px] px-6 py-6 shadow-soft lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600">
              <Sparkles className="mr-2 h-3.5 w-3.5 text-teal-700" />
              InsightForge AI
            </div>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Turn Your Data Into Actionable Insights in Seconds
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              InsightForge AI automates spreadsheet analysis with AI-generated summaries, instant charts, and downloadable reports so teams can move from raw data to decisions without waiting on analysts.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to={token ? insightforgeRoutes.dashboard : insightforgeRoutes.signup}
              className="inline-flex items-center rounded-[18px] bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
            >
              {token ? "Open dashboard" : "Start free"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to={insightforgeRoutes.pricing}
              className="inline-flex items-center rounded-[18px] border border-slate-300/80 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5"
            >
              View pricing
            </Link>
          </div>
        </header>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-panel rounded-[34px] p-7 shadow-soft"
          >
            <div className="inline-flex items-center rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white">
              Used by 100+ users
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] bg-white/70 p-5">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Reports generated</div>
                <div className="mt-3 font-display text-4xl font-semibold">120+</div>
              </div>
              <div className="rounded-[24px] bg-white/70 p-5">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Time saved</div>
                <div className="mt-3 font-display text-4xl font-semibold">8 hrs/week</div>
              </div>
              <div className="rounded-[24px] bg-white/70 p-5">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Trust signal</div>
                <div className="mt-3 flex items-center gap-2 font-display text-3xl font-semibold">
                  <ShieldCheck className="h-7 w-7 text-teal-700" />
                  Fast & Secure
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[30px] bg-slate-950 p-6 text-white">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">How it works</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {steps.map((step, index) => (
                  <div key={step} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Step {index + 1}</div>
                    <div className="mt-2 text-sm font-medium leading-6 text-slate-100">{step}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="grid gap-4"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="premium-panel rounded-[30px] p-6 shadow-soft">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                        Feature {index + 1}
                      </div>
                      <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-950">
                        {feature.title}
                      </h2>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{feature.detail}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-950 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </article>
              );
            })}
          </motion.div>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
          <div className="premium-panel rounded-[34px] p-7 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Pricing</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">Free to start, Pro to scale</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-slate-200/80 bg-white/80 p-5">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Free</div>
                <div className="mt-2 font-display text-4xl font-semibold">$0</div>
                <p className="mt-3 text-sm leading-6 text-slate-600">3 reports per day, sample dataset, dashboard, and PDF exports.</p>
              </div>
              <div className="rounded-[28px] bg-slate-950 p-5 text-white">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Pro</div>
                <div className="mt-2 font-display text-4xl font-semibold">$79/mo</div>
                <p className="mt-3 text-sm leading-6 text-slate-300">Unlimited reports, monetization-ready workflow, and billing management.</p>
              </div>
            </div>
            <Link
              to={insightforgeRoutes.pricing}
              className="mt-6 inline-flex items-center rounded-[18px] bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
            >
              Compare plans
            </Link>
          </div>

          <div className="premium-panel rounded-[34px] p-7 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Testimonials</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">Built to feel like a real business</h2>
            <div className="mt-6 grid gap-4">
              {testimonials.map((testimonial) => (
                <article key={testimonial.name} className="rounded-[28px] border border-slate-200/80 bg-white/80 p-5">
                  <p className="text-base leading-8 text-slate-700">"{testimonial.quote}"</p>
                  <div className="mt-4 text-sm font-semibold text-slate-950">{testimonial.name}</div>
                  {testimonial.role ? <div className="text-sm text-slate-500">{testimonial.role}</div> : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
