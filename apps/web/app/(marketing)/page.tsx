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
  GitBranch,
  Copy,
  Check,
  Play,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"get" | "post">("get");

  const sampleCurl = `curl -i https://petstore.mocklab.dev/pets/42 \\
  -H "Accept: application/json"`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sampleCurl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="py-12 md:py-20 px-6 max-w-6xl mx-auto space-y-24">
      {/* 1. Hero Section */}
      <section className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-1)] text-xs text-[var(--signal)]">
          <span className="w-2 h-2 rounded-full bg-[var(--signal)] animate-pulse"></span>
          <span className="font-medium">MockLab v0.1.0 — OpenAPI &amp; GraphQL Mocks</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[var(--ink)] leading-[1.1]">
          Design the API. Mock it in seconds.{" "}
          <span className="text-[var(--signal)]">Prove it in CI.</span>
        </h1>

        <p className="text-base sm:text-lg text-[var(--ink-2)] max-w-2xl mx-auto leading-relaxed">
          Import an OpenAPI spec or GraphQL schema. Get a hosted mock server in seconds with stateful
          buckets, latency, fault injection, and automatic breaking-change contract verification.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/signup"
            className="px-6 py-3 rounded-md bg-[var(--signal)] text-[var(--surface-0)] font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
          >
            <span>Start Free Mock</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-md border border-[var(--border)] bg-[var(--surface-1)] text-[var(--ink)] font-medium text-sm hover:bg-[var(--surface-2)] transition-colors flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 text-[var(--signal)] fill-[var(--signal)]" />
            <span>Try Petstore Demo</span>
          </Link>
        </div>
      </section>

      {/* 2. Live Interactive Playground Hero Card */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] shadow-2xl overflow-hidden">
        {/* Playground Window Bar */}
        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-2)] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/30 border border-red-500/60"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/30 border border-yellow-500/60"></span>
            <span className="w-3 h-3 rounded-full bg-green-500/30 border border-green-500/60"></span>
            <div className="flex items-center gap-1.5 ml-3 px-2 py-0.5 rounded bg-[var(--surface-0)] border border-[var(--border)] text-[var(--ink-2)]">
              <span className="text-[var(--signal)] font-bold">GET</span>
              <span>https://petstore.mocklab.dev/pets/42</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20 font-semibold">
              200 OK
            </span>
            <span className="text-[var(--ink-3)]">42ms · 1.1 KB</span>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="border-b border-[var(--border)] px-4 flex items-center justify-between bg-[var(--surface-1)] text-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab("get")}
              className={`py-2.5 font-medium border-b-2 transition-colors ${
                activeTab === "get"
                  ? "border-[var(--signal)] text-[var(--signal)]"
                  : "border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]"
              }`}
            >
              Response Payload
            </button>
            <button
              onClick={() => setActiveTab("post")}
              className={`py-2.5 font-medium border-b-2 transition-colors ${
                activeTab === "post"
                  ? "border-[var(--signal)] text-[var(--signal)]"
                  : "border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]"
              }`}
            >
              Matched Rule &amp; Spec Validation
            </button>
          </div>

          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] py-1 px-2 rounded hover:bg-[var(--surface-2)] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[var(--signal)]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "cURL Copied" : "Copy as cURL"}</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="p-6 bg-[var(--surface-3)] font-mono text-xs text-[var(--ink)] overflow-x-auto">
          {activeTab === "get" ? (
            <pre className="leading-relaxed">{`{
  "id": 42,
  "name": "Sparky",
  "category": "Canine",
  "status": "available",
  "tags": ["friendly", "vaccinated"],
  "_mocklab": {
    "rule": "Get pet by ID (default example)",
    "scenario": "initial",
    "latency": "42ms"
  }
}`}</pre>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[var(--success)]">
                <Check className="w-4 h-4" />
                <span className="font-semibold">Rule Matched: "Get pet by ID — Success (200)"</span>
              </div>
              <p className="text-[var(--ink-2)]">
                Matched path clause <code className="text-[var(--signal)]">/pets/:id</code> with ID{" "}
                <code className="text-[var(--signal)]">42</code>. Request validated 100% against OpenAPI 3.1
                schema.
              </p>
              <div className="p-3 rounded border border-[var(--border)] bg-[var(--surface-1)] text-[11px] text-[var(--ink-3)]">
                Near-miss diagnostics: 0 conflicts detected. No unhandled required headers.
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. The 3-Step Core Loop */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--ink)]">
            How MockLab Works
          </h2>
          <p className="text-sm text-[var(--ink-2)]">
            The developer loop: consumer expectation → live mock → provider verification → deploy gate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] space-y-3 relative">
            <div className="w-10 h-10 rounded-md bg-[var(--signal-dim)] flex items-center justify-center text-[var(--signal)] font-bold font-mono">
              01
            </div>
            <h3 className="text-base font-semibold text-[var(--ink)]">1. Import Spec</h3>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Paste an OpenAPI 3.0/3.1 or GraphQL schema. Endpoints are instantly generated with schema-backed
              deterministic examples and dereferenced models.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] space-y-3 relative">
            <div className="w-10 h-10 rounded-md bg-[var(--signal-dim)] flex items-center justify-center text-[var(--signal)] font-bold font-mono">
              02
            </div>
            <h3 className="text-base font-semibold text-[var(--ink)]">2. Mock &amp; Mutate</h3>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Edit ordered mock rules with first-match-wins logic. Keep state across requests (POST stores, GET
              retrieves) and inject network latency and chaos faults.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] space-y-3 relative">
            <div className="w-10 h-10 rounded-md bg-[var(--signal-dim)] flex items-center justify-center text-[var(--signal)] font-bold font-mono">
              03
            </div>
            <h3 className="text-base font-semibold text-[var(--ink)]">3. Prove in CI</h3>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Replay consumer contract expectations against your real provider URL. Diffs flag breaking schema
              changes and block failing pull requests in GitHub Actions.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Detailed Feature Grid */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--ink)]">
            Built for High-Velocity Engineering Teams
          </h2>
          <p className="text-sm text-[var(--ink-2)]">
            Everything WireMock, Prism, and Microcks do — unified into one hosted instrument.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="p-5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] space-y-2.5">
            <div className="w-8 h-8 rounded bg-[var(--surface-2)] flex items-center justify-center text-[var(--signal)]">
              <Database className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-[var(--ink)]">Stateful Buckets</h4>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Redis-backed resource persistence. POST creates items with server UUIDs, GET lists or finds them,
              DELETE purges them. Reset state with one click.
            </p>
          </div>

          <div className="p-5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] space-y-2.5">
            <div className="w-8 h-8 rounded bg-[var(--surface-2)] flex items-center justify-center text-[var(--signal)]">
              <Sliders className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-[var(--ink)]">Faults &amp; Latency Injection</h4>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Simulate slow connections, 500 internal errors, malformed JSON, and socket connection resets to
              test resilience before deploying.
            </p>
          </div>

          <div className="p-5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] space-y-2.5">
            <div className="w-8 h-8 rounded bg-[var(--surface-2)] flex items-center justify-center text-[var(--signal)]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-[var(--ink)]">Pact-Lite Contract Diff</h4>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              No complex consumer test frameworks needed. Test expectations automatically compare mock vs real
              payloads and flag removed fields as BREAKING.
            </p>
          </div>

          <div className="p-5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] space-y-2.5">
            <div className="w-8 h-8 rounded bg-[var(--surface-2)] flex items-center justify-center text-[var(--signal)]">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-[var(--ink)]">Near-Miss Diagnostics</h4>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              404 responses never leave you guessing. Unmatched requests show the closest rule candidate and
              exact header or body path that missed.
            </p>
          </div>

          <div className="p-5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] space-y-2.5">
            <div className="w-8 h-8 rounded bg-[var(--surface-2)] flex items-center justify-center text-[var(--signal)]">
              <GitBranch className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-[var(--ink)]">1-Click GitHub Actions CI</h4>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Copy-paste our official Action snippet. Fail CI pull requests automatically when provider changes
              violate frontend expectations.
            </p>
          </div>

          <div className="p-5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] space-y-2.5">
            <div className="w-8 h-8 rounded bg-[var(--surface-2)] flex items-center justify-center text-[var(--signal)]">
              <Terminal className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-[var(--ink)]">Request Playground</h4>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Command-line speed in the browser. Lazy-loaded Monaco editor with schema-aware formatting, method chips, Cmd+Enter
              sending, and Mock vs Real switcher.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Pricing Teaser */}
      <section className="p-8 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-center space-y-4">
        <h3 className="text-xl font-bold text-[var(--ink)]">
          Free Forever for Developers. Generous Limits.
        </h3>
        <p className="text-xs text-[var(--ink-2)] max-w-xl mx-auto">
          5,000 mock requests/mo, 100 contract runs, 14-day logs, and 2 API keys completely free.
          Scale to Pro or Team as your organization grows.
        </p>
        <div className="pt-2">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-[var(--border)] text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <span>View Full Plan Comparison</span>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--signal)]" />
          </Link>
        </div>
      </section>

      {/* 6. Bottom Call to Action */}
      <section className="text-center py-12 space-y-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-8">
        <h2 className="text-3xl font-bold text-[var(--ink)]">
          Ready to mock your first API?
        </h2>
        <p className="text-sm text-[var(--ink-2)] max-w-md mx-auto">
          Import your OpenAPI spec or try the pre-loaded Petstore demo in under 60 seconds.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[var(--signal)] text-[var(--surface-0)] font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <span>Get Started Free</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
