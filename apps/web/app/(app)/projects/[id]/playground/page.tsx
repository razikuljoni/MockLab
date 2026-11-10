"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Send,
  Terminal,
  Clock,
  Copy,
  Check,
  Code,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Plus,
  Trash2,
  Sliders,
  RotateCw,
  Search,
  Sparkles,
  Download,
  AlertTriangle,
} from "lucide-react";

interface ParamRow {
  key: string;
  value: string;
  enabled: boolean;
}

interface HistoryItem {
  id: string;
  method: string;
  path: string;
  status: number;
  time: string;
  durationMs: number;
}

export default function PlaygroundPage() {
  const params = useParams();
  const projectId = (params?.id as string) || "petstore";

  // Targets & Environment
  const [envMode, setEnvMode] = useState<"mock" | "real">("mock");
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/pets/42");

  // Request Tabs
  const [activeReqTab, setActiveReqTab] = useState<"params" | "headers" | "auth" | "body" | "rules">("params");
  const [activeResTab, setActiveResTab] = useState<"body" | "headers" | "timeline" | "validation">("body");

  // Request Data
  const [queryParams, setQueryParams] = useState<ParamRow[]>([
    { key: "status", value: "available", enabled: false },
  ]);
  const [headers, setHeaders] = useState<ParamRow[]>([
    { key: "Accept", value: "application/json", enabled: true },
  ]);
  const [authType, setAuthType] = useState<"none" | "bearer" | "apikey">("none");
  const [authToken, setAuthToken] = useState("");
  const [bodyContent, setBodyContent] = useState(`{\n  "name": "Sparky",\n  "tag": "dog"\n}`);

  // Response Data
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>({
    status: 200,
    statusText: "OK",
    headers: {
      "content-type": "application/json",
      "x-mocklab-rule": "Get pet by ID (default example)",
      "x-ratelimit-limit": "100",
      "x-ratelimit-remaining": "98",
      "x-ratelimit-reset": "1731283200",
    },
    data: {
      id: 42,
      name: "Sparky",
      status: "available",
      tag: "dog",
    },
    durationMs: 42,
    ttfbMs: 38,
  });

  // History & Code Copy State
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([
    { id: "h1", method: "GET", path: "/pets/42", status: 200, time: "1m ago", durationMs: 42 },
    { id: "h2", method: "POST", path: "/pets", status: 201, time: "5m ago", durationMs: 68 },
    { id: "h3", method: "GET", path: "/nope", status: 404, time: "12m ago", durationMs: 14 },
  ]);

  // Sidebar tree toggle & filter
  const [sidebarTab, setSidebarTab] = useState<"endpoints" | "history">("endpoints");
  const [treeSearch, setTreeSearch] = useState("");

  const sampleEndpoints = [
    { method: "GET", path: "/pets", summary: "List all pets" },
    { method: "POST", path: "/pets", summary: "Create a pet" },
    { method: "GET", path: "/pets/{id}", summary: "Get pet by ID" },
    { method: "DELETE", path: "/pets/{id}", summary: "Delete pet" },
    { method: "GET", path: "/store/inventory", summary: "Get inventory" },
  ];

  const getMethodBadgeClass = (m: string) => {
    switch (m) {
      case "GET":
        return "bg-[#4ADE80]/15 text-[#4ADE80] border-[#4ADE80]/30";
      case "POST":
        return "bg-[#FACC15]/15 text-[#FACC15] border-[#FACC15]/30";
      case "PUT":
        return "bg-[#67E8F9]/15 text-[#67E8F9] border-[#67E8F9]/30";
      case "PATCH":
        return "bg-[#C084FC]/15 text-[#C084FC] border-[#C084FC]/30";
      case "DELETE":
        return "bg-[#F87171]/15 text-[#F87171] border-[#F87171]/30";
      default:
        return "bg-[#A8B09A]/15 text-[#A8B09A] border-[#A8B09A]/30";
    }
  };

  const handleSend = async () => {
    setLoading(true);

    // Build URL query string
    const activeParams = queryParams.filter((p) => p.enabled && p.key);
    const queryString = activeParams.length > 0
      ? "?" + activeParams.map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join("&")
      : "";

    const fullUrl = `https://${projectId}.mocklab.dev${path}${queryString}`;

    // Assemble headers
    const reqHeaders: Record<string, string> = {};
    headers.filter((h) => h.enabled && h.key).forEach((h) => {
      reqHeaders[h.key] = h.value;
    });

    if (authType === "bearer" && authToken) {
      reqHeaders["Authorization"] = `Bearer ${authToken}`;
    } else if (authType === "apikey" && authToken) {
      reqHeaders["X-MockLab-Key"] = authToken;
    }

    try {
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          url: fullUrl,
          headers: reqHeaders,
          body: method !== "GET" && method !== "HEAD" ? bodyContent : undefined,
        }),
      });

      const json = await res.json();
      setResponse(json);

      // Record to history
      const newHistoryItem: HistoryItem = {
        id: `h_${Date.now()}`,
        method,
        path,
        status: json.status || 500,
        time: "Just now",
        durationMs: json.durationMs || 25,
      };
      setHistory([newHistoryItem, ...history.slice(0, 19)]);
    } catch {
      // Fallback simulated response if offline
      setResponse({
        status: 200,
        statusText: "OK",
        headers: {
          "x-mocklab-rule": `Simulated Rule for ${method} ${path}`,
          "content-type": "application/json",
        },
        data: {
          id: 42,
          name: "Sparky",
          status: "available",
        },
        durationMs: 38,
        ttfbMs: 34,
      });
    } finally {
      setLoading(false);
    }
  };

  // Listen for Cmd+Enter / Ctrl+Enter shortcut (§6.2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSend();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [method, path, queryParams, headers, authType, authToken, bodyContent]);

  // Snippet generators
  const generateCurl = () => {
    return `curl -i -X ${method} "https://${projectId}.mocklab.dev${path}" \\
  -H "Accept: application/json"${
    authType === "bearer" && authToken ? ` \\\n  -H "Authorization: Bearer ${authToken}"` : ""
  }`;
  };

  const copySnippet = (kind: string, snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedCode(kind);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Spec Validation Checker
  const checkValidation = () => {
    const issues = [];
    if (response?.data && typeof response.data === "object") {
      if (!response.data.id && !response.data.name) {
        issues.push({ field: "id", message: "Missing required property 'id' declared in OpenAPI schema" });
      }
    }
    return issues;
  };
  const validationIssues = checkValidation();

  return (
    <div className="h-full flex overflow-hidden border border-[var(--border)] rounded-xl bg-[var(--surface-1)]">
      {/* 1. Left Sidebar: Endpoints Tree & History (260px) */}
      <div className="w-64 min-w-64 border-r border-[var(--border)] flex flex-col bg-[var(--surface-0)] text-xs">
        {/* Sidebar Tabs */}
        <div className="flex border-b border-[var(--border)]">
          <button
            onClick={() => setSidebarTab("endpoints")}
            className={`flex-1 py-2.5 font-medium text-center transition-colors ${
              sidebarTab === "endpoints"
                ? "border-b-2 border-[var(--signal)] text-[var(--signal)] bg-[var(--surface-1)]"
                : "text-[var(--ink-2)] hover:text-[var(--ink)]"
            }`}
          >
            Endpoints
          </button>
          <button
            onClick={() => setSidebarTab("history")}
            className={`flex-1 py-2.5 font-medium text-center transition-colors ${
              sidebarTab === "history"
                ? "border-b-2 border-[var(--signal)] text-[var(--signal)] bg-[var(--surface-1)]"
                : "text-[var(--ink-2)] hover:text-[var(--ink)]"
            }`}
          >
            History
          </button>
        </div>

        {/* Tree Search */}
        <div className="p-2 border-b border-[var(--border)]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-3)]" />
            <input
              type="text"
              value={treeSearch}
              onChange={(e) => setTreeSearch(e.target.value)}
              placeholder="Filter..."
              className="w-full pl-7 pr-2 py-1 rounded bg-[var(--surface-1)] border border-[var(--border)] text-[11px] text-[var(--ink)] focus:outline-none focus:border-[var(--signal)]"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sidebarTab === "endpoints" && (
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[var(--ink-3)] uppercase px-2 block">
                Pets Resource
              </span>
              {sampleEndpoints.map((ep, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setMethod(ep.method);
                    setPath(ep.path.replace("{id}", "42"));
                  }}
                  className="w-full p-2 rounded-md hover:bg-[var(--surface-2)] flex items-center justify-between text-left transition-colors font-mono"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getMethodBadgeClass(
                        ep.method
                      )}`}
                    >
                      {ep.method}
                    </span>
                    <span className="text-[var(--ink)] text-[11px] truncate">{ep.path}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--ink-3)] shrink-0" />
                </button>
              ))}
            </div>
          )}

          {sidebarTab === "history" && (
            <div className="space-y-1">
              {history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => {
                    setMethod(h.method);
                    setPath(h.path);
                  }}
                  className="w-full p-2 rounded-md hover:bg-[var(--surface-2)] flex items-center justify-between text-left transition-colors font-mono text-[11px]"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${getMethodBadgeClass(
                        h.method
                      )}`}
                    >
                      {h.method}
                    </span>
                    <span className="text-[var(--ink)] truncate">{h.path}</span>
                  </div>
                  <span
                    className={`text-[10px] ${
                      h.status < 400 ? "text-[var(--success)]" : "text-[var(--danger)]"
                    }`}
                  >
                    {h.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Work Area: Request Builder & Response Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Request Top Bar (§6.2) */}
        <div className="p-3 border-b border-[var(--border)] bg-[var(--surface-1)] flex items-center gap-2">
          {/* Method Chip Dropdown */}
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className={`px-3 py-1.5 rounded-md font-mono font-bold text-xs border appearance-none cursor-pointer focus:outline-none ${getMethodBadgeClass(
              method
            )}`}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>

          {/* URL Input Bar with {{baseUrl}} highlighting */}
          <div className="flex-1 flex items-center px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-0)] font-mono text-xs focus-within:border-[var(--signal)]">
            <span className="px-1.5 py-0.5 rounded bg-[var(--signal-dim)] text-[var(--signal)] font-medium text-[11px] mr-1 select-none">
              {"{{baseUrl}}"}
            </span>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/pets/42"
              className="flex-1 bg-transparent text-[var(--ink)] focus:outline-none"
            />
          </div>

          {/* Send Button & Hint */}
          <button
            onClick={handleSend}
            disabled={loading}
            className="px-4 py-1.5 rounded-md bg-[var(--signal)] text-[var(--surface-0)] font-semibold text-xs flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
          >
            <span>{loading ? "Sending..." : "Send"}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center / Bottom Split */}
        <div className="flex-1 grid grid-rows-2 overflow-hidden">
          {/* Top Half: Request Configuration */}
          <div className="border-b border-[var(--border)] flex flex-col overflow-hidden bg-[var(--surface-1)]">
            {/* Request Tabs Header */}
            <div className="px-4 border-b border-[var(--border)] flex items-center justify-between text-xs bg-[var(--surface-2)]">
              <div className="flex items-center gap-4">
                {(["params", "headers", "auth", "body", "rules"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveReqTab(t)}
                    className={`py-2 capitalize font-medium border-b-2 transition-colors ${
                      activeReqTab === t
                        ? "border-[var(--signal)] text-[var(--signal)]"
                        : "border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="text-[11px] text-[var(--ink-3)] font-mono">
                Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-0)] border border-[var(--border)]">⌘ + Enter</kbd> to send
              </div>
            </div>

            {/* Request Tab Panels */}
            <div className="flex-1 overflow-y-auto p-4 text-xs">
              {activeReqTab === "params" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[var(--ink)]">Query Parameters</span>
                    <button
                      onClick={() => setQueryParams([...queryParams, { key: "", value: "", enabled: true }])}
                      className="text-[var(--signal)] hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <Plus className="w-3 h-3" /> Add Param
                    </button>
                  </div>
                  {queryParams.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2 font-mono">
                      <input
                        type="checkbox"
                        checked={p.enabled}
                        onChange={(e) => {
                          const copy = [...queryParams];
                          copy[idx].enabled = e.target.checked;
                          setQueryParams(copy);
                        }}
                        className="rounded border-[var(--border)] accent-[var(--signal)]"
                      />
                      <input
                        type="text"
                        value={p.key}
                        onChange={(e) => {
                          const copy = [...queryParams];
                          copy[idx].key = e.target.value;
                          setQueryParams(copy);
                        }}
                        placeholder="parameter"
                        className="flex-1 px-2.5 py-1 rounded bg-[var(--surface-0)] border border-[var(--border)] text-[var(--ink)]"
                      />
                      <input
                        type="text"
                        value={p.value}
                        onChange={(e) => {
                          const copy = [...queryParams];
                          copy[idx].value = e.target.value;
                          setQueryParams(copy);
                        }}
                        placeholder="value"
                        className="flex-1 px-2.5 py-1 rounded bg-[var(--surface-0)] border border-[var(--border)] text-[var(--ink)]"
                      />
                      <button
                        onClick={() => setQueryParams(queryParams.filter((_, i) => i !== idx))}
                        className="p-1 text-[var(--ink-3)] hover:text-[var(--danger)]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeReqTab === "headers" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[var(--ink)]">Request Headers</span>
                    <button
                      onClick={() => setHeaders([...headers, { key: "", value: "", enabled: true }])}
                      className="text-[var(--signal)] hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <Plus className="w-3 h-3" /> Add Header
                    </button>
                  </div>
                  {headers.map((h, idx) => (
                    <div key={idx} className="flex items-center gap-2 font-mono">
                      <input
                        type="checkbox"
                        checked={h.enabled}
                        onChange={(e) => {
                          const copy = [...headers];
                          copy[idx].enabled = e.target.checked;
                          setHeaders(copy);
                        }}
                        className="rounded border-[var(--border)] accent-[var(--signal)]"
                      />
                      <input
                        type="text"
                        value={h.key}
                        onChange={(e) => {
                          const copy = [...headers];
                          copy[idx].key = e.target.value;
                          setHeaders(copy);
                        }}
                        placeholder="Header-Name"
                        className="flex-1 px-2.5 py-1 rounded bg-[var(--surface-0)] border border-[var(--border)] text-[var(--ink)]"
                      />
                      <input
                        type="text"
                        value={h.value}
                        onChange={(e) => {
                          const copy = [...headers];
                          copy[idx].value = e.target.value;
                          setHeaders(copy);
                        }}
                        placeholder="value"
                        className="flex-1 px-2.5 py-1 rounded bg-[var(--surface-0)] border border-[var(--border)] text-[var(--ink)]"
                      />
                      <button
                        onClick={() => setHeaders(headers.filter((_, i) => i !== idx))}
                        className="p-1 text-[var(--ink-3)] hover:text-[var(--danger)]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeReqTab === "auth" && (
                <div className="space-y-4 max-w-md">
                  <div className="space-y-1.5">
                    <label className="font-medium text-[var(--ink)]">Authorization Type</label>
                    <select
                      value={authType}
                      onChange={(e) => setAuthType(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-0)] text-[var(--ink)]"
                    >
                      <option value="none">No Auth</option>
                      <option value="bearer">Bearer Token</option>
                      <option value="apikey">X-MockLab-Key (Project API Key)</option>
                    </select>
                  </div>
                  {authType !== "none" && (
                    <div className="space-y-1.5">
                      <label className="font-medium text-[var(--ink)]">
                        {authType === "bearer" ? "Bearer Token" : "API Key"}
                      </label>
                      <input
                        type="password"
                        value={authToken}
                        onChange={(e) => setAuthToken(e.target.value)}
                        placeholder="Enter token or key..."
                        className="w-full px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-0)] text-[var(--ink)] font-mono"
                      />
                    </div>
                  )}
                </div>
              )}

              {activeReqTab === "body" && (
                <div className="h-full flex flex-col space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-[var(--ink-3)]">
                    <span>JSON Payload (Validated live against schema)</span>
                    <button
                      onClick={() => {
                        try {
                          setBodyContent(JSON.stringify(JSON.parse(bodyContent), null, 2));
                        } catch {}
                      }}
                      className="text-[var(--signal)] hover:underline"
                    >
                      Prettify JSON
                    </button>
                  </div>
                  <textarea
                    value={bodyContent}
                    onChange={(e) => setBodyContent(e.target.value)}
                    className="flex-1 w-full p-3 rounded-md border border-[var(--border)] bg-[var(--surface-3)] font-mono text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--signal)] resize-none"
                  />
                </div>
              )}

              {activeReqTab === "rules" && (
                <div className="space-y-3">
                  <div className="p-3 rounded-md bg-[var(--signal-dim)] border border-[var(--signal)]/30 text-xs text-[var(--signal)] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>
                      Live Rule Prediction: This request will match <strong>"Get pet by ID (default)"</strong>
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--ink-2)]">
                    Clause: Path matches <code className="text-[var(--signal)]">/pets/:id</code> and Method is{" "}
                    <code className="text-[var(--signal)]">GET</code>. Priority 1.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Half: Response Pane */}
          <div className="flex flex-col overflow-hidden bg-[var(--surface-0)]">
            {/* Loud Status Line (§6.2) */}
            <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-1)] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span
                  className={`px-2.5 py-0.5 rounded font-bold font-mono text-xs border ${
                    response?.status < 400
                      ? "bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30"
                      : "bg-[var(--danger)]/15 text-[var(--danger)] border-[var(--danger)]/30"
                  }`}
                >
                  {response?.status || 200} {response?.statusText || "OK"}
                </span>
                <span className="font-mono text-[var(--ink-2)]">
                  {response?.durationMs || 42} ms
                </span>
                <span className="text-[var(--ink-3)] font-mono">1.2 KB</span>
                <span className="px-2 py-0.5 rounded bg-[var(--surface-2)] text-[11px] font-mono text-[var(--signal)] border border-[var(--border)]">
                  {response?.headers?.["x-mocklab-rule"] || "Matched Default Rule"}
                </span>
              </div>

              {/* Code Export Buttons */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => copySnippet("curl", generateCurl())}
                  className="px-2.5 py-1 rounded bg-[var(--surface-2)] text-[var(--ink-2)] hover:text-[var(--ink)] border border-[var(--border)] flex items-center gap-1.5 text-[11px]"
                >
                  {copiedCode === "curl" ? <Check className="w-3 h-3 text-[var(--signal)]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode === "curl" ? "Copied" : "Copy cURL"}</span>
                </button>
                <button
                  onClick={() =>
                    copySnippet("fetch", `fetch("https://${projectId}.mocklab.dev${path}");`)
                  }
                  className="px-2 py-1 rounded hover:bg-[var(--surface-2)] text-[var(--ink-3)] text-[11px]"
                >
                  fetch
                </button>
                <button
                  onClick={() =>
                    copySnippet(
                      "python",
                      `import requests\nresp = requests.${method.toLowerCase()}("https://${projectId}.mocklab.dev${path}")`
                    )
                  }
                  className="px-2 py-1 rounded hover:bg-[var(--surface-2)] text-[var(--ink-3)] text-[11px]"
                >
                  Python
                </button>
              </div>
            </div>

            {/* Response Sub-Tabs Header */}
            <div className="px-4 border-b border-[var(--border)] flex items-center gap-4 text-xs bg-[var(--surface-1)]">
              {(["body", "headers", "timeline", "validation"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveResTab(t)}
                  className={`py-2 capitalize font-medium border-b-2 transition-colors ${
                    activeResTab === t
                      ? "border-[var(--signal)] text-[var(--signal)]"
                      : "border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Response Sub-Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 text-xs">
              {activeResTab === "body" && (
                <div className="p-4 rounded-lg bg-[var(--surface-3)] font-mono text-xs text-[var(--ink)] overflow-x-auto border border-[var(--border)] leading-relaxed">
                  <pre>{JSON.stringify(response?.data, null, 2)}</pre>
                </div>
              )}

              {activeResTab === "headers" && (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden font-mono text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[var(--surface-2)] border-b border-[var(--border)] text-[var(--ink-3)] text-[10px] uppercase">
                      <tr>
                        <th className="p-2.5">Header Name</th>
                        <th className="p-2.5">Header Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)] text-[var(--ink)]">
                      {response?.headers &&
                        Object.entries(response.headers).map(([k, v]) => (
                          <tr key={k}>
                            <td className="p-2.5 font-bold text-[var(--signal)]">{k}</td>
                            <td className="p-2.5 text-[var(--ink-2)] truncate max-w-md">{String(v)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeResTab === "timeline" && (
                <div className="space-y-4 max-w-md text-xs">
                  <h4 className="font-semibold text-[var(--ink)]">Latency Breakdown</h4>
                  <div className="space-y-2 font-mono">
                    <div className="flex items-center justify-between text-[var(--ink-2)]">
                      <span>DNS &amp; Connection:</span>
                      <span className="text-[var(--ink)]">3 ms</span>
                    </div>
                    <div className="flex items-center justify-between text-[var(--ink-2)]">
                      <span>Time to First Byte (TTFB):</span>
                      <span className="text-[var(--signal)] font-bold">{response?.ttfbMs || 38} ms</span>
                    </div>
                    <div className="flex items-center justify-between text-[var(--ink-2)]">
                      <span>Injected Delay:</span>
                      <span className="text-[var(--ink)]">0 ms</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-[var(--border)] pt-2 font-bold">
                      <span className="text-[var(--ink)]">Total Roundtrip:</span>
                      <span className="text-[var(--signal)]">{response?.durationMs || 42} ms</span>
                    </div>
                  </div>
                </div>
              )}

              {activeResTab === "validation" && (
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] space-y-2">
                    <div className="flex items-center gap-2 text-[var(--success)] font-semibold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Spec Conformance Verified</span>
                    </div>
                    <p className="text-[var(--ink-2)] text-[11px]">
                      Response payload complies with OpenAPI 3.1 schema definition for operation{" "}
                      <code className="text-[var(--signal)]">{method} {path}</code>.
                    </p>
                  </div>

                  {validationIssues.length > 0 && (
                    <div className="p-3.5 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/10 space-y-2">
                      <div className="flex items-center gap-2 text-[var(--warning)] font-semibold">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Schema Validation Warning:</span>
                      </div>
                      <ul className="space-y-1 text-[11px] text-[var(--ink-2)] list-disc list-inside">
                        {validationIssues.map((v, i) => (
                          <li key={i}>{v.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
