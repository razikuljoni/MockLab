"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Copy,
  Check,
  RotateCcw,
  Pause,
  Play,
  Terminal,
  Activity,
  UploadCloud,
  FileCheck2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { apiRequest, getApiBaseUrl } from "../../../../lib/api";

export default function ProjectOverviewPage() {
  const params = useParams();
  const projectId = (params?.id as string) || "petstore";

  const [project, setProject] = useState<any>(null);
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const loadProjectOverview = async () => {
    const [pRes, epRes, rRes, lRes] = await Promise.all([
      apiRequest<any>(`/api/v1/projects/${projectId}`),
      apiRequest<any>(`/api/v1/projects/${projectId}/endpoints`),
      apiRequest<any>(`/api/v1/projects/${projectId}/rules`),
      apiRequest<any>(`/api/v1/projects/${projectId}/logs?limit=5`),
    ]);

    if (pRes.data) setProject(pRes.data);
    if (epRes.data?.endpoints) setEndpoints(epRes.data.endpoints);
    if (rRes.data && Array.isArray(rRes.data)) setRules(rRes.data);
    if (lRes.data?.logs && Array.isArray(lRes.data.logs)) setRecentLogs(lRes.data.logs);
  };

  useEffect(() => {
    loadProjectOverview();
  }, [projectId]);

  const isLive = project?.status !== "PAUSED";
  const apiBase = getApiBaseUrl();
  const slug = project?.slug || projectId;
  const mockUrl = `${apiBase}/m/${slug}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(mockUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleStatus = async () => {
    const nextStatus = isLive ? "PAUSED" : "LIVE";
    await apiRequest(`/api/v1/projects/${projectId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus }),
    });
    setProject((prev: any) => ({ ...prev, status: nextStatus }));
  };

  const handleResetState = async () => {
    setResetting(true);
    await apiRequest(`/api/v1/projects/${projectId}/scenarios/reset`, {
      method: "POST",
      body: JSON.stringify({ scenarioKey: "default" }),
    });
    setResetting(false);
    setResetMessage("Scenario bucket state cleared successfully");
    setTimeout(() => setResetMessage(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* 1. Project Title & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[var(--ink)] capitalize">
              {project?.name || `${projectId} Project`}
            </h1>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 ${
                isLive
                  ? "bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20"
                  : "bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isLive ? "bg-[var(--success)] animate-pulse" : "bg-[var(--warning)]"
                }`}
              ></span>
              <span>{isLive ? "LIVE" : "PAUSED"}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[var(--ink-2)]">
            <span className="break-all">{mockUrl}</span>
            <button
              onClick={copyUrl}
              className="p-1 rounded hover:bg-[var(--surface-2)] text-[var(--ink-3)] hover:text-[var(--ink)]"
              title="Copy URL"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* Live / Paused toggle */}
          <button
            onClick={handleToggleStatus}
            className={`px-3 py-1.5 rounded-md border border-[var(--border)] font-medium flex items-center gap-1.5 transition-colors ${
              isLive
                ? "bg-[var(--surface-1)] text-[var(--ink)] hover:bg-[var(--surface-2)]"
                : "bg-[var(--signal)] text-[var(--surface-0)] font-semibold"
            }`}
          >
            {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isLive ? "Pause Mock Server" : "Resume Mock Server"}</span>
          </button>

          {/* Reset State Button */}
          <button
            onClick={handleResetState}
            disabled={resetting}
            className="px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-1)] text-[var(--ink)] font-medium hover:bg-[var(--surface-2)] flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? "animate-spin" : ""}`} />
            <span>{resetting ? "Resetting..." : "Reset State"}</span>
          </button>
        </div>
      </div>

      {resetMessage && (
        <div className="p-3 rounded-md bg-[var(--success)]/10 border border-[var(--success)]/30 text-xs text-[var(--success)] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* 2. Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] space-y-1">
          <span className="text-[11px] text-[var(--ink-3)] uppercase tracking-wider font-mono">
            Endpoints
          </span>
          <div className="text-2xl font-bold font-mono text-[var(--ink)]">{endpoints.length}</div>
          <span className="text-[10px] text-[var(--ink-3)]">Extracted from spec</span>
        </div>

        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] space-y-1">
          <span className="text-[11px] text-[var(--ink-3)] uppercase tracking-wider font-mono">
            Active Mock Rules
          </span>
          <div className="text-2xl font-bold font-mono text-[var(--signal)]">{rules.length}</div>
          <span className="text-[10px] text-[var(--ink-3)]">
            Across {endpoints.length} endpoint{endpoints.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] space-y-1">
          <span className="text-[11px] text-[var(--ink-3)] uppercase tracking-wider font-mono">
            Traffic Logs
          </span>
          <div className="text-2xl font-bold font-mono text-[var(--ink)]">{recentLogs.length}</div>
          <span className="text-[10px] text-[var(--ink-3)]">Buffered events</span>
        </div>

        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] space-y-1">
          <span className="text-[11px] text-[var(--ink-3)] uppercase tracking-wider font-mono">
            Contract Status
          </span>
          <div className="text-2xl font-bold text-[var(--success)] flex items-center gap-1.5">
            <CheckCircle2 className="w-6 h-6" />
            <span>{project?.contractStatus || "PASS"}</span>
          </div>
          <span className="text-[10px] text-[var(--ink-3)]">CI contract verified</span>
        </div>
      </div>

      {/* 3. Quick Navigation Hub */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <Link
          href={`/projects/${projectId}/playground`}
          className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] hover:border-[var(--signal)] hover:bg-[var(--surface-2)] transition-all flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded bg-[var(--signal-dim)] flex items-center justify-center text-[var(--signal)]">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-[var(--ink)] block">Playground</span>
            <span className="text-[11px] text-[var(--ink-3)]">Send test requests</span>
          </div>
        </Link>

        <Link
          href={`/projects/${projectId}/import`}
          className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] hover:border-[var(--signal)] hover:bg-[var(--surface-2)] transition-all flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded bg-[var(--surface-2)] flex items-center justify-center text-[var(--signal)]">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-[var(--ink)] block">Import Spec</span>
            <span className="text-[11px] text-[var(--ink-3)]">OpenAPI 3.0 / 3.1</span>
          </div>
        </Link>

        <Link
          href={`/projects/${projectId}/contracts`}
          className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] hover:border-[var(--signal)] hover:bg-[var(--surface-2)] transition-all flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded bg-[var(--surface-2)] flex items-center justify-center text-[var(--signal)]">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-[var(--ink)] block">Contracts</span>
            <span className="text-[11px] text-[var(--ink-3)]">Diff mock vs real</span>
          </div>
        </Link>

        <Link
          href={`/projects/${projectId}/logs`}
          className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] hover:border-[var(--signal)] hover:bg-[var(--surface-2)] transition-all flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded bg-[var(--surface-2)] flex items-center justify-center text-[var(--signal)]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-[var(--ink)] block">Traffic Logs</span>
            <span className="text-[11px] text-[var(--ink-3)]">Inspect requests</span>
          </div>
        </Link>
      </div>

      {/* 4. Endpoints & Recent Traffic Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Endpoints Summary */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h2 className="text-sm font-semibold text-[var(--ink)]">Endpoints Summary</h2>
            <Link
              href={`/projects/${projectId}/endpoints`}
              className="text-xs text-[var(--signal)] hover:underline flex items-center gap-1"
            >
              <span>View All Endpoints</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {endpoints.length === 0 ? (
              <p className="text-[var(--ink-3)] text-xs font-sans py-3 text-center">
                No endpoints found. Import an OpenAPI spec to populate.
              </p>
            ) : (
              endpoints.slice(0, 5).map((ep) => (
                <div
                  key={ep.operationId}
                  className="flex items-center justify-between p-2.5 rounded bg-[var(--surface-0)] border border-[var(--border)]"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--signal-dim)] text-[var(--signal)]">
                      {ep.method}
                    </span>
                    <span className="text-[var(--ink)]">{ep.path}</span>
                  </div>
                  <span className="text-[var(--ink-3)] text-[11px]">
                    {ep.rulesCount ?? 1} rule{ep.rulesCount === 1 ? "" : "s"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Traffic Activity */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h2 className="text-sm font-semibold text-[var(--ink)]">Recent Mock Traffic</h2>
            <Link
              href={`/projects/${projectId}/logs`}
              className="text-xs text-[var(--signal)] hover:underline flex items-center gap-1"
            >
              <span>Live Inspector</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {recentLogs.length === 0 ? (
              <p className="text-[var(--ink-3)] text-xs font-sans py-3 text-center">
                No requests logged yet. Call the mock URL to see traffic.
              </p>
            ) : (
              recentLogs.slice(0, 5).map((l: any) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between p-2.5 rounded bg-[var(--surface-0)] border border-[var(--border)]"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--signal-dim)] text-[var(--signal)]">
                      {l.method}
                    </span>
                    <span className="text-[var(--ink)] truncate max-w-[140px]">{l.path}</span>
                  </div>
                  <span
                    className={`font-bold ${
                      l.status < 400 ? "text-[var(--success)]" : "text-[var(--danger)]"
                    }`}
                  >
                    {l.status}
                  </span>
                  <span className="text-[var(--ink-3)] text-[11px]">{l.latencyMs}ms</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
