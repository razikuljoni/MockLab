"use client";

import { useState } from "react";
import { Terminal, Copy, Check, BookOpen, Layers, Shield, Clock, Code2 } from "lucide-react";

export default function DocsPage() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const quickstartCurl = `curl -X POST https://api.mocklab.dev/api/v1/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{"email":"dev@company.com","password":"Password123!","workspaceName":"Acme"}'`;

  const ciYaml = `name: MockLab Contract Gate
on: [push, pull_request]

jobs:
  verify-contract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run MockLab Contract Verification
        env:
          MOCKLAB_API_KEY: \${{ secrets.MOCKLAB_API_KEY }}
        run: |
          curl -s -X POST "https://api.mocklab.dev/api/v1/projects/petstore/contract-runs" \\
            -H "Authorization: Bearer $MOCKLAB_API_KEY" \\
            -H "Content-Type: application/json" \\
            --fail-with-body`;

  return (
    <div className="py-12 md:py-16 px-6 max-w-5xl mx-auto space-y-16">
      {/* Docs Header */}
      <div className="space-y-3 border-b border-[var(--border)] pb-8">
        <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--signal)]">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Documentation &amp; Guides</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)]">
          MockLab Developer Guide
        </h1>
        <p className="text-sm text-[var(--ink-2)] max-w-2xl">
          Everything you need to import specs, configure stateful mocks, simulate network faults,
          and assert contract compatibility in CI.
        </p>
      </div>

      {/* Section 1: 5-Minute Quickstart */}
      <section id="quickstart" className="space-y-4">
        <h2 className="text-xl font-bold text-[var(--ink)] flex items-center gap-2">
          <Clock className="w-5 h-5 text-[var(--signal)]" />
          <span>1. 5-Minute Quickstart (F1)</span>
        </h2>
        <p className="text-xs text-[var(--ink-2)] leading-relaxed">
          Follow these three steps to go from zero to a live, hosted mock endpoint in under 60 seconds:
        </p>

        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] space-y-2">
            <h3 className="font-semibold text-[var(--ink)]">Step 1: Sign up and create a workspace</h3>
            <p className="text-[var(--ink-2)]">
              Sign up with email and password at <code className="text-[var(--signal)]">/signup</code>. Your
              workspace is created automatically and pre-seeded with the Petstore demo project.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] space-y-2">
            <h3 className="font-semibold text-[var(--ink)]">Step 2: Inspect the mock endpoint</h3>
            <p className="text-[var(--ink-2)]">
              Every project receives a dedicated base URL: <code className="text-[var(--signal)]">https://&lt;slug&gt;.mocklab.dev</code>.
              Send your first request from terminal or the browser:
            </p>
            <div className="relative rounded bg-[var(--surface-3)] p-3 font-mono text-[11px] text-[var(--ink)]">
              <code>curl -i https://petstore.mocklab.dev/pets/42</code>
              <button
                onClick={() => copyCode("curl -i https://petstore.mocklab.dev/pets/42", 1)}
                className="absolute top-2 right-2 p-1 rounded hover:bg-[var(--surface-2)] text-[var(--ink-3)]"
              >
                {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-[var(--signal)]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] space-y-2">
            <h3 className="font-semibold text-[var(--ink)]">Step 3: Poke it in the Playground</h3>
            <p className="text-[var(--ink-2)]">
              Navigate to <code className="text-[var(--signal)]">/projects/petstore/playground</code>. Send requests,
              switch between Mock and Real mode, and view response headers like <code className="text-[var(--signal)]">X-MockLab-Rule</code>.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Importing Specs */}
      <section id="importing" className="space-y-4">
        <h2 className="text-xl font-bold text-[var(--ink)] flex items-center gap-2">
          <Layers className="w-5 h-5 text-[var(--signal)]" />
          <span>2. Importing OpenAPI &amp; GraphQL Specs</span>
        </h2>
        <p className="text-xs text-[var(--ink-2)] leading-relaxed">
          MockLab accepts OpenAPI 3.0, 3.1 (JSON or YAML) and GraphQL schemas via public URL, file upload,
          or pasted text.
        </p>

        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] space-y-3 text-xs">
          <h3 className="font-semibold text-[var(--ink)]">Resolution &amp; Dereferencing</h3>
          <p className="text-[var(--ink-2)]">
            All internal <code className="text-[var(--signal)]">$ref</code> pointers are recursively dereferenced using
            <code className="text-[var(--ink)]"> @readme/openapi-parser</code>. Validation errors are reported with exact
            JSONPath locations (e.g. <code className="text-[var(--danger)]">$.paths['/pets'].get.responses['200']</code>).
          </p>
          <div className="p-3 rounded bg-[var(--surface-2)] text-[11px] text-[var(--ink-3)]">
            Note: On re-importing a changed spec, MockLab shows a diff preview. Hand-edited rules are preserved and flagged
            with conflict indicators, while auto-generated rules update smoothly.
          </div>
        </div>
      </section>

      {/* Section 3: Mock Rules & Priority */}
      <section id="rules" className="space-y-4">
        <h2 className="text-xl font-bold text-[var(--ink)] flex items-center gap-2">
          <Terminal className="w-5 h-5 text-[var(--signal)]" />
          <span>3. Mock Rules &amp; First-Match-Wins Priority</span>
        </h2>
        <p className="text-xs text-[var(--ink-2)] leading-relaxed">
          Mock rules are evaluated sequentially in priority order. The first rule whose matcher clauses all evaluate
          to true determines the HTTP response.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] space-y-2">
            <h3 className="font-semibold text-[var(--ink)]">Matcher Clauses</h3>
            <ul className="space-y-1 text-[var(--ink-2)] list-disc list-inside">
              <li>HTTP Method &amp; Path matching</li>
              <li>Query parameter presence &amp; values</li>
              <li>Header validation (e.g. <code className="text-[var(--signal)]">X-User-Role: admin</code>)</li>
              <li>JSONPath body inspection (<code className="text-[var(--signal)]">$.order.total &gt; 100</code>)</li>
              <li>Request count (e.g. fail on 3rd attempt)</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] space-y-2">
            <h3 className="font-semibold text-[var(--ink)]">Response Customization</h3>
            <ul className="space-y-1 text-[var(--ink-2)] list-disc list-inside">
              <li>Configurable status code (200, 201, 404, 500)</li>
              <li>Handlebars templating (<code className="text-[var(--signal)]">{"{{body.name}}"}</code>, <code className="text-[var(--signal)]">{"{{uuid}}"}</code>)</li>
              <li>Latency simulation (0 to 5,000 ms)</li>
              <li>Fault injection (malformed-json, connection-reset, timeout)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 4: CI & Contract Testing */}
      <section id="ci" className="space-y-4">
        <h2 className="text-xl font-bold text-[var(--ink)] flex items-center gap-2">
          <Shield className="w-5 h-5 text-[var(--signal)]" />
          <span>4. GitHub Actions CI Integration</span>
        </h2>
        <p className="text-xs text-[var(--ink-2)] leading-relaxed">
          Prevent breaking API changes from landing in production. Add this snippet to your repository under
          <code className="text-[var(--signal)]"> .github/workflows/mocklab-contract.yml</code>:
        </p>

        <div className="relative rounded-lg border border-[var(--border)] bg-[var(--surface-3)] p-4 font-mono text-xs text-[var(--ink)] overflow-x-auto">
          <pre>{ciYaml}</pre>
          <button
            onClick={() => copyCode(ciYaml, 2)}
            className="absolute top-3 right-3 p-1.5 rounded bg-[var(--surface-2)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
          >
            {copiedIndex === 2 ? <Check className="w-4 h-4 text-[var(--signal)]" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </section>

      {/* Section 5: API Rate Limits */}
      <section id="limits" className="space-y-4">
        <h2 className="text-xl font-bold text-[var(--ink)] flex items-center gap-2">
          <Code2 className="w-5 h-5 text-[var(--signal)]" />
          <span>5. Rate Limits &amp; Response Headers</span>
        </h2>
        <p className="text-xs text-[var(--ink-2)] leading-relaxed">
          Every mock response carries headers detailing the matched rule and real-time quota status:
        </p>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4 font-mono text-xs space-y-1.5 text-[var(--ink-2)]">
          <div><span className="text-[var(--signal)]">X-MockLab-Rule:</span> Get pet by ID (default example)</div>
          <div><span className="text-[var(--signal)]">X-RateLimit-Limit:</span> 100</div>
          <div><span className="text-[var(--signal)]">X-RateLimit-Remaining:</span> 98</div>
          <div><span className="text-[var(--signal)]">X-RateLimit-Reset:</span> 1731283200</div>
        </div>
      </section>
    </div>
  );
}
