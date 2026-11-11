"use client";

import Link from "next/link";
import { Check, HelpCircle } from "lucide-react";
import { useState } from "react";

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "What counts as a mock request?",
      a: "Every inbound HTTP request to your hosted mock URL (e.g. https://<slug>.mocklab.dev/...) counts as one mock request. Health checks and requests that return 404 count toward your monthly quota.",
    },
    {
      q: "How does contract testing work in CI?",
      a: "Our contract runner executes expectations against both your mock URL and your real provider URL. If the real provider introduces breaking changes (like removing a field or changing a type), the GitHub Action exits with a non-zero code.",
    },
    {
      q: "Can I use MockLab for free without a credit card?",
      a: "Yes. The Free Developer tier is free forever and includes 5,000 mock requests/month, 100 contract runs, 14-day request logs, and 2 API keys. No credit card required.",
    },
    {
      q: "What is stateful bucket mocking?",
      a: "When you send a POST request, MockLab stores the created resource in a Redis bucket. Subsequent GET, PUT, and DELETE requests interact with that stored resource, just like a real database. You can reset state at any time.",
    },
    {
      q: "When will Pro & Team pricing be finalized?",
      a: "MockLab is currently in public beta. All early users enjoy generous free-tier quotas. Pro and Team pricing and self-serve checkout will be announced before general availability.",
    },
  ];

  return (
    <div className="py-12 md:py-20 px-6 max-w-6xl mx-auto space-y-20">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--ink)]">
          Simple, Predictable Plans
        </h1>
        <p className="text-base text-[var(--ink-2)]">
          Generous free limits for individual developers. High-throughput and team workspaces for organizations.
        </p>
      </div>

      {/* 3 Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* FREE TIER */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-3)] font-mono">
                Community
              </span>
              <h2 className="text-2xl font-bold text-[var(--ink)]">Free</h2>
              <p className="text-xs text-[var(--ink-2)]">
                Essential API mocking &amp; contract checks for solo developers.
              </p>
            </div>

            <div className="pt-2">
              <span className="text-4xl font-extrabold text-[var(--ink)]">$0</span>
              <span className="text-xs text-[var(--ink-3)] ml-1">/ forever</span>
            </div>

            <ul className="space-y-2.5 text-xs text-[var(--ink-2)] border-t border-[var(--border)] pt-4">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--signal)] shrink-0" />
                <span><strong>5,000</strong> mock requests / mo</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--signal)] shrink-0" />
                <span><strong>100</strong> contract test runs / mo</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--signal)] shrink-0" />
                <span><strong>14-day</strong> logs (2,500 rows max)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--signal)] shrink-0" />
                <span><strong>2</strong> active projects</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--signal)] shrink-0" />
                <span><strong>2</strong> API management keys</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--signal)] shrink-0" />
                <span>100 req/min/key rate limit</span>
              </li>
            </ul>
          </div>

          <Link
            href="/signup"
            className="w-full py-2.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink)] font-semibold text-xs text-center hover:bg-[var(--surface-0)] transition-colors block"
          >
            Start Free
          </Link>
        </div>

        {/* PRO TIER (Featured) */}
        <div className="rounded-xl border-2 border-[var(--signal)] bg-[var(--surface-1)] p-6 space-y-6 flex flex-col justify-between relative shadow-xl">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[var(--signal)] text-[var(--surface-0)] text-[10px] font-bold uppercase tracking-wider">
            Most Popular
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--signal)] font-mono">
                Professional
              </span>
              <h2 className="text-2xl font-bold text-[var(--ink)]">Pro</h2>
              <p className="text-xs text-[var(--ink-2)]">
                Continuous contract verification and unlimited projects.
              </p>
            </div>

            <div className="pt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[var(--ink)]">TBD</span>
              <span className="text-xs text-[var(--signal)] font-medium">Coming Soon in GA</span>
            </div>

            <ul className="space-y-2.5 text-xs text-[var(--ink-2)] border-t border-[var(--border)] pt-4">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--signal)] shrink-0" />
                <span><strong>100,000</strong> mock requests / mo</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--signal)] shrink-0" />
                <span><strong>5,000</strong> contract test runs / mo</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--signal)] shrink-0" />
                <span><strong>60-day</strong> log retention</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--signal)] shrink-0" />
                <span><strong>Unlimited</strong> projects</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--signal)] shrink-0" />
                <span>Hourly scheduled contract sweeps</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--signal)] shrink-0" />
                <span><strong>10</strong> API management keys</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--signal)] shrink-0" />
                <span>1,000 req/min/key rate limit</span>
              </li>
            </ul>
          </div>

          <Link
            href="/signup"
            className="w-full py-2.5 rounded-md bg-[var(--signal)] text-[var(--surface-0)] font-semibold text-xs text-center hover:opacity-90 transition-opacity block"
          >
            Join Pro Waitlist
          </Link>
        </div>

        {/* TEAM TIER */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-3)] font-mono">
                Organization
              </span>
              <h2 className="text-2xl font-bold text-[var(--ink)]">Team</h2>
              <p className="text-xs text-[var(--ink-2)]">
                Multi-seat workspaces, RBAC roles, and high concurrency.
              </p>
            </div>

            <div className="pt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[var(--ink)]">TBD</span>
              <span className="text-xs text-[var(--ink-3)]">Custom Scale</span>
            </div>

            <ul className="space-y-2.5 text-xs text-[var(--ink-2)] border-t border-[var(--border)] pt-4">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--signal)] shrink-0" />
                <span><strong>1,000,000</strong> mock requests / mo</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--signal)] shrink-0" />
                <span><strong>50,000</strong> contract runs / mo</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--signal)] shrink-0" />
                <span><strong>90-day</strong> log retention</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--signal)] shrink-0" />
                <span>Team roles: Owner, Admin, Editor, Viewer</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--signal)] shrink-0" />
                <span><strong>50</strong> API keys + audit trail</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[var(--signal)] shrink-0" />
                <span>5,000 req/min/key rate limit</span>
              </li>
            </ul>
          </div>

          <Link
            href="/signup"
            className="w-full py-2.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink)] font-semibold text-xs text-center hover:bg-[var(--surface-0)] transition-colors block"
          >
            Contact Team Sales
          </Link>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-[var(--ink)] text-center">
          Compare Plan Features
        </h2>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-[var(--surface-2)] border-b border-[var(--border)] text-[var(--ink-3)] uppercase tracking-wider font-mono">
              <tr>
                <th className="p-4">Feature</th>
                <th className="p-4">Free</th>
                <th className="p-4 text-[var(--signal)]">Pro</th>
                <th className="p-4">Team</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--ink)]">
              <tr>
                <td className="p-4 font-medium">Monthly Mock Requests</td>
                <td className="p-4">5,000</td>
                <td className="p-4 font-semibold text-[var(--signal)]">100,000</td>
                <td className="p-4">1,000,000</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Monthly Contract Runs</td>
                <td className="p-4">100</td>
                <td className="p-4 font-semibold text-[var(--signal)]">5,000</td>
                <td className="p-4">50,000</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Log Retention</td>
                <td className="p-4">14 days (2,500 rows)</td>
                <td className="p-4 font-semibold text-[var(--signal)]">60 days</td>
                <td className="p-4">90 days</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">OpenAPI 3.0 &amp; 3.1</td>
                <td className="p-4 text-[var(--success)]">Included</td>
                <td className="p-4 text-[var(--success)]">Included</td>
                <td className="p-4 text-[var(--success)]">Included</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Stateful Redis Buckets</td>
                <td className="p-4 text-[var(--success)]">Included</td>
                <td className="p-4 text-[var(--success)]">Included</td>
                <td className="p-4 text-[var(--success)]">Included</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Fault &amp; Latency Injection</td>
                <td className="p-4 text-[var(--success)]">Included</td>
                <td className="p-4 text-[var(--success)]">Included</td>
                <td className="p-4 text-[var(--success)]">Included</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">GitHub Actions CI Snippet</td>
                <td className="p-4 text-[var(--success)]">Included</td>
                <td className="p-4 text-[var(--success)]">Included</td>
                <td className="p-4 text-[var(--success)]">Included</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Scheduled Sweeps</td>
                <td className="p-4 text-[var(--ink-3)]">Manual only</td>
                <td className="p-4 font-semibold text-[var(--signal)]">Hourly</td>
                <td className="p-4">Continuous</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Workspace RBAC Roles</td>
                <td className="p-4 text-[var(--ink-3)]">Single owner</td>
                <td className="p-4 text-[var(--ink-3)]">Single owner</td>
                <td className="p-4 text-[var(--success)]">4 Roles (Owner/Admin/Editor/Viewer)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-6 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-[var(--ink)] text-center">
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-4 font-medium text-xs text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <span>{faq.q}</span>
                <span className="text-[var(--signal)] font-mono font-bold">
                  {openFaq === idx ? "−" : "+"}
                </span>
              </button>
              {openFaq === idx && (
                <div className="p-4 pt-0 text-xs text-[var(--ink-2)] leading-relaxed border-t border-[var(--border)] bg-[var(--surface-0)]">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
