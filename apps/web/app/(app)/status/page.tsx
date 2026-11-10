"use client";

import { useState } from "react";
import {
  AlertTriangle,
  PauseCircle,
  FileX,
  Gauge,
  CheckCircle2,
  Search,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Server,
  Terminal,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

type ErrorTab = "404" | "503" | "429" | "spec-error" | "maintenance";

export default function StatusAndErrorsPage() {
  const [activeTab, setActiveTab] = useState<ErrorTab>("404");

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-[var(--ink)]">System Status & Error States</h1>
            <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--border)] bg-[var(--surface-1)] text-[var(--ink-2)] font-mono">
              Screen 23
            </span>
          </div>
          <p className="text-xs text-[var(--ink-2)] mt-1">
            Reference catalogue of application error states, mock diagnostic responses, and platform health.
          </p>
        </div>

        {/* Live Health Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--success)]/30 bg-[var(--success)]/10 text-xs font-mono text-[var(--success)] self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse"></span>
          <span>All Core Systems Operational</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab("404")}
          className={`px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
            activeTab === "404"
              ? "bg-[var(--surface-2)] text-[var(--signal)] font-semibold shadow-xs"
              : "text-[var(--ink-2)] hover:text-[var(--ink)]"
          }`}
        >
          404 Near-Miss
        </button>
        <button
          onClick={() => setActiveTab("503")}
          className={`px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
            activeTab === "503"
              ? "bg-[var(--surface-2)] text-[var(--signal)] font-semibold shadow-xs"
              : "text-[var(--ink-2)] hover:text-[var(--ink)]"
          }`}
        >
          503 Mock Paused
        </button>
        <button
          onClick={() => setActiveTab("429")}
          className={`px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
            activeTab === "429"
              ? "bg-[var(--surface-2)] text-[var(--signal)] font-semibold shadow-xs"
              : "text-[var(--ink-2)] hover:text-[var(--ink)]"
          }`}
        >
          429 Rate Limit
        </button>
        <button
          onClick={() => setActiveTab("spec-error")}
          className={`px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
            activeTab === "spec-error"
              ? "bg-[var(--surface-2)] text-[var(--signal)] font-semibold shadow-xs"
              : "text-[var(--ink-2)] hover:text-[var(--ink)]"
          }`}
        >
          Spec Import Error
        </button>
        <button
          onClick={() => setActiveTab("maintenance")}
          className={`px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
            activeTab === "maintenance"
              ? "bg-[var(--surface-2)] text-[var(--signal)] font-semibold shadow-xs"
              : "text-[var(--ink-2)] hover:text-[var(--ink)]"
          }`}
        >
          Maintenance / Banner
        </button>
      </div>

      {/* Tab Panels */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-8">
        {/* 1. 404 Near-Miss */}
        {activeTab === "404" && (
          <div className="max-w-xl mx-auto space-y-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-xs font-mono text-[var(--warning)]">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>HTTP 404: UNMATCHED_MOCK_ROUTE</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-mono text-[var(--ink)]">Near-Miss Diagnostic</h2>
              <p className="text-xs text-[var(--ink-2)]">
                The mock engine could not find an exact match for <span className="font-mono text-[var(--signal)]">GET /pet/find</span>, but identified the closest registered route.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-0)] text-left font-mono text-xs space-y-3">
              <div className="flex items-center justify-between text-[11px] text-[var(--ink-3)] border-b border-[var(--border)] pb-2">
                <span>Diagnostic Report</span>
                <span className="text-[var(--signal)]">Confidence: 87%</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ink-3)]">Requested:</span>
                  <span className="text-[var(--error)]">GET /pet/find</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ink-3)]">Closest Candidate:</span>
                  <span className="text-[var(--success)]">GET /pets/find</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ink-3)]">Missed Field:</span>
                  <span className="text-[var(--warning)]">path (missing plural 's')</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href="/projects/petstore/logs"
                className="px-4 py-2 rounded-lg bg-[var(--signal)] text-[var(--surface-0)] font-medium text-xs hover:opacity-90 transition-opacity"
              >
                Inspect in Traffic Inspector
              </Link>
              <Link
                href="/projects/petstore/endpoints"
                className="px-4 py-2 rounded-lg border border-[var(--border)] text-xs text-[var(--ink-2)] hover:bg-[var(--surface-2)] transition-colors"
              >
                View Registered Routes
              </Link>
            </div>
          </div>
        )}

        {/* 2. 503 Mock Server Paused */}
        {activeTab === "503" && (
          <div className="max-w-xl mx-auto space-y-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--warning)]/15 text-[var(--warning)] border border-[var(--warning)]/30 mx-auto flex items-center justify-center">
              <PauseCircle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-[var(--ink)]">Mock Server Is Paused</h2>
              <p className="text-xs text-[var(--ink-2)]">
                The project owner has temporarily paused incoming traffic. Client calls will receive HTTP 503 Service Unavailable.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-0)] text-left font-mono text-xs space-y-2">
              <div className="text-[11px] text-[var(--ink-3)]">HTTP 503 Response Payload:</div>
              <pre className="text-[var(--ink-2)] text-[11px] overflow-x-auto p-2 bg-[var(--surface-1)] rounded border border-[var(--border)]">
{`{
  "error": "Project Paused",
  "message": "This mock server is currently paused in project settings.",
  "statusCode": 503,
  "projectSlug": "payment-gateway",
  "pausedAt": "2026-03-12T19:30:00Z"
}`}
              </pre>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href="/projects/petstore"
                className="px-4 py-2 rounded-lg bg-[var(--signal)] text-[var(--surface-0)] font-medium text-xs hover:opacity-90 transition-opacity"
              >
                Resume Mock Server in Overview
              </Link>
            </div>
          </div>
        )}

        {/* 3. 429 Rate Limit Exceeded */}
        {activeTab === "429" && (
          <div className="max-w-xl mx-auto space-y-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--error)]/15 text-[var(--error)] border border-[var(--error)]/30 mx-auto flex items-center justify-center">
              <Gauge className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-[var(--ink)]">Rate Limit Exceeded (HTTP 429)</h2>
              <p className="text-xs text-[var(--ink-2)]">
                Your API key has exceeded its allocated sliding-window quota. Further requests will be rejected until the reset window clears.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-0)] text-left font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[var(--ink-3)]">
                <span>Response Headers</span>
                <span className="text-[var(--warning)]">Status: 429 Too Many Requests</span>
              </div>
              <div className="space-y-1 text-[11px] text-[var(--ink-2)]">
                <div><span className="text-[var(--signal)]">Retry-After</span>: 42</div>
                <div><span className="text-[var(--signal)]">X-RateLimit-Limit</span>: 100</div>
                <div><span className="text-[var(--signal)]">X-RateLimit-Remaining</span>: 0</div>
                <div><span className="text-[var(--signal)]">X-RateLimit-Reset</span>: 1773345600</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href="/workspace/billing"
                className="px-4 py-2 rounded-lg bg-[var(--signal)] text-[var(--surface-0)] font-medium text-xs hover:opacity-90 transition-opacity"
              >
                Upgrade Plan for Higher Limits
              </Link>
              <Link
                href="/workspace/keys"
                className="px-4 py-2 rounded-lg border border-[var(--border)] text-xs text-[var(--ink-2)] hover:bg-[var(--surface-2)] transition-colors"
              >
                Adjust Key Rate Limit
              </Link>
            </div>
          </div>
        )}

        {/* 4. Spec Import Error */}
        {activeTab === "spec-error" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-[var(--border)]">
              <div className="w-10 h-10 rounded-xl bg-[var(--error)]/15 text-[var(--error)] flex items-center justify-center">
                <FileX className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[var(--ink)]">OpenAPI Schema Validation Failed</h3>
                <p className="text-xs text-[var(--ink-3)] font-mono">Parser Error at line 48: schema.type mismatch</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-0)] font-mono text-xs space-y-3">
              <div className="flex items-center justify-between text-[11px] text-[var(--ink-3)]">
                <span>pets.yaml (Syntax Highlight)</span>
                <span className="text-[var(--error)]">JSONPath: #/paths/~1pets/get/responses/200</span>
              </div>
              <div className="p-3 bg-[var(--surface-1)] rounded border border-[var(--border)] text-[11px] leading-relaxed">
                <div className="text-[var(--ink-3)]">46 |       responses:</div>
                <div className="text-[var(--ink-3)]">47 |         '200':</div>
                <div className="text-[var(--ink-3)]">48 |           description: A paged array of pets</div>
                <div className="bg-[var(--error)]/20 text-[var(--error)] px-2 py-0.5 rounded flex items-center justify-between">
                  <span>49 |           content: invalid_scalar_value</span>
                  <span className="text-[10px] font-bold">^ Expected map/object</span>
                </div>
                <div className="text-[var(--ink-3)]">50 |             application/json:</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-[var(--signal)]/30 bg-[var(--signal-dim)] text-xs text-[var(--ink)] space-y-1">
              <div className="font-semibold text-[var(--signal)] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Suggested Resolution</span>
              </div>
              <p className="text-[11px] text-[var(--ink-2)]">
                Under <span className="font-mono text-[var(--signal)]">content</span>, nest the MIME type (e.g. <span className="font-mono text-[var(--signal)]">application/json</span>) as a map key containing a <span className="font-mono text-[var(--signal)]">schema</span> object.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Link
                href="/projects/petstore/import"
                className="px-4 py-2 rounded-lg bg-[var(--signal)] text-[var(--surface-0)] font-medium text-xs hover:opacity-90 transition-opacity"
              >
                Re-upload Fixed Spec
              </Link>
            </div>
          </div>
        )}

        {/* 5. Maintenance / Incident Banner */}
        {activeTab === "maintenance" && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="p-4 rounded-xl border border-[var(--warning)]/50 bg-[var(--warning)]/10 flex items-start gap-3">
              <Server className="w-5 h-5 text-[var(--warning)] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[var(--warning)]">Scheduled Infrastructure Upgrade</h4>
                <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
                  MockLab Redis state clusters will undergo rolling zero-downtime maintenance on Sunday, March 15 at 02:00 UTC. The in-memory fallback tier will serve scenario buckets transparently.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-[var(--ink-3)]">
                Subsystem Diagnostics
              </h3>
              <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface-0)] text-xs">
                <div className="p-3 flex items-center justify-between">
                  <span className="font-medium text-[var(--ink)]">Mock Routing Engine</span>
                  <span className="flex items-center gap-1.5 text-[var(--success)] font-mono text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 99.99% Operational
                  </span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="font-medium text-[var(--ink)]">Contract CI Scheduler</span>
                  <span className="flex items-center gap-1.5 text-[var(--success)] font-mono text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Operational
                  </span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="font-medium text-[var(--ink)]">Traffic Inspector Batch Queue</span>
                  <span className="flex items-center gap-1.5 text-[var(--success)] font-mono text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Sub-millisecond latency
                  </span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="font-medium text-[var(--ink)]">Stateful Scenario Redis Cluster</span>
                  <span className="flex items-center gap-1.5 text-[var(--warning)] font-mono text-[11px]">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> In-Memory Mode (Resilient)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
