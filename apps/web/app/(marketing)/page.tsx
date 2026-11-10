import Link from "next/link";
import { ArrowRight, Terminal, ShieldCheck, Zap, GitBranch } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="py-16 px-8 max-w-6xl mx-auto space-y-20">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface-1)] text-xs text-[var(--signal)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal)] animate-pulse"></span>
          <span>MockLab v0.1.0 Beta — REST &amp; GraphQL Support</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--ink)] leading-tight">
          Design the API. Mock it in seconds. <span className="text-[var(--signal)]">Prove it in CI.</span>
        </h1>
        <p className="text-base text-[var(--ink-2)] max-w-2xl mx-auto">
          Paste an OpenAPI spec or GraphQL schema. Get a hosted mock server instantly with stateful rules,
          fault injection, and automatic breaking-change contract verification.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-md bg-[var(--signal)] text-[var(--surface-0)] font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <span>Try Petstore Demo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/docs"
            className="px-5 py-2.5 rounded-md border border-[var(--border)] text-[var(--ink)] font-medium text-sm hover:bg-[var(--surface-2)] transition-colors"
          >
            Read Docs
          </Link>
        </div>
      </div>

      {/* Hero Live Mock Visual */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] text-xs font-mono text-[var(--ink-3)]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/40"></span>
            <span className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40"></span>
            <span className="ml-2 text-[var(--ink-2)]">https://mocklab.dev/m/petstore/pets/42</span>
          </div>
          <span className="text-[var(--signal)]">200 OK · 42ms</span>
        </div>
        <div className="pt-3 font-mono text-xs text-[var(--ink)] overflow-x-auto">
          <pre>{`{
  "id": 42,
  "name": "Sparky",
  "tag": "dog",
  "status": "available",
  "matchedRule": "Get pet by ID (default)"
}`}</pre>
        </div>
      </div>

      {/* 3 Step Flow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] space-y-2">
          <div className="w-8 h-8 rounded-md bg-[var(--surface-2)] flex items-center justify-center text-[var(--signal)]">
            <Zap className="w-4 h-4" />
          </div>
          <h2 className="text-base font-semibold text-[var(--ink)]">1. Import Spec</h2>
          <p className="text-xs text-[var(--ink-2)]">
            Paste URL or drop OpenAPI / GraphQL schema. Instant endpoint generation with schema-backed mocks.
          </p>
        </div>

        <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] space-y-2">
          <div className="w-8 h-8 rounded-md bg-[var(--surface-2)] flex items-center justify-center text-[var(--signal)]">
            <Terminal className="w-4 h-4" />
          </div>
          <h2 className="text-base font-semibold text-[var(--ink)]">2. Mock &amp; Mutate</h2>
          <p className="text-xs text-[var(--ink-2)]">
            Stateful bucket persistence, custom headers, latency simulation, and fault injection.
          </p>
        </div>

        <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] space-y-2">
          <div className="w-8 h-8 rounded-md bg-[var(--surface-2)] flex items-center justify-center text-[var(--signal)]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h2 className="text-base font-semibold text-[var(--ink)]">3. Prove in CI</h2>
          <p className="text-xs text-[var(--ink-2)]">
            Diff mock vs real provider payloads. Block breaking changes automatically in GitHub Actions.
          </p>
        </div>
      </div>
    </div>
  );
}
