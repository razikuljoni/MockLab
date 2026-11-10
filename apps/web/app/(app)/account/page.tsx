"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import {
  User,
  Lock,
  Github,
  Sun,
  Moon,
  Laptop,
  Command,
  Key,
  Check,
  AlertCircle,
} from "lucide-react";

export default function AccountPage() {
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState("MD Razikul Islam Joni");
  const [email] = useState("razikuljoni@gmail.com");
  const [profileSaved, setProfileSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordStatus("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordStatus("Password must be at least 8 characters");
      return;
    }
    setPasswordStatus("Password updated successfully");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordStatus(null), 3000);
  };

  const shortcuts = [
    { key: "⌘ + Enter", desc: "Send request in Request Playground" },
    { key: "⌘ + L", desc: "Focus request URL bar" },
    { key: "⌘ + S", desc: "Save playground request to history" },
    { key: "⌘ + K", desc: "Open global search and command palette" },
    { key: "Esc", desc: "Close open modal or drawer" },
    { key: "↑ / ↓", desc: "Navigate through search or table results" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="space-y-1 border-b border-[var(--border)] pb-4">
        <h1 className="text-2xl font-bold text-[var(--ink)]">Account &amp; Preferences</h1>
        <p className="text-xs text-[var(--ink-2)]">
          Manage your personal profile, security credentials, appearance, and keyboard shortcuts
        </p>
      </div>

      {/* 1. Profile Information */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[var(--surface-2)] flex items-center justify-center text-[var(--signal)]">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--ink)]">Profile Details</h2>
            <p className="text-xs text-[var(--ink-3)]">Your primary identity in MockLab workspaces</p>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4 max-w-lg text-xs">
          <div className="space-y-1.5">
            <label className="font-medium text-[var(--ink)]">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--surface-0)] text-[var(--ink)] focus:outline-none focus:border-[var(--signal)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-[var(--ink)]">Email Address</label>
            <input
              type="email"
              disabled
              value={email}
              className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink-3)] cursor-not-allowed"
            />
            <span className="text-[11px] text-[var(--ink-3)]">Email cannot be changed on free plan.</span>
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-[var(--signal)] text-[var(--surface-0)] font-semibold text-xs hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            {profileSaved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved Changes</span>
              </>
            ) : (
              <span>Save Profile</span>
            )}
          </button>
        </form>
      </section>

      {/* 2. Security & Password */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[var(--surface-2)] flex items-center justify-center text-[var(--signal)]">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--ink)]">Change Password</h2>
            <p className="text-xs text-[var(--ink-3)]">Update your account authentication credentials</p>
          </div>
        </div>

        {passwordStatus && (
          <div
            className={`p-3 rounded-md text-xs flex items-center gap-2 ${
              passwordStatus.includes("successfully")
                ? "bg-[var(--success)]/10 border border-[var(--success)]/30 text-[var(--success)]"
                : "bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)]"
            }`}
          >
            {passwordStatus.includes("successfully") ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{passwordStatus}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg text-xs">
          <div className="space-y-1.5">
            <label className="font-medium text-[var(--ink)]">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--surface-0)] text-[var(--ink)] focus:outline-none focus:border-[var(--signal)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-[var(--ink)]">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--surface-0)] text-[var(--ink)] focus:outline-none focus:border-[var(--signal)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-medium text-[var(--ink)]">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--surface-0)] text-[var(--ink)] focus:outline-none focus:border-[var(--signal)]"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink)] font-semibold text-xs hover:bg-[var(--surface-0)] transition-colors"
          >
            Update Password
          </button>
        </form>
      </section>

      {/* 3. Connected Accounts */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[var(--surface-2)] flex items-center justify-center text-[var(--signal)]">
            <Github className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--ink)]">Connected Accounts</h2>
            <p className="text-xs text-[var(--ink-3)]">Sign in with third-party developer providers</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface-0)] text-xs">
          <div className="flex items-center gap-3">
            <Github className="w-5 h-5 text-[var(--ink)]" />
            <div>
              <span className="font-medium text-[var(--ink)] block">GitHub Account</span>
              <span className="text-[11px] text-[var(--ink-3)]">Connected as @razikuljoni</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20 font-semibold text-[11px]">
            Connected
          </span>
        </div>
      </section>

      {/* 4. Appearance & Theme */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[var(--surface-2)] flex items-center justify-center text-[var(--signal)]">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--ink)]">Appearance</h2>
            <p className="text-xs text-[var(--ink-3)]">
              MockLab is dark-first with electric Signal Lime accents (§3.1)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs max-w-md">
          <button
            onClick={() => setTheme("dark")}
            className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-colors ${
              theme === "dark"
                ? "border-[var(--signal)] bg-[var(--signal-dim)] text-[var(--signal)] font-medium"
                : "border-[var(--border)] bg-[var(--surface-0)] text-[var(--ink-2)] hover:text-[var(--ink)]"
            }`}
          >
            <Moon className="w-5 h-5" />
            <span>Dark (Default)</span>
          </button>

          <button
            onClick={() => setTheme("light")}
            className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-colors ${
              theme === "light"
                ? "border-[var(--signal)] bg-[var(--signal-dim)] text-[var(--signal)] font-medium"
                : "border-[var(--border)] bg-[var(--surface-0)] text-[var(--ink-2)] hover:text-[var(--ink)]"
            }`}
          >
            <Sun className="w-5 h-5" />
            <span>Light</span>
          </button>

          <button
            onClick={() => setTheme("system")}
            className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-colors ${
              theme === "system"
                ? "border-[var(--signal)] bg-[var(--signal-dim)] text-[var(--signal)] font-medium"
                : "border-[var(--border)] bg-[var(--surface-0)] text-[var(--ink-2)] hover:text-[var(--ink)]"
            }`}
          >
            <Laptop className="w-5 h-5" />
            <span>System</span>
          </button>
        </div>
      </section>

      {/* 5. Keyboard Shortcuts Sheet (§2.1 Screen 22) */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[var(--surface-2)] flex items-center justify-center text-[var(--signal)]">
            <Command className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--ink)]">Keyboard Shortcuts</h2>
            <p className="text-xs text-[var(--ink-3)]">Speed up your API mocking workflow</p>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-0)] overflow-hidden">
          <table className="w-full text-xs text-left">
            <tbody className="divide-y divide-[var(--border)]">
              {shortcuts.map((sc, i) => (
                <tr key={i} className="hover:bg-[var(--surface-2)] transition-colors">
                  <td className="p-3 font-mono font-medium text-[var(--signal)] w-40">
                    <kbd className="px-2 py-0.5 rounded bg-[var(--surface-1)] border border-[var(--border)]">
                      {sc.key}
                    </kbd>
                  </td>
                  <td className="p-3 text-[var(--ink-2)]">{sc.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Personal CLI Token */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[var(--surface-2)] flex items-center justify-center text-[var(--signal)]">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--ink)]">Personal CLI Token</h2>
            <p className="text-xs text-[var(--ink-3)]">For authenticating the mocklab CLI and local proxies</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-md bg-[var(--surface-3)] border border-[var(--border)] font-mono text-xs text-[var(--ink-2)]">
          <span className="flex-1 truncate">mk_live_••••••••••••••••••••••••••••••••</span>
          <button className="px-3 py-1 rounded bg-[var(--surface-1)] border border-[var(--border)] text-[var(--ink)] text-[11px] hover:bg-[var(--surface-2)]">
            Rotate Token
          </button>
        </div>
      </section>
    </div>
  );
}
