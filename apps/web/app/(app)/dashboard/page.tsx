import Link from "next/link";
import { FolderPlus, Upload, Play, CheckCircle2, ShieldCheck, ArrowUpRight } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with Title & Quick Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--ink)]">Dashboard</h1>
          <p className="text-xs text-[var(--ink-2)] mt-0.5">Workspace overview and mock server activity</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/projects/petstore/import"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--border)] text-xs font-medium text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Spec</span>
          </Link>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--signal)] text-[var(--surface-0)] text-xs font-semibold hover:opacity-90 transition-opacity">
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Getting Started Checklist */}
      <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-1)]">
        <h2 className="text-sm font-semibold text-[var(--ink)] mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[var(--signal)]" />
          <span>Getting Started Checklist</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-md bg-[var(--surface-2)] border border-[var(--border)]">
            <span className="text-[10px] font-mono text-[var(--signal)] font-bold">STEP 1</span>
            <p className="text-xs font-medium text-[var(--ink)] mt-1">Explore the Petstore Demo</p>
            <p className="text-[11px] text-[var(--ink-3)] mt-0.5">Preloaded mock server ready to test</p>
          </div>
          <div className="p-3 rounded-md bg-[var(--surface-2)] border border-[var(--border)]">
            <span className="text-[10px] font-mono text-[var(--ink-3)] font-bold">STEP 2</span>
            <p className="text-xs font-medium text-[var(--ink)] mt-1">Send a Request in Playground</p>
            <p className="text-[11px] text-[var(--ink-3)] mt-0.5">Test matching rules & mock responses</p>
          </div>
          <div className="p-3 rounded-md bg-[var(--surface-2)] border border-[var(--border)]">
            <span className="text-[10px] font-mono text-[var(--ink-3)] font-bold">STEP 3</span>
            <p className="text-xs font-medium text-[var(--ink)] mt-1">Verify Contract in CI</p>
            <p className="text-[11px] text-[var(--ink-3)] mt-0.5">Detect breaking changes before deploy</p>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--ink)]">Projects</h2>
          <Link href="/projects" className="text-xs text-[var(--signal)] hover:underline flex items-center gap-1">
            <span>View all</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] hover:border-[var(--border-strong)] transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--signal-dim)] text-[var(--signal)] font-mono font-semibold">
                  REST
                </span>
                <h3 className="text-base font-semibold text-[var(--ink)] mt-2">Petstore Demo</h3>
                <p className="text-xs text-[var(--ink-3)] font-mono mt-0.5">https://mocklab.dev/m/petstore</p>
              </div>
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                <ShieldCheck className="w-3 h-3" />
                PASSING
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[var(--border)] text-center">
              <div>
                <span className="text-[11px] text-[var(--ink-3)]">Endpoints</span>
                <p className="text-sm font-semibold text-[var(--ink)] font-mono">14</p>
              </div>
              <div>
                <span className="text-[11px] text-[var(--ink-3)]">Rules</span>
                <p className="text-sm font-semibold text-[var(--ink)] font-mono">18</p>
              </div>
              <div>
                <span className="text-[11px] text-[var(--ink-3)]">Requests (24h)</span>
                <p className="text-sm font-semibold text-[var(--ink)] font-mono">1,420</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <Link
                href="/projects/petstore/playground"
                className="px-3 py-1 rounded text-xs bg-[var(--surface-2)] text-[var(--ink)] hover:bg-[var(--border)] transition-colors flex items-center gap-1.5"
              >
                <Play className="w-3 h-3" />
                <span>Open Playground</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Usage vs Plan */}
      <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-1)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[var(--ink)]">Monthly Mock Usage (Free Plan)</span>
          <span className="text-xs font-mono text-[var(--ink-2)]">1,420 / 5,000 requests</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
          <div className="h-full bg-[var(--signal)] rounded-full" style={{ width: "28.4%" }}></div>
        </div>
      </div>
    </div>
  );
}
