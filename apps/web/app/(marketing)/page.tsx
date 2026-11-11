"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Terminal,
  ShieldCheck,
  Zap,
  Sliders,
  Database,
  Copy,
  Check,
  Play,
  CheckCircle2,
  RefreshCw,
  Code2,
  Lock,
  GitCompare,
  ClipboardCheck,
  Cpu,
  Link2,
  Bell,
  Gauge,
} from "lucide-react";

export default function LandingPage() {
  // Playground Instrument State
  const [isRunningRequest, setIsRunningRequest] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [latencyMs, setLatencyMs] = useState(28);
  const [transferBytes, setTransferBytes] = useState(842);
  const [userId, setUserId] = useState("usr_9401");

  // Schema Import Simulator State
  const [schemaUrl, setSchemaUrl] = useState("https://petstore.swagger.io/v2/swagger.json");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState<number>(3); // 1 = parsing, 2 = rules, 3 = ready

  // Execute Mock Request Simulation
  const handleExecuteMockRequest = () => {
    setIsRunningRequest(true);
    setTimeout(() => {
      const randomId = "usr_" + Math.floor(1000 + Math.random() * 9000);
      const randomLatency = Math.floor(18 + Math.random() * 25);
      const randomBytes = Math.floor(820 + Math.random() * 45);

      setUserId(randomId);
      setLatencyMs(randomLatency);
      setTransferBytes(randomBytes);
      setIsRunningRequest(false);
    }, 280);
  };

  // Simulate Spec Import
  const handleSimulateImport = () => {
    setIsSyncing(true);
    setSyncStep(1);

    setTimeout(() => {
      setSyncStep(2);
      setTimeout(() => {
        setSyncStep(3);
        setIsSyncing(false);
      }, 350);
    }, 250);
  };

  const jsonSnippet = `{
  "status": "success",
  "timestamp": "${new Date().toISOString()}",
  "data": {
    "id": "${userId}",
    "name": "Alex Rivera",
    "email": "alex.rivera@synthetics.io",
    "role": "admin",
    "status": "active",
    "contracts_passed": true,
    "active_tokens": 4,
    "cluster": "us-west-prod-02"
  },
  "_virtualized_by": "MockLab Engine v2.4"
}`;

  const copyJson = () => {
    navigator.clipboard.writeText(jsonSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyMockUrl = () => {
    navigator.clipboard.writeText("https://petstore.mocklab.dev");
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="flex flex-col w-full text-[var(--ink)] selection:bg-[var(--signal)] selection:text-[var(--surface-0)]">
      {/* ========================================================= */}
      {/* 1. HERO SECTION                                           */}
      {/* ========================================================= */}
      <section className="relative w-full pt-10 pb-16 px-6 lg:px-12 max-w-7xl mx-auto overflow-hidden">
        {/* Ambient Signal Glow Behind Hero */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[640px] h-[320px] bg-[var(--signal)]/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="flex flex-col items-center text-center max-w-4xl mx-auto relative z-10">
          {/* Spec Support Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[var(--surface-2)] text-[var(--signal)] font-mono text-xs mb-6 shadow-sm border border-[var(--border)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal)] animate-pulse" />
            <span className="tracking-wide uppercase font-semibold">
              OpenAPI 3.1 &amp; 3.0 Spec Support
            </span>
            <span className="text-[var(--ink-3)]">/</span>
            <span className="text-[var(--ink-2)] font-normal">v2.4 Live Engine</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[2.75rem] lg:leading-[3.25rem] font-bold text-[var(--ink)] tracking-tight max-w-3xl">
            Design the API. Mock it in seconds. <br className="hidden sm:inline" />
            <span className="text-[var(--signal)] font-extrabold drop-shadow-[0_0_24px_rgba(183,246,51,0.25)]">
              Prove it in CI.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg text-[var(--ink-2)] mt-5 max-w-2xl text-center leading-relaxed">
            Paste any OpenAPI spec URL or Swagger schema and get a live, stateful, hosted mock server instantly.
            Catch breaking contract drifts before pull requests merge.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link
              href="#playground"
              className="h-10 px-6 rounded bg-[var(--signal)] text-[var(--surface-0)] font-semibold text-sm flex items-center gap-2 hover:brightness-110 active:brightness-95 transition-all shadow-[0_0_20px_rgba(183,246,51,0.25)]"
            >
              <span>Start Mocking Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/dashboard"
              className="h-10 px-5 rounded bg-[var(--surface-2)] text-[var(--ink)] font-medium text-sm flex items-center gap-2 hover:bg-[var(--surface-1)] transition-colors border border-[var(--border)] shadow-sm"
            >
              <Play className="w-3.5 h-3.5 text-[var(--signal)] fill-[var(--signal)]" />
              <span>Try Petstore Demo</span>
            </Link>
          </div>

          {/* Quick Metrics Strip */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-6 text-[var(--ink-2)] font-mono text-xs">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[var(--signal)]" />
              <span>Zero Configuration</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[var(--signal)]" />
              <span>&lt;1ms Local Matcher</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-[var(--signal)]" />
              <span>Docker &amp; CLI Ready</span>
            </div>
          </div>
        </div>

        {/* Live Interactive Hero Playground Demo Panel */}
        <div
          id="playground"
          className="mt-12 max-w-5xl mx-auto rounded-xl bg-[var(--surface-3)] shadow-2xl border border-[var(--border)] overflow-hidden"
        >
          {/* Window Control Toolbar */}
          <div className="h-10 px-4 bg-[var(--surface-1)] flex items-center justify-between border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56]/80 border border-[#E0443E]/40" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]/80 border border-[#DEA123]/40" />
              <div className="w-3 h-3 rounded-full bg-[#27C93F]/80 border border-[#1AAB29]/40" />
              <span className="ml-3 font-mono text-xs text-[var(--ink-2)] hidden sm:inline">
                mocklab-workstation :: live-runner [cluster-us-east-1]
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs text-[var(--ink-2)]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--signal)]" /> Engine: Active
              </span>
              <span className="text-[var(--border-strong)]">|</span>
              <span>TLS: valid</span>
            </div>
          </div>

          {/* Request Execution Bar */}
          <div className="p-4 bg-[var(--surface-2)] flex flex-col md:flex-row items-stretch md:items-center gap-3 border-b border-[var(--border)]">
            <div className="flex items-center flex-1 bg-[var(--surface-3)] rounded px-3 py-1.5 shadow-inner border border-[var(--border)]">
              <span className="font-mono text-xs font-semibold uppercase px-2 py-0.5 rounded bg-[var(--signal-dim)] text-[var(--signal)]">
                GET
              </span>
              <span className="font-mono text-xs text-[var(--ink)] ml-3 select-all">
                https://petstore.mocklab.dev/v1/users
              </span>
            </div>
            <button
              onClick={handleExecuteMockRequest}
              disabled={isRunningRequest}
              className="h-9 px-4 rounded bg-[var(--signal)] text-[var(--surface-0)] font-mono text-xs font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningRequest ? "animate-spin" : ""}`} />
              <span>{isRunningRequest ? "Running..." : "Send Request"}</span>
            </button>
          </div>

          {/* Telemetry Status Line */}
          <div className="px-4 py-2 bg-[var(--surface-1)] flex flex-wrap items-center justify-between text-xs font-mono text-[var(--ink-2)] border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[var(--signal)] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>200 OK</span>
              </span>
              <span className="text-[var(--border-strong)]">•</span>
              <span>{latencyMs}ms latency</span>
              <span className="text-[var(--border-strong)]">•</span>
              <span>{transferBytes} B transfer</span>
              <span className="text-[var(--border-strong)] hidden sm:inline">•</span>
              <span className="text-[var(--ink)] hidden sm:inline">Matched Rule: #1 Mock Users List</span>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--signal)] font-mono text-xs">
              <Cpu className="w-3.5 h-3.5" />
              <span>Rule engine evaluated 3 criteria in 0.8ms</span>
            </div>
          </div>

          {/* Code Inspector Canvas (12 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 bg-[var(--surface-3)]">
            {/* Main JSON Viewer (8 cols) */}
            <div className="lg:col-span-8 p-4 font-mono text-xs relative border-b lg:border-b-0 lg:border-r border-[var(--border)]">
              <div className="flex items-center justify-between mb-3 text-xs font-mono text-[var(--ink-3)]">
                <span>RESPONSE BODY (application/json)</span>
                <button
                  onClick={copyJson}
                  className="hover:text-[var(--ink)] transition-colors flex items-center gap-1 text-xs"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-[var(--signal)]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <pre className="leading-relaxed overflow-x-auto text-[var(--ink)]">
                <code>
                  {"{\n"}
                  {"  "}<span className="text-[var(--signal)]">"status"</span>: <span className="text-[var(--success)]">"success"</span>,{"\n"}
                  {"  "}<span className="text-[var(--signal)]">"timestamp"</span>: <span className="text-[var(--ink-2)]">"{new Date().toISOString()}"</span>,{"\n"}
                  {"  "}<span className="text-[var(--signal)]">"data"</span>: {"{\n"}
                  {"    "}<span className="text-[var(--signal)]">"id"</span>: <span className="text-[var(--signal)]">"{userId}"</span>,{"\n"}
                  {"    "}<span className="text-[var(--signal)]">"name"</span>: <span className="text-[var(--ink)]">"Alex Rivera"</span>,{"\n"}
                  {"    "}<span className="text-[var(--signal)]">"email"</span>: <span className="text-[var(--ink)]">"alex.rivera@synthetics.io"</span>,{"\n"}
                  {"    "}<span className="text-[var(--signal)]">"role"</span>: <span className="text-[var(--ink-2)]">"admin"</span>,{"\n"}
                  {"    "}<span className="text-[var(--signal)]">"status"</span>: <span className="text-[var(--signal)]">"active"</span>,{"\n"}
                  {"    "}<span className="text-[var(--signal)]">"contracts_passed"</span>: <span className="text-[var(--info)]">true</span>,{"\n"}
                  {"    "}<span className="text-[var(--signal)]">"active_tokens"</span>: <span className="text-[var(--warning)]">4</span>,{"\n"}
                  {"    "}<span className="text-[var(--signal)]">"cluster"</span>: <span className="text-[var(--ink-2)]">"us-west-prod-02"</span>{"\n"}
                  {"  }"},{"\n"}
                  {"  "}<span className="text-[var(--signal)]">"_virtualized_by"</span>: <span className="text-[var(--ink-2)]">"MockLab Engine v2.4"</span>{"\n"}
                  {"}"}
                </code>
              </pre>
            </div>

            {/* Right Side Match Rules Inspector (4 cols) */}
            <div className="lg:col-span-4 p-4 bg-[var(--surface-1)] flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] text-[var(--ink-3)] block uppercase tracking-wider mb-3">
                  Matched Criteria [Spec Validated]
                </span>
                <div className="space-y-2 font-mono text-xs">
                  <div className="p-2.5 rounded bg-[var(--surface-2)] flex items-start gap-2 border border-[var(--border)]">
                    <ClipboardCheck className="w-4 h-4 text-[var(--signal)] mt-0.5" />
                    <div>
                      <div className="text-[var(--ink)] font-semibold">Path Pattern</div>
                      <div className="text-[var(--ink-2)] text-[11px]">/v1/users == exact</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-[var(--surface-2)] flex items-start gap-2 border border-[var(--border)]">
                    <ClipboardCheck className="w-4 h-4 text-[var(--signal)] mt-0.5" />
                    <div>
                      <div className="text-[var(--ink)] font-semibold">Header Guard</div>
                      <div className="text-[var(--ink-2)] text-[11px]">Accept: application/json</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-[var(--surface-2)] flex items-start gap-2 border border-[var(--border)]">
                    <ShieldCheck className="w-4 h-4 text-[var(--signal)] mt-0.5" />
                    <div>
                      <div className="text-[var(--ink)] font-semibold">Contract Drift Check</div>
                      <div className="text-[var(--signal)] text-[11px]">0 Drifts · 100% Valid</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 flex items-center justify-between text-xs font-mono text-[var(--ink-2)] border-t border-[var(--border)]">
                <span>Latency Injection:</span>
                <span className="px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--signal)] border border-[var(--border)]">
                  Jitter 15-40ms
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. PETSTORE SCHEMA IMPORT IN 30 SECONDS                   */}
      {/* ========================================================= */}
      <section className="w-full py-12 px-6 lg:px-12 bg-[var(--surface-3)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto">
          <div className="p-6 md:p-8 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--signal)] font-mono text-[10px] uppercase tracking-wider mb-3 border border-[var(--border)]">
                  <Gauge className="w-3.5 h-3.5" />
                  <span>Fastest Setup in Developer Tools</span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl text-[var(--ink)] font-semibold">
                  Import Petstore Schema in 30 Seconds
                </h2>
                <p className="text-xs sm:text-sm text-[var(--ink-2)] mt-2 leading-relaxed">
                  Don't write boilerplates. Submit an OpenAPI or Swagger spec endpoint and MockLab provisions isolated routes with realistic dynamic fixtures.
                </p>
              </div>

              {/* Interactive Widget Input & Flow */}
              <div className="w-full lg:max-w-lg flex flex-col gap-3">
                <div className="flex items-center gap-2 bg-[var(--surface-3)] p-2 rounded border border-[var(--border)] shadow-inner">
                  <input
                    type="text"
                    value={schemaUrl}
                    onChange={(e) => setSchemaUrl(e.target.value)}
                    className="flex-1 bg-transparent px-2 text-[var(--ink)] font-mono text-xs focus:outline-none"
                  />
                  <button
                    onClick={handleSimulateImport}
                    disabled={isSyncing}
                    className="h-8 px-3 rounded bg-[var(--signal)] text-[var(--surface-0)] font-mono text-xs font-semibold hover:brightness-110 whitespace-nowrap transition-all shadow-sm disabled:opacity-50"
                  >
                    {isSyncing ? "Syncing..." : "Sync Spec"}
                  </button>
                </div>

                {/* Progress Step Pills */}
                <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                  <div
                    className={`p-2 rounded font-medium flex items-center justify-center gap-1 border transition-colors ${
                      syncStep >= 1
                        ? "bg-[var(--surface-2)] text-[var(--signal)] border-[var(--signal)]/30"
                        : "bg-[var(--surface-3)] text-[var(--ink-3)] border-[var(--border)]"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>24 Endpoints</span>
                  </div>

                  <div
                    className={`p-2 rounded font-medium flex items-center justify-center gap-1 border transition-colors ${
                      syncStep >= 2
                        ? "bg-[var(--surface-2)] text-[var(--signal)] border-[var(--signal)]/30"
                        : "bg-[var(--surface-3)] text-[var(--ink-3)] border-[var(--border)]"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>48 Mock Rules</span>
                  </div>

                  <div
                    className={`p-2 rounded font-medium flex items-center justify-center gap-1 border transition-colors ${
                      syncStep >= 3
                        ? "bg-[var(--surface-2)] text-[var(--signal)] border-[var(--signal)]/30"
                        : "bg-[var(--surface-3)] text-[var(--ink-3)] border-[var(--border)]"
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span className="truncate">petstore.mocklab.dev</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-[var(--ink-2)] px-1">
                  <span>Auto-generated Faker engine active</span>
                  <button
                    onClick={copyMockUrl}
                    className="text-[var(--signal)] hover:underline flex items-center gap-1 text-xs"
                  >
                    {copiedUrl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUrl ? "Copied" : "Copy URL"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. ENGINE ARCHITECTURE: HOW MOCKLAB WORKS                 */}
      {/* ========================================================= */}
      <section id="how-it-works" className="w-full py-20 px-6 lg:px-12 max-w-7xl mx-auto scroll-mt-20">
        <div className="mb-14">
          <div className="font-mono text-xs uppercase tracking-wider text-[var(--signal)] font-semibold">
            Engine Architecture
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl text-[var(--ink)] font-bold mt-2">
            How MockLab Works: From Spec to CI Proof
          </h2>
          <p className="text-sm text-[var(--ink-2)] mt-2 max-w-2xl leading-relaxed">
            Three streamlined steps that replace brittle hand-crafted Express stubs with automated specification-backed contract virtualization.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Step 01 */}
          <div className="p-6 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] shadow-md flex flex-col justify-between hover:border-[var(--signal)]/40 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs text-[var(--signal)] font-bold px-2 py-0.5 rounded bg-[var(--signal-dim)] border border-[var(--signal)]/20">
                  01. IMPORT OR SYNC
                </span>
                <RefreshCw className="w-5 h-5 text-[var(--ink-3)]" />
              </div>
              <h3 className="font-display text-lg text-[var(--ink)] font-semibold">
                Spec Ingestion &amp; Synthesis
              </h3>
              <p className="text-xs text-[var(--ink-2)] mt-2 leading-relaxed">
                Paste schema URL or connect GitHub Actions. Auto-generates routes, parameters, error templates, and realistic contextual Faker fixtures instantly.
              </p>
            </div>
            <div className="mt-6 pt-4 bg-[var(--surface-3)] p-3 rounded font-mono text-xs text-[var(--ink-2)] overflow-x-auto border border-[var(--border)] shadow-inner">
              <div className="text-[var(--ink-3)] text-[11px] mb-1"># Terminal cURL trigger</div>
              <code className="text-[var(--ink)] text-[11px]">
                curl -X POST https://api.mocklab.dev/v1/specs \<br />
                {"  "}-d '{'{"url":"https://petstore.swagger.io/v2/swagger.json"}'}'
              </code>
            </div>
          </div>

          {/* Step 02 */}
          <div className="p-6 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] shadow-md flex flex-col justify-between hover:border-[var(--signal)]/40 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs text-[var(--signal)] font-bold px-2 py-0.5 rounded bg-[var(--signal-dim)] border border-[var(--signal)]/20">
                  02. STATE &amp; CHAOS
                </span>
                <Sliders className="w-5 h-5 text-[var(--ink-3)]" />
              </div>
              <h3 className="font-display text-lg text-[var(--ink)] font-semibold">
                Stateful Rules &amp; Chaos Injection
              </h3>
              <p className="text-xs text-[var(--ink-2)] mt-2 leading-relaxed">
                Add dynamic conditional matchers, inject latency (50ms–5000ms), simulated rate-limiting (429), or flaky server faults (500/503) without modifying your production backend.
              </p>
            </div>
            <div className="mt-6 p-3 rounded bg-[var(--surface-3)] font-mono text-xs text-[var(--ink-2)] space-y-2 border border-[var(--border)] shadow-inner">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--ink)]">Jitter Latency:</span>
                <span className="text-[var(--signal)] font-semibold">120ms - 850ms</span>
              </div>
              <div className="w-full bg-[var(--surface-2)] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[var(--signal)] h-full w-2/3" />
              </div>
              <div className="flex justify-between text-[11px] pt-1 text-[var(--ink-2)]">
                <span>Chaos Rate: 15%</span>
                <span>Fault: HTTP 503 Socket Drop</span>
              </div>
            </div>
          </div>

          {/* Step 03 */}
          <div className="p-6 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] shadow-md flex flex-col justify-between hover:border-[var(--signal)]/40 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs text-[var(--signal)] font-bold px-2 py-0.5 rounded bg-[var(--signal-dim)] border border-[var(--signal)]/20">
                  03. CI VERIFICATION
                </span>
                <ClipboardCheck className="w-5 h-5 text-[var(--ink-3)]" />
              </div>
              <h3 className="font-display text-lg text-[var(--ink)] font-semibold">
                Prove Contracts in Pipeline
              </h3>
              <p className="text-xs text-[var(--ink-2)] mt-2 leading-relaxed">
                Run dual validation against your mock baseline and live staging provider to automatically flag payload diffs, deleted attributes, and mutated schema types before merging.
              </p>
            </div>
            <div className="mt-6 p-3 rounded bg-[var(--surface-3)] font-mono text-xs border border-[var(--border)] shadow-inner">
              <div className="flex items-center justify-between text-xs text-[var(--ink-3)] mb-1.5">
                <span>GITHUB ACTION RESULT</span>
                <span className="text-[var(--signal)] font-semibold">PASSED</span>
              </div>
              <div className="text-xs text-[var(--ink-2)] space-y-0.5">
                <div>✔ 42 Endpoints Tested</div>
                <div>✔ 0 Breaking Schema Drifts</div>
                <div className="text-[var(--signal)] font-semibold">✔ 100% CI Contract Parity</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. CORE CAPABILITIES (6-CARD BENTO GRID)                  */}
      {/* ========================================================= */}
      <section id="features" className="w-full py-16 px-6 lg:px-12 bg-[var(--surface-1)] border-t border-[var(--border)] scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--signal)] font-semibold">
              Core Capabilities
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl text-[var(--ink)] font-bold mt-2">
              Engineered for Intricate API Topologies
            </h2>
            <p className="text-sm text-[var(--ink-2)] mt-1">
              Precision telemetry, deterministic pattern matches, and zero latency overhead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] shadow-sm hover:border-[var(--signal)]/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded bg-[var(--surface-1)] flex items-center justify-center text-[var(--signal)] mb-4 border border-[var(--border)]">
                  <Code2 className="w-5 h-5" />
                </div>
                <h3 className="font-display text-base text-[var(--ink)] font-semibold">
                  Deterministic Rule Matchers
                </h3>
                <p className="text-xs text-[var(--ink-2)] mt-2 leading-relaxed">
                  Route traffic via JSONPath queries, regex header extraction, and query string evaluation with sub-millisecond execution guarantees.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-1.5 font-mono text-[11px]">
                <span className="px-2 py-0.5 rounded bg-[var(--surface-1)] text-[var(--ink-2)] border border-[var(--border)]">
                  $.user.role == 'admin'
                </span>
                <span className="px-2 py-0.5 rounded bg-[var(--surface-1)] text-[var(--ink-2)] border border-[var(--border)]">
                  Header Auth: Bearer *
                </span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] shadow-sm hover:border-[var(--signal)]/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded bg-[var(--surface-1)] flex items-center justify-center text-[var(--signal)] mb-4 border border-[var(--border)]">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="font-display text-base text-[var(--ink)] font-semibold">
                  Stateful In-Memory Store
                </h3>
                <p className="text-xs text-[var(--ink-2)] mt-2 leading-relaxed">
                  POST, PUT, and DELETE operations persist mock state per session token in Redis buckets. Trigger automated rollbacks or reset on demand via webhook.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 font-mono text-xs text-[var(--ink-2)]">
                <span className="w-2 h-2 rounded-full bg-[var(--signal)]" />
                <span>Session persistence with instant flush reset</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] shadow-sm hover:border-[var(--signal)]/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded bg-[var(--surface-1)] flex items-center justify-center text-[var(--signal)] mb-4 border border-[var(--border)]">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-display text-base text-[var(--ink)] font-semibold">
                  Latency &amp; Chaos Injection
                </h3>
                <p className="text-xs text-[var(--ink-2)] mt-2 leading-relaxed">
                  Simulate packet drops, slow 3G cellular timeouts, rate limit buckets (HTTP 429), and TCP socket drops to test front-end fault tolerance.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between font-mono text-xs text-[var(--ink-2)] bg-[var(--surface-3)] p-2 rounded border border-[var(--border)]">
                <span>Fault Distribution:</span>
                <span className="text-[var(--signal)] font-semibold">Gaussian Jitter (±40ms)</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] shadow-sm hover:border-[var(--signal)]/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded bg-[var(--surface-1)] flex items-center justify-center text-[var(--signal)] mb-4 border border-[var(--border)]">
                  <GitCompare className="w-5 h-5" />
                </div>
                <h3 className="font-display text-base text-[var(--ink)] font-semibold">
                  Bidirectional Contract Diff
                </h3>
                <p className="text-xs text-[var(--ink-2)] mt-2 leading-relaxed">
                  Continuously intercept actual traffic against OpenAPI specs. Get alerted instantly when a backend engineer renames a key or changes types.
                </p>
              </div>
              <div className="mt-6 font-mono text-xs text-[var(--ink-2)] flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-[var(--signal)]" />
                <span>Alerts to Slack, Datadog &amp; GitHub PRs</span>
              </div>
            </div>

            {/* Card 5 */}
            <div className="p-6 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] shadow-sm hover:border-[var(--signal)]/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded bg-[var(--surface-1)] flex items-center justify-center text-[var(--signal)] mb-4 border border-[var(--border)]">
                  <Terminal className="w-5 h-5" />
                </div>
                <h3 className="font-display text-base text-[var(--ink)] font-semibold">
                  CLI &amp; GitHub Actions Native
                </h3>
                <p className="text-xs text-[var(--ink-2)] mt-2 leading-relaxed">
                  Run mock servers locally inside Docker or ephemeral CI runner containers with zero cloud dependency during test suite passes.
                </p>
              </div>
              <div className="mt-6 p-2 rounded bg-[var(--surface-3)] font-mono text-xs text-[var(--ink-2)] border border-[var(--border)] truncate">
                $ mocklab test --spec ./openapi.yaml
              </div>
            </div>

            {/* Card 6 */}
            <div className="p-6 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] shadow-sm hover:border-[var(--signal)]/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded bg-[var(--surface-1)] flex items-center justify-center text-[var(--signal)] mb-4 border border-[var(--border)]">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-display text-base text-[var(--ink)] font-semibold">
                  Zero Setup TLS &amp; Custom Domains
                </h3>
                <p className="text-xs text-[var(--ink-2)] mt-2 leading-relaxed">
                  Every sandbox receives an isolated HTTPS subdomain instantly or connect your own organization domain with automatic Let's Encrypt certificates.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 font-mono text-xs text-[var(--signal)]">
                <Lock className="w-3.5 h-3.5" />
                <span>https://*.mocklab.dev</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. TELEMETRY REALTIME FEED                                */}
      {/* ========================================================= */}
      <section className="w-full py-16 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="p-6 lg:p-8 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <span className="font-mono text-xs text-[var(--signal)] uppercase font-semibold">
                Telemetry Realtime Feed
              </span>
              <h3 className="font-display text-xl sm:text-2xl text-[var(--ink)] font-semibold mt-1">
                Live Route Traffic &amp; Contract Assertion Stream
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-[var(--ink-2)]">Throughput: 1,840 req/s</span>
              <span className="w-2 h-2 rounded-full bg-[var(--signal)] animate-pulse" />
            </div>
          </div>

          {/* Realtime Mock Log Table */}
          <div className="overflow-x-auto rounded bg-[var(--surface-3)] border border-[var(--border)]">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[var(--surface-2)] text-[var(--ink-2)] uppercase text-[11px] border-b border-[var(--border)]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Verb</th>
                  <th className="py-2.5 px-4 font-semibold">Path</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">Rule ID</th>
                  <th className="py-2.5 px-4 font-semibold">Duration</th>
                  <th className="py-2.5 px-4 font-semibold">Contract Drift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--ink)]">
                <tr className="hover:bg-[var(--surface-2)]/60 transition-colors">
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-[var(--signal-dim)] text-[var(--signal)] font-semibold text-[11px]">
                      GET
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-[var(--ink)]">/v1/users/usr_9401</td>
                  <td className="py-2.5 px-4 text-[var(--signal)] font-semibold">200 OK</td>
                  <td className="py-2.5 px-4 text-[var(--ink-2)]">rule_usr_lookup</td>
                  <td className="py-2.5 px-4 text-[var(--ink-2)]">24ms</td>
                  <td className="py-2.5 px-4 text-[var(--signal)] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Compliant</span>
                  </td>
                </tr>

                <tr className="hover:bg-[var(--surface-2)]/60 transition-colors">
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-semibold text-[11px]">
                      POST
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-[var(--ink)]">/v1/auth/tokens</td>
                  <td className="py-2.5 px-4 text-[var(--signal)] font-semibold">201 Created</td>
                  <td className="py-2.5 px-4 text-[var(--ink-2)]">rule_auth_persist</td>
                  <td className="py-2.5 px-4 text-[var(--ink-2)]">42ms</td>
                  <td className="py-2.5 px-4 text-[var(--signal)] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Compliant</span>
                  </td>
                </tr>

                <tr className="hover:bg-[var(--surface-2)]/60 transition-colors">
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-[var(--signal-dim)] text-[var(--signal)] font-semibold text-[11px]">
                      GET
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-[var(--ink)]">/v1/orders/live?limit=50</td>
                  <td className="py-2.5 px-4 text-[var(--danger)] font-semibold">429 RateLimit</td>
                  <td className="py-2.5 px-4 text-[var(--ink-2)]">chaos_ratelimit_spike</td>
                  <td className="py-2.5 px-4 text-[var(--ink-2)]">8ms</td>
                  <td className="py-2.5 px-4 text-[var(--warning)] flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Chaos Test</span>
                  </td>
                </tr>

                <tr className="hover:bg-[var(--surface-2)]/60 transition-colors">
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-cyan-400/20 text-cyan-300 font-semibold text-[11px]">
                      PUT
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-[var(--ink)]">/v1/tenants/9842/settings</td>
                  <td className="py-2.5 px-4 text-[var(--signal)] font-semibold">200 OK</td>
                  <td className="py-2.5 px-4 text-[var(--ink-2)]">rule_stateful_merge</td>
                  <td className="py-2.5 px-4 text-[var(--ink-2)]">31ms</td>
                  <td className="py-2.5 px-4 text-[var(--signal)] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Compliant</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. USAGE PRICING CARDS                                    */}
      {/* ========================================================= */}
      <section id="pricing" className="w-full py-16 px-6 lg:px-12 bg-[var(--surface-3)] border-t border-[var(--border)] scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--signal)] font-semibold">
              Predictable Usage Pricing
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl text-[var(--ink)] font-bold mt-2">
              Designed for Individual Coders &amp; Large Teams
            </h2>
            <p className="text-sm text-[var(--ink-2)] mt-2">
              Start for free in local development. Scale seamlessly to mission-critical CI contract verification pipelines.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Free Tier */}
            <div className="p-6 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] flex flex-col justify-between shadow-sm">
              <div>
                <div className="font-mono text-xs text-[var(--ink-2)] font-medium uppercase">
                  Free
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-[var(--ink)]">$0</span>
                  <span className="text-[var(--ink-2)] font-mono text-xs">/ month</span>
                </div>
                <p className="text-xs text-[var(--ink-2)] mt-3">
                  Perfect for indie hackers, rapid prototyping, and mocking local frontend clients.
                </p>
                <div className="mt-6 pt-6 space-y-3 font-mono text-xs text-[var(--ink-2)] border-t border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                    <span>5,000 requests / mo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                    <span>3 OpenAPI Specs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                    <span>7-Day Traffic Logs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                    <span>Community Discord Support</span>
                  </div>
                </div>
              </div>
              <Link
                href="/projects/petstore/playground"
                className="mt-8 w-full h-10 rounded bg-[var(--surface-2)] text-[var(--ink)] font-mono text-xs font-semibold hover:bg-[var(--surface-0)] border border-[var(--border)] transition-colors flex items-center justify-center"
              >
                Deploy Free Mock
              </Link>
            </div>

            {/* Pro Tier (Highlighted Signal Lime) */}
            <div className="p-6 rounded-xl bg-[var(--surface-2)] border-2 border-[var(--signal)] flex flex-col justify-between relative shadow-2xl shadow-[var(--signal)]/10">
              <div className="absolute -top-3 right-6 px-2.5 py-0.5 rounded bg-[var(--signal)] text-[var(--surface-0)] font-mono text-[10px] font-bold uppercase tracking-wider">
                Most Popular
              </div>
              <div>
                <div className="font-mono text-xs text-[var(--signal)] font-semibold uppercase">
                  Pro
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-[var(--ink)]">$29</span>
                  <span className="text-[var(--ink-2)] font-mono text-xs">/ month (TBD GA)</span>
                </div>
                <p className="text-xs text-[var(--ink-2)] mt-3">
                  Full power for full-stack developers requiring latency injection, state persistence, and CI pipeline checks.
                </p>
                <div className="mt-6 pt-6 space-y-3 font-mono text-xs text-[var(--ink)] border-t border-[var(--border)]">
                  <div className="flex items-center gap-2 font-medium">
                    <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                    <span>100,000 / mo</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                    <span>Unlimited Specs &amp; Endpoints</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                    <span>Chaos Engine &amp; Jitter Simulation</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                    <span>30-Day Full Request Inspector Logs</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                    <span>GitHub Action &amp; CLI CI Runners</span>
                  </div>
                </div>
              </div>
              <Link
                href="/pricing"
                className="mt-8 w-full h-10 rounded bg-[var(--signal)] text-[var(--surface-0)] font-mono text-xs font-bold hover:brightness-110 active:brightness-95 transition-all shadow-[0_0_16px_rgba(183,246,51,0.3)] flex items-center justify-center"
              >
                Start 14-Day Free Pro Trial
              </Link>
            </div>

            {/* Team Tier */}
            <div className="p-6 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] flex flex-col justify-between shadow-sm">
              <div>
                <div className="font-mono text-xs text-[var(--ink-2)] font-medium uppercase">
                  Team
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-[var(--ink)]">$99</span>
                  <span className="text-[var(--ink-2)] font-mono text-xs">/ month (Scale)</span>
                </div>
                <p className="text-xs text-[var(--ink-2)] mt-3">
                  Scale across multiple microservices with contract drift enforcement and enterprise SSO.
                </p>
                <div className="mt-6 pt-6 space-y-3 font-mono text-xs text-[var(--ink-2)] border-t border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                    <span>1,000,000 / mo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                    <span>Custom HTTPS Domains</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                    <span>Contract Drift Webhooks &amp; Slacks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                    <span>SAML / SSO Authentication</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                    <span>Dedicated Edge Mock Cluster</span>
                  </div>
                </div>
              </div>
              <Link
                href="/pricing"
                className="mt-8 w-full h-10 rounded bg-[var(--surface-2)] text-[var(--ink)] font-mono text-xs font-semibold hover:bg-[var(--surface-0)] border border-[var(--border)] transition-colors flex items-center justify-center"
              >
                Contact Sales &amp; Team Demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
