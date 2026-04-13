import { useEffect, useState } from "react";
import { Activity, Database, DollarSign, ShieldCheck, Users } from "lucide-react";
import { AdminOverview, SalesInquiry, SalesInquiryUpdateRequest } from "../../api/types";
import { formatCurrency, formatDate, formatNumber } from "../../utils/format";

interface AdminPanelProps {
  overview: AdminOverview;
  inquiries: SalesInquiry[];
  updatingInquiryId: string | null;
  onUpdateInquiry: (inquiryId: string, payload: SalesInquiryUpdateRequest) => void;
}

const totalCards = [
  { key: "users", label: "Users", icon: Users },
  { key: "datasets", label: "Datasets", icon: Database },
  { key: "model_runs", label: "Model Runs", icon: Activity },
  { key: "reports", label: "Reports", icon: ShieldCheck },
] as const;

const pipelineCards = [
  { key: "inquiries", label: "Leads" },
  { key: "new", label: "New" },
  { key: "qualified", label: "Qualified" },
  { key: "proposal_sent", label: "Proposals" },
  { key: "won", label: "Won" },
] as const;

const statusOptions = ["new", "qualified", "proposal_sent", "won", "lost"];

const formatLabel = (value: string) =>
  value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

function AdminPanel({ overview, inquiries, updatingInquiryId, onUpdateInquiry }: AdminPanelProps) {
  const [drafts, setDrafts] = useState<Record<string, { status: string; notes: string }>>({});

  useEffect(() => {
    setDrafts(
      Object.fromEntries(
        inquiries.map((inquiry) => [
          inquiry.id,
          {
            status: inquiry.status,
            notes: inquiry.notes ?? "",
          },
        ]),
      ),
    );
  }, [inquiries]);

  return (
    <section className="glass-panel rounded-[30px] p-5 shadow-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-orange-600 dark:text-orange-300">
            Operator Console
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            Instance health, customer activity, and sales pipeline
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
            Use this view to demo platform maturity, monitor workload, and move inbound interest toward paid deals.
          </p>
        </div>
        <div className="rounded-[24px] border border-slate-200/80 bg-white/75 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-300">
          <div className="font-semibold text-slate-900 dark:text-white">
            {overview.runtime.environment} | {overview.runtime.task_backend} tasks | {overview.runtime.storage_backend} storage
          </div>
          <div className="mt-1">
            Demo mode: {overview.runtime.demo_mode_enabled ? "on" : "off"} | Admin console:{" "}
            {overview.runtime.admin_console_enabled ? "on" : "off"}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {totalCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="rounded-[24px] border border-slate-200/80 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-950/30"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.26em] text-slate-500 dark:text-slate-400">{card.label}</div>
                <div className="rounded-2xl bg-slate-950/90 p-2 text-white dark:bg-white/10">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 font-display text-3xl font-bold text-slate-950 dark:text-white">
                {formatNumber(overview.totals[card.key])}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="space-y-4">
          <div className="rounded-[24px] border border-slate-200/80 bg-white/70 p-5 dark:border-slate-700 dark:bg-slate-950/30">
            <div className="flex items-center justify-between gap-3">
              <h3 className="section-title">Revenue Pipeline</h3>
              <div className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
                <DollarSign className="mr-1.5 h-3.5 w-3.5" />
                {formatCurrency(overview.sales.pipeline_value_usd)}
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {pipelineCards.map((card) => (
                <div key={card.key} className="rounded-[20px] bg-white/80 p-4 dark:bg-slate-950/50">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                    {card.label}
                  </div>
                  <div className="mt-2 font-display text-2xl font-bold text-slate-950 dark:text-white">
                    {formatNumber(overview.sales[card.key])}
                  </div>
                </div>
              ))}
              <div className="rounded-[20px] bg-white/80 p-4 dark:bg-slate-950/50">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Open pipeline</div>
                <div className="mt-2 font-display text-2xl font-bold text-slate-950 dark:text-white">
                  {formatCurrency(overview.sales.pipeline_value_usd)}
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-[20px] border border-dashed border-slate-300/80 bg-white/80 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-300">
              {overview.recent_inquiries.length === 0 ? (
                <span>No inbound leads yet. The landing page inquiry form is ready to populate this queue.</span>
              ) : (
                <div className="space-y-3">
                  {overview.recent_inquiries.map((inquiry) => (
                    <div
                      key={inquiry.id}
                      className="flex flex-col gap-2 rounded-[18px] border border-slate-200/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-950/40"
                    >
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{inquiry.company}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {inquiry.full_name} | {inquiry.email}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(inquiry.estimated_value_usd)}
                        </div>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        {formatLabel(inquiry.package_name)} | {formatLabel(inquiry.status)} | {formatDate(inquiry.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200/80 bg-white/70 p-5 dark:border-slate-700 dark:bg-slate-950/30">
            <h3 className="section-title">Runtime Signals</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[20px] bg-white/80 p-4 dark:bg-slate-950/50">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Ready datasets</div>
                <div className="mt-2 font-display text-2xl font-bold text-slate-950 dark:text-white">
                  {formatNumber(overview.totals.ready_datasets)}
                </div>
              </div>
              <div className="rounded-[20px] bg-white/80 p-4 dark:bg-slate-950/50">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Processing queue</div>
                <div className="mt-2 font-display text-2xl font-bold text-slate-950 dark:text-white">
                  {formatNumber(overview.totals.processing_datasets)}
                </div>
              </div>
              <div className="rounded-[20px] bg-white/80 p-4 dark:bg-slate-950/50">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Completed models</div>
                <div className="mt-2 font-display text-2xl font-bold text-slate-950 dark:text-white">
                  {formatNumber(overview.totals.completed_model_runs)}
                </div>
              </div>
              <div className="rounded-[20px] bg-white/80 p-4 dark:bg-slate-950/50">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Completed reports</div>
                <div className="mt-2 font-display text-2xl font-bold text-slate-950 dark:text-white">
                  {formatNumber(overview.totals.completed_reports)}
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-[20px] border border-dashed border-slate-300/80 bg-white/80 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-300">
              {overview.runtime.warnings.length === 0 ? (
                <span>Runtime checks look healthy. No production warnings are currently active.</span>
              ) : (
                <div className="space-y-2">
                  {overview.runtime.warnings.map((warning) => (
                    <div key={warning}>{warning}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[24px] border border-slate-200/80 bg-white/70 p-5 dark:border-slate-700 dark:bg-slate-950/30">
            <h3 className="section-title">Lead Queue</h3>
            <div className="mt-4 space-y-3">
              {inquiries.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-slate-300/80 bg-white/80 p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
                  No inquiries yet.
                </div>
              ) : (
                inquiries.map((inquiry) => {
                  const draft = drafts[inquiry.id] ?? { status: inquiry.status, notes: inquiry.notes ?? "" };
                  return (
                    <article
                      key={inquiry.id}
                      className="rounded-[24px] border border-slate-200/80 bg-white/85 p-4 dark:border-slate-700 dark:bg-slate-950/40"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{inquiry.company}</div>
                          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {inquiry.full_name} | {inquiry.email}
                          </div>
                          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                            {formatLabel(inquiry.package_name)} | {inquiry.budget_band} | {formatCurrency(inquiry.estimated_value_usd)}
                          </div>
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                          Created {formatDate(inquiry.created_at)}
                          <div className="mt-1">
                            Last contact {inquiry.last_contacted_at ? formatDate(inquiry.last_contacted_at) : "Not yet"}
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{inquiry.use_case}</p>
                      <div className="mt-4 grid gap-3 lg:grid-cols-[180px,1fr,140px]">
                        <select
                          value={draft.status}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [inquiry.id]: {
                                status: event.target.value,
                                notes: current[inquiry.id]?.notes ?? inquiry.notes ?? "",
                              },
                            }))
                          }
                          className="rounded-[18px] border border-slate-200/80 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-white"
                        >
                          {statusOptions.map((option) => (
                            <option key={option} value={option}>
                              {formatLabel(option)}
                            </option>
                          ))}
                        </select>
                        <textarea
                          value={draft.notes}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [inquiry.id]: {
                                status: current[inquiry.id]?.status ?? inquiry.status,
                                notes: event.target.value,
                              },
                            }))
                          }
                          className="min-h-[90px] rounded-[18px] border border-slate-200/80 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-white"
                          placeholder="Add follow-up notes"
                        />
                        <button
                          type="button"
                          disabled={updatingInquiryId === inquiry.id}
                          onClick={() =>
                            onUpdateInquiry(inquiry.id, {
                              status: draft.status,
                              notes: draft.notes.trim() ? draft.notes.trim() : null,
                            })
                          }
                          className="rounded-[18px] bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60 dark:bg-white dark:text-slate-950"
                        >
                          {updatingInquiryId === inquiry.id ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200/80 bg-white/70 p-5 dark:border-slate-700 dark:bg-slate-950/30">
            <h3 className="section-title">Newest Users</h3>
            <div className="mt-4 space-y-3">
              {overview.recent_users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-3 rounded-[20px] border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-950/50 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{user.full_name}</div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    Joined {formatDate(user.created_at)} | {user.is_active ? "Active" : "Inactive"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200/80 bg-white/70 p-5 dark:border-slate-700 dark:bg-slate-950/30">
            <h3 className="section-title">Top Customers</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-500 dark:text-slate-400">
                    <th className="pb-3 pr-4">Customer</th>
                    <th className="pb-3 pr-4">Datasets</th>
                    <th className="pb-3 pr-4">Models</th>
                    <th className="pb-3 pr-4">Reports</th>
                    <th className="pb-3">Last activity</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.top_customers.map((user) => (
                    <tr key={user.id} className="border-t border-slate-200/70 dark:border-slate-700">
                      <td className="py-3 pr-4">
                        <div className="font-medium text-slate-900 dark:text-white">{user.full_name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                      </td>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{formatNumber(user.datasets)}</td>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{formatNumber(user.model_runs)}</td>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{formatNumber(user.reports)}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">
                        {user.last_activity_at ? formatDate(user.last_activity_at) : "No activity yet"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminPanel;
