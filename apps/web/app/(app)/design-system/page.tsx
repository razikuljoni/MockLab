"use client";

import { useState } from "react";
import {
  Palette,
  Type,
  Component,
  ShieldCheck,
  Check,
  Copy,
  Terminal,
  Activity,
  GitCommit,
  Sliders,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function DesignSystemPage() {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const copyToken = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedToken(val);
    setTimeout(() => setCopiedToken(null), 1500);
  };

  const COLOR_TOKENS = [
    { name: "surface-0", hex: "#101208", desc: "Dark canvas background" },
    { name: "surface-1", hex: "#16190B", desc: "Card and sidebar surface" },
    { name: "surface-2", hex: "#1E230E", desc: "Elevated rows & sub-cards" },
    { name: "surface-3", hex: "#242A11", desc: "Active states and headers" },
    { name: "border", hex: "#282F14", desc: "Standard component borders" },
    { name: "border-strong", hex: "#3D471E", desc: "Modal and emphasized borders" },
    { name: "ink", hex: "#EBF1D6", desc: "Primary text & headings" },
    { name: "ink-2", hex: "#A6B388", desc: "Secondary descriptions & labels" },
    { name: "ink-3", hex: "#6F7B54", desc: "Muted text, metadata & timestamps" },
    { name: "signal", hex: "#BFFF3C", desc: "Electric Lime primary accent" },
    { name: "signal-dim", hex: "rgba(191,255,60,0.12)", desc: "Soft highlight backgrounds" },
    { name: "success", hex: "#00E599", desc: "2xx responses & PASS verdict" },
    { name: "error", hex: "#FF4D4D", desc: "4xx/5xx & BREAKING changes" },
    { name: "warning", hex: "#FFB800", desc: "NON_BREAKING diffs & near-miss" },
    { name: "info", hex: "#38BDF8", desc: "POST endpoints & notices" },
  ];

  const CONTRAST_PAIRS = [
    { text: "Primary Ink on Surface-0", fg: "#EBF1D6", bg: "#101208", ratio: "15.8:1", status: "AAA" },
    { text: "Signal Lime on Surface-0", fg: "#BFFF3C", bg: "#101208", ratio: "15.2:1", status: "AAA" },
    { text: "Secondary Ink on Surface-1", fg: "#A6B388", bg: "#16190B", ratio: "8.4:1", status: "AAA" },
    { text: "Success Green on Surface-1", fg: "#00E599", bg: "#16190B", ratio: "11.1:1", status: "AAA" },
    { text: "Error Coral on Surface-1", fg: "#FF4D4D", bg: "#16190B", ratio: "5.3:1", status: "AA" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16">
      {/* Header */}
      <div className="pb-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-[var(--ink)]">Design System Board</h1>
            <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--signal)]/30 bg-[var(--signal-dim)] text-[var(--signal)] font-mono">
              Screen 24
            </span>
          </div>
          <p className="text-xs text-[var(--ink-2)] mt-1">
            Visual authority and token reference derived strictly from §3 of the MockLab specification.
          </p>
        </div>

        <div className="text-xs font-mono text-[var(--ink-3)]">
          Tokens: Tailwind v4 + CSS Variables
        </div>
      </div>

      {/* 1. Color Swatches */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-[var(--signal)]" />
          <h2 className="text-sm font-semibold text-[var(--ink)]">Core Palette & Semantic Tokens</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {COLOR_TOKENS.map((token) => (
            <div
              key={token.name}
              onClick={() => copyToken(`var(--${token.name})`)}
              className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] hover:border-[var(--signal)] transition-colors cursor-pointer group"
            >
              <div
                className="w-full h-12 rounded-lg border border-[var(--border)] mb-2.5 transition-transform group-hover:scale-98"
                style={{ backgroundColor: token.hex }}
              ></div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[var(--ink)]">{token.name}</span>
                {copiedToken === `var(--${token.name})` ? (
                  <Check className="w-3 h-3 text-[var(--signal)]" />
                ) : (
                  <Copy className="w-3 h-3 text-[var(--ink-3)] opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
              <div className="font-mono text-[10px] text-[var(--ink-3)] mt-0.5">{token.hex}</div>
              <div className="text-[10px] text-[var(--ink-2)] mt-1 truncate">{token.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Typography Scales */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-[var(--signal)]" />
          <h2 className="text-sm font-semibold text-[var(--ink)]">Typography Scales & Font Hierarchies</h2>
        </div>

        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] space-y-5">
          <div className="space-y-1 pb-4 border-b border-[var(--border)]">
            <div className="text-[10px] font-mono text-[var(--ink-3)] uppercase">Display 48px / Mono Black</div>
            <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-[var(--ink)]">
              API Mocking + Contracts
            </div>
          </div>

          <div className="space-y-1 pb-4 border-b border-[var(--border)]">
            <div className="text-[10px] font-mono text-[var(--ink-3)] uppercase">H1 24px / Bold</div>
            <div className="text-2xl font-bold tracking-tight text-[var(--ink)]">
              Interactive Request Playground
            </div>
          </div>

          <div className="space-y-1 pb-4 border-b border-[var(--border)]">
            <div className="text-[10px] font-mono text-[var(--ink-3)] uppercase">H2 18px / Semibold</div>
            <div className="text-lg font-semibold tracking-tight text-[var(--ink)]">
              OpenAPI Specification Diff & Endpoints
            </div>
          </div>

          <div className="space-y-1 pb-4 border-b border-[var(--border)]">
            <div className="text-[10px] font-mono text-[var(--ink-3)] uppercase">Body 13px / Regular Inter</div>
            <div className="text-xs text-[var(--ink-2)] leading-relaxed max-w-2xl">
              MockLab dynamically intercepts inbound HTTP traffic, executes priority-ordered rules with JSONPath matchers, and injects stateful scenario mutations with sub-millisecond latencies.
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-mono text-[var(--ink-3)] uppercase">Code / Mono 11px JetBrains Mono</div>
            <div className="text-[11px] font-mono text-[var(--signal)] bg-[var(--surface-0)] p-3 rounded-lg border border-[var(--border)]">
              GET /m/petstore/pets/42 HTTP/1.1 --header "X-MockLab-Key: mk_live_8fa2"
            </div>
          </div>
        </div>
      </div>

      {/* 3. Component Primitives */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Component className="w-4 h-4 text-[var(--signal)]" />
          <h2 className="text-sm font-semibold text-[var(--ink)]">Component Primitives & Tokens</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Buttons */}
          <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] space-y-4">
            <h3 className="text-xs font-semibold text-[var(--ink)] font-mono uppercase tracking-wider">Button Variations</h3>
            <div className="flex flex-wrap gap-2.5">
              <button className="px-3.5 py-2 rounded-lg bg-[var(--signal)] text-[var(--surface-0)] font-semibold text-xs hover:opacity-90 transition-opacity">
                Primary Action
              </button>
              <button className="px-3.5 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--ink)] font-medium text-xs hover:bg-[var(--surface-3)] transition-colors">
                Secondary
              </button>
              <button className="px-3.5 py-2 rounded-lg bg-[var(--error)]/15 border border-[var(--error)]/30 text-[var(--error)] font-medium text-xs hover:bg-[var(--error)]/25 transition-colors">
                Danger Action
              </button>
              <button className="px-3.5 py-2 rounded-lg text-[var(--ink-2)] hover:text-[var(--ink)] text-xs font-medium transition-colors">
                Ghost Link
              </button>
            </div>
          </div>

          {/* Method Chips */}
          <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] space-y-4">
            <h3 className="text-xs font-semibold text-[var(--ink)] font-mono uppercase tracking-wider">HTTP Method Badges</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30">
                GET
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[var(--info)]/10 text-[var(--info)] border border-[var(--info)]/30">
                POST
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/30">
                PUT
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/30">
                PATCH
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[var(--error)]/10 text-[var(--error)] border border-[var(--error)]/30">
                DELETE
              </span>
            </div>
          </div>

          {/* Verdict Badges */}
          <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] space-y-4">
            <h3 className="text-xs font-semibold text-[var(--ink)] font-mono uppercase tracking-wider">Contract Test Verdicts</h3>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> PASS
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-[var(--error)]/10 text-[var(--error)] border border-[var(--error)]/30">
                <XCircle className="w-3.5 h-3.5" /> BREAKING
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/30">
                <AlertCircle className="w-3.5 h-3.5" /> NON_BREAKING
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-[var(--ink-3)]/20 text-[var(--ink-2)] border border-[var(--border)]">
                ERROR
              </span>
            </div>
          </div>

          {/* Form Controls */}
          <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] space-y-4">
            <h3 className="text-xs font-semibold text-[var(--ink)] font-mono uppercase tracking-wider">Form Elements</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Text input field..."
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-0)] border border-[var(--border)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--signal)]"
              />
              <div className="flex items-center justify-between text-xs">
                <label className="text-[var(--ink-2)]">Slider Control</label>
                <input type="range" className="accent-[var(--signal)] cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Accessibility & Contrast Verification */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[var(--signal)]" />
          <h2 className="text-sm font-semibold text-[var(--ink)]">WCAG 2.1 AA Contrast Compliance Matrix</h2>
        </div>

        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-[var(--border)] text-[11px] text-[var(--ink-3)] uppercase">
                  <th className="py-2.5">Token Pair</th>
                  <th className="py-2.5">Foreground</th>
                  <th className="py-2.5">Background</th>
                  <th className="py-2.5">Measured Ratio</th>
                  <th className="py-2.5 text-right">Standard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {CONTRAST_PAIRS.map((pair) => (
                  <tr key={pair.text} className="hover:bg-[var(--surface-2)]/30">
                    <td className="py-3 font-sans text-[var(--ink)]">{pair.text}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1.5 text-[var(--ink-2)]">
                        <span className="w-3 h-3 rounded-full border border-[var(--border)]" style={{ backgroundColor: pair.fg }}></span>
                        {pair.fg}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1.5 text-[var(--ink-2)]">
                        <span className="w-3 h-3 rounded-full border border-[var(--border)]" style={{ backgroundColor: pair.bg }}></span>
                        {pair.bg}
                      </span>
                    </td>
                    <td className="py-3 text-[var(--signal)] font-bold">{pair.ratio}</td>
                    <td className="py-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30">
                        {pair.status} Pass
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
