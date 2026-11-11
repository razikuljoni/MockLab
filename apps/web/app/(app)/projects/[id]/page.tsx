"use client";

import Link from "next/link";
import { useState } from "react";
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
  Sliders,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";

export default function ProjectOverviewPage() {
  const params = useParams();
  const projectId = (params?.id as string) || "petstore";

  const [isLive, setIsLive] = useState(true);
  const [copied, setCopied] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const mockUrl = `https://${projectId}.mocklab.dev`;

  const copyUrl = () => {
    navigator.clipboard.writeText(mockUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetState = () => {
    setResetting(true);
    setTimeout(() => {
      setResetting(false);
      setResetMessage("Scenario bucket state cleared successfully");
      setTimeout(() => setResetMessage(null), 3000);
    }, 600);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* 1. Project Title & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[var(--ink)] capitalize">
              {projectId} Project
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
            <span>{mockUrl}</span>
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
          {/* Live / Paused toggle (§9.4) */}
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-3 py-1.5 rounded-md border border-[var(--border)] font-medium flex items-center gap-1.5 transition-colors ${
              isLive
                ? "bg-[var(--surface-1)] text-[var(--ink)] hover:bg-[var(--surface-2)]"
                : "bg-[var(--signal)] text-[var(--surface-0)] font-semibold"
            }`}
          >
            {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isLive ? "Pause Mock Server" : "Resume Mock Server"}</span>
          </button>

          {/* Reset State Button (§6.5) */}
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
            Total Requests (24h)
          </span>
          <div className="text-2xl font-bold font-mono text-[var(--ink)]">42,910</div>
          <span className="text-[10px] text-[var(--success)]">↑ 12% vs yesterday</span>
        </div>

        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] space-y-1">
          <span className="text-[11px] text-[var(--ink-3)] uppercase tracking-wider font-mono">
            P50 Response Time
          </span>
          <div className="text-2xl font-bold font-mono text-[var(--signal)]">38 ms</div>
          <span className="text-[10px] text-[var(--ink-3)]">Excluding injected delay</span>
        </div>

        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] space-y-1">
          <span className="text-[11px] text-[var(--ink-3)] uppercase tracking-wider font-mono">
            Active Mock Rules
          </span>
          <div className="text-2xl font-bold font-mono text-[var(--ink)]">12</div>
          <span className="text-[10px] text-[var(--ink-3)]">Across 8 endpoints</span>
        </div>

        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] space-y-1">
          <span className="text-[11px] text-[var(--ink-3)] uppercase tracking-wider font-mono">
            Contract Status
          </span>
          <div className="text-2xl font-bold text-[var(--success)] flex items-center gap-1.5">
            <CheckCircle2 className="w-6 h-6" />
            <span>PASS</span>
          </div>
          <span className="text-[10px] text-[var(--ink-3)]">Last verified 18m ago</span>
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
            <h2 className="text-sm font-semibold text-[var(--ink)]">Endpoints by Tag</h2>
            <Link
              href={`/projects/${projectId}/endpoints`}
              className="text-xs text-[var(--signal)] hover:underline flex items-center gap-1"
            >
              <span>View All Endpoints</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between p-2.5 rounded bg-[var(--surface-0)] border border-[var(--border)]">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#4ADE80]/15 text-[#4ADE80]">
                  GET
                </span>
                <span className="text-[var(--ink)]">/pets</span>
              </div>
              <span className="text-[var(--ink-3)] text-[11px]">List pets · 3 rules</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-[var(--surface-0)] border border-[var(--border)]">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FACC15]/15 text-[#FACC15]">
                  POST
                </span>
                <span className="text-[var(--ink)]">/pets</span>
              </div>
              <span className="text-[var(--ink-3)] text-[11px]">Create pet · 2 rules</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-[var(--surface-0)] border border-[var(--border)]">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#4ADE80]/15 text-[#4ADE80]">
                  GET
                </span>
                <span className="text-[var(--ink)]">/pets/:id</span>
              </div>
              <span className="text-[var(--ink-3)] text-[11px]">Get pet by ID · 4 rules</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-[var(--surface-0)] border border-[var(--border)]">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F87171]/15 text-[#F87171]">
                  DELETE
                </span>
                <span className="text-[var(--ink)]">/pets/:id</span>
              </div>
              <span className="text-[var(--ink-3)] text-[11px]">Delete pet · 1 rule</span>
            </div>
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
            <div className="flex items-center justify-between p-2.5 rounded bg-[var(--surface-0)] border border-[var(--border)]">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#4ADE80]/15 text-[#4ADE80]">
                  GET
                </span>
                <span className="text-[var(--ink)] truncate max-w-[140px]">/pets/42</span>
              </div>
              <span className="text-[var(--success)] font-bold">200 OK</span>
              <span className="text-[var(--ink-3)] text-[11px]">42ms · 2m ago</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-[var(--surface-0)] border border-[var(--border)]">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FACC15]/15 text-[#FACC15]">
                  POST
                </span>
                <span className="text-[var(--ink)] truncate max-w-[140px]">/pets</span>
              </div>
              <span className="text-[var(--success)] font-bold">201 Created</span>
              <span className="text-[var(--ink-3)] text-[11px]">68ms · 5m ago</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-[var(--surface-0)] border border-[var(--border)]">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#4ADE80]/15 text-[#4ADE80]">
                  GET
                </span>
                <span className="text-[var(--ink)] truncate max-w-[140px]">/pets</span>
              </div>
              <span className="text-[var(--success)] font-bold">200 OK</span>
              <span className="text-[var(--ink-3)] text-[11px]">31ms · 8m ago</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-[var(--surface-0)] border border-[var(--border)]">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#4ADE80]/15 text-[#4ADE80]">
                  GET
                </span>
                <span className="text-[var(--ink)] truncate max-w-[140px]">/unknown</span>
              </div>
              <span className="text-[var(--danger)] font-bold">404 Unmatched</span>
              <span className="text-[var(--ink-3)] text-[11px]">12ms · 15m ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
