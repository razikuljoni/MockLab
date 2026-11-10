"use client";

import { useState } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Eye,
  MoreVertical,
  Check,
  X,
  Mail,
  Calendar,
  AlertCircle,
} from "lucide-react";

interface Member {
  userId: string;
  name: string | null;
  email: string;
  role: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";
  joinedAt: string;
  avatarUrl: string | null;
}

const INITIAL_MEMBERS: Member[] = [
  {
    userId: "usr_owner_1",
    name: "Alex Mercer",
    email: "alex@acme.dev",
    role: "OWNER",
    joinedAt: "2026-01-15T09:00:00Z",
    avatarUrl: null,
  },
  {
    userId: "usr_admin_2",
    name: "Samantha Vance",
    email: "sam@acme.dev",
    role: "ADMIN",
    joinedAt: "2026-02-10T14:30:00Z",
    avatarUrl: null,
  },
  {
    userId: "usr_editor_3",
    name: "Devon Reed",
    email: "devon@acme.dev",
    role: "EDITOR",
    joinedAt: "2026-03-01T11:15:00Z",
    avatarUrl: null,
  },
  {
    userId: "usr_viewer_4",
    name: "Jordan Lee",
    email: "jordan.qa@partner.io",
    role: "VIEWER",
    joinedAt: "2026-03-12T16:45:00Z",
    avatarUrl: null,
  },
];

const ROLE_DESCRIPTIONS: Record<string, { label: string; desc: string; icon: any; color: string; bg: string }> = {
  OWNER: {
    label: "Owner",
    desc: "Complete authority over projects, team members, billing, and workspace lifecycle.",
    icon: ShieldAlert,
    color: "#BFFF3C",
    bg: "rgba(191, 255, 60, 0.12)",
  },
  ADMIN: {
    label: "Admin",
    desc: "Can invite/remove members, update settings, manage API keys, and run test suites.",
    icon: ShieldCheck,
    color: "#38BDF8",
    bg: "rgba(56, 189, 248, 0.12)",
  },
  EDITOR: {
    label: "Editor",
    desc: "Can create and edit mocks, rules, scenarios, and execute tests. Billing access restricted.",
    icon: Shield,
    color: "#00E599",
    bg: "rgba(0, 229, 153, 0.12)",
  },
  VIEWER: {
    label: "Viewer",
    desc: "Read-only access to mock schemas, inspection logs, and runs. Cannot view API keys.",
    icon: Eye,
    color: "#A6B388",
    bg: "rgba(166, 179, 136, 0.12)",
  },
};

export default function WorkspaceTeamPage() {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "EDITOR" | "VIEWER">("EDITOR");
  const [roleChangeUserId, setRoleChangeUserId] = useState<string | null>(null);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const newMember: Member = {
      userId: `usr_${Date.now()}`,
      name: inviteEmail.split("@")[0],
      email: inviteEmail.trim(),
      role: inviteRole,
      joinedAt: new Date().toISOString(),
      avatarUrl: null,
    };

    setMembers((prev) => [...prev, newMember]);
    setInviteEmail("");
    setIsInviteOpen(false);
  };

  const handleRoleChange = (userId: string, newRole: Member["role"]) => {
    setMembers((prev) =>
      prev.map((m) => (m.userId === userId ? { ...m, role: newRole } : m))
    );
    setRoleChangeUserId(null);
  };

  const handleRemoveMember = (userId: string) => {
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-[var(--ink)]">Team & Permissions</h1>
            <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--border)] bg-[var(--surface-1)] text-[var(--ink-2)]">
              {members.length} members
            </span>
          </div>
          <p className="text-xs text-[var(--ink-2)] mt-1">
            Manage workspace members, assign RBAC access levels, and invite collaborators.
          </p>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[var(--signal)] text-[var(--surface-0)] font-medium text-xs hover:opacity-90 transition-opacity self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Members Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[11px] font-mono text-[var(--ink-3)] uppercase tracking-wider">
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs">
              {members.map((member) => {
                const roleConfig = ROLE_DESCRIPTIONS[member.role];
                const RoleIcon = roleConfig.icon;
                const isOwner = member.role === "OWNER";

                return (
                  <tr key={member.userId} className="hover:bg-[var(--surface-2)]/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--surface-3)] border border-[var(--border)] flex items-center justify-center font-medium text-xs text-[var(--ink)]">
                          {(member.name || member.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-[var(--ink)] flex items-center gap-2">
                            <span>{member.name || member.email.split("@")[0]}</span>
                            {isOwner && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--signal-dim)] text-[var(--signal)] font-mono">
                                Owner
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[var(--ink-3)] flex items-center gap-1.5 mt-0.5 font-mono">
                            <Mail className="w-3 h-3" />
                            <span>{member.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {roleChangeUserId === member.userId && !isOwner ? (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.userId, e.target.value as Member["role"])}
                            className="text-xs bg-[var(--surface-0)] border border-[var(--border)] rounded px-2 py-1 text-[var(--ink)] focus:outline-none focus:border-[var(--signal)]"
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="EDITOR">Editor</option>
                            <option value="VIEWER">Viewer</option>
                          </select>
                          <button
                            onClick={() => setRoleChangeUserId(null)}
                            className="p-1 rounded text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium border"
                          style={{
                            color: roleConfig.color,
                            backgroundColor: roleConfig.bg,
                            borderColor: `${roleConfig.color}30`,
                          }}
                        >
                          <RoleIcon className="w-3 h-3" />
                          <span>{roleConfig.label}</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-[var(--ink-2)] font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-[var(--ink-3)]" />
                        <span>{new Date(member.joinedAt).toLocaleDateString()}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--success)] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse"></span>
                        Active
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      {!isOwner && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setRoleChangeUserId(member.userId)}
                            className="px-2 py-1 rounded text-[11px] border border-[var(--border)] hover:bg-[var(--surface-3)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                          >
                            Change Role
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member.userId)}
                            className="px-2 py-1 rounded text-[11px] border border-[var(--border)] hover:border-[var(--error)]/50 text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RBAC Reference Cards (§6.8) */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--ink)]">Role Privileges & Matrix</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(ROLE_DESCRIPTIONS).map(([roleKey, role]) => {
            const Icon = role.icon;
            return (
              <div
                key={roleKey}
                className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center border"
                      style={{
                        color: role.color,
                        backgroundColor: role.bg,
                        borderColor: `${role.color}30`,
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-xs text-[var(--ink)]">{role.label}</span>
                  </div>
                  <span className="font-mono text-[10px] text-[var(--ink-3)]">{roleKey}</span>
                </div>
                <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">{role.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-1)] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--signal-dim)] text-[var(--signal)] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[var(--ink)]">Invite Workspace Member</h3>
                  <p className="text-xs text-[var(--ink-3)]">Send an invite link to collaborate</p>
                </div>
              </div>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--ink-2)]">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="engineer@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-0)] border border-[var(--border)] text-xs text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:border-[var(--signal)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--ink-2)]">Assigned Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["ADMIN", "EDITOR", "VIEWER"] as const).map((r) => {
                    const isSelected = inviteRole === r;
                    return (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setInviteRole(r)}
                        className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                          isSelected
                            ? "border-[var(--signal)] bg-[var(--signal-dim)] text-[var(--signal)] font-medium"
                            : "border-[var(--border)] bg-[var(--surface-0)] text-[var(--ink-2)] hover:border-[var(--border-strong)]"
                        }`}
                      >
                        <div className="text-xs">{r}</div>
                        <div className="text-[10px] text-[var(--ink-3)] mt-0.5">
                          {r === "ADMIN" ? "Manage" : r === "EDITOR" ? "Build" : "View"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--ink-2)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[var(--signal)] text-[var(--surface-0)] text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
