"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FileCheck2,
  Play,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  GitBranch,
  ShieldCheck,
  RefreshCw,
  Sliders,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

interface ExpectationItem {
  id: string;
  operationId: string;
  method: string;
  path: string;
  name: string;
  providerState: string | null;
  expectedStatus: number;
  mockStatus: number;
  realStatus: number | null;
  verdict: "PASS" | "BREAKING" | "NON_BREAKING" | "ERROR";
  enabled: boolean;
}

interface RunSummaryItem {
  id: string;
  specHash: string;
  status: "PASS" | "FAIL_BREAKING" | "ERROR";
  passCount: number;
  breakingCount: number;
  nonBreakingCount: number;
  durationMs: number;
  triggeredBy: string;
  createdAt: string;
}

export default function ContractsListPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = (params?.id as string) || "petstore";

  const [isRunning, setIsRunning] = useState(false);
  const [expectations, setExpectations] = useState<ExpectationItem[]>([
    {
      id: "exp_1",
      operationId: "GET /pets",
      method: "GET",
      path: "/pets",
      name: "List Pets Collection",
      providerState: "Database contains 2 seeded pets",
      expectedStatus: 200,
      mockStatus: 200,
      realStatus: 200,
      verdict: "PASS",
      enabled: true,
    },
    {
      id: "exp_2",
      operationId: "POST /pets",
      method: "POST",
      path: "/pets",
      name: "Create Pet Record",
      providerState: "Valid pet payload without ID",
      expectedStatus: 201,
      mockStatus: 201,
      realStatus: 201,
      verdict: "PASS",
      enabled: true,
    },
    {
      id: "exp_3",
      operationId: "GET /users/{id}",
      method: "GET",
      path: "/users/42",
      name: "Get User By ID",
      providerState: "User 42 exists in provider",
      expectedStatus: 200,
      mockStatus: 200,
      realStatus: 200,
      verdict: "BREAKING", // Missing required field 'email' in real provider response
      enabled: true,
    },
    {
      id: "exp_4",
      operationId: "POST /orders",
      method: "POST",
      path: "/orders",
      name: "Create Order",
      providerState: "Customer has active checkout session",
      expectedStatus: 201,
      mockStatus: 201,
      realStatus: 201,
      verdict: "NON_BREAKING", // Added field 'carrierTracking' in real provider
      enabled: true,
    },
  ]);

  const [recentRuns, setRecentRuns] = useState<RunSummaryItem[]>([
    {
      id: "run-042",
      specHash: "sha256_9a4f21e8",
      status: "FAIL_BREAKING",
      passCount: 2,
      breakingCount: 1,
      nonBreakingCount: 1,
      durationMs: 1420,
      triggeredBy: "CI: GitHub Actions #108",
      createdAt: "18 minutes ago",
    },
    {
      id: "run-041",
      specHash: "sha256_9a4f21e8",
      status: "PASS",
      passCount: 4,
      breakingCount: 0,
      nonBreakingCount: 0,
      durationMs: 1180,
      triggeredBy: "Scheduled Hourly",
      createdAt: "1 hour ago",
    },
    {
      id: "run-040",
      specHash: "sha256_3b1102cd",
      status: "PASS",
      passCount: 4,
      breakingCount: 0,
      nonBreakingCount: 0,
      durationMs: 980,
      triggeredBy: "Manual Web UI",
      createdAt: "5 hours ago",
    },
  ]);

  const handleRunAll = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      router.push(`/projects/${projectId}/contracts/runs/run-042`);
    }, 1200);
  };

  const handleGenerateFromSpec = () => {
    alert("Generated 4 contract expectations from latest OpenAPI specification.");
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case "PASS":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PASS
          </span>
        );
      case "BREAKING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            BREAKING
          </span>
        );
      case "NON_BREAKING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            NON-BREAKING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-neutral-500/10 text-neutral-400 border border-neutral-500/20">
            <HelpCircle className="w-3.5 h-3.5" />
            ERROR
          </span>
        );
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "POST":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-[#101208] text-white font-sans">
      {/* Top Header */}
      <header className="border-b border-[#282F14] bg-[#16190B] px-6 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#A1A78E] mb-1">
              <Link href="/projects" className="hover:text-white transition-colors">Projects</Link>
              <span>/</span>
              <Link href={`/projects/${projectId}`} className="hover:text-white transition-colors">{projectId}</Link>
              <span>/</span>
              <span className="text-[#BFFF3C] font-mono">Contract Tests</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#BFFF3C]" />
                Contract Verification
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
                1 Breaking Drift Detected
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateFromSpec}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#1D220E] hover:bg-[#282F14] text-white border border-[#282F14] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#BFFF3C]" />
              Generate from Spec
            </button>

            <button
              onClick={handleRunAll}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold bg-[#BFFF3C] hover:bg-[#a6e62e] text-[#101208] transition-colors shadow-sm disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? "animate-spin" : ""}`} />
              {isRunning ? "Verifying..." : "Run All Contracts"}
            </button>
          </div>
        </div>
      </header>

      {/* Provider Status Summary Bar */}
      <div className="border-b border-[#282F14] bg-[#131609] px-6 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[#A1A78E]">Real Provider:</span>
              <span className="text-white font-semibold">https://api.petstore.io/v2</span>
            </div>
            <span className="text-[#282F14]">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#A1A78E]">Auth:</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                AES-256-GCM Encrypted
              </span>
            </div>
            <span className="text-[#282F14]">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#A1A78E]">Spec Hash:</span>
              <span className="text-[#BFFF3C]">sha256_9a4f21e8</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[#A1A78E]">Last Verified:</span>
            <span className="text-white">18 mins ago (Run #042)</span>
            <Link
              href={`/projects/${projectId}/contracts/runs/run-042`}
              className="text-[#BFFF3C] hover:underline flex items-center gap-1"
            >
              View Diff Report →
            </Link>
          </div>
        </div>
      </div>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Expectations Table Card */}
        <section className="bg-[#16190B] border border-[#282F14] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[#282F14] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                Contract Expectations ({expectations.length})
              </h2>
              <p className="text-xs text-[#A1A78E] mt-0.5">
                Defined consumer expectations evaluated against MockLab and the live backend.
              </p>
            </div>
            <Link
              href={`/projects/${projectId}/contracts/runs/run-042`}
              className="text-xs font-mono text-[#BFFF3C] hover:underline flex items-center gap-1"
            >
              Inspect Latest Run (#042) →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#101208] border-b border-[#282F14] text-[#A1A78E] font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Operation</th>
                  <th className="py-2.5 px-4 font-medium">Expectation Name & Provider State</th>
                  <th className="py-2.5 px-4 font-medium text-center">Expected</th>
                  <th className="py-2.5 px-4 font-medium text-center">Mock</th>
                  <th className="py-2.5 px-4 font-medium text-center">Real API</th>
                  <th className="py-2.5 px-4 font-medium">Verdict</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#282F14]">
                {expectations.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[#1D220E]/50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap font-mono">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getMethodBadge(exp.method)}`}>
                          {exp.method}
                        </span>
                        <span className="text-white font-medium">{exp.path}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{exp.name}</div>
                      <div className="text-[11px] text-[#A1A78E] font-mono">{exp.providerState}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-center text-[#A1A78E]">
                      {exp.expectedStatus}
                    </td>
                    <td className="py-3 px-4 font-mono text-center">
                      <span className="text-emerald-400 font-bold">{exp.mockStatus} ✓</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-center">
                      {exp.realStatus === 200 || exp.realStatus === 201 ? (
                        <span className="text-emerald-400 font-bold">{exp.realStatus} ✓</span>
                      ) : (
                        <span className="text-rose-400 font-bold">{exp.realStatus || "ERR"} ✗</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getVerdictBadge(exp.verdict)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/projects/${projectId}/contracts/runs/run-042`}
                        className="px-2.5 py-1 rounded text-[11px] font-mono bg-[#1D220E] hover:bg-[#282F14] text-[#BFFF3C] border border-[#282F14] transition-colors"
                      >
                        Diff View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Contract Runs Card */}
        <section className="bg-[#16190B] border border-[#282F14] rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#282F14] mb-4">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#BFFF3C]" />
                Recent Contract Runs
              </h3>
              <p className="text-xs text-[#A1A78E] mt-0.5">
                Every run preserves the OpenAPI spec hash for drift diagnosis (§6.6).
              </p>
            </div>
            <Link href={`/projects/${projectId}/ci`} className="text-xs font-mono text-[#BFFF3C] hover:underline flex items-center gap-1">
              <GitBranch className="w-3.5 h-3.5" />
              Configure CI Automation →
            </Link>
          </div>

          <div className="space-y-2">
            {recentRuns.map((run) => (
              <Link
                key={run.id}
                href={`/projects/${projectId}/contracts/runs/${run.id}`}
                className="flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-lg bg-[#101208] border border-[#282F14] hover:border-[#BFFF3C]/40 transition-colors gap-3"
              >
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                    run.status === "PASS"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  }`}>
                    {run.status === "PASS" ? "ALL PASS" : "FAIL (BREAKING)"}
                  </span>
                  <div>
                    <div className="font-semibold text-white text-xs font-mono flex items-center gap-2">
                      <span>{run.id}</span>
                      <span className="text-[#A1A78E]">·</span>
                      <span className="text-[#A1A78E] font-normal">{run.triggeredBy}</span>
                    </div>
                    <div className="text-[11px] text-[#A1A78E] font-mono mt-0.5">
                      Spec Hash: <code className="text-[#BFFF3C]">{run.specHash}</code> · Duration: {run.durationMs}ms
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-2 text-[#A1A78E]">
                    <span className="text-emerald-400 font-bold">{run.passCount} pass</span>
                    <span>·</span>
                    <span className={run.breakingCount > 0 ? "text-rose-400 font-bold" : "text-[#A1A78E]"}>
                      {run.breakingCount} breaking
                    </span>
                    <span>·</span>
                    <span className={run.nonBreakingCount > 0 ? "text-amber-400 font-bold" : "text-[#A1A78E]"}>
                      {run.nonBreakingCount} non-breaking
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#A1A78E]" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
