import { MailPlus, Shield, Trash2, UserPlus2, Users } from "lucide-react";
import type { TeamInvitation, TeamMember, WorkspaceSummary } from "../../api/types";
import { formatDate } from "../../utils/format";

interface TeamManagementCardProps {
  summary: WorkspaceSummary | null;
  members: TeamMember[];
  invitations: TeamInvitation[];
  incomingInvitations: TeamInvitation[];
  inviteEmail: string;
  inviteRole: "admin" | "member";
  inviting: boolean;
  acceptingInviteToken: string | null;
  onInviteEmailChange: (value: string) => void;
  onInviteRoleChange: (value: "admin" | "member") => void;
  onInvite: () => void;
  onRemoveMember: (memberId: string) => void;
  onRevokeInvitation: (invitationId: string) => void;
  onAcceptInvitation: (inviteToken: string) => void;
}

function TeamManagementCard({
  summary,
  members,
  invitations,
  incomingInvitations,
  inviteEmail,
  inviteRole,
  inviting,
  acceptingInviteToken,
  onInviteEmailChange,
  onInviteRoleChange,
  onInvite,
  onRemoveMember,
  onRevokeInvitation,
  onAcceptInvitation,
}: TeamManagementCardProps) {
  if (!summary) {
    return null;
  }

  const canManage = summary.role === "owner" || summary.role === "admin";

  return (
    <section className="glass-panel rounded-[30px] p-5 shadow-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Team access</p>
          <h3 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Workspace members</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Owner workspace: <span className="font-semibold text-slate-900 dark:text-white">{summary.owner_name}</span>
          </p>
        </div>
        <div className="rounded-[24px] border border-slate-200/80 bg-white/75 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-300">
          {summary.usage.team_members_used} / {summary.usage.team_members_limit} seats used
        </div>
      </div>

      {incomingInvitations.length > 0 ? (
        <div className="mt-5 rounded-[24px] border border-teal-300/70 bg-teal-50/70 p-4 dark:border-teal-500/30 dark:bg-teal-500/10">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <MailPlus className="h-4 w-4 text-teal-700 dark:text-teal-300" />
            Pending invitations for this account
          </div>
          <div className="mt-3 space-y-3">
            {incomingInvitations.map((invitation) => (
              <div key={invitation.id} className="flex flex-col gap-3 rounded-[20px] bg-white/75 px-4 py-4 dark:bg-slate-950/30 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-700 dark:text-slate-200">
                  Join <span className="font-semibold">{invitation.email}</span> as <span className="font-semibold">{invitation.role}</span>
                </div>
                <button
                  onClick={() => onAcceptInvitation(invitation.invite_token)}
                  disabled={acceptingInviteToken === invitation.invite_token}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60 dark:bg-white dark:text-slate-950"
                >
                  {acceptingInviteToken === invitation.invite_token ? "Accepting..." : "Accept invite"}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {canManage ? (
        <div className="mt-5 rounded-[24px] border border-slate-200/80 bg-white/75 p-4 dark:border-slate-700 dark:bg-slate-950/30">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <UserPlus2 className="h-4 w-4" />
            Invite teammate
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr,160px,140px]">
            <input
              value={inviteEmail}
              onChange={(event) => onInviteEmailChange(event.target.value)}
              placeholder="teammate@company.com"
              className="rounded-[20px] border border-slate-300/70 bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950/40"
            />
            <select
              value={inviteRole}
              onChange={(event) => onInviteRoleChange(event.target.value as "admin" | "member")}
              className="rounded-[20px] border border-slate-300/70 bg-white/85 px-4 py-3 text-sm outline-none transition focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950/40"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={onInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60 dark:bg-white dark:text-slate-950"
            >
              {inviting ? "Sending..." : "Send invite"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr,1fr]">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Users className="h-4 w-4" />
            Active members
          </div>
          <div className="space-y-3">
            {members.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-slate-300/80 bg-white/70 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-400">
                No invited members yet.
              </div>
            ) : null}
            {members.map((member) => (
              <div key={member.id} className="rounded-[20px] border border-slate-200/80 bg-white/75 px-4 py-4 dark:border-slate-700 dark:bg-slate-950/30">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{member.member_name}</div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{member.member_email}</div>
                    <div className="mt-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      <Shield className="h-3.5 w-3.5" />
                      {member.role}
                    </div>
                  </div>
                  {canManage ? (
                    <button
                      onClick={() => onRemoveMember(member.id)}
                      className="rounded-2xl border border-slate-300/70 bg-white/80 p-3 text-slate-700 transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <MailPlus className="h-4 w-4" />
            Open invitations
          </div>
          <div className="space-y-3">
            {invitations.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-slate-300/80 bg-white/70 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-400">
                No pending invites.
              </div>
            ) : null}
            {invitations.map((invitation) => (
              <div key={invitation.id} className="rounded-[20px] border border-slate-200/80 bg-white/75 px-4 py-4 dark:border-slate-700 dark:bg-slate-950/30">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{invitation.email}</div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {invitation.role} | {invitation.status}
                    </div>
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Expires {formatDate(invitation.expires_at)}</div>
                  </div>
                  {canManage && invitation.status === "pending" ? (
                    <button
                      onClick={() => onRevokeInvitation(invitation.id)}
                      className="rounded-2xl border border-slate-300/70 bg-white/80 p-3 text-slate-700 transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TeamManagementCard;
