"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FolderGit2,
  Plus,
  Search,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";

export default function ProjectsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);

  // Initial projects list including seeded Petstore demo
  const [projects, setProjects] = useState([
    {
      id: "petstore",
      name: "Petstore Demo",
      slug: "petstore",
      environment: "dev",
      mockUrl: "https://petstore.mocklab.dev",
      endpointsCount: 8,
      rulesCount: 12,
      requestsToday: 1420,
      contractStatus: "PASS",
      updatedAt: "10 mins ago",
      isDemo: true,
    },
    {
      id: "payments-api",
      name: "Payments Service",
      slug: "payments",
      environment: "staging",
      mockUrl: "https://payments.mocklab.dev",
      endpointsCount: 14,
      rulesCount: 22,
      requestsToday: 4890,
      contractStatus: "PASS",
      updatedAt: "2 hours ago",
      isDemo: false,
    },
  ]);

  // New project form state
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectSlug, setNewProjectSlug] = useState("");

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName) return;

    const slug = newProjectSlug || newProjectName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const newProj = {
      id: slug,
      name: newProjectName,
      slug,
      environment: "dev",
      mockUrl: `https://${slug}.mocklab.dev`,
      endpointsCount: 0,
      rulesCount: 0,
      requestsToday: 0,
      contractStatus: "PASS",
      updatedAt: "Just now",
      isDemo: false,
    };

    setProjects([newProj, ...projects]);
    setShowNewModal(false);
    setNewProjectName("");
    setNewProjectSlug("");
  };

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ink)]">Projects</h1>
          <p className="text-xs text-[var(--ink-2)]">
            Manage your API mock servers, imported schemas, and contract environments
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 rounded-md bg-[var(--signal)] text-[var(--surface-0)] font-semibold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter projects by name or slug..."
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-1)] text-xs text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:border-[var(--signal)]"
          />
        </div>
        <span className="text-xs text-[var(--ink-3)]">
          Showing {filteredProjects.length} of {projects.length} projects
        </span>
      </div>

      {/* Projects Grid / List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredProjects.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5 space-y-4 hover:border-[var(--border-strong)] transition-all"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/projects/${p.id}`}
                    className="font-semibold text-base text-[var(--ink)] hover:text-[var(--signal)] transition-colors"
                  >
                    {p.name}
                  </Link>
                  {p.isDemo && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--signal-dim)] text-[var(--signal)] font-medium">
                      Demo
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 rounded border border-[var(--border)] text-[10px] text-[var(--ink-3)] font-mono">
                    {p.environment}
                  </span>
                </div>

                {/* Mock Base URL with Copy Button */}
                <div className="flex items-center gap-2 text-xs font-mono text-[var(--ink-2)]">
                  <span>{p.mockUrl}</span>
                  <button
                    onClick={() => copyUrl(p.id, p.mockUrl)}
                    className="p-1 rounded hover:bg-[var(--surface-2)] text-[var(--ink-3)] hover:text-[var(--ink)]"
                    title="Copy Mock URL"
                  >
                    {copiedId === p.id ? (
                      <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Status and Timestamp */}
              <div className="text-right space-y-1 text-xs">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20 font-semibold text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Contracts: {p.contractStatus}</span>
                </div>
                <div className="text-[11px] text-[var(--ink-3)]">Updated {p.updatedAt}</div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-[var(--border)] text-xs">
              <div>
                <span className="text-[var(--ink-3)] block text-[11px]">Endpoints</span>
                <span className="font-semibold text-[var(--ink)]">{p.endpointsCount}</span>
              </div>
              <div>
                <span className="text-[var(--ink-3)] block text-[11px]">Active Rules</span>
                <span className="font-semibold text-[var(--ink)]">{p.rulesCount}</span>
              </div>
              <div>
                <span className="text-[var(--ink-3)] block text-[11px]">Requests Today</span>
                <span className="font-mono font-semibold text-[var(--signal)]">
                  {p.requestsToday.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[var(--ink-3)] block text-[11px]">Mode</span>
                <span className="text-[var(--success)] font-medium">Live</span>
              </div>
            </div>

            {/* Action Links */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
              <div className="flex items-center gap-4">
                <Link
                  href={`/projects/${p.id}/playground`}
                  className="flex items-center gap-1 text-[var(--signal)] font-medium hover:underline"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Open Playground</span>
                </Link>
                <Link
                  href={`/projects/${p.id}/endpoints`}
                  className="flex items-center gap-1 text-[var(--ink-2)] hover:text-[var(--ink)]"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Endpoints</span>
                </Link>
                <Link
                  href={`/projects/${p.id}/logs`}
                  className="flex items-center gap-1 text-[var(--ink-2)] hover:text-[var(--ink)]"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Traffic</span>
                </Link>
              </div>

              <Link
                href={`/projects/${p.id}`}
                className="text-[var(--ink-3)] hover:text-[var(--ink)] flex items-center gap-1 text-[11px]"
              >
                <span>Project Settings</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* New Project Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-2xl space-y-5">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-[var(--ink)]">Create New Project</h2>
              <p className="text-xs text-[var(--ink-2)]">
                Deploy a dedicated API mock server with isolated rules and state
              </p>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-[var(--ink)]">Project Name</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => {
                    setNewProjectName(e.target.value);
                    if (!newProjectSlug) {
                      setNewProjectSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                    }
                  }}
                  placeholder="e.g. Users Service"
                  className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--surface-0)] text-[var(--ink)] focus:outline-none focus:border-[var(--signal)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-[var(--ink)]">URL Slug</label>
                <div className="flex items-center rounded-md border border-[var(--border)] bg-[var(--surface-0)] px-3 text-[var(--ink-3)] font-mono">
                  <span>https://</span>
                  <input
                    type="text"
                    required
                    value={newProjectSlug}
                    onChange={(e) => setNewProjectSlug(e.target.value.toLowerCase())}
                    placeholder="users-service"
                    className="flex-1 bg-transparent py-2 px-1 text-[var(--ink)] focus:outline-none"
                  />
                  <span>.mocklab.dev</span>
                </div>
              </div>

              <div className="p-3 rounded-md border border-[var(--border)] bg-[var(--surface-0)] space-y-1 text-[11px] text-[var(--ink-3)]">
                <div>Mock Auth: <strong>Private (Default)</strong> — Requires X-MockLab-Key</div>
                <div>Protocol: <strong>REST &amp; GraphQL</strong> supported</div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-md border border-[var(--border)] text-[var(--ink-2)] hover:bg-[var(--surface-2)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-[var(--signal)] text-[var(--surface-0)] font-semibold hover:opacity-90"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
