"use client";

import { useState } from "react";
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  AlertTriangle,
  Trash2,
  Ban,
  Clock,
  Gauge,
  Shield,
  CheckCircle2,
  X,
  ExternalLink,
} from "lucide-react";

interface ApiKeyItem {
  id: string;
  name: string;
  prefix: "mk_live_" | "mk_test_";
  last4: string;
  scopes: string[];
  rateLimitPerMin: number;
  monthlyQuota: number;
  revokedAt: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

const INITIAL_KEYS: ApiKeyItem[] = [
  {
    id: "key_1",
    name: "Production Gateway CI",
    prefix: "mk_live_",
    last4: "8fa2",
    scopes: ["mock:read", "mock:write", "tests:run"],
    rateLimitPerMin: 120,
    monthlyQuota: 100000,
    revokedAt: null,
    createdAt: "2026-02-14T10:00:00Z",
    lastUsedAt: "2026-03-12T18:42:10Z",
  },
  {
    id: "key_2",
    name: "Local Development & Testing",
    prefix: "mk_test_",
    last4: "93bc",
    scopes: ["mock:read", "tests:run"],
    rateLimitPerMin: 60,
    monthlyQuota: 10000,
    revokedAt: null,
    createdAt: "2026-02-20T15:20:00Z",
    lastUsedAt: "2026-03-11T09:12:00Z",
  },
  {
    id: "key_3",
    name: "Deprecated Integration Key",
    prefix: "mk_live_",
    last4: "1190",
    scopes: ["mock:read"],
    rateLimitPerMin: 30,
    monthlyQuota: 5000,
    revokedAt: "2026-03-01T12:00:00Z",
    createdAt: "2026-01-10T08:00:00Z",
    lastUsedAt: "2026-02-28T22:15:00Z",
  },
];

export default function WorkspaceKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>(INITIAL_KEYS);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [keyPrefix, setKeyPrefix] = useState<"mk_live_" | "mk_test_">("mk_live_");
  const [rateLimit, setRateLimit] = useState(100);
  const [rawCreatedKey, setRawCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    const randomHex = Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    const generatedRaw = `${keyPrefix}${randomHex}`;
    const last4 = generatedRaw.slice(-4);

    const newKeyRecord: ApiKeyItem = {
      id: `key_${Date.now()}`,
      name: keyName.trim(),
      prefix: keyPrefix,
      last4,
      scopes: ["mock:read", "mock:write", "tests:run"],
      rateLimitPerMin: rateLimit,
      monthlyQuota: 0,
      revokedAt: null,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
    };

    setKeys((prev) => [newKeyRecord, ...prev]);
    setRawCreatedKey(generatedRaw);
    setKeyName("");
  };

  const handleRevoke = (keyId: string) => {
    setKeys((prev) =>
      prev.map((k) =>
        k.id === keyId ? { ...k, revokedAt: new Date().toISOString() } : k
      )
    );
  };

  const handleDelete = (keyId: string) => {
    setKeys((prev) => prev.filter((k) => k.id !== keyId));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-[var(--ink)]">API Keys & Tokens</h1>
            <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--border)] bg-[var(--surface-1)] text-[var(--ink-2)]">
              {keys.filter((k) => !k.revokedAt).length} active
            </span>
          </div>
          <p className="text-xs text-[var(--ink-2)] mt-1">
            Authenticate mock server traffic, run CI contract tests, and manage programmatically with SHA-256 tokens.
          </p>
        </div>

        <button
          onClick={() => {
            setRawCreatedKey(null);
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[var(--signal)] text-[var(--surface-0)] font-medium text-xs hover:opacity-90 transition-opacity self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New API Key</span>
        </button>
      </div>

      {/* Metrics & Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] space-y-2">
          <div className="flex items-center gap-2 text-[var(--signal)]">
            <Shield className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Security Model</span>
          </div>
          <p className="text-xs text-[var(--ink-2)] leading-relaxed">
            Keys are hashed with <span className="font-mono text-[var(--ink)]">SHA-256</span> and never stored in plain text. Only the prefix and last 4 digits remain visible.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] space-y-2">
          <div className="flex items-center gap-2 text-[var(--info)]">
            <Gauge className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Sliding Rate Limiter</span>
          </div>
          <p className="text-xs text-[var(--ink-2)] leading-relaxed">
            Enforced over 60-second sliding windows. Exceeding callers receive <span className="font-mono text-[var(--ink)]">429</span> with an RFC-compliant <span className="font-mono text-[var(--ink)]">Retry-After</span> header.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] space-y-2">
          <div className="flex items-center gap-2 text-[var(--warning)]">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Mock Auth Header</span>
          </div>
          <p className="text-xs text-[var(--ink-2)] leading-relaxed">
            Supply via <span className="font-mono text-[var(--ink)]">X-MockLab-Key</span> or <span className="font-mono text-[var(--ink)]">Authorization: Bearer &lt;key&gt;</span> on private mock endpoints.
          </p>
        </div>
      </div>

      {/* API Keys Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[11px] font-mono text-[var(--ink-3)] uppercase tracking-wider">
                <th className="px-4 py-3">Key Name</th>
                <th className="px-4 py-3">Token Pattern</th>
                <th className="px-4 py-3">Scopes</th>
                <th className="px-4 py-3">Rate Limit</th>
                <th className="px-4 py-3">Last Used</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs">
              {keys.map((key) => {
                const isRevoked = Boolean(key.revokedAt);
                return (
                  <tr
                    key={key.id}
                    className={`transition-colors ${
                      isRevoked
                        ? "opacity-50 bg-[var(--surface-0)]/40"
                        : "hover:bg-[var(--surface-2)]/50"
                    }`}
                  >
                    <td className="px-4 py-3.5 font-medium text-[var(--ink)]">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-3.5 h-3.5 text-[var(--signal)]" />
                        <span>{key.name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px] text-[var(--ink-2)]">
                      <span className="text-[var(--ink-3)]">{key.prefix}</span>
                      <span className="text-[var(--ink-3)]">••••••••</span>
                      <span className="text-[var(--ink)] font-semibold">{key.last4}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {key.scopes.map((s) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--surface-2)] border border-[var(--border)] text-[var(--ink-2)]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-[var(--ink-2)] font-mono text-[11px]">
                      {key.rateLimitPerMin} req/min
                    </td>

                    <td className="px-4 py-3.5 text-[var(--ink-3)] font-mono text-[11px]">
                      {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"}
                    </td>

                    <td className="px-4 py-3.5">
                      {isRevoked ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--error)]/10 text-[var(--error)] border border-[var(--error)]/30">
                          <Ban className="w-3 h-3" />
                          Revoked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isRevoked ? (
                          <button
                            onClick={() => handleRevoke(key.id)}
                            title="Revoke key immediately"
                            className="px-2 py-1 rounded text-[11px] border border-[var(--border)] hover:border-[var(--warning)]/50 text-[var(--warning)] hover:bg-[var(--warning)]/10 transition-colors cursor-pointer"
                          >
                            Revoke
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleDelete(key.id)}
                          title="Delete record"
                          className="p-1 rounded text-[var(--ink-3)] hover:text-[var(--error)] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Key Modal with Show-Once Raw Key Display */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-1)] p-6 space-y-5 shadow-2xl">
            {rawCreatedKey ? (
              // Step 2: Show-Once Modal
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--signal-dim)] text-[var(--signal)] flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[var(--ink)]">API Key Generated</h3>
                    <p className="text-xs text-[var(--ink-3)]">Save this key now — it cannot be recovered</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-[var(--warning)]/40 bg-[var(--warning)]/10 flex items-start gap-2.5 text-xs text-[var(--warning)]">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    Please copy this key and store it in a secure location (e.g. GitHub Secrets or environment variables). MockLab only stores the SHA-256 hash and cannot reveal it again.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[var(--ink-2)]">Your Secret API Key</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={rawCreatedKey}
                      className="w-full px-3 py-2.5 rounded-lg bg-[var(--surface-0)] border border-[var(--signal)]/50 text-xs font-mono text-[var(--signal)] select-all"
                    />
                    <button
                      onClick={() => copyToClipboard(rawCreatedKey)}
                      className="px-3.5 py-2.5 rounded-lg bg-[var(--signal)] text-[var(--surface-0)] text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex justify-end">
                  <button
                    onClick={() => {
                      setIsCreateOpen(false);
                      setRawCreatedKey(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-[var(--surface-2)] text-[var(--ink)] text-xs font-medium hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            ) : (
              // Step 1: Form
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[var(--signal-dim)] text-[var(--signal)] flex items-center justify-center">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-[var(--ink)]">Create API Key</h3>
                      <p className="text-xs text-[var(--ink-3)]">Configure scopes and rate limits</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCreateOpen(false)}
                    className="text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--ink-2)]">Key Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GitHub Actions CI Runner"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--surface-0)] border border-[var(--border)] text-xs text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:border-[var(--signal)]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--ink-2)]">Environment Prefix</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setKeyPrefix("mk_live_")}
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                          keyPrefix === "mk_live_"
                            ? "border-[var(--signal)] bg-[var(--signal-dim)] text-[var(--signal)] font-medium"
                            : "border-[var(--border)] bg-[var(--surface-0)] text-[var(--ink-2)] hover:border-[var(--border-strong)]"
                        }`}
                      >
                        <div className="text-xs font-mono">mk_live_</div>
                        <div className="text-[10px] text-[var(--ink-3)] mt-0.5">Production Mocks</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setKeyPrefix("mk_test_")}
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                          keyPrefix === "mk_test_"
                            ? "border-[var(--signal)] bg-[var(--signal-dim)] text-[var(--signal)] font-medium"
                            : "border-[var(--border)] bg-[var(--surface-0)] text-[var(--ink-2)] hover:border-[var(--border-strong)]"
                        }`}
                      >
                        <div className="text-xs font-mono">mk_test_</div>
                        <div className="text-[10px] text-[var(--ink-3)] mt-0.5">Test & CI Suites</div>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[var(--ink-2)]">Rate Limit</span>
                      <span className="font-mono text-[var(--signal)]">{rateLimit} req/min</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={1000}
                      step={10}
                      value={rateLimit}
                      onChange={(e) => setRateLimit(Number(e.target.value))}
                      className="w-full accent-[var(--signal)] cursor-pointer"
                    />
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2 border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => setIsCreateOpen(false)}
                      className="px-3.5 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--ink-2)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-[var(--signal)] text-[var(--surface-0)] text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Generate Key
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
