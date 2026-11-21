import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="py-12 md:py-20 px-6 max-w-4xl mx-auto space-y-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-2)] hover:text-[var(--ink)] font-mono transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Home
      </Link>

      <div className="space-y-3 border-b border-[var(--border)] pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--signal)] uppercase">
          <Shield className="w-4 h-4" />
          <span>Legal</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--ink)]">
          Terms of Service
        </h1>
        <p className="text-xs text-[var(--ink-2)] font-mono">
          Last Updated: November 2026 · Developer Preview Edition
        </p>
      </div>

      <div className="space-y-8 text-sm text-[var(--ink-2)] leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[var(--ink)]">1. Introduction &amp; Acceptance</h2>
          <p>
            Welcome to MockLab. By accessing or using our developer platform, API virtualization services,
            or contract test suite at mocklab-theta.vercel.app or related services, you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use the service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[var(--ink)]">2. Developer Preview &amp; Quotas</h2>
          <p>
            MockLab is provided as an active developer preview. Free community tier accounts receive 5,000 mock
            requests per month, 100 contract verification runs per month, 7 days of request log retention (up to
            2,500 rows), and up to 2 active projects. Commercial pricing for higher throughput tiers is TBD and
            will be announced prior to general availability.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[var(--ink)]">3. Acceptable Use Policy</h2>
          <p>You agree not to use MockLab to:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs">
            <li>Generate or route abusive, fraudulent, or illegal network traffic.</li>
            <li>Conduct denial-of-service (DoS) or distributed denial-of-service (DDoS) attacks against third-party providers.</li>
            <li>Store or transmit real, unencrypted personally identifiable information (PII) or secrets in mock definitions.</li>
            <li>Attempt to probe, scan, or breach MockLab infrastructure or other users&apos; isolated tenant workspaces.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[var(--ink)]">4. Intellectual Property</h2>
          <p>
            You retain all rights and ownership of your API specifications, mock rules, and test configurations.
            MockLab does not claim ownership over any schemas or data imported into your projects.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[var(--ink)]">5. Disclaimer of Warranties</h2>
          <p>
            During developer preview, MockLab is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis, without
            warranties of any kind, whether express or implied. MockLab disclaims all warranties of merchantability,
            fitness for a particular purpose, and non-infringement.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[var(--ink)]">6. Contact Information</h2>
          <p>
            For questions regarding these Terms, contact us via our public GitHub repository discussions or at
            razikuljoni@gmail.com.
          </p>
        </section>
      </div>
    </div>
  );
}
