"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import {
  GitBranch,
  Copy,
  Check,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Code,
  Layers,
  Sparkles,
} from "lucide-react";

export default function CiIntegrationPage() {
  const params = useParams();
  const projectId = (params?.id as string) || "petstore";

  const [activeTab, setActiveTab] = useState<"github" | "gitlab" | "curl">("github");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const githubActionsYaml = `name: MockLab Contract Verification
on:
  push:
    branches: [main, master, staging]
  pull_request:
    branches: [main, master]

jobs:
  contract-test:
    name: Verify Contract Integrity
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Run MockLab Contract Verification
        id: mocklab
        run: |
          echo "Triggering contract run against project: ${projectId}..."
          RESPONSE=$(curl -s -X POST "https://mocklab.dev/api/v1/projects/${projectId}/contract-runs" \\
            -H "Authorization: Bearer \${{ secrets.MOCKLAB_API_KEY }}" \\
            -H "Content-Type: application/json" \\
            -d '{"triggeredBy": "github-actions:\${{ github.sha }}"}')
          
          echo "$RESPONSE"
          STATUS=$(echo "$RESPONSE" | jq -r '.status')
          
          if [ "$STATUS" = "FAIL_BREAKING" ]; then
            echo "::error::Breaking API contract drift detected by MockLab!"
            exit 1
          fi
          
          echo "Contract verification passed successfully."
`;

  const gitlabCiYaml = `stages:
  - test

mocklab_contract_test:
  stage: test
  image: curlimages/curl:latest
  script:
    - |
      RESPONSE=$(curl -s -X POST "https://mocklab.dev/api/v1/projects/${projectId}/contract-runs" \\
        -H "Authorization: Bearer \${MOCKLAB_API_KEY}" \\
        -H "Content-Type: application/json")
      echo "$RESPONSE"
      if echo "$RESPONSE" | grep -q '"status":"FAIL_BREAKING"'; then
        echo "Breaking contract drift detected!"
        exit 1
      fi
  only:
    - main
    - merge_requests
`;

  const genericCurl = `curl -X POST "https://mocklab.dev/api/v1/projects/${projectId}/contract-runs" \\
  -H "Authorization: Bearer $MOCKLAB_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"triggeredBy": "cli:script"}'
`;

  const badgeMarkdown = `[![MockLab contract](https://mocklab.dev/api/v1/projects/${projectId}/badge)](https://mocklab.dev/projects/${projectId})`;

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
              <span className="text-[#BFFF3C] font-mono">CI / CD Integration</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-[#BFFF3C]" />
                CI / CD Contract Verification Gate
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Deploy Gate Ready
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Setup Steps Banner (§6.8) */}
        <section className="bg-[#16190B] border border-[#282F14] rounded-lg p-5">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#BFFF3C] mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            3-Step Deploy Gate Setup (§6.8)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-[#101208] border border-[#282F14]">
              <div className="font-mono text-[#BFFF3C] font-bold mb-1">STEP 1</div>
              <div className="font-semibold text-white mb-1">Create API Key</div>
              <p className="text-[#A1A78E] leading-relaxed">
                Generate a scoped key in <Link href="/workspace/keys" className="text-[#BFFF3C] hover:underline">API Keys</Link> with <code className="text-white">tests:run</code> scope.
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-[#101208] border border-[#282F14]">
              <div className="font-mono text-[#BFFF3C] font-bold mb-1">STEP 2</div>
              <div className="font-semibold text-white mb-1">Add Secret to GitHub</div>
              <p className="text-[#A1A78E] leading-relaxed">
                Add secret <code className="text-white font-mono">MOCKLAB_API_KEY</code> in repository settings under Secrets & Variables.
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-[#101208] border border-[#282F14]">
              <div className="font-mono text-[#BFFF3C] font-bold mb-1">STEP 3</div>
              <div className="font-semibold text-white mb-1">Paste Workflow YAML</div>
              <p className="text-[#A1A78E] leading-relaxed">
                Commit <code className="text-white font-mono">.github/workflows/mocklab.yml</code>. PRs will block if breaking changes occur!
              </p>
            </div>
          </div>
        </section>

        {/* Code Snippet Box */}
        <section className="bg-[#16190B] border border-[#282F14] rounded-lg overflow-hidden">
          {/* Tab Selection */}
          <div className="p-3 border-b border-[#282F14] bg-[#101208] flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                onClick={() => setActiveTab("github")}
                className={`px-3 py-1.5 rounded transition-colors ${
                  activeTab === "github"
                    ? "bg-[#BFFF3C] text-[#101208] font-bold"
                    : "text-[#A1A78E] hover:text-white"
                }`}
              >
                GitHub Actions (.github/workflows/mocklab.yml)
              </button>
              <button
                onClick={() => setActiveTab("gitlab")}
                className={`px-3 py-1.5 rounded transition-colors ${
                  activeTab === "gitlab"
                    ? "bg-[#BFFF3C] text-[#101208] font-bold"
                    : "text-[#A1A78E] hover:text-white"
                }`}
              >
                GitLab CI (.gitlab-ci.yml)
              </button>
              <button
                onClick={() => setActiveTab("curl")}
                className={`px-3 py-1.5 rounded transition-colors ${
                  activeTab === "curl"
                    ? "bg-[#BFFF3C] text-[#101208] font-bold"
                    : "text-[#A1A78E] hover:text-white"
                }`}
              >
                Generic cURL
              </button>
            </div>

            <button
              onClick={() =>
                handleCopy(
                  activeTab === "github"
                    ? githubActionsYaml
                    : activeTab === "gitlab"
                    ? gitlabCiYaml
                    : genericCurl,
                  "workflow-code"
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono bg-[#1D220E] text-white hover:bg-[#282F14] border border-[#282F14] transition-colors"
            >
              {copiedKey === "workflow-code" ? <Check className="w-3.5 h-3.5 text-[#BFFF3C]" /> : <Copy className="w-3.5 h-3.5" />}
              Copy Snippet
            </button>
          </div>

          <pre className="p-4 text-xs font-mono text-white leading-relaxed overflow-x-auto bg-[#101208]">
            {activeTab === "github"
              ? githubActionsYaml
              : activeTab === "gitlab"
              ? gitlabCiYaml
              : genericCurl}
          </pre>
        </section>

        {/* README Badge Card (§6.8) */}
        <section className="bg-[#16190B] border border-[#282F14] rounded-lg p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider mb-1">
                Live README Status Badge
              </h3>
              <p className="text-xs text-[#A1A78E]">
                Display real-time contract passing/failing status directly in your repository README.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-[#101208] border border-[#282F14] p-2.5 rounded-lg">
              <span className="text-xs font-mono text-[#A1A78E]">Live Badge:</span>
              <div className="inline-flex items-center rounded overflow-hidden text-[11px] font-mono font-bold">
                <span className="bg-[#1e293b] text-white px-2 py-0.5">contract</span>
                <span className="bg-[#ef4444] text-white px-2 py-0.5">failing</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#282F14] flex items-center justify-between gap-3">
            <code className="text-xs font-mono text-[#BFFF3C] bg-[#101208] p-2 rounded border border-[#282F14] flex-1 overflow-x-auto">
              {badgeMarkdown}
            </code>
            <button
              onClick={() => handleCopy(badgeMarkdown, "badge-md")}
              className="px-3 py-2 rounded text-xs font-mono bg-[#1D220E] text-white hover:bg-[#282F14] border border-[#282F14] flex items-center gap-1.5 whitespace-nowrap"
            >
              {copiedKey === "badge-md" ? <Check className="w-3.5 h-3.5 text-[#BFFF3C]" /> : <Copy className="w-3.5 h-3.5" />}
              Copy Markdown
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
