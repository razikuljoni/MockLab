"use client";

import { useState } from "react";
import {
  Receipt,
  CreditCard,
  Check,
  Zap,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Layers,
  Clock,
  Download,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface PlanTier {
  id: "FREE" | "PRO" | "TEAM";
  name: string;
  price: number;
  description: string;
  badge?: string;
  limits: {
    mockRequests: string;
    contractRuns: string;
    logRetention: string;
    projects: string;
    teamMembers: string;
  };
  features: string[];
}

const TIERS: PlanTier[] = [
  {
    id: "FREE",
    name: "Free",
    price: 0,
    description: "Ideal for individual developers and small open-source mock experimentation.",
    limits: {
      mockRequests: "10,000 / mo",
      contractRuns: "50 / mo",
      logRetention: "7 Days",
      projects: "3 Projects",
      teamMembers: "2 Members",
    },
    features: [
      "Core Mock Engine & Routing",
      "OpenAPI 3.0 / 3.1 Spec Import",
      "Interactive Playground & cURL",
      "7-Day Traffic Inspector Buffer",
      "Community GitHub Discussions",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    price: 19,
    description: "Built for agile engineering teams shipping microservices and CI contracts.",
    badge: "Most Popular",
    limits: {
      mockRequests: "250,000 / mo",
      contractRuns: "2,500 / mo",
      logRetention: "30 Days",
      projects: "20 Projects",
      teamMembers: "10 Members",
    },
    features: [
      "Everything in Free, plus:",
      "Fault Injection & Jitter Simulators",
      "Automated Contract CI Sweep & Badges",
      "Stateful Scenario Buckets & CRUD",
      "30-Day Traffic Log Retention",
      "Priority Email & Slack Support",
    ],
  },
  {
    id: "TEAM",
    name: "Team",
    price: 79,
    description: "Enterprise-grade scale with unlimited projects, dedicated SLA, and governance.",
    limits: {
      mockRequests: "1,000,000 / mo",
      contractRuns: "10,000 / mo",
      logRetention: "90 Days",
      projects: "Unlimited",
      teamMembers: "Unlimited",
    },
    features: [
      "Everything in Pro, plus:",
      "Unlimited Projects & Teammates",
      "90-Day Traffic Log Retention",
      "Custom Mock Subdomains & CNAME",
      "Enterprise SAML / SSO",
      "99.9% Uptime SLA Guarantee",
    ],
  },
];

const INVOICES = [
  {
    id: "inv_2026_03",
    date: "Mar 1, 2026",
    amount: "$0.00",
    status: "Paid",
    plan: "Free Tier",
  },
  {
    id: "inv_2026_02",
    date: "Feb 1, 2026",
    amount: "$0.00",
    status: "Paid",
    plan: "Free Tier",
  },
  {
    id: "inv_2026_01",
    date: "Jan 15, 2026",
    amount: "$0.00",
    status: "Paid",
    plan: "Free Tier",
  },
];

export default function WorkspaceBillingPage() {
  const [activePlan, setActivePlan] = useState<"FREE" | "PRO" | "TEAM">("FREE");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [upgradedAlert, setUpgradedAlert] = useState<string | null>(null);

  const handleSelectPlan = (tierId: "FREE" | "PRO" | "TEAM") => {
    setActivePlan(tierId);
    setUpgradedAlert(`Successfully switched to ${tierId} plan`);
    setTimeout(() => setUpgradedAlert(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-[var(--ink)]">Billing & Plans</h1>
            <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--signal)]/30 bg-[var(--signal-dim)] text-[var(--signal)] font-mono font-medium">
              {activePlan} Tier
            </span>
          </div>
          <p className="text-xs text-[var(--ink-2)] mt-1">
            Manage your workspace subscription tier, observe resource limits, and inspect invoices.
          </p>
        </div>

        {/* Annual / Monthly Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              billingCycle === "monthly"
                ? "bg-[var(--surface-2)] text-[var(--ink)] shadow-xs"
                : "text-[var(--ink-3)] hover:text-[var(--ink-2)]"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("annual")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              billingCycle === "annual"
                ? "bg-[var(--surface-2)] text-[var(--ink)] shadow-xs"
                : "text-[var(--ink-3)] hover:text-[var(--ink-2)]"
            }`}
          >
            <span>Annual</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-[var(--signal-dim)] text-[var(--signal)] font-mono">
              -20%
            </span>
          </button>
        </div>
      </div>

      {upgradedAlert && (
        <div className="p-3.5 rounded-xl border border-[var(--success)]/40 bg-[var(--success)]/10 text-xs text-[var(--success)] flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{upgradedAlert}</span>
        </div>
      )}

      {/* Usage Progress Cards (§6.1 / §6.9) */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--ink)]">Current Month Resource Consumption</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Mock Requests */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--ink-2)] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[var(--signal)]" />
                Mock Requests
              </span>
              <span className="font-mono text-[var(--ink)]">1,420 / 10,000</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--surface-0)] overflow-hidden">
              <div className="h-full bg-[var(--signal)] rounded-full transition-all" style={{ width: "14.2%" }}></div>
            </div>
            <div className="text-[11px] text-[var(--ink-3)] font-mono">14.2% used (8,580 remaining)</div>
          </div>

          {/* Contract Runs */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--ink-2)] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[var(--info)]" />
                Contract Runs
              </span>
              <span className="font-mono text-[var(--ink)]">18 / 50</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--surface-0)] overflow-hidden">
              <div className="h-full bg-[var(--info)] rounded-full transition-all" style={{ width: "36%" }}></div>
            </div>
            <div className="text-[11px] text-[var(--ink-3)] font-mono">36.0% used (32 remaining)</div>
          </div>

          {/* Active Projects */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--ink-2)] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[var(--warning)]" />
                Active Projects
              </span>
              <span className="font-mono text-[var(--ink)]">2 / 3</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--surface-0)] overflow-hidden">
              <div className="h-full bg-[var(--warning)] rounded-full transition-all" style={{ width: "66.7%" }}></div>
            </div>
            <div className="text-[11px] text-[var(--ink-3)] font-mono">2 of 3 projects allocated</div>
          </div>

          {/* Log Retention */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--ink-2)] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--success)]" />
                Log Retention
              </span>
              <span className="font-mono text-[var(--ink)]">7 / 7 Days</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--surface-0)] overflow-hidden">
              <div className="h-full bg-[var(--success)] rounded-full transition-all" style={{ width: "100%" }}></div>
            </div>
            <div className="text-[11px] text-[var(--ink-3)] font-mono">Upgrade to Pro for 30 days</div>
          </div>
        </div>
      </div>

      {/* Plan Cards (§6.1 / §6.9) */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-[var(--ink)]">Subscription Plans & Limits</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((tier) => {
            const isCurrent = activePlan === tier.id;
            const price = billingCycle === "annual" ? Math.round(tier.price * 0.8) : tier.price;

            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl border p-6 flex flex-col justify-between space-y-6 transition-all ${
                  isCurrent
                    ? "border-[var(--signal)] bg-[var(--surface-1)] shadow-xl shadow-[var(--signal)]/5"
                    : "border-[var(--border)] bg-[var(--surface-1)] hover:border-[var(--border-strong)]"
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-6 px-2.5 py-0.5 rounded-full bg-[var(--signal)] text-[var(--surface-0)] font-semibold text-[10px] tracking-wide uppercase">
                    {tier.badge}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-[var(--ink)]">{tier.name}</h3>
                      {isCurrent && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--signal-dim)] text-[var(--signal)] border border-[var(--signal)]/30 font-medium">
                          Active Plan
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--ink-3)] mt-1.5 leading-relaxed">{tier.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-[var(--ink)] font-mono">${price}</span>
                    <span className="text-xs text-[var(--ink-3)]">/ month</span>
                  </div>

                  {/* Tier Limits Table */}
                  <div className="space-y-2 py-3 border-y border-[var(--border)] text-xs">
                    <div className="flex justify-between py-1">
                      <span className="text-[var(--ink-3)]">Mock Requests</span>
                      <span className="font-mono text-[var(--ink)]">{tier.limits.mockRequests}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[var(--ink-3)]">Contract Runs</span>
                      <span className="font-mono text-[var(--ink)]">{tier.limits.contractRuns}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[var(--ink-3)]">Log Retention</span>
                      <span className="font-mono text-[var(--ink)]">{tier.limits.logRetention}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[var(--ink-3)]">Project Limit</span>
                      <span className="font-mono text-[var(--ink)]">{tier.limits.projects}</span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-mono text-[var(--ink-3)] uppercase tracking-wider">Features Included</div>
                    <ul className="space-y-1.5 text-xs text-[var(--ink-2)]">
                      {tier.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-[var(--signal)] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button
                  disabled={isCurrent}
                  onClick={() => handleSelectPlan(tier.id)}
                  className={`w-full py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-[var(--surface-2)] text-[var(--ink-3)] border border-[var(--border)] cursor-default"
                      : "bg-[var(--signal)] text-[var(--surface-0)] hover:opacity-90 font-semibold"
                  }`}
                >
                  {isCurrent ? "Current Plan" : `Switch to ${tier.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoices & Payment History */}
      <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[var(--signal)]" />
            <h2 className="text-sm font-semibold text-[var(--ink)]">Invoices & Statements</h2>
          </div>
          <span className="text-xs text-[var(--ink-3)] font-mono">Billed to: Visa ending in 4242</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11px] font-mono text-[var(--ink-3)] uppercase">
                <th className="py-2.5">Invoice ID</th>
                <th className="py-2.5">Date</th>
                <th className="py-2.5">Plan Tier</th>
                <th className="py-2.5">Amount</th>
                <th className="py-2.5">Status</th>
                <th className="py-2.5 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] font-mono">
              {INVOICES.map((inv) => (
                <tr key={inv.id} className="hover:bg-[var(--surface-2)]/40 transition-colors">
                  <td className="py-3 text-[var(--ink)]">{inv.id}</td>
                  <td className="py-3 text-[var(--ink-2)]">{inv.date}</td>
                  <td className="py-3 text-[var(--ink-2)] font-sans">{inv.plan}</td>
                  <td className="py-3 text-[var(--ink)] font-semibold">{inv.amount}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 text-[var(--success)] text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]"></span>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => alert(`Downloading invoice ${inv.id}`)}
                      className="p-1 rounded text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="text-[11px]">PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
