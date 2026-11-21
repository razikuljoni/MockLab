import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

export default function PrivacyPage() {
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
          <Lock className="w-4 h-4" />
          <span>Privacy</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--ink)]">
          Privacy Policy
        </h1>
        <p className="text-xs text-[var(--ink-2)] font-mono">
          Last Updated: November 2026 · Developer Preview Edition
        </p>
      </div>

      <div className="space-y-8 text-sm text-[var(--ink-2)] leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[var(--ink)]">1. Information We Collect</h2>
          <p>We collect only the information strictly necessary to provide the MockLab service:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs">
            <li><strong>Account Details:</strong> Email address, hashed password, or GitHub OAuth user ID for authentication.</li>
            <li><strong>API Metadata:</strong> Project names, slugs, imported OpenAPI specifications, and mock routing rules.</li>
            <li><strong>Traffic Inspector Logs:</strong> Request paths, headers, latency metrics, and payload sizes. Request logs are automatically purged after 7 days on Free accounts.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[var(--ink)]">2. How We Use Information</h2>
          <p>
            Information collected is used solely to route incoming mock requests, evaluate contract test expectations,
            generate traffic inspector dashboards, and maintain system stability. We never sell, rent, or monetize
            your schema definitions or personal data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[var(--ink)]">3. Data Retention &amp; Deletion</h2>
          <p>
            Request logs on the Free plan are automatically deleted after 7 days or when reaching the 2,500-row cap.
            Users may delete projects, expectations, or their entire workspace at any time directly through the
            dashboard or API.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[var(--ink)]">4. Security</h2>
          <p>
            Real provider authentication credentials and secrets are encrypted with AES-256-GCM before persistence.
            All communications are encrypted in transit via TLS 1.3.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[var(--ink)]">5. Inquiries &amp; Data Rights</h2>
          <p>
            To request data export or account removal, file an issue on our GitHub repository or contact the project maintainer at
            razikuljoni@gmail.com.
          </p>
        </section>
      </div>
    </div>
  );
}
