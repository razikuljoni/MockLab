"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FileCheck2,
  Play,
  RotateCw,
  Copy,
  Check,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Layers,
  Code,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Filter,
  ExternalLink,
} from "lucide-react";

interface DiffLineItem {
  path: string;
  type: "ADDED" | "REMOVED" | "CHANGED";
  expected?: any;
  actual?: any;
  breaking: boolean;
  message: string;
}

interface ExpectationRunItem {
  id: string;
  operationId: string;
  method: string;
  path: string;
  expectedStatus: number;
  mockStatus: number;
  realStatus: number;
  verdict: "PASS" | "BREAKING" | "NON_BREAKING" | "ERROR";
  diffSummary: {
    added: number;
    removed: number;
    changed: number;
  };
  diffLines: DiffLineItem[];
  expectedJson: any;
  actualJson: any;
}

export default function ContractRunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = (params?.id as string) || "petstore";
  const runId = (params?.runId as string) || "run-042";

  const [activeExpectationId, setActiveExpectationId] = useState<string>("exp_3");
  const [filterType, setFilterType] = useState<"ALL" | "BREAKING_ONLY" | "ADDED" | "REMOVED" | "CHANGED">("ALL");
  const [collapseUnchanged, setCollapseUnchanged] = useState<boolean>(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const expectations: ExpectationRunItem[] = [
    {
      id: "exp_3",
      operationId: "GET /users/{id}",
      method: "GET",
      path: "/users/42",
      expectedStatus: 200,
      mockStatus: 200,
      realStatus: 200,
      verdict: "BREAKING",
      diffSummary: { added: 0, removed: 1, changed: 1 },
      diffLines: [
        {
          path: "$.email",
          type: "REMOVED",
          expected: "user42@example.com",
          actual: undefined,
          breaking: true,
          message: "Required field 'email' is missing in live provider response",
        },
        {
          path: "$.role",
          type: "CHANGED",
          expected: "admin",
          actual: 42,
          breaking: true,
          message: "Type changed from string to number (expected 'admin', got 42)",
        },
      ],
      expectedJson: {
        id: "42",
        name: "Arthur Dent",
        email: "user42@example.com",
        role: "admin",
        createdAt: "2026-11-10T12:00:00Z",
      },
      actualJson: {
        id: "42",
        name: "Arthur Dent",
        role: 42,
        createdAt: "2026-11-10T12:00:00Z",
      },
    },
    {
      id: "exp_4",
      operationId: "POST /orders",
      method: "POST",
      path: "/orders",
      expectedStatus: 201,
      mockStatus: 201,
      realStatus: 201,
      verdict: "NON_BREAKING",
      diffSummary: { added: 1, removed: 0, changed: 0 },
      diffLines: [
        {
          path: "$.carrierTracking",
          type: "ADDED",
          expected: undefined,
          actual: "TRK-9842-US",
          breaking: false,
          message: "New field 'carrierTracking' added by live provider (backward-compatible)",
        },
      ],
      expectedJson: {
        orderId: "ord_100",
        total: 129.5,
        status: "created",
      },
      actualJson: {
        orderId: "ord_100",
        total: 129.5,
        status: "created",
        carrierTracking: "TRK-9842-US",
      },
    },
    {
      id: "exp_1",
      operationId: "GET /pets",
      method: "GET",
      path: "/pets",
      expectedStatus: 200,
      mockStatus: 200,
      realStatus: 200,
      verdict: "PASS",
      diffSummary: { added: 0, removed: 0, changed: 0 },
      diffLines: [],
      expectedJson: [
        { id: "1", name: "Fido", tag: "dog" },
        { id: "2", name: "Fluffy", tag: "cat" },
      ],
      actualJson: [
        { id: "1", name: "Fido", tag: "dog" },
        { id: "2", name: "Fluffy", tag: "cat" },
      ],
    },
  ];

  const currentExp = expectations.find((e) => e.id === activeExpectationId) || expectations[0];

  const filteredDiffLines = currentExp.diffLines.filter((l) => {
    if (filterType === "BREAKING_ONLY") return l.breaking;
    if (filterType === "ADDED") return l.type === "ADDED";
    if (filterType === "REMOVED") return l.type === "REMOVED";
    if (filterType === "CHANGED") return l.type === "CHANGED";
    return true;
  });

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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
            ERROR
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#101208] text-white font-sans">
      {/* Top Header */}
      <header className="border-b border-[#282F14] bg-[#16190B] px-6 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#A1A78E] mb-1">
              <Link href={`/projects/${projectId}/contracts`} className="hover:text-white transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" />
                Contracts
              </Link>
              <span>/</span>
              <span className="text-[#BFFF3C] font-mono">{runId}</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#BFFF3C]" />
                Run Report: {runId}
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                BREAKING DRIFT DETECTED
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/projects/${projectId}/contracts`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#1D220E] hover:bg-[#282F14] text-white border border-[#282F14] transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#BFFF3C]" />
              Run Again
            </button>
            <button
              onClick={() => handleCopy(`[![MockLab Contract](https://mocklab.dev/badge/${projectId})](https://mocklab.dev)`, "badge")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono bg-[#16190B] text-white border border-[#282F14] hover:bg-[#1D220E] transition-colors"
            >
              {copiedKey === "badge" ? <Check className="w-3.5 h-3.5 text-[#BFFF3C]" /> : <Copy className="w-3.5 h-3.5" />}
              README Badge
            </button>
          </div>
        </div>
      </header>

      {/* Summary Stat Banner (§6.6) */}
      <div className="border-b border-[#282F14] bg-[#131609] px-6 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">10 PASS</span>
              <span>·</span>
              <span className="text-rose-400 font-bold">1 BREAKING</span>
              <span>·</span>
              <span className="text-amber-400 font-bold">1 NON-BREAKING</span>
            </div>
            <span className="text-[#282F14]">|</span>
            <div className="flex items-center gap-1.5 text-[#A1A78E]">
              <span>Duration:</span>
              <span className="text-white font-semibold">1,420 ms</span>
            </div>
            <span className="text-[#282F14]">|</span>
            <div className="flex items-center gap-1.5 text-[#A1A78E]">
              <span>Commit:</span>
              <code className="text-[#BFFF3C]">git:a0e71a9</code>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[#A1A78E]">
            <span>Spec Hash:</span>
            <code className="text-white">sha256_9a4f21e8</code>
            <span className="text-[#282F14]">|</span>
            <span>Provider:</span>
            <span className="text-white">https://api.petstore.io</span>
          </div>
        </div>
      </div>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Expectation Selector Row */}
        <section className="bg-[#16190B] border border-[#282F14] rounded-lg p-4">
          <div className="text-xs font-mono uppercase tracking-wider text-[#A1A78E] mb-3">
            Select Expectation to Inspect Diffs:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {expectations.map((exp) => {
              const isSelected = exp.id === activeExpectationId;
              return (
                <button
                  key={exp.id}
                  onClick={() => setActiveExpectationId(exp.id)}
                  className={`p-3 rounded-md text-left border transition-all ${
                    isSelected
                      ? "bg-[#1D220E] border-[#BFFF3C] shadow-md shadow-[#BFFF3C]/5"
                      : "bg-[#101208] border-[#282F14] hover:border-[#A1A78E]/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-white">{exp.operationId}</span>
                    {getVerdictBadge(exp.verdict)}
                  </div>
                  <div className="text-[11px] font-mono text-[#A1A78E]">
                    Expected: {exp.expectedStatus} · Real: {exp.realStatus}
                  </div>
                  {exp.diffSummary.removed > 0 && (
                    <div className="mt-2 text-[10px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded inline-block">
                      -{exp.diffSummary.removed} required field missing
                    </div>
                  )}
                  {exp.diffSummary.added > 0 && (
                    <div className="mt-2 text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded inline-block">
                      +{exp.diffSummary.added} additive field
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Diff Panel Section (§6.6) */}
        <section className="bg-[#16190B] border border-[#282F14] rounded-lg overflow-hidden">
          {/* Diff Header & Filters */}
          <div className="p-4 border-b border-[#282F14] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                  Structural Diff: {currentExp.operationId}
                </h2>
                {getVerdictBadge(currentExp.verdict)}
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#A1A78E] mt-1">
                <span>Counts:</span>
                <span className="text-emerald-400 font-bold">+{currentExp.diffSummary.added} added</span>
                <span>·</span>
                <span className="text-rose-400 font-bold">-{currentExp.diffSummary.removed} removed</span>
                <span>·</span>
                <span className="text-amber-400 font-bold">~{currentExp.diffSummary.changed} changed</span>
              </div>
            </div>

            {/* Filter Tabs (§6.6) */}
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-md bg-[#101208] border border-[#282F14] p-0.5 text-xs font-mono">
                {(["ALL", "BREAKING_ONLY", "ADDED", "REMOVED", "CHANGED"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterType(tab)}
                    className={`px-2 py-1 rounded transition-colors ${
                      filterType === tab
                        ? "bg-[#BFFF3C] text-[#101208] font-bold"
                        : "text-[#A1A78E] hover:text-white"
                    }`}
                  >
                    {tab.replace("_", " ")}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCollapseUnchanged(!collapseUnchanged)}
                className={`px-2.5 py-1.5 rounded text-xs font-mono border transition-colors ${
                  collapseUnchanged
                    ? "bg-[#1D220E] text-[#BFFF3C] border-[#BFFF3C]/30"
                    : "bg-[#101208] text-[#A1A78E] border-[#282F14]"
                }`}
              >
                Collapse Unchanged: {collapseUnchanged ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          {/* Structural JSONPath List */}
          {filteredDiffLines.length > 0 && (
            <div className="border-b border-[#282F14] bg-[#101208] p-3 space-y-2">
              <div className="text-[11px] font-mono text-[#A1A78E] uppercase tracking-wider">
                Impacted JSON Paths ({filteredDiffLines.length}):
              </div>
              <div className="space-y-1.5">
                {filteredDiffLines.map((line, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded text-xs font-mono border ${
                      line.breaking
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        line.breaking ? "bg-rose-500 text-white" : "bg-amber-500 text-black"
                      }`}>
                        {line.breaking ? "BREAKING" : "NON-BREAKING"}
                      </span>
                      <code className="font-bold text-white">{line.path}</code>
                      <span className="text-[#A1A78E]">{line.message}</span>
                    </div>
                    <div className="text-[11px]">
                      {line.expected !== undefined && <span className="text-white mr-2">Expected: {JSON.stringify(line.expected)}</span>}
                      {line.actual !== undefined && <span className="text-[#BFFF3C]">Actual: {JSON.stringify(line.actual)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Synchronized Side-by-Side Payloads (§6.6) */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#282F14]">
            {/* Left Column: Expected Contract (Mock Baseline) */}
            <div className="p-4 bg-[#101208]">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#282F14]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-emerald-400">EXPECTED CONTRACT</span>
                  <span className="text-[11px] text-[#A1A78E] font-mono">(MockLab Baseline)</span>
                </div>
                <button
                  onClick={() => handleCopy(JSON.stringify(currentExp.expectedJson, null, 2), "expected")}
                  className="text-xs text-[#A1A78E] hover:text-white"
                >
                  {copiedKey === "expected" ? <Check className="w-3.5 h-3.5 text-[#BFFF3C]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <pre className="font-mono text-xs leading-relaxed text-[#A1A78E] overflow-x-auto">
                {JSON.stringify(currentExp.expectedJson, null, 2)}
              </pre>
            </div>

            {/* Right Column: Actual Live Provider Response */}
            <div className="p-4 bg-[#101208]">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#282F14]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-rose-400">ACTUAL PROVIDER RESPONSE</span>
                  <span className="text-[11px] text-[#A1A78E] font-mono">(api.petstore.io)</span>
                </div>
                <button
                  onClick={() => handleCopy(JSON.stringify(currentExp.actualJson, null, 2), "actual")}
                  className="text-xs text-[#A1A78E] hover:text-white"
                >
                  {copiedKey === "actual" ? <Check className="w-3.5 h-3.5 text-[#BFFF3C]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <pre className="font-mono text-xs leading-relaxed text-white overflow-x-auto">
                {JSON.stringify(currentExp.actualJson, null, 2)}
              </pre>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
