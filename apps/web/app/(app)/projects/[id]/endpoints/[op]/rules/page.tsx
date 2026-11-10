"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Sliders,
  Plus,
  Trash2,
  Copy,
  Check,
  ArrowLeft,
  GripVertical,
  Play,
  Sparkles,
  AlertTriangle,
  Clock,
  Zap,
  Info,
} from "lucide-react";

interface RuleItem {
  id: string;
  name: string;
  priority: number;
  enabled: boolean;
  matcher: {
    field: string;
    operator: string;
    value: string;
  };
  response: {
    status: number;
    latencyMs: number;
    fault: string;
    body: string;
  };
  hitCount: number;
}

export default function RulesEditorPage() {
  const params = useParams();
  const projectId = (params?.id as string) || "petstore";
  const op = (params?.op as string) || "users";

  const [rules, setRules] = useState<RuleItem[]>([
    {
      id: "r1",
      name: "Simulated Payment Outage (Fault)",
      priority: 1,
      enabled: true,
      matcher: { field: "header.X-Fail", operator: "equals", value: "true" },
      response: {
        status: 500,
        latencyMs: 800,
        fault: "none",
        body: `{\n  "error": "Internal Server Error",\n  "message": "Simulated chaos fault injected"\n}`,
      },
      hitCount: 142,
    },
    {
      id: "r2",
      name: "Dynamic User Greeting (Template)",
      priority: 2,
      enabled: true,
      matcher: { field: "query.mode", operator: "equals", value: "vip" },
      response: {
        status: 200,
        latencyMs: 40,
        fault: "none",
        body: `{\n  "id": "{{uuid}}",\n  "greeting": "Welcome VIP customer {{query.name}}!",\n  "timestamp": "{{now}}"\n}`,
      },
      hitCount: 520,
    },
    {
      id: "r3",
      name: "Default Petstore Example",
      priority: 3,
      enabled: true,
      matcher: { field: "method", operator: "equals", value: "GET" },
      response: {
        status: 200,
        latencyMs: 25,
        fault: "none",
        body: `{\n  "id": 42,\n  "name": "Sparky",\n  "status": "available"\n}`,
      },
      hitCount: 22400,
    },
  ]);

  const [selectedRuleId, setSelectedRuleId] = useState<string>("r1");
  const selectedRule = rules.find((r) => r.id === selectedRuleId) || rules[0];

  // Test mini-playground state
  const [testHeader, setTestHeader] = useState("true");
  const [testResult, setTestResult] = useState<{ matched: boolean; reason: string } | null>(null);

  // Drag-reorder helper (simulated with up/down arrows)
  const moveRule = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= rules.length) return;

    const copy = [...rules];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    // re-assign priorities
    copy.forEach((r, idx) => {
      r.priority = idx + 1;
    });
    setRules(copy);
  };

  const handleDuplicate = () => {
    const newRule: RuleItem = {
      ...selectedRule,
      id: `r_${Date.now()}`,
      name: `${selectedRule.name} (Copy)`,
      priority: rules.length + 1,
      hitCount: 0,
    };
    setRules([...rules, newRule]);
    setSelectedRuleId(newRule.id);
  };

  const handleDelete = () => {
    if (rules.length <= 1) return;
    const remaining = rules.filter((r) => r.id !== selectedRuleId);
    remaining.forEach((r, idx) => {
      r.priority = idx + 1;
    });
    setRules(remaining);
    setSelectedRuleId(remaining[0].id);
  };

  const runTestMiniPlayground = () => {
    if (testHeader === selectedRule.matcher.value) {
      setTestResult({
        matched: true,
        reason: `Matched clause: ${selectedRule.matcher.field} = ${testHeader}`,
      });
    } else {
      setTestResult({
        matched: false,
        reason: `Value mismatch: expected '${selectedRule.matcher.value}', received '${testHeader}'`,
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/projects/${projectId}/endpoints`}
              className="text-xs text-[var(--ink-2)] hover:text-[var(--ink)] flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Endpoints /</span>
            </Link>
            <h1 className="text-xl font-bold text-[var(--ink)]">
              Rules Editor — <code className="text-[var(--signal)]">GET /{op}</code>
            </h1>
          </div>
          <p className="text-xs text-[var(--ink-2)]">
            Ordered mock rules. Rules evaluate from top to bottom:{" "}
            <strong className="text-[var(--signal)]">First match wins</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const newRule: RuleItem = {
                id: `r_${Date.now()}`,
                name: "New Custom Rule",
                priority: rules.length + 1,
                enabled: true,
                matcher: { field: "header.X-Custom", operator: "equals", value: "active" },
                response: { status: 200, latencyMs: 0, fault: "none", body: `{\n  "success": true\n}` },
                hitCount: 0,
              };
              setRules([...rules, newRule]);
              setSelectedRuleId(newRule.id);
            }}
            className="px-3.5 py-1.5 rounded-md bg-[var(--signal)] text-[var(--surface-0)] font-semibold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Rule</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: Rule List (Left) & Rule Editor Drawer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Ordered Draggable Rule List (§2.1 Screen 11) */}
        <div className="lg:col-span-5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)] text-xs text-[var(--ink-3)] font-mono">
            <span>PRIORITY ORDER (FIRST MATCH WINS)</span>
            <span>{rules.length} RULES</span>
          </div>

          <div className="space-y-2">
            {rules.map((rule, idx) => (
              <div
                key={rule.id}
                onClick={() => setSelectedRuleId(rule.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedRuleId === rule.id
                    ? "border-[var(--signal)] bg-[var(--signal-dim)]"
                    : "border-[var(--border)] bg-[var(--surface-0)] hover:border-[var(--border-strong)]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded bg-[var(--surface-2)] flex items-center justify-center font-mono font-bold text-xs text-[var(--signal)] shrink-0">
                      {rule.priority}
                    </span>
                    <div className="space-y-1">
                      <span className="font-semibold text-xs text-[var(--ink)] block">
                        {rule.name}
                      </span>
                      <div className="text-[11px] font-mono text-[var(--ink-2)] truncate max-w-[200px]">
                        if {rule.matcher.field} = {rule.matcher.value}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                        rule.response.status < 400
                          ? "bg-[var(--success)]/10 text-[var(--success)]"
                          : "bg-[var(--danger)]/10 text-[var(--danger)]"
                      }`}
                    >
                      {rule.response.status} · {rule.response.latencyMs}ms
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveRule(idx, "up");
                        }}
                        disabled={idx === 0}
                        className="p-1 hover:text-[var(--signal)] disabled:opacity-30 text-xs"
                      >
                        ↑
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveRule(idx, "down");
                        }}
                        disabled={idx === rules.length - 1}
                        className="p-1 hover:text-[var(--signal)] disabled:opacity-30 text-xs"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Rule Detail & Response Editor Drawer */}
        <div className="lg:col-span-7 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--ink)]">
                Editing Rule #{selectedRule.priority}
              </h2>
              <p className="text-xs text-[var(--ink-3)]">Configure match conditions and simulated payload</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDuplicate}
                className="px-2.5 py-1 rounded bg-[var(--surface-2)] text-[var(--ink-2)] hover:text-[var(--ink)] text-xs border border-[var(--border)] flex items-center gap-1"
                title="Duplicate this rule"
              >
                <Copy className="w-3 h-3" />
                <span>Duplicate</span>
              </button>
              <button
                onClick={handleDelete}
                className="px-2.5 py-1 rounded bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20 text-xs border border-[var(--danger)]/20 flex items-center gap-1"
                title="Delete rule"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* 1. Rule Name & Enable Toggle */}
          <div className="space-y-3 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-[var(--ink)]">Rule Name</label>
              <input
                type="text"
                value={selectedRule.name}
                onChange={(e) => {
                  const updated = rules.map((r) =>
                    r.id === selectedRule.id ? { ...r, name: e.target.value } : r
                  );
                  setRules(updated);
                }}
                className="w-full px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-0)] text-[var(--ink)] focus:outline-none focus:border-[var(--signal)]"
              />
            </div>
          </div>

          {/* 2. Matcher Clause Builder (§6.3) */}
          <div className="space-y-3 text-xs border-t border-[var(--border)] pt-4">
            <h3 className="font-semibold text-[var(--ink)]">Match Condition (When request matches...)</h3>
            <div className="grid grid-cols-3 gap-2 font-mono">
              <input
                type="text"
                value={selectedRule.matcher.field}
                onChange={(e) => {
                  const updated = rules.map((r) =>
                    r.id === selectedRule.id
                      ? { ...r, matcher: { ...r.matcher, field: e.target.value } }
                      : r
                  );
                  setRules(updated);
                }}
                placeholder="header.X-Fail"
                className="px-2.5 py-1.5 rounded bg-[var(--surface-0)] border border-[var(--border)] text-[var(--ink)]"
              />
              <select
                value={selectedRule.matcher.operator}
                className="px-2.5 py-1.5 rounded bg-[var(--surface-0)] border border-[var(--border)] text-[var(--ink)]"
              >
                <option value="equals">equals</option>
                <option value="contains">contains</option>
                <option value="regex">matches regex</option>
              </select>
              <input
                type="text"
                value={selectedRule.matcher.value}
                onChange={(e) => {
                  const updated = rules.map((r) =>
                    r.id === selectedRule.id
                      ? { ...r, matcher: { ...r.matcher, value: e.target.value } }
                      : r
                  );
                  setRules(updated);
                }}
                placeholder="true"
                className="px-2.5 py-1.5 rounded bg-[var(--surface-0)] border border-[var(--border)] text-[var(--ink)]"
              />
            </div>
          </div>

          {/* 3. Response Status, Latency & Faults */}
          <div className="grid grid-cols-3 gap-3 text-xs border-t border-[var(--border)] pt-4">
            <div className="space-y-1.5">
              <label className="font-medium text-[var(--ink)]">Status Code</label>
              <select
                value={selectedRule.response.status}
                onChange={(e) => {
                  const updated = rules.map((r) =>
                    r.id === selectedRule.id
                      ? { ...r, response: { ...r.response, status: Number(e.target.value) } }
                      : r
                  );
                  setRules(updated);
                }}
                className="w-full px-2.5 py-1.5 rounded bg-[var(--surface-0)] border border-[var(--border)] text-[var(--ink)] font-mono font-bold"
              >
                <option value={200}>200 OK</option>
                <option value={201}>201 Created</option>
                <option value={400}>400 Bad Request</option>
                <option value={404}>404 Not Found</option>
                <option value={500}>500 Server Error</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[var(--ink)]">Injected Delay</label>
              <div className="flex items-center gap-1 font-mono">
                <input
                  type="number"
                  min={0}
                  max={5000}
                  step={50}
                  value={selectedRule.response.latencyMs}
                  onChange={(e) => {
                    const updated = rules.map((r) =>
                      r.id === selectedRule.id
                        ? { ...r, response: { ...r.response, latencyMs: Number(e.target.value) } }
                        : r
                    );
                    setRules(updated);
                  }}
                  className="w-full px-2.5 py-1.5 rounded bg-[var(--surface-0)] border border-[var(--border)] text-[var(--ink)]"
                />
                <span className="text-[var(--ink-3)] text-[10px]">ms</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[var(--ink)]">Fault Injection</label>
              <select
                value={selectedRule.response.fault}
                onChange={(e) => {
                  const updated = rules.map((r) =>
                    r.id === selectedRule.id
                      ? { ...r, response: { ...r.response, fault: e.target.value } }
                      : r
                  );
                  setRules(updated);
                }}
                className="w-full px-2.5 py-1.5 rounded bg-[var(--surface-0)] border border-[var(--border)] text-[var(--ink)]"
              >
                <option value="none">None (Standard)</option>
                <option value="empty-body">Empty Body</option>
                <option value="malformed-json">Malformed JSON</option>
                <option value="connection-reset">Connection Reset</option>
                <option value="timeout">30s Timeout</option>
              </select>
            </div>
          </div>

          {/* 4. Response Body & Templating Cheat-Sheet */}
          <div className="space-y-2 text-xs border-t border-[var(--border)] pt-4">
            <div className="flex items-center justify-between">
              <label className="font-medium text-[var(--ink)]">Response Body (JSON + Templates)</label>
              <span className="text-[10px] text-[var(--signal)] font-mono">
                Tags: {"{{uuid}}"} · {"{{now}}"} · {"{{body.name}}"}
              </span>
            </div>
            <textarea
              rows={6}
              value={selectedRule.response.body}
              onChange={(e) => {
                const updated = rules.map((r) =>
                  r.id === selectedRule.id
                    ? { ...r, response: { ...r.response, body: e.target.value } }
                    : r
                );
                setRules(updated);
              }}
              className="w-full p-3 rounded-md border border-[var(--border)] bg-[var(--surface-3)] font-mono text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--signal)]"
            />
          </div>

          {/* 5. "Test This Rule" Mini-Playground (§6.3) */}
          <div className="p-4 rounded-lg bg-[var(--surface-0)] border border-[var(--border)] space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[var(--ink)] flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-[var(--signal)] fill-[var(--signal)]" />
                <span>Test This Rule Sandbox</span>
              </span>
              <button
                type="button"
                onClick={runTestMiniPlayground}
                className="px-3 py-1 rounded bg-[var(--signal)] text-[var(--surface-0)] font-semibold text-[11px]"
              >
                Simulate Match
              </button>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-[var(--ink-3)]">{selectedRule.matcher.field} =</span>
              <input
                type="text"
                value={testHeader}
                onChange={(e) => setTestHeader(e.target.value)}
                placeholder="test value"
                className="px-2 py-1 rounded bg-[var(--surface-1)] border border-[var(--border)] text-[var(--ink)]"
              />
            </div>

            {testResult && (
              <div
                className={`p-2.5 rounded text-[11px] font-mono flex items-center gap-2 ${
                  testResult.matched
                    ? "bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20"
                    : "bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20"
                }`}
              >
                {testResult.matched ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                <span>
                  {testResult.matched ? "MATCH CONFIRMED" : "NO MATCH"}: {testResult.reason}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
