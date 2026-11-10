import Link from "next/link";
import { Terminal, Copy } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="py-12 px-8 max-w-4xl mx-auto space-y-10">
      <div className="space-y-2 border-b border-[var(--border)] pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">MockLab Documentation</h1>
        <p className="text-sm text-[var(--ink-2)]">
          Fast-track guide to instant API mocking, stateful rules, and CI contract testing.
        </p>
      </div>

      {/* Quickstart 5 min */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[var(--ink)] flex items-center gap-2">
          <Terminal className="w-5 h-5 text-[var(--signal)]" />
          <span>Quickstart (First Mock in 60 Seconds)</span>
        </h2>
        <p className="text-xs text-[var(--ink-2)]">
          MockLab turns an OpenAPI 3.0/3.1 spec or GraphQL SDL schema into a live, interactive mock endpoint.
        </p>

        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-[var(--surface-1)] border border-[var(--border)] space-y-2">
            <span className="text-[11px] font-mono text-[var(--signal)] font-bold">1. Import Spec</span>
            <p className="text-xs text-[var(--ink-2)]">
              Navigate to <Link href="/projects/petstore/import" className="text-[var(--signal)] hover:underline">Import Spec</Link> and paste your OpenAPI URL or raw JSON/YAML content.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[var(--surface-1)] border border-[var(--border)] space-y-2">
            <span className="text-[11px] font-mono text-[var(--signal)] font-bold">2. Test Mock URL</span>
            <p className="text-xs text-[var(--ink-2)]">
              Your mock server responds instantly under your project prefix:
            </p>
            <div className="p-3 rounded-md bg-[var(--surface-3)] border border-[var(--border)] flex items-center justify-between font-mono text-xs text-[var(--ink)]">
              <code>curl https://mocklab.dev/m/petstore/pets</code>
              <button className="text-[var(--ink-3)] hover:text-[var(--ink)]">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[var(--surface-1)] border border-[var(--border)] space-y-2">
            <span className="text-[11px] font-mono text-[var(--signal)] font-bold">3. Verify in CI</span>
            <p className="text-xs text-[var(--ink-2)]">
              Add the MockLab GitHub Action to your repository to verify that real provider implementations don&apos;t break API consumer contracts.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
