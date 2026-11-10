"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  Search,
  Filter,
  AlertCircle,
  Copy,
  Check,
  Play,
  PlusCircle,
  X,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Terminal,
  ExternalLink,
  Info,
} from "lucide-react";

interface RequestLogItem {
  id: string;
  method: string;
  path: string;
  status: number;
  matchedRuleId: string | null;
  matchedRuleName?: string;
  nearMiss?: {
    closestRule?: string;
    missedField?: string;
    expected?: any;
    actual?: any;
    reasons?: string[];
  } | null;
  latencyMs: number;
  injectedMs: number;
  requestSize: number;
  responseSize: number;
  requestHeaders: Record<string, string>;
  requestBody: any;
  responseHeaders: Record<string, string>;
  responseBody: any;
  createdAt: string;
}

export default function TrafficInspectorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = (params?.id as string) || "petstore";

  // Filter states
  const [selectedMethod, setSelectedMethod] = useState<string>("ALL");
  const [selectedStatusClass, setSelectedStatusClass] = useState<string>("ALL");
  const [onlyUnmatched, setOnlyUnmatched] = useState<boolean>(false);
  const [searchPath, setSearchPath] = useState<string>("");
  const [selectedLog, setSelectedLog] = useState<RequestLogItem | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [ruleCreatedSuccess, setRuleCreatedSuccess] = useState<string | null>(null);

  // Sample seed data reflecting real mock traffic (§6.4)
  const [logs, setLogs] = useState<RequestLogItem[]>([
    {
      id: "log_101",
      method: "GET",
      path: "/users/42",
      status: 404,
      matchedRuleId: null,
      matchedRuleName: undefined,
      nearMiss: {
        closestRule: "Get User by ID (Admin)",
        missedField: "headers.X-Role",
        expected: "admin",
        actual: null,
        reasons: ["Header 'X-Role' required with value 'admin'"],
      },
      latencyMs: 14,
      injectedMs: 0,
      requestSize: 120,
      responseSize: 240,
      requestHeaders: {
        host: "petstore.mocklab.dev",
        "user-agent": "curl/8.4.0",
        accept: "application/json",
        authorization: "[REDACTED]",
      },
      requestBody: null,
      responseHeaders: {
        "content-type": "application/json",
        "x-mocklab-rule": "UNMATCHED",
      },
      responseBody: {
        error: "Unmatched Request",
        message: "No mock rule matched GET /users/42",
        nearMiss: {
          closestRule: "Get User by ID (Admin)",
          missedField: "headers.X-Role",
        },
      },
      createdAt: "2026-11-10T23:58:12.000Z",
    },
    {
      id: "log_102",
      method: "POST",
      path: "/pets",
      status: 201,
      matchedRuleId: "rule_stateful_pets_create",
      matchedRuleName: "stateful-bucket:pets:create",
      nearMiss: null,
      latencyMs: 22,
      injectedMs: 0,
      requestSize: 84,
      responseSize: 168,
      requestHeaders: {
        host: "petstore.mocklab.dev",
        "content-type": "application/json",
        "x-mocklab-scenario": "default",
      },
      requestBody: {
        name: "Shadow",
        tag: "dog",
        status: "available",
      },
      responseHeaders: {
        "content-type": "application/json",
        "x-mocklab-rule": "stateful-bucket:pets:create",
        "x-ratelimit-remaining": "99",
      },
      responseBody: {
        id: "7b4c91e2-38d0-4fa2-9381-81f9a2b530c1",
        name: "Shadow",
        tag: "dog",
        status: "available",
        createdAt: "2026-11-10T23:55:04.108Z",
        updatedAt: "2026-11-10T23:55:04.108Z",
      },
      createdAt: "2026-11-10T23:55:04.000Z",
    },
    {
      id: "log_103",
      method: "GET",
      path: "/pets",
      status: 200,
      matchedRuleId: "rule_pets_list",
      matchedRuleName: "List All Pets",
      nearMiss: null,
      latencyMs: 842,
      injectedMs: 800,
      requestSize: 64,
      responseSize: 512,
      requestHeaders: {
        host: "petstore.mocklab.dev",
        accept: "application/json",
      },
      requestBody: null,
      responseHeaders: {
        "content-type": "application/json",
        "x-mocklab-rule": "List All Pets",
      },
      responseBody: [
        { id: "1", name: "Doggie", status: "available" },
        { id: "2", name: "Catty", status: "pending" },
      ],
      createdAt: "2026-11-10T23:52:10.000Z",
    },
    {
      id: "log_104",
      method: "POST",
      path: "/orders/ord-99/pay",
      status: 500,
      matchedRuleId: "rule_fault_payment",
      matchedRuleName: "Simulated Payment Outage (Fault)",
      nearMiss: null,
      latencyMs: 1205,
      injectedMs: 1200,
      requestSize: 110,
      responseSize: 94,
      requestHeaders: {
        host: "petstore.mocklab.dev",
        "x-fail": "true",
      },
      requestBody: {
        cardLast4: "4242",
        amount: 89.0,
      },
      responseHeaders: {
        "content-type": "application/json",
        "x-mocklab-rule": "Simulated Payment Outage (Fault)",
      },
      responseBody: {
        error: "Internal Server Error",
        message: "Injected 500 payment gateway fault",
      },
      createdAt: "2026-11-10T23:48:00.000Z",
    },
  ]);

  // Filtered log list
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedMethod !== "ALL" && log.method !== selectedMethod) return false;
      if (selectedStatusClass === "2xx" && (log.status < 200 || log.status >= 300)) return false;
      if (selectedStatusClass === "4xx" && (log.status < 400 || log.status >= 500)) return false;
      if (selectedStatusClass === "5xx" && (log.status < 500 || log.status >= 600)) return false;
      if (onlyUnmatched && (log.status !== 404 || log.matchedRuleId !== null)) return false;
      if (searchPath.trim() && !log.path.toLowerCase().includes(searchPath.toLowerCase())) return false;
      return true;
    });
  }, [logs, selectedMethod, selectedStatusClass, onlyUnmatched, searchPath]);

  // Clipboard copy
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Generate cURL command
  const generateCurl = (log: RequestLogItem) => {
    let cmd = `curl -X ${log.method} "https://${projectId}.mocklab.dev${log.path}"`;
    if (log.requestHeaders) {
      for (const [k, v] of Object.entries(log.requestHeaders)) {
        if (!["host", "user-agent", "accept"].includes(k.toLowerCase())) {
          cmd += ` \\\n  -H "${k}: ${v}"`;
        }
      }
    }
    if (log.requestBody) {
      cmd += ` \\\n  -d '${JSON.stringify(log.requestBody)}'`;
    }
    return cmd;
  };

  // Create rule from request (§6.4 & §10 F5)
  const handleCreateRuleFromLog = (log: RequestLogItem) => {
    const newRuleName = `Rule for ${log.method} ${log.path}`;
    setRuleCreatedSuccess(newRuleName);
    setTimeout(() => setRuleCreatedSuccess(null), 4000);
  };

  // Replay in playground
  const handleReplayInPlayground = (log: RequestLogItem) => {
    router.push(`/projects/${projectId}/playground?method=${log.method}&path=${encodeURIComponent(log.path)}`);
  };

  // Method chip colors
  const getMethodBadge = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "POST":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "PUT":
      case "PATCH":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "DELETE":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-neutral-500/10 text-neutral-400 border-neutral-500/20";
    }
  };

  // Status badge colors
  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (status >= 400 && status < 500) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-rose-400 bg-rose-500/10 border-rose-500/20";
  };

  return (
    <div className="min-h-screen bg-[#101208] text-white font-sans">
      {/* Top Header */}
      <header className="border-b border-[#282F14] bg-[#16190B] px-6 py-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#A1A78E] mb-1">
              <Link href="/projects" className="hover:text-white transition-colors">Projects</Link>
              <span>/</span>
              <Link href={`/projects/${projectId}`} className="hover:text-white transition-colors">{projectId}</Link>
              <span>/</span>
              <span className="text-[#BFFF3C] font-mono">Traffic Inspector</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#BFFF3C]" />
                Traffic Inspector
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#1D220E] text-[#BFFF3C] border border-[#282F14]">
                Live Buffer Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#A1A78E] font-mono bg-[#101208] border border-[#282F14] px-3 py-1.5 rounded-md">
            <Info className="w-3.5 h-3.5 text-[#BFFF3C]" />
            <span>Retention: 14 days / 2,500 entries (Free Plan)</span>
          </div>
        </div>
      </header>

      {/* Filter Toolbar */}
      <div className="border-b border-[#282F14] bg-[#131609] px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Method Filter */}
            <div className="flex items-center rounded-md bg-[#16190B] border border-[#282F14] p-0.5 text-xs font-mono">
              {["ALL", "GET", "POST", "PUT", "DELETE"].map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMethod(m)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    selectedMethod === m
                      ? "bg-[#BFFF3C] text-[#101208] font-bold"
                      : "text-[#A1A78E] hover:text-white"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Status Class Filter */}
            <div className="flex items-center rounded-md bg-[#16190B] border border-[#282F14] p-0.5 text-xs font-mono">
              {["ALL", "2xx", "4xx", "5xx"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedStatusClass(s)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    selectedStatusClass === s
                      ? "bg-[#1D220E] text-[#BFFF3C] font-semibold border border-[#282F14]"
                      : "text-[#A1A78E] hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Only Unmatched Toggle (§6.4) */}
            <button
              onClick={() => setOnlyUnmatched(!onlyUnmatched)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono border transition-colors ${
                onlyUnmatched
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-500/20"
                  : "bg-[#16190B] text-[#A1A78E] hover:text-white border-[#282F14]"
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Only Unmatched</span>
            </button>
          </div>

          {/* Search Path Input */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#A1A78E]" />
              <input
                type="text"
                value={searchPath}
                onChange={(e) => setSearchPath(e.target.value)}
                placeholder="Filter by path..."
                className="bg-[#101208] border border-[#282F14] rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#A1A78E] outline-none focus:border-[#BFFF3C] w-56 font-mono"
              />
            </div>
            <button
              onClick={() => {
                setSelectedMethod("ALL");
                setSelectedStatusClass("ALL");
                setOnlyUnmatched(false);
                setSearchPath("");
              }}
              className="text-xs text-[#A1A78E] hover:text-white underline font-mono"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout: Dense Table + Optional Side Drawer */}
      <main className="p-6 max-w-7xl mx-auto">
        {ruleCreatedSuccess && (
          <div className="mb-4 p-3 rounded-md bg-[#BFFF3C]/10 border border-[#BFFF3C]/30 text-white text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#BFFF3C]" />
              <strong>Rule created & enabled:</strong> {ruleCreatedSuccess}. Sending this request again will now match!
            </span>
            <button onClick={() => setRuleCreatedSuccess(null)} className="text-[#A1A78E] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-[#16190B] border border-[#282F14] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#101208] border-b border-[#282F14] text-[#A1A78E] font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Time</th>
                  <th className="py-2.5 px-4 font-medium">Method</th>
                  <th className="py-2.5 px-4 font-medium">Path</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium">Matched Rule / Diagnosis</th>
                  <th className="py-2.5 px-4 font-medium text-right">Latency</th>
                  <th className="py-2.5 px-4 font-medium text-right">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#282F14]">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#A1A78E]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Activity className="w-6 h-6 text-[#282F14]" />
                        <span>No requests match current filters</span>
                        <span className="text-[11px]">Hit the mock server or adjust filters to view traffic.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const isUnmatched = log.status === 404 && !log.matchedRuleId;
                    const isSelected = selectedLog?.id === log.id;

                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className={`h-[34px] cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-[#1D220E] border-l-2 border-l-[#BFFF3C]"
                            : isUnmatched
                            ? "hover:bg-rose-500/5 bg-rose-500/[0.02]"
                            : "hover:bg-[#1D220E]/50"
                        }`}
                      >
                        <td className="py-2 px-4 font-mono text-[11px] text-[#A1A78E] whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="py-2 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getMethodBadge(log.method)}`}>
                            {log.method}
                          </span>
                        </td>
                        <td className="py-2 px-4 font-mono text-white max-w-xs truncate">
                          {log.path}
                        </td>
                        <td className="py-2 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${getStatusBadge(log.status)}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-xs font-mono">
                          {isUnmatched ? (
                            <span className="inline-flex items-center gap-1.5 text-rose-400 font-bold">
                              <AlertCircle className="w-3.5 h-3.5" />
                              UNMATCHED · Near-Miss
                            </span>
                          ) : (
                            <span className="text-[#BFFF3C] truncate block max-w-xs">
                              {log.matchedRuleName || log.matchedRuleId}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-4 font-mono text-right text-[11px] text-[#A1A78E] whitespace-nowrap">
                          {log.latencyMs} ms
                          {log.injectedMs > 0 && <span className="text-amber-400 ml-1">(+{log.injectedMs}ms)</span>}
                        </td>
                        <td className="py-2 px-4 font-mono text-right text-[11px] text-[#A1A78E] whitespace-nowrap">
                          {log.responseSize} B
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Row Detail Drawer (§6.4) */}
      {selectedLog && (
        <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-[#16190B] border-l border-[#282F14] shadow-2xl z-50 flex flex-col font-sans">
          {/* Drawer Header */}
          <div className="p-4 border-b border-[#282F14] bg-[#101208] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${getMethodBadge(selectedLog.method)}`}>
                {selectedLog.method}
              </span>
              <span className="font-mono text-white text-sm truncate max-w-xs">{selectedLog.path}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${getStatusBadge(selectedLog.status)}`}>
                {selectedLog.status}
              </span>
            </div>
            <button onClick={() => setSelectedLog(null)} className="text-[#A1A78E] hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Bar */}
          <div className="p-3 border-b border-[#282F14] bg-[#131609] flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => handleReplayInPlayground(selectedLog)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#BFFF3C] text-[#101208] hover:bg-[#a6e62e] transition-colors whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Replay in Playground
            </button>

            {(!selectedLog.matchedRuleId || selectedLog.status === 404) && (
              <button
                onClick={() => handleCreateRuleFromLog(selectedLog)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#1D220E] text-[#BFFF3C] border border-[#282F14] hover:bg-[#282F14] transition-colors whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Create Rule from Request
              </button>
            )}

            <button
              onClick={() => handleCopy(generateCurl(selectedLog), "curl")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono bg-[#16190B] text-white border border-[#282F14] hover:bg-[#1D220E] transition-colors whitespace-nowrap"
            >
              {copiedKey === "curl" ? <Check className="w-3.5 h-3.5 text-[#BFFF3C]" /> : <Copy className="w-3.5 h-3.5" />}
              Copy cURL
            </button>
          </div>

          {/* Drawer Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
            {/* Near-Miss Diagnostic Banner if Unmatched */}
            {selectedLog.nearMiss && (
              <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-white space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-rose-400">
                  <AlertCircle className="w-4 h-4" />
                  Why did this 404? (Near-Miss Report)
                </div>
                <p className="text-xs text-[#A1A78E] leading-relaxed">
                  Closest evaluated rule: <strong className="text-white font-mono">{selectedLog.nearMiss.closestRule || "Unknown"}</strong>.
                </p>
                {selectedLog.nearMiss.missedField && (
                  <div className="bg-[#101208] p-2 rounded border border-rose-500/20 font-mono text-[11px] text-rose-300">
                    Missed requirement: <code className="text-white font-bold">{selectedLog.nearMiss.missedField}</code>
                  </div>
                )}
                <div className="pt-1">
                  <button
                    onClick={() => handleCreateRuleFromLog(selectedLog)}
                    className="text-[11px] font-mono text-[#BFFF3C] hover:underline flex items-center gap-1"
                  >
                    Click "Create Rule from Request" to resolve this 404 automatically →
                  </button>
                </div>
              </div>
            )}

            {/* Matched Rule Info */}
            {selectedLog.matchedRuleName && (
              <div className="p-3 rounded-lg bg-[#1D220E] border border-[#282F14] space-y-1 font-mono">
                <div className="text-[11px] text-[#A1A78E]">Rule Matched:</div>
                <div className="text-sm font-semibold text-[#BFFF3C]">{selectedLog.matchedRuleName}</div>
              </div>
            )}

            {/* Request Pane */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[#A1A78E] font-mono text-[11px] uppercase tracking-wider">
                <span>Request Headers</span>
                <button
                  onClick={() => handleCopy(JSON.stringify(selectedLog.requestHeaders, null, 2), "req-headers")}
                  className="hover:text-white"
                >
                  {copiedKey === "req-headers" ? <Check className="w-3.5 h-3.5 text-[#BFFF3C]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <pre className="bg-[#101208] border border-[#282F14] p-3 rounded text-[11px] font-mono text-white overflow-x-auto">
                {JSON.stringify(selectedLog.requestHeaders, null, 2)}
              </pre>
            </div>

            {selectedLog.requestBody && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[#A1A78E] font-mono text-[11px] uppercase tracking-wider">
                  <span>Request Body</span>
                  <button
                    onClick={() => handleCopy(JSON.stringify(selectedLog.requestBody, null, 2), "req-body")}
                    className="hover:text-white"
                  >
                    {copiedKey === "req-body" ? <Check className="w-3.5 h-3.5 text-[#BFFF3C]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <pre className="bg-[#101208] border border-[#282F14] p-3 rounded text-[11px] font-mono text-white overflow-x-auto">
                  {JSON.stringify(selectedLog.requestBody, null, 2)}
                </pre>
              </div>
            )}

            {/* Response Pane */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[#A1A78E] font-mono text-[11px] uppercase tracking-wider">
                <span>Response Body</span>
                <button
                  onClick={() => handleCopy(JSON.stringify(selectedLog.responseBody, null, 2), "res-body")}
                  className="hover:text-white"
                >
                  {copiedKey === "res-body" ? <Check className="w-3.5 h-3.5 text-[#BFFF3C]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <pre className="bg-[#101208] border border-[#282F14] p-3 rounded text-[11px] font-mono text-white overflow-x-auto max-h-60">
                {JSON.stringify(selectedLog.responseBody, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
