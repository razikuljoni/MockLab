import Link from "next/link";
import { Check } from "lucide-react";
import { PLAN_LIMITS } from "@mocklab/shared";

export default function PricingPage() {
  return (
    <div className="py-16 px-8 max-w-5xl mx-auto space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">Simple, Transparent Pricing</h1>
        <p className="text-sm text-[var(--ink-2)]">Start free. Upgrade as your team and API test suites expand.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* FREE */}
        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-[var(--ink)]">Free</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono text-[var(--ink)]">$0</span>
              <span className="text-xs text-[var(--ink-3)]">/ month</span>
            </div>
            <p className="text-xs text-[var(--ink-2)]">For solo developers building and mocking prototypes.</p>
            <ul className="space-y-2 pt-2 text-xs text-[var(--ink)]">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                <span>{PLAN_LIMITS.FREE.maxProjects} Projects</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                <span>{PLAN_LIMITS.FREE.mockRequestsPerMonth.toLocaleString()} mock requests / mo</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                <span>{PLAN_LIMITS.FREE.contractRunsPerMonth} contract runs / mo</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                <span>{PLAN_LIMITS.FREE.logRetentionDays}-day request log retention</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                <span>{PLAN_LIMITS.FREE.apiKeys} API Keys</span>
              </li>
            </ul>
          </div>
          <Link
            href="/signup"
            className="mt-6 w-full py-2 rounded-md border border-[var(--border)] text-center text-xs font-medium text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
          >
            Get Started Free
          </Link>
        </div>

        {/* PRO */}
        <div className="p-6 rounded-xl border border-[var(--signal)] bg-[var(--surface-1)] flex flex-col justify-between relative shadow-lg">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[var(--signal)] text-[var(--surface-0)] font-semibold text-[10px] tracking-wide uppercase">
            Popular
          </span>
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-[var(--ink)]">Pro</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono text-[var(--ink)]">$19</span>
              <span className="text-xs text-[var(--ink-3)]">/ user / mo</span>
            </div>
            <p className="text-xs text-[var(--ink-2)]">For active developers and fast-moving teams.</p>
            <ul className="space-y-2 pt-2 text-xs text-[var(--ink)]">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                <span>Unlimited Projects</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                <span>{PLAN_LIMITS.PRO.mockRequestsPerMonth.toLocaleString()} mock requests / mo</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                <span>{PLAN_LIMITS.PRO.contractRunsPerMonth.toLocaleString()} contract runs / mo</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                <span>{PLAN_LIMITS.PRO.logRetentionDays}-day request log retention</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                <span>{PLAN_LIMITS.PRO.apiKeys} API Keys (1,000 req/min)</span>
              </li>
            </ul>
          </div>
          <Link
            href="/signup?plan=pro"
            className="mt-6 w-full py-2 rounded-md bg-[var(--signal)] text-[var(--surface-0)] text-center text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Upgrade to Pro
          </Link>
        </div>

        {/* TEAM */}
        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-[var(--ink)]">Team</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono text-[var(--ink)]">$49</span>
              <span className="text-xs text-[var(--ink-3)]">/ user / mo</span>
            </div>
            <p className="text-xs text-[var(--ink-2)]">For engineering organizations demanding CI guarantees.</p>
            <ul className="space-y-2 pt-2 text-xs text-[var(--ink)]">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                <span>Shared Workspaces &amp; RBAC</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                <span>{PLAN_LIMITS.TEAM.mockRequestsPerMonth.toLocaleString()} mock requests / mo</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                <span>{PLAN_LIMITS.TEAM.contractRunsPerMonth.toLocaleString()} contract runs / mo</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                <span>{PLAN_LIMITS.TEAM.logRetentionDays}-day request log retention</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--signal)]" />
                <span>{PLAN_LIMITS.TEAM.apiKeys} API Keys</span>
              </li>
            </ul>
          </div>
          <Link
            href="/signup?plan=team"
            className="mt-6 w-full py-2 rounded-md border border-[var(--border)] text-center text-xs font-medium text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
          >
            Start Team Trial
          </Link>
        </div>
      </div>
    </div>
  );
}
