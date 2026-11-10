"use client";

import { useState } from "react";
import {
  Settings,
  Shield,
  Clock,
  PauseCircle,
  Trash2,
  AlertTriangle,
  Check,
  Save,
  Globe,
  Sliders,
  X,
} from "lucide-react";

export default function WorkspaceSettingsPage() {
  const [name, setName] = useState("Acme Corp");
  const [slug, setSlug] = useState("acme-corp");
  const [defaultEnv, setDefaultEnv] = useState("development");
  const [mockAuthDefault, setMockAuthDefault] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [logRetentionDays, setLogRetentionDays] = useState(14);
  const [isSaved, setIsSaved] = useState(false);

  // Danger zone modals
  const [isPauseAllOpen, setIsPauseAllOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [pausedSuccess, setPausedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handlePauseAll = () => {
    setPausedSuccess(true);
    setIsPauseAllOpen(false);
    setTimeout(() => setPausedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-[var(--border)]">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--ink)]">Workspace Settings</h1>
        <p className="text-xs text-[var(--ink-2)] mt-1">
          Configure general properties, default mock security postures, traffic log retention, and administrative controls.
        </p>
      </div>

      {pausedSuccess && (
        <div className="p-3.5 rounded-xl border border-[var(--warning)]/40 bg-[var(--warning)]/10 text-xs text-[var(--warning)] flex items-center gap-2">
          <PauseCircle className="w-4 h-4 shrink-0" />
          <span>All mock projects in this workspace have been paused. Traffic will receive HTTP 503 until resumed.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Settings */}
        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
            <Globe className="w-4 h-4 text-[var(--signal)]" />
            <h2 className="text-sm font-semibold text-[var(--ink)]">General Workspace Info</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--ink-2)]">Workspace Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-0)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--signal)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--ink-2)]">Workspace Slug (URL Prefix)</label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-[var(--surface-2)] border border-r-0 border-[var(--border)] rounded-l-lg text-xs font-mono text-[var(--ink-3)]">
                  mocklab.io/
                </span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  className="w-full px-3 py-2 rounded-r-lg bg-[var(--surface-0)] border border-[var(--border)] text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[var(--signal)]"
                />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium text-[var(--ink-2)]">Default Environment</label>
              <select
                value={defaultEnv}
                onChange={(e) => setDefaultEnv(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-0)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--signal)]"
              >
                <option value="development">development (Local & Sandbox prototyping)</option>
                <option value="staging">staging (Pre-production contract verification)</option>
                <option value="production">production (Live integration mock baseline)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mock Engine & Auth Defaults */}
        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
            <Shield className="w-4 h-4 text-[var(--signal)]" />
            <h2 className="text-sm font-semibold text-[var(--ink)]">Mock Engine Security Defaults</h2>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-medium text-[var(--ink-2)]">Default Mock Authentication Posture</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMockAuthDefault("PUBLIC")}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  mockAuthDefault === "PUBLIC"
                    ? "border-[var(--signal)] bg-[var(--signal-dim)] text-[var(--signal)] font-medium"
                    : "border-[var(--border)] bg-[var(--surface-0)] text-[var(--ink-2)] hover:border-[var(--border-strong)]"
                }`}
              >
                <div className="text-xs font-semibold">Public by Default</div>
                <p className="text-[11px] text-[var(--ink-3)] mt-1">
                  Anyone with the mock endpoint URL can execute requests. Ideal for frontend teams without API keys.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMockAuthDefault("PRIVATE")}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  mockAuthDefault === "PRIVATE"
                    ? "border-[var(--signal)] bg-[var(--signal-dim)] text-[var(--signal)] font-medium"
                    : "border-[var(--border)] bg-[var(--surface-0)] text-[var(--ink-2)] hover:border-[var(--border-strong)]"
                }`}
              >
                <div className="text-xs font-semibold">Private by Default</div>
                <p className="text-[11px] text-[var(--ink-3)] mt-1">
                  Rejects unauthenticated traffic with HTTP 401. Requires X-MockLab-Key header or Bearer token.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Traffic Log Retention */}
        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
            <Clock className="w-4 h-4 text-[var(--signal)]" />
            <h2 className="text-sm font-semibold text-[var(--ink)]">Traffic Log Retention</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--ink-2)]">Automatic Purge Window</label>
              <span className="text-xs font-mono text-[var(--signal)]">{logRetentionDays} days</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[7, 14, 30, 90].map((days) => (
                <button
                  type="button"
                  key={days}
                  onClick={() => setLogRetentionDays(days)}
                  className={`py-2 px-3 rounded-lg border text-center text-xs font-mono transition-all cursor-pointer ${
                    logRetentionDays === days
                      ? "border-[var(--signal)] bg-[var(--signal-dim)] text-[var(--signal)] font-medium"
                      : "border-[var(--border)] bg-[var(--surface-0)] text-[var(--ink-2)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[var(--ink-3)]">
              Incoming mock requests and responses older than this window are permanently purged during scheduled maintenance.
            </p>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isSaved && (
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--success)] font-medium">
              <Check className="w-3.5 h-3.5" />
              Settings Saved
            </span>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--signal)] text-[var(--surface-0)] font-medium text-xs hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* Danger Zone (§6.8 & §10) */}
      <div className="p-6 rounded-xl border border-[var(--error)]/30 bg-[var(--surface-1)] space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[var(--error)]/20 text-[var(--error)]">
          <AlertTriangle className="w-4 h-4" />
          <h2 className="text-sm font-semibold">Danger Zone</h2>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {/* Pause All Mocks */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-[var(--ink)]">Pause All Mock Servers</div>
              <div className="text-[11px] text-[var(--ink-3)] mt-0.5">
                Temporarily pause all mock endpoints across every project in this workspace. Callers receive HTTP 503.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPauseAllOpen(true)}
              className="px-3.5 py-1.5 rounded-lg border border-[var(--warning)]/50 text-[var(--warning)] hover:bg-[var(--warning)]/10 text-xs font-medium transition-colors shrink-0 cursor-pointer"
            >
              Pause All Mocks
            </button>
          </div>

          {/* Delete Workspace */}
          <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-[var(--ink)]">Delete Workspace</div>
              <div className="text-[11px] text-[var(--ink-3)] mt-0.5">
                Permanently delete this workspace, including all mock projects, scenarios, traffic logs, and contract suites. Owner only.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              className="px-3.5 py-1.5 rounded-lg border border-[var(--error)]/50 text-[var(--error)] hover:bg-[var(--error)]/10 text-xs font-medium transition-colors shrink-0 cursor-pointer"
            >
              Delete Workspace
            </button>
          </div>
        </div>
      </div>

      {/* Pause All Modal */}
      {isPauseAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-1)] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--warning)]/15 text-[var(--warning)] flex items-center justify-center">
                <PauseCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[var(--ink)]">Pause All Mock Servers?</h3>
                <p className="text-xs text-[var(--ink-3)]">Immediate traffic halt across projects</p>
              </div>
            </div>

            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              This will transition all projects in <span className="font-mono text-[var(--ink)]">{slug}</span> into the PAUSED status. Any inbound client requests will immediately receive HTTP 503 until manually unpaused.
            </p>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-[var(--border)]">
              <button
                onClick={() => setIsPauseAllOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--ink-2)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePauseAll}
                className="px-4 py-1.5 rounded-lg bg-[var(--warning)] text-[var(--surface-0)] text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
              >
                Yes, Pause All Mocks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Workspace Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--error)]/50 bg-[var(--surface-1)] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-[var(--error)]">
              <div className="w-10 h-10 rounded-xl bg-[var(--error)]/15 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Delete Workspace Permanently</h3>
                <p className="text-xs text-[var(--ink-3)]">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              To confirm deletion, please type <span className="font-mono font-semibold text-[var(--error)]">{slug}</span> below:
            </p>

            <input
              type="text"
              placeholder={slug}
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--surface-0)] border border-[var(--border)] text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[var(--error)]"
            />

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-[var(--border)]">
              <button
                onClick={() => {
                  setIsDeleteOpen(false);
                  setDeleteConfirmText("");
                }}
                className="px-3.5 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--ink-2)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={deleteConfirmText !== slug}
                onClick={() => {
                  alert("Workspace deleted");
                  setIsDeleteOpen(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-[var(--error)] text-white text-xs font-medium hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity cursor-pointer"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
