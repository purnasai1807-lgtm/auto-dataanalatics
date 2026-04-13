import { startTransition, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Activity, BadgeCheck, BarChart3, Download, Globe, PauseCircle, PlayCircle, Plus, RefreshCcw, TrendingUp, Zap } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import SaaSShell from "../components/saas/SaaSShell";
import MetricStrip from "../components/saas/MetricStrip";
import PlanUsageCard from "../components/saas/PlanUsageCard";
import TeamManagementCard from "../components/saas/TeamManagementCard";
import TrackingInstallCard from "../components/saas/TrackingInstallCard";
import RecentEventsTable from "../components/saas/RecentEventsTable";
import { api, clearStoredAuth, getApiErrorMessage, getStoredToken, getStoredUser, isUnauthorizedError, setStoredUser } from "../api/client";
import type {
  AnalyticsNamedMetric,
  ProjectCreateRequest,
  ProjectDashboardResponse,
  ProjectRead,
  ProjectSummary,
  TeamInvitation,
  TeamInvitationCreateRequest,
  TeamMember,
  TrackingSnippetResponse,
  User,
  WorkspaceSummary,
} from "../api/types";
import { useTheme } from "../hooks/useTheme";
import { formatDate, formatNumber } from "../utils/format";

const defaultForm: ProjectCreateRequest = { name: "", site_url: "", description: "", timezone: "UTC", allowed_domains: [] };
const deviceColors = ["#0f766e", "#0ea5e9", "#f97316", "#16a34a", "#7c3aed"];
const rangeOptions = ["24h", "7d", "30d", "90d"] as const;

function CompactMetric({ label, value, hint, icon: Icon }: { label: string; value: string; hint: string; icon: typeof TrendingUp }) {
  return (
    <article className="rounded-[26px] border border-slate-200/80 bg-white/75 p-5 dark:border-slate-700 dark:bg-slate-950/30">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">{label}</div>
        <div className="rounded-2xl bg-slate-950/8 p-2 text-slate-700 dark:bg-white/10 dark:text-slate-200"><Icon className="h-4 w-4" /></div>
      </div>
      <div className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{value}</div>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{hint}</p>
    </article>
  );
}

function MetricList({ title, subtitle, items }: { title: string; subtitle: string; items: AnalyticsNamedMetric[] }) {
  return (
    <section className="glass-panel rounded-[30px] p-5 shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">{subtitle}</p>
      <h3 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{title}</h3>
      <div className="mt-5 space-y-3">
        {items.length === 0 ? <div className="rounded-[22px] border border-dashed border-slate-300/80 bg-white/70 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-400">Data will populate here once the tracking script receives traffic.</div> : null}
        {items.map((item) => (
          <div key={`${title}-${item.label}`} className="flex items-center justify-between rounded-[22px] border border-slate-200/80 bg-white/75 px-4 py-4 dark:border-slate-700 dark:bg-slate-950/30">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
            <span className="font-display text-2xl font-bold text-slate-950 dark:text-white">{formatNumber(item.value)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SaaSWorkspacePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const token = getStoredToken();
  const [user, setUser] = useState<User | null>(getStoredUser<User>());
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<ProjectDashboardResponse | null>(null);
  const [snippet, setSnippet] = useState<TrackingSnippetResponse | null>(null);
  const [workspaceSummary, setWorkspaceSummary] = useState<WorkspaceSummary | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamInvitations, setTeamInvitations] = useState<TeamInvitation[]>([]);
  const [incomingInvitations, setIncomingInvitations] = useState<TeamInvitation[]>([]);
  const [range, setRange] = useState<(typeof rangeOptions)[number]>("7d");
  const [statusText, setStatusText] = useState(typeof (location.state as { statusText?: string } | null)?.statusText === "string" ? (location.state as { statusText: string }).statusText : "Tracking workspace connected");
  const [form, setForm] = useState(defaultForm);
  const [allowedDomainsInput, setAllowedDomainsInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingProjectData, setLoadingProjectData] = useState(false);
  const [creating, setCreating] = useState(false);
  const [rotatingKey, setRotatingKey] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [acceptingInviteToken, setAcceptingInviteToken] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [actionError, setActionError] = useState("");

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const canManageWorkspace = workspaceSummary?.role === "owner" || workspaceSummary?.role === "admin";

  async function refreshWorkspace(silent = false) {
    if (!token) {
      navigate("/login");
      return;
    }
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const [{ data: me }, { data: projectList }, { data: summary }, { data: incoming }] = await Promise.all([
        api.get<User>("/auth/me"),
        api.get<ProjectSummary[]>("/projects"),
        api.get<WorkspaceSummary>("/account/summary"),
        api.get<TeamInvitation[]>("/team/invitations/incoming"),
      ]);
      let members: TeamMember[] = [];
      let invitations: TeamInvitation[] = [];
      if (summary.role !== "member") {
        const [{ data: nextMembers }, { data: nextInvitations }] = await Promise.all([
          api.get<TeamMember[]>("/team/members"),
          api.get<TeamInvitation[]>("/team/invitations"),
        ]);
        members = nextMembers;
        invitations = nextInvitations;
      }
      setStoredUser(me);
      startTransition(() => {
        setUser(me);
        setProjects(projectList);
        setWorkspaceSummary(summary);
        setTeamMembers(members);
        setTeamInvitations(invitations);
        setIncomingInvitations(incoming);
        setSelectedProjectId((current) =>
          current && projectList.some((project) => project.id === current) ? current : projectList[0]?.id ?? null,
        );
      });
      setActionError("");
      setStatusText(projectList.length > 0 ? "Workspace synchronized" : "Create your first client project");
    } catch (error: unknown) {
      if (isUnauthorizedError(error)) {
        clearStoredAuth();
        navigate("/login");
        return;
      }
      setActionError(getApiErrorMessage(error, "Unable to load your analytics workspace right now."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadProjectData(projectId: string, currentRange: string) {
    setLoadingProjectData(true);
    try {
      const [{ data: nextDashboard }, { data: nextSnippet }] = await Promise.all([
        api.get<ProjectDashboardResponse>(`/projects/${projectId}/dashboard`, { params: { range: currentRange } }),
        api.get<TrackingSnippetResponse>(`/projects/${projectId}/tracking-snippet`),
      ]);
      setDashboard(nextDashboard);
      setSnippet(nextSnippet);
      setActionError("");
      setStatusText("Near real-time analytics refreshed");
    } catch (error: unknown) {
      if (isUnauthorizedError(error)) {
        clearStoredAuth();
        navigate("/login");
        return;
      }
      setActionError(getApiErrorMessage(error, "Project analytics could not be refreshed."));
    } finally {
      setLoadingProjectData(false);
    }
  }

  async function createProject() {
    try {
      setCreating(true);
      setActionError("");
      const payload: ProjectCreateRequest = {
        ...form,
        allowed_domains: allowedDomainsInput.split(",").map((value) => value.trim()).filter(Boolean),
      };
      const { data } = await api.post<ProjectRead>("/projects", payload);
      setForm(defaultForm);
      setAllowedDomainsInput("");
      await refreshWorkspace(true);
      setSelectedProjectId(data.id);
      setStatusText("Project created and ready for tracker installation");
    } catch (error: unknown) {
      setActionError(getApiErrorMessage(error, "Project could not be created."));
    } finally {
      setCreating(false);
    }
  }

  async function changePlan(planKey: "starter" | "growth" | "scale") {
    if (!workspaceSummary || workspaceSummary.role !== "owner") {
      return;
    }
    try {
      setChangingPlan(true);
      const { data } = await api.patch<User>("/account/plan", { plan_key: planKey });
      setStoredUser(data);
      setUser(data);
      await refreshWorkspace(true);
      setStatusText(`Workspace plan updated to ${planKey}`);
    } catch (error: unknown) {
      setActionError(getApiErrorMessage(error, "Plan could not be updated."));
    } finally {
      setChangingPlan(false);
    }
  }

  async function inviteTeammate() {
    if (!inviteEmail.trim()) {
      return;
    }
    try {
      setInviting(true);
      const payload: TeamInvitationCreateRequest = { email: inviteEmail.trim(), role: inviteRole };
      await api.post("/team/invitations", payload);
      setInviteEmail("");
      setInviteRole("member");
      await refreshWorkspace(true);
      setStatusText("Team invitation sent");
    } catch (error: unknown) {
      setActionError(getApiErrorMessage(error, "Invitation could not be sent."));
    } finally {
      setInviting(false);
    }
  }

  async function acceptInvitation(inviteToken: string) {
    try {
      setAcceptingInviteToken(inviteToken);
      await api.post("/team/invitations/accept", { invite_token: inviteToken });
      await refreshWorkspace();
      setStatusText("Workspace invitation accepted");
    } catch (error: unknown) {
      setActionError(getApiErrorMessage(error, "Invitation could not be accepted."));
    } finally {
      setAcceptingInviteToken(null);
    }
  }

  async function revokeInvitation(invitationId: string) {
    try {
      await api.delete(`/team/invitations/${invitationId}`);
      await refreshWorkspace(true);
      setStatusText("Invitation revoked");
    } catch (error: unknown) {
      setActionError(getApiErrorMessage(error, "Invitation could not be revoked."));
    }
  }

  async function removeMember(memberId: string) {
    try {
      await api.delete(`/team/members/${memberId}`);
      await refreshWorkspace(true);
      setStatusText("Team member removed");
    } catch (error: unknown) {
      setActionError(getApiErrorMessage(error, "Member could not be removed."));
    }
  }

  async function rotateProjectKey() {
    if (!selectedProject) return;
    try {
      setRotatingKey(true);
      const { data } = await api.post<ProjectRead>(`/projects/${selectedProject.id}/rotate-key`);
      setProjects((current) => current.map((project) => (project.id === data.id ? data : project)));
      const { data: nextSnippet } = await api.get<TrackingSnippetResponse>(`/projects/${selectedProject.id}/tracking-snippet`);
      setSnippet(nextSnippet);
      setStatusText("Tracking key rotated. Update the embed if this project is already live.");
    } catch (error: unknown) {
      setActionError(getApiErrorMessage(error, "Tracking key could not be rotated."));
    } finally {
      setRotatingKey(false);
    }
  }

  async function toggleProjectStatus() {
    if (!selectedProject) return;
    try {
      setTogglingStatus(true);
      const nextStatus = selectedProject.status === "active" ? "paused" : "active";
      const { data } = await api.patch<ProjectRead>(`/projects/${selectedProject.id}`, { status: nextStatus });
      setProjects((current) => current.map((project) => (project.id === data.id ? data : project)));
      setStatusText(nextStatus === "active" ? "Project resumed" : "Project paused");
    } catch (error: unknown) {
      setActionError(getApiErrorMessage(error, "Project status could not be updated."));
    } finally {
      setTogglingStatus(false);
    }
  }

  async function downloadFile(path: string, fileName: string) {
    try {
      const { data } = await api.get<Blob>(path, { responseType: "blob" });
      const url = window.URL.createObjectURL(data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      window.URL.revokeObjectURL(url);
      setStatusText(`${fileName} downloaded`);
    } catch (error: unknown) {
      setActionError(getApiErrorMessage(error, "Export failed."));
    }
  }

  useEffect(() => {
    void refreshWorkspace();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setDashboard(null);
      setSnippet(null);
      return;
    }
    void loadProjectData(selectedProjectId, range);
  }, [selectedProjectId, range]);

  useEffect(() => {
    if (!selectedProjectId) return;
    const interval = window.setInterval(() => void loadProjectData(selectedProjectId, range), 20000);
    return () => window.clearInterval(interval);
  }, [selectedProjectId, range]);

  return (
    <SaaSShell
      userName={user?.full_name}
      theme={theme}
      onToggleTheme={toggleTheme}
      onLogout={() => {
        clearStoredAuth();
        navigate("/login");
      }}
      statusText={statusText}
    >
      {actionError ? <section className="mb-6 rounded-[24px] border border-amber-300/80 bg-amber-50/90 px-5 py-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">{actionError}</section> : null}
      <div className="grid gap-6 xl:grid-cols-[330px,1fr]">
        <aside className="space-y-6">
          <section className="glass-panel rounded-[30px] p-5 shadow-panel">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">New Project</p>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Launch a client workspace</h2>
              </div>
              <div className="rounded-2xl bg-teal-500/15 p-3 text-teal-700 dark:text-teal-300"><Plus className="h-5 w-5" /></div>
            </div>
            <div className="mt-5 space-y-3">
              <input disabled={!canManageWorkspace} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Project name" className="w-full rounded-[22px] border border-slate-300/70 bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-teal-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950/40" />
              <input disabled={!canManageWorkspace} value={form.site_url} onChange={(event) => setForm((current) => ({ ...current, site_url: event.target.value }))} placeholder="yourdomain.com" className="w-full rounded-[22px] border border-slate-300/70 bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-teal-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950/40" />
              <input disabled={!canManageWorkspace} value={allowedDomainsInput} onChange={(event) => setAllowedDomainsInput(event.target.value)} placeholder="yourdomain.com, app.yourdomain.com" className="w-full rounded-[22px] border border-slate-300/70 bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-teal-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950/40" />
              <textarea disabled={!canManageWorkspace} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="What this site measures, who uses it, and what a win looks like." className="min-h-[120px] w-full rounded-[22px] border border-slate-300/70 bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-teal-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950/40" />
              {!canManageWorkspace ? <div className="text-sm text-slate-500 dark:text-slate-400">Your role is view-only in this workspace. Owners and admins can create projects.</div> : null}
              <button onClick={() => void createProject()} disabled={!canManageWorkspace || creating || !form.name.trim() || !form.site_url.trim()} className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60 dark:bg-white dark:text-slate-950">{creating ? "Creating..." : "Create project"}</button>
            </div>
          </section>

          <section className="glass-panel rounded-[30px] p-5 shadow-panel">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Portfolio</p>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Multi-project view</h2>
              </div>
              <button onClick={() => void refreshWorkspace(true)} className="rounded-2xl border border-slate-300/70 bg-white/85 p-3 text-slate-700 transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-100"><RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /></button>
            </div>
            <div className="mt-5 space-y-3">
              {projects.length === 0 ? <div className="rounded-[24px] border border-dashed border-slate-300/80 bg-white/70 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-400">Create your first project to generate a hosted tracking snippet and unlock the dashboard.</div> : null}
              {projects.map((project) => (
                <button key={project.id} onClick={() => setSelectedProjectId(project.id)} className={`w-full rounded-[24px] border p-4 text-left transition hover:-translate-y-0.5 ${selectedProjectId === project.id ? "border-teal-400 bg-teal-500/10" : "border-slate-200/80 bg-white/70 dark:border-slate-700 dark:bg-slate-950/30"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{project.name}</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{project.site_url}</div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${project.tracking_status === "live" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-slate-500/15 text-slate-600 dark:text-slate-300"}`}>{project.tracking_status === "live" ? "live" : "install"}</span>
                  </div>
                  <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">Last event: {project.last_event_at ? formatDate(project.last_event_at) : "waiting for install"}</div>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <main className="space-y-6">
          {loading ? <section className="glass-panel rounded-[30px] p-8 text-sm text-slate-600 shadow-panel dark:text-slate-300">Loading SaaS workspace...</section> : null}

          {!loading ? (
            <section className="grid gap-4 xl:grid-cols-[0.88fr,1.12fr]">
              <PlanUsageCard summary={workspaceSummary} changingPlan={changingPlan} onChangePlan={changePlan} />
              <TeamManagementCard
                summary={workspaceSummary}
                members={teamMembers}
                invitations={teamInvitations}
                incomingInvitations={incomingInvitations}
                inviteEmail={inviteEmail}
                inviteRole={inviteRole}
                inviting={inviting}
                acceptingInviteToken={acceptingInviteToken}
                onInviteEmailChange={setInviteEmail}
                onInviteRoleChange={setInviteRole}
                onInvite={() => void inviteTeammate()}
                onRemoveMember={(memberId) => void removeMember(memberId)}
                onRevokeInvitation={(invitationId) => void revokeInvitation(invitationId)}
                onAcceptInvitation={(inviteToken) => void acceptInvitation(inviteToken)}
              />
            </section>
          ) : null}

          {!loading && !selectedProject ? (
            <section className="glass-panel rounded-[34px] p-10 text-center shadow-panel">
              <div className="mx-auto max-w-3xl">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-950 text-white dark:bg-white dark:text-slate-950"><BarChart3 className="h-8 w-8" /></div>
                <h2 className="mt-6 font-display text-5xl font-bold tracking-tight text-slate-950 dark:text-white">Turn the dashboard into a premium analytics product</h2>
                <p className="mt-4 text-sm leading-8 text-slate-600 dark:text-slate-300">Add a website, generate the tracking script, and this workspace becomes a client-facing analytics SaaS with multi-project management, exports, and insight automation.</p>
              </div>
            </section>
          ) : null}

          {selectedProject ? (
            <>
              <section className="glass-panel rounded-[32px] p-6 shadow-panel">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="max-w-3xl">
                    <div className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 dark:bg-white/10 dark:text-slate-300"><Globe className="mr-2 h-3.5 w-3.5" />{selectedProject.status === "active" ? "Live collection" : "Paused collection"}</div>
                    <h2 className="mt-4 font-display text-5xl font-bold tracking-tight text-slate-950 dark:text-white">{selectedProject.name}</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{selectedProject.site_url}{selectedProject.allowed_domains.length > 0 ? ` | Allowed domains: ${selectedProject.allowed_domains.join(", ")}` : ""}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <select value={range} onChange={(event) => setRange(event.target.value as (typeof rangeOptions)[number])} className="rounded-2xl border border-slate-300/70 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-100">
                      {rangeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <button onClick={() => void refreshWorkspace(true)} className="inline-flex items-center rounded-2xl border border-slate-300/70 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-100"><RefreshCcw className={`mr-2 h-4 w-4 ${loadingProjectData ? "animate-spin" : ""}`} />Refresh</button>
                    {canManageWorkspace ? <button onClick={() => void toggleProjectStatus()} disabled={togglingStatus} className="inline-flex items-center rounded-2xl border border-slate-300/70 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-100">{selectedProject.status === "active" ? <PauseCircle className="mr-2 h-4 w-4" /> : <PlayCircle className="mr-2 h-4 w-4" />}{selectedProject.status === "active" ? "Pause" : "Resume"}</button> : null}
                    <button onClick={() => void downloadFile(`/projects/${selectedProject.id}/export.csv?range=${range}`, `${selectedProject.slug}-${range}.csv`)} className="inline-flex items-center rounded-2xl border border-slate-300/70 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-100"><Download className="mr-2 h-4 w-4" />CSV</button>
                    <button onClick={() => void downloadFile(`/projects/${selectedProject.id}/export.pdf?range=${range}`, `${selectedProject.slug}-${range}.pdf`)} className="inline-flex items-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"><Download className="mr-2 h-4 w-4" />PDF</button>
                  </div>
                </div>
              </section>

              {dashboard ? (
                <>
                  <MetricStrip metrics={dashboard.metrics} />
                  <section className="grid gap-4 xl:grid-cols-4">
                    <CompactMetric label="Bounce Rate" value={`${dashboard.metrics.bounce_rate}%`} hint="Single-page sessions" icon={Activity} />
                    <CompactMetric label="Conversion Rate" value={`${dashboard.metrics.conversion_rate}%`} hint="Sessions with core events" icon={BadgeCheck} />
                    <CompactMetric label="Growth" value={`${dashboard.metrics.traffic_growth_percent}%`} hint="Versus previous period" icon={TrendingUp} />
                    <CompactMetric label="Active Visitors" value={formatNumber(dashboard.metrics.active_visitors)} hint="Seen in the last 5 minutes" icon={Zap} />
                  </section>

                  <section className="grid gap-4 xl:grid-cols-[1.4fr,0.6fr]">
                    <section className="glass-panel rounded-[30px] p-5 shadow-panel">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Traffic Trend</p>
                      <h3 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Visitors, sessions, and pageviews</h3>
                      <div className="mt-6 h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={dashboard.time_series}>
                            <defs><linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0f766e" stopOpacity={0.45} /><stop offset="95%" stopColor="#0f766e" stopOpacity={0.05} /></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                            <XAxis dataKey="period" tickLine={false} axisLine={false} minTickGap={28} />
                            <YAxis tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Area type="monotone" dataKey="pageviews" stroke="#0f766e" fill="url(#trafficGradient)" />
                            <Area type="monotone" dataKey="sessions" stroke="#f97316" fillOpacity={0} />
                            <Area type="monotone" dataKey="visitors" stroke="#0ea5e9" fillOpacity={0} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </section>
                    <section className="glass-panel rounded-[30px] p-5 shadow-panel">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Device Mix</p>
                      <h3 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Where users browse</h3>
                      <div className="mt-6 h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={dashboard.device_breakdown} dataKey="value" nameKey="label" innerRadius={70} outerRadius={110} paddingAngle={3}>
                              {dashboard.device_breakdown.map((entry, index) => <Cell key={entry.label} fill={deviceColors[index % deviceColors.length]} />)}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </section>
                  </section>

                  <section className="grid gap-4 xl:grid-cols-[1fr,1fr]">
                    <section className="glass-panel rounded-[30px] p-5 shadow-panel">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Top Pages</p>
                      <h3 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Highest-traffic paths</h3>
                      <div className="mt-6 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dashboard.top_pages}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                            <XAxis dataKey="label" tickLine={false} axisLine={false} />
                            <YAxis tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#0f766e" radius={[10, 10, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </section>
                    <MetricList title="Top Referrers" subtitle="Acquisition" items={dashboard.top_referrers} />
                  </section>

                  <section className="grid gap-4 xl:grid-cols-[1fr,1fr]">
                    <TrackingInstallCard projectName={selectedProject.name} snippet={snippet} canRotate={Boolean(canManageWorkspace)} rotating={rotatingKey} onRotate={() => void rotateProjectKey()} />
                    <section className="glass-panel rounded-[30px] p-5 shadow-panel">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">AI Insights</p>
                      <h3 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Sales-ready narrative</h3>
                      <div className="mt-5 space-y-3">
                        {dashboard.insights.map((insight) => (
                          <article key={insight.title} className="rounded-[24px] border border-slate-200/80 bg-white/75 p-4 dark:border-slate-700 dark:bg-slate-950/30">
                            <div className="font-semibold text-slate-900 dark:text-white">{insight.title}</div>
                            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{insight.detail}</p>
                          </article>
                        ))}
                      </div>
                    </section>
                  </section>

                  <section className="grid gap-4 xl:grid-cols-[0.8fr,1.2fr]">
                    <MetricList title="Custom Events" subtitle="Activation" items={dashboard.event_breakdown} />
                    <RecentEventsTable events={dashboard.recent_events} />
                  </section>
                </>
              ) : (
                <section className="glass-panel rounded-[30px] p-8 shadow-panel">
                  <div className="mx-auto max-w-2xl text-center">
                    <h3 className="font-display text-4xl font-bold tracking-tight text-slate-950 dark:text-white">Install the tracker to activate analytics</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">This project is ready, but it has not received website traffic yet. Add the script tag, then reload this page to watch pageviews and events arrive.</p>
                  </div>
                </section>
              )}
            </>
          ) : null}
        </main>
      </div>
    </SaaSShell>
  );
}

export default SaaSWorkspacePage;
